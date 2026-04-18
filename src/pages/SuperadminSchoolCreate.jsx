import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '../utils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CheckCircle, XCircle, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

function generateCode(name) {
  const words = name.trim().toUpperCase().split(/\s+/);
  const prefix = words.length >= 2
    ? words[0].slice(0, 2) + words[1].slice(0, 1)
    : words[0].slice(0, 3);
  const num = String(Math.floor(100 + Math.random() * 900));
  return prefix + num;
}

export default function SuperadminSchoolCreate() {
  const navigate = useNavigate();
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(null);
  const [error, setError] = useState(null);

  const [form, setForm] = useState({
    name: '',
    code: '',
    subdomain: '',
    school_type: '',
    student_count_range: '',
    plan: 'free',
    address: '',
    phone: '',
    email: '',
    notes: '',
    admin_name: '',
    admin_email: '',
  });

  const { data: currentUser, isLoading: loadingUser } = useQuery({
    queryKey: ['current-user-superadmin'],
    queryFn: () => base44.auth.me(),
  });

  const set = (field, value) => setForm(prev => ({ ...prev, [field]: value }));

  const handleNameBlur = () => {
    if (form.name && !form.code) {
      set('code', generateCode(form.name));
    }
    if (form.name && !form.subdomain) {
      set('subdomain', form.name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, ''));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    if (!form.name || !form.code || !form.admin_email || !form.admin_name) {
      setError('School name, code, admin name, and admin email are required.');
      return;
    }

    setSubmitting(true);
    try {
      // 1. Create the SchoolTenant record
      const school = await base44.entities.SchoolTenant.create({
        name: form.name,
        code: form.code,
        subdomain: form.subdomain,
        school_type: form.school_type || undefined,
        student_count_range: form.student_count_range || undefined,
        plan: form.plan,
        address: form.address,
        phone: form.phone,
        email: form.email,
        notes: form.notes,
        is_active: true,
        onboarded_at: new Date().toISOString(),
      });

      // 2. Invite the admin user
      await base44.users.inviteUser(form.admin_email, 'admin');

      // 3. Wait briefly then find the new user record to update
      await new Promise(res => setTimeout(res, 1500));

      const users = await base44.entities.User.list();
      const newUser = users.find(u => u.email === form.admin_email);

      if (newUser) {
        // 4. Only set school_tenant_id if user doesn't already have one (multi-school safe)
        const updateData = { user_type: 'admin', is_activated: true };
        if (!newUser.school_tenant_id) {
          updateData.school_tenant_id = school.id;
        }
        await base44.entities.User.update(newUser.id, updateData);

        // 5. Update SchoolTenant with admin_user_id
        await base44.entities.SchoolTenant.update(school.id, {
          admin_user_id: newUser.id,
        });

        // 6. Create UserSchoolMembership (check for duplicates first)
        const existingMemberships = await base44.entities.UserSchoolMembership.filter({
          user_id: newUser.id,
          school_tenant_id: school.id,
        });
        if (existingMemberships.length === 0) {
          await base44.entities.UserSchoolMembership.create({
            user_id: newUser.id,
            school_tenant_id: school.id,
            role: 'admin',
            is_active: true,
            invited_at: new Date().toISOString(),
          });
        }
      }

      setSuccess({
        schoolName: form.name,
        code: form.code,
        adminEmail: form.admin_email,
      });
      toast.success(`School "${form.name}" created successfully!`);

      setTimeout(() => navigate(createPageUrl('SuperadminDashboard')), 2500);
    } catch (err) {
      setError(err.message || 'Failed to create school. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loadingUser) {
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
          <h2 className="text-xl font-bold text-gray-900">Access Denied</h2>
          <Button className="mt-4" onClick={() => navigate(createPageUrl('AdminDashboard'))}>Back</Button>
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="max-w-lg mx-auto mt-20 text-center">
        <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-gray-900">School Created!</h2>
        <p className="text-gray-600 mt-2"><strong>{success.schoolName}</strong> ({success.code})</p>
        <p className="text-gray-500 mt-1">Invitation sent to {success.adminEmail}</p>
        <p className="text-sm text-gray-400 mt-4">Redirecting to dashboard...</p>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Onboard New School</h1>
        <p className="text-gray-500 mt-1">Add a new school tenant to the platform</p>
      </div>

      {error && (
        <Alert className="bg-red-50 border-red-200">
          <AlertDescription className="text-red-700">{error}</AlertDescription>
        </Alert>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card>
          <CardHeader><CardTitle>School Details</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>School Name *</Label>
              <Input
                value={form.name}
                onChange={e => set('name', e.target.value)}
                onBlur={handleNameBlur}
                placeholder="e.g. Greenwood Academy"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>School Code *</Label>
                <Input
                  value={form.code}
                  onChange={e => set('code', e.target.value.toUpperCase())}
                  placeholder="e.g. GRN001"
                />
              </div>
              <div>
                <Label>Subdomain</Label>
                <Input
                  value={form.subdomain}
                  onChange={e => set('subdomain', e.target.value.toLowerCase())}
                  placeholder="e.g. greenwood"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>School Type</Label>
                <Select value={form.school_type} onValueChange={v => set('school_type', v)}>
                  <SelectTrigger><SelectValue placeholder="Select type" /></SelectTrigger>
                  <SelectContent>
                    {['Primary', 'Secondary', 'Mixed', 'Nursery', 'College'].map(t => (
                      <SelectItem key={t} value={t}>{t}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Student Count Range</Label>
                <Select value={form.student_count_range} onValueChange={v => set('student_count_range', v)}>
                  <SelectTrigger><SelectValue placeholder="Select range" /></SelectTrigger>
                  <SelectContent>
                    {['1-100', '101-300', '301-700', '701-1500', '1500+'].map(r => (
                      <SelectItem key={r} value={r}>{r}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
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
            <div>
              <Label>Address</Label>
              <Input value={form.address} onChange={e => set('address', e.target.value)} placeholder="School address" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Phone</Label>
                <Input value={form.phone} onChange={e => set('phone', e.target.value)} placeholder="+44..." />
              </div>
              <div>
                <Label>School Email</Label>
                <Input value={form.email} onChange={e => set('email', e.target.value)} placeholder="info@school.com" />
              </div>
            </div>
            <div>
              <Label>Notes</Label>
              <Input value={form.notes} onChange={e => set('notes', e.target.value)} placeholder="Internal notes" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>School Administrator</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>Admin Full Name *</Label>
              <Input value={form.admin_name} onChange={e => set('admin_name', e.target.value)} placeholder="e.g. John Doe" />
            </div>
            <div>
              <Label>Admin Email *</Label>
              <Input type="email" value={form.admin_email} onChange={e => set('admin_email', e.target.value)} placeholder="admin@school.com" />
            </div>
            <p className="text-xs text-gray-400">
              An invitation will be sent to this email. The user will be set up as the school's admin.
            </p>
          </CardContent>
        </Card>

        <div className="flex gap-3">
          <Button type="submit" disabled={submitting} className="bg-blue-600 hover:bg-blue-700">
            {submitting ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Creating...</> : 'Create School'}
          </Button>
          <Button type="button" variant="outline" onClick={() => navigate(createPageUrl('SuperadminDashboard'))}>
            Cancel
          </Button>
        </div>
      </form>
    </div>
  );
}