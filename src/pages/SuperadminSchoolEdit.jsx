import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '../utils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, XCircle, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';

export default function SuperadminSchoolEdit() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const urlParams = new URLSearchParams(window.location.search);
  const schoolId = urlParams.get('id');

  const [form, setForm] = useState(null);
  const [confirmDeactivate, setConfirmDeactivate] = useState(false);

  const { data: currentUser, isLoading: loadingUser } = useQuery({
    queryKey: ['current-user-superadmin'],
    queryFn: () => base44.auth.me(),
  });

  const { data: schools = [], isLoading: loadingSchool } = useQuery({
    queryKey: ['school-tenants'],
    queryFn: () => base44.entities.SchoolTenant.list(),
    enabled: !!currentUser?.is_superadmin,
  });

  const school = schools.find(s => s.id === schoolId);

  useEffect(() => {
    if (school && !form) {
      setForm({
        name: school.name || '',
        plan: school.plan || 'free',
        is_active: school.is_active ?? true,
        address: school.address || '',
        phone: school.phone || '',
        email: school.email || '',
        settings: school.settings || '',
        notes: school.notes || '',
      });
    }
  }, [school]);

  const saveMutation = useMutation({
    mutationFn: (data) => base44.entities.SchoolTenant.update(schoolId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['school-tenants'] });
      toast.success('School updated successfully.');
      navigate(createPageUrl('SuperadminDashboard'));
    },
  });

  const set = (field, value) => setForm(prev => ({ ...prev, [field]: value }));

  const handleSave = (e) => {
    e.preventDefault();
    saveMutation.mutate(form);
  };

  const handleDeactivate = () => {
    saveMutation.mutate({ is_active: false });
  };

  if (loadingUser || loadingSchool) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600" />
      </div>
    );
  }

  if (!currentUser?.is_superadmin) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <XCircle className="w-12 h-12 text-red-500 mx-auto mb-3" />
          <h2 className="text-xl font-bold">Access Denied</h2>
          <Button className="mt-4" onClick={() => navigate(createPageUrl('AdminDashboard'))}>Back</Button>
        </div>
      </div>
    );
  }

  if (!school || !form) {
    return <div className="p-8 text-center text-gray-400">School not found.</div>;
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Edit School</h1>
        <p className="text-gray-500 mt-1">{school.name} · {school.code}</p>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        <Card>
          <CardHeader><CardTitle>School Details</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>School Name</Label>
              <Input value={form.name} onChange={e => set('name', e.target.value)} />
            </div>
            <div>
              <Label>Plan</Label>
              <Select value={form.plan} onValueChange={v => set('plan', v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {['free', 'starter', 'pro', 'enterprise'].map(p => (
                    <SelectItem key={p} value={p}>{p.charAt(0).toUpperCase() + p.slice(1)}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center gap-3">
              <Switch checked={form.is_active} onCheckedChange={v => set('is_active', v)} />
              <Label>Active</Label>
            </div>
            <div>
              <Label>Address</Label>
              <Input value={form.address} onChange={e => set('address', e.target.value)} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Phone</Label>
                <Input value={form.phone} onChange={e => set('phone', e.target.value)} />
              </div>
              <div>
                <Label>Email</Label>
                <Input value={form.email} onChange={e => set('email', e.target.value)} />
              </div>
            </div>
            <div>
              <Label>Settings (JSON)</Label>
              <Input value={form.settings} onChange={e => set('settings', e.target.value)} placeholder='{"currency":"GBP"}' />
            </div>
            <div>
              <Label>Notes</Label>
              <Input value={form.notes} onChange={e => set('notes', e.target.value)} />
            </div>
          </CardContent>
        </Card>

        <div className="flex gap-3 justify-between">
          <div className="flex gap-3">
            <Button type="submit" disabled={saveMutation.isPending} className="bg-blue-600 hover:bg-blue-700">
              {saveMutation.isPending ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Saving...</> : 'Save Changes'}
            </Button>
            <Button type="button" variant="outline" onClick={() => navigate(createPageUrl('SuperadminDashboard'))}>
              Cancel
            </Button>
          </div>

          {!confirmDeactivate ? (
            <Button type="button" variant="outline" className="text-red-600 border-red-200 hover:bg-red-50"
              onClick={() => setConfirmDeactivate(true)}>
              Deactivate School
            </Button>
          ) : (
            <div className="flex items-center gap-2">
              <span className="text-sm text-red-600">Are you sure?</span>
              <Button type="button" size="sm" className="bg-red-600 hover:bg-red-700" onClick={handleDeactivate}>
                Yes, Deactivate
              </Button>
              <Button type="button" size="sm" variant="outline" onClick={() => setConfirmDeactivate(false)}>
                Cancel
              </Button>
            </div>
          )}
        </div>
      </form>
    </div>
  );
}