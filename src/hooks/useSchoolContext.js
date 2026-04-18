import { useQuery, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';

/**
 * Returns the current school context for the authenticated user.
 * Supports multi-school membership — exposes the active school,
 * all memberships, and a switchSchool() function.
 *
 * Returns:
 *   {
 *     school_tenant_id: string | null,   // active school (null for superadmins)
 *     memberships: array,                // all active UserSchoolMembership records
 *     isMultiSchool: boolean,            // true if user belongs to >1 school
 *     isSuperadmin: boolean,
 *     isReady: boolean,
 *     user: object | null,
 *     switchSchool: (id: string) => Promise<void>
 *   }
 */
export function useSchoolContext() {
  const queryClient = useQueryClient();

  const { data: user, isLoading: userLoading } = useQuery({
    queryKey: ['current-user'],
    queryFn: () => base44.auth.me(),
  });

  const { data: memberships = [], isLoading: membershipsLoading } = useQuery({
    queryKey: ['user-school-memberships', user?.id],
    queryFn: () => base44.entities.UserSchoolMembership.filter({
      user_id: user.id,
      is_active: true,
    }),
    enabled: !!user?.id && !user?.is_superadmin,
  });

  const switchSchool = async (school_tenant_id) => {
    await base44.auth.updateMe({ school_tenant_id });
    // Invalidate all school-scoped data so queries re-fetch for new school
    queryClient.invalidateQueries({ queryKey: ['current-user'] });
    queryClient.invalidateQueries({ queryKey: ['user-school-memberships'] });
  };

  if (userLoading || membershipsLoading) {
    return {
      school_tenant_id: null,
      memberships: [],
      isMultiSchool: false,
      isSuperadmin: false,
      isReady: false,
      user: null,
      switchSchool,
    };
  }

  if (!user) {
    return {
      school_tenant_id: null,
      memberships: [],
      isMultiSchool: false,
      isSuperadmin: false,
      isReady: false,
      user: null,
      switchSchool,
    };
  }

  const isSuperadmin = user.is_superadmin === true;

  // Active school: prefer user.school_tenant_id (last active choice),
  // then fall back to first membership
  const activeTenantId = isSuperadmin
    ? null
    : (user.school_tenant_id || memberships[0]?.school_tenant_id || null);

  return {
    school_tenant_id: activeTenantId,
    memberships,
    isMultiSchool: memberships.length > 1,
    isSuperadmin,
    isReady: true,
    user,
    switchSchool,
  };
}