import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Mail, MessageSquare, Send, CheckCircle, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';

export default function NotificationsSettings() {
  const [emailConfig, setEmailConfig] = useState({
    provider: 'smtp',
    smtp_host: '',
    smtp_port: '587',
    smtp_username: '',
    smtp_password: '',
    smtp_encryption: 'TLS',
    from_name: '',
    from_email: '',
    api_provider: 'sendgrid',
    api_key: '',
    sending_domain: '',
  });

  const [smsConfig, setSmsConfig] = useState({
    provider: 'twilio',
    account_sid: '',
    auth_token: '',
    sender_number: '',
    custom_endpoint: '',
    custom_method: 'POST',
    custom_headers: '',
    custom_payload: '',
    opt_out_keyword: 'STOP',
    compliance_message: 'Msg & data rates may apply. Reply STOP to opt out.',
    use_case: 'transactional',
  });

  const [whatsappConfig, setWhatsappConfig] = useState({
    provider: 'twilio',
    account_sid: '',
    auth_token: '',
    whatsapp_number: '',
  });

  const [testEmail, setTestEmail] = useState('');
  const [testPhone, setTestPhone] = useState('');
  const [testWhatsapp, setTestWhatsapp] = useState('');
  const [testing, setTesting] = useState({ email: false, sms: false, whatsapp: false });
  const [saving, setSaving] = useState({ email: false, sms: false, whatsapp: false });

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const currentUser = await base44.auth.me();
        const schoolTenant = currentUser.school_tenant_id ? 
          await base44.entities.SchoolTenant.read(currentUser.school_tenant_id) : null;

        if (schoolTenant?.settings) {
          try {
            const schoolSettings = JSON.parse(schoolTenant.settings);
            if (schoolSettings.email_settings) setEmailConfig(JSON.parse(schoolSettings.email_settings));
            if (schoolSettings.sms_settings) setSmsConfig(JSON.parse(schoolSettings.sms_settings));
            if (schoolSettings.whatsapp_settings) setWhatsappConfig(JSON.parse(schoolSettings.whatsapp_settings));
          } catch (e) {
            console.log('School settings not in expected format');
          }
        }
      } catch (error) {
        console.error("Failed to load notification settings:", error);
      }
    };
    fetchSettings();
  }, []);

  const handleSaveEmailConfig = async () => {
    if (emailConfig.provider === 'smtp') {
      if (!emailConfig.smtp_host || !emailConfig.smtp_username || !emailConfig.smtp_password) {
        toast.error('Please fill in SMTP host, username, and password');
        return;
      }
    } else {
      if (!emailConfig.api_key) {
        toast.error('Please fill in API key');
        return;
      }
    }

    if (!emailConfig.from_email) {
      toast.error('Please fill in From Email');
      return;
    }

    setSaving({ ...saving, email: true });
    try {
      const currentUser = await base44.auth.me();
      if (currentUser.school_tenant_id) {
        const schoolTenant = await base44.entities.SchoolTenant.read(currentUser.school_tenant_id);
        const currentSettings = schoolTenant.settings ? JSON.parse(schoolTenant.settings) : {};
        const updatedSettings = { ...currentSettings, email_settings: JSON.stringify(emailConfig) };
        await base44.entities.SchoolTenant.update(currentUser.school_tenant_id, { settings: JSON.stringify(updatedSettings) });
      }
      toast.success('Email configuration saved successfully!');
    } catch (error) {
      toast.error('Failed to save: ' + error.message);
    } finally {
      setSaving({ ...saving, email: false });
    }
  };

  const handleTestEmail = async () => {
    if (!testEmail) {
      toast.error('Please enter a test email address');
      return;
    }

    // Validate configuration before testing
    if (emailConfig.provider === 'smtp') {
      if (!emailConfig.smtp_host || !emailConfig.smtp_username || !emailConfig.smtp_password) {
        toast.error('Please complete SMTP configuration (host, username, password) before testing');
        return;
      }
    } else if (emailConfig.provider === 'api') {
      if (!emailConfig.api_key) {
        toast.error('Please provide API key before testing');
        return;
      }
    }

    if (!emailConfig.from_name) {
      toast.error('Please fill in "From Name" before testing');
      return;
    }

    setTesting({ ...testing, email: true });
    try {
      const configDetails = emailConfig.provider === 'smtp' 
        ? `SMTP Host: ${emailConfig.smtp_host}\nPort: ${emailConfig.smtp_port}\nEncryption: ${emailConfig.smtp_encryption}`
        : `API Provider: ${emailConfig.api_provider}\nSending Domain: ${emailConfig.sending_domain || emailConfig.from_email}`;

      // Use custom email function to test with actual configuration
      const response = await base44.functions.invoke('sendCustomEmail', {
        to: testEmail,
        subject: `Test Email - ${emailConfig.from_name}`,
        body: `This is a test email to verify your notification settings.\n\n` +
              `=== Configuration Being Tested ===\n` +
              `From Name: ${emailConfig.from_name}\n` +
              `From Email: ${emailConfig.from_email}\n` +
              `Provider Type: ${emailConfig.provider === 'smtp' ? 'SMTP' : 'API'}\n` +
              `${configDetails}\n\n` +
              `=== Result ===\n` +
              `✅ If you received this email, your configuration is working correctly!\n` +
              `You can now save your settings.\n\n` +
              `Sent at: ${new Date().toLocaleString()}`,
        config: emailConfig,
      });

      if (response.data.success) {
        toast.success(`✅ Test email sent successfully via ${emailConfig.provider === 'smtp' ? 'SMTP' : emailConfig.api_provider}! Check ${testEmail} to confirm delivery.`);
      } else {
        toast.error(`❌ ${response.data.error || 'Failed to send test email'}`);
      }
    } catch (error) {
      toast.error(`❌ Failed to send: ${error.message}. Please verify your configuration.`);
    } finally {
      setTesting({ ...testing, email: false });
    }
  };

  const handleSaveSmsConfig = async () => {
    if (smsConfig.provider !== 'custom') {
      if (!smsConfig.account_sid || !smsConfig.auth_token || !smsConfig.sender_number) {
        toast.error('Please fill in Account SID, Auth Token, and Sender Number');
        return;
      }
    } else {
      if (!smsConfig.custom_endpoint) {
        toast.error('Please fill in API Endpoint URL');
        return;
      }
    }

    setSaving({ ...saving, sms: true });
    try {
      const currentUser = await base44.auth.me();
      if (currentUser.school_tenant_id) {
        const schoolTenant = await base44.entities.SchoolTenant.read(currentUser.school_tenant_id);
        const currentSettings = schoolTenant.settings ? JSON.parse(schoolTenant.settings) : {};
        const updatedSettings = { ...currentSettings, sms_settings: JSON.stringify(smsConfig) };
        await base44.entities.SchoolTenant.update(currentUser.school_tenant_id, { settings: JSON.stringify(updatedSettings) });
      }
      toast.success('SMS configuration saved successfully!');
    } catch (error) {
      toast.error('Failed to save: ' + error.message);
    } finally {
      setSaving({ ...saving, sms: false });
    }
  };

  const handleTestSms = async () => {
    if (!testPhone) {
      toast.error('Please enter a test phone number');
      return;
    }

    if (smsConfig.provider !== 'custom') {
      if (!smsConfig.account_sid || !smsConfig.auth_token || !smsConfig.sender_number) {
        toast.error('Please fill in SMS configuration before testing');
        return;
      }
    } else if (!smsConfig.custom_endpoint) {
      toast.error('Please fill in API endpoint for custom SMS');
      return;
    }

    setTesting({ ...testing, sms: true });
    try {
      const response = await base44.functions.invoke('sendTestSms', {
        to: testPhone,
        message: `Test SMS from SkoolRise - ${new Date().toLocaleString()}`,
        config: smsConfig,
      });

      if (response.data.success) {
        toast.success(`✅ Test SMS sent successfully via ${smsConfig.provider}! Check ${testPhone} to confirm delivery.`);
      } else {
        toast.error(`❌ ${response.data.error || 'Failed to send test SMS'}`);
      }
    } catch (error) {
      toast.error('Failed to send test SMS: ' + error.message);
    } finally {
      setTesting({ ...testing, sms: false });
    }
  };

  const handleSaveWhatsappConfig = async () => {
    if (!whatsappConfig.account_sid || !whatsappConfig.auth_token || !whatsappConfig.whatsapp_number) {
      toast.error('Please fill in all WhatsApp configuration fields');
      return;
    }

    setSaving({ ...saving, whatsapp: true });
    try {
      const currentUser = await base44.auth.me();
      if (currentUser.school_tenant_id) {
        const schoolTenant = await base44.entities.SchoolTenant.read(currentUser.school_tenant_id);
        const currentSettings = schoolTenant.settings ? JSON.parse(schoolTenant.settings) : {};
        const updatedSettings = { ...currentSettings, whatsapp_settings: JSON.stringify(whatsappConfig) };
        await base44.entities.SchoolTenant.update(currentUser.school_tenant_id, { settings: JSON.stringify(updatedSettings) });
      }
      toast.success('WhatsApp configuration saved successfully!');
    } catch (error) {
      toast.error('Failed to save: ' + error.message);
    } finally {
      setSaving({ ...saving, whatsapp: false });
    }
  };

  const handleTestWhatsapp = async () => {
    if (!testWhatsapp) {
      toast.error('Please enter a test WhatsApp number');
      return;
    }

    if (!whatsappConfig.account_sid || !whatsappConfig.auth_token || !whatsappConfig.whatsapp_number) {
      toast.error('Please fill in WhatsApp configuration before testing');
      return;
    }

    setTesting({ ...testing, whatsapp: true });
    try {
      const response = await base44.functions.invoke('sendTestWhatsapp', {
        to: testWhatsapp,
        message: `Test WhatsApp from SkoolRise - ${new Date().toLocaleString()}`,
        config: whatsappConfig,
      });

      if (response.data.success) {
        toast.success(`✅ Test WhatsApp sent successfully via ${whatsappConfig.provider}! Check ${testWhatsapp} to confirm delivery.`);
      } else {
        toast.error(`❌ ${response.data.error || 'Failed to send test WhatsApp'}`);
      }
    } catch (error) {
      toast.error('Failed to send test WhatsApp: ' + error.message);
    } finally {
      setTesting({ ...testing, whatsapp: false });
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Notification Settings</h1>
        <p className="text-gray-600 mt-1">Configure email, SMS, and WhatsApp messaging</p>
      </div>

      <Tabs defaultValue="email" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="email">
            <Mail className="w-4 h-4 mr-2" />
            Email
          </TabsTrigger>
          <TabsTrigger value="sms">
            <MessageSquare className="w-4 h-4 mr-2" />
            SMS
          </TabsTrigger>
          <TabsTrigger value="whatsapp">
            <Send className="w-4 h-4 mr-2" />
            WhatsApp
          </TabsTrigger>
        </TabsList>

        <TabsContent value="email">
          <Card>
            <CardHeader>
              <CardTitle>Email Configuration</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <Label>Configuration Type</Label>
                <Select value={emailConfig.provider} onValueChange={(value) => setEmailConfig({ ...emailConfig, provider: value })}>
                  <SelectTrigger className="mt-2">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="smtp">SMTP Configuration (Universal)</SelectItem>
                    <SelectItem value="api">Managed API Integration</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {emailConfig.provider === 'smtp' ? (
                <>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>SMTP Host *</Label>
                      <Input
                        placeholder="e.g., smtp.sendgrid.net"
                        value={emailConfig.smtp_host}
                        onChange={(e) => setEmailConfig({ ...emailConfig, smtp_host: e.target.value })}
                        className="mt-2"
                      />
                    </div>
                    <div>
                      <Label>Port</Label>
                      <Input
                        placeholder="587, 465, or 25"
                        value={emailConfig.smtp_port}
                        onChange={(e) => setEmailConfig({ ...emailConfig, smtp_port: e.target.value })}
                        className="mt-2"
                      />
                    </div>
                  </div>

                  <div>
                    <Label>Username *</Label>
                    <Input
                      placeholder="Login email or API key username"
                      value={emailConfig.smtp_username}
                      onChange={(e) => setEmailConfig({ ...emailConfig, smtp_username: e.target.value })}
                      className="mt-2"
                    />
                  </div>

                  <div>
                    <Label>Password *</Label>
                    <Input
                      type="password"
                      placeholder="Account password or SMTP API Key"
                      value={emailConfig.smtp_password}
                      onChange={(e) => setEmailConfig({ ...emailConfig, smtp_password: e.target.value })}
                      className="mt-2"
                    />
                  </div>

                  <div>
                    <Label>Encryption</Label>
                    <Select value={emailConfig.smtp_encryption} onValueChange={(value) => setEmailConfig({ ...emailConfig, smtp_encryption: value })}>
                      <SelectTrigger className="mt-2">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="None">None</SelectItem>
                        <SelectItem value="SSL">SSL</SelectItem>
                        <SelectItem value="TLS">TLS</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </>
              ) : (
                <>
                  <div>
                    <Label>Email Provider</Label>
                    <Select value={emailConfig.api_provider} onValueChange={(value) => setEmailConfig({ ...emailConfig, api_provider: value })}>
                      <SelectTrigger className="mt-2">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="sendgrid">SendGrid</SelectItem>
                        <SelectItem value="mailgun">Mailgun</SelectItem>
                        <SelectItem value="resend">Resend</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label>API Key *</Label>
                    <Input
                      type="password"
                      placeholder="Your API key"
                      value={emailConfig.api_key}
                      onChange={(e) => setEmailConfig({ ...emailConfig, api_key: e.target.value })}
                      className="mt-2"
                    />
                  </div>

                  <div>
                    <Label>Sending Domain</Label>
                    <Input
                      placeholder="e.g., notifications@yourdomain.com"
                      value={emailConfig.sending_domain}
                      onChange={(e) => setEmailConfig({ ...emailConfig, sending_domain: e.target.value })}
                      className="mt-2"
                    />
                  </div>
                </>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>From Name</Label>
                  <Input
                    placeholder="e.g., SkoolRise Support"
                    value={emailConfig.from_name}
                    onChange={(e) => setEmailConfig({ ...emailConfig, from_name: e.target.value })}
                    className="mt-2"
                  />
                </div>
                <div>
                  <Label>From Email *</Label>
                  <Input
                    type="email"
                    placeholder="e.g., notifications@skoolrise.com"
                    value={emailConfig.from_email}
                    onChange={(e) => setEmailConfig({ ...emailConfig, from_email: e.target.value })}
                    className="mt-2"
                  />
                </div>
              </div>

              <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                <div className="flex items-start gap-2">
                  <AlertCircle className="w-5 h-5 text-blue-600 mt-0.5" />
                  <div className="text-sm text-blue-800">
                    <p className="font-semibold mb-1">Important: DNS Configuration</p>
                    <p>Update your DNS records with SPF and DKIM settings to prevent emails from going to spam. Check your email provider documentation for specific instructions.</p>
                  </div>
                </div>
              </div>

              <div className="border-t pt-4">
                <Label>Test Configuration</Label>
                <p className="text-xs text-gray-500 mb-2">
                  Test your email settings before saving. The system will use your configured provider ({emailConfig.provider === 'smtp' ? 'SMTP' : emailConfig.api_provider || 'API'}).
                </p>
                <div className="flex gap-2 mt-2">
                  <Input
                    type="email"
                    placeholder="Enter test email address"
                    value={testEmail}
                    onChange={(e) => setTestEmail(e.target.value)}
                  />
                  <Button onClick={handleTestEmail} disabled={testing.email} className="bg-blue-600 hover:bg-blue-700">
                    {testing.email ? 'Testing...' : 'Test Now'}
                  </Button>
                </div>
                <p className="text-xs text-green-600 mt-2">
                  ✓ This will test with your actual configuration. If successful, you can save the settings.
                </p>
              </div>

              <div className="flex gap-3">
                <Button onClick={handleSaveEmailConfig} className="bg-blue-600 hover:bg-blue-700" disabled={saving.email}>
                  <CheckCircle className="w-4 h-4 mr-2" />
                  {saving.email ? 'Saving...' : 'Save Configuration'}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="sms">
          <Card>
            <CardHeader>
              <CardTitle>SMS Configuration</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <Label>SMS Provider</Label>
                <Select value={smsConfig.provider} onValueChange={(value) => setSmsConfig({ ...smsConfig, provider: value })}>
                  <SelectTrigger className="mt-2">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="twilio">Twilio</SelectItem>
                    <SelectItem value="vonage">Vonage (Nexmo)</SelectItem>
                    <SelectItem value="plivo">Plivo</SelectItem>
                    <SelectItem value="custom">Custom HTTP/API</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {smsConfig.provider !== 'custom' ? (
                <>
                  <div>
                    <Label>Account SID *</Label>
                    <Input
                      placeholder="ACxxxxxxxxxxxxxxxx"
                      value={smsConfig.account_sid}
                      onChange={(e) => setSmsConfig({ ...smsConfig, account_sid: e.target.value })}
                      className="mt-2"
                    />
                  </div>

                  <div>
                    <Label>Auth Token *</Label>
                    <Input
                      type="password"
                      placeholder="Your authentication token"
                      value={smsConfig.auth_token}
                      onChange={(e) => setSmsConfig({ ...smsConfig, auth_token: e.target.value })}
                      className="mt-2"
                    />
                  </div>

                  <div>
                    <Label>Sender Number / ID *</Label>
                    <Input
                      placeholder="+1234567890 or Brand Name"
                      value={smsConfig.sender_number}
                      onChange={(e) => setSmsConfig({ ...smsConfig, sender_number: e.target.value })}
                      className="mt-2"
                    />
                    <p className="text-xs text-gray-600 mt-1">Your purchased virtual number or approved sender ID</p>
                  </div>
                </>
              ) : (
                <>
                  <div>
                    <Label>API Endpoint URL *</Label>
                    <Input
                      placeholder="https://api.gateway.com/v1/send"
                      value={smsConfig.custom_endpoint}
                      onChange={(e) => setSmsConfig({ ...smsConfig, custom_endpoint: e.target.value })}
                      className="mt-2"
                    />
                  </div>

                  <div>
                    <Label>HTTP Method</Label>
                    <Select value={smsConfig.custom_method} onValueChange={(value) => setSmsConfig({ ...smsConfig, custom_method: value })}>
                      <SelectTrigger className="mt-2">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="GET">GET</SelectItem>
                        <SelectItem value="POST">POST</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label>Headers (JSON)</Label>
                    <Textarea
                      placeholder='{"Authorization": "Bearer YOUR_TOKEN"}'
                      value={smsConfig.custom_headers}
                      onChange={(e) => setSmsConfig({ ...smsConfig, custom_headers: e.target.value })}
                      className="mt-2 font-mono text-sm"
                    />
                  </div>

                  <div>
                    <Label>Payload Template</Label>
                    <Textarea
                      placeholder='{"to": "{{phone}}", "message": "{{text}}"}'
                      value={smsConfig.custom_payload}
                      onChange={(e) => setSmsConfig({ ...smsConfig, custom_payload: e.target.value })}
                      className="mt-2 font-mono text-sm"
                    />
                  </div>
                </>
              )}

              <div className="bg-orange-50 p-4 rounded-lg border border-orange-200">
                <h4 className="font-semibold text-orange-900 mb-3">Compliance & Consent</h4>
                <div className="space-y-3">
                  <div>
                    <Label>Opt-out Keyword</Label>
                    <Input
                      placeholder="STOP"
                      value={smsConfig.opt_out_keyword}
                      onChange={(e) => setSmsConfig({ ...smsConfig, opt_out_keyword: e.target.value })}
                      className="mt-2"
                    />
                  </div>

                  <div>
                    <Label>Compliance Message</Label>
                    <Textarea
                      placeholder="Msg & data rates may apply. Reply STOP to opt out."
                      value={smsConfig.compliance_message}
                      onChange={(e) => setSmsConfig({ ...smsConfig, compliance_message: e.target.value })}
                      className="mt-2"
                    />
                  </div>

                  <div>
                    <Label>Use Case</Label>
                    <Select value={smsConfig.use_case} onValueChange={(value) => setSmsConfig({ ...smsConfig, use_case: value })}>
                      <SelectTrigger className="mt-2">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="transactional">Transactional</SelectItem>
                        <SelectItem value="marketing">Marketing</SelectItem>
                        <SelectItem value="2fa">2FA / Authentication</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              <div className="border-t pt-4">
                <Label>Send Test SMS</Label>
                <div className="flex gap-2 mt-2">
                  <Input
                    placeholder="Enter test phone number (E.164 format: +14155552671)"
                    value={testPhone}
                    onChange={(e) => setTestPhone(e.target.value)}
                  />
                  <Button onClick={handleTestSms} disabled={testing.sms} className="bg-blue-600 hover:bg-blue-700">
                    {testing.sms ? 'Sending...' : 'Send Test'}
                  </Button>
                </div>
              </div>

              <div className="flex gap-3">
                <Button onClick={handleSaveSmsConfig} className="bg-blue-600 hover:bg-blue-700" disabled={saving.sms}>
                  <CheckCircle className="w-4 h-4 mr-2" />
                  {saving.sms ? 'Saving...' : 'Save Configuration'}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="whatsapp">
          <Card>
            <CardHeader>
              <CardTitle>WhatsApp Configuration</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <Label>WhatsApp Provider</Label>
                <Select value={whatsappConfig.provider} onValueChange={(value) => setWhatsappConfig({ ...whatsappConfig, provider: value })}>
                  <SelectTrigger className="mt-2">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="twilio">Twilio WhatsApp API</SelectItem>
                    <SelectItem value="meta">Meta (WhatsApp Business API)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Account SID / API Key *</Label>
                <Input
                  placeholder="Your account identifier"
                  value={whatsappConfig.account_sid}
                  onChange={(e) => setWhatsappConfig({ ...whatsappConfig, account_sid: e.target.value })}
                  className="mt-2"
                />
              </div>

              <div>
                <Label>Auth Token / Secret *</Label>
                <Input
                  type="password"
                  placeholder="Your authentication token"
                  value={whatsappConfig.auth_token}
                  onChange={(e) => setWhatsappConfig({ ...whatsappConfig, auth_token: e.target.value })}
                  className="mt-2"
                />
              </div>

              <div>
                <Label>WhatsApp Number *</Label>
                <Input
                  placeholder="whatsapp:+14155238886"
                  value={whatsappConfig.whatsapp_number}
                  onChange={(e) => setWhatsappConfig({ ...whatsappConfig, whatsapp_number: e.target.value })}
                  className="mt-2"
                />
                <p className="text-xs text-gray-600 mt-1">Your approved WhatsApp Business number</p>
              </div>

              <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                <div className="flex items-start gap-2">
                  <AlertCircle className="w-5 h-5 text-green-600 mt-0.5" />
                  <div className="text-sm text-green-800">
                    <p className="font-semibold mb-1">WhatsApp Business Requirements</p>
                    <ul className="list-disc list-inside space-y-1">
                      <li>You need a verified WhatsApp Business Account</li>
                      <li>Template messages must be pre-approved by WhatsApp</li>
                      <li>24-hour messaging window for customer-initiated conversations</li>
                    </ul>
                  </div>
                </div>
              </div>

              <div className="border-t pt-4">
                <Label>Send Test WhatsApp</Label>
                <div className="flex gap-2 mt-2">
                  <Input
                    placeholder="Enter test WhatsApp number (+14155552671)"
                    value={testWhatsapp}
                    onChange={(e) => setTestWhatsapp(e.target.value)}
                  />
                  <Button onClick={handleTestWhatsapp} disabled={testing.whatsapp} className="bg-blue-600 hover:bg-blue-700">
                    {testing.whatsapp ? 'Sending...' : 'Send Test'}
                  </Button>
                </div>
              </div>

              <div className="flex gap-3">
                <Button onClick={handleSaveWhatsappConfig} className="bg-blue-600 hover:bg-blue-700" disabled={saving.whatsapp}>
                  <CheckCircle className="w-4 h-4 mr-2" />
                  {saving.whatsapp ? 'Saving...' : 'Save Configuration'}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}