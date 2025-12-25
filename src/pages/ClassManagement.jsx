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
import { Plus, Edit, Search, Upload, GraduationCap, LayoutGrid, Table as TableIcon } from 'lucide-react';
import BulkImportDialog from '../components/admin/BulkImportDialog';

export default function ClassManagement() {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingClass, setEditingClass] = useState(null);
  const [isImportOpen, setIsImportOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState('table');
  const queryClient = useQueryClient();

  const { data: classes = [] } = useQuery({
    queryKey: ['classes'],
    queryFn: () => base44.entities.Class.list('-created_date'),
  });

  const { data: courses = [] } = useQuery({
    queryKey: ['courses'],
    queryFn: () => base44.entities.Course.list(),
  });

  const { data: teachers = [] } = useQuery({
    queryKey: ['teachers'],
    queryFn: () => base44.entities.Teacher.list(),
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.Class.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['classes'] });
      setIsFormOpen(false);
      setEditingClass(null);
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Class.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['classes'] });
      setIsFormOpen(false);
      setEditingClass(null);
    },
  });

  const handleSubmit = (data) => {
    if (editingClass) {
      updateMutation.mutate({ id: editingClass.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const statusColors = {
    Active: 'bg-green-100 text-green-800',
    Completed: 'bg-gray-100 text-gray-800',
    Cancelled: 'bg-red-100 text-red-800',
  };

  const filteredClasses = classes.filter(c =>
    c.class_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.teacher_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.room?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Classes</h1>
          <p className="text-gray-600 mt-1">Manage class schedules and assignments</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => setIsImportOpen(true)} variant="outline">
            <Upload className="w-4 h-4 mr-2" />
            Bulk Import
          </Button>
          <Button onClick={() => { setEditingClass(null); setIsFormOpen(true); }} className="bg-orange-600 hover:bg-orange-700">
            <Plus className="w-4 h-4 mr-2" />
            Add Class
          </Button>
        </div>
      </div>

      <Card className="bg-white shadow-sm">
        <CardContent className="p-4">
          <div className="flex gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <Input placeholder="Search classes..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-10" />
            </div>
            <div className="flex gap-1 border rounded-lg p-1">
              <Button variant={viewMode === 'table' ? 'default' : 'ghost'} size="sm" onClick={() => setViewMode('table')}>
                <TableIcon className="w-4 h-4" />
              </Button>
              <Button variant={viewMode === 'cards' ? 'default' : 'ghost'} size="sm" onClick={() => setViewMode('cards')}>
                <LayoutGrid className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {viewMode === 'table' ? (
        <Card>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Class</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Teacher</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Room</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Schedule</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredClasses.map((cls) => (
                  <tr key={cls.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10 bg-purple-100 rounded flex items-center justify-center">
                          <GraduationCap className="w-5 h-5 text-purple-600" />
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">{cls.class_name}</div>
                          <div className="text-sm text-gray-500">Max: {cls.max_students || 'N/A'} students</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{cls.teacher_name}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{cls.room || 'N/A'}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{cls.schedule || 'N/A'}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <Badge className={statusColors[cls.status]}>{cls.status}</Badge>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <Button variant="ghost" size="sm" onClick={() => { setEditingClass(cls); setIsFormOpen(true); }}>
                        <Edit className="w-4 h-4" />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredClasses.map((cls) => (
            <Card key={cls.id} className="bg-white shadow-md">
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-lg">{cls.class_name}</CardTitle>
                    <p className="text-sm text-gray-600 mt-1">{cls.teacher_name}</p>
                  </div>
                  <Badge className={statusColors[cls.status]}>{cls.status}</Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm">
                  <p className="text-gray-600">Room: {cls.room || 'N/A'}</p>
                  <p className="text-gray-600">Schedule: {cls.schedule || 'N/A'}</p>
                  <p className="text-gray-600">Max Students: {cls.max_students || 'N/A'}</p>
                </div>
                <Button variant="outline" size="sm" className="w-full mt-4" onClick={() => { setEditingClass(cls); setIsFormOpen(true); }}>
                  <Edit className="w-4 h-4 mr-2" />
                  Edit
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <ClassFormDialog
        open={isFormOpen}
        onOpenChange={setIsFormOpen}
        classData={editingClass}
        courses={courses}
        teachers={teachers}
        onSubmit={handleSubmit}
      />

      <BulkImportDialog
        open={isImportOpen}
        onOpenChange={setIsImportOpen}
        entityName="Class"
        entitySchema={{
          type: "object",
          properties: {
            class_name: { type: "string" },
            course_id: { type: "string" },
            teacher_id: { type: "string" },
            teacher_name: { type: "string" },
            schedule: { type: "string" },
            room: { type: "string" },
            academic_year: { type: "string" },
            term: { type: "string" },
            max_students: { type: "number" },
            status: { type: "string" }
          },
          required: ["class_name", "course_id", "teacher_id"]
        }}
        templateData={[
          { class_name: "Math 101 - Section A", schedule: "Mon/Wed/Fri 9:00-10:00", room: "101", academic_year: "2024-2025", term: "Fall", max_students: 30, status: "Active" }
        ]}
        onImportComplete={() => {
          queryClient.invalidateQueries({ queryKey: ['classes'] });
          setIsImportOpen(false);
        }}
      />
    </div>
  );
}

function ClassFormDialog({ open, onOpenChange, classData, courses, teachers, onSubmit }) {
  const [formData, setFormData] = React.useState(classData || {
    class_name: '',
    course_id: '',
    teacher_id: '',
    teacher_name: '',
    schedule: '',
    room: '',
    academic_year: '2024-2025',
    term: 'Fall',
    max_students: 30,
    status: 'Active',
  });

  React.useEffect(() => {
    if (classData) {
      setFormData(classData);
    }
  }, [classData, open]);

  const handleTeacherChange = (teacherId) => {
    const teacher = teachers.find(t => t.id === teacherId);
    setFormData({ ...formData, teacher_id: teacherId, teacher_name: teacher ? `${teacher.first_name} ${teacher.last_name}` : '' });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl bg-white">
        <DialogHeader>
          <DialogTitle className="text-gray-900">{classData ? 'Edit Class' : 'Add Class'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Class Name *</Label>
              <Input value={formData.class_name} onChange={(e) => setFormData({ ...formData, class_name: e.target.value })} required />
            </div>
            <div>
              <Label>Course</Label>
              <Select value={formData.course_id} onValueChange={(value) => setFormData({ ...formData, course_id: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="Select course" />
                </SelectTrigger>
                <SelectContent>
                  {courses.map(c => <SelectItem key={c.id} value={c.id}>{c.course_name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Teacher *</Label>
              <Select value={formData.teacher_id} onValueChange={handleTeacherChange} required>
                <SelectTrigger>
                  <SelectValue placeholder="Select teacher" />
                </SelectTrigger>
                <SelectContent>
                  {teachers.map(t => <SelectItem key={t.id} value={t.id}>{t.first_name} {t.last_name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Room</Label>
              <Input value={formData.room} onChange={(e) => setFormData({ ...formData, room: e.target.value })} />
            </div>
            <div className="col-span-2">
              <Label>Schedule</Label>
              <Input value={formData.schedule} onChange={(e) => setFormData({ ...formData, schedule: e.target.value })} placeholder="e.g., Mon/Wed/Fri 9:00-10:00" />
            </div>
            <div>
              <Label>Max Students</Label>
              <Input type="number" value={formData.max_students} onChange={(e) => setFormData({ ...formData, max_students: parseInt(e.target.value) })} />
            </div>
            <div>
              <Label>Status</Label>
              <Select value={formData.status} onValueChange={(value) => setFormData({ ...formData, status: value })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Active">Active</SelectItem>
                  <SelectItem value="Completed">Completed</SelectItem>
                  <SelectItem value="Cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button type="submit" className="bg-blue-600 hover:bg-blue-700">{classData ? 'Update' : 'Create'}</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}