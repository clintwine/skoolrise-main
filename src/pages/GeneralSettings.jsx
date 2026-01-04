import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Settings, DollarSign, Globe, Save, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';

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

export default function GeneralSettings() {
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
      queryClient.invalidateQueries({ queryKey: ['school-settings'] });
      toast.success('Settings saved successfully');
    },
    onError: (error) => {
      toast.error('Failed to save: ' + error.message);
    },
  });

  const handleSave = () => {
    saveMutation.mutate(settings);
  };

  const selectedCurrency = CURRENCIES.find(c => c.code === settings.currency);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">General Settings</h1>
        <p className="text-gray-600 mt-1">Configure general application settings</p>
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