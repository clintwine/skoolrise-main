import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { 
  Shield, 
  Lock,
  Clock,
  Users,
  AlertTriangle,
  Save,
  RefreshCw
} from 'lucide-react';
import { toast } from 'sonner';

export default function SecurityPolicies() {
  const queryClient = useQueryClient();

  const { data: policies, isLoading } = useQuery({
    queryKey: ['security-policies'],
    queryFn: async () => {
      const records = await base44.entities.SecurityPolicy.filter({ is_active: true });
      return records[0] || null;
    }
  });

  const [formData, setFormData] = useState({
    policy_name: 'Default Security Policy',
    require_2fa_for_admins: true,
    require_2fa_for_teachers: false,
    session_timeout_minutes: 480,
    max_concurrent_sessions: 3,
    password_min_length: 8,
    password_require_uppercase: true,
    password_require_lowercase: true,
    password_require_numbers: true,
    password_require_special: false,
    failed_login_lockout_threshold: 5,
    lockout_duration_minutes: 30
  });

  React.useEffect(() => {
    if (policies) {
      setFormData({
        policy_name: policies.policy_name || 'Default Security Policy',
        require_2fa_for_admins: policies.require_2fa_for_admins ?? true,
        require_2fa_for_teachers: policies.require_2fa_for_teachers ?? false,
        session_timeout_minutes: policies.session_timeout_minutes || 480,
        max_concurrent_sessions: policies.max_concurrent_sessions || 3,
        password_min_length: policies.password_min_length || 8,
        password_require_uppercase: policies.password_require_uppercase ?? true,
        password_require_lowercase: policies.password_require_lowercase ?? true,
        password_require_numbers: policies.password_require_numbers ?? true,
        password_require_special: policies.password_require_special ?? false,
        failed_login_lockout_threshold: policies.failed_login_lockout_threshold || 5,
        lockout_duration_minutes: policies.lockout_duration_minutes || 30
      });
    }
  }, [policies]);

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (policies?.id) {
        await base44.entities.SecurityPolicy.update(policies.id, formData);
      } else {
        await base44.entities.SecurityPolicy.create({ ...formData, is_active: true });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['security-policies']);
      toast.success('Security policies saved successfully');
    },
    onError: () => {
      toast.error('Failed to save security policies');
    }
  });

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* 2FA Requirements */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Two-Factor Authentication Requirements
          </CardTitle>
          <CardDescription>
            Configure which user roles must use two-factor authentication
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <Label>Require 2FA for Administrators</Label>
              <p className="text-sm text-muted-foreground">
                All admin users must enable 2FA
              </p>
            </div>
            <Switch
              checked={formData.require_2fa_for_admins}
              onCheckedChange={(checked) => handleChange('require_2fa_for_admins', checked)}
            />
          </div>
          <Separator />
          <div className="flex items-center justify-between">
            <div>
              <Label>Require 2FA for Teachers</Label>
              <p className="text-sm text-muted-foreground">
                All teacher users must enable 2FA
              </p>
            </div>
            <Switch
              checked={formData.require_2fa_for_teachers}
              onCheckedChange={(checked) => handleChange('require_2fa_for_teachers', checked)}
            />
          </div>
        </CardContent>
      </Card>

      {/* Session Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Session Settings
          </CardTitle>
          <CardDescription>
            Configure session timeout and concurrent session limits
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="session_timeout">Session Timeout (minutes)</Label>
              <Input
                id="session_timeout"
                type="number"
                min={15}
                max={1440}
                value={formData.session_timeout_minutes}
                onChange={(e) => handleChange('session_timeout_minutes', parseInt(e.target.value))}
              />
              <p className="text-xs text-muted-foreground">
                How long before inactive sessions expire (15-1440 minutes)
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="max_sessions">Max Concurrent Sessions</Label>
              <Input
                id="max_sessions"
                type="number"
                min={1}
                max={10}
                value={formData.max_concurrent_sessions}
                onChange={(e) => handleChange('max_concurrent_sessions', parseInt(e.target.value))}
              />
              <p className="text-xs text-muted-foreground">
                Maximum devices a user can be logged in on simultaneously
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Password Requirements */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Lock className="h-5 w-5" />
            Password Requirements
          </CardTitle>
          <CardDescription>
            Set password complexity requirements for all users
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="password_min_length">Minimum Password Length</Label>
            <Input
              id="password_min_length"
              type="number"
              min={6}
              max={32}
              value={formData.password_min_length}
              onChange={(e) => handleChange('password_min_length', parseInt(e.target.value))}
              className="w-32"
            />
          </div>
          
          <Separator />
          
          <div className="grid gap-4 md:grid-cols-2">
            <div className="flex items-center justify-between">
              <Label>Require Uppercase Letters</Label>
              <Switch
                checked={formData.password_require_uppercase}
                onCheckedChange={(checked) => handleChange('password_require_uppercase', checked)}
              />
            </div>
            <div className="flex items-center justify-between">
              <Label>Require Lowercase Letters</Label>
              <Switch
                checked={formData.password_require_lowercase}
                onCheckedChange={(checked) => handleChange('password_require_lowercase', checked)}
              />
            </div>
            <div className="flex items-center justify-between">
              <Label>Require Numbers</Label>
              <Switch
                checked={formData.password_require_numbers}
                onCheckedChange={(checked) => handleChange('password_require_numbers', checked)}
              />
            </div>
            <div className="flex items-center justify-between">
              <Label>Require Special Characters</Label>
              <Switch
                checked={formData.password_require_special}
                onCheckedChange={(checked) => handleChange('password_require_special', checked)}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Account Lockout */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5" />
            Account Lockout
          </CardTitle>
          <CardDescription>
            Configure protection against brute force attacks
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="lockout_threshold">Failed Attempts Before Lockout</Label>
              <Input
                id="lockout_threshold"
                type="number"
                min={3}
                max={10}
                value={formData.failed_login_lockout_threshold}
                onChange={(e) => handleChange('failed_login_lockout_threshold', parseInt(e.target.value))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="lockout_duration">Lockout Duration (minutes)</Label>
              <Input
                id="lockout_duration"
                type="number"
                min={5}
                max={1440}
                value={formData.lockout_duration_minutes}
                onChange={(e) => handleChange('lockout_duration_minutes', parseInt(e.target.value))}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Save Button */}
      <div className="flex justify-end">
        <Button 
          onClick={() => saveMutation.mutate()}
          disabled={saveMutation.isPending}
          className="gap-2"
        >
          <Save className="h-4 w-4" />
          {saveMutation.isPending ? 'Saving...' : 'Save Security Policies'}
        </Button>
      </div>
    </div>
  );
}