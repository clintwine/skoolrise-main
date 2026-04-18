import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (user?.role !== 'admin') {
      return Response.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
    }

    const schoolTenantId = user.school_tenant_id;
    const now = new Date();
    const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);

    const assignmentFilter = { status: 'Published' };
    if (schoolTenantId) assignmentFilter.school_tenant_id = schoolTenantId;

    const assignments = await base44.asServiceRole.entities.Assignment.filter(assignmentFilter);

    const dueSoon = assignments.filter(a => {
      if (!a.due_date) return false;
      const dueDate = new Date(a.due_date);
      return dueDate >= now && dueDate <= tomorrow;
    });

    const enrollmentFilter = { status: 'Enrolled' };
    if (schoolTenantId) enrollmentFilter.school_tenant_id = schoolTenantId;
    const enrollments = await base44.asServiceRole.entities.Enrollment.filter(enrollmentFilter);

    const studentFilter = {};
    if (schoolTenantId) studentFilter.school_tenant_id = schoolTenantId;
    const students = await base44.asServiceRole.entities.Student.filter(studentFilter);
    const studentMap = {};
    students.forEach(s => { studentMap[s.id] = s; });

    let notificationsSent = 0;

    for (const assignment of dueSoon) {
      const classEnrollments = enrollments.filter(e => e.class_id === assignment.class_id);

      for (const enrollment of classEnrollments) {
        const student = studentMap[enrollment.student_id];
        if (!student?.user_id) continue;

        await base44.asServiceRole.entities.InAppNotification.create({
          user_id: student.user_id,
          user_email: '',
          title: '📚 Assignment Due Soon',
          message: `"${assignment.title}" is due ${new Date(assignment.due_date).toLocaleDateString()}. Don't forget to submit!`,
          type: 'assignment',
          link: 'StudentAssignments',
          link_params: `id=${assignment.id}`,
          entity_type: 'Assignment',
          entity_id: assignment.id,
          is_read: false,
          school_tenant_id: schoolTenantId || null,
        });
        notificationsSent++;
      }
    }

    return Response.json({ success: true, assignmentsChecked: dueSoon.length, notificationsSent });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});