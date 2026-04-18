import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useSchoolContext } from '@/hooks/useSchoolContext';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { toast } from 'sonner';
import { 
  CreditCard, Shield, CheckCircle2, AlertTriangle, Settings, 
  Eye, EyeOff, ExternalLink, Zap, Globe, Lock, Info
} from 'lucide-react';
import PaymentReconciliationSummary from '@/components/fees/PaymentReconciliationSummary';
import InvoiceReconciliationTable from '@/components/fees/InvoiceReconciliationTable';

const PAYMENT_PROVIDERS = [
  {
    id: 'paystack',
    name: 'Paystack',
    description: 'Accept payments from Africa and beyond',
    logo: 'https://website-v3-assets.s3.amazonaws.com/assets/img/hero/Paystack-mark-white-twitter.png',
    color: 'bg-[#00C3F7]',
    regions: ['Nigeria', 'Ghana', 'South Africa', 'Kenya'],
    features: ['Cards', 'Bank Transfer', 'USSD', 'Mobile Money'],
    fields: [
      { key: 'public_key', label: 'Public Key', type: 'text', placeholder: 'pk_live_...' },
      { key: 'secret_key', label: 'Secret Key', type: 'password', placeholder: 'sk_live_...' },
    ],
    testFields: [
      { key: 'test_public_key', label: 'Test Public Key', type: 'text', placeholder: 'pk_test_...' },
      { key: 'test_secret_key', label: 'Test Secret Key', type: 'password', placeholder: 'sk_test_...' },
    ],
    docsUrl: 'https://paystack.com/docs',
  },
  {
    id: 'flutterwave',
    name: 'Flutterwave',
    description: 'Payment infrastructure for Africa',
    logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/8/85/Flutterwave_Logo.png/320px-Flutterwave_Logo.png',
    color: 'bg-[#F5A623]',
    regions: ['Nigeria', 'Ghana', 'Kenya', 'South Africa', 'Uganda', 'Tanzania'],
    features: ['Cards', 'Bank Transfer', 'Mobile Money', 'USSD', 'Barter'],
    fields: [
      { key: 'public_key', label: 'Public Key', type: 'text', placeholder: 'FLWPUBK-...' },
      { key: 'secret_key', label: 'Secret Key', type: 'password', placeholder: 'FLWSECK-...' },
      { key: 'encryption_key', label: 'Encryption Key', type: 'password', placeholder: 'Your encryption key' },
    ],
    testFields: [
      { key: 'test_public_key', label: 'Test Public Key', type: 'text', placeholder: 'FLWPUBK_TEST-...' },
      { key: 'test_secret_key', label: 'Test Secret Key', type: 'password', placeholder: 'FLWSECK_TEST-...' },
      { key: 'test_encryption_key', label: 'Test Encryption Key', type: 'password', placeholder: 'Test encryption key' },
    ],
    docsUrl: 'https://developer.flutterwave.com/docs',
  },
  {
    id: 'stripe',
    name: 'Stripe',
    description: 'Global payments infrastructure',
    logo: null,
    logoText: 'stripe',
    color: 'bg-[#635BFF]',
    regions: ['Global', '40+ Countries'],
    features: ['Cards', 'Bank Debits', 'Wallets', 'Buy Now Pay Later'],
    fields: [
      { key: 'public_key', label: 'Publishable Key', type: 'text', placeholder: 'pk_live_...' },
      { key: 'secret_key', label: 'Secret Key', type: 'password', placeholder: 'sk_live_...' },
      { key: 'webhook_secret', label: 'Webhook Secret', type: 'password', placeholder: 'whsec_...' },
    ],
    testFields: [
      { key: 'test_public_key', label: 'Test Publishable Key', type: 'text', placeholder: 'pk_test_...' },
      { key: 'test_secret_key', label: 'Test Secret Key', type: 'password', placeholder: 'sk_test_...' },
      { key: 'test_webhook_secret', label: 'Test Webhook Secret', type: 'password', placeholder: 'whsec_...' },
    ],
    docsUrl: 'https://stripe.com/docs',
  },
];

export default function PaymentProviders() {
  const queryClient = useQueryClient();
  const [configDialog, setConfigDialog] = useState(null);
  const [showSecrets, setShowSecrets] = useState({});
  const [formData, setFormData] = useState({});
  const [testMode, setTestMode] = useState(false);

  const { school_tenant_id, isReady } = useSchoolContext();

  // Fetch school settings for payment config — scoped to this tenant
  const { data: schools = [], isLoading } = useQuery({
    queryKey: ['school-payment-settings', school_tenant_id],
    queryFn: () => base44.entities.School.filter({ id: school_tenant_id }),
    enabled: !!school_tenant_id,
  });

  const { data: invoices = [] } = useQuery({
    queryKey: ['payment-provider-invoices', school_tenant_id],
    queryFn: () => base44.entities.FeeInvoice.filter({ school_tenant_id }, '-created_date'),
    enabled: !!school_tenant_id,
  });

  const school = schools[0];
  const paymentConfig = school?.payment_config ? JSON.parse(school.payment_config) : {};

  const updatePaymentConfig = useMutation({
    mutationFn: async (newConfig) => {
      if (!school?.id) {
        throw new Error('School not found');
      }
      await base44.entities.School.update(school.id, {
        payment_config: JSON.stringify(newConfig),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['school-payment-settings'] });
      toast.success('Payment settings saved successfully');
      setConfigDialog(null);
    },
    onError: (error) => {
      toast.error('Failed to save: ' + error.message);
    },
  });

  const handleOpenConfig = (provider) => {
    const existingConfig = paymentConfig[provider.id] || {};
    setFormData(existingConfig);
    setTestMode(existingConfig.test_mode || false);
    setConfigDialog(provider);
  };

  const handleSaveConfig = () => {
    const newConfig = {
      ...paymentConfig,
      [configDialog.id]: {
        ...formData,
        test_mode: testMode,
        configured: true,
        updated_at: new Date().toISOString(),
      },
    };
    updatePaymentConfig.mutate(newConfig);
  };

  const handleSetActive = (providerId) => {
    const newConfig = {
      ...paymentConfig,
      active_provider: providerId,
    };
    updatePaymentConfig.mutate(newConfig);
  };

  const handleDisable = (providerId) => {
    const newConfig = { ...paymentConfig };
    if (newConfig[providerId]) {
      newConfig[providerId].configured = false;
    }
    if (newConfig.active_provider === providerId) {
      newConfig.active_provider = null;
    }
    updatePaymentConfig.mutate(newConfig);
  };

  const toggleShowSecret = (key) => {
    setShowSecrets(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const isProviderConfigured = (providerId) => {
    return paymentConfig[providerId]?.configured;
  };

  const isProviderActive = (providerId) => {
    return paymentConfig.active_provider === providerId;
  };

  const configuredProvidersCount = PAYMENT_PROVIDERS.filter((provider) => isProviderConfigured(provider.id)).length;
  const reconciledInvoices = invoices.map((invoice) => {
    const paid = invoice.amount_paid || 0;
    const total = invoice.total_amount || 0;
    const balance = invoice.balance || 0;
    let reconciliation_status = 'pending';
    let reconciliation_label = 'Pending';

    if (invoice.status === 'Paid' || (total > 0 && paid >= total)) {
      reconciliation_status = 'matched';
      reconciliation_label = 'Matched';
    } else if (paid > 0 && balance > 0) {
      reconciliation_status = 'partial';
      reconciliation_label = 'Partial';
    } else if (invoice.status === 'Overdue') {
      reconciliation_status = 'overdue';
      reconciliation_label = 'Overdue';
    }

    return { ...invoice, reconciliation_status, reconciliation_label };
  });

  const reconciliationStats = {
    configured: configuredProvidersCount,
    paid: reconciledInvoices.filter((invoice) => invoice.reconciliation_status === 'matched').length,
    partial: reconciledInvoices.filter((invoice) => invoice.reconciliation_status === 'partial').length,
    attention: reconciledInvoices.filter((invoice) => invoice.reconciliation_status === 'overdue' || invoice.reconciliation_status === 'pending').length,
  };

  const activeProviderName = PAYMENT_PROVIDERS.find((provider) => provider.id === paymentConfig.active_provider)?.name;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
          <CreditCard className="w-8 h-8" />
          Payment Providers
        </h1>
        <p className="text-gray-600 mt-1">Configure payment gateways to accept fees and other payments</p>
      </div>

      {/* Active Provider Alert */}
      {paymentConfig.active_provider && (
        <Alert className="bg-green-50 border-green-200">
          <CheckCircle2 className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-green-800">
            <strong>{PAYMENT_PROVIDERS.find(p => p.id === paymentConfig.active_provider)?.name}</strong> is currently active for all payments.
            {paymentConfig[paymentConfig.active_provider]?.test_mode && (
              <Badge className="ml-2 bg-yellow-100 text-yellow-800">Test Mode</Badge>
            )}
          </AlertDescription>
        </Alert>
      )}

      {!paymentConfig.active_provider && (
        <Alert className="bg-yellow-50 border-yellow-200">
          <AlertTriangle className="h-4 w-4 text-yellow-600" />
          <AlertDescription className="text-yellow-800">
            No payment provider is active. Configure and activate a provider to start accepting payments.
          </AlertDescription>
        </Alert>
      )}

      <PaymentReconciliationSummary stats={reconciliationStats} />

      <InvoiceReconciliationTable
        invoices={reconciledInvoices.slice(0, 12)}
        formatAmount={(amount) => `${school?.currency_symbol || ''}${Number(amount || 0).toLocaleString()}`}
        activeProviderName={activeProviderName}
      />

      {/* Provider Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {PAYMENT_PROVIDERS.map((provider) => {
          const configured = isProviderConfigured(provider.id);
          const active = isProviderActive(provider.id);
          const providerData = paymentConfig[provider.id] || {};

          return (
            <Card key={provider.id} className={`relative overflow-hidden transition-all ${active ? 'ring-2 ring-green-500' : ''}`}>
              {active && (
                <div className="absolute top-0 right-0 bg-green-500 text-white text-xs px-3 py-1 rounded-bl-lg font-medium">
                  ACTIVE
                </div>
              )}
              
              <CardHeader>
                <div className="flex items-center gap-4">
                  <div className={`w-14 h-14 ${provider.color} rounded-xl flex items-center justify-center p-2`}>
                    {provider.logo ? (
                      <img src={provider.logo} alt={provider.name} className="w-full h-full object-contain" onError={(e) => { e.target.style.display='none'; e.target.nextSibling.style.display='block'; }} />
                    ) : null}
                    <span className="text-white font-bold text-xs text-center leading-tight" style={{display: provider.logo ? 'none' : 'block'}}>{provider.name}</span>
                  </div>
                  <div>
                    <CardTitle className="text-xl">{provider.name}</CardTitle>
                    <CardDescription>{provider.description}</CardDescription>
                  </div>
                </div>
              </CardHeader>

              <CardContent className="space-y-4">
                {/* Regions */}
                <div>
                  <p className="text-xs text-gray-500 uppercase font-medium mb-1">Available In</p>
                  <div className="flex flex-wrap gap-1">
                    {provider.regions.map((region) => (
                      <Badge key={region} variant="outline" className="text-xs">
                        {region}
                      </Badge>
                    ))}
                  </div>
                </div>

                {/* Features */}
                <div>
                  <p className="text-xs text-gray-500 uppercase font-medium mb-1">Payment Methods</p>
                  <div className="flex flex-wrap gap-1">
                    {provider.features.map((feature) => (
                      <Badge key={feature} className="bg-gray-100 text-gray-700 text-xs">
                        {feature}
                      </Badge>
                    ))}
                  </div>
                </div>

                {/* Status */}
                <div className="flex items-center justify-between pt-2 border-t">
                  <div className="flex items-center gap-2">
                    {configured ? (
                      <>
                        <CheckCircle2 className="w-4 h-4 text-green-600" />
                        <span className="text-sm text-green-600 font-medium">Configured</span>
                        {providerData.test_mode && (
                          <Badge className="bg-yellow-100 text-yellow-800 text-xs">Test</Badge>
                        )}
                      </>
                    ) : (
                      <>
                        <AlertTriangle className="w-4 h-4 text-gray-400" />
                        <span className="text-sm text-gray-500">Not configured</span>
                      </>
                    )}
                  </div>
                  <a 
                    href={provider.docsUrl} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:text-blue-700 text-sm flex items-center gap-1"
                  >
                    Docs <ExternalLink className="w-3 h-3" />
                  </a>
                </div>

                {/* Actions */}
                <div className="flex gap-2 pt-2">
                  <Button 
                    variant="outline" 
                    className="flex-1"
                    onClick={() => handleOpenConfig(provider)}
                  >
                    <Settings className="w-4 h-4 mr-2" />
                    Configure
                  </Button>
                  {configured && !active && (
                    <Button 
                      className="flex-1 bg-green-600 hover:bg-green-700"
                      onClick={() => handleSetActive(provider.id)}
                    >
                      <Zap className="w-4 h-4 mr-2" />
                      Activate
                    </Button>
                  )}
                  {configured && active && (
                    <Button 
                      variant="destructive"
                      className="flex-1"
                      onClick={() => handleDisable(provider.id)}
                    >
                      Disable
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Configuration Dialog */}
      <Dialog open={!!configDialog} onOpenChange={() => setConfigDialog(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-3">
              {configDialog && (
                <>
                  <div className={`w-10 h-10 ${configDialog.color} rounded-lg flex items-center justify-center p-1.5`}>
                    <img src={configDialog.logo} alt={configDialog.name} className="w-full h-full object-contain" />
                  </div>
                  Configure {configDialog?.name}
                </>
              )}
            </DialogTitle>
            <DialogDescription>
              Enter your API credentials from your {configDialog?.name} dashboard
            </DialogDescription>
          </DialogHeader>

          {configDialog && (
            <div className="space-y-6 py-4">
              {/* Test Mode Toggle */}
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <Lock className="w-5 h-5 text-gray-600" />
                  <div>
                    <p className="font-medium">Test Mode</p>
                    <p className="text-sm text-gray-500">Use test credentials for testing</p>
                  </div>
                </div>
                <Switch 
                  checked={testMode} 
                  onCheckedChange={setTestMode}
                />
              </div>

              <Tabs defaultValue="credentials" className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="credentials">
                    {testMode ? 'Test Credentials' : 'Live Credentials'}
                  </TabsTrigger>
                  <TabsTrigger value="all">All Credentials</TabsTrigger>
                </TabsList>

                <TabsContent value="credentials" className="space-y-4 mt-4">
                  {(testMode ? configDialog.testFields : configDialog.fields).map((field) => (
                    <div key={field.key} className="space-y-2">
                      <Label>{field.label}</Label>
                      <div className="relative">
                        <Input
                          type={field.type === 'password' && !showSecrets[field.key] ? 'password' : 'text'}
                          placeholder={field.placeholder}
                          value={formData[field.key] || ''}
                          onChange={(e) => setFormData(prev => ({ ...prev, [field.key]: e.target.value }))}
                          className="pr-10"
                        />
                        {field.type === 'password' && (
                          <button
                            type="button"
                            onClick={() => toggleShowSecret(field.key)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                          >
                            {showSecrets[field.key] ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </TabsContent>

                <TabsContent value="all" className="space-y-6 mt-4">
                  <div>
                    <h4 className="font-medium mb-3 flex items-center gap-2">
                      <Globe className="w-4 h-4" /> Live Credentials
                    </h4>
                    <div className="space-y-3">
                      {configDialog.fields.map((field) => (
                        <div key={field.key} className="space-y-1">
                          <Label className="text-sm">{field.label}</Label>
                          <div className="relative">
                            <Input
                              type={field.type === 'password' && !showSecrets[`live_${field.key}`] ? 'password' : 'text'}
                              placeholder={field.placeholder}
                              value={formData[field.key] || ''}
                              onChange={(e) => setFormData(prev => ({ ...prev, [field.key]: e.target.value }))}
                              className="pr-10 text-sm"
                            />
                            {field.type === 'password' && (
                              <button
                                type="button"
                                onClick={() => toggleShowSecret(`live_${field.key}`)}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                              >
                                {showSecrets[`live_${field.key}`] ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                              </button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div>
                    <h4 className="font-medium mb-3 flex items-center gap-2">
                      <Shield className="w-4 h-4" /> Test Credentials
                    </h4>
                    <div className="space-y-3">
                      {configDialog.testFields.map((field) => (
                        <div key={field.key} className="space-y-1">
                          <Label className="text-sm">{field.label}</Label>
                          <div className="relative">
                            <Input
                              type={field.type === 'password' && !showSecrets[`test_${field.key}`] ? 'password' : 'text'}
                              placeholder={field.placeholder}
                              value={formData[field.key] || ''}
                              onChange={(e) => setFormData(prev => ({ ...prev, [field.key]: e.target.value }))}
                              className="pr-10 text-sm"
                            />
                            {field.type === 'password' && (
                              <button
                                type="button"
                                onClick={() => toggleShowSecret(`test_${field.key}`)}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                              >
                                {showSecrets[`test_${field.key}`] ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                              </button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </TabsContent>
              </Tabs>

              <Alert>
                <Info className="h-4 w-4" />
                <AlertDescription>
                  Your API keys are encrypted and stored securely. Never share your secret keys.
                </AlertDescription>
              </Alert>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setConfigDialog(null)}>
              Cancel
            </Button>
            <Button 
              onClick={handleSaveConfig}
              disabled={updatePaymentConfig.isPending}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {updatePaymentConfig.isPending ? 'Saving...' : 'Save Configuration'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}