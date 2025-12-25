import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Upload, Download, AlertCircle, CheckCircle, Eye } from 'lucide-react';

export default function BulkPaymentImport({ open, onOpenChange, onImportComplete }) {
  const [file, setFile] = useState(null);
  const [previewData, setPreviewData] = useState(null);
  const [validationResults, setValidationResults] = useState(null);
  const [importing, setImporting] = useState(false);
  const [importResults, setImportResults] = useState(null);

  const handleFileChange = async (e) => {
    const selectedFile = e.target.files[0];
    if (!selectedFile) return;

    setFile(selectedFile);
    setPreviewData(null);
    setValidationResults(null);
    setImportResults(null);

    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file: selectedFile });
      
      const result = await base44.integrations.Core.ExtractDataFromUploadedFile({
        file_url: file_url,
        json_schema: {
          type: "object",
          properties: {
            receipt_number: { type: "string" },
            invoice_number: { type: "string" },
            student_name: { type: "string" },
            payment_date: { type: "string" },
            amount: { type: "number" },
            payment_method: { type: "string" },
            transaction_reference: { type: "string" },
            notes: { type: "string" }
          }
        }
      });

      if (result.status === 'success') {
        const data = Array.isArray(result.output) ? result.output : [result.output];
        setPreviewData(data);
        await validateData(data);
      } else {
        alert('Error extracting data: ' + result.details);
      }
    } catch (error) {
      alert('Error processing file: ' + error.message);
    }
  };

  const validateData = async (data) => {
    const invoices = await base44.entities.FeeInvoice.list();
    
    const results = data.map((row, index) => {
      const errors = [];

      if (!row.receipt_number) errors.push('Receipt number is required');
      if (!row.invoice_number) errors.push('Invoice number is required');
      if (!row.amount || isNaN(Number(row.amount))) errors.push('Valid amount is required');
      
      const invoice = invoices.find(inv => inv.invoice_number === row.invoice_number);
      if (!invoice) {
        errors.push('Invoice not found');
      } else {
        row.invoice_id = invoice.id;
        row.student_id = invoice.student_id;
      }

      return {
        rowIndex: index,
        data: row,
        errors: errors,
        valid: errors.length === 0
      };
    });

    setValidationResults(results);
  };

  const handleImport = async () => {
    if (!validationResults) return;

    const validRows = validationResults.filter(r => r.valid).map(r => r.data);
    if (validRows.length === 0) {
      alert('No valid rows to import');
      return;
    }

    setImporting(true);
    try {
      const payments = validRows.map(row => ({
        receipt_number: row.receipt_number,
        invoice_id: row.invoice_id,
        student_id: row.student_id,
        student_name: row.student_name,
        payment_date: row.payment_date || new Date().toISOString(),
        amount: parseFloat(row.amount),
        payment_method: row.payment_method || 'Bank Transfer',
        transaction_reference: row.transaction_reference || '',
        status: 'Completed',
        notes: row.notes || 'Bulk imported payment'
      }));

      const created = await base44.entities.Payment.bulkCreate(payments);
      
      for (const payment of created) {
        const invoice = await base44.entities.FeeInvoice.list();
        const inv = invoice.find(i => i.id === payment.invoice_id);
        if (inv) {
          const newAmountPaid = inv.amount_paid + payment.amount;
          const newBalance = inv.total_amount - newAmountPaid;
          await base44.entities.FeeInvoice.update(inv.id, {
            amount_paid: newAmountPaid,
            balance: newBalance,
            status: newBalance <= 0 ? 'Paid' : 'Partially Paid'
          });
        }
      }

      setImportResults({
        success: created.length,
        failed: validationResults.length - created.length,
        total: validationResults.length
      });
      onImportComplete?.();
    } catch (error) {
      alert('Error importing payments: ' + error.message);
    } finally {
      setImporting(false);
    }
  };

  const downloadTemplate = () => {
    const csvContent = [
      'receipt_number,invoice_number,student_name,payment_date,amount,payment_method,transaction_reference,notes',
      'RCP-001,INV-001,John Doe,2025-01-15,1000.00,Bank Transfer,TXN123,Sample payment'
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'payment_import_template.csv';
    a.click();
  };

  const resetDialog = () => {
    setFile(null);
    setPreviewData(null);
    setValidationResults(null);
    setImportResults(null);
  };

  const validCount = validationResults?.filter(r => r.valid).length || 0;
  const errorCount = validationResults?.filter(r => !r.valid).length || 0;

  return (
    <Dialog open={open} onOpenChange={(isOpen) => {
      onOpenChange(isOpen);
      if (!isOpen) resetDialog();
    }}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto bg-white">
        <DialogHeader>
          <DialogTitle className="text-gray-900">Bulk Import Payments</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-gray-900">Download Template</h3>
                  <p className="text-sm text-gray-600">Get a CSV template with the correct format</p>
                </div>
                <Button onClick={downloadTemplate} variant="outline">
                  <Download className="w-4 h-4 mr-2" />
                  Download
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="space-y-3">
                <h3 className="font-semibold text-gray-900">Upload File</h3>
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                  <Upload className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                  <input
                    type="file"
                    accept=".csv,.xlsx"
                    onChange={handleFileChange}
                    className="hidden"
                    id="payment-file-upload"
                  />
                  <label htmlFor="payment-file-upload" className="cursor-pointer">
                    <Button variant="outline" onClick={() => document.getElementById('payment-file-upload').click()}>
                      Choose File
                    </Button>
                  </label>
                  {file && <p className="text-sm text-gray-600 mt-2">{file.name}</p>}
                </div>
              </div>
            </CardContent>
          </Card>

          {validationResults && (
            <Card>
              <CardContent className="p-4">
                <h3 className="font-semibold text-gray-900 mb-3">Validation Results</h3>
                <div className="flex gap-4">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-5 h-5 text-green-600" />
                    <span className="text-sm">
                      <span className="font-semibold text-green-600">{validCount}</span> Valid Rows
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <AlertCircle className="w-5 h-5 text-red-600" />
                    <span className="text-sm">
                      <span className="font-semibold text-red-600">{errorCount}</span> Errors
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {previewData && validationResults && (
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-3">
                  <Eye className="w-5 h-5 text-gray-600" />
                  <h3 className="font-semibold text-gray-900">Data Preview</h3>
                </div>
                <div className="max-h-96 overflow-auto border rounded">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50 sticky top-0">
                      <tr>
                        <th className="px-3 py-2 text-left">#</th>
                        <th className="px-3 py-2 text-left">Receipt #</th>
                        <th className="px-3 py-2 text-left">Invoice #</th>
                        <th className="px-3 py-2 text-left">Student</th>
                        <th className="px-3 py-2 text-left">Amount</th>
                        <th className="px-3 py-2 text-left">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {validationResults.map((result, idx) => (
                        <tr key={idx} className={!result.valid ? 'bg-red-50' : ''}>
                          <td className="px-3 py-2 border-t">{idx + 1}</td>
                          <td className="px-3 py-2 border-t">{result.data.receipt_number || '-'}</td>
                          <td className="px-3 py-2 border-t">{result.data.invoice_number || '-'}</td>
                          <td className="px-3 py-2 border-t">{result.data.student_name || '-'}</td>
                          <td className="px-3 py-2 border-t">${result.data.amount || 0}</td>
                          <td className="px-3 py-2 border-t">
                            {result.valid ? (
                              <Badge className="bg-green-100 text-green-800">Valid</Badge>
                            ) : (
                              <div className="space-y-1">
                                <Badge className="bg-red-100 text-red-800">Error</Badge>
                                {result.errors.map((err, i) => (
                                  <p key={i} className="text-xs text-red-600">{err}</p>
                                ))}
                              </div>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          )}

          {importResults && (
            <Card>
              <CardContent className="p-4">
                <h3 className="font-semibold text-gray-900 mb-3">Import Complete</h3>
                <div className="space-y-2 text-sm">
                  <p><span className="font-semibold text-green-600">{importResults.success}</span> payments imported successfully</p>
                  {importResults.failed > 0 && (
                    <p><span className="font-semibold text-red-600">{importResults.failed}</span> payments failed</p>
                  )}
                  <p>Total processed: {importResults.total}</p>
                </div>
              </CardContent>
            </Card>
          )}

          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              {importResults ? 'Close' : 'Cancel'}
            </Button>
            {validationResults && !importResults && (
              <Button 
                onClick={handleImport} 
                disabled={validCount === 0 || importing}
                className="bg-blue-600 hover:bg-blue-700"
              >
                {importing ? 'Importing...' : `Import ${validCount} Valid Payments`}
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}