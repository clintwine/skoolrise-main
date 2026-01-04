import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Users, Plus, Mail, Phone, Search } from 'lucide-react';
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '../utils';

export default function ParentManagement() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    phone: '',
    address: '',
    email: '',
  });
  const queryClient = useQueryClient();

  const { data: parents = [] } = useQuery({
    queryKey: ['parents'],
    queryFn: () => base44.entities.Parent.list(),
  });

  const { data: students = [] } = useQuery({
    queryKey: ['students'],
    queryFn: () => base44.entities.Student.list(),
  });

  const createParentMutation = useMutation({
    mutationFn: async (data) => {
      await base44.users.inviteUser(data.email, 'user');
      const allUsers = await base44.asServiceRole.entities.User.list();
      const newUser = allUsers.find(u => u.email === data.email);
      
      const parent = await base44.entities.Parent.create({
        user_id: newUser?.id || '',
        first_name: data.first_name,
        last_name: data.last_name,
        phone: data.phone,
        address: data.address,
      });

      const matchingStudents = students.filter(s => 
        s.parent_email === data.email || s.parent_phone === data.phone
      );
      
      for (const student of matchingStudents) {
        await base44.entities.Student.update(student.id, { parent_id: parent.id });
      }
      
      return parent;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['parents']);
      queryClient.invalidateQueries(['students']);
      toast.success('Parent created and invitation sent');
      setAddDialogOpen(false);
      setFormData({ first_name: '', last_name: '', phone: '', address: '', email: '' });
    },
  });

  const handleCreateParent = () => {
    createParentMutation.mutate(formData);
  };

  const getParentStudents = (parentId) => {
    return students.filter(s => s.parent_id === parentId);
  };

  const filteredParents = parents.filter(p => 
    searchQuery ? 
      `${p.first_name} ${p.last_name}`.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.phone?.includes(searchQuery) : true
  );

  const getInitials = (firstName, lastName) => {
    return `${firstName?.charAt(0) || ''}${lastName?.charAt(0) || ''}`.toUpperCase();
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Parent Management</h1>
          <p className="text-gray-600 mt-1">Manage parent profiles and student linkages</p>
        </div>
        <Button onClick={() => setAddDialogOpen(true)} className="bg-blue-600 hover:bg-blue-700 text-white">
          <Plus className="w-4 h-4 mr-2" />
          Add Parent
        </Button>
      </div>

      <Card className="bg-white shadow-md rounded-xl">
        <CardContent className="p-6">
          <div className="relative mb-6">
            <Search className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
            <Input
              placeholder="Search parents..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Parent Name</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Contact Info</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Linked Students</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredParents.map((parent) => {
                  const linkedStudents = getParentStudents(parent.id);
                  return (
                    <tr key={parent.id} className="hover:bg-gray-50">
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                            <span className="text-blue-700 font-semibold text-sm">
                              {getInitials(parent.first_name, parent.last_name)}
                            </span>
                          </div>
                          <div>
                            <p className="font-medium text-gray-900">Mr./Mrs. {parent.last_name}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <div className="space-y-1 text-sm text-gray-600">
                          <div className="flex items-center gap-2">
                            <Mail className="w-3 h-3" />
                            <span>{parent.email || 'N/A'}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Phone className="w-3 h-3" />
                            <span>{parent.phone || 'N/A'}</span>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <p className="text-sm text-gray-700">
                          {linkedStudents.map(s => s.first_name).join(', ') || 'None'}
                        </p>
                      </td>
                      <td className="px-4 py-4">
                        <Badge className="bg-green-100 text-green-700">Active</Badge>
                      </td>
                      <td className="px-4 py-4 text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => navigate(createPageUrl('UserProfile') + `?id=${parent.user_id}&role=parent&edit=true`)}
                          className="text-blue-600 hover:text-blue-700"
                        >
                          Edit
                        </Button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            {filteredParents.length === 0 && (
              <div className="text-center text-gray-500 py-12">
                No parents found
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Add Parent Dialog */}
      <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
        <DialogContent className="bg-white">
          <DialogHeader>
            <DialogTitle>Add New Parent</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>First Name *</Label>
                <Input
                  value={formData.first_name}
                  onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                />
              </div>
              <div>
                <Label>Last Name *</Label>
                <Input
                  value={formData.last_name}
                  onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                />
              </div>
            </div>
            <div>
              <Label>Email *</Label>
              <Input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="parent@example.com"
              />
            </div>
            <div>
              <Label>Phone *</Label>
              <Input
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              />
            </div>
            <div>
              <Label>Address</Label>
              <Input
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              />
            </div>
            <div className="flex justify-end gap-3 pt-4">
              <Button variant="outline" onClick={() => setAddDialogOpen(false)}>Cancel</Button>
              <Button onClick={handleCreateParent} className="bg-blue-600 hover:bg-blue-700 text-white" disabled={createParentMutation.isPending}>
                {createParentMutation.isPending ? 'Creating...' : 'Create Parent'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}