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

    // Parse request body
    const { activation_code } = await req.json();
    
    if (!activation_code) {
      return Response.json({ 
        success: false, 
        message: 'Activation code is required' 
      }, { status: 400 });
    }

    // Check if user is already activated
    if (user.is_activated) {
      return Response.json({ 
        success: false, 
        message: 'Account is already activated' 
      });
    }

    // Verify activation code matches and is not expired
    if (user.activation_code !== activation_code.trim()) {
      return Response.json({ 
        success: false, 
        message: 'Invalid activation code' 
      });
    }

    // Check expiry
    if (user.activation_code_expiry) {
      const expiryDate = new Date(user.activation_code_expiry);
      const now = new Date();
      
      if (now > expiryDate) {
        return Response.json({ 
          success: false, 
          message: 'Activation code has expired. Please request a new code from your administrator.' 
        });
      }
    }

    // Activate the user
    await base44.auth.updateMe({
      is_activated: true,
      activation_code: null,
      activation_code_expiry: null
    });

    return Response.json({ 
      success: true, 
      message: 'Account activated successfully' 
    });

  } catch (error) {
    console.error('Activation error:', error);
    return Response.json({ 
      success: false, 
      message: 'Failed to activate account: ' + error.message 
    }, { status: 500 });
  }
});