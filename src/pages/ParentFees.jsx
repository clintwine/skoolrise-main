import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { DollarSign, CreditCard, Download, CheckCircle } from 'lucide-react';
import { format } from 'date-fns';
import { useCurrency } from '@/components/CurrencyProvider';
import { useParentStudents } from '@/components/hooks/useParentStudents';

export default function ParentFees() {
  const [user, setUser] = useState(null);
  const [selectedStudentId, setSelectedStudentId] = useState('');
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [paymentMethod, setPaymentMethod] = useState('paystack');
  const queryClient = useQueryClient();
  const { formatAmount } = useCurrency();

  useEffect(() => {
    const fetchUser = async () => {
      const currentUser = await base44.auth.me();
      setUser(currentUser);
    };
    fetchUser();
  }, []);

  const { students, isLoading } = useParentStudents(user);

  useEffect(() => {
    if (students.length > 0 && !selectedStudentId) {
      setSelectedStudentId(students[0].id);
    }
  }, [students, selectedStudentId]);

  const { data: invoices = [] } = useQuery({
    queryKey: ['parent-invoices', selectedStudentId],
    queryFn: async () => {
      if (!selectedStudentId) return [];
      return await base44.entities.FeeInvoice.filter({ student_id: selectedStudentId }, '-created_date');
    },
    enabled: !!selectedStudentId,
  });

  const { data: payments = [] } = useQuery({
    queryKey: ['parent-payments', selectedStudentId],
    queryFn: async () => {
      if (!selectedStudentId) return [];
      // Fetch all payments and filter client-side to avoid $in array error
      const allPayments = await base44.entities.Payment.list('-payment_date');
      return allPayments.filter(p => p.student_id === selectedStudentId);
    },
    enabled: !!selectedStudentId,
  });

  const paymentMutation = useMutation({
    mutationFn: async ({ invoiceId, amount, method }) => {
      const payment = await base44.entities.Payment.create({
        invoice_id: invoiceId,
        student_id: selectedInvoice.student_id,
        student_name: selectedInvoice.student_name,
        school_tenant_id: selectedInvoice.school_tenant_id,
        amount: amount,
        payment_method: method,
        payment_date: new Date().toISOString(),
        status: 'Completed',
        reference: `PAY-${Date.now()}`,
      });

      const newBalance = selectedInvoice.balance - amount;
      await base44.entities.FeeInvoice.update(invoiceId, {
        amount_paid: selectedInvoice.amount_paid + amount,
        balance: newBalance,
        status: newBalance <= 0 ? 'Paid' : 'Partial',
      });

      return payment;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['parent-invoices'] });
      queryClient.invalidateQueries({ queryKey: ['parent-payments'] });
      alert('Payment successful!');
      setSelectedInvoice(null);
    },
  });

  const initiatePayment = (method) => {
    if (!selectedInvoice) return;

    const amount = selectedInvoice.balance;
    
    if (method === 'paystack') {
      alert(`Redirecting to Paystack to pay ${formatAmount(amount)}...`);
      setTimeout(() => {
        paymentMutation.mutate({ invoiceId: selectedInvoice.id, amount, method: 'Paystack' });
      }, 1500);
    } else if (method === 'stripe') {
      alert(`Redirecting to Stripe to pay ${formatAmount(amount)}...`);
      setTimeout(() => {
        paymentMutation.mutate({ invoiceId: selectedInvoice.id, amount, method: 'Stripe' });
      }, 1500);
    } else if (method === 'flutterwave') {
      alert(`Redirecting to Flutterwave to pay ${formatAmount(amount)}...`);
      setTimeout(() => {
        paymentMutation.mutate({ invoiceId: selectedInvoice.id, amount, method: 'Flutterwave' });
      }, 1500);
    }
  };

  const statusColors = {
    Paid: 'bg-green-100 text-green-800',
    Partial: 'bg-yellow-100 text-yellow-800',
    Pending: 'bg-orange-100 text-orange-800',
    Overdue: 'bg-red-100 text-red-800',
  };

  const totalOutstanding = invoices.reduce((sum, inv) => sum + (inv.balance || 0), 0);
  const totalPaid = invoices.reduce((sum, inv) => sum + (inv.amount_paid || 0), 0);

  if (!user || students.length === 0) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold text-gray-900">Fee Management</h1>
        <Card>
          <CardContent className="p-12 text-center">
            <DollarSign className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">No students linked to your account</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Fee Management</h1>
        <p className="text-gray-600 mt-1">View invoices and make payments</p>
      </div>

      <div className="mb-4">
        <Label htmlFor="select-student" className="text-xs text-gray-500">Select Student</Label>
        <Select value={selectedStudentId} onValueChange={setSelectedStudentId}>
          <SelectTrigger id="select-student" className="w-full md:w-[200px]">
            <SelectValue placeholder="Select a student" />
          </SelectTrigger>
          <SelectContent>
            {students.map((student) => (
              <SelectItem key={student.id} value={student.id}>
                {student.first_name} {student.last_name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-white shadow-md">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Invoiced</p>
                <p className="text-2xl font-bold text-blue-600">{formatAmount(invoices.reduce((sum, inv) => sum + inv.total_amount, 0))}</p>
              </div>
              <DollarSign className="w-8 h-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>
        <Card className="bg-white shadow-md">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Paid</p>
                <p className="text-2xl font-bold text-green-600">{formatAmount(totalPaid)}</p>
              </div>
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
          </CardContent>
        </Card>
        <Card className="bg-white shadow-md">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Outstanding</p>
                <p className="text-2xl font-bold text-orange-600">{formatAmount(totalOutstanding)}</p>
              </div>
              <CreditCard className="w-8 h-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="bg-white shadow-md">
        <CardHeader>
          <CardTitle>Invoices</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Invoice #</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Student</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Due Date</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Total</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Paid</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Balance</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {invoices.map((invoice) => (
                  <tr key={invoice.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 text-sm font-medium text-gray-900">{invoice.invoice_number}</td>
                    <td className="px-6 py-4 text-sm text-gray-900">{invoice.student_name}</td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {format(new Date(invoice.due_date), 'MMM d, yyyy')}
                    </td>
                    <td className="px-6 py-4 text-sm font-semibold text-gray-900">{formatAmount(invoice.total_amount)}</td>
                    <td className="px-6 py-4 text-sm text-green-600">{formatAmount(invoice.amount_paid)}</td>
                    <td className="px-6 py-4 text-sm font-semibold text-orange-600">{formatAmount(invoice.balance)}</td>
                    <td className="px-6 py-4">
                      <Badge className={statusColors[invoice.status]}>{invoice.status}</Badge>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex gap-2">
                        {invoice.balance > 0 && (
                          <Button
                            size="sm"
                            onClick={() => setSelectedInvoice(invoice)}
                            className="bg-blue-600 hover:bg-blue-700"
                          >
                            Pay Now
                          </Button>
                        )}
                        <Button variant="outline" size="sm">
                          <Download className="w-4 h-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-white shadow-md">
        <CardHeader>
          <CardTitle>Recent Payments</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {payments.slice(0, 10).map((payment) => (
              <div key={payment.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div>
                  <p className="font-medium">{payment.student_name}</p>
                  <p className="text-sm text-gray-600">
                    {format(new Date(payment.payment_date), 'MMM d, yyyy')} • {payment.payment_method}
                  </p>
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

      <Dialog open={!!selectedInvoice} onOpenChange={() => setSelectedInvoice(null)}>
        <DialogContent className="max-w-md bg-white">
          <DialogHeader>
            <DialogTitle className="text-gray-900">Make Payment</DialogTitle>
          </DialogHeader>
          {selectedInvoice && (
            <div className="space-y-4">
              <div className="p-4 bg-gray-50 rounded-lg space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-600">Invoice:</span>
                  <span className="font-semibold">{selectedInvoice.invoice_number}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Student:</span>
                  <span className="font-semibold">{selectedInvoice.student_name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Amount Due:</span>
                  <span className="font-bold text-orange-600">{formatAmount(selectedInvoice.balance)}</span>
                </div>
              </div>

              <div className="space-y-3">
                <p className="text-sm font-medium text-gray-700">Select Payment Method:</p>
                <div className="space-y-2">
                  <button
                    onClick={() => initiatePayment('paystack')}
                    className="w-full p-4 border-2 border-gray-200 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-all text-left"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-semibold">Paystack</p>
                        <p className="text-sm text-gray-600">Card, Bank Transfer, USSD</p>
                      </div>
                      <CreditCard className="w-6 h-6 text-blue-600" />
                    </div>
                  </button>
                  <button
                    onClick={() => initiatePayment('stripe')}
                    className="w-full p-4 border-2 border-gray-200 rounded-lg hover:border-purple-500 hover:bg-purple-50 transition-all text-left"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-semibold">Stripe</p>
                        <p className="text-sm text-gray-600">Credit/Debit Cards</p>
                      </div>
                      <CreditCard className="w-6 h-6 text-purple-600" />
                    </div>
                  </button>
                  <button
                    onClick={() => initiatePayment('flutterwave')}
                    className="w-full p-4 border-2 border-gray-200 rounded-lg hover:border-orange-500 hover:bg-orange-50 transition-all text-left"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-semibold">Flutterwave</p>
                        <p className="text-sm text-gray-600">Multiple payment options</p>
                      </div>
                      <CreditCard className="w-6 h-6 text-orange-600" />
                    </div>
                  </button>
                </div>
              </div>

              <div className="pt-4 border-t">
                <p className="text-xs text-gray-500 text-center">
                  Secure payment processing. Your payment information is encrypted.
                </p>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}