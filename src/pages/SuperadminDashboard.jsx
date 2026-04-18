import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate, Link } from 'react-router-dom';
import { createPageUrl } from '../utils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Building2, Users, Plus, Search, Eye, Pencil, CheckCircle, XCircle } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';

const PLAN_COLORS = {
  free: 'bg-gray-100 text-gray-700',
  starter: 'bg-blue-100 text-blue-700',
  pro: 'bg-purple-100 text-purple-700',
  enterprise: 'bg-amber-100 text-amber-700',
};

const PLAN_PRICING = {
  free: 0,
  starter: 99,
  pro: 299,
  enterprise: 999,
};

export default function SuperadminDashboard() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [filterPlan, setFilterPlan] = useState('all');
  const [filterActive, setFilterActive] = useState('all');

  const { data: currentUser, isLoading: loadingUser } = useQuery({
    queryKey: ['current-user-superadmin'],
    queryFn: () => base44.auth.me(),
  });

  const { data: schools = [], isLoading: loadingSchools } = useQuery({
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

  const toggleActiveMutation = useMutation({
    mutationFn: ({ id, is_active }) => base44.entities.SchoolTenant.update(id, { is_active }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['school-tenants'] });
      toast.success('School status updated.');
    },
  });

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
          <p className="text-gray-500 mt-1">You do not have superadmin privileges.</p>
          <Button className="mt-4" onClick={() => navigate(createPageUrl('AdminDashboard'))}>
            Back to Dashboard
          </Button>
        </div>
      </div>
    );
  }

  const planCounts = {
    free: schools.filter(s => s.plan === 'free').length,
    starter: schools.filter(s => s.plan === 'starter').length,
    pro: schools.filter(s => s.plan === 'pro').length,
    enterprise: schools.filter(s => s.plan === 'enterprise').length,
  };

  const activeCount = schools.filter(s => s.is_active).length;

  const filtered = schools.filter(school => {
    const matchSearch = !search || 
      school.name?.toLowerCase().includes(search.toLowerCase()) || 
      school.code?.toLowerCase().includes(search.toLowerCase()) ||
      school.subdomain?.toLowerCase().includes(search.toLowerCase());
    const matchPlan = filterPlan === 'all' || school.plan === filterPlan;
    const matchActive = filterActive === 'all' || (filterActive === 'active' ? school.is_active : !school.is_active);
    return matchSearch && matchPlan && matchActive;
  });

  const getAdminEmail = (adminUserId) => {
    const user = allUsers.find(u => u.id === adminUserId);
    return user?.email || '—';
  };

  const calculateMRR = () => {
    return schools.reduce((total, school) => {
      return total + (PLAN_PRICING[school.plan] || 0);
    }, 0);
  };

  const getSchoolStudentCount = (schoolId) => {
    return allStudents.filter(s => s.school_tenant_id === schoolId).length;
  };

  const topSchoolsByStudents = schools
    .map(s => ({ ...s, studentCount: getSchoolStudentCount(s.id) }))
    .sort((a, b) => b.studentCount - a.studentCount)
    .slice(0, 5);

  const recentlyOnboarded = schools
    .filter(s => s.onboarded_at && new Date(s.onboarded_at) > new Date(Date.now() - 30 * 24 * 60 * 60 * 1000))
    .sort((a, b) => new Date(b.onboarded_at) - new Date(a.onboarded_at));

  const suspendedSchools = schools.filter(s => !s.is_active);

  const summaryCards = [
    { label: 'Total Schools', value: schools.length, icon: Building2, color: 'bg-blue-500' },
    { label: 'Active Schools', value: activeCount, icon: CheckCircle, color: 'bg-green-500' },
    { label: 'Total Users', value: allUsers.length, icon: Users, color: 'bg-purple-500' },
    {
      label: 'Plans',
      value: `${planCounts.pro}P / ${planCounts.enterprise}E`,
      icon: Building2,
      color: 'bg-amber-500',
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Platform Admin</h1>
          <p className="text-gray-500 mt-1">Manage all school tenants on SkoolRise</p>
        </div>
        <Link to={createPageUrl('SuperadminSchoolCreate')}>
          <Button className="bg-blue-600 hover:bg-blue-700 gap-2">
            <Plus className="w-4 h-4" />
            Add New School
          </Button>
        </Link>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {summaryCards.map(card => {
          const Icon = card.icon;
          return (
            <Card key={card.label}>
              <CardContent className="p-5 flex items-center gap-4">
                <div className={`${card.color} p-3 rounded-lg`}>
                  <Icon className="w-5 h-5 text-white" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">{card.label}</p>
                  <p className="text-2xl font-bold text-gray-900">{card.value}</p>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Revenue Overview */}
      <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200">
        <CardHeader>
          <CardTitle className="text-blue-900">Revenue Overview</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <p className="text-sm text-blue-700">Monthly Recurring Revenue</p>
              <p className="text-3xl font-bold text-blue-900">${calculateMRR()}</p>
            </div>
            {Object.entries(planCounts).map(([plan, count]) => (
              <div key={plan}>
                <p className="text-sm text-blue-700 capitalize">{plan} Plan</p>
                <p className="text-2xl font-bold text-blue-900">{count}</p>
                <p className="text-xs text-blue-600">${PLAN_PRICING[plan] * count}/mo</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Top Schools & Recent Onboarded */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Top 5 Schools by Student Count</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {topSchoolsByStudents.map((school, idx) => (
                <div key={school.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <p className="font-medium text-gray-900">#{idx + 1} {school.name}</p>
                    <p className="text-xs text-gray-500">{school.plan.charAt(0).toUpperCase() + school.plan.slice(1)}</p>
                  </div>
                  <span className="font-bold text-lg text-gray-900">{school.studentCount}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recently Onboarded (30 days)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {recentlyOnboarded.length === 0 ? (
                <p className="text-sm text-gray-500">No new schools in the last 30 days.</p>
              ) : (
                recentlyOnboarded.map((school) => (
                  <div key={school.id} className="flex items-center justify-between p-3 bg-green-50 rounded-lg border border-green-200">
                    <div>
                      <p className="font-medium text-gray-900">{school.name}</p>
                      <p className="text-xs text-gray-500">{format(new Date(school.onboarded_at), 'dd MMM yyyy')}</p>
                    </div>
                    <Badge className={PLAN_COLORS[school.plan]}>{school.plan}</Badge>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* At-Risk Schools */}
      {suspendedSchools.length > 0 && (
        <Card className="border-red-200 bg-red-50">
          <CardHeader>
            <CardTitle className="text-red-900">At-Risk / Suspended Schools ({suspendedSchools.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {suspendedSchools.map((school) => (
                <div key={school.id} className="flex items-center justify-between p-3 bg-white rounded-lg border border-red-200">
                  <div>
                    <p className="font-medium text-gray-900">{school.name}</p>
                    <p className="text-xs text-gray-500">Deactivated</p>
                  </div>
                  <Link to={`${createPageUrl('SuperadminSchoolEdit')}?id=${school.id}`}>
                    <Button size="sm" variant="outline" className="text-red-600 border-red-200">Reactivate</Button>
                  </Link>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Plan breakdown */}
      <div className="flex gap-3 flex-wrap">
        {Object.entries(planCounts).map(([plan, count]) => (
          <Badge key={plan} className={PLAN_COLORS[plan]}>
            {plan}: {count}
          </Badge>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input
            placeholder="Search by name, code, or subdomain..."
            className="pl-9"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <Select value={filterPlan} onValueChange={setFilterPlan}>
          <SelectTrigger className="w-36">
            <SelectValue placeholder="Plan" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Plans</SelectItem>
            <SelectItem value="free">Free</SelectItem>
            <SelectItem value="starter">Starter</SelectItem>
            <SelectItem value="pro">Pro</SelectItem>
            <SelectItem value="enterprise">Enterprise</SelectItem>
          </SelectContent>
        </Select>
        <Select value={filterActive} onValueChange={setFilterActive}>
          <SelectTrigger className="w-36">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="inactive">Inactive</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Schools Table */}
      <Card>
        <CardHeader>
          <CardTitle>Schools ({filtered.length})</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {loadingSchools ? (
            <div className="p-8 text-center text-gray-400">Loading schools...</div>
          ) : filtered.length === 0 ? (
            <div className="p-8 text-center text-gray-400">No schools found.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    {['Name', 'Code', 'Subdomain', 'Plan', 'Active', 'Onboarded', 'Admin Email', 'Actions'].map(h => (
                      <th key={h} className="text-left px-4 py-3 text-gray-600 font-medium">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {filtered.map(school => (
                    <tr key={school.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 font-medium text-gray-900">{school.name}</td>
                      <td className="px-4 py-3 text-gray-500 font-mono text-xs">{school.code || '—'}</td>
                      <td className="px-4 py-3 text-gray-500 font-mono text-xs">{school.subdomain ? `${school.subdomain}.skolorise-main.base44.app` : '—'}</td>
                      <td className="px-4 py-3">
                        <Badge className={PLAN_COLORS[school.plan] || 'bg-gray-100 text-gray-700'}>
                          {school.plan || 'free'}
                        </Badge>
                      </td>
                      <td className="px-4 py-3">
                        <Switch
                          checked={!!school.is_active}
                          onCheckedChange={checked =>
                            toggleActiveMutation.mutate({ id: school.id, is_active: checked })
                          }
                        />
                      </td>
                      <td className="px-4 py-3 text-gray-500 text-xs">
                        {school.onboarded_at ? format(new Date(school.onboarded_at), 'dd MMM yyyy') : '—'}
                      </td>
                      <td className="px-4 py-3 text-gray-500 text-xs">{getAdminEmail(school.admin_user_id)}</td>
                      <td className="px-4 py-3">
                        <div className="flex gap-2">
                          <Link to={`${createPageUrl('SuperadminSchoolView')}?id=${school.id}`}>
                            <Button variant="ghost" size="sm"><Eye className="w-4 h-4" /></Button>
                          </Link>
                          <Link to={`${createPageUrl('SuperadminSchoolEdit')}?id=${school.id}`}>
                            <Button variant="ghost" size="sm"><Pencil className="w-4 h-4" /></Button>
                          </Link>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}