import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { to, subject, body, config } = await req.json();

    if (!to || !subject || !body || !config) {
      return Response.json({ error: 'Missing required fields' }, { status: 400 });
    }

    let result;

    if (config.provider === 'smtp') {
      // SMTP sending
      if (!config.smtp_host || !config.smtp_username || !config.smtp_password) {
        return Response.json({ 
          success: false, 
          error: 'SMTP configuration incomplete. Please provide host, username, and password.' 
        }, { status: 400 });
      }

      // Use nodemailer via npm
      const nodemailer = await import('npm:nodemailer@6.9.9');
      
      const transporter = nodemailer.default.createTransport({
        host: config.smtp_host,
        port: parseInt(config.smtp_port) || 587,
        secure: config.smtp_encryption === 'SSL',
        auth: {
          user: config.smtp_username,
          pass: config.smtp_password,
        },
      });

      result = await transporter.sendMail({
        from: config.from_email 
          ? `"${config.from_name || 'SkoolRise'}" <${config.from_email}>`
          : config.smtp_username,
        to,
        subject,
        text: body,
      });

    } else if (config.provider === 'api') {
      // API-based sending (Resend, SendGrid, etc.)
      if (!config.api_key) {
        return Response.json({ 
          success: false, 
          error: 'API key is required for API-based email sending.' 
        }, { status: 400 });
      }

      if (config.api_provider === 'resend') {
        const response = await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${config.api_key}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            from: config.from_email || config.sending_domain || 'onboarding@resend.dev',
            to: [to],
            subject,
            text: body,
          }),
        });

        result = await response.json();
        
        if (!response.ok) {
          return Response.json({ 
            success: false, 
            error: `Resend API error: ${result.message || 'Unknown error'}` 
          }, { status: response.status });
        }

      } else if (config.api_provider === 'sendgrid') {
        const response = await fetch('https://api.sendgrid.com/v3/mail/send', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${config.api_key}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            personalizations: [{ to: [{ email: to }] }],
            from: { 
              email: config.from_email || config.sending_domain,
              name: config.from_name || 'SkoolRise'
            },
            subject,
            content: [{ type: 'text/plain', value: body }],
          }),
        });

        if (!response.ok) {
          const error = await response.text();
          return Response.json({ 
            success: false, 
            error: `SendGrid API error: ${error}` 
          }, { status: response.status });
        }
        result = { id: 'sendgrid-success' };

      } else if (config.api_provider === 'mailgun') {
        const domain = config.sending_domain || 'sandbox.mailgun.org';
        const response = await fetch(`https://api.mailgun.net/v3/${domain}/messages`, {
          method: 'POST',
          headers: {
            'Authorization': `Basic ${btoa(`api:${config.api_key}`)}`,
          },
          body: new URLSearchParams({
            from: `${config.from_name || 'SkoolRise'} <${config.from_email || `mailgun@${domain}`}>`,
            to,
            subject,
            text: body,
          }),
        });

        result = await response.json();
        
        if (!response.ok) {
          return Response.json({ 
            success: false, 
            error: `Mailgun API error: ${result.message || 'Unknown error'}` 
          }, { status: response.status });
        }

      } else {
        return Response.json({ 
          success: false, 
          error: `Unsupported API provider: ${config.api_provider}` 
        }, { status: 400 });
      }
    } else {
      return Response.json({ 
        success: false, 
        error: 'Invalid provider type. Use "smtp" or "api".' 
      }, { status: 400 });
    }

    return Response.json({ 
      success: true, 
      message: 'Email sent successfully',
      result 
    });

  } catch (error) {
    console.error('Email sending error:', error);
    return Response.json({ 
      success: false, 
      error: error.message || 'Failed to send email' 
    }, { status: 500 });
  }
});