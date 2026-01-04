import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowLeft, Download, Printer, DollarSign, Plus } from 'lucide-react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '../utils';
import { format } from 'date-fns';
import { toast } from 'sonner';
import { useCurrency } from '../components/CurrencyProvider';

export default function InvoiceDetail() {
  const urlParams = new URLSearchParams(window.location.search);
  const invoiceId = urlParams.get('id');
  const queryClient = useQueryClient();
  const [paymentDialogOpen, setPaymentDialogOpen] = useState(false);
  const [paymentData, setPaymentData] = useState({
    amount: '',
    payment_method: 'Cash',
    transaction_reference: '',
    paid_by: '',
  });

  const { formatAmount } = useCurrency();

  const { data: invoice, isLoading } = useQuery({
    queryKey: ['invoice', invoiceId],
    queryFn: async () => {
      const invoices = await base44.entities.FeeInvoice.filter({ id: invoiceId });
      return invoices[0];
    },
    enabled: !!invoiceId,
  });

  const { data: payments = [] } = useQuery({
    queryKey: ['payments', invoiceId],
    queryFn: async () => {
      const all = await base44.entities.Payment.list();
      return all.filter(p => p.invoice_id === invoiceId);
    },
    enabled: !!invoiceId,
  });

  const { data: student } = useQuery({
    queryKey: ['student', invoice?.student_id],
    queryFn: async () => {
      if (!invoice?.student_id) return null;
      const students = await base44.entities.Student.filter({ id: invoice.student_id });
      return students[0];
    },
    enabled: !!invoice?.student_id,
  });

  const recordPaymentMutation = useMutation({
    mutationFn: async (data) => {
      const receiptNumber = `RCP-${Date.now()}`;
      await base44.entities.Payment.create({
        receipt_number: receiptNumber,
        invoice_id: invoiceId,
        student_id: invoice.student_id,
        student_name: invoice.student_name,
        payment_date: new Date().toISOString(),
        amount: parseFloat(data.amount),
        payment_method: data.payment_method,
        transaction_reference: data.transaction_reference,
        paid_by: data.paid_by,
        status: 'Completed',
      });

      const newAmountPaid = (invoice.amount_paid || 0) + parseFloat(data.amount);
      const newBalance = invoice.total_amount - newAmountPaid;
      const newStatus = newBalance <= 0 ? 'Paid' : newAmountPaid > 0 ? 'Partially Paid' : 'Pending';

      await base44.entities.FeeInvoice.update(invoiceId, {
        amount_paid: newAmountPaid,
        balance: newBalance,
        status: newStatus,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invoice'] });
      queryClient.invalidateQueries({ queryKey: ['payments'] });
      setPaymentDialogOpen(false);
      setPaymentData({ amount: '', payment_method: 'Cash', transaction_reference: '', paid_by: '' });
      toast.success('Payment recorded successfully');
    },
  });

  const statusColors = {
    Pending: 'bg-yellow-100 text-yellow-800',
    'Partially Paid': 'bg-blue-100 text-blue-800',
    Paid: 'bg-green-100 text-green-800',
    Overdue: 'bg-red-100 text-red-800',
  };

  if (isLoading) {
    return (
      <div className="text-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
      </div>
    );
  }

  if (!invoice) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-600">Invoice not found</p>
        <Link to={createPageUrl('FeesManagement')}>
          <Button className="mt-4">Back to Fees</Button>
        </Link>
      </div>
    );
  }

  const feeItems = invoice.fee_items ? JSON.parse(invoice.fee_items) : [];

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between">
        <Link to={createPageUrl('FeesManagement')}>
          <Button variant="outline">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
        </Link>
        <div className="flex gap-2">
          <Button variant="outline">
            <Printer className="w-4 h-4 mr-2" />
            Print
          </Button>
          <Button variant="outline">
            <Download className="w-4 h-4 mr-2" />
            Download
          </Button>
          {invoice.status !== 'Paid' && (
            <Button onClick={() => setPaymentDialogOpen(true)} className="bg-green-600 hover:bg-green-700">
              <Plus className="w-4 h-4 mr-2" />
              Record Payment
            </Button>
          )}
        </div>
      </div>

      <Card className="bg-white shadow-lg">
        <CardHeader className="border-b">
          <div className="flex justify-between items-start">
            <div>
              <CardTitle className="text-2xl">Invoice #{invoice.invoice_number}</CardTitle>
              <p className="text-gray-500 mt-1">
                Created: {invoice.invoice_date ? format(new Date(invoice.invoice_date), 'MMMM d, yyyy') : 'N/A'}
              </p>
            </div>
            <Badge className={statusColors[invoice.status]}>{invoice.status}</Badge>
          </div>
        </CardHeader>
        <CardContent className="p-6">
          <div className="grid grid-cols-2 gap-8 mb-8">
            <div>
              <h3 className="font-semibold text-gray-900 mb-2">Bill To</h3>
              <p className="text-gray-700">{invoice.student_name}</p>
              <p className="text-gray-500 text-sm">{student?.student_id_number}</p>
              <p className="text-gray-500 text-sm">{student?.grade_level}</p>
            </div>
            <div className="text-right">
              <h3 className="font-semibold text-gray-900 mb-2">Due Date</h3>
              <p className="text-gray-700">
                {invoice.due_date ? format(new Date(invoice.due_date), 'MMMM d, yyyy') : 'N/A'}
              </p>
            </div>
          </div>

          <table className="w-full mb-8">
            <thead>
              <tr className="border-b bg-gray-50">
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Description</th>
                <th className="px-4 py-3 text-right text-sm font-semibold text-gray-700">Amount</th>
              </tr>
            </thead>
            <tbody>
              {feeItems.length > 0 ? feeItems.map((item, idx) => (
                <tr key={idx} className="border-b">
                  <td className="px-4 py-3 text-gray-700">{item.name}</td>
                  <td className="px-4 py-3 text-right text-gray-700">{formatAmount(item.amount)}</td>
                </tr>
              )) : (
                <tr className="border-b">
                  <td className="px-4 py-3 text-gray-700">Tuition Fee</td>
                  <td className="px-4 py-3 text-right text-gray-700">{formatAmount(invoice.total_amount)}</td>
                </tr>
              )}
            </tbody>
          </table>

          <div className="flex justify-end">
            <div className="w-64 space-y-2">
              <div className="flex justify-between text-gray-600">
                <span>Subtotal</span>
                <span>{formatAmount(invoice.subtotal || invoice.total_amount)}</span>
              </div>
              {invoice.discount_amount > 0 && (
                <div className="flex justify-between text-green-600">
                  <span>Discount</span>
                  <span>-{formatAmount(invoice.discount_amount)}</span>
                </div>
              )}
              {invoice.penalty_amount > 0 && (
                <div className="flex justify-between text-red-600">
                  <span>Late Penalty</span>
                  <span>+{formatAmount(invoice.penalty_amount)}</span>
                </div>
              )}
              <div className="flex justify-between font-bold text-lg border-t pt-2">
                <span>Total</span>
                <span>{formatAmount(invoice.total_amount)}</span>
              </div>
              <div className="flex justify-between text-green-600">
                <span>Paid</span>
                <span>{formatAmount(invoice.amount_paid || 0)}</span>
              </div>
              <div className="flex justify-between font-bold text-orange-600 border-t pt-2">
                <span>Balance Due</span>
                <span>{formatAmount(invoice.balance || (invoice.total_amount - (invoice.amount_paid || 0)))}</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {payments.length > 0 && (
        <Card className="bg-white shadow-md">
          <CardHeader>
            <CardTitle>Payment History</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {payments.map((payment) => (
                <div key={payment.id} className="flex justify-between items-center p-4 bg-gray-50 rounded-lg">
                  <div>
                    <p className="font-medium text-gray-900">{payment.receipt_number}</p>
                    <p className="text-sm text-gray-500">
                      {payment.payment_date ? format(new Date(payment.payment_date), 'MMM d, yyyy HH:mm') : 'N/A'}
                    </p>
                    <p className="text-sm text-gray-500">{payment.payment_method}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-green-600">{formatAmount(payment.amount)}</p>
                    <Badge className="bg-green-100 text-green-800">{payment.status}</Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <Dialog open={paymentDialogOpen} onOpenChange={setPaymentDialogOpen}>
        <DialogContent className="bg-white">
          <DialogHeader>
            <DialogTitle>Record Payment</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Amount *</Label>
              <Input
                type="number"
                value={paymentData.amount}
                onChange={(e) => setPaymentData({ ...paymentData, amount: e.target.value })}
                placeholder={`Max: ${invoice.balance || (invoice.total_amount - (invoice.amount_paid || 0))}`}
              />
            </div>
            <div>
              <Label>Payment Method *</Label>
              <Select value={paymentData.payment_method} onValueChange={(value) => setPaymentData({ ...paymentData, payment_method: value })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Cash">Cash</SelectItem>
                  <SelectItem value="Bank Transfer">Bank Transfer</SelectItem>
                  <SelectItem value="Card">Card</SelectItem>
                  <SelectItem value="Mobile Money">Mobile Money</SelectItem>
                  <SelectItem value="Cheque">Cheque</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Transaction Reference</Label>
              <Input
                value={paymentData.transaction_reference}
                onChange={(e) => setPaymentData({ ...paymentData, transaction_reference: e.target.value })}
                placeholder="e.g., Bank transfer ref"
              />
            </div>
            <div>
              <Label>Paid By</Label>
              <Input
                value={paymentData.paid_by}
                onChange={(e) => setPaymentData({ ...paymentData, paid_by: e.target.value })}
                placeholder="Name of person who paid"
              />
            </div>
            <div className="flex justify-end gap-3 pt-4">
              <Button variant="outline" onClick={() => setPaymentDialogOpen(false)}>Cancel</Button>
              <Button
                onClick={() => recordPaymentMutation.mutate(paymentData)}
                disabled={!paymentData.amount || recordPaymentMutation.isPending}
                className="bg-green-600 hover:bg-green-700"
              >
                {recordPaymentMutation.isPending ? 'Recording...' : 'Record Payment'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}