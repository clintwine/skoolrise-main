import { useCallback } from 'react';
import { base44 } from '@/api/base44Client';

export function useAuditLog() {
  const logAction = useCallback(async (action, entityType, entityId, entityName, changes = null) => {
    try {
      const user = await base44.auth.me().catch(() => null);
      
      await base44.entities.AuditLog.create({
        user_id: user?.id || 'system',
        user_email: user?.email || 'system',
        action,
        entity_type: entityType,
        entity_id: entityId,
        entity_name: entityName,
        changes: changes ? JSON.stringify(changes) : null,
        metadata: JSON.stringify({
          timestamp: new Date().toISOString(),
          page: window.location.pathname,
        }),
      });
    } catch (error) {
      console.warn('Audit log failed:', error);
    }
  }, []);

  const logCreate = useCallback((entityType, entityId, entityName, data) => {
    logAction('create', entityType, entityId, entityName, { created: data });
  }, [logAction]);

  const logUpdate = useCallback((entityType, entityId, entityName, before, after) => {
    logAction('update', entityType, entityId, entityName, { before, after });
  }, [logAction]);

  const logDelete = useCallback((entityType, entityId, entityName) => {
    logAction('delete', entityType, entityId, entityName);
  }, [logAction]);

  const logView = useCallback((entityType, entityId, entityName) => {
    logAction('view', entityType, entityId, entityName);
  }, [logAction]);

  const logExport = useCallback((entityType, count) => {
    logAction('export', entityType, null, `Exported ${count} records`);
  }, [logAction]);

  return {
    logAction,
    logCreate,
    logUpdate,
    logDelete,
    logView,
    logExport,
  };
}

export default useAuditLog;