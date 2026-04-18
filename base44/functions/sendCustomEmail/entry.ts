import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Admin access required' }, { status: 403 });
    }

    const body = await req.json();
    const { to, subject, body: emailBody, school_tenant_id } = body;

    if (!to || !subject || !emailBody || !school_tenant_id) {
      return Response.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Send email via Core integration
    const result = await base44.integrations.Core.SendEmail({
      to,
      subject,
      body: emailBody,
      from_name: `${user.full_name || 'School Admin'}`,
    });

    return Response.json({
      success: true,
      message: 'Email sent successfully',
      recipient: to,
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});