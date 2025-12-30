import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Users, Plus, UserPlus, Mail, Phone } from 'lucide-react';
import { toast } from 'sonner';

export default function ParentManagement() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [linkDialogOpen, setLinkDialogOpen] = useState(false);
  const [selectedParent, setSelectedParent] = useState(null);
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    phone: '',
    address: '',
    email: '',
  });
  const [linkData, setLinkData] = useState({ student_id: '' });
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
      const parent = await base44.entities.Parent.create(data);
      // Also invite the parent user
      if (data.email) {
        await base44.users.inviteUser(data.email, 'user');
      }
      return parent;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['parents']);
      toast.success('Parent created and invitation sent');
      setDialogOpen(false);
      setFormData({ first_name: '', last_name: '', phone: '', address: '', email: '' });
    },
  });

  const linkStudentMutation = useMutation({
    mutationFn: (data) => base44.entities.Student.update(data.student_id, { parent_id: data.parent_id }),
    onSuccess: () => {
      queryClient.invalidateQueries(['students']);
      toast.success('Student linked to parent');
      setLinkDialogOpen(false);
      setLinkData({ student_id: '' });
    },
  });

  const handleCreateParent = () => {
    createParentMutation.mutate(formData);
  };

  const handleLinkStudent = () => {
    linkStudentMutation.mutate({
      student_id: linkData.student_id,
      parent_id: selectedParent.id,
    });
  };

  const getParentStudents = (parentId) => {
    return students.filter(s => s.parent_id === parentId);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-900">Parent Management</h1>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Add Parent
            </Button>
          </DialogTrigger>
          <DialogContent>
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
              <Button onClick={handleCreateParent} className="w-full" disabled={createParentMutation.isPending}>
                {createParentMutation.isPending ? 'Creating...' : 'Create Parent'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="w-5 h-5" />
            Parents ({parents.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {parents.length === 0 ? (
              <p className="text-center text-gray-500 py-8">No parents added yet</p>
            ) : (
              parents.map((parent) => {
                const linkedStudents = getParentStudents(parent.id);
                return (
                  <div key={parent.id} className="border rounded-lg p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h3 className="font-medium text-lg">{parent.first_name} {parent.last_name}</h3>
                        <div className="mt-2 space-y-1 text-sm text-gray-600">
                          {parent.user_id && (
                            <div className="flex items-center gap-2">
                              <Mail className="w-4 h-4" />
                              <span>Account created</span>
                            </div>
                          )}
                          <div className="flex items-center gap-2">
                            <Phone className="w-4 h-4" />
                            <span>{parent.phone}</span>
                          </div>
                        </div>
                        <div className="mt-3">
                          <p className="text-sm font-medium text-gray-700 mb-2">Children:</p>
                          <div className="flex flex-wrap gap-2">
                            {linkedStudents.length === 0 ? (
                              <span className="text-sm text-gray-500">No children linked</span>
                            ) : (
                              linkedStudents.map(student => (
                                <Badge key={student.id} variant="secondary">
                                  {student.first_name} {student.last_name}
                                </Badge>
                              ))
                            )}
                          </div>
                        </div>
                      </div>
                      <Dialog open={linkDialogOpen && selectedParent?.id === parent.id} onOpenChange={(open) => {
                        setLinkDialogOpen(open);
                        if (open) setSelectedParent(parent);
                      }}>
                        <DialogTrigger asChild>
                          <Button variant="outline" size="sm">
                            <UserPlus className="w-4 h-4 mr-2" />
                            Link Student
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Link Student to {parent.first_name} {parent.last_name}</DialogTitle>
                          </DialogHeader>
                          <div className="space-y-4">
                            <div>
                              <Label>Select Student</Label>
                              <Select value={linkData.student_id} onValueChange={(value) => setLinkData({ student_id: value })}>
                                <SelectTrigger>
                                  <SelectValue placeholder="Choose a student" />
                                </SelectTrigger>
                                <SelectContent>
                                  {students.filter(s => !s.parent_id || s.parent_id === parent.id).map(student => (
                                    <SelectItem key={student.id} value={student.id}>
                                      {student.first_name} {student.last_name} ({student.student_id_number})
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                            <Button onClick={handleLinkStudent} className="w-full" disabled={linkStudentMutation.isPending}>
                              {linkStudentMutation.isPending ? 'Linking...' : 'Link Student'}
                            </Button>
                          </div>
                        </DialogContent>
                      </Dialog>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}