import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Search, UserPlus, Trash2, Clock, Shield, UserCircle, Check, X } from 'lucide-react';
import { toast } from 'sonner';

export default function ClockingPermissions() {
  const [searchTerm, setSearchTerm] = useState('');
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [userSearchTerm, setUserSearchTerm] = useState('');
  const queryClient = useQueryClient();

  const { data: user } = useQuery({
    queryKey: ['current-user'],
    queryFn: () => base44.auth.me(),
  });

  const { data: permissions = [], isLoading } = useQuery({
    queryKey: ['clocking-permissions'],
    queryFn: () => base44.entities.ClockingPermission.list(),
  });

  const { data: users = [] } = useQuery({
    queryKey: ['all-users'],
    queryFn: () => base44.entities.User.list(),
  });

  const activePermissions = permissions.filter(p => p.is_active);
  const permittedUserIds = activePermissions.map(p => p.user_id);

  // Filter users for adding (exclude those with active permissions)
  const availableUsers = users.filter(u => 
    !permittedUserIds.includes(u.id) &&
    (u.full_name?.toLowerCase().includes(userSearchTerm.toLowerCase()) ||
     u.email?.toLowerCase().includes(userSearchTerm.toLowerCase()))
  );

  const addPermissionMutation = useMutation({
    mutationFn: async (targetUser) => {
      return await base44.entities.ClockingPermission.create({
        user_id: targetUser.id,
        user_name: targetUser.full_name || targetUser.email,
        user_email: targetUser.email,
        granted_by_id: user?.id,
        granted_by_name: user?.full_name || user?.email,
        is_active: true
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['clocking-permissions']);
      toast.success('Clocking permission granted');
      setAddDialogOpen(false);
      setSelectedUser(null);
      setUserSearchTerm('');
    },
    onError: (error) => {
      toast.error(error.message);
    }
  });

  const removePermissionMutation = useMutation({
    mutationFn: async (permissionId) => {
      return await base44.entities.ClockingPermission.update(permissionId, { is_active: false });
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['clocking-permissions']);
      toast.success('Clocking permission revoked');
    },
    onError: (error) => {
      toast.error(error.message);
    }
  });

  const handleAddPermission = () => {
    if (!selectedUser) return;
    addPermissionMutation.mutate(selectedUser);
  };

  const filteredPermissions = activePermissions.filter(p =>
    p.user_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.user_email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Clocking Permissions</h1>
          <p className="text-gray-600 mt-1">Manage who can scan staff ID cards for clock in/out</p>
        </div>
        <Button onClick={() => setAddDialogOpen(true)} className="gap-2">
          <UserPlus className="w-4 h-4" />
          Add User
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Permitted</p>
                <p className="text-2xl font-bold text-gray-900">{activePermissions.length}</p>
              </div>
              <Shield className="w-8 h-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Clock Feature</p>
                <p className="text-2xl font-bold text-green-600">Active</p>
              </div>
              <Clock className="w-8 h-8 text-green-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">GPS Tracking</p>
                <p className="text-2xl font-bold text-blue-600">Enabled</p>
              </div>
              <Check className="w-8 h-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Shield className="w-5 h-5" />
              Users with Clocking Permission
            </CardTitle>
            <div className="relative w-64">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search users..."
                className="pl-10"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            </div>
          ) : filteredPermissions.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <Shield className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-lg font-medium">No users with clocking permission</p>
              <p className="text-sm">Add users to allow them to scan staff ID cards</p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredPermissions.map((permission) => (
                <div key={permission.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center">
                      <UserCircle className="w-6 h-6 text-blue-600" />
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900">{permission.user_name}</p>
                      <p className="text-sm text-gray-500">{permission.user_email}</p>
                      <p className="text-xs text-gray-400 mt-1">
                        Granted by {permission.granted_by_name}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge className="bg-green-100 text-green-700">Active</Badge>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => removePermissionMutation.mutate(permission.id)}
                      disabled={removePermissionMutation.isPending}
                      className="text-red-600 hover:bg-red-50 hover:text-red-700"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add Permission Dialog */}
      <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
        <DialogContent className="max-w-md bg-white">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <UserPlus className="w-5 h-5 text-blue-600" />
              Add Clocking Permission
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                value={userSearchTerm}
                onChange={(e) => setUserSearchTerm(e.target.value)}
                placeholder="Search users by name or email..."
                className="pl-10"
              />
            </div>

            {selectedUser && (
              <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                    <UserCircle className="w-5 h-5 text-blue-600" />
                  </div>
                  <div className="flex-1">
                    <p className="font-medium">{selectedUser.full_name || 'No name'}</p>
                    <p className="text-sm text-gray-500">{selectedUser.email}</p>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setSelectedUser(null)}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            )}

            {userSearchTerm && !selectedUser && (
              <div className="max-h-64 overflow-y-auto border rounded-lg">
                {availableUsers.length === 0 ? (
                  <p className="text-center py-4 text-gray-500">No users found</p>
                ) : (
                  availableUsers.slice(0, 10).map((u) => (
                    <button
                      key={u.id}
                      onClick={() => setSelectedUser(u)}
                      className="w-full text-left p-3 hover:bg-gray-50 border-b last:border-b-0 flex items-center gap-3"
                    >
                      <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center">
                        <UserCircle className="w-4 h-4 text-gray-500" />
                      </div>
                      <div>
                        <p className="font-medium">{u.full_name || 'No name'}</p>
                        <p className="text-sm text-gray-500">{u.email}</p>
                      </div>
                    </button>
                  ))
                )}
              </div>
            )}

            <div className="bg-amber-50 rounded-lg p-3 border border-amber-200">
              <p className="text-sm text-amber-800">
                <strong>Note:</strong> Users with this permission will see the "Staff Clocking" menu in their navigation and can scan staff ID cards for clock in/out.
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setAddDialogOpen(false);
              setSelectedUser(null);
              setUserSearchTerm('');
            }}>
              Cancel
            </Button>
            <Button 
              onClick={handleAddPermission} 
              disabled={!selectedUser || addPermissionMutation.isPending}
            >
              {addPermissionMutation.isPending ? 'Adding...' : 'Grant Permission'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}