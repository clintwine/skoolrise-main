import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';

/**
 * Returns the current school context for the authenticated user.
 * Cached via react-query so pages sharing this hook make only one auth call.
 *
 * Returns:
 *   {
 *     school_tenant_id: string | null,  // null for superadmins
 *     isSuperadmin: boolean,
 *     isReady: boolean,
 *     user: object | null
 *   }
 */
export function useSchoolContext() {
  const { data: user, isLoading } = useQuery({
    queryKey: ['school-context-user'],
    queryFn: () => base44.auth.me(),
    staleTime: 5 * 60 * 1000, // 5 minutes — avoids redundant calls across pages
  });

  if (isLoading || !user) {
    return {
      school_tenant_id: null,
      isSuperadmin: false,
      isReady: false,
      user: null,
    };
  }

  const isSuperadmin = user.is_superadmin === true;

  return {
    school_tenant_id: isSuperadmin ? null : (user.school_tenant_id || null),
    isSuperadmin,
    isReady: true,
    user,
  };
}