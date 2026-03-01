import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
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
  CheckCircle
} from 'lucide-react';
import { toast } from 'sonner';
import { Award, Calendar, BookMarked } from 'lucide-react';
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

export default function PermissionsManager() {
  const [selectedRole, setSelectedRole] = useState('teacher');
  const [rolePermissions, setRolePermissions] = useState({});
  const [hasChanges, setHasChanges] = useState(false);
  const queryClient = useQueryClient();

  const { data: permissions = [], isLoading: loadingPermissions } = useQuery({
    queryKey: ['permissions'],
    queryFn: async () => {
      const existing = await base44.entities.Permission.list();
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
    }
  });

  const { data: rolePerms = [], isLoading: loadingRolePerms } = useQuery({
    queryKey: ['role-permissions'],
    queryFn: () => base44.entities.RolePermission.list()
  });

  useEffect(() => {
    if (permissions.length > 0) {
      const permMap = {};
      ['admin', 'teacher', 'student', 'parent', 'vendor'].forEach(role => {
        permMap[role] = {};
        permissions.forEach(perm => {
          const rolePermRecord = rolePerms.find(
            rp => rp.role === role && rp.permission_id === perm.id
          );
          if (rolePermRecord) {
            permMap[role][perm.name] = rolePermRecord.is_granted;
          } else {
            permMap[role][perm.name] = ROLE_DEFAULT_PERMISSIONS[role]?.includes(perm.name) || false;
          }
        });
      });
      setRolePermissions(permMap);
    }
  }, [permissions, rolePerms]);

  const saveMutation = useMutation({
    mutationFn: async () => {
      const updates = [];
      
      for (const role of Object.keys(rolePermissions)) {
        for (const permName of Object.keys(rolePermissions[role])) {
          const perm = permissions.find(p => p.name === permName);
          if (!perm) continue;
          
          const existingRecord = rolePerms.find(
            rp => rp.role === role && rp.permission_id === perm.id
          );
          
          if (existingRecord) {
            if (existingRecord.is_granted !== rolePermissions[role][permName]) {
              updates.push(
                base44.entities.RolePermission.update(existingRecord.id, {
                  is_granted: rolePermissions[role][permName]
                })
              );
            }
          } else {
            updates.push(
              base44.entities.RolePermission.create({
                role,
                permission_id: perm.id,
                permission_name: perm.name,
                is_granted: rolePermissions[role][permName]
              })
            );
          }
        }
      }
      
      await Promise.all(updates);
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['role-permissions']);
      setHasChanges(false);
      toast.success('Permissions saved successfully');
    },
    onError: () => {
      toast.error('Failed to save permissions');
    }
  });

  const handlePermissionToggle = (role, permName, value) => {
    setRolePermissions(prev => ({
      ...prev,
      [role]: {
        ...prev[role],
        [permName]: value
      }
    }));
    setHasChanges(true);
  };

  const groupedPermissions = permissions.reduce((acc, perm) => {
    if (!acc[perm.category]) {
      acc[perm.category] = [];
    }
    acc[perm.category].push(perm);
    return acc;
  }, {});

  if (loadingPermissions || loadingRolePerms) {
    return (
      <div className="flex items-center justify-center py-12">
        <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Role Permissions
              </CardTitle>
              <CardDescription>
                Configure what each user role can access and do
              </CardDescription>
            </div>
            {hasChanges && (
              <Button 
                onClick={() => saveMutation.mutate()}
                disabled={saveMutation.isPending}
              >
                <Save className="h-4 w-4 mr-2" />
                {saveMutation.isPending ? 'Saving...' : 'Save Changes'}
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <Tabs value={selectedRole} onValueChange={setSelectedRole}>
            <TabsList className="grid w-full grid-cols-5">
              <TabsTrigger value="admin">Admin</TabsTrigger>
              <TabsTrigger value="teacher">Teacher</TabsTrigger>
              <TabsTrigger value="student">Student</TabsTrigger>
              <TabsTrigger value="parent">Parent</TabsTrigger>
              <TabsTrigger value="vendor">Vendor</TabsTrigger>
            </TabsList>

            {['admin', 'teacher', 'student', 'parent', 'vendor'].map(role => (
              <TabsContent key={role} value={role} className="mt-6">
                <div className="space-y-6">
                  {Object.entries(groupedPermissions).map(([category, perms]) => {
                    const Icon = categoryIcons[category] || Shield;
                    return (
                      <div key={category} className="border rounded-lg p-4">
                        <h4 className="font-medium flex items-center gap-2 mb-4 capitalize">
                          <Icon className="h-4 w-4" />
                          {category}
                        </h4>
                        <div className="grid gap-3 md:grid-cols-2">
                          {perms.map(perm => (
                            <div 
                              key={perm.id} 
                              className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                            >
                              <div>
                                <p className="font-medium text-sm">{perm.display_name}</p>
                                <p className="text-xs text-muted-foreground">{perm.description}</p>
                              </div>
                              <Switch
                                checked={rolePermissions[role]?.[perm.name] || false}
                                onCheckedChange={(checked) => 
                                  handlePermissionToggle(role, perm.name, checked)
                                }
                                disabled={role === 'admin'} // Admins always have all permissions
                              />
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </TabsContent>
            ))}
          </Tabs>
        </CardContent>
      </Card>

      {selectedRole === 'admin' && (
        <Card className="border-blue-200 bg-blue-50">
          <CardContent className="p-4 flex items-center gap-3">
            <CheckCircle className="h-5 w-5 text-blue-600" />
            <p className="text-sm text-blue-800">
              Administrators have full access to all features. Individual permissions cannot be restricted for admin users.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}