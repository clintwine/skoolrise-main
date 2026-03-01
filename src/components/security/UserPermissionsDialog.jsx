import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  Shield, 
  Users,
  BookOpen,
  DollarSign,
  FileText,
  Settings,
  MessageSquare,
  GraduationCap,
  Save,
  RefreshCw,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Info,
  Award,
  Calendar,
  BookMarked
} from 'lucide-react';
import { toast } from 'sonner';
import { DEFAULT_PERMISSIONS, ROLE_DEFAULT_PERMISSIONS } from './permissionsConfig';

const categoryIcons = {
  students: Users,
  teachers: Users,
  academics: BookOpen,
  fees: DollarSign,
  exams: GraduationCap,
  behavior: Award,
  reports: FileText,
  communication: MessageSquare,
  activities: Calendar,
  bookshop: BookMarked,
  settings: Settings
};

export default function UserPermissionsDialog({ user, open, onOpenChange }) {
  const [localOverrides, setLocalOverrides] = useState({});
  const [hasChanges, setHasChanges] = useState(false);
  const queryClient = useQueryClient();

  const userRole = user?.user_type || 'user';
  const roleDefaults = ROLE_DEFAULT_PERMISSIONS[userRole] || [];

  const { data: permissions = [], isLoading: loadingPermissions } = useQuery({
    queryKey: ['permissions'],
    queryFn: async () => {
      const existing = await base44.entities.Permission.list();
      // Merge with DEFAULT_PERMISSIONS to ensure all permissions are available
      const existingNames = existing.map(p => p.name);
      const missingPerms = DEFAULT_PERMISSIONS.filter(p => !existingNames.includes(p.name));
      
      if (missingPerms.length > 0) {
        // Create missing permissions
        await base44.entities.Permission.bulkCreate(
          missingPerms.map(p => ({ ...p, is_system: true }))
        );
        return base44.entities.Permission.list();
      }
      return existing;
    },
    enabled: open
  });

  const { data: existingOverrides = [], isLoading: loadingOverrides } = useQuery({
    queryKey: ['user-permission-overrides', user?.id],
    queryFn: () => base44.entities.UserPermissionOverride.filter({ user_id: user?.id }),
    enabled: open && !!user?.id
  });

  useEffect(() => {
    if (existingOverrides.length > 0) {
      const overrideMap = {};
      existingOverrides.forEach(ov => {
        overrideMap[ov.permission_name] = {
          id: ov.id,
          is_granted: ov.is_granted
        };
      });
      setLocalOverrides(overrideMap);
    } else {
      setLocalOverrides({});
    }
    setHasChanges(false);
  }, [existingOverrides, open]);

  const saveMutation = useMutation({
    mutationFn: async () => {
      const updates = [];
      
      for (const [permName, override] of Object.entries(localOverrides)) {
        const perm = permissions.find(p => p.name === permName);
        if (!perm) continue;

        const existingRecord = existingOverrides.find(ov => ov.permission_name === permName);
        const roleDefault = roleDefaults.includes(permName);

        // If override matches role default, we can remove it (no override needed)
        if (override.is_granted === roleDefault) {
          if (existingRecord) {
            updates.push(base44.entities.UserPermissionOverride.delete(existingRecord.id));
          }
        } else {
          // We need an override
          if (existingRecord) {
            if (existingRecord.is_granted !== override.is_granted) {
              updates.push(
                base44.entities.UserPermissionOverride.update(existingRecord.id, {
                  is_granted: override.is_granted
                })
              );
            }
          } else {
            updates.push(
              base44.entities.UserPermissionOverride.create({
                user_id: user.id,
                user_email: user.email,
                permission_id: perm.id,
                permission_name: perm.name,
                is_granted: override.is_granted,
                granted_by: 'admin'
              })
            );
          }
        }
      }
      
      await Promise.all(updates);
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['user-permission-overrides', user?.id]);
      setHasChanges(false);
      toast.success('User permissions updated');
    },
    onError: () => {
      toast.error('Failed to save permissions');
    }
  });

  const handlePermissionToggle = (permName, newValue) => {
    setLocalOverrides(prev => ({
      ...prev,
      [permName]: {
        ...prev[permName],
        is_granted: newValue
      }
    }));
    setHasChanges(true);
  };

  const getPermissionState = (permName) => {
    const roleDefault = roleDefaults.includes(permName);
    const override = localOverrides[permName];
    
    if (override !== undefined) {
      return {
        isGranted: override.is_granted,
        source: override.is_granted === roleDefault ? 'role' : 'override',
        isOverride: override.is_granted !== roleDefault
      };
    }
    
    return {
      isGranted: roleDefault,
      source: 'role',
      isOverride: false
    };
  };

  const resetToRoleDefaults = () => {
    setLocalOverrides({});
    setHasChanges(existingOverrides.length > 0);
  };

  const groupedPermissions = permissions.reduce((acc, perm) => {
    if (!acc[perm.category]) {
      acc[perm.category] = [];
    }
    acc[perm.category].push(perm);
    return acc;
  }, {});

  const isLoading = loadingPermissions || loadingOverrides;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[95vw] max-w-2xl max-h-[90vh] bg-white p-4 sm:p-6">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-purple-600" />
            Manage Permissions for {user?.full_name || user?.email}
          </DialogTitle>
          <DialogDescription>
            Customize which features this user can access. Overrides apply on top of their role ({userRole}) defaults.
          </DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between bg-blue-50 p-3 rounded-lg mb-4 gap-2">
              <div className="flex items-center gap-2 text-xs sm:text-sm text-blue-800">
                <Info className="h-4 w-4 shrink-0" />
                <span>Role: <Badge variant="outline" className="ml-1 capitalize">{userRole}</Badge></span>
              </div>
              <Button variant="ghost" size="sm" onClick={resetToRoleDefaults} className="text-xs sm:text-sm">
                <RefreshCw className="h-3 w-3 mr-1" />
                Reset to Defaults
              </Button>
            </div>

            <ScrollArea className="h-[50vh] sm:h-[400px] pr-2 sm:pr-4">
              <div className="space-y-6">
                {Object.entries(groupedPermissions).map(([category, perms]) => {
                  const Icon = categoryIcons[category] || Shield;
                  return (
                    <div key={category} className="border rounded-lg p-4">
                      <h4 className="font-medium flex items-center gap-2 mb-4 capitalize">
                        <Icon className="h-4 w-4" />
                        {category}
                      </h4>
                      <div className="space-y-2 sm:space-y-3">
                        {perms.map(perm => {
                          const state = getPermissionState(perm.name);
                          return (
                            <div 
                              key={perm.id} 
                              className={`flex items-center justify-between p-2 sm:p-3 rounded-lg ${
                                state.isOverride 
                                  ? state.isGranted 
                                    ? 'bg-green-50 border border-green-200' 
                                    : 'bg-red-50 border border-red-200'
                                  : 'bg-gray-50'
                              }`}
                            >
                              <div className="flex-1 min-w-0 mr-2">
                                <div className="flex flex-wrap items-center gap-1 sm:gap-2">
                                  <p className="font-medium text-xs sm:text-sm">{perm.display_name}</p>
                                  {state.isOverride && (
                                    <Badge 
                                      variant="outline" 
                                      className={`text-[10px] sm:text-xs ${
                                        state.isGranted 
                                          ? 'border-green-300 text-green-700 bg-green-100' 
                                          : 'border-red-300 text-red-700 bg-red-100'
                                      }`}
                                    >
                                      {state.isGranted ? (
                                        <><CheckCircle className="h-2 w-2 sm:h-3 sm:w-3 mr-0.5" /> Granted</>
                                      ) : (
                                        <><XCircle className="h-2 w-2 sm:h-3 sm:w-3 mr-0.5" /> Revoked</>
                                      )}
                                    </Badge>
                                  )}
                                </div>
                                <p className="text-[10px] sm:text-xs text-muted-foreground line-clamp-1">{perm.description}</p>
                              </div>
                              <Switch
                                checked={state.isGranted}
                                onCheckedChange={(checked) => handlePermissionToggle(perm.name, checked)}
                              />
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            </ScrollArea>

            <Separator />

            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between pt-2 gap-3">
              <div className="hidden sm:flex items-center gap-4 text-xs text-muted-foreground">
                <span className="flex items-center gap-1">
                  <div className="w-3 h-3 rounded bg-green-100 border border-green-300"></div>
                  Granted
                </span>
                <span className="flex items-center gap-1">
                  <div className="w-3 h-3 rounded bg-red-100 border border-red-300"></div>
                  Revoked
                </span>
                <span className="flex items-center gap-1">
                  <div className="w-3 h-3 rounded bg-gray-100"></div>
                  Default
                </span>
              </div>
              <div className="flex gap-2 w-full sm:w-auto">
                <Button variant="outline" onClick={() => onOpenChange(false)} className="flex-1 sm:flex-none text-sm">
                  Cancel
                </Button>
                <Button 
                  onClick={() => saveMutation.mutate()}
                  disabled={!hasChanges || saveMutation.isPending}
                  className="flex-1 sm:flex-none text-sm"
                >
                  <Save className="h-4 w-4 mr-1 sm:mr-2" />
                  {saveMutation.isPending ? 'Saving...' : 'Save'}
                </Button>
              </div>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}