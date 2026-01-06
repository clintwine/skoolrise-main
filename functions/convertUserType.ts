import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user || (user.role !== 'admin' && user.user_type !== 'admin')) {
      return Response.json({ error: 'Unauthorized: Admin access required' }, { status: 403 });
    }

    const { userId, oldUserType, newUserType } = await req.json();

    if (!userId || !newUserType) {
      return Response.json({ error: 'Missing required parameters' }, { status: 400 });
    }

    const nameParts = (user.full_name || '').split(' ');
    const firstName = nameParts[0] || '';
    const lastName = nameParts.slice(1).join(' ') || '';

    // Fetch existing profiles
    const [teachers, students, parents, vendors] = await Promise.all([
      base44.asServiceRole.entities.Teacher.filter({ user_id: userId }),
      base44.asServiceRole.entities.Student.filter({ user_id: userId }),
      base44.asServiceRole.entities.Parent.filter({ user_id: userId }),
      base44.asServiceRole.entities.Vendor.filter({ user_id: userId }),
    ]);

    const profiles = {
      teacher: teachers[0],
      student: students[0],
      parent: parents[0],
      vendor: vendors[0],
    };

    const actions = [];

    // Step 1: Archive old profile if exists and is different from new type
    if (oldUserType && oldUserType !== newUserType && oldUserType !== 'admin') {
      const oldProfile = profiles[oldUserType];
      if (oldProfile) {
        if (oldUserType === 'student' && oldProfile.status !== 'Inactive') {
          actions.push({ action: 'archive', type: 'student', id: oldProfile.id });
        } else if (oldUserType === 'teacher' && oldProfile.status !== 'Inactive') {
          actions.push({ action: 'archive', type: 'teacher', id: oldProfile.id });
        } else if (oldUserType === 'vendor' && oldProfile.status !== 'Inactive') {
          actions.push({ action: 'archive', type: 'vendor', id: oldProfile.id });
        }
      }
    }

    // Step 2: Handle new profile - reactivate if inactive, create if doesn't exist
    const newProfile = profiles[newUserType];
    
    if (newProfile) {
      const isInactive = newProfile.status === 'Inactive' || newProfile.status === 'Archived';
      if (isInactive && newUserType !== 'parent') {
        actions.push({ action: 'reactivate', type: newUserType, id: newProfile.id });
      }
    } else if (newUserType !== 'admin') {
      // Need to fetch target user's details for creating profile
      const [targetUser] = await base44.asServiceRole.entities.User.filter({ id: userId });
      const targetNameParts = (targetUser.full_name || '').split(' ');
      const targetFirstName = targetNameParts[0] || '';
      const targetLastName = targetNameParts.slice(1).join(' ') || '';
      
      actions.push({ 
        action: 'create', 
        type: newUserType, 
        userData: { 
          user_id: userId, 
          firstName: targetFirstName, 
          lastName: targetLastName,
          fullName: targetUser.full_name 
        } 
      });
    }

    // Execute all actions
    for (const action of actions) {
      if (action.action === 'archive') {
        if (action.type === 'student') {
          await base44.asServiceRole.entities.Student.update(action.id, { status: 'Inactive' });
        } else if (action.type === 'teacher') {
          await base44.asServiceRole.entities.Teacher.update(action.id, { status: 'Inactive' });
        } else if (action.type === 'vendor') {
          await base44.asServiceRole.entities.Vendor.update(action.id, { status: 'Inactive' });
        }
      } else if (action.action === 'reactivate') {
        if (action.type === 'student') {
          await base44.asServiceRole.entities.Student.update(action.id, { status: 'Active' });
        } else if (action.type === 'teacher') {
          await base44.asServiceRole.entities.Teacher.update(action.id, { status: 'Active' });
        } else if (action.type === 'vendor') {
          await base44.asServiceRole.entities.Vendor.update(action.id, { status: 'Active' });
        }
      } else if (action.action === 'create') {
        const { firstName, lastName, fullName } = action.userData;
        
        if (action.type === 'student') {
          await base44.asServiceRole.entities.Student.create({
            user_id: userId,
            first_name: firstName,
            last_name: lastName,
            student_id_number: `STU-${Date.now()}`,
            grade_level: 'Unassigned',
            status: 'Active',
          });
        } else if (action.type === 'teacher') {
          await base44.asServiceRole.entities.Teacher.create({
            user_id: userId,
            first_name: firstName,
            last_name: lastName,
            staff_id: `TCH-${Date.now()}`,
            status: 'Active',
          });
        } else if (action.type === 'parent') {
          await base44.asServiceRole.entities.Parent.create({
            user_id: userId,
            first_name: firstName,
            last_name: lastName,
            phone: '',
          });
        } else if (action.type === 'vendor') {
          await base44.asServiceRole.entities.Vendor.create({
            user_id: userId,
            business_name: fullName || 'New Vendor',
            contact_person: fullName || '',
            phone: '',
            category: 'Distributor',
            status: 'Active',
          });
        }
      }
    }

    // Step 3: Update User entity with new type and role
    const updateData = { user_type: newUserType };
    if (newUserType === 'admin') {
      updateData.role = 'admin';
    } else {
      updateData.role = 'user';
    }

    await base44.asServiceRole.entities.User.update(userId, updateData);

    return Response.json({ 
      success: true, 
      message: `User type converted from ${oldUserType || 'none'} to ${newUserType}`,
      actions: actions.map(a => `${a.action} ${a.type}`)
    });

  } catch (error) {
    console.error('Error converting user type:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});