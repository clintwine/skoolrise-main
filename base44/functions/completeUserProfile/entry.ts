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

    // Check if user has this type
    if (!user.user_types || !user.user_types.includes(user_type)) {
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
          user_id: user.id,
          first_name: profile_data.first_name,
          last_name: profile_data.last_name,
          staff_id: `STAFF${Date.now()}`,
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
          user_id: user.id,
          first_name: profile_data.first_name,
          last_name: profile_data.last_name,
          student_id_number: `STU${Date.now()}`,
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
      if (user.linked_parent_id) {
        // Update existing parent record
        await base44.asServiceRole.entities.Parent.update(user.linked_parent_id, {
          first_name: profile_data.first_name,
          last_name: profile_data.last_name,
          phone: profile_data.phone,
          address: profile_data.address,
        });
      } else {
        // Create new parent record
        const parent = await base44.asServiceRole.entities.Parent.create({
          user_id: user.id,
          first_name: profile_data.first_name,
          last_name: profile_data.last_name,
          phone: profile_data.phone,
          address: profile_data.address,
        });
        
        await base44.auth.updateMe({
          linked_parent_id: parent.id
        });
      }
    } else if (user_type === 'vendor') {
      if (user.linked_vendor_id) {
        // Update existing vendor record
        await base44.asServiceRole.entities.Vendor.update(user.linked_vendor_id, {
          business_name: profile_data.business_name,
          contact_person: profile_data.contact_person,
          phone: profile_data.phone,
          category: profile_data.category,
          address: profile_data.address,
        });
      } else {
        // Create new vendor record
        const vendor = await base44.asServiceRole.entities.Vendor.create({
          user_id: user.id,
          business_name: profile_data.business_name,
          contact_person: profile_data.contact_person,
          phone: profile_data.phone,
          category: profile_data.category,
          address: profile_data.address,
          status: 'Active',
        });
        
        await base44.auth.updateMe({
          linked_vendor_id: vendor.id
        });
      }
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