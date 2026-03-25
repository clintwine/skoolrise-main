import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { student_id, action } = await req.json();

    if (!student_id) {
      return Response.json({ error: 'student_id is required' }, { status: 400 });
    }

    // Fetch student details
    const students = await base44.entities.Student.filter({ id: student_id });
    if (students.length === 0) {
      return Response.json({ error: 'Student not found' }, { status: 404 });
    }

    const student = students[0];

    // Fetch parent details
    let parentEmail = null;
    let parentName = null;
    
    if (student.parent_id) {
      const parents = await base44.entities.Parent.filter({ id: student.parent_id });
      if (parents.length > 0) {
        const parent = parents[0];
        parentName = `${parent.first_name} ${parent.last_name}`;
        
        // Get parent's user email
        const parentUsers = await base44.entities.User.filter({ id: parent.user_id });
        if (parentUsers.length > 0) {
          parentEmail = parentUsers[0].email;
        }
      }
    }

    // If action is 'confirm', record exit and send notification
    if (action === 'confirm') {
      const now = new Date();
      const date = now.toISOString().split('T')[0];
      const time = now.toLocaleTimeString('en-US', { 
        hour: '2-digit', 
        minute: '2-digit',
        hour12: true 
      });

      // Record the exit
      const exitRecord = await base44.entities.BiometricAttendance.create({
        student_id: student.id,
        student_name: `${student.first_name} ${student.last_name}`,
        biometric_id: student.student_id_number,
        timestamp: now.toISOString(),
        date: date,
        type: 'Check-Out',
        device_id: 'QR-SCANNER-EXIT',
        status: 'Departed',
        scanned_by_user_id: user.id,
        scanned_by_name: user.full_name || user.email
      });

      // Send email notification to parent if email exists
      if (parentEmail) {
        await base44.integrations.Core.SendEmail({
          to: parentEmail,
          subject: `Student Exit Notification - ${student.first_name} ${student.last_name}`,
          body: `Dear ${parentName || 'Parent/Guardian'},\n\nThis is to inform you that your child, ${student.first_name} ${student.last_name} (${student.student_id_number}), has left the school premises.\n\nExit Details:\n- Date: ${date}\n- Time: ${time}\n- Recorded by: ${user.full_name || user.email}\n\nIf you have any concerns or did not authorize this exit, please contact the school immediately.\n\nBest regards,\nSkoolRise School Management`
        });
      }

      return Response.json({
        success: true,
        message: 'Exit recorded and notification sent',
        record: exitRecord,
        notification_sent: !!parentEmail,
        student: {
          id: student.id,
          name: `${student.first_name} ${student.last_name}`,
          student_id: student.student_id_number
        },
        parent: parentEmail ? {
          name: parentName,
          email: parentEmail
        } : null
      });
    }

    // Otherwise, just return student and parent details for confirmation
    return Response.json({
      success: true,
      student: {
        id: student.id,
        name: `${student.first_name} ${student.last_name}`,
        student_id: student.student_id_number,
        photo_url: student.photo_url,
        grade_level: student.grade_level,
        status: student.status
      },
      parent: parentEmail ? {
        name: parentName,
        email: parentEmail
      } : {
        warning: 'No parent contact information found'
      }
    });

  } catch (error) {
    console.error('Error in scanStudentExitNotification:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});