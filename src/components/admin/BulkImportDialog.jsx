import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Upload, Download, AlertCircle, CheckCircle, Eye } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

export default function BulkImportDialog({ 
  open, 
  onOpenChange, 
  entityName, 
  entitySchema, 
  onImportComplete,
  templateData 
}) {
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
        json_schema: entitySchema
      });

      if (result.status === 'success') {
        const data = Array.isArray(result.output) ? result.output : [result.output];
        setPreviewData(data);
        validateData(data);
      } else {
        alert('Error extracting data: ' + result.details);
      }
    } catch (error) {
      alert('Error processing file: ' + error.message);
    }
  };

  const validateData = (data) => {
    const results = data.map((row, index) => {
      const errors = [];
      const schema = entitySchema;

      Object.keys(schema.properties).forEach(field => {
        const fieldSchema = schema.properties[field];
        const value = row[field];

        if (schema.required?.includes(field) && !value) {
          errors.push(`${field} is required`);
        }

        if (fieldSchema.type === 'number' && value && isNaN(Number(value))) {
          errors.push(`${field} must be a number`);
        }

        if (fieldSchema.format === 'email' && value && !value.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) {
          errors.push(`${field} must be a valid email`);
        }
      });

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
    toast.info('Import started. This may take a moment...');
    
    try {
      const created = await base44.entities[entityName].bulkCreate(validRows);
      setImportResults({
        success: created.length,
        failed: validationResults.length - created.length,
        total: validationResults.length
      });
      toast.success(`Successfully imported ${created.length} of ${validationResults.length} records`);
      onImportComplete?.();
    } catch (error) {
      const errorMsg = error.message || 'Unknown error occurred';
      toast.error(`Import failed: ${errorMsg}`);
      setImportResults({
        success: 0,
        failed: validationResults.length,
        total: validationResults.length,
        error: errorMsg
      });
    } finally {
      setImporting(false);
    }
  };

  const downloadTemplate = () => {
    const headers = Object.keys(entitySchema.properties);
    const csvContent = [
      headers.join(','),
      ...(templateData || [{}]).map(row => 
        headers.map(h => row[h] || '').join(',')
      )
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${entityName}_template.csv`;
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
          <DialogTitle className="text-gray-900">Bulk Import {entityName}</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Download Template */}
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

          {/* Upload File */}
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
                    id="file-upload"
                  />
                  <label htmlFor="file-upload" className="cursor-pointer">
                    <Button variant="outline" onClick={() => document.getElementById('file-upload').click()}>
                      Choose File
                    </Button>
                  </label>
                  {file && <p className="text-sm text-gray-600 mt-2">{file.name}</p>}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Validation Summary */}
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

          {/* Data Preview */}
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
                        {Object.keys(entitySchema.properties).map(key => (
                          <th key={key} className="px-3 py-2 text-left">{key}</th>
                        ))}
                        <th className="px-3 py-2 text-left">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {validationResults.map((result, idx) => (
                        <tr key={idx} className={!result.valid ? 'bg-red-50' : ''}>
                          <td className="px-3 py-2 border-t">{idx + 1}</td>
                          {Object.keys(entitySchema.properties).map(key => (
                            <td key={key} className="px-3 py-2 border-t">
                              {result.data[key] || '-'}
                            </td>
                          ))}
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

          {/* Import Results */}
          {importResults && (
            <Card className={importResults.error ? 'border-red-200' : 'border-green-200'}>
              <CardContent className="p-4">
                <h3 className="font-semibold text-gray-900 mb-3">Import Complete</h3>
                <div className="space-y-2 text-sm">
                  <p><span className="font-semibold text-green-600">{importResults.success}</span> records imported successfully</p>
                  {importResults.failed > 0 && (
                    <p><span className="font-semibold text-red-600">{importResults.failed}</span> records failed</p>
                  )}
                  <p>Total processed: {importResults.total}</p>
                  {importResults.error && (
                    <div className="mt-3 p-3 bg-red-50 rounded-lg">
                      <p className="font-semibold text-red-800 mb-1">Error Details:</p>
                      <p className="text-red-700">{importResults.error}</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Actions */}
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
                {importing ? 'Importing...' : `Import ${validCount} Valid Rows`}
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}