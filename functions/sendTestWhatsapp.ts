import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (user.role !== 'admin') {
      return Response.json({ error: 'Admin access required' }, { status: 403 });
    }

    const { to, message, config } = await req.json();

    if (!to || !message || !config) {
      return Response.json({ error: 'Missing required fields (to, message, config)' }, { status: 400 });
    }

    let result;

    if (config.provider === 'twilio') {
      if (!config.account_sid || !config.auth_token || !config.whatsapp_number) {
        return Response.json({ 
          success: false, 
          error: 'Twilio WhatsApp configuration incomplete. Please provide Account SID, Auth Token, and WhatsApp Number.' 
        }, { status: 400 });
      }

      const authString = btoa(`${config.account_sid}:${config.auth_token}`);
      
      // Format numbers for WhatsApp
      const toNumber = to.startsWith('whatsapp:') ? to : `whatsapp:${to}`;
      const fromNumber = config.whatsapp_number.startsWith('whatsapp:') 
        ? config.whatsapp_number 
        : `whatsapp:${config.whatsapp_number}`;

      const response = await fetch(
        `https://api.twilio.com/2010-04-01/Accounts/${config.account_sid}/Messages.json`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Basic ${authString}`,
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          body: new URLSearchParams({
            To: toNumber,
            From: fromNumber,
            Body: message,
          }),
        }
      );

      result = await response.json();

      if (!response.ok) {
        return Response.json({ 
          success: false, 
          error: `Twilio WhatsApp error: ${result.message || 'Unknown error'}` 
        }, { status: response.status });
      }

    } else if (config.provider === 'meta') {
      if (!config.account_sid || !config.auth_token || !config.whatsapp_number) {
        return Response.json({ 
          success: false, 
          error: 'Meta WhatsApp Business API configuration incomplete.' 
        }, { status: 400 });
      }

      // Meta WhatsApp Business API
      const phoneNumberId = config.whatsapp_number.replace(/\D/g, '');
      const recipientNumber = to.replace(/\D/g, '');

      const response = await fetch(
        `https://graph.facebook.com/v17.0/${phoneNumberId}/messages`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${config.auth_token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            messaging_product: 'whatsapp',
            to: recipientNumber,
            type: 'text',
            text: { body: message },
          }),
        }
      );

      result = await response.json();

      if (!response.ok || result.error) {
        return Response.json({ 
          success: false, 
          error: `Meta WhatsApp error: ${result.error?.message || 'Unknown error'}` 
        }, { status: response.status || 400 });
      }

    } else {
      return Response.json({ 
        success: false, 
        error: `Unsupported WhatsApp provider: ${config.provider}` 
      }, { status: 400 });
    }

    return Response.json({ 
      success: true, 
      message: 'Test WhatsApp message sent successfully',
      result 
    });

  } catch (error) {
    console.error('WhatsApp sending error:', error);
    return Response.json({ 
      success: false, 
      error: error.message || 'Failed to send WhatsApp message' 
    }, { status: 500 });
  }
});