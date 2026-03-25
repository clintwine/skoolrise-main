import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { user_id, user_email, title, message, type, link, link_params, entity_type, entity_id } = await req.json();

    if (!user_id || !title || !message) {
      return Response.json({ error: 'user_id, title, and message are required' }, { status: 400 });
    }

    const notification = await base44.asServiceRole.entities.InAppNotification.create({
      user_id,
      user_email: user_email || '',
      title,
      message,
      type: type || 'info',
      link: link || '',
      link_params: link_params || '',
      entity_type: entity_type || '',
      entity_id: entity_id || '',
      is_read: false,
    });

    return Response.json({ success: true, notification });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});