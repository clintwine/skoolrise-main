import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Settings, Bell, Shield, HardDrive, 
  Building2, Users, Database, RefreshCw, DollarSign, Globe, Save
} from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

// Import settings components content
import NotificationsSettings from './NotificationsSettings';
import BackupSettings from './BackupSettings';
import AuditLogs from './AuditLogs';

function AuditLogsContent() {
  return <AuditLogs />;
}

const CURRENCIES = [
  { code: 'USD', symbol: '$', name: 'US Dollar' },
  { code: 'EUR', symbol: '€', name: 'Euro' },
  { code: 'GBP', symbol: '£', name: 'British Pound' },
  { code: 'NGN', symbol: '₦', name: 'Nigerian Naira' },
  { code: 'KES', symbol: 'KSh', name: 'Kenyan Shilling' },
  { code: 'ZAR', symbol: 'R', name: 'South African Rand' },
  { code: 'GHS', symbol: 'GH₵', name: 'Ghanaian Cedi' },
  { code: 'INR', symbol: '₹', name: 'Indian Rupee' },
  { code: 'CAD', symbol: 'C$', name: 'Canadian Dollar' },
  { code: 'AUD', symbol: 'A$', name: 'Australian Dollar' },
];

export default function SettingsHub() {
  const [activeTab, setActiveTab] = useState('general');

  const tabs = [
    { id: 'general', label: 'General', icon: Settings },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'security', label: 'Security', icon: Shield },
    { id: 'backup', label: 'Backup & Restore', icon: HardDrive },
    { id: 'audit', label: 'Audit Logs', icon: Database },
    { id: 'demo', label: 'Demo Data', icon: Database },
  ];

  return (
    <div className="flex flex-col lg:flex-row gap-4 lg:gap-6 min-h-[calc(100vh-200px)] px-2 sm:px-0">
      {/* Horizontal tabs on mobile, vertical sidebar on desktop */}
      <motion.div 
        initial={{ x: -20, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        className="w-full lg:w-64 flex-shrink-0"
      >
        <Card className="glass-morphism shadow-md rounded-xl lg:rounded-2xl lg:h-full">
          <CardContent className="p-3 sm:p-4">
            <h2 className="text-base sm:text-lg font-semibold text-text mb-3 sm:mb-6 flex items-center gap-2">
              <Settings className="w-4 h-4 sm:w-5 sm:h-5" />
              Settings
            </h2>
            <nav className="flex lg:flex-col gap-2 overflow-x-auto lg:overflow-visible pb-2 lg:pb-0 hide-scrollbar">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center gap-2 lg:gap-3 px-3 lg:px-4 py-2 lg:py-3 rounded-lg lg:rounded-xl transition-all duration-200 whitespace-nowrap text-sm lg:text-base ${
                      activeTab === tab.id
                        ? 'bg-accent text-white shadow-lg lg:scale-105'
                        : 'text-text hover:bg-gray-100 bg-gray-50 lg:bg-transparent'
                    } ${activeTab === tab.id ? '' : 'lg:w-full'}`}
                  >
                    <Icon className="w-4 h-4 lg:w-5 lg:h-5" />
                    <span className="font-medium">{tab.label}</span>
                  </button>
                );
              })}
            </nav>
          </CardContent>
        </Card>
      </motion.div>

      {/* Content Area */}
      <div className="flex-1 overflow-auto">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.2 }}
          >
            {activeTab === 'general' && <GeneralSettingsContent />}
            {activeTab === 'notifications' && <NotificationsSettings />}
            {activeTab === 'security' && <SecuritySettingsContent />}
            {activeTab === 'backup' && <BackupSettings />}
            {activeTab === 'audit' && <AuditLogsContent />}
            {activeTab === 'demo' && <DemoDataSettings />}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}

function GeneralSettingsContent() {
  const queryClient = useQueryClient();
  const [settings, setSettings] = useState({
    currency: 'USD',
    timezone: 'UTC',
    date_format: 'MM/dd/yyyy',
  });

  const { data: school, isLoading } = useQuery({
    queryKey: ['school-settings'],
    queryFn: async () => {
      const schools = await base44.entities.School.list();
      return schools[0];
    },
  });

  useEffect(() => {
    if (school) {
      setSettings({
        currency: school.currency || 'USD',
        timezone: school.timezone || 'UTC',
        date_format: school.date_format || 'MM/dd/yyyy',
      });
    }
  }, [school]);

  const saveMutation = useMutation({
    mutationFn: async (data) => {
      if (school?.id) {
        await base44.entities.School.update(school.id, data);
      } else {
        await base44.entities.School.create({ school_name: 'My School', ...data });
      }
    },
    onSuccess: () => {
      // Invalidate all queries that use school/currency data
      queryClient.invalidateQueries({ queryKey: ['school-settings'] });
      queryClient.invalidateQueries({ queryKey: ['school-currency'] });
      // Also invalidate invoice and fee queries to refresh currency display
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      queryClient.invalidateQueries({ queryKey: ['instalment-plans'] });
      toast.success('Settings saved successfully. Currency changes may take a moment to reflect across the app.');
    },
    onError: (error) => {
      toast.error('Failed to save: ' + error.message);
    },
  });

  const handleSave = () => {
    saveMutation.mutate(settings);
  };

  const selectedCurrency = CURRENCIES.find(c => c.code === settings.currency);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">General Settings</h1>
        <p className="text-sm sm:text-base text-gray-600 mt-1">Configure general application settings</p>
      </div>

      <Card className="bg-white shadow-md">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="w-5 h-5" />
            Currency Settings
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div>
            <Label>Default Currency</Label>
            <Select value={settings.currency} onValueChange={(value) => setSettings({ ...settings, currency: value })}>
              <SelectTrigger className="mt-2">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {CURRENCIES.map((currency) => (
                  <SelectItem key={currency.code} value={currency.code}>
                    <span className="flex items-center gap-2">
                      <span className="font-mono">{currency.symbol}</span>
                      <span>{currency.name} ({currency.code})</span>
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-sm text-gray-500 mt-2">
              This currency will be used for all monetary values in the system.
            </p>
          </div>

          {selectedCurrency && (
            <div className="p-4 bg-blue-50 rounded-lg">
              <p className="text-sm text-blue-800">
                <strong>Preview:</strong> Amounts will be displayed as <span className="font-mono">{selectedCurrency.symbol}1,000.00</span>
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="bg-white shadow-md">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Globe className="w-5 h-5" />
            Regional Settings
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div>
            <Label>Timezone</Label>
            <Select value={settings.timezone} onValueChange={(value) => setSettings({ ...settings, timezone: value })}>
              <SelectTrigger className="mt-2">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="UTC">UTC (Coordinated Universal Time)</SelectItem>
                <SelectItem value="Africa/Lagos">Africa/Lagos (WAT)</SelectItem>
                <SelectItem value="Africa/Nairobi">Africa/Nairobi (EAT)</SelectItem>
                <SelectItem value="Africa/Johannesburg">Africa/Johannesburg (SAST)</SelectItem>
                <SelectItem value="Europe/London">Europe/London (GMT/BST)</SelectItem>
                <SelectItem value="America/New_York">America/New_York (EST/EDT)</SelectItem>
                <SelectItem value="Asia/Kolkata">Asia/Kolkata (IST)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label>Date Format</Label>
            <Select value={settings.date_format} onValueChange={(value) => setSettings({ ...settings, date_format: value })}>
              <SelectTrigger className="mt-2">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="MM/dd/yyyy">MM/DD/YYYY (01/15/2024)</SelectItem>
                <SelectItem value="dd/MM/yyyy">DD/MM/YYYY (15/01/2024)</SelectItem>
                <SelectItem value="yyyy-MM-dd">YYYY-MM-DD (2024-01-15)</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={saveMutation.isPending} className="bg-blue-600 hover:bg-blue-700">
          <Save className="w-4 h-4 mr-2" />
          {saveMutation.isPending ? 'Saving...' : 'Save Settings'}
        </Button>
      </div>
    </div>
  );
}

function SecuritySettingsContent() {
  return (
    <div className="space-y-4 sm:space-y-6">
      <div>
        <h1 className="text-2xl sm:text-4xl font-bold text-text">Security Settings</h1>
        <p className="text-sm sm:text-base text-text-secondary mt-1 sm:mt-2">Manage authentication, permissions, and security policies</p>
      </div>
      
      <Card className="bg-white rounded-2xl shadow-md">
        <CardContent className="p-8">
          <div className="flex items-center justify-center py-16">
            <div className="text-center">
              <Shield className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-text mb-2">Security Settings</h3>
              <p className="text-text-secondary">Password policies, two-factor authentication, and access controls</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function DemoDataSettings() {
  const [loading, setLoading] = useState(false);

  const handleSeedData = async () => {
    setLoading(true);
    try {
      const response = await base44.functions.invoke('seedDemoData', {});
      toast.success('Demo data seeded successfully!');
    } catch (error) {
      toast.error('Failed to seed demo data: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      <div>
        <h1 className="text-2xl sm:text-4xl font-bold text-text">Demo Data</h1>
        <p className="text-sm sm:text-base text-text-secondary mt-1 sm:mt-2">Populate your system with demonstration data for testing</p>
      </div>
      
      <Card className="bg-white rounded-2xl shadow-md">
        <CardContent className="p-8">
          <div className="max-w-2xl">
            <div className="mb-6">
              <h3 className="text-xl font-semibold text-text mb-2">Reset & Seed Demo Data</h3>
              <p className="text-text-secondary">
                This will create a complete demo environment including:
              </p>
              <ul className="list-disc list-inside text-text-secondary mt-3 space-y-1">
                <li>Demo teacher account (teacher@demo.com)</li>
                <li>Demo student account (student@demo.com)</li>
                <li>Academic session and term</li>
                <li>Course, class, and enrollment</li>
                <li>30+ questions in the question bank</li>
                <li>10 sample assignments with mixed statuses</li>
                <li>Student submissions (submitted, graded, missing)</li>
                <li>Full weekly timetable for the demo teacher</li>
              </ul>
            </div>

            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
              <p className="text-sm text-yellow-800">
                <strong>Note:</strong> This function is safe to run multiple times. If demo users already exist, 
                it will add new data without duplicating users.
              </p>
            </div>

            <Button 
              onClick={handleSeedData} 
              disabled={loading}
              className="bg-accent hover:bg-accent-hover text-white"
              size="lg"
            >
              {loading ? (
                <>
                  <RefreshCw className="w-5 h-5 mr-2 animate-spin" />
                  Seeding Data...
                </>
              ) : (
                <>
                  <Database className="w-5 h-5 mr-2" />
                  Seed Demo Data
                </>
              )}
            </Button>

            <div className="mt-6 p-4 bg-blue-50 rounded-lg">
              <h4 className="font-semibold text-blue-900 mb-2">Demo Credentials:</h4>
              <div className="space-y-1 text-sm text-blue-800">
                <p><strong>Teacher:</strong> teacher@demo.com</p>
                <p><strong>Student:</strong> student@demo.com</p>
                <p className="text-xs text-blue-600 mt-2">
                  Users will be invited - check the invite emails or set passwords via the User Management page.
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}