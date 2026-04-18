import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { role, profile_data, school_tenant_id } = body;

    if (!role || !school_tenant_id) {
      return Response.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Verify school exists
    const schoolTenant = await base44.asServiceRole.entities.SchoolTenant.read(school_tenant_id);
    if (!schoolTenant) {
      return Response.json({ error: 'Invalid school' }, { status: 404 });
    }

    // Create role-specific profile
    let profileId;
    if (role === 'student') {
      const student = await base44.asServiceRole.entities.Student.create({
        ...profile_data,
        user_id: user.id,
        school_tenant_id,
        status: 'Active',
      });
      profileId = student.id;
    } else if (role === 'teacher') {
      const teacher = await base44.asServiceRole.entities.Teacher.create({
        ...profile_data,
        user_id: user.id,
        school_tenant_id,
        status: 'Active',
      });
      profileId = teacher.id;
    } else if (role === 'parent') {
      const parent = await base44.asServiceRole.entities.Parent.create({
        ...profile_data,
        user_id: user.id,
        school_tenant_id,
        status: 'Active',
      });
      profileId = parent.id;
    }

    // Update user with role and profile
    await base44.auth.updateMe({
      user_type: role,
      school_tenant_id,
      [`${role}_profile_id`]: profileId,
    });

    return Response.json({
      success: true,
      message: 'Profile created successfully',
      profile_id: profileId,
      role,
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});