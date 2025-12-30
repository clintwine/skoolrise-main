import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { to, subject, body, attachments } = await req.json();

    if (!to || !subject || !body) {
      return Response.json({ error: 'Missing required fields: to, subject, body' }, { status: 400 });
    }

    // Get user's email configuration
    if (!user.email_settings) {
      return Response.json({ 
        error: 'No email configuration found. Please configure email settings first.' 
      }, { status: 400 });
    }

    const emailConfig = JSON.parse(user.email_settings);

    // Handle different email providers
    if (emailConfig.provider === 'api') {
      // API-based providers (Resend, SendGrid, Mailgun)
      if (emailConfig.api_provider === 'resend') {
        const response = await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${emailConfig.api_key}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            from: emailConfig.from_name 
              ? `${emailConfig.from_name} <${emailConfig.from_email}>` 
              : emailConfig.from_email,
            to: [to],
            subject: subject,
            text: body,
          }),
        });

        const data = await response.json();
        
        if (!response.ok) {
          return Response.json({ 
            error: 'Failed to send email via Resend', 
            details: data 
          }, { status: response.status });
        }

        return Response.json({ success: true, provider: 'resend', messageId: data.id });

      } else if (emailConfig.api_provider === 'sendgrid') {
        const response = await fetch('https://api.sendgrid.com/v3/mail/send', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${emailConfig.api_key}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            personalizations: [{ to: [{ email: to }] }],
            from: { 
              email: emailConfig.from_email,
              name: emailConfig.from_name || 'SkoolRise'
            },
            subject: subject,
            content: [{ type: 'text/plain', value: body }],
          }),
        });

        if (!response.ok) {
          const error = await response.text();
          return Response.json({ 
            error: 'Failed to send email via SendGrid', 
            details: error 
          }, { status: response.status });
        }

        return Response.json({ success: true, provider: 'sendgrid' });

      } else if (emailConfig.api_provider === 'mailgun') {
        const domain = emailConfig.sending_domain || 'sandbox.mailgun.org';
        const formData = new FormData();
        formData.append('from', emailConfig.from_name 
          ? `${emailConfig.from_name} <${emailConfig.from_email}>` 
          : emailConfig.from_email);
        formData.append('to', to);
        formData.append('subject', subject);
        formData.append('text', body);

        const response = await fetch(`https://api.mailgun.net/v3/${domain}/messages`, {
          method: 'POST',
          headers: {
            'Authorization': `Basic ${btoa(`api:${emailConfig.api_key}`)}`,
          },
          body: formData,
        });

        const data = await response.json();

        if (!response.ok) {
          return Response.json({ 
            error: 'Failed to send email via Mailgun', 
            details: data 
          }, { status: response.status });
        }

        return Response.json({ success: true, provider: 'mailgun', messageId: data.id });
      }

    } else if (emailConfig.provider === 'smtp') {
      // For SMTP, we'll use a simpler approach via SendGrid's SMTP relay or similar
      // Note: Direct SMTP in Deno requires more complex setup, so we'll use an HTTP-to-SMTP service
      return Response.json({ 
        error: 'SMTP support requires additional configuration. Please use API-based providers (Resend, SendGrid, Mailgun) for now.' 
      }, { status: 400 });
    }

    return Response.json({ 
      error: 'Unsupported email provider configuration' 
    }, { status: 400 });

  } catch (error) {
    console.error('Error sending email:', error);
    return Response.json({ 
      error: 'Failed to send email', 
      details: error.message 
    }, { status: 500 });
  }
});