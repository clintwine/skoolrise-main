import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { student_id, exit_time, recorded_by } = await req.json();

    if (!student_id) {
      return Response.json({ error: 'student_id is required' }, { status: 400 });
    }

    // Fetch student details
    const students = await base44.asServiceRole.entities.Student.filter({ id: student_id });
    if (students.length === 0) {
      return Response.json({ error: 'Student not found' }, { status: 404 });
    }

    const student = students[0];

    // Fetch school settings to check notification preferences
    const schoolSettings = await base44.asServiceRole.entities.School.list();
    const school = schoolSettings[0];
    
    // Parse notification settings from school if available
    let notificationSettings = {
      email_enabled: true,
      sms_enabled: false,
      whatsapp_enabled: false
    };

    // Find parent linked to this student
    let parentInfo = null;
    let notificationsSent = [];

    if (student.linked_parent_ids) {
      try {
        const parentIds = JSON.parse(student.linked_parent_ids);
        if (parentIds.length > 0) {
          const parents = await base44.asServiceRole.entities.Parent.filter({ id: parentIds[0] });
          if (parents.length > 0) {
            const parent = parents[0];
            parentInfo = {
              name: `${parent.first_name} ${parent.last_name}`,
              phone: parent.phone
            };

            // Get parent user email
            if (parent.user_id) {
              const parentUsers = await base44.asServiceRole.entities.User.filter({ id: parent.user_id });
              if (parentUsers.length > 0) {
                parentInfo.email = parentUsers[0].email;
              }
            }
          }
        }
      } catch (e) {
        console.error('Error parsing parent IDs:', e);
      }
    }

    // Also check parent_email field on student
    if (!parentInfo?.email && student.parent_email) {
      parentInfo = parentInfo || {};
      parentInfo.email = student.parent_email;
    }

    const exitDate = new Date(exit_time);
    const formattedDate = exitDate.toLocaleDateString('en-US', { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
    const formattedTime = exitDate.toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: true 
    });

    // Send email notification if enabled and email exists
    if (notificationSettings.email_enabled && parentInfo?.email) {
      try {
        await base44.integrations.Core.SendEmail({
          to: parentInfo.email,
          subject: `Student Exit Notification - ${student.first_name} ${student.last_name}`,
          body: `Dear ${parentInfo.name || 'Parent/Guardian'},

This is to inform you that your child, ${student.first_name} ${student.last_name} (Student ID: ${student.student_id_number}), has left the school premises.

Exit Details:
- Date: ${formattedDate}
- Time: ${formattedTime}
- Recorded by: ${recorded_by}

If you have any concerns or did not authorize this exit, please contact the school immediately.

Best regards,
${school?.school_name || 'School Administration'}`
        });
        notificationsSent.push('email');
      } catch (emailError) {
        console.error('Failed to send email:', emailError);
      }
    }

    // Create notification record in the system
    try {
      await base44.asServiceRole.entities.Notification.create({
        user_id: parentInfo?.user_id || '',
        type: 'student_exit',
        title: 'Student Exit Notification',
        message: `${student.first_name} ${student.last_name} has left the school at ${formattedTime}`,
        is_read: false,
        related_entity: 'Student',
        related_id: student.id
      });
    } catch (notifError) {
      console.error('Failed to create notification record:', notifError);
    }

    return Response.json({
      success: true,
      message: 'Exit recorded and notifications processed',
      student: {
        id: student.id,
        name: `${student.first_name} ${student.last_name}`,
        student_id_number: student.student_id_number
      },
      parent: parentInfo,
      notifications_sent: notificationsSent,
      exit_time: exit_time,
      recorded_by: recorded_by
    });

  } catch (error) {
    console.error('Error in recordStudentExit:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});