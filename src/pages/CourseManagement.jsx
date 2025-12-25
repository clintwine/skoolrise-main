import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Edit, BookOpen } from 'lucide-react';

export default function CourseManagement() {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingCourse, setEditingCourse] = useState(null);
  const queryClient = useQueryClient();

  const { data: courses = [] } = useQuery({
    queryKey: ['courses'],
    queryFn: () => base44.entities.Course.list('-created_date'),
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.Course.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['courses'] });
      setIsFormOpen(false);
      setEditingCourse(null);
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Course.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['courses'] });
      setIsFormOpen(false);
      setEditingCourse(null);
    },
  });

  const handleSubmit = (data) => {
    if (editingCourse) {
      updateMutation.mutate({ id: editingCourse.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const statusColors = {
    Active: 'bg-green-100 text-green-800',
    Archived: 'bg-gray-100 text-gray-800',
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Course Management</h1>
          <p className="text-gray-600 mt-1">Manage curriculum and courses</p>
        </div>
        <Button onClick={() => { setEditingCourse(null); setIsFormOpen(true); }} className="bg-blue-600 hover:bg-blue-700">
          <Plus className="w-4 h-4 mr-2" />
          Add Course
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {courses.map((course) => (
          <Card key={course.id} className="bg-white shadow-md">
            <CardHeader>
              <div className="flex justify-between items-start">
                <div className="flex items-center gap-3">
                  <BookOpen className="w-8 h-8 text-blue-600" />
                  <div>
                    <CardTitle className="text-lg">{course.course_name}</CardTitle>
                    <p className="text-sm text-gray-600">{course.course_code}</p>
                  </div>
                </div>
                <Badge className={statusColors[course.status]}>{course.status}</Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 text-sm">
                <p className="text-gray-600">{course.description}</p>
                <p className="text-gray-600">Department: {course.department}</p>
                <p className="text-gray-600">Credits: {course.credits || 'N/A'}</p>
              </div>
              <Button variant="outline" size="sm" className="w-full mt-4" onClick={() => { setEditingCourse(course); setIsFormOpen(true); }}>
                <Edit className="w-4 h-4 mr-2" />
                Edit
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      <CourseFormDialog
        open={isFormOpen}
        onOpenChange={setIsFormOpen}
        course={editingCourse}
        onSubmit={handleSubmit}
      />
    </div>
  );
}

function CourseFormDialog({ open, onOpenChange, course, onSubmit }) {
  const [formData, setFormData] = React.useState(course || {
    course_code: '',
    course_name: '',
    description: '',
    department: '',
    grade_level: '',
    credits: 0,
    status: 'Active',
  });

  React.useEffect(() => {
    if (course) setFormData(course);
  }, [course, open]);

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl bg-white">
        <DialogHeader>
          <DialogTitle className="text-gray-900">{course ? 'Edit Course' : 'Add Course'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Course Code *</Label>
              <Input value={formData.course_code} onChange={(e) => setFormData({ ...formData, course_code: e.target.value })} required />
            </div>
            <div>
              <Label>Course Name *</Label>
              <Input value={formData.course_name} onChange={(e) => setFormData({ ...formData, course_name: e.target.value })} required />
            </div>
            <div className="col-span-2">
              <Label>Description</Label>
              <Textarea value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} />
            </div>
            <div>
              <Label>Department *</Label>
              <Input value={formData.department} onChange={(e) => setFormData({ ...formData, department: e.target.value })} required />
            </div>
            <div>
              <Label>Grade Level</Label>
              <Input value={formData.grade_level} onChange={(e) => setFormData({ ...formData, grade_level: e.target.value })} />
            </div>
            <div>
              <Label>Credits</Label>
              <Input type="number" value={formData.credits} onChange={(e) => setFormData({ ...formData, credits: parseFloat(e.target.value) })} />
            </div>
            <div>
              <Label>Status</Label>
              <Select value={formData.status} onValueChange={(value) => setFormData({ ...formData, status: value })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Active">Active</SelectItem>
                  <SelectItem value="Archived">Archived</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button type="submit" className="bg-blue-600 hover:bg-blue-700">{course ? 'Update' : 'Create'}</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}