import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';

/**
 * Returns the current user's school_tenant_id.
 * Returns null for superadmin users (they query across all tenants).
 * Returns undefined while loading.
 */
export function useSchoolTenant() {
  const { data: user, isLoading } = useQuery({
    queryKey: ['current-user'],
    queryFn: () => base44.auth.me(),
  });

  if (isLoading) return { schoolTenantId: undefined, isLoading: true, user: null };

  // Superadmin has no tenant — sees all data
  if (user?.is_superadmin) return { schoolTenantId: null, isLoading: false, user };

  return { schoolTenantId: user?.school_tenant_id || null, isLoading: false, user };
}

/**
 * Returns a filter object to add school_tenant_id to queries.
 * If schoolTenantId is null (superadmin), returns empty object (no filter).
 */
export function useTenantFilter() {
  const { schoolTenantId, isLoading } = useSchoolTenant();
  if (isLoading || schoolTenantId === null) return { filter: {}, isLoading };
  return { filter: { school_tenant_id: schoolTenantId }, isLoading };
}