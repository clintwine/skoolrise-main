import { useQuery, useQueries } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';

/**
 * Custom hook to check if the current user has a specific permission
 * @param {string} permissionName - The name of the permission to check
 * @returns {{ hasPermission: boolean, isLoading: boolean, source: string }}
 */
export function usePermission(permissionName) {
  const { data, isLoading } = useQuery({
    queryKey: ['permission', permissionName],
    queryFn: async () => {
      try {
        const response = await base44.functions.invoke('checkUserPermission', {
          permission_name: permissionName
        });
        return response.data;
      } catch (error) {
        console.error('Permission check failed:', error);
        return { has_permission: false, source: 'error' };
      }
    },
    staleTime: 60000, // Cache for 1 minute
    enabled: !!permissionName
  });

  return {
    hasPermission: data?.has_permission || false,
    isLoading,
    source: data?.source || 'unknown'
  };
}

/**
 * Custom hook to check multiple permissions at once
 * @param {string[]} permissionNames - Array of permission names to check
 * @returns {{ permissions: Record<string, boolean>, isLoading: boolean }}
 */
export function usePermissions(permissionNames) {
  const results = useQueries({
    queries: permissionNames.map((permissionName) => ({
      queryKey: ['permission', permissionName],
      queryFn: async () => {
        try {
          const response = await base44.functions.invoke('checkUserPermission', {
            permission_name: permissionName
          });
          return response.data;
        } catch (error) {
          console.error('Permission check failed:', error);
          return { has_permission: false, source: 'error' };
        }
      },
      staleTime: 60000,
      enabled: !!permissionName
    }))
  });

  const permissions = permissionNames.reduce((acc, name, index) => {
    acc[name] = results[index]?.data?.has_permission || false;
    return acc;
  }, {});

  const isLoading = results.some((result) => result.isLoading);

  return { permissions, isLoading };
}

/**
 * Component wrapper that only renders children if user has permission
 */
export function RequirePermission({ permission, children, fallback = null }) {
  const { hasPermission, isLoading } = usePermission(permission);

  if (isLoading) {
    return null;
  }

  if (!hasPermission) {
    return fallback;
  }

  return children;
}

export default usePermission;