import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Edit, Search, Upload } from 'lucide-react';
import BulkImportDialog from '../components/admin/BulkImportDialog';

export default function TeacherManagement() {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingTeacher, setEditingTeacher] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [isImportOpen, setIsImportOpen] = useState(false);
  const queryClient = useQueryClient();

  const { data: teachers = [] } = useQuery({
    queryKey: ['teachers'],
    queryFn: () => base44.entities.Teacher.list('-created_date'),
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.Teacher.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['teachers'] });
      setIsFormOpen(false);
      setEditingTeacher(null);
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Teacher.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['teachers'] });
      setIsFormOpen(false);
      setEditingTeacher(null);
    },
  });

  const handleSubmit = (data) => {
    if (editingTeacher) {
      updateMutation.mutate({ id: editingTeacher.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const filteredTeachers = teachers.filter(t =>
    `${t.first_name} ${t.last_name}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
    t.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    t.staff_id?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const statusColors = {
    Active: 'bg-green-100 text-green-800',
    'On Leave': 'bg-yellow-100 text-yellow-800',
    Inactive: 'bg-gray-100 text-gray-800',
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Teacher Management</h1>
          <p className="text-gray-600 mt-1">Manage teaching staff</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => setIsImportOpen(true)} variant="outline">
            <Upload className="w-4 h-4 mr-2" />
            Bulk Import
          </Button>
          <Button onClick={() => { setEditingTeacher(null); setIsFormOpen(true); }} className="bg-blue-600 hover:bg-blue-700">
            <Plus className="w-4 h-4 mr-2" />
            Add Teacher
          </Button>
        </div>
      </div>

      <Card className="bg-white shadow-md">
        <CardContent className="p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <Input placeholder="Search teachers..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-10" />
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredTeachers.map((teacher) => (
          <Card key={teacher.id} className="bg-white shadow-md">
            <CardHeader>
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="text-lg">{teacher.first_name} {teacher.last_name}</CardTitle>
                  <p className="text-sm text-gray-600">{teacher.department}</p>
                </div>
                <Badge className={statusColors[teacher.status]}>{teacher.status}</Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 text-sm">
                <p className="text-gray-600">Staff ID: {teacher.staff_id}</p>
                <p className="text-gray-600">Email: {teacher.email}</p>
                <p className="text-gray-600">Phone: {teacher.phone || 'N/A'}</p>
              </div>
              <Button variant="outline" size="sm" className="w-full mt-4" onClick={() => { setEditingTeacher(teacher); setIsFormOpen(true); }}>
                <Edit className="w-4 h-4 mr-2" />
                Edit
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      <TeacherFormDialog
        open={isFormOpen}
        onOpenChange={setIsFormOpen}
        teacher={editingTeacher}
        onSubmit={handleSubmit}
      />

      <BulkImportDialog
        open={isImportOpen}
        onOpenChange={setIsImportOpen}
        entityName="Teacher"
        entitySchema={{
          type: "object",
          properties: {
            first_name: { type: "string" },
            last_name: { type: "string" },
            staff_id: { type: "string" },
            email: { type: "string", format: "email" },
            phone: { type: "string" },
            department: { type: "string" },
            position: { type: "string" },
            hire_date: { type: "string" },
            status: { type: "string" },
            qualifications: { type: "string" },
            address: { type: "string" }
          },
          required: ["first_name", "last_name", "staff_id", "email"]
        }}
        templateData={[
          { first_name: "John", last_name: "Doe", staff_id: "T001", email: "john.doe@school.com", phone: "1234567890", department: "Mathematics", position: "Senior Teacher", status: "Active" }
        ]}
        onImportComplete={() => {
          queryClient.invalidateQueries({ queryKey: ['teachers'] });
          setIsImportOpen(false);
        }}
      />
    </div>
  );
}

function TeacherFormDialog({ open, onOpenChange, teacher, onSubmit }) {
  const [formData, setFormData] = React.useState(teacher || {
    first_name: '',
    last_name: '',
    staff_id: '',
    email: '',
    phone: '',
    department: '',
    position: '',
    hire_date: '',
    status: 'Active',
    qualifications: '',
    address: '',
  });

  React.useEffect(() => {
    if (teacher) setFormData(teacher);
  }, [teacher, open]);

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl bg-white">
        <DialogHeader>
          <DialogTitle className="text-gray-900">{teacher ? 'Edit Teacher' : 'Add Teacher'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>First Name *</Label>
              <Input value={formData.first_name} onChange={(e) => setFormData({ ...formData, first_name: e.target.value })} required />
            </div>
            <div>
              <Label>Last Name *</Label>
              <Input value={formData.last_name} onChange={(e) => setFormData({ ...formData, last_name: e.target.value })} required />
            </div>
            <div>
              <Label>Staff ID *</Label>
              <Input value={formData.staff_id} onChange={(e) => setFormData({ ...formData, staff_id: e.target.value })} required />
            </div>
            <div>
              <Label>Email *</Label>
              <Input type="email" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} required />
            </div>
            <div>
              <Label>Phone</Label>
              <Input value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} />
            </div>
            <div>
              <Label>Department</Label>
              <Input value={formData.department} onChange={(e) => setFormData({ ...formData, department: e.target.value })} />
            </div>
            <div>
              <Label>Position</Label>
              <Input value={formData.position} onChange={(e) => setFormData({ ...formData, position: e.target.value })} />
            </div>
            <div>
              <Label>Status</Label>
              <Select value={formData.status} onValueChange={(value) => setFormData({ ...formData, status: value })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Active">Active</SelectItem>
                  <SelectItem value="On Leave">On Leave</SelectItem>
                  <SelectItem value="Inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button type="submit" className="bg-blue-600 hover:bg-blue-700">{teacher ? 'Update' : 'Create'}</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}