import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json();
    const { assignment_id, school_tenant_id } = body;

    if (!assignment_id || !school_tenant_id) {
      return Response.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Get assignment
    const assignment = await base44.asServiceRole.entities.Assignment.get(assignment_id);
    if (!assignment || assignment.school_tenant_id !== school_tenant_id) {
      return Response.json({ error: 'Assignment not found' }, { status: 404 });
    }

    // Get class enrollments
    const enrollments = await base44.asServiceRole.entities.Enrollment.filter({
      school_tenant_id,
      class_id: assignment.class_id,
      status: 'Enrolled',
    });

    // Create notifications for each student
    const notifications = enrollments.map(e => ({
      school_tenant_id,
      user_id: e.student_id,
      user_email: e.student_email,
      title: `Assignment Due: ${assignment.title}`,
      message: `Your assignment "${assignment.title}" is due ${assignment.due_date}`,
      type: 'assignment',
      entity_type: 'Assignment',
      entity_id: assignment_id,
      is_read: false,
    }));

    const created = await base44.asServiceRole.entities.InAppNotification.bulkCreate(notifications);

    return Response.json({
      success: true,
      message: 'Notifications created',
      count: created.length,
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});