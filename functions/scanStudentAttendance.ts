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

    // If action is 'confirm', create the attendance record
    if (action === 'confirm') {
      const now = new Date();
      const date = now.toISOString().split('T')[0];
      const time = now.toTimeString().split(' ')[0];
      const isLate = now.getHours() > 8 || (now.getHours() === 8 && now.getMinutes() > 30);

      const attendanceRecord = await base44.entities.BiometricAttendance.create({
        student_id: student.id,
        student_name: `${student.first_name} ${student.last_name}`,
        biometric_id: student.student_id_number,
        timestamp: now.toISOString(),
        date: date,
        type: 'Check-In',
        device_id: 'QR-SCANNER',
        status: isLate ? 'Late' : 'On Time',
        scanned_by_user_id: user.id,
        scanned_by_name: user.full_name || user.email
      });

      return Response.json({
        success: true,
        message: 'Attendance recorded successfully',
        record: attendanceRecord,
        student: {
          id: student.id,
          name: `${student.first_name} ${student.last_name}`,
          student_id: student.student_id_number,
          photo_url: student.photo_url,
          grade_level: student.grade_level
        }
      });
    }

    // Otherwise, just return student details for confirmation
    return Response.json({
      success: true,
      student: {
        id: student.id,
        name: `${student.first_name} ${student.last_name}`,
        student_id: student.student_id_number,
        photo_url: student.photo_url,
        grade_level: student.grade_level,
        status: student.status
      }
    });

  } catch (error) {
    console.error('Error in scanStudentAttendance:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});