import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  Shield, 
  Smartphone, 
  Key, 
  Monitor, 
  MapPin, 
  Clock, 
  AlertTriangle,
  CheckCircle,
  X,
  RefreshCw,
  Settings,
  Lock,
  Users
} from 'lucide-react';
import { toast } from 'sonner';
import TwoFactorSetup from '@/components/security/TwoFactorSetup';
import ActiveSessions from '@/components/security/ActiveSessions';
import SecurityPolicies from '@/components/security/SecurityPolicies';

export default function SecuritySettings() {
  const [activeTab, setActiveTab] = useState('overview');
  const queryClient = useQueryClient();

  const { data: user } = useQuery({
    queryKey: ['current-user'],
    queryFn: () => base44.auth.me()
  });

  const { data: twoFactorAuth } = useQuery({
    queryKey: ['two-factor-auth', user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      const records = await base44.entities.TwoFactorAuth.filter({ user_id: user.id });
      return records[0] || null;
    },
    enabled: !!user?.id
  });

  const { data: loginHistory } = useQuery({
    queryKey: ['login-history', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      return base44.entities.LoginHistory.filter({ user_id: user.id }, '-created_date', 10);
    },
    enabled: !!user?.id
  });

  const { data: activeSessions } = useQuery({
    queryKey: ['active-sessions', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      return base44.entities.UserSession.filter({ user_id: user.id, is_active: true });
    },
    enabled: !!user?.id
  });

  const isAdmin = user?.role === 'admin' || user?.user_type === 'admin';

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <Shield className="h-8 w-8 text-blue-600" />
            Security Settings
          </h1>
          <p className="text-muted-foreground mt-1">
            Manage your account security and authentication settings
          </p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4 lg:w-auto lg:inline-flex">
          <TabsTrigger value="overview" className="gap-2">
            <Shield className="h-4 w-4" />
            <span className="hidden sm:inline">Overview</span>
          </TabsTrigger>
          <TabsTrigger value="2fa" className="gap-2">
            <Smartphone className="h-4 w-4" />
            <span className="hidden sm:inline">Two-Factor</span>
          </TabsTrigger>
          <TabsTrigger value="sessions" className="gap-2">
            <Monitor className="h-4 w-4" />
            <span className="hidden sm:inline">Sessions</span>
          </TabsTrigger>
          {isAdmin && (
            <TabsTrigger value="policies" className="gap-2">
              <Settings className="h-4 w-4" />
              <span className="hidden sm:inline">Policies</span>
            </TabsTrigger>
          )}
        </TabsList>

        <TabsContent value="overview" className="space-y-6 mt-6">
          {/* Security Score */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Security Overview
              </CardTitle>
              <CardDescription>
                Your account security status at a glance
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-6 md:grid-cols-3">
                <div className="flex items-center gap-4 p-4 border rounded-lg">
                  {twoFactorAuth?.is_enabled ? (
                    <CheckCircle className="h-10 w-10 text-green-500" />
                  ) : (
                    <AlertTriangle className="h-10 w-10 text-amber-500" />
                  )}
                  <div>
                    <p className="font-medium">Two-Factor Authentication</p>
                    <p className="text-sm text-muted-foreground">
                      {twoFactorAuth?.is_enabled ? 'Enabled' : 'Not enabled'}
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center gap-4 p-4 border rounded-lg">
                  <Monitor className="h-10 w-10 text-blue-500" />
                  <div>
                    <p className="font-medium">Active Sessions</p>
                    <p className="text-sm text-muted-foreground">
                      {activeSessions?.length || 0} device(s)
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center gap-4 p-4 border rounded-lg">
                  <Clock className="h-10 w-10 text-purple-500" />
                  <div>
                    <p className="font-medium">Last Login</p>
                    <p className="text-sm text-muted-foreground">
                      {loginHistory?.[0]?.created_date 
                        ? new Date(loginHistory[0].created_date).toLocaleDateString()
                        : 'No data'}
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Recent Login Activity */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Recent Login Activity
              </CardTitle>
              <CardDescription>
                Your recent login history
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loginHistory?.length > 0 ? (
                <div className="space-y-4">
                  {loginHistory.slice(0, 5).map((login, index) => (
                    <div key={login.id || index} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-full ${login.is_suspicious ? 'bg-red-100' : 'bg-green-100'}`}>
                          {login.device_type === 'mobile' ? (
                            <Smartphone className={`h-4 w-4 ${login.is_suspicious ? 'text-red-600' : 'text-green-600'}`} />
                          ) : (
                            <Monitor className={`h-4 w-4 ${login.is_suspicious ? 'text-red-600' : 'text-green-600'}`} />
                          )}
                        </div>
                        <div>
                          <p className="font-medium text-sm">
                            {login.device_type || 'Unknown device'}
                            {login.is_suspicious && (
                              <Badge variant="destructive" className="ml-2">Suspicious</Badge>
                            )}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {login.location || 'Unknown location'} • {login.ip_address || 'Unknown IP'}
                          </p>
                        </div>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {login.created_date ? new Date(login.created_date).toLocaleString() : 'Unknown'}
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground text-center py-8">No login history available</p>
              )}
            </CardContent>
          </Card>

          {/* Security Recommendations */}
          {!twoFactorAuth?.is_enabled && (
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription className="flex items-center justify-between">
                <span>
                  Enable two-factor authentication to add an extra layer of security to your account.
                </span>
                <Button size="sm" onClick={() => setActiveTab('2fa')}>
                  Enable 2FA
                </Button>
              </AlertDescription>
            </Alert>
          )}
        </TabsContent>

        <TabsContent value="2fa" className="mt-6">
          <TwoFactorSetup user={user} twoFactorAuth={twoFactorAuth} />
        </TabsContent>

        <TabsContent value="sessions" className="mt-6">
          <ActiveSessions user={user} sessions={activeSessions} />
        </TabsContent>

        {isAdmin && (
          <TabsContent value="policies" className="mt-6">
            <SecurityPolicies />
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
}