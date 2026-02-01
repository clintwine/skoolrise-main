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
      if (!config.account_sid || !config.auth_token || !config.sender_number) {
        return Response.json({ 
          success: false, 
          error: 'Twilio configuration incomplete. Please provide Account SID, Auth Token, and Sender Number.' 
        }, { status: 400 });
      }

      const authString = btoa(`${config.account_sid}:${config.auth_token}`);
      const response = await fetch(
        `https://api.twilio.com/2010-04-01/Accounts/${config.account_sid}/Messages.json`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Basic ${authString}`,
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          body: new URLSearchParams({
            To: to,
            From: config.sender_number,
            Body: message,
          }),
        }
      );

      result = await response.json();

      if (!response.ok) {
        return Response.json({ 
          success: false, 
          error: `Twilio error: ${result.message || 'Unknown error'}` 
        }, { status: response.status });
      }

    } else if (config.provider === 'vonage') {
      if (!config.account_sid || !config.auth_token || !config.sender_number) {
        return Response.json({ 
          success: false, 
          error: 'Vonage configuration incomplete.' 
        }, { status: 400 });
      }

      const response = await fetch('https://rest.nexmo.com/sms/json', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          api_key: config.account_sid,
          api_secret: config.auth_token,
          to: to.replace('+', ''),
          from: config.sender_number,
          text: message,
        }),
      });

      result = await response.json();

      if (result.messages?.[0]?.status !== '0') {
        return Response.json({ 
          success: false, 
          error: `Vonage error: ${result.messages?.[0]?.['error-text'] || 'Unknown error'}` 
        }, { status: 400 });
      }

    } else if (config.provider === 'plivo') {
      if (!config.account_sid || !config.auth_token || !config.sender_number) {
        return Response.json({ 
          success: false, 
          error: 'Plivo configuration incomplete.' 
        }, { status: 400 });
      }

      const authString = btoa(`${config.account_sid}:${config.auth_token}`);
      const response = await fetch(
        `https://api.plivo.com/v1/Account/${config.account_sid}/Message/`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Basic ${authString}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            src: config.sender_number,
            dst: to.replace('+', ''),
            text: message,
          }),
        }
      );

      result = await response.json();

      if (!response.ok) {
        return Response.json({ 
          success: false, 
          error: `Plivo error: ${result.error || 'Unknown error'}` 
        }, { status: response.status });
      }

    } else if (config.provider === 'custom') {
      if (!config.custom_endpoint) {
        return Response.json({ 
          success: false, 
          error: 'Custom API endpoint is required.' 
        }, { status: 400 });
      }

      let headers = {};
      if (config.custom_headers) {
        try {
          headers = JSON.parse(config.custom_headers);
        } catch (e) {
          return Response.json({ 
            success: false, 
            error: 'Invalid headers JSON format.' 
          }, { status: 400 });
        }
      }

      let body;
      if (config.custom_payload) {
        try {
          const payloadTemplate = config.custom_payload
            .replace(/\{\{phone\}\}/g, to)
            .replace(/\{\{text\}\}/g, message);
          body = payloadTemplate;
        } catch (e) {
          body = JSON.stringify({ phone: to, message });
        }
      } else {
        body = JSON.stringify({ phone: to, message });
      }

      const response = await fetch(config.custom_endpoint, {
        method: config.custom_method || 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...headers,
        },
        body: config.custom_method === 'GET' ? undefined : body,
      });

      result = await response.json();

      if (!response.ok) {
        return Response.json({ 
          success: false, 
          error: `Custom API error: ${result.message || result.error || 'Unknown error'}` 
        }, { status: response.status });
      }

    } else {
      return Response.json({ 
        success: false, 
        error: `Unsupported SMS provider: ${config.provider}` 
      }, { status: 400 });
    }

    return Response.json({ 
      success: true, 
      message: 'Test SMS sent successfully',
      result 
    });

  } catch (error) {
    console.error('SMS sending error:', error);
    return Response.json({ 
      success: false, 
      error: error.message || 'Failed to send SMS' 
    }, { status: 500 });
  }
});