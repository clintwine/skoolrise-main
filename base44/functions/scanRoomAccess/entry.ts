import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { user_or_student_id, room_id, room_name, access_type, action } = await req.json();

    if (!user_or_student_id || !room_id || !access_type) {
      return Response.json({ 
        error: 'user_or_student_id, room_id, and access_type are required' 
      }, { status: 400 });
    }

    // Try to fetch as student first, then as user
    let personName = 'Unknown';
    let personType = 'Unknown';
    
    const students = await base44.entities.Student.filter({ id: user_or_student_id });
    if (students.length > 0) {
      const student = students[0];
      personName = `${student.first_name} ${student.last_name}`;
      personType = 'Student';
    } else {
      const users = await base44.entities.User.filter({ id: user_or_student_id });
      if (users.length > 0) {
        personName = users[0].full_name || users[0].email;
        personType = 'Staff';
      }
    }

    // If action is 'confirm', record the access
    if (action === 'confirm') {
      const accessLog = await base44.entities.RoomAccessLog.create({
        user_or_student_id: user_or_student_id,
        user_name: personName,
        room_id: room_id,
        room_name: room_name || `Room ${room_id}`,
        access_type: access_type,
        timestamp: new Date().toISOString(),
        scanned_by_user_id: user.id,
        scanned_by_name: user.full_name || user.email,
        device_id: 'QR-SCANNER'
      });

      return Response.json({
        success: true,
        message: `${access_type} recorded successfully`,
        log: accessLog,
        person: {
          id: user_or_student_id,
          name: personName,
          type: personType
        }
      });
    }

    // Otherwise, just return person details for confirmation
    return Response.json({
      success: true,
      person: {
        id: user_or_student_id,
        name: personName,
        type: personType
      }
    });

  } catch (error) {
    console.error('Error in scanRoomAccess:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});