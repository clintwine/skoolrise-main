import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { useAuditLog } from '../analytics/useAuditLog';

/**
 * Custom hook for optimistic updates with automatic rollback
 * Usage:
 * const { mutate, isPending } = useOptimisticUpdate({
 *   queryKey: ['students'],
 *   mutationFn: (data) => base44.entities.Student.update(id, data),
 *   entityName: 'Student',
 *   entityId: student.id,
 * });
 */
export function useOptimisticUpdate({
  queryKey,
  mutationFn,
  entityName,
  entityId,
  onSuccess,
  onError,
  optimisticUpdate, // function to update cache optimistically
}) {
  const queryClient = useQueryClient();
  const { logUpdate } = useAuditLog();

  return useMutation({
    mutationFn,
    onMutate: async (newData) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey });

      // Snapshot the previous value
      const previousData = queryClient.getQueryData(queryKey);

      // Optimistically update the cache
      if (optimisticUpdate) {
        queryClient.setQueryData(queryKey, (old) => optimisticUpdate(old, newData));
      }

      // Return context with the snapshot
      return { previousData, newData };
    },
    onError: (err, newData, context) => {
      // Rollback on error
      if (context?.previousData) {
        queryClient.setQueryData(queryKey, context.previousData);
      }
      toast.error(`Failed to update: ${err.message}`);
      onError?.(err);
    },
    onSuccess: (data, variables, context) => {
      // Log the update
      if (entityName && entityId) {
        logUpdate(entityName, entityId, entityName, context?.previousData, variables);
      }
      toast.success('Updated successfully');
      onSuccess?.(data);
    },
    onSettled: () => {
      // Always refetch after error or success
      queryClient.invalidateQueries({ queryKey });
    },
  });
}

/**
 * Custom hook for optimistic delete with automatic rollback
 */
export function useOptimisticDelete({
  queryKey,
  mutationFn,
  entityName,
  onSuccess,
  onError,
  getItemId = (item) => item.id,
}) {
  const queryClient = useQueryClient();
  const { logDelete } = useAuditLog();

  return useMutation({
    mutationFn,
    onMutate: async (deletedId) => {
      await queryClient.cancelQueries({ queryKey });
      const previousData = queryClient.getQueryData(queryKey);
      
      // Optimistically remove the item
      queryClient.setQueryData(queryKey, (old) => {
        if (Array.isArray(old)) {
          return old.filter(item => getItemId(item) !== deletedId);
        }
        return old;
      });

      return { previousData, deletedId };
    },
    onError: (err, deletedId, context) => {
      if (context?.previousData) {
        queryClient.setQueryData(queryKey, context.previousData);
      }
      toast.error(`Failed to delete: ${err.message}`);
      onError?.(err);
    },
    onSuccess: (data, deletedId) => {
      if (entityName) {
        logDelete(entityName, deletedId, entityName);
      }
      toast.success('Deleted successfully');
      onSuccess?.(data);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey });
    },
  });
}

/**
 * Custom hook for optimistic create with automatic rollback
 */
export function useOptimisticCreate({
  queryKey,
  mutationFn,
  entityName,
  onSuccess,
  onError,
  getTempId = () => `temp_${Date.now()}`,
}) {
  const queryClient = useQueryClient();
  const { logCreate } = useAuditLog();

  return useMutation({
    mutationFn,
    onMutate: async (newItem) => {
      await queryClient.cancelQueries({ queryKey });
      const previousData = queryClient.getQueryData(queryKey);
      
      // Create temp item with temp ID
      const tempItem = { ...newItem, id: getTempId(), _isOptimistic: true };
      
      // Optimistically add the item
      queryClient.setQueryData(queryKey, (old) => {
        if (Array.isArray(old)) {
          return [...old, tempItem];
        }
        return old;
      });

      return { previousData, tempItem };
    },
    onError: (err, newItem, context) => {
      if (context?.previousData) {
        queryClient.setQueryData(queryKey, context.previousData);
      }
      toast.error(`Failed to create: ${err.message}`);
      onError?.(err);
    },
    onSuccess: (data, variables) => {
      if (entityName) {
        logCreate(entityName, data.id, entityName, variables);
      }
      toast.success('Created successfully');
      onSuccess?.(data);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey });
    },
  });
}

export default { useOptimisticUpdate, useOptimisticDelete, useOptimisticCreate };