import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { permission_name } = await req.json();

    if (!permission_name) {
      return Response.json({ error: 'Permission name is required' }, { status: 400 });
    }

    const userRole = user.role === 'admin' ? 'admin' : (user.user_type || 'user');

    // Admins have all permissions
    if (userRole === 'admin') {
      return Response.json({ 
        has_permission: true,
        source: 'admin_role'
      });
    }

    // Check for user-specific permission override
    const overrides = await base44.asServiceRole.entities.UserPermissionOverride.filter({
      user_id: user.id,
      permission_name: permission_name
    });

    if (overrides.length > 0) {
      const override = overrides[0];
      
      // Check if override is expired
      if (override.expires_at && new Date(override.expires_at) < new Date()) {
        // Override expired, delete it
        await base44.asServiceRole.entities.UserPermissionOverride.delete(override.id);
      } else {
        return Response.json({
          has_permission: override.is_granted,
          source: 'user_override'
        });
      }
    }

    // Check role-based permissions
    const permissions = await base44.asServiceRole.entities.Permission.filter({
      name: permission_name
    });

    if (permissions.length === 0) {
      return Response.json({
        has_permission: false,
        source: 'permission_not_found'
      });
    }

    const permission = permissions[0];

    const rolePermissions = await base44.asServiceRole.entities.RolePermission.filter({
      role: userRole,
      permission_id: permission.id
    });

    if (rolePermissions.length > 0) {
      return Response.json({
        has_permission: rolePermissions[0].is_granted,
        source: 'role_permission'
      });
    }

    // Default permissions based on role
    const defaultPermissions = {
      teacher: [
        'view_students', 'view_student_grades', 'view_classes', 'take_attendance', 
        'manage_assignments', 'view_report_cards', 'view_exams', 'create_exams', 
        'grade_exams', 'view_question_bank', 'manage_question_bank', 'send_messages'
      ],
      student: ['view_exams'],
      parent: ['view_students', 'view_student_grades', 'view_fees', 'view_report_cards', 'send_messages'],
      vendor: []
    };

    const hasDefault = defaultPermissions[userRole]?.includes(permission_name) || false;

    return Response.json({
      has_permission: hasDefault,
      source: 'default'
    });

  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});