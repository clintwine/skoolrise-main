import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useSchoolContext } from '@/hooks/useSchoolContext';
import { addSchoolFilter, withSchoolId } from '@/utils/schoolFilter';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Trash2, ArrowLeft } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { createPageUrl } from '../utils';
import { useCurrency } from '@/components/CurrencyProvider';

export default function CreateInvoice() {
  const navigate = useNavigate();
  const { formatAmount, symbol } = useCurrency();
  const [formData, setFormData] = useState({
    student_id: '',
    session_id: '',
    term_id: '',
    fee_policy_id: '',
    invoice_date: new Date().toISOString().split('T')[0],
    due_date: '',
    discount_amount: 0,
    discount_reason: '',
    penalty_amount: 0,
    notes: '',
    instalment_enabled: false,
    number_of_instalments: 1,
  });

  const [feeItems, setFeeItems] = useState([{ name: 'Tuition', amount: 0 }]);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [selectedPolicy, setSelectedPolicy] = useState(null);

  const { school_tenant_id, isReady } = useSchoolContext();

  const { data: students = [] } = useQuery({
    queryKey: ['students', school_tenant_id],
    queryFn: () => base44.entities.Student.filter(addSchoolFilter({}, school_tenant_id)),
    enabled: isReady,
  });

  const { data: sessions = [] } = useQuery({
    queryKey: ['sessions', school_tenant_id],
    queryFn: () => base44.entities.AcademicSession.filter(addSchoolFilter({}, school_tenant_id)),
    enabled: isReady,
  });

  const { data: terms = [] } = useQuery({
    queryKey: ['terms', school_tenant_id],
    queryFn: () => base44.entities.Term.filter(addSchoolFilter({}, school_tenant_id)),
    enabled: isReady,
  });

  const { data: policies = [] } = useQuery({
    queryKey: ['fee-policies', school_tenant_id],
    queryFn: () => base44.entities.FeePolicy.filter(addSchoolFilter({}, school_tenant_id)),
    enabled: isReady,
  });

  const createInvoiceMutation = useMutation({
    mutationFn: async (data) => base44.entities.FeeInvoice.create(data),
    onSuccess: (invoice) => {
      if (formData.instalment_enabled && formData.number_of_instalments > 1) {
        createInstalmentPlan(invoice);
      } else {
        alert('Invoice created successfully!');
        navigate(createPageUrl('FeesManagement'));
      }
    },
  });

  const createInstalmentPlanMutation = useMutation({
    mutationFn: async (data) => base44.entities.InstalmentPlan.create(data),
    onSuccess: () => {
      alert('Invoice and instalment plan created successfully!');
      navigate(createPageUrl('FeesManagement'));
    },
  });

  const handleStudentChange = (studentId) => {
    const student = students.find(s => s.id === studentId);
    setSelectedStudent(student);
    setFormData({ ...formData, student_id: studentId });
  };

  const handlePolicyChange = (policyId) => {
    const policy = policies.find(p => p.id === policyId);
    if (policy) {
      setSelectedPolicy(policy);
      setFeeItems(policy.fee_items ? JSON.parse(policy.fee_items) : []);
      setFormData({
        ...formData,
        fee_policy_id: policyId,
        session_id: policy.session_id || formData.session_id,
        term_id: policy.term_id || formData.term_id,
      });
    }
  };

  const addFeeItem = () => {
    setFeeItems([...feeItems, { name: '', amount: 0 }]);
  };

  const updateFeeItem = (index, field, value) => {
    const updated = [...feeItems];
    updated[index][field] = value;
    setFeeItems(updated);
  };

  const removeFeeItem = (index) => {
    setFeeItems(feeItems.filter((_, i) => i !== index));
  };

  const calculateTotals = () => {
    const subtotal = feeItems.reduce((sum, item) => sum + (parseFloat(item.amount) || 0), 0);
    const discount = parseFloat(formData.discount_amount) || 0;
    const penalty = parseFloat(formData.penalty_amount) || 0;
    const total = subtotal - discount + penalty;
    return { subtotal, discount, penalty, total };
  };

  const createInstalmentPlan = (invoice) => {
    const { total } = calculateTotals();
    const instalmentAmount = total / formData.number_of_instalments;
    const instalments = [];
    const startDate = new Date(formData.due_date);

    for (let i = 0; i < formData.number_of_instalments; i++) {
      const dueDate = new Date(startDate);
      dueDate.setMonth(dueDate.getMonth() + i);
      instalments.push({
        instalment_number: i + 1,
        due_date: dueDate.toISOString().split('T')[0],
        amount: instalmentAmount,
        status: 'Pending',
        payment_date: null,
      });
    }

    const planData = {
      plan_name: `${selectedStudent?.first_name || 'Student'} - ${formData.number_of_instalments} Instalments`,
      invoice_id: invoice.id,
      student_id: formData.student_id,
      student_name: `${selectedStudent?.first_name} ${selectedStudent?.last_name}`,
      total_amount: total,
      number_of_instalments: formData.number_of_instalments,
      instalment_amount: instalmentAmount,
      instalments_paid: 0,
      amount_paid: 0,
      instalments: JSON.stringify(instalments),
      start_date: instalments[0].due_date,
      end_date: instalments[instalments.length - 1].due_date,
      status: 'Active',
    };

    createInstalmentPlanMutation.mutate(planData);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const { subtotal, total } = calculateTotals();

    const invoiceData = withSchoolId({
      invoice_number: `INV-${Date.now()}`,
      student_id: formData.student_id,
      student_name: `${selectedStudent?.first_name} ${selectedStudent?.last_name}`,
      session_id: formData.session_id,
      term_id: formData.term_id,
      fee_policy_id: formData.fee_policy_id || null,
      invoice_date: formData.invoice_date,
      due_date: formData.due_date,
      subtotal: subtotal,
      discount_amount: formData.discount_amount,
      discount_reason: formData.discount_reason,
      penalty_amount: formData.penalty_amount,
      total_amount: total,
      amount_paid: 0,
      balance: total,
      status: 'Pending',
      fee_items: JSON.stringify(feeItems),
      instalment_plan_id: formData.instalment_enabled ? 'pending' : null,
      payment_reminder_sent: false,
      notes: formData.notes,
    }, school_tenant_id);

    createInvoiceMutation.mutate(invoiceData);
  };

  const { subtotal, discount, penalty, total } = calculateTotals();

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link to={createPageUrl('FeesManagement')}>
          <Button variant="outline" size="sm">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Create Invoice</h1>
          <p className="text-gray-600 mt-1">Generate a new fee invoice for a student</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card className="bg-white shadow-md">
          <CardHeader>
            <CardTitle>Basic Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Student *</Label>
                <Select value={formData.student_id} onValueChange={handleStudentChange} required>
                  <SelectTrigger><SelectValue placeholder="Select student" /></SelectTrigger>
                  <SelectContent>
                    {students.map(s => (
                      <SelectItem key={s.id} value={s.id}>
                        {s.first_name} {s.last_name} ({s.student_id})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Fee Policy (Optional)</Label>
                <Select value={formData.fee_policy_id} onValueChange={handlePolicyChange}>
                  <SelectTrigger><SelectValue placeholder="Select policy" /></SelectTrigger>
                  <SelectContent>
                    {policies.map(p => (
                      <SelectItem key={p.id} value={p.id}>
                        {p.policy_name} - Grade {p.grade_level}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Academic Session</Label>
                <Select value={formData.session_id} onValueChange={(value) => setFormData({ ...formData, session_id: value })}>
                  <SelectTrigger><SelectValue placeholder="Select session" /></SelectTrigger>
                  <SelectContent>
                    {sessions.map(s => <SelectItem key={s.id} value={s.id}>{s.session_name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Term</Label>
                <Select value={formData.term_id} onValueChange={(value) => setFormData({ ...formData, term_id: value })}>
                  <SelectTrigger><SelectValue placeholder="Select term" /></SelectTrigger>
                  <SelectContent>
                    {terms.map(t => <SelectItem key={t.id} value={t.id}>{t.term_name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Invoice Date *</Label>
                <Input type="date" value={formData.invoice_date} onChange={(e) => setFormData({ ...formData, invoice_date: e.target.value })} required />
              </div>
              <div>
                <Label>Due Date *</Label>
                <Input type="date" value={formData.due_date} onChange={(e) => setFormData({ ...formData, due_date: e.target.value })} required />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white shadow-md">
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle>Fee Items</CardTitle>
              <Button type="button" onClick={addFeeItem} size="sm" variant="outline">
                <Plus className="w-4 h-4 mr-1" />
                Add Item
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {feeItems.map((item, idx) => (
                <div key={idx} className="flex gap-2">
                  <Input placeholder="Fee Name" value={item.name} onChange={(e) => updateFeeItem(idx, 'name', e.target.value)} required />
                  <Input type="number" step="0.01" placeholder="Amount" value={item.amount} onChange={(e) => updateFeeItem(idx, 'amount', parseFloat(e.target.value) || 0)} required />
                  {feeItems.length > 1 && (
                    <Button type="button" variant="ghost" size="sm" onClick={() => removeFeeItem(idx)}>
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white shadow-md">
          <CardHeader>
            <CardTitle>Discounts & Penalties</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Discount Amount ({symbol})</Label>
                <Input type="number" step="0.01" value={formData.discount_amount} onChange={(e) => setFormData({ ...formData, discount_amount: parseFloat(e.target.value) || 0 })} />
              </div>
              <div>
                <Label>Discount Reason</Label>
                <Input placeholder="e.g., Scholarship, Early payment" value={formData.discount_reason} onChange={(e) => setFormData({ ...formData, discount_reason: e.target.value })} />
              </div>
              <div>
                <Label>Penalty Amount ({symbol})</Label>
                <Input type="number" step="0.01" value={formData.penalty_amount} onChange={(e) => setFormData({ ...formData, penalty_amount: parseFloat(e.target.value) || 0 })} />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white shadow-md">
          <CardHeader>
            <CardTitle>Instalment Plan</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <label className="flex items-center gap-2">
              <input type="checkbox" checked={formData.instalment_enabled} onChange={(e) => setFormData({ ...formData, instalment_enabled: e.target.checked })} />
              <span className="text-sm">Enable Instalment Payment</span>
            </label>
            {formData.instalment_enabled && (
              <div>
                <Label>Number of Instalments</Label>
                <Input type="number" min="2" max="12" value={formData.number_of_instalments} onChange={(e) => setFormData({ ...formData, number_of_instalments: parseInt(e.target.value) || 1 })} />
                <p className="text-sm text-gray-600 mt-1">
                  Each instalment: {formatAmount(total / formData.number_of_instalments)}
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="bg-white shadow-md">
          <CardHeader>
            <CardTitle>Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Subtotal:</span>
                <span className="font-semibold">{formatAmount(subtotal)}</span>
              </div>
              {discount > 0 && (
                <div className="flex justify-between text-sm text-green-600">
                  <span>Discount:</span>
                  <span>-{formatAmount(discount)}</span>
                </div>
              )}
              {penalty > 0 && (
                <div className="flex justify-between text-sm text-red-600">
                  <span>Penalty:</span>
                  <span>+{formatAmount(penalty)}</span>
                </div>
              )}
              <div className="flex justify-between text-lg font-bold pt-2 border-t">
                <span>Total Amount:</span>
                <span>{formatAmount(total)}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white shadow-md">
          <CardContent className="pt-6">
            <Label>Notes</Label>
            <Textarea value={formData.notes} onChange={(e) => setFormData({ ...formData, notes: e.target.value })} placeholder="Add any additional notes..." />
          </CardContent>
        </Card>

        <div className="flex justify-end gap-3">
          <Link to={createPageUrl('FeesManagement')}>
            <Button type="button" variant="outline">Cancel</Button>
          </Link>
          <Button type="submit" className="bg-blue-600 hover:bg-blue-700" disabled={createInvoiceMutation.isLoading}>
            {createInvoiceMutation.isLoading ? 'Creating...' : 'Create Invoice'}
          </Button>
        </div>
      </form>
    </div>
  );
}