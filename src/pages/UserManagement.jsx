import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from '@/components/ui/dropdown-menu';
import { AlertCircle, Users, Key, CheckCircle, XCircle, Mail, Copy, Check, Power, MoreVertical, Shield, UserCog, Search, Filter, Settings, Lock } from 'lucide-react';
import { toast } from 'sonner';
import { createPageUrl } from '../utils';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import PermissionsManager from '@/components/security/PermissionsManager';

export default function UserManagement() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [currentUser, setCurrentUser] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [selectedUser, setSelectedUser] = useState(null);
  const [generatedCode, setGeneratedCode] = useState('');
  const [copied, setCopied] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [editingUserType, setEditingUserType] = useState('');
  const [existingProfiles, setExistingProfiles] = useState(null);
  const [showConflictDialog, setShowConflictDialog] = useState(false);
  const [activeTab, setActiveTab] = useState('users');

  useEffect(() => {
    const checkAccess = async () => {
      try {
        const user = await base44.auth.me();
        const isAdmin = user.role === 'admin' || user.user_type === 'admin';
        
        if (!isAdmin) {
          toast.error('Access denied. Admin privileges required.');
          navigate(createPageUrl('AdminDashboard'));
          return;
        }
        
        setCurrentUser(user);
      } catch (error) {
        toast.error('Failed to verify access');
        navigate(createPageUrl('AdminDashboard'));
      }
    };
    checkAccess();
  }, [navigate]);

  const { data: users = [], isLoading } = useQuery({
    queryKey: ['users'],
    queryFn: () => base44.entities.User.list(),
    enabled: !!currentUser,
  });

  const { data: teachers = [] } = useQuery({
    queryKey: ['teachers'],
    queryFn: () => base44.entities.Teacher.list(),
    enabled: !!currentUser,
  });

  const { data: students = [] } = useQuery({
    queryKey: ['students'],
    queryFn: () => base44.entities.Student.list(),
    enabled: !!currentUser,
  });

  const { data: parents = [] } = useQuery({
    queryKey: ['parents'],
    queryFn: () => base44.entities.Parent.list(),
    enabled: !!currentUser,
  });

  const { data: vendors = [] } = useQuery({
    queryKey: ['vendors'],
    queryFn: () => base44.entities.Vendor.list(),
    enabled: !!currentUser,
  });

  const updateUserMutation = useMutation({
    mutationFn: ({ userId, data }) => base44.entities.User.update(userId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
    },
  });

  const convertUserTypeMutation = useMutation({
    mutationFn: async ({ userId, oldUserType, newUserType }) => {
      const response = await base44.functions.invoke('convertUserType', {
        userId,
        oldUserType,
        newUserType,
      });
      return response.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries();
      toast.success(data.message || 'User type converted successfully');
      setEditDialogOpen(false);
      setShowConflictDialog(false);
    },
    onError: (error) => {
      toast.error('Failed to convert user type: ' + (error.response?.data?.error || error.message));
    },
  });

  const generateCodeMutation = useMutation({
    mutationFn: (userId) => base44.functions.invoke('generateActivationCode', { user_id: userId }),
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      setGeneratedCode(response.data.activation_code);
      toast.success('Activation code generated');
    },
  });

  const findExistingProfiles = (user) => {
    const teacher = teachers.find(t => t.user_id === user.id);
    const student = students.find(s => s.user_id === user.id);
    const parent = parents.find(p => p.user_id === user.id);
    const vendor = vendors.find(v => v.user_id === user.id);
    return { teacher, student, parent, vendor };
  };

  const handleOpenEditDialog = (user) => {
    setEditingUser(user);
    setEditingUserType(user.user_type || '');
    const profiles = findExistingProfiles(user);
    setExistingProfiles(profiles);
    setEditDialogOpen(true);
  };

  const handleSaveUserType = async () => {
    if (!editingUser || !editingUserType) {
      toast.error('Please select a user type');
      return;
    }

    const profiles = findExistingProfiles(editingUser);
    const oldUserType = editingUser.user_type;
    const hasOtherProfile = Object.entries(profiles).some(([key, val]) => 
      val && key !== editingUserType
    );

    if (hasOtherProfile && oldUserType !== editingUserType) {
      setShowConflictDialog(true);
      return;
    }

    await handleUserTypeConversion(oldUserType, editingUserType);
  };

  const handleUserTypeConversion = async (oldUserType, newUserType) => {
    await convertUserTypeMutation.mutateAsync({
      userId: editingUser.id,
      oldUserType,
      newUserType,
    });
  };

  const handleConfirmChange = async () => {
    const oldUserType = editingUser.user_type;
    await handleUserTypeConversion(oldUserType, editingUserType);
  };

  const handleGenerateCode = async (user) => {
    setSelectedUser(user);
    setGeneratedCode('');
    setCopied(false);
    await generateCodeMutation.mutateAsync(user.id);
  };

  const handleCopyCode = () => {
    navigator.clipboard.writeText(generatedCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast.success('Code copied to clipboard');
  };

  const handleSendCodeByEmail = async (user) => {
    try {
      await base44.integrations.Core.SendEmail({
        to: user.email,
        subject: 'Your SkoolRise Activation Code',
        body: `Hello ${user.full_name || user.email},\n\nYour activation code is: ${generatedCode}\n\nThis code will expire in 48 hours.\n\nPlease log in to SkoolRise and enter this code to activate your account.\n\nBest regards,\nSkoolRise Admin`
      });
      toast.success('Activation code sent to ' + user.email);
    } catch (error) {
      toast.error('Failed to send email: ' + error.message);
    }
  };

  const handleToggleActivation = (user) => {
    updateUserMutation.mutate({
      userId: user.id,
      data: { is_activated: !user.is_activated }
    });
  };

  const filteredUsers = users.filter(user => {
    const matchesSearch = user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.full_name?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = filterType === 'all' || user.user_type === filterType;
    return matchesSearch && matchesType;
  });

  const getUserTypeColor = (type) => {
    const colors = {
      admin: 'bg-purple-100 text-purple-700 border-purple-200',
      teacher: 'bg-blue-100 text-blue-700 border-blue-200',
      student: 'bg-green-100 text-green-700 border-green-200',
      parent: 'bg-orange-100 text-orange-700 border-orange-200',
      vendor: 'bg-pink-100 text-pink-700 border-pink-200'
    };
    return colors[type] || 'bg-gray-100 text-gray-700 border-gray-200';
  };

  if (!currentUser || isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  const getLinkedProfiles = (user) => {
    // Only show the profile for the CURRENT user_type to avoid confusion
    const profiles = [];
    
    if (user.user_type === 'teacher') {
      const teacher = teachers.find(t => t.user_id === user.id);
      if (teacher) profiles.push({ type: 'teacher', name: `${teacher.first_name} ${teacher.last_name}` });
    } else if (user.user_type === 'student') {
      const student = students.find(s => s.user_id === user.id);
      if (student) profiles.push({ type: 'student', name: `${student.first_name} ${student.last_name}` });
    } else if (user.user_type === 'parent') {
      const parent = parents.find(p => p.user_id === user.id);
      if (parent) profiles.push({ type: 'parent', name: `${parent.first_name} ${parent.last_name}` });
    } else if (user.user_type === 'vendor') {
      const vendor = vendors.find(v => v.user_id === user.id);
      if (vendor) profiles.push({ type: 'vendor', name: vendor.business_name });
    }
    
    return profiles;
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div>
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
            <Shield className="w-5 h-5 text-purple-600" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">User Management</h1>
            <p className="text-gray-600">Manage user access, roles, and permissions</p>
          </div>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="users" className="gap-2">
            <Users className="h-4 w-4" />
            Users
          </TabsTrigger>
          <TabsTrigger value="permissions" className="gap-2">
            <Lock className="h-4 w-4" />
            Permissions
          </TabsTrigger>
        </TabsList>

        <TabsContent value="users" className="mt-6 space-y-6">
      <div className="grid grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Users</p>
                <p className="text-2xl font-bold text-gray-900">{users.length}</p>
              </div>
              <Users className="w-8 h-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Active</p>
                <p className="text-2xl font-bold text-green-600">{users.filter(u => u.is_activated).length}</p>
              </div>
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Inactive</p>
                <p className="text-2xl font-bold text-red-600">{users.filter(u => !u.is_activated).length}</p>
              </div>
              <XCircle className="w-8 h-8 text-red-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Filtered</p>
                <p className="text-2xl font-bold text-gray-900">{filteredUsers.length}</p>
              </div>
              <Filter className="w-8 h-8 text-gray-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardContent className="p-4">
          <div className="flex gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                placeholder="Search by email or name..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={filterType} onValueChange={setFilterType}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Filter by type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Users</SelectItem>
                <SelectItem value="admin">Admin</SelectItem>
                <SelectItem value="teacher">Teacher</SelectItem>
                <SelectItem value="student">Student</SelectItem>
                <SelectItem value="parent">Parent</SelectItem>
                <SelectItem value="vendor">Vendor</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="w-5 h-5" />
            Users ({filteredUsers.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {filteredUsers.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-lg font-medium">No users found</p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredUsers.map((user) => {
                const linkedProfiles = getLinkedProfiles(user);
                return (
                  <Card key={user.id} className="border-2 hover:border-blue-200 transition-colors">
                    <CardContent className="p-4">
                      <div className="flex items-center gap-4">
                        <div className="flex-1">
                          <div className="flex items-start gap-3">
                            <div className="w-10 h-10 bg-gradient-to-br from-blue-100 to-purple-100 rounded-full flex items-center justify-center">
                              <span className="text-sm font-semibold text-blue-700">
                                {user.title ? user.title.charAt(0) : (user.full_name?.charAt(0) || '?')}
                              </span>
                            </div>
                            <div className="flex-1">
                              <div className="flex items-center gap-2">
                                {user.title && <span className="text-sm text-gray-600">{user.title}</span>}
                                <p className="font-semibold text-gray-900">{user.full_name || 'No name'}</p>
                              </div>
                              <p className="text-sm text-gray-600">{user.email}</p>
                              {linkedProfiles.length > 0 && (
                                <div className="mt-1 flex gap-2 flex-wrap">
                                  {linkedProfiles.map((profile, idx) => (
                                    <Badge key={idx} variant="outline" className="text-xs">
                                      {profile.type}: {profile.name}
                                    </Badge>
                                  ))}
                                </div>
                              )}
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-3">
                          {user.user_type ? (
                            <Badge className={`${getUserTypeColor(user.user_type)} border capitalize`}>
                              {user.user_type}
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="text-gray-500">No role</Badge>
                          )}

                          {user.is_activated ? (
                            <Badge className="bg-green-100 text-green-700 border-green-200 border">
                              <CheckCircle className="w-3 h-3 mr-1" />
                              Active
                            </Badge>
                          ) : (
                            <Badge className="bg-red-100 text-red-700 border-red-200 border">
                              <XCircle className="w-3 h-3 mr-1" />
                              Inactive
                            </Badge>
                          )}

                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon">
                                <MoreVertical className="w-4 h-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => handleOpenEditDialog(user)}>
                                <UserCog className="w-4 h-4 mr-2" />
                                Edit User Type
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleToggleActivation(user)}>
                                <Power className="w-4 h-4 mr-2" />
                                {user.is_activated ? 'Deactivate' : 'Activate'}
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem onClick={() => handleGenerateCode(user)}>
                                <Key className="w-4 h-4 mr-2" />
                                Generate Code
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Edit User Type Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="max-w-md bg-white">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <UserCog className="w-5 h-5 text-blue-600" />
              Edit User Type
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-6 py-4">
            <div className="bg-gray-50 rounded-lg p-4">
              <Label className="text-xs text-gray-500 uppercase">User Account</Label>
              <p className="font-medium text-gray-900 mt-1">{editingUser?.full_name || 'No name'}</p>
              <p className="text-sm text-gray-600">{editingUser?.email}</p>
            </div>

            {existingProfiles && Object.values(existingProfiles).some(p => p) && (
              <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
                <p className="text-sm font-medium text-yellow-900 mb-2">Existing Profiles Found:</p>
                {existingProfiles.teacher && <p className="text-sm text-yellow-800">• Teacher: {existingProfiles.teacher.first_name} {existingProfiles.teacher.last_name}</p>}
                {existingProfiles.student && <p className="text-sm text-yellow-800">• Student: {existingProfiles.student.first_name} {existingProfiles.student.last_name}</p>}
                {existingProfiles.parent && <p className="text-sm text-yellow-800">• Parent: {existingProfiles.parent.first_name} {existingProfiles.parent.last_name}</p>}
                {existingProfiles.vendor && <p className="text-sm text-yellow-800">• Vendor: {existingProfiles.vendor.business_name}</p>}
              </div>
            )}

            <div>
              <Label className="font-semibold text-gray-900 mb-3 block">Assign User Type (Select ONE)</Label>
              <Select value={editingUserType} onValueChange={setEditingUserType}>
                <SelectTrigger>
                  <SelectValue placeholder="Select user type..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="admin">Admin</SelectItem>
                  <SelectItem value="teacher">Teacher</SelectItem>
                  <SelectItem value="student">Student</SelectItem>
                  <SelectItem value="parent">Parent</SelectItem>
                  <SelectItem value="vendor">Vendor</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-gray-500 mt-2">Each user can only have one primary role</p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleSaveUserType} disabled={!editingUserType}>
              <Check className="w-4 h-4 mr-2" />
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Conflict Warning Dialog */}
      <Dialog open={showConflictDialog} onOpenChange={setShowConflictDialog}>
        <DialogContent className="max-w-md bg-white">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-600">
              <AlertCircle className="w-5 h-5" />
              User Type Conflict Detected
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="bg-red-50 p-4 rounded-lg border border-red-200">
              <p className="text-sm text-red-900 font-medium mb-2">⚠️ Warning: This user already has other profiles</p>
              <p className="text-sm text-red-800 mb-3">
                Changing from <Badge className="mx-1">{editingUser?.user_type}</Badge> to <Badge className="mx-1">{editingUserType}</Badge> will change their primary dashboard and access.
              </p>
              <div className="space-y-1 text-sm text-red-800">
                <p className="font-medium">Current profiles:</p>
                {existingProfiles?.teacher && <p>• Teacher Profile exists</p>}
                {existingProfiles?.student && <p>• Student Profile exists</p>}
                {existingProfiles?.parent && <p>• Parent Profile exists</p>}
                {existingProfiles?.vendor && <p>• Vendor Profile exists</p>}
              </div>
            </div>
            <p className="text-sm text-gray-600">
              The user will keep all existing profiles but their primary access will change to {editingUserType}. 
              Are you sure you want to proceed?
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowConflictDialog(false)}>Cancel</Button>
            <Button onClick={handleConfirmChange} className="bg-red-600 hover:bg-red-700">
              <CheckCircle className="w-4 h-4 mr-2" />
              Confirm Change
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Activation Code Dialog */}
      {selectedUser && generatedCode && (
        <Dialog open={!!generatedCode} onOpenChange={() => setGeneratedCode('')}>
          <DialogContent className="max-w-md bg-white">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                  <Key className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <p>Activation Code Generated</p>
                  <p className="text-sm font-normal text-gray-500">Share this code with the user</p>
                </div>
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-6 py-4">
              <div className="bg-blue-50 rounded-lg p-4 border-2 border-blue-100">
                <Label className="text-xs text-blue-600 uppercase font-semibold">User Account</Label>
                <p className="font-medium text-gray-900 mt-1">{selectedUser?.full_name || 'No name'}</p>
                <p className="text-sm text-gray-600">{selectedUser?.email}</p>
              </div>
              
              <div className="bg-gradient-to-br from-purple-100 to-blue-100 rounded-xl p-6 border-2 border-purple-300">
                <Label className="text-xs text-purple-700 uppercase font-semibold block mb-3">
                  Activation Code
                </Label>
                <div className="bg-gray-900 rounded-lg p-4 mb-3 border-2 border-purple-300">
                  <p className="font-mono text-3xl text-center font-bold text-white tracking-widest">
                    {generatedCode}
                  </p>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600 flex items-center gap-1">
                    <CheckCircle className="w-3 h-3 text-green-600" />
                    Valid for 48 hours
                  </span>
                  <Button onClick={handleCopyCode} variant="ghost" size="sm">
                    {copied ? (
                      <>
                        <Check className="w-3 h-3 mr-1 text-green-600" />
                        <span className="text-green-600">Copied!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3 h-3 mr-1" />
                        Copy Code
                      </>
                    )}
                  </Button>
                </div>
              </div>

              <Button 
                onClick={() => handleSendCodeByEmail(selectedUser)}
                className="w-full bg-blue-600 hover:bg-blue-700"
                size="lg"
              >
                <Mail className="w-4 h-4 mr-2" />
                Send Code via Email
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      )}
        </TabsContent>

        <TabsContent value="permissions" className="mt-6">
          <PermissionsManager />
        </TabsContent>
      </Tabs>
    </div>
  );
}