import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { action, entity_type, entity_id, entity_name, changes, old_data, new_data } = await req.json();

    if (!action || !entity_type) {
      return Response.json({ error: 'Missing required fields (action, entity_type)' }, { status: 400 });
    }

    // Build changes object if old_data and new_data are provided
    let changesJson = changes;
    if (!changesJson && old_data && new_data) {
      const changesObj = {};
      const allKeys = new Set([...Object.keys(old_data || {}), ...Object.keys(new_data || {})]);
      
      for (const key of allKeys) {
        // Skip system fields
        if (['id', 'created_date', 'updated_date', 'created_by'].includes(key)) continue;
        
        const oldVal = old_data?.[key];
        const newVal = new_data?.[key];
        
        if (JSON.stringify(oldVal) !== JSON.stringify(newVal)) {
          changesObj[key] = {
            old: oldVal,
            new: newVal
          };
        }
      }
      
      if (Object.keys(changesObj).length > 0) {
        changesJson = JSON.stringify(changesObj);
      }
    }

    // Get IP and user agent from request headers
    const ip_address = req.headers.get('x-forwarded-for') || req.headers.get('cf-connecting-ip') || 'unknown';
    const user_agent = req.headers.get('user-agent') || 'unknown';

    // Create audit log entry using service role
    await base44.asServiceRole.entities.AuditLog.create({
      user_email: user.email,
      user_id: user.id,
      action,
      entity_type,
      entity_id: entity_id || null,
      entity_name: entity_name || null,
      changes: changesJson || null,
      ip_address,
      user_agent,
    });

    return Response.json({ 
      success: true, 
      message: 'Audit event logged' 
    });

  } catch (error) {
    console.error('Audit log error:', error);
    return Response.json({ 
      success: false, 
      error: error.message || 'Failed to log audit event' 
    }, { status: 500 });
  }
});