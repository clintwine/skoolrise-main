import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { canAccess, PLAN_FEATURES } from '@/utils/planFeatures';

export function usePlanAccess(feature) {
  const { data: user } = useQuery({
    queryKey: ['current-user-plan-access'],
    queryFn: () => base44.auth.me(),
  });

  const { data: school } = useQuery({
    queryKey: ['school-tenant-plan', user?.school_tenant_id],
    queryFn: () => base44.entities.SchoolTenant.read(user.school_tenant_id),
    enabled: !!user?.school_tenant_id,
  });

  if (!school) {
    return { hasAccess: false, plan: 'free', minimumPlan: null, loading: true };
  }

  // Check feature overrides
  let overrides = {};
  if (school.feature_overrides) {
    try {
      overrides = JSON.parse(school.feature_overrides);
    } catch (e) {
      console.warn('Invalid feature_overrides JSON');
    }
  }

  const hasOverride = feature in overrides;
  const hasAccess = hasOverride ? overrides[feature] : canAccess(feature, school.plan);

  // Find minimum plan that has this feature
  let minimumPlan = null;
  if (!hasAccess) {
    const plans = ['free', 'starter', 'pro', 'enterprise'];
    minimumPlan = plans.find(p => PLAN_FEATURES[p][feature]);
  }

  return {
    hasAccess,
    plan: school.plan,
    minimumPlan,
    loading: false,
  };
}