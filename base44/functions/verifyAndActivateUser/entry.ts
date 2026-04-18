import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json();
    const { activation_code, school_tenant_id } = body;

    if (!activation_code || !school_tenant_id) {
      return Response.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Verify school tenant exists
    const schoolTenant = await base44.asServiceRole.entities.SchoolTenant.read(school_tenant_id);
    if (!schoolTenant) {
      return Response.json({ error: 'Invalid school' }, { status: 404 });
    }

    // Look up activation by code
    const activations = await base44.asServiceRole.entities.Application.filter({
      activation_code,
      school_tenant_id,
      status: 'Pending',
    });

    if (activations.length === 0) {
      return Response.json({ error: 'Invalid or expired activation code' }, { status: 400 });
    }

    const activation = activations[0];

    // Update application status
    await base44.asServiceRole.entities.Application.update(activation.id, {
      status: 'Approved',
      activated_at: new Date().toISOString(),
    });

    return Response.json({
      success: true,
      message: 'User activated successfully',
      user_id: activation.user_id,
      role: activation.requested_role,
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});