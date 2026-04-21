import React, { useEffect, useMemo, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '../utils';
import { FEATURE_REGISTRY } from '@/utils/planFeatures';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Textarea } from '@/components/ui/textarea';
import { ChevronDown, ChevronRight, Loader2, XCircle } from 'lucide-react';
import { toast } from 'sonner';

const PLAN_LABELS = { starter: 'Starter', growth: 'Growth', professional: 'Professional', elite: 'Elite' };
const TIER_BADGE_CLASSES = {
  Starter: 'bg-[#E1F5EE] text-[#0F6E56]',
  Growth: 'bg-[#E6F1FB] text-[#185FA5]',
  Professional: 'bg-[#EEEDFE] text-[#534AB7]',
  Elite: 'bg-[#FAEEDA] text-[#854F0B]',
};
const MODULE_ORDER = ['core', 'academics', 'exams', 'fees', 'communication', 'hr', 'analytics', 'ai', 'advanced', 'commerce', 'gamification'];

function getFeatureDefault(featureId, plan) {
  return FEATURE_REGISTRY[featureId]?.[plan] ?? false;
}
function getMinimumTierLabel(feature) {
  const order = ['starter', 'growth', 'professional', 'elite'];
  const found = order.find(k => feature[k] === true);
  return found ? PLAN_LABELS[found] : null;
}

export default function SuperadminSchoolEdit() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const urlParams = new URLSearchParams(window.location.search);
  const schoolId = urlParams.get('id');
  const initialTab = urlParams.get('tab') === 'features' ? 'features' : 'details';

  const [activeTab, setActiveTab] = useState(initialTab);
  const [detailsForm, setDetailsForm] = useState(null);
  const [featureSearch, setFeatureSearch] = useState('');
  const [featureFilter, setFeatureFilter] = useState('all');
  const [confirmDeactivate, setConfirmDeactivate] = useState(false);
  const [moduleOpen, setModuleOpen] = useState(Object.fromEntries(MODULE_ORDER.map(m => [m, true])));
  const [draftOverrides, setDraftOverrides] = useState({});
  const [savedOverrides, setSavedOverrides] = useState({});

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
    if (school && !detailsForm) {
      setDetailsForm({
        name: school.name || '',
        subdomain: school.subdomain || '',
        plan: school.plan || 'starter',
        is_active: school.is_active ?? true,
        address: school.address || '',
        phone: school.phone || '',
        email: school.email || '',
        notes: school.notes || '',
      });
      let parsed = {};
      try { parsed = JSON.parse(school.feature_overrides || '{}'); } catch {}
      setDraftOverrides(parsed);
      setSavedOverrides(parsed);
    }
  }, [school, detailsForm]);

  const saveDetailsMutation = useMutation({
    mutationFn: (data) => base44.entities.SchoolTenant.update(schoolId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['school-tenants'] });
      toast.success('School details updated');
    },
  });

  const saveOverridesMutation = useMutation({
    mutationFn: (feature_overrides) => base44.entities.SchoolTenant.update(schoolId, { feature_overrides: JSON.stringify(feature_overrides) }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['school-tenants'] });
      setSavedOverrides(draftOverrides);
      toast.success('Feature overrides saved');
    },
  });

  const resetOverridesMutation = useMutation({
    mutationFn: () => base44.entities.SchoolTenant.update(schoolId, { feature_overrides: '' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['school-tenants'] });
      setDraftOverrides({});
      setSavedOverrides({});
      toast.success('All overrides cleared');
    },
  });

  const hasUnsavedChanges = JSON.stringify(draftOverrides) !== JSON.stringify(savedOverrides);
  const pendingChangesCount = useMemo(() => {
    const keys = new Set([...Object.keys(draftOverrides), ...Object.keys(savedOverrides)]);
    return [...keys].filter(k => draftOverrides[k] !== savedOverrides[k]).length;
  }, [draftOverrides, savedOverrides]);

  const groupedFeatures = useMemo(() => {
    const entries = Object.entries(FEATURE_REGISTRY).map(([id, feature]) => {
      const minimumTier = getMinimumTierLabel(feature);
      const defaultEnabled = getFeatureDefault(id, detailsForm?.plan || 'starter');
      const overrideValue = Object.prototype.hasOwnProperty.call(draftOverrides, id) ? draftOverrides[id] : null;
      const effectiveEnabled = overrideValue === null ? defaultEnabled : overrideValue;
      const isOverridden = overrideValue !== null;
      return { id, feature, minimumTier, defaultEnabled, overrideValue, effectiveEnabled, isOverridden };
    }).filter(item => {
      const matchesSearch = item.feature.label.toLowerCase().includes(featureSearch.toLowerCase());
      const matchesFilter = featureFilter === 'all'
        || (featureFilter === 'enabled' && item.effectiveEnabled)
        || (featureFilter === 'disabled' && !item.effectiveEnabled)
        || (featureFilter === 'overridden' && item.isOverridden);
      return matchesSearch && matchesFilter;
    });

    return MODULE_ORDER.map(module => ({
      module,
      items: entries.filter(entry => entry.feature.module === module),
    })).filter(group => group.items.length > 0);
  }, [detailsForm?.plan, draftOverrides, featureSearch, featureFilter]);

  const toggleFeature = (featureId) => {
    const defaultValue = getFeatureDefault(featureId, detailsForm.plan);
    const currentValue = Object.prototype.hasOwnProperty.call(draftOverrides, featureId) ? draftOverrides[featureId] : defaultValue;
    const nextValue = !currentValue;
    setDraftOverrides(prev => {
      const updated = { ...prev };
      if (nextValue === defaultValue) {
        delete updated[featureId];
      } else {
        updated[featureId] = nextValue;
      }
      return updated;
    });
  };

  const discardChanges = () => setDraftOverrides(savedOverrides);

  const handleDeactivate = () => {
    saveDetailsMutation.mutate({ is_active: false });
  };

  if (loadingUser || loadingSchool) {
    return <div className="flex items-center justify-center min-h-screen"><div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600" /></div>;
  }
  if (!currentUser?.is_superadmin) {
    return <div className="flex items-center justify-center min-h-[60vh]"><div className="text-center"><XCircle className="w-12 h-12 text-red-500 mx-auto mb-3" /><h2 className="text-xl font-bold">Access Denied</h2><Button className="mt-4" onClick={() => navigate(createPageUrl('AdminDashboard'))}>Back</Button></div></div>;
  }
  if (!school || !detailsForm) {
    return <div className="p-8 text-center text-gray-400">School not found.</div>;
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-28">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Edit School</h1>
        <p className="text-gray-500 mt-1">{school.name} · {school.code}</p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="details">School details</TabsTrigger>
          <TabsTrigger value="features">Feature flags</TabsTrigger>
          <TabsTrigger value="danger">Danger zone</TabsTrigger>
        </TabsList>

        <TabsContent value="details" className="mt-6">
          <Card>
            <CardHeader><CardTitle>School details</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div><Label>School Name</Label><Input value={detailsForm.name} onChange={e => setDetailsForm({ ...detailsForm, name: e.target.value })} /></div>
                <div><Label>Subdomain</Label><Input value={detailsForm.subdomain} readOnly disabled className="bg-gray-100" /></div>
                <div><Label>Plan</Label><Select value={detailsForm.plan} onValueChange={v => setDetailsForm({ ...detailsForm, plan: v })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="starter">Starter</SelectItem><SelectItem value="growth">Growth</SelectItem><SelectItem value="professional">Professional</SelectItem><SelectItem value="elite">Elite</SelectItem></SelectContent></Select></div>
                <div className="flex items-center gap-3 pt-7"><Switch checked={detailsForm.is_active} onCheckedChange={v => setDetailsForm({ ...detailsForm, is_active: v })} /><Label>Active</Label></div>
                <div><Label>Phone</Label><Input value={detailsForm.phone} onChange={e => setDetailsForm({ ...detailsForm, phone: e.target.value })} /></div>
                <div><Label>Email</Label><Input value={detailsForm.email} onChange={e => setDetailsForm({ ...detailsForm, email: e.target.value })} /></div>
              </div>
              <div><Label>Address</Label><Input value={detailsForm.address} onChange={e => setDetailsForm({ ...detailsForm, address: e.target.value })} /></div>
              <div><Label>Notes</Label><Textarea value={detailsForm.notes} onChange={e => setDetailsForm({ ...detailsForm, notes: e.target.value })} rows={4} /></div>
              <div className="flex gap-3"><Button onClick={() => saveDetailsMutation.mutate(detailsForm)} className="bg-blue-600 hover:bg-blue-700">{saveDetailsMutation.isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}Save details</Button><Button variant="outline" onClick={() => navigate(createPageUrl('SuperadminDashboard'))}>Back</Button></div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="features" className="mt-6 space-y-6">
          <Card>
            <CardContent className="p-4">
              <div className="grid md:grid-cols-4 gap-4">
                <Input placeholder="Search features" value={featureSearch} onChange={(e) => setFeatureSearch(e.target.value)} />
                <Select value={featureFilter} onValueChange={setFeatureFilter}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all">All</SelectItem><SelectItem value="enabled">Enabled</SelectItem><SelectItem value="disabled">Disabled</SelectItem><SelectItem value="overridden">Overridden</SelectItem></SelectContent></Select>
                <div className="md:col-span-2 flex justify-end"><Button variant="outline" onClick={() => resetOverridesMutation.mutate()}>Reset all overrides</Button></div>
              </div>
            </CardContent>
          </Card>

          {groupedFeatures.map(({ module, items }) => {
            const enabledCount = items.filter(item => item.effectiveEnabled).length;
            const total = items.length;
            return (
              <Card key={module}>
                <CardHeader className="cursor-pointer" onClick={() => setModuleOpen(prev => ({ ...prev, [module]: !prev[module] }))}>
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      {moduleOpen[module] ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                      <div>
                        <CardTitle className="capitalize">{module}</CardTitle>
                        <p className="text-sm text-gray-500">{enabledCount} / {total} features enabled</p>
                      </div>
                    </div>
                    <div className="w-56"><Progress value={(enabledCount / total) * 100} /></div>
                  </div>
                </CardHeader>
                {moduleOpen[module] && (
                  <CardContent className="space-y-3">
                    {items.map((item) => {
                      const stateClass = item.isOverridden
                        ? item.effectiveEnabled ? 'bg-blue-600 data-[state=checked]:bg-blue-600' : 'bg-red-600 data-[state=checked]:bg-red-600'
                        : item.effectiveEnabled ? 'bg-green-600 data-[state=checked]:bg-green-600' : 'bg-gray-300 data-[state=checked]:bg-green-600';
                      return (
                        <div key={item.id} className="flex items-center justify-between gap-4 border rounded-lg p-4">
                          <div className="min-w-0">
                            <div className="flex flex-wrap items-center gap-2 mb-1">
                              <p className="font-medium text-gray-900">{item.feature.label}</p>
                              {item.isOverridden && <Badge className="bg-slate-100 text-slate-700">override</Badge>}
                              {item.minimumTier && <Badge className={TIER_BADGE_CLASSES[item.minimumTier]}>{item.minimumTier}</Badge>}
                            </div>
                          </div>
                          <Switch checked={item.effectiveEnabled} onCheckedChange={() => toggleFeature(item.id)} className={stateClass} />
                        </div>
                      );
                    })}
                  </CardContent>
                )}
              </Card>
            );
          })}
        </TabsContent>

        <TabsContent value="danger" className="mt-6">
          <Card className="border-red-200">
            <CardHeader><CardTitle className="text-red-700">Danger zone</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-gray-600">Deactivate this school account.</p>
              {!confirmDeactivate ? (
                <Button variant="outline" className="text-red-600 border-red-200 hover:bg-red-50" onClick={() => setConfirmDeactivate(true)}>Deactivate school</Button>
              ) : (
                <div className="flex items-center gap-3"><span className="text-sm text-red-600">Are you sure?</span><Button className="bg-red-600 hover:bg-red-700" onClick={handleDeactivate}>Yes, deactivate</Button><Button variant="outline" onClick={() => setConfirmDeactivate(false)}>Cancel</Button></div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {hasUnsavedChanges && (
        <div className="fixed bottom-0 left-0 right-0 z-50 border-t bg-white shadow-lg">
          <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between gap-4">
            <p className="text-sm font-medium">{pendingChangesCount} change(s) pending for {school.name}</p>
            <div className="flex gap-3">
              <Button variant="outline" onClick={discardChanges}>Discard</Button>
              <Button onClick={() => saveOverridesMutation.mutate(draftOverrides)} className="bg-blue-600 hover:bg-blue-700">Save changes</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}