import React from 'react';
import { base44 } from '@/api/base44Client';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  Monitor, 
  Smartphone, 
  Tablet,
  MapPin, 
  Clock, 
  X,
  LogOut,
  AlertTriangle
} from 'lucide-react';
import { toast } from 'sonner';

export default function ActiveSessions({ user, sessions }) {
  const queryClient = useQueryClient();

  const terminateSessionMutation = useMutation({
    mutationFn: async (sessionId) => {
      await base44.entities.UserSession.update(sessionId, {
        is_active: false,
        logged_out_at: new Date().toISOString()
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['active-sessions']);
      toast.success('Session terminated successfully');
    },
    onError: () => {
      toast.error('Failed to terminate session');
    }
  });

  const terminateAllMutation = useMutation({
    mutationFn: async () => {
      const otherSessions = sessions?.filter(s => !s.is_current) || [];
      await Promise.all(
        otherSessions.map(session =>
          base44.entities.UserSession.update(session.id, {
            is_active: false,
            logged_out_at: new Date().toISOString()
          })
        )
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['active-sessions']);
      toast.success('All other sessions terminated');
    },
    onError: () => {
      toast.error('Failed to terminate sessions');
    }
  });

  const getDeviceIcon = (deviceType) => {
    switch (deviceType?.toLowerCase()) {
      case 'mobile':
        return Smartphone;
      case 'tablet':
        return Tablet;
      default:
        return Monitor;
    }
  };

  const formatTimeAgo = (dateString) => {
    if (!dateString) return 'Unknown';
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} minute${diffMins > 1 ? 's' : ''} ago`;
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Monitor className="h-5 w-5" />
                Active Sessions
              </CardTitle>
              <CardDescription>
                Devices and locations where you're currently logged in
              </CardDescription>
            </div>
            {sessions?.length > 1 && (
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => terminateAllMutation.mutate()}
                disabled={terminateAllMutation.isPending}
              >
                <LogOut className="h-4 w-4 mr-2" />
                Sign Out Other Sessions
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {sessions?.length > 0 ? (
            <div className="space-y-4">
              {sessions.map((session) => {
                const DeviceIcon = getDeviceIcon(session.device_type);
                return (
                  <div 
                    key={session.id} 
                    className={`flex items-center justify-between p-4 border rounded-lg ${
                      session.is_current ? 'border-green-500 bg-green-50' : ''
                    }`}
                  >
                    <div className="flex items-center gap-4">
                      <div className={`p-3 rounded-full ${session.is_current ? 'bg-green-100' : 'bg-gray-100'}`}>
                        <DeviceIcon className={`h-6 w-6 ${session.is_current ? 'text-green-600' : 'text-gray-600'}`} />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="font-medium">
                            {session.device_info || 'Unknown Device'}
                          </p>
                          {session.is_current && (
                            <Badge className="bg-green-500">Current</Badge>
                          )}
                        </div>
                        <div className="flex items-center gap-3 text-sm text-muted-foreground mt-1">
                          <span className="flex items-center gap-1">
                            <MapPin className="h-3 w-3" />
                            {session.location || 'Unknown location'}
                          </span>
                          <span>•</span>
                          <span>{session.ip_address || 'Unknown IP'}</span>
                        </div>
                        <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          Last active: {formatTimeAgo(session.last_activity)}
                        </p>
                      </div>
                    </div>
                    {!session.is_current && (
                      <Button 
                        variant="ghost" 
                        size="sm"
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                        onClick={() => terminateSessionMutation.mutate(session.id)}
                        disabled={terminateSessionMutation.isPending}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <Monitor className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p>No active sessions found</p>
            </div>
          )}
        </CardContent>
      </Card>

      <Alert>
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>
          If you see any sessions you don't recognize, sign out of them immediately and change your password.
        </AlertDescription>
      </Alert>
    </div>
  );
}