import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    
    // Get current user
    const user = await base44.auth.me();
    if (!user || user.role !== 'admin') {
      return Response.json({ 
        success: false, 
        message: 'Unauthorized - Admin access required' 
      }, { status: 403 });
    }

    // Parse request body
    const { user_id, validity_hours = 48 } = await req.json();
    
    if (!user_id) {
      return Response.json({ 
        success: false, 
        message: 'User ID is required' 
      }, { status: 400 });
    }

    // Generate a random 6-character activation code
    const code = Math.random().toString(36).substring(2, 8).toUpperCase();
    
    // Calculate expiry date
    const expiryDate = new Date();
    expiryDate.setHours(expiryDate.getHours() + validity_hours);

    // Update the target user with the activation code
    const users = await base44.asServiceRole.entities.User.filter({ id: user_id });
    
    if (users.length === 0) {
      return Response.json({ 
        success: false, 
        message: 'User not found' 
      }, { status: 404 });
    }

    await base44.asServiceRole.entities.User.update(user_id, {
      activation_code: code,
      activation_code_expiry: expiryDate.toISOString()
    });

    return Response.json({ 
      success: true, 
      activation_code: code,
      expiry_date: expiryDate.toISOString(),
      message: 'Activation code generated successfully'
    });

  } catch (error) {
    console.error('Code generation error:', error);
    return Response.json({ 
      success: false, 
      message: 'Failed to generate activation code: ' + error.message 
    }, { status: 500 });
  }
});