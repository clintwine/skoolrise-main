import { base44 } from '@/api/base44Client';

/**
 * Helper function to log audit events
 * Usage:
 *   import { logAuditEvent } from '@/components/analytics/useAuditLogger';
 *   
 *   // For create operations
 *   await logAuditEvent('create', 'Student', newStudent.id, `${newStudent.first_name} ${newStudent.last_name}`);
 *   
 *   // For update operations with changes tracking
 *   await logAuditEvent('update', 'Student', student.id, `${student.first_name} ${student.last_name}`, oldData, newData);
 *   
 *   // For delete operations
 *   await logAuditEvent('delete', 'Student', student.id, `${student.first_name} ${student.last_name}`);
 */
export async function logAuditEvent(action, entityType, entityId, entityName, oldData = null, newData = null, severity = 'info') {
  try {
    await base44.functions.invoke('logAuditEvent', {
      action,
      entity_type: entityType,
      entity_id: entityId,
      entity_name: entityName,
      old_data: oldData,
      new_data: newData,
      severity,
    });
  } catch (error) {
    // Silently fail - audit logging should not break main functionality
    console.warn('Audit log failed:', error);
  }
}

/**
 * Helper for bulk operations
 */
export async function logBulkAuditEvent(action, entityType, count, details = null) {
  try {
    await base44.functions.invoke('logAuditEvent', {
      action: `bulk_${action}`,
      entity_type: entityType,
      entity_name: `${count} records`,
      changes: details ? JSON.stringify(details) : null,
    });
  } catch (error) {
    console.warn('Bulk audit log failed:', error);
  }
}

export default { logAuditEvent, logBulkAuditEvent };