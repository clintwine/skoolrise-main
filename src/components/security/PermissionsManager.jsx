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

const DEFAULT_PERMISSIONS = [
  // Students
  { name: 'view_students', display_name: 'View Students', category: 'students', description: 'View student records' },
  { name: 'manage_students', display_name: 'Manage Students', category: 'students', description: 'Create, edit, delete students' },
  { name: 'view_student_grades', display_name: 'View Student Grades', category: 'students', description: 'View student grades and progress' },
  
  // Teachers
  { name: 'view_teachers', display_name: 'View Teachers', category: 'teachers', description: 'View teacher records' },
  { name: 'manage_teachers', display_name: 'Manage Teachers', category: 'teachers', description: 'Create, edit, delete teachers' },
  
  // Academics
  { name: 'view_classes', display_name: 'View Classes', category: 'academics', description: 'View class information' },
  { name: 'manage_classes', display_name: 'Manage Classes', category: 'academics', description: 'Create, edit, delete classes' },
  { name: 'take_attendance', display_name: 'Take Attendance', category: 'academics', description: 'Record student attendance' },
  { name: 'manage_assignments', display_name: 'Manage Assignments', category: 'academics', description: 'Create and grade assignments' },
  { name: 'view_report_cards', display_name: 'View Report Cards', category: 'academics', description: 'View report cards' },
  { name: 'manage_report_cards', display_name: 'Manage Report Cards', category: 'academics', description: 'Create and edit report cards' },
  
  // Fees
  { name: 'view_fees', display_name: 'View Fees', category: 'fees', description: 'View fee invoices and payments' },
  { name: 'manage_fees', display_name: 'Manage Fees', category: 'fees', description: 'Create invoices and record payments' },
  { name: 'view_financial_reports', display_name: 'View Financial Reports', category: 'fees', description: 'View financial summaries' },
  
  // Exams
  { name: 'view_exams', display_name: 'View Exams', category: 'exams', description: 'View exam information' },
  { name: 'create_exams', display_name: 'Create Exams', category: 'exams', description: 'Create and manage exams' },
  { name: 'grade_exams', display_name: 'Grade Exams', category: 'exams', description: 'Grade exam submissions' },
  { name: 'view_question_bank', display_name: 'View Question Bank', category: 'exams', description: 'Access question bank' },
  { name: 'manage_question_bank', display_name: 'Manage Question Bank', category: 'exams', description: 'Add/edit questions' },
  
  // Reports
  { name: 'view_reports', display_name: 'View Reports', category: 'reports', description: 'View analytics and reports' },
  { name: 'export_data', display_name: 'Export Data', category: 'reports', description: 'Export data to files' },
  { name: 'view_audit_logs', display_name: 'View Audit Logs', category: 'reports', description: 'View system audit logs' },
  
  // Communication
  { name: 'send_messages', display_name: 'Send Messages', category: 'communication', description: 'Send messages to users' },
  { name: 'send_bulk_messages', display_name: 'Send Bulk Messages', category: 'communication', description: 'Send messages to multiple users' },
  { name: 'manage_announcements', display_name: 'Manage Announcements', category: 'communication', description: 'Create school announcements' },
  
  // Settings
  { name: 'manage_users', display_name: 'Manage Users', category: 'settings', description: 'Manage user accounts' },
  { name: 'manage_school_settings', display_name: 'Manage School Settings', category: 'settings', description: 'Edit school configuration' },
  { name: 'manage_security', display_name: 'Manage Security', category: 'settings', description: 'Manage security settings' },
];

const ROLE_DEFAULT_PERMISSIONS = {
  admin: DEFAULT_PERMISSIONS.map(p => p.name),
  teacher: [
    'view_students', 'view_student_grades', 'view_classes', 'take_attendance', 
    'manage_assignments', 'view_report_cards', 'view_exams', 'create_exams', 
    'grade_exams', 'view_question_bank', 'manage_question_bank', 'send_messages'
  ],
  student: ['view_exams'],
  parent: ['view_students', 'view_student_grades', 'view_fees', 'view_report_cards', 'send_messages'],
  vendor: []
};

const categoryIcons = {
  students: Users,
  teachers: Users,
  academics: BookOpen,
  fees: DollarSign,
  exams: GraduationCap,
  reports: FileText,
  communication: MessageSquare,
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
      if (existing.length === 0) {
        // Seed default permissions
        await base44.entities.Permission.bulkCreate(
          DEFAULT_PERMISSIONS.map(p => ({ ...p, is_system: true }))
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