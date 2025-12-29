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
    <div className="p-4 sm:p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-6 sm:mb-8">
        <div className="flex items-center gap-2 sm:gap-3 mb-2">
          <div className="w-8 h-8 sm:w-10 sm:h-10 bg-purple-100 rounded-lg flex items-center justify-center">
            <Shield className="w-4 h-4 sm:w-5 sm:h-5 text-purple-600" />
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">User Management</h1>
            <p className="text-sm sm:text-base text-gray-600">Manage user access, roles, and activation codes</p>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 mb-4 sm:mb-6">
        <Card>
          <CardContent className="p-3 sm:p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs sm:text-sm text-gray-600">Total Users</p>
                <p className="text-xl sm:text-2xl font-bold text-gray-900">{users.length}</p>
              </div>
              <Users className="w-6 h-6 sm:w-8 sm:h-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3 sm:p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs sm:text-sm text-gray-600">Active Users</p>
                <p className="text-xl sm:text-2xl font-bold text-green-600">
                  {users.filter(u => u.is_activated).length}
                </p>
              </div>
              <CheckCircle className="w-6 h-6 sm:w-8 sm:h-8 text-green-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3 sm:p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs sm:text-sm text-gray-600">Inactive Users</p>
                <p className="text-xl sm:text-2xl font-bold text-red-600">
                  {users.filter(u => !u.is_activated).length}
                </p>
              </div>
              <XCircle className="w-6 h-6 sm:w-8 sm:h-8 text-red-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3 sm:p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs sm:text-sm text-gray-600">Filtered</p>
                <p className="text-xl sm:text-2xl font-bold text-gray-900">{filteredUsers.length}</p>
              </div>
              <Filter className="w-6 h-6 sm:w-8 sm:h-8 text-gray-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card className="mb-4 sm:mb-6">
        <CardContent className="p-3 sm:p-4">
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-3 h-3 sm:w-4 sm:h-4 text-gray-400" />
              <Input
                placeholder="Search by email or name..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9 sm:pl-10 text-sm sm:text-base"
              />
            </div>
            <Select value={filterType} onValueChange={setFilterType}>
              <SelectTrigger className="w-full sm:w-48 text-sm sm:text-base">
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
        <CardHeader className="p-3 sm:p-4">
          <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
            <Users className="w-4 h-4 sm:w-5 sm:h-5" />
            Users ({filteredUsers.length})
          </CardTitle>
        </CardHeader>
        <CardContent className="p-3 sm:p-4">
          {filteredUsers.length === 0 ? (
            <div className="text-center py-8 sm:py-12 text-gray-500">
              <Users className="w-12 h-12 sm:w-16 sm:h-16 text-gray-300 mx-auto mb-3 sm:mb-4" />
              <p className="text-base sm:text-lg font-medium">No users found</p>
              <p className="text-sm">Try adjusting your search or filters</p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredUsers.map((user) => {
                const userTypes = user.user_types || [];
                const linked = getLinkedEntity(user);
                return (
                  <Card key={user.id} className="border-2 hover:border-blue-200 transition-colors">
                    <CardContent className="p-3 sm:p-4">
                      <div className="flex flex-col lg:flex-row lg:items-center gap-3 sm:gap-4">
                        {/* User Info */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start gap-2 sm:gap-3">
                            <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-blue-100 to-purple-100 rounded-full flex items-center justify-center flex-shrink-0">
                              <span className="text-xs sm:text-sm font-semibold text-blue-700">
                                {user.full_name?.charAt(0) || user.email?.charAt(0) || '?'}
                              </span>
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="font-semibold text-sm sm:text-base text-gray-900 truncate">{user.full_name || 'No name'}</p>
                              <p className="text-xs sm:text-sm text-gray-600 truncate">{user.email}</p>
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
                        <div className="flex flex-wrap gap-1 sm:gap-2 lg:min-w-[150px]">
                          {userTypes.length === 0 ? (
                            <Badge variant="outline" className="text-gray-500 text-xs">No roles assigned</Badge>
                          ) : (
                            userTypes.map((type) => (
                              <Badge key={type} className={`${getUserTypeColor(type)} border capitalize text-xs`}>
                                {type}
                              </Badge>
                            ))
                          )}
                        </div>

                        {/* Status */}
                        <div className="flex items-center gap-2 sm:gap-3">
                          {user.is_activated ? (
                            <Badge className="bg-green-100 text-green-700 border-green-200 border text-xs">
                              <CheckCircle className="w-3 h-3 mr-1" />
                              Active
                            </Badge>
                          ) : (
                            <Badge className="bg-red-100 text-red-700 border-red-200 border text-xs">
                              <XCircle className="w-3 h-3 mr-1" />
                              Inactive
                            </Badge>
                          )}

                          {/* Actions Menu */}
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="w-7 h-7 sm:w-8 sm:h-8">
                                <MoreVertical className="w-4 h-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => handleOpenEditDialog(user)} className="text-sm">
                                <UserCog className="w-4 h-4 mr-2" />
                                Edit User Types
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleToggleActivation(user)} className="text-sm">
                                <Power className="w-4 h-4 mr-2" />
                                {user.is_activated ? 'Deactivate' : 'Activate'}
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem onClick={() => handleGenerateCode(user)} className="text-sm">
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
        <DialogContent className="max-w-xs sm:max-w-md bg-white z-[100] p-4">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-lg sm:text-xl">
              <UserCog className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600" />
              Edit User Types
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 sm:space-y-6 py-4">
            <div className="bg-gray-50 rounded-lg p-3 sm:p-4">
              <Label className="text-xs text-gray-500 uppercase tracking-wide">User Account</Label>
              <p className="font-medium text-sm sm:text-base text-gray-900 mt-1">{editingUser?.full_name || 'No name'}</p>
              <p className="text-xs sm:text-sm text-gray-600">{editingUser?.email}</p>
            </div>
            <div>
              <Label className="text-sm font-semibold text-gray-900 mb-3 sm:mb-4 block">Assign User Types</Label>
              <div className="space-y-2">
                {['admin', 'teacher', 'student', 'parent', 'vendor'].map((type) => (
                  <div
                    key={type}
                    className={`flex items-center gap-3 p-3 sm:p-4 rounded-lg border-2 cursor-pointer transition-all ${
                      editingUserTypes.includes(type)
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-300 hover:border-blue-300 hover:bg-gray-50 bg-white'
                    }`}
                    onClick={() => toggleEditUserType(type)}
                  >
                    <Checkbox
                      checked={editingUserTypes.includes(type)}
                      onCheckedChange={() => toggleEditUserType(type)}
                    />
                    <div className="flex-1">
                      <span className="font-medium capitalize text-sm sm:text-base text-gray-900">{type}</span>
                    </div>
                    {editingUserTypes.includes(type) && (
                      <Badge className={`${getUserTypeColor(type)} border-0 text-xs`}>
                        <Check className="w-3 h-3 mr-1" />
                        Active
                      </Badge>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
          <DialogFooter className="flex flex-col sm:flex-row gap-2 pt-2">
            <Button variant="outline" onClick={() => setEditDialogOpen(false)} className="flex-1 text-sm sm:flex-none order-2 sm:order-1">
              Cancel
            </Button>
            <Button onClick={handleSaveUserTypes} className="flex-1 text-sm sm:flex-none order-1 sm:order-2">
              <Check className="w-4 h-4 mr-2" />
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Activation Code Dialog */}
      {selectedUser && generatedCode && (
        <Dialog open={!!generatedCode} onOpenChange={() => setGeneratedCode('')}>
          <DialogContent className="max-w-xs sm:max-w-md bg-white z-[100] p-4">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-lg sm:text-xl">
                <div className="w-8 h-8 sm:w-10 sm:h-10 bg-green-100 rounded-lg flex items-center justify-center">
                  <Key className="w-4 h-4 sm:w-5 sm:h-5 text-green-600" />
                </div>
                <div>
                  <p className="text-base sm:text-lg">Activation Code Generated</p>
                  <p className="text-xs sm:text-sm font-normal text-gray-500">Share this code with the user</p>
                </div>
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4 sm:space-y-6 py-4">
              <div className="bg-blue-50 rounded-lg p-3 sm:p-4 border-2 border-blue-100">
                <Label className="text-xs text-blue-600 uppercase tracking-wide font-semibold">User Account</Label>
                <p className="font-medium text-sm sm:text-base text-gray-900 mt-1">{selectedUser?.full_name || 'No name'}</p>
                <p className="text-xs sm:text-sm text-gray-600">{selectedUser?.email}</p>
              </div>
              
              <div className="bg-gradient-to-br from-purple-100 to-blue-100 rounded-xl p-4 sm:p-6 border-2 border-purple-300">
                <Label className="text-xs text-purple-700 uppercase tracking-wide font-semibold block mb-2 sm:mb-3">
                  Activation Code
                </Label>
                <div className="bg-gray-900 rounded-lg p-3 sm:p-4 mb-2 sm:mb-3 border-2 border-purple-300">
                  <p className="font-mono text-2xl sm:text-3xl text-center font-bold text-white tracking-widest">
                    {generatedCode}
                  </p>
                </div>
                <div className="flex flex-col sm:flex-row items-center justify-between text-xs sm:text-sm gap-2 sm:gap-0">
                  <span className="text-gray-600 flex items-center gap-1">
                    <CheckCircle className="w-3 h-3 text-green-600" />
                    Valid for 48 hours
                  </span>
                  <Button 
                    onClick={handleCopyCode} 
                    variant="ghost" 
                    size="sm"
                    className="h-auto py-1 px-3 text-xs sm:text-sm"
                  >
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

              <div className="space-y-2">
                <Button 
                  onClick={() => handleSendCodeByEmail(selectedUser)}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-sm sm:text-base"
                  size="lg"
                >
                  <Mail className="w-4 h-4 mr-2" />
                  Send Code via Email
                </Button>
                <p className="text-xs text-center text-gray-500">
                  The code will be sent to {selectedUser?.email}
                </p>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}