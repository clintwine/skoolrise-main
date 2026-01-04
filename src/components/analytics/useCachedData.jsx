import { useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';

const CACHE_DURATION_MS = {
  dashboard_stats: 5 * 60 * 1000, // 5 minutes
  attendance_summary: 15 * 60 * 1000, // 15 minutes
  fee_summary: 30 * 60 * 1000, // 30 minutes
  performance_metrics: 60 * 60 * 1000, // 1 hour
  report_data: 24 * 60 * 60 * 1000, // 24 hours
};

export function useCachedData(cacheKey, cacheType, fetchFn, options = {}) {
  const queryClient = useQueryClient();
  const cacheDuration = options.cacheDuration || CACHE_DURATION_MS[cacheType] || 5 * 60 * 1000;

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['cached-data', cacheKey],
    queryFn: async () => {
      // Try to get from cache first
      const cachedItems = await base44.entities.CachedData.filter({ 
        cache_key: cacheKey,
        is_valid: true 
      });
      
      const cached = cachedItems[0];
      
      if (cached && new Date(cached.expires_at) > new Date()) {
        return JSON.parse(cached.data);
      }
      
      // Fetch fresh data
      const freshData = await fetchFn();
      
      // Store in cache
      const expiresAt = new Date(Date.now() + cacheDuration).toISOString();
      
      if (cached) {
        await base44.entities.CachedData.update(cached.id, {
          data: JSON.stringify(freshData),
          expires_at: expiresAt,
          is_valid: true,
        });
      } else {
        await base44.entities.CachedData.create({
          cache_key: cacheKey,
          cache_type: cacheType,
          data: JSON.stringify(freshData),
          expires_at: expiresAt,
          is_valid: true,
        });
      }
      
      return freshData;
    },
    staleTime: cacheDuration,
    ...options,
  });

  const invalidateCache = useCallback(async () => {
    const cachedItems = await base44.entities.CachedData.filter({ cache_key: cacheKey });
    for (const item of cachedItems) {
      await base44.entities.CachedData.update(item.id, { is_valid: false });
    }
    queryClient.invalidateQueries({ queryKey: ['cached-data', cacheKey] });
  }, [cacheKey, queryClient]);

  return {
    data,
    isLoading,
    refetch,
    invalidateCache,
  };
}

export function useInvalidateAllCache() {
  const queryClient = useQueryClient();
  
  return useCallback(async (cacheType = null) => {
    const filter = cacheType ? { cache_type: cacheType } : {};
    const cachedItems = await base44.entities.CachedData.filter(filter);
    
    for (const item of cachedItems) {
      await base44.entities.CachedData.update(item.id, { is_valid: false });
    }
    
    queryClient.invalidateQueries({ queryKey: ['cached-data'] });
  }, [queryClient]);
}

export default useCachedData;