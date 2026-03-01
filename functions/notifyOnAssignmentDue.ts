import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

// This function checks for assignments due soon and sends notifications
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (user?.role !== 'admin') {
      return Response.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
    }

    // Get assignments due in the next 24 hours
    const now = new Date();
    const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);
    
    const assignments = await base44.asServiceRole.entities.Assignment.filter({
      status: 'Published'
    });

    const dueSoon = assignments.filter(a => {
      if (!a.due_date) return false;
      const dueDate = new Date(a.due_date);
      return dueDate >= now && dueDate <= tomorrow;
    });

    // Get all enrollments for the relevant classes
    const enrollments = await base44.asServiceRole.entities.Enrollment.filter({
      status: 'Enrolled'
    });

    const students = await base44.asServiceRole.entities.Student.list();
    const studentMap = {};
    students.forEach(s => { studentMap[s.id] = s; });

    let notificationsSent = 0;

    for (const assignment of dueSoon) {
      // Find students enrolled in this class
      const classEnrollments = enrollments.filter(e => e.class_id === assignment.class_id);
      
      for (const enrollment of classEnrollments) {
        const student = studentMap[enrollment.student_id];
        if (!student?.user_id) continue;

        // Create notification for student
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
        });
        notificationsSent++;
      }
    }

    return Response.json({ 
      success: true, 
      assignmentsChecked: dueSoon.length,
      notificationsSent 
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});