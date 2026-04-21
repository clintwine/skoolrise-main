import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { canAccess, FEATURE_REGISTRY, getSchoolFeatures } from '@/utils/planFeatures';

const TIER_LABELS = {
  starter:      'Starter',
  growth:       'Growth',
  professional: 'Professional',
  elite:        'Elite',
};

export function usePlanAccess(featureId) {
  const { data: user } = useQuery({
    queryKey: ['current-user'],
    queryFn: () => base44.auth.me(),
    staleTime: 5 * 60 * 1000,
  });

  const { data: school, isLoading } = useQuery({
    queryKey: ['school-tenant-features', user?.school_tenant_id],
    queryFn: () => base44.entities.SchoolTenant.read(user.school_tenant_id),
    enabled: !!user?.school_tenant_id,
    staleTime: 2 * 60 * 1000,
  });

  if (user?.is_superadmin) {
    return {
      hasAccess: true,
      plan: 'elite',
      planLabel: 'Elite',
      minimumPlan: null,
      minimumPlanLabel: null,
      loading: false,
    };
  }

  if (isLoading || !school) {
    return {
      hasAccess: false,
      plan: 'starter',
      planLabel: 'Starter',
      minimumPlan: null,
      minimumPlanLabel: null,
      loading: true,
    };
  }

  const hasAccess = canAccess(featureId, school.plan, school.feature_overrides);
  const feature = FEATURE_REGISTRY[featureId];

  let minimumPlan = null;
  if (!hasAccess && feature) {
    const tiers = ['starter', 'growth', 'professional', 'elite'];
    minimumPlan = tiers.find(t => feature[t] === true) ?? null;
  }

  return {
    hasAccess,
    plan: school.plan,
    planLabel: TIER_LABELS[school.plan] ?? school.plan,
    minimumPlan,
    minimumPlanLabel: minimumPlan ? (TIER_LABELS[minimumPlan] ?? minimumPlan) : null,
    loading: false,
  };
}

export function useAllFeatures() {
  const { data: user } = useQuery({
    queryKey: ['current-user'],
    queryFn: () => base44.auth.me(),
    staleTime: 5 * 60 * 1000,
  });

  const { data: school, isLoading } = useQuery({
    queryKey: ['school-tenant-features', user?.school_tenant_id],
    queryFn: () => base44.entities.SchoolTenant.read(user.school_tenant_id),
    enabled: !!user?.school_tenant_id,
    staleTime: 2 * 60 * 1000,
  });

  if (user?.is_superadmin) {
    return {
      features: Object.fromEntries(Object.keys(FEATURE_REGISTRY).map(k => [k, true])),
      isLoading: false,
    };
  }

  if (isLoading || !school) return { features: {}, isLoading: true };

  return {
    features: getSchoolFeatures(school.plan, school.feature_overrides),
    isLoading: false,
  };
}