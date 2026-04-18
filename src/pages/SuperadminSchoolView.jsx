import React from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { useNavigate, Link } from 'react-router-dom';
import { createPageUrl } from '../utils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Users, GraduationCap, User, Pencil, XCircle, CheckCircle } from 'lucide-react';
import { format } from 'date-fns';

const PLAN_COLORS = {
  free: 'bg-gray-100 text-gray-700',
  starter: 'bg-blue-100 text-blue-700',
  pro: 'bg-purple-100 text-purple-700',
  enterprise: 'bg-amber-100 text-amber-700',
};

export default function SuperadminSchoolView() {
  const navigate = useNavigate();
  const urlParams = new URLSearchParams(window.location.search);
  const schoolId = urlParams.get('id');

  const { data: currentUser, isLoading: loadingUser } = useQuery({
    queryKey: ['current-user-superadmin'],
    queryFn: () => base44.auth.me(),
  });

  const { data: schools = [], isLoading: loadingSchool } = useQuery({
    queryKey: ['school-tenants'],
    queryFn: () => base44.entities.SchoolTenant.list(),
    enabled: !!currentUser?.is_superadmin,
  });

  const { data: allUsers = [] } = useQuery({
    queryKey: ['all-users-superadmin'],
    queryFn: () => base44.entities.User.list(),
    enabled: !!currentUser?.is_superadmin,
  });

  const { data: allStudents = [] } = useQuery({
    queryKey: ['all-students-superadmin'],
    queryFn: () => base44.entities.Student.list(),
    enabled: !!currentUser?.is_superadmin,
  });

  const { data: allTeachers = [] } = useQuery({
    queryKey: ['all-teachers-superadmin'],
    queryFn: () => base44.entities.Teacher.list(),
    enabled: !!currentUser?.is_superadmin,
  });

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

  const school = schools.find(s => s.id === schoolId);
  if (!school) {
    return <div className="p-8 text-center text-gray-400">School not found.</div>;
  }

  const schoolUsers = allUsers.filter(u => u.school_tenant_id === schoolId);
  const adminUser = allUsers.find(u => u.id === school.admin_user_id);

  const detail = (label, value) => (
    <div key={label}>
      <p className="text-xs text-gray-400 uppercase tracking-wide">{label}</p>
      <p className="text-sm font-medium text-gray-800 mt-0.5">{value || '—'}</p>
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">{school.name}</h1>
          <p className="text-gray-500 mt-1">Code: {school.code} · {school.subdomain}</p>
        </div>
        <div className="flex gap-3">
          <Link to={`${createPageUrl('SuperadminSchoolEdit')}?id=${school.id}`}>
            <Button variant="outline" className="gap-2">
              <Pencil className="w-4 h-4" />
              Edit
            </Button>
          </Link>
          <Button variant="outline" onClick={() => navigate(createPageUrl('SuperadminDashboard'))}>
            Back
          </Button>
        </div>
      </div>

      {/* School Info */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>School Details</CardTitle>
            <div className="flex gap-2">
              <Badge className={PLAN_COLORS[school.plan] || 'bg-gray-100 text-gray-700'}>
                {school.plan || 'free'}
              </Badge>
              <Badge className={school.is_active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}>
                {school.is_active ? 'Active' : 'Inactive'}
              </Badge>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-5">
            {detail('School Type', school.school_type)}
            {detail('Student Range', school.student_count_range)}
            {detail('Address', school.address)}
            {detail('Phone', school.phone)}
            {detail('Email', school.email)}
            {detail('Onboarded', school.onboarded_at ? format(new Date(school.onboarded_at), 'dd MMM yyyy') : null)}
          </div>
          {school.notes && (
            <div className="mt-4 p-3 bg-gray-50 rounded-lg text-sm text-gray-600">
              <strong>Notes:</strong> {school.notes}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Admin Info */}
      <Card>
        <CardHeader><CardTitle>Primary Administrator</CardTitle></CardHeader>
        <CardContent>
          {adminUser ? (
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                <User className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="font-medium text-gray-900">{adminUser.full_name || 'No name set'}</p>
                <p className="text-sm text-gray-500">{adminUser.email}</p>
              </div>
            </div>
          ) : (
            <p className="text-gray-400 text-sm">No admin linked yet.</p>
          )}
        </CardContent>
      </Card>

      {/* Summary Counts */}
      <div className="grid grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-5 flex items-center gap-3">
            <Users className="w-8 h-8 text-blue-500" />
            <div>
              <p className="text-2xl font-bold">{schoolUsers.length}</p>
              <p className="text-sm text-gray-500">Users</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5 flex items-center gap-3">
            <GraduationCap className="w-8 h-8 text-purple-500" />
            <div>
              <p className="text-2xl font-bold">{allStudents.length}</p>
              <p className="text-sm text-gray-500">Students (all)</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5 flex items-center gap-3">
            <User className="w-8 h-8 text-green-500" />
            <div>
              <p className="text-2xl font-bold">{allTeachers.length}</p>
              <p className="text-sm text-gray-500">Teachers (all)</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Users Table */}
      <Card>
        <CardHeader><CardTitle>Users linked to this school ({schoolUsers.length})</CardTitle></CardHeader>
        <CardContent className="p-0">
          {schoolUsers.length === 0 ? (
            <div className="p-8 text-center text-gray-400">No users linked to this school yet.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    {['Name', 'Email', 'Type', 'Activated'].map(h => (
                      <th key={h} className="text-left px-4 py-3 text-gray-600 font-medium">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {schoolUsers.map(u => (
                    <tr key={u.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 font-medium text-gray-900">{u.full_name || '—'}</td>
                      <td className="px-4 py-3 text-gray-500">{u.email}</td>
                      <td className="px-4 py-3">
                        <Badge variant="outline">{u.user_type || '—'}</Badge>
                      </td>
                      <td className="px-4 py-3">
                        {u.is_activated
                          ? <CheckCircle className="w-4 h-4 text-green-500" />
                          : <XCircle className="w-4 h-4 text-gray-300" />}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg text-sm text-amber-700">
        <strong>Future Feature:</strong> "Login as Admin" — impersonation of school admin for support purposes.
      </div>
    </div>
  );
}