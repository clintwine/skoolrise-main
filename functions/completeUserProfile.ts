import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    
    // Get current user
    const user = await base44.auth.me();
    if (!user) {
      return Response.json({ 
        success: false, 
        message: 'Unauthorized' 
      }, { status: 401 });
    }

    // Check if user is activated
    if (!user.is_activated) {
      return Response.json({ 
        success: false, 
        message: 'Account must be activated first' 
      }, { status: 403 });
    }

    // Parse request body
    const { user_type, profile_data } = await req.json();

    if (user_type !== user.user_type) {
      return Response.json({ 
        success: false, 
        message: 'User type mismatch' 
      }, { status: 400 });
    }

    // Update or create the appropriate entity based on user type
    if (user_type === 'teacher') {
      if (user.linked_teacher_id) {
        // Update existing teacher record
        await base44.asServiceRole.entities.Teacher.update(user.linked_teacher_id, {
          first_name: profile_data.first_name,
          last_name: profile_data.last_name,
          phone: profile_data.phone,
          department: profile_data.department,
          position: profile_data.position,
          hire_date: profile_data.hire_date,
        });
      } else {
        // Create new teacher record if it doesn't exist
        const teacher = await base44.asServiceRole.entities.Teacher.create({
          first_name: profile_data.first_name,
          last_name: profile_data.last_name,
          staff_id: profile_data.staff_id || `STAFF${Date.now()}`,
          email: user.email,
          phone: profile_data.phone,
          department: profile_data.department,
          position: profile_data.position,
          hire_date: profile_data.hire_date,
          status: 'Active'
        });
        
        // Link teacher to user
        await base44.auth.updateMe({
          linked_teacher_id: teacher.id
        });
      }
    } else if (user_type === 'student') {
      if (user.linked_student_id) {
        // Update existing student record
        await base44.asServiceRole.entities.Student.update(user.linked_student_id, {
          first_name: profile_data.first_name,
          last_name: profile_data.last_name,
          phone: profile_data.phone,
          address: profile_data.address,
        });
      } else {
        // Create new student record if it doesn't exist
        const student = await base44.asServiceRole.entities.Student.create({
          first_name: profile_data.first_name,
          last_name: profile_data.last_name,
          student_id: profile_data.student_id || `STU${Date.now()}`,
          email: user.email,
          phone: profile_data.phone,
          address: profile_data.address,
          grade_level: '1',
          status: 'Active'
        });
        
        // Link student to user
        await base44.auth.updateMe({
          linked_student_id: student.id
        });
      }
    } else if (user_type === 'parent') {
      // For parents, just update their basic info in the User entity
      await base44.auth.updateMe({
        full_name: `${profile_data.first_name} ${profile_data.last_name}`
      });
    }

    // Mark profile as completed
    await base44.auth.updateMe({
      profile_completed: true
    });

    return Response.json({ 
      success: true, 
      message: 'Profile completed successfully' 
    });

  } catch (error) {
    console.error('Profile completion error:', error);
    return Response.json({ 
      success: false, 
      message: 'Failed to complete profile: ' + error.message 
    }, { status: 500 });
  }
});