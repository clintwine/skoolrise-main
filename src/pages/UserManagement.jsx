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
import { Checkbox } from '@/components/ui/checkbox';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from '@/components/ui/dropdown-menu';
import { Users, Key, CheckCircle, XCircle, Mail, Copy, Check, Power, MoreVertical, Shield, UserCog, Search, Filter } from 'lucide-react';
import { toast } from 'sonner';
import { createPageUrl } from '../utils';

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
  const [editingUserTypes, setEditingUserTypes] = useState([]);

  // Check if current user is admin
  useEffect(() => {
    const checkAccess = async () => {
      try {
        const user = await base44.auth.me();
        const userTypes = user.user_types || [];
        const isAdmin = user.role === 'admin' || userTypes.includes('admin');
        
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

  const { data: users = [], isLoading, error } = useQuery({
    queryKey: ['users'],
    queryFn: async () => {
      const allUsers = await base44.entities.User.list();
      return allUsers;
    },
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
      toast.success('User updated successfully');
      setEditDialogOpen(false);
    },
    onError: (error) => {
      toast.error('Failed to update user: ' + error.message);
    }
  });

  const generateCodeMutation = useMutation({
    mutationFn: (userId) => base44.functions.invoke('generateActivationCode', { user_id: userId }),
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      setGeneratedCode(response.data.activation_code);
      toast.success('Activation code generated');
    },
    onError: (error) => {
      toast.error('Failed to generate code: ' + error.message);
    }
  });

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

  const handleOpenEditDialog = (user) => {
    setEditingUser(user);
    setEditingUserTypes(user.user_types || []);
    setEditDialogOpen(true);
  };

  const handleSaveUserTypes = () => {
    if (!editingUser) return;
    updateUserMutation.mutate({
      userId: editingUser.id,
      data: { user_types: editingUserTypes }
    });
  };

  const toggleEditUserType = (type) => {
    setEditingUserTypes(prev => 
      prev.includes(type) 
        ? prev.filter(t => t !== type)
        : [...prev, type]
    );
  };

  const getLinkedEntity = (user) => {
    const teacher = teachers.find(t => t.user_id === user.id);
    const student = students.find(s => s.user_id === user.id);
    const parent = parents.find(p => p.user_id === user.id);
    const vendor = vendors.find(v => v.user_id === user.id);
    return { teacher, student, parent, vendor };
  };

  const filteredUsers = users.filter(user => {
    const matchesSearch = user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.full_name?.toLowerCase().includes(searchTerm.toLowerCase());
    const userTypes = user.user_types || [];
    const matchesType = filterType === 'all' || userTypes.includes(filterType);
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

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <p className="text-red-600 font-semibold">Error loading users</p>
          <p className="text-gray-600 mt-2">{error.message}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
            <Shield className="w-5 h-5 text-purple-600" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">User Management</h1>
            <p className="text-gray-600">Manage user access, roles, and activation codes</p>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardContent className="p-4">
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
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Active Users</p>
                <p className="text-2xl font-bold text-green-600">
                  {users.filter(u => u.is_activated).length}
                </p>
              </div>
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Inactive Users</p>
                <p className="text-2xl font-bold text-red-600">
                  {users.filter(u => !u.is_activated).length}
                </p>
              </div>
              <XCircle className="w-8 h-8 text-red-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
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

      {/* Filters */}
      <Card className="mb-6">
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4">
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
              <SelectTrigger className="w-full sm:w-48">
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

      {/* Users List */}
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
              <p className="text-sm">Try adjusting your search or filters</p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredUsers.map((user) => {
                const userTypes = user.user_types || [];
                const linked = getLinkedEntity(user);
                return (
                  <Card key={user.id} className="border-2 hover:border-blue-200 transition-colors">
                    <CardContent className="p-4">
                      <div className="flex flex-col lg:flex-row lg:items-center gap-4">
                        {/* User Info */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start gap-3">
                            <div className="w-10 h-10 bg-gradient-to-br from-blue-100 to-purple-100 rounded-full flex items-center justify-center flex-shrink-0">
                              <span className="text-sm font-semibold text-blue-700">
                                {user.full_name?.charAt(0) || user.email?.charAt(0) || '?'}
                              </span>
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="font-semibold text-gray-900 truncate">{user.full_name || 'No name'}</p>
                              <p className="text-sm text-gray-600 truncate">{user.email}</p>
                              {(linked.teacher || linked.student || linked.parent || linked.vendor) && (
                                <div className="mt-1 text-xs text-gray-500">
                                  {linked.teacher && <span>Teacher: {linked.teacher.first_name} {linked.teacher.last_name}</span>}
                                  {linked.student && <span>Student: {linked.student.first_name} {linked.student.last_name}</span>}
                                  {linked.parent && <span>Parent: {linked.parent.first_name} {linked.parent.last_name}</span>}
                                  {linked.vendor && <span>Vendor: {linked.vendor.business_name}</span>}
                                </div>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* User Types */}
                        <div className="flex flex-wrap gap-2 lg:min-w-[200px]">
                          {userTypes.length === 0 ? (
                            <Badge variant="outline" className="text-gray-500">No roles assigned</Badge>
                          ) : (
                            userTypes.map((type) => (
                              <Badge key={type} className={`${getUserTypeColor(type)} border capitalize`}>
                                {type}
                              </Badge>
                            ))
                          )}
                        </div>

                        {/* Status */}
                        <div className="flex items-center gap-3">
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

                          {/* Actions Menu */}
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm">
                                <MoreVertical className="w-4 h-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => handleOpenEditDialog(user)}>
                                <UserCog className="w-4 h-4 mr-2" />
                                Edit User Types
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

      {/* Edit User Types Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit User Types</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>User</Label>
              <p className="text-sm text-gray-600">{editingUser?.email}</p>
            </div>
            <div>
              <Label className="mb-3 block">User Types</Label>
              <div className="space-y-3">
                {['admin', 'teacher', 'student', 'parent', 'vendor'].map((type) => (
                  <label key={type} className="flex items-center gap-3 cursor-pointer p-3 rounded-lg border hover:bg-gray-50">
                    <Checkbox
                      checked={editingUserTypes.includes(type)}
                      onCheckedChange={() => toggleEditUserType(type)}
                    />
                    <div className="flex-1">
                      <span className="font-medium capitalize">{type}</span>
                    </div>
                    {editingUserTypes.includes(type) && (
                      <Badge className={getUserTypeColor(type)}>Selected</Badge>
                    )}
                  </label>
                ))}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveUserTypes}>
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Activation Code Dialog */}
      {selectedUser && generatedCode && (
        <Dialog open={!!generatedCode} onOpenChange={() => setGeneratedCode('')}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Activation Code Generated</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>User</Label>
                <p className="text-sm text-gray-600">{selectedUser?.email}</p>
              </div>
              <div>
                <Label>Activation Code</Label>
                <div className="flex gap-2 mt-2">
                  <Input
                    value={generatedCode}
                    readOnly
                    className="font-mono text-lg text-center bg-gray-50"
                  />
                  <Button onClick={handleCopyCode} variant="outline" size="icon">
                    {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  </Button>
                </div>
                <p className="text-xs text-gray-500 mt-1">Valid for 48 hours</p>
              </div>
              <Button 
                onClick={() => handleSendCodeByEmail(selectedUser)}
                className="w-full"
              >
                <Mail className="w-4 h-4 mr-2" />
                Send Code via Email
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}