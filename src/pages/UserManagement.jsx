import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Users, Key, CheckCircle, XCircle, Mail, Copy, Check, Power } from 'lucide-react';
import { toast } from 'sonner';

export default function UserManagement() {
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [selectedUser, setSelectedUser] = useState(null);
  const [generatedCode, setGeneratedCode] = useState('');
  const [copied, setCopied] = useState(false);

  const { data: users = [], isLoading, error } = useQuery({
    queryKey: ['users'],
    queryFn: async () => {
      console.log('Fetching users...');
      const allUsers = await base44.asServiceRole.entities.User.list();
      console.log('Fetched users:', allUsers);
      return allUsers;
    },
  });

  const { data: teachers = [] } = useQuery({
    queryKey: ['teachers'],
    queryFn: () => base44.asServiceRole.entities.Teacher.list(),
  });

  const { data: students = [] } = useQuery({
    queryKey: ['students'],
    queryFn: () => base44.asServiceRole.entities.Student.list(),
  });

  const { data: parents = [] } = useQuery({
    queryKey: ['parents'],
    queryFn: () => base44.asServiceRole.entities.Parent.list(),
  });

  const { data: vendors = [] } = useQuery({
    queryKey: ['vendors'],
    queryFn: () => base44.asServiceRole.entities.Vendor.list(),
  });

  const updateUserMutation = useMutation({
    mutationFn: ({ userId, data }) => base44.asServiceRole.entities.User.update(userId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      toast.success('User updated successfully');
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

  const handleToggleUserType = (userId, userType, currentTypes) => {
    const types = currentTypes || [];
    const newTypes = types.includes(userType)
      ? types.filter(t => t !== userType)
      : [...types, userType];
    
    updateUserMutation.mutate({
      userId,
      data: { user_types: newTypes }
    });
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

  console.log('All users:', users);
  console.log('Filtered users:', filteredUsers);
  console.log('Is loading:', isLoading);
  console.log('Error:', error);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
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
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">User Management</h1>
        <p className="text-gray-600">Manage user access, roles, and activation codes</p>
      </div>

      <div className="mb-6 flex flex-col sm:flex-row gap-4">
        <div className="flex-1">
          <Input
            placeholder="Search by email or name..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
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

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="w-5 h-5" />
            All Users ({filteredUsers.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {users.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No users found. Check browser console for debug logs.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-3 text-sm font-semibold">Email</th>
                    <th className="text-left p-3 text-sm font-semibold">Name</th>
                    <th className="text-left p-3 text-sm font-semibold">User Types</th>
                    <th className="text-left p-3 text-sm font-semibold">Linked Details</th>
                    <th className="text-left p-3 text-sm font-semibold">Status</th>
                    <th className="text-right p-3 text-sm font-semibold">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.map((user) => {
                    const userTypes = user.user_types || [];
                    const linked = getLinkedEntity(user);
                    return (
                    <tr key={user.id} className="border-b hover:bg-gray-50">
                      <td className="p-3 text-sm">{user.email}</td>
                      <td className="p-3 text-sm">{user.full_name || '-'}</td>
                      <td className="p-3">
                        <div className="space-y-2">
                          {['admin', 'teacher', 'student', 'parent', 'vendor'].map((type) => (
                            <label key={type} className="flex items-center gap-2 cursor-pointer">
                              <Checkbox
                                checked={userTypes.includes(type)}
                                onCheckedChange={() => handleToggleUserType(user.id, type, userTypes)}
                              />
                              <span className="text-xs capitalize">{type}</span>
                            </label>
                          ))}
                        </div>
                      </td>
                      <td className="p-3 text-xs">
                        {linked.teacher && <div>Teacher: {linked.teacher.first_name} {linked.teacher.last_name}</div>}
                        {linked.student && <div>Student: {linked.student.first_name} {linked.student.last_name}</div>}
                        {linked.parent && <div>Parent: {linked.parent.first_name} {linked.parent.last_name}</div>}
                        {linked.vendor && <div>Vendor: {linked.vendor.business_name}</div>}
                        {!linked.teacher && !linked.student && !linked.parent && !linked.vendor && <span className="text-gray-400">-</span>}
                      </td>
                      <td className="p-3">
                        {user.is_activated ? (
                          <Badge className="bg-green-100 text-green-700">
                            <CheckCircle className="w-3 h-3 mr-1" />
                            Active
                          </Badge>
                        ) : (
                          <Badge className="bg-red-100 text-red-700">
                            <XCircle className="w-3 h-3 mr-1" />
                            Inactive
                          </Badge>
                        )}
                      </td>
                      <td className="p-3 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            size="sm"
                            variant={user.is_activated ? "outline" : "default"}
                            onClick={() => handleToggleActivation(user)}
                            title={user.is_activated ? "Deactivate user" : "Activate user"}
                          >
                            <Power className="w-4 h-4 mr-1" />
                            {user.is_activated ? 'Deactivate' : 'Activate'}
                          </Button>
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button 
                                size="sm" 
                                variant="outline"
                                onClick={() => handleGenerateCode(user)}
                              >
                                <Key className="w-4 h-4 mr-1" />
                                Code
                              </Button>
                            </DialogTrigger>
                            <DialogContent>
                              <DialogHeader>
                                <DialogTitle>Activation Code Generated</DialogTitle>
                              </DialogHeader>
                              <div className="space-y-4">
                                <div>
                                  <Label>User</Label>
                                  <p className="text-sm text-gray-600">{selectedUser?.email}</p>
                                </div>
                                {generatedCode && (
                                  <>
                                    <div>
                                      <Label>Activation Code</Label>
                                      <div className="flex gap-2 mt-2">
                                        <Input
                                          value={generatedCode}
                                          readOnly
                                          className="font-mono text-lg text-center"
                                        />
                                        <Button onClick={handleCopyCode} variant="outline">
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
                                  </>
                                )}
                              </div>
                            </DialogContent>
                          </Dialog>
                        </div>
                      </td>
                    </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}