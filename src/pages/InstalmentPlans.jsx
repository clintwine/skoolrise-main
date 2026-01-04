import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar, CheckCircle, Clock, AlertCircle, Plus } from 'lucide-react';
import { format, addMonths } from 'date-fns';
import { useCurrency } from '@/components/CurrencyProvider';
import { toast } from 'sonner';

export default function InstalmentPlans() {
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [paymentAmount, setPaymentAmount] = useState(0);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [selectedInvoiceId, setSelectedInvoiceId] = useState('');
  const [numberOfInstalments, setNumberOfInstalments] = useState(3);
  const [planName, setPlanName] = useState('');
  const queryClient = useQueryClient();
  const { formatAmount, symbol } = useCurrency();

  const { data: plans = [] } = useQuery({
    queryKey: ['instalment-plans'],
    queryFn: () => base44.entities.InstalmentPlan.list('-created_date'),
  });

  const { data: invoices = [] } = useQuery({
    queryKey: ['invoices-for-plans'],
    queryFn: async () => {
      const allInvoices = await base44.entities.FeeInvoice.list('-created_date');
      // Only show invoices that don't have an instalment plan yet and aren't fully paid
      return allInvoices.filter(inv => 
        inv.status !== 'Paid' && 
        !plans.some(p => p.invoice_id === inv.id)
      );
    },
  });

  const updatePlanMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.InstalmentPlan.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['instalment-plans'] });
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
    },
  });

  const createPaymentMutation = useMutation({
    mutationFn: (data) => base44.entities.Payment.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payments'] });
    },
  });

  const updateInvoiceMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.FeeInvoice.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
    },
  });

  const createPlanMutation = useMutation({
    mutationFn: async (data) => {
      const invoice = invoices.find(inv => inv.id === data.invoiceId);
      if (!invoice) throw new Error('Invoice not found');

      const totalAmount = invoice.balance || invoice.total_amount;
      const instalmentAmount = totalAmount / data.numberOfInstalments;
      
      // Generate instalment schedule
      const instalments = [];
      const startDate = new Date();
      for (let i = 0; i < data.numberOfInstalments; i++) {
        const dueDate = addMonths(startDate, i);
        instalments.push({
          instalment_number: i + 1,
          amount: instalmentAmount,
          due_date: dueDate.toISOString().split('T')[0],
          status: 'Pending',
          payment_date: null,
        });
      }

      return await base44.entities.InstalmentPlan.create({
        plan_name: data.planName || `Payment Plan - ${invoice.student_name}`,
        invoice_id: invoice.id,
        student_id: invoice.student_id,
        student_name: invoice.student_name,
        total_amount: totalAmount,
        number_of_instalments: data.numberOfInstalments,
        instalment_amount: instalmentAmount,
        instalments_paid: 0,
        amount_paid: 0,
        instalments: JSON.stringify(instalments),
        start_date: startDate.toISOString().split('T')[0],
        end_date: addMonths(startDate, data.numberOfInstalments - 1).toISOString().split('T')[0],
        status: 'Active',
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['instalment-plans'] });
      queryClient.invalidateQueries({ queryKey: ['invoices-for-plans'] });
      setCreateDialogOpen(false);
      setSelectedInvoiceId('');
      setNumberOfInstalments(3);
      setPlanName('');
      toast.success('Instalment plan created successfully!');
    },
    onError: (error) => {
      toast.error('Failed to create plan: ' + error.message);
    },
  });

  const recordPayment = async () => {
    if (!selectedPlan || paymentAmount <= 0) return;

    const instalments = JSON.parse(selectedPlan.instalments);
    let remainingAmount = paymentAmount;
    let instalmentsPaid = selectedPlan.instalments_paid;

    for (let i = 0; i < instalments.length; i++) {
      if (instalments[i].status === 'Paid') continue;
      
      if (remainingAmount >= instalments[i].amount) {
        instalments[i].status = 'Paid';
        instalments[i].payment_date = new Date().toISOString().split('T')[0];
        remainingAmount -= instalments[i].amount;
        instalmentsPaid++;
      } else if (remainingAmount > 0) {
        instalments[i].status = 'Partially Paid';
        instalments[i].amount_paid = remainingAmount;
        remainingAmount = 0;
      }

      if (remainingAmount === 0) break;
    }

    const newAmountPaid = selectedPlan.amount_paid + paymentAmount;
    const newStatus = newAmountPaid >= selectedPlan.total_amount ? 'Completed' : 'Active';

    await createPaymentMutation.mutateAsync({
      receipt_number: `RCP-${Date.now()}`,
      invoice_id: selectedPlan.invoice_id,
      student_id: selectedPlan.student_id,
      student_name: selectedPlan.student_name,
      payment_date: new Date().toISOString(),
      amount: paymentAmount,
      payment_method: 'Cash',
      transaction_reference: `INST-${selectedPlan.id}-${Date.now()}`,
      status: 'Completed',
      notes: `Instalment payment for ${selectedPlan.plan_name}`,
    });

    await updatePlanMutation.mutateAsync({
      id: selectedPlan.id,
      data: {
        instalments: JSON.stringify(instalments),
        instalments_paid: instalmentsPaid,
        amount_paid: newAmountPaid,
        status: newStatus,
      },
    });

    await updateInvoiceMutation.mutateAsync({
      id: selectedPlan.invoice_id,
      data: {
        amount_paid: newAmountPaid,
        balance: selectedPlan.total_amount - newAmountPaid,
        status: newAmountPaid >= selectedPlan.total_amount ? 'Paid' : 'Partially Paid',
      },
    });

    alert('Payment recorded successfully!');
    setSelectedPlan(null);
    setPaymentAmount(0);
  };

  const statusColors = {
    Active: 'bg-blue-100 text-blue-800',
    Completed: 'bg-green-100 text-green-800',
    Defaulted: 'bg-red-100 text-red-800',
    Cancelled: 'bg-gray-100 text-gray-800',
  };

  const instalmentStatusColors = {
    Pending: 'bg-yellow-100 text-yellow-800',
    Paid: 'bg-green-100 text-green-800',
    'Partially Paid': 'bg-blue-100 text-blue-800',
    Overdue: 'bg-red-100 text-red-800',
  };

  const selectedInvoice = invoices.find(inv => inv.id === selectedInvoiceId);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Instalment Plans</h1>
          <p className="text-gray-600 mt-1">Manage student payment plans</p>
        </div>
        <Button onClick={() => setCreateDialogOpen(true)} className="bg-blue-600 hover:bg-blue-700">
          <Plus className="w-4 h-4 mr-2" />
          Create Plan
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {plans.map((plan) => {
          const instalments = plan.instalments ? JSON.parse(plan.instalments) : [];
          const progress = (plan.amount_paid / plan.total_amount) * 100;

          return (
            <Card key={plan.id} className="bg-white shadow-md hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-lg">{plan.student_name}</CardTitle>
                    <p className="text-sm text-gray-600 mt-1">{plan.plan_name}</p>
                  </div>
                  <Badge className={statusColors[plan.status]}>{plan.status}</Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Total Amount:</span>
                    <span className="font-bold">{formatAmount(plan.total_amount)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Amount Paid:</span>
                    <span className="font-bold text-green-600">{formatAmount(plan.amount_paid)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Remaining:</span>
                    <span className="font-bold text-orange-600">{formatAmount(plan.total_amount - plan.amount_paid)}</span>
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-gray-600">Progress</span>
                    <span className="font-semibold">{progress.toFixed(1)}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div className="bg-blue-600 h-2 rounded-full" style={{ width: `${progress}%` }} />
                  </div>
                </div>

                <div className="text-sm text-gray-600">
                  <p>{plan.instalments_paid} of {plan.number_of_instalments} instalments paid</p>
                </div>

                <Button onClick={() => { setSelectedPlan(plan); setPaymentAmount(0); }} className="w-full" variant="outline">
                  View Details
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Dialog open={!!selectedPlan} onOpenChange={() => setSelectedPlan(null)}>
        <DialogContent className="max-w-2xl bg-white max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-gray-900">Instalment Plan Details</DialogTitle>
          </DialogHeader>
          {selectedPlan && (
            <div className="space-y-6">
              <div className="p-4 bg-gray-50 rounded-lg">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-600">Student</p>
                    <p className="font-semibold">{selectedPlan.student_name}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Plan Name</p>
                    <p className="font-semibold">{selectedPlan.plan_name}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Total Amount</p>
                    <p className="font-semibold">{formatAmount(selectedPlan.total_amount)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Amount Paid</p>
                    <p className="font-semibold text-green-600">{formatAmount(selectedPlan.amount_paid)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Instalments</p>
                    <p className="font-semibold">{selectedPlan.instalments_paid} / {selectedPlan.number_of_instalments}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Status</p>
                    <Badge className={statusColors[selectedPlan.status]}>{selectedPlan.status}</Badge>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="font-semibold mb-3">Instalment Schedule</h3>
                <div className="space-y-3">
                  {selectedPlan.instalments && JSON.parse(selectedPlan.instalments).map((inst, idx) => (
                    <div key={idx} className="p-3 border rounded-lg">
                      <div className="flex justify-between items-center">
                        <div className="flex items-center gap-3">
                          <div className="flex-shrink-0">
                            {inst.status === 'Paid' ? (
                              <CheckCircle className="w-5 h-5 text-green-600" />
                            ) : (
                              <Clock className="w-5 h-5 text-gray-400" />
                            )}
                          </div>
                          <div>
                            <p className="font-semibold">Instalment {inst.instalment_number}</p>
                            <p className="text-sm text-gray-600">
                              <Calendar className="w-3 h-3 inline mr-1" />
                              Due: {format(new Date(inst.due_date), 'MMM d, yyyy')}
                            </p>
                            {inst.payment_date && (
                              <p className="text-sm text-green-600">
                                Paid: {format(new Date(inst.payment_date), 'MMM d, yyyy')}
                              </p>
                            )}
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-bold">{formatAmount(inst.amount)}</p>
                          <Badge className={instalmentStatusColors[inst.status]}>{inst.status}</Badge>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {selectedPlan.status === 'Active' && (
                <div className="p-4 bg-blue-50 rounded-lg">
                  <h3 className="font-semibold mb-3">Record Payment</h3>
                  <div className="space-y-3">
                    <div>
                      <Label>Payment Amount ({symbol})</Label>
                      <Input type="number" step="0.01" value={paymentAmount} onChange={(e) => setPaymentAmount(parseFloat(e.target.value) || 0)} placeholder="Enter amount" />
                    </div>
                    <Button onClick={recordPayment} disabled={paymentAmount <= 0} className="w-full bg-blue-600 hover:bg-blue-700">
                      Record Payment
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
      {/* Create Plan Dialog */}
      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent className="max-w-lg bg-white">
          <DialogHeader>
            <DialogTitle>Create Instalment Plan</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Select Invoice</Label>
              <Select value={selectedInvoiceId} onValueChange={setSelectedInvoiceId}>
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Select an invoice" />
                </SelectTrigger>
                <SelectContent>
                  {invoices.map(inv => (
                    <SelectItem key={inv.id} value={inv.id}>
                      {inv.invoice_number} - {inv.student_name} ({formatAmount(inv.balance || inv.total_amount)})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {selectedInvoice && (
              <div className="p-4 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-600">Invoice: {selectedInvoice.invoice_number}</p>
                <p className="text-sm text-gray-600">Student: {selectedInvoice.student_name}</p>
                <p className="font-semibold text-gray-900">
                  Outstanding: {formatAmount(selectedInvoice.balance || selectedInvoice.total_amount)}
                </p>
              </div>
            )}

            <div>
              <Label>Plan Name (Optional)</Label>
              <Input
                value={planName}
                onChange={(e) => setPlanName(e.target.value)}
                placeholder="e.g., Term 1 Fee Payment Plan"
                className="mt-1"
              />
            </div>

            <div>
              <Label>Number of Instalments</Label>
              <Select value={numberOfInstalments.toString()} onValueChange={(v) => setNumberOfInstalments(parseInt(v))}>
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="2">2 Instalments</SelectItem>
                  <SelectItem value="3">3 Instalments</SelectItem>
                  <SelectItem value="4">4 Instalments</SelectItem>
                  <SelectItem value="6">6 Instalments</SelectItem>
                  <SelectItem value="12">12 Instalments</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {selectedInvoice && (
              <div className="p-4 bg-blue-50 rounded-lg">
                <p className="text-sm text-blue-800">
                  <strong>Each instalment:</strong>{' '}
                  {formatAmount((selectedInvoice.balance || selectedInvoice.total_amount) / numberOfInstalments)}
                </p>
                <p className="text-sm text-blue-800">
                  <strong>Duration:</strong> {numberOfInstalments} months
                </p>
              </div>
            )}

            <Button 
              onClick={() => createPlanMutation.mutate({ 
                invoiceId: selectedInvoiceId, 
                numberOfInstalments, 
                planName 
              })}
              className="w-full bg-blue-600 hover:bg-blue-700"
              disabled={!selectedInvoiceId || createPlanMutation.isPending}
            >
              {createPlanMutation.isPending ? 'Creating...' : 'Create Instalment Plan'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}