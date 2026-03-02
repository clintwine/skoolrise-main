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
import { DollarSign, Plus, CheckCircle, Clock, Edit } from 'lucide-react';
import { format } from 'date-fns';
import { useCurrency } from '@/components/CurrencyProvider';
import useIsMobile from '../components/hooks/useIsMobile';
import MobileHeader from '../components/mobile/MobileHeader';
import MobileTable, { MobileTableRow } from '../components/mobile/MobileTable';
import { MobileStatCard } from '../components/mobile/MobileCard';
import MobileDialog from '../components/mobile/MobileDialog';
import { MobileInput, MobileSelect, MobileFormActions } from '../components/mobile/MobileForm';

export default function SalaryManagement() {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingSalary, setEditingSalary] = useState(null);
  const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().substring(0, 7));
  const queryClient = useQueryClient();
  const { formatAmount } = useCurrency();

  const { data: salaries = [] } = useQuery({
    queryKey: ['salaries', selectedMonth],
    queryFn: async () => {
      const all = await base44.entities.Salary.list('-created_date');
      return all.filter(s => s.month === selectedMonth);
    },
  });

  const { data: teachers = [] } = useQuery({
    queryKey: ['teachers'],
    queryFn: () => base44.entities.Teacher.list(),
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.Salary.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['salaries'] });
      setIsFormOpen(false);
      setEditingSalary(null);
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Salary.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['salaries'] });
      setIsFormOpen(false);
      setEditingSalary(null);
    },
  });

  const handleSubmit = (data) => {
    if (editingSalary) {
      updateMutation.mutate({ id: editingSalary.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const statusColors = {
    Pending: 'bg-orange-100 text-orange-800',
    Paid: 'bg-green-100 text-green-800',
    Cancelled: 'bg-red-100 text-red-800',
  };

  const totalPending = salaries.filter(s => s.status === 'Pending').reduce((sum, s) => sum + s.net_salary, 0);
  const totalPaid = salaries.filter(s => s.status === 'Paid').reduce((sum, s) => sum + s.net_salary, 0);

  const isMobile = useIsMobile();

  // Mobile View
  if (isMobile) {
    return (
      <div className="p-4 pb-24">
        <MobileHeader
          title="Salaries"
          subtitle={format(new Date(selectedMonth + '-01'), 'MMMM yyyy')}
          onAdd={() => { setEditingSalary(null); setIsFormOpen(true); }}
          addLabel="Add"
        />

        {/* Month Selector */}
        <input
          type="month"
          value={selectedMonth}
          onChange={(e) => setSelectedMonth(e.target.value)}
          className="w-full px-4 py-3 border rounded-lg mb-4 text-base"
        />

        {/* Stats */}
        <div className="grid grid-cols-3 gap-2 mb-4">
          <MobileStatCard title="Pending" value={formatAmount(totalPending)} icon={Clock} color="orange" />
          <MobileStatCard title="Paid" value={formatAmount(totalPaid)} icon={CheckCircle} color="green" />
          <MobileStatCard title="Total" value={formatAmount(totalPending + totalPaid)} icon={DollarSign} color="blue" />
        </div>

        <MobileTable
          data={salaries}
          emptyMessage="No salary records for this month"
          renderItem={(salary) => (
            <MobileTableRow
              key={salary.id}
              primary={salary.teacher_name}
              secondary={`Net: ${formatAmount(salary.net_salary)}`}
              tertiary={salary.payment_date ? `Paid: ${format(new Date(salary.payment_date), 'MMM d')}` : 'Pending'}
              badge={salary.status}
              badgeVariant={salary.status === 'Paid' ? 'default' : 'secondary'}
              icon={DollarSign}
              actions={[
                { label: 'Edit', icon: Edit, onClick: () => { setEditingSalary(salary); setIsFormOpen(true); } },
              ]}
            />
          )}
        />

        <SalaryFormDialog
          open={isFormOpen}
          onOpenChange={setIsFormOpen}
          salary={editingSalary}
          teachers={teachers}
          onSubmit={handleSubmit}
          isMobile={true}
        />
      </div>
    );
  }

  // Desktop View
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Salary Management</h1>
          <p className="text-gray-600 mt-1">Manage staff salaries and payments</p>
        </div>
        <Button onClick={() => { setEditingSalary(null); setIsFormOpen(true); }} className="bg-blue-600 hover:bg-blue-700">
          <Plus className="w-4 h-4 mr-2" />
          Add Salary
        </Button>
      </div>

      <div className="flex gap-4">
        <input
          type="month"
          value={selectedMonth}
          onChange={(e) => setSelectedMonth(e.target.value)}
          className="px-4 py-2 border rounded-lg"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-white shadow-md">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Pending</p>
                <p className="text-2xl font-bold text-orange-600">{formatAmount(totalPending)}</p>
              </div>
              <Clock className="w-8 h-8 text-orange-600" />
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
                <p className="text-sm text-gray-600">Total Payroll</p>
                <p className="text-2xl font-bold text-blue-600">{formatAmount(totalPending + totalPaid)}</p>
              </div>
              <DollarSign className="w-8 h-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="bg-white shadow-md">
        <CardHeader>
          <CardTitle>Salary Records</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Teacher</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Basic Salary</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Allowances</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Deductions</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Net Salary</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Payment Date</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {salaries.map((salary) => (
                  <tr key={salary.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 text-sm font-medium text-gray-900">{salary.teacher_name}</td>
                    <td className="px-6 py-4 text-sm text-gray-900">{formatAmount(salary.basic_salary)}</td>
                    <td className="px-6 py-4 text-sm text-green-600">{formatAmount(salary.allowances)}</td>
                    <td className="px-6 py-4 text-sm text-red-600">{formatAmount(salary.deductions)}</td>
                    <td className="px-6 py-4 text-sm font-bold text-blue-600">{formatAmount(salary.net_salary)}</td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {salary.payment_date ? format(new Date(salary.payment_date), 'MMM d, yyyy') : '-'}
                    </td>
                    <td className="px-6 py-4">
                      <Badge className={statusColors[salary.status]}>{salary.status}</Badge>
                    </td>
                    <td className="px-6 py-4">
                      <Button variant="outline" size="sm" onClick={() => { setEditingSalary(salary); setIsFormOpen(true); }}>
                        Edit
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <SalaryFormDialog
        open={isFormOpen}
        onOpenChange={setIsFormOpen}
        salary={editingSalary}
        teachers={teachers}
        onSubmit={handleSubmit}
      />
    </div>
  );
}

function SalaryFormDialog({ open, onOpenChange, salary, teachers, onSubmit, isMobile = false }) {
  const [formData, setFormData] = React.useState(salary || {
    teacher_id: '',
    teacher_name: '',
    month: new Date().toISOString().substring(0, 7),
    basic_salary: 0,
    allowances: 0,
    deductions: 0,
    net_salary: 0,
    payment_date: '',
    payment_method: 'Bank Transfer',
    status: 'Pending',
    notes: '',
  });

  React.useEffect(() => {
    if (salary) {
      setFormData(salary);
    }
  }, [salary, open]);

  React.useEffect(() => {
    const net = parseFloat(formData.basic_salary || 0) + parseFloat(formData.allowances || 0) - parseFloat(formData.deductions || 0);
    setFormData(prev => ({ ...prev, net_salary: net }));
  }, [formData.basic_salary, formData.allowances, formData.deductions]);

  const handleTeacherChange = (teacherId) => {
    const teacher = teachers.find(t => t.id === teacherId);
    setFormData({ ...formData, teacher_id: teacherId, teacher_name: teacher ? `${teacher.first_name} ${teacher.last_name}` : '' });
  };

  const handleSubmit = (e) => {
    e?.preventDefault?.();
    onSubmit(formData);
  };

  if (isMobile) {
    return (
      <MobileDialog open={open} onOpenChange={onOpenChange} title={salary ? 'Edit Salary' : 'Add Salary'}>
        <div className="space-y-4">
          <MobileSelect
            label="Teacher"
            required
            value={formData.teacher_id}
            onValueChange={handleTeacherChange}
            placeholder="Select teacher"
            options={teachers.map(t => ({ value: t.id, label: `${t.first_name} ${t.last_name}` }))}
          />
          <MobileInput
            label="Basic Salary"
            required
            type="number"
            value={formData.basic_salary}
            onChange={(e) => setFormData({ ...formData, basic_salary: parseFloat(e.target.value) })}
          />
          <MobileInput
            label="Allowances"
            type="number"
            value={formData.allowances}
            onChange={(e) => setFormData({ ...formData, allowances: parseFloat(e.target.value) })}
          />
          <MobileInput
            label="Deductions"
            type="number"
            value={formData.deductions}
            onChange={(e) => setFormData({ ...formData, deductions: parseFloat(e.target.value) })}
          />
          <MobileSelect
            label="Status"
            value={formData.status}
            onValueChange={(value) => setFormData({ ...formData, status: value })}
            options={[
              { value: 'Pending', label: 'Pending' },
              { value: 'Paid', label: 'Paid' },
              { value: 'Cancelled', label: 'Cancelled' },
            ]}
          />
          <MobileFormActions
            onCancel={() => onOpenChange(false)}
            onSubmit={handleSubmit}
            submitLabel={salary ? 'Update' : 'Create'}
          />
        </div>
      </MobileDialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl bg-white">
        <DialogHeader>
          <DialogTitle className="text-gray-900">{salary ? 'Edit Salary' : 'Add Salary'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Teacher *</Label>
              <Select value={formData.teacher_id} onValueChange={handleTeacherChange} required>
                <SelectTrigger>
                  <SelectValue placeholder="Select teacher" />
                </SelectTrigger>
                <SelectContent>
                  {teachers.map(t => (
                    <SelectItem key={t.id} value={t.id}>{t.first_name} {t.last_name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Month *</Label>
              <Input type="month" value={formData.month} onChange={(e) => setFormData({ ...formData, month: e.target.value })} required />
            </div>
            <div>
              <Label>Basic Salary *</Label>
              <Input type="number" value={formData.basic_salary} onChange={(e) => setFormData({ ...formData, basic_salary: parseFloat(e.target.value) })} required />
            </div>
            <div>
              <Label>Allowances</Label>
              <Input type="number" value={formData.allowances} onChange={(e) => setFormData({ ...formData, allowances: parseFloat(e.target.value) })} />
            </div>
            <div>
              <Label>Deductions</Label>
              <Input type="number" value={formData.deductions} onChange={(e) => setFormData({ ...formData, deductions: parseFloat(e.target.value) })} />
            </div>
            <div>
              <Label>Net Salary</Label>
              <Input type="number" value={formData.net_salary} readOnly className="bg-gray-100" />
            </div>
            <div>
              <Label>Payment Date</Label>
              <Input type="date" value={formData.payment_date} onChange={(e) => setFormData({ ...formData, payment_date: e.target.value })} />
            </div>
            <div>
              <Label>Status</Label>
              <Select value={formData.status} onValueChange={(value) => setFormData({ ...formData, status: value })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Pending">Pending</SelectItem>
                  <SelectItem value="Paid">Paid</SelectItem>
                  <SelectItem value="Cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button type="submit" className="bg-blue-600 hover:bg-blue-700">{salary ? 'Update' : 'Create'}</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}