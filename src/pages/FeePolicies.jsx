import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useSchoolContext } from '@/hooks/useSchoolContext';
import { addSchoolFilter, withSchoolId } from '@/utils/schoolFilter';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Edit, FileText, Trash2 } from 'lucide-react';
import { useCurrency } from '@/components/CurrencyProvider';

export default function FeePolicies() {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingPolicy, setEditingPolicy] = useState(null);
  const queryClient = useQueryClient();
  const { formatAmount } = useCurrency();

  const { school_tenant_id, isReady } = useSchoolContext();

  const { data: policies = [] } = useQuery({
    queryKey: ['fee-policies', school_tenant_id],
    queryFn: () => base44.entities.FeePolicy.filter(addSchoolFilter({}, school_tenant_id), '-created_date'),
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

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.FeePolicy.create(withSchoolId(data, school_tenant_id)),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['fee-policies'] });
      setIsFormOpen(false);
      setEditingPolicy(null);
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.FeePolicy.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['fee-policies'] });
      setIsFormOpen(false);
      setEditingPolicy(null);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.FeePolicy.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['fee-policies'] });
    },
  });

  const handleSubmit = (data) => {
    if (editingPolicy) {
      updateMutation.mutate({ id: editingPolicy.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const statusColors = {
    Active: 'bg-green-100 text-green-800',
    Inactive: 'bg-gray-100 text-gray-800',
    Archived: 'bg-red-100 text-red-800',
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Fee Policies</h1>
          <p className="text-gray-600 mt-1">Define fee structures and payment rules</p>
        </div>
        <Button onClick={() => { setEditingPolicy(null); setIsFormOpen(true); }} className="bg-blue-600 hover:bg-blue-700">
          <Plus className="w-4 h-4 mr-2" />
          Create Policy
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {policies.map((policy) => (
          <Card key={policy.id} className="bg-white shadow-md hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <CardTitle className="text-lg">{policy.policy_name}</CardTitle>
                  <p className="text-sm text-gray-600 mt-1">Grade {policy.grade_level}</p>
                </div>
                <Badge className={statusColors[policy.status]}>{policy.status}</Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Total Amount:</span>
                  <span className="font-bold text-gray-900">{formatAmount(policy.total_amount)}</span>
                </div>
                {policy.late_payment_penalty_rate > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Late Penalty:</span>
                    <span className="text-red-600">{policy.late_payment_penalty_rate}%</span>
                  </div>
                )}
                {policy.early_payment_discount_rate > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Early Discount:</span>
                    <span className="text-green-600">{policy.early_payment_discount_rate}%</span>
                  </div>
                )}
                {policy.instalment_allowed && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Max Instalments:</span>
                    <span className="text-blue-600">{policy.max_instalments}</span>
                  </div>
                )}
                {policy.description && (
                  <p className="text-sm text-gray-600 pt-2 border-t">{policy.description}</p>
                )}
              </div>
              <div className="flex gap-2 mt-4">
                <Button variant="outline" size="sm" onClick={() => { setEditingPolicy(policy); setIsFormOpen(true); }} className="flex-1">
                  <Edit className="w-4 h-4 mr-1" />
                  Edit
                </Button>
                <Button variant="outline" size="sm" onClick={() => {
                  if (confirm('Delete this policy?')) deleteMutation.mutate(policy.id);
                }}>
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <PolicyFormDialog
        open={isFormOpen}
        onOpenChange={setIsFormOpen}
        policy={editingPolicy}
        sessions={sessions}
        terms={terms}
        onSubmit={handleSubmit}
        formatAmount={formatAmount}
      />
    </div>
  );
}

function PolicyFormDialog({ open, onOpenChange, policy, sessions, terms, onSubmit, formatAmount }) {
  const [formData, setFormData] = useState(policy || {
    policy_name: '',
    description: '',
    grade_level: '',
    session_id: '',
    term_id: '',
    fee_items: JSON.stringify([{ name: 'Tuition', amount: 0, category: 'Academic' }]),
    total_amount: 0,
    late_payment_penalty_rate: 0,
    early_payment_discount_rate: 0,
    early_payment_deadline: '',
    instalment_allowed: false,
    max_instalments: 1,
    status: 'Active',
  });

  const [feeItems, setFeeItems] = useState(
    policy?.fee_items ? JSON.parse(policy.fee_items) : [{ name: 'Tuition', amount: 0, category: 'Academic' }]
  );

  React.useEffect(() => {
    if (policy) {
      setFormData(policy);
      setFeeItems(policy.fee_items ? JSON.parse(policy.fee_items) : []);
    }
  }, [policy, open]);

  const addFeeItem = () => {
    setFeeItems([...feeItems, { name: '', amount: 0, category: 'Other' }]);
  };

  const updateFeeItem = (index, field, value) => {
    const updated = [...feeItems];
    updated[index][field] = value;
    setFeeItems(updated);
    const total = updated.reduce((sum, item) => sum + (parseFloat(item.amount) || 0), 0);
    setFormData({ ...formData, total_amount: total });
  };

  const removeFeeItem = (index) => {
    const updated = feeItems.filter((_, i) => i !== index);
    setFeeItems(updated);
    const total = updated.reduce((sum, item) => sum + (parseFloat(item.amount) || 0), 0);
    setFormData({ ...formData, total_amount: total });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit({ ...formData, fee_items: JSON.stringify(feeItems) });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto bg-white">
        <DialogHeader>
          <DialogTitle className="text-gray-900">{policy ? 'Edit Fee Policy' : 'Create Fee Policy'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Policy Name *</Label>
              <Input value={formData.policy_name} onChange={(e) => setFormData({ ...formData, policy_name: e.target.value })} required />
            </div>
            <div>
              <Label>Grade Level *</Label>
              <Input value={formData.grade_level} onChange={(e) => setFormData({ ...formData, grade_level: e.target.value })} required />
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
          </div>

          <div>
            <Label>Description</Label>
            <Textarea value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} />
          </div>

          <div>
            <div className="flex justify-between items-center mb-2">
              <Label>Fee Items</Label>
              <Button type="button" onClick={addFeeItem} size="sm" variant="outline">
                <Plus className="w-4 h-4 mr-1" />
                Add Item
              </Button>
            </div>
            <div className="space-y-2">
              {feeItems.map((item, idx) => (
                <div key={idx} className="flex gap-2">
                  <Input placeholder="Name" value={item.name} onChange={(e) => updateFeeItem(idx, 'name', e.target.value)} />
                  <Input type="number" placeholder="Amount" value={item.amount} onChange={(e) => updateFeeItem(idx, 'amount', parseFloat(e.target.value) || 0)} />
                  <Input placeholder="Category" value={item.category} onChange={(e) => updateFeeItem(idx, 'category', e.target.value)} />
                  <Button type="button" variant="ghost" size="sm" onClick={() => removeFeeItem(idx)}>
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              ))}
            </div>
            <div className="mt-2 text-right">
              <span className="text-sm text-gray-600">Total: </span>
              <span className="font-bold text-lg">{formatAmount(formData.total_amount)}</span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Late Payment Penalty (%)</Label>
              <Input type="number" step="0.01" value={formData.late_payment_penalty_rate} onChange={(e) => setFormData({ ...formData, late_payment_penalty_rate: parseFloat(e.target.value) || 0 })} />
            </div>
            <div>
              <Label>Early Payment Discount (%)</Label>
              <Input type="number" step="0.01" value={formData.early_payment_discount_rate} onChange={(e) => setFormData({ ...formData, early_payment_discount_rate: parseFloat(e.target.value) || 0 })} />
            </div>
            <div>
              <Label>Early Payment Deadline</Label>
              <Input type="date" value={formData.early_payment_deadline} onChange={(e) => setFormData({ ...formData, early_payment_deadline: e.target.value })} />
            </div>
            <div>
              <Label>Status</Label>
              <Select value={formData.status} onValueChange={(value) => setFormData({ ...formData, status: value })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Active">Active</SelectItem>
                  <SelectItem value="Inactive">Inactive</SelectItem>
                  <SelectItem value="Archived">Archived</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <label className="flex items-center gap-2">
              <input type="checkbox" checked={formData.instalment_allowed} onChange={(e) => setFormData({ ...formData, instalment_allowed: e.target.checked })} />
              <span className="text-sm">Allow Instalment Payment</span>
            </label>
            {formData.instalment_allowed && (
              <div className="flex-1">
                <Label>Max Instalments</Label>
                <Input type="number" min="1" value={formData.max_instalments} onChange={(e) => setFormData({ ...formData, max_instalments: parseInt(e.target.value) || 1 })} />
              </div>
            )}
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button type="submit" className="bg-blue-600 hover:bg-blue-700">{policy ? 'Update' : 'Create'}</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}