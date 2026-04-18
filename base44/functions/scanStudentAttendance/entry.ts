import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { student_id, biometric_id, school_tenant_id } = body;

    if (!student_id || !school_tenant_id) {
      return Response.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Get student
    const student = await base44.entities.Student.get(student_id);
    if (!student || student.school_tenant_id !== school_tenant_id) {
      return Response.json({ error: 'Student not found' }, { status: 404 });
    }

    // Record biometric attendance
    const now = new Date();
    const today = now.toISOString().split('T')[0];

    const biometricRecord = await base44.asServiceRole.entities.BiometricAttendance.create({
      school_tenant_id,
      student_id,
      student_name: `${student.first_name} ${student.last_name}`,
      biometric_id,
      timestamp: now.toISOString(),
      date: today,
      type: 'Check-In',
      device_id: 'scanner-main',
      status: 'On Time',
    });

    return Response.json({
      success: true,
      message: 'Attendance recorded',
      record_id: biometricRecord.id,
      student_name: student.first_name + ' ' + student.last_name,
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});