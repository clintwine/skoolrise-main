import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Users } from 'lucide-react';
import { format } from 'date-fns';

export default function EnrollmentManagement() {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const queryClient = useQueryClient();

  const { data: enrollments = [] } = useQuery({
    queryKey: ['enrollments'],
    queryFn: () => base44.entities.Enrollment.list('-enrollment_date'),
  });

  const { data: students = [] } = useQuery({
    queryKey: ['students'],
    queryFn: () => base44.entities.Student.list(),
  });

  const { data: classes = [] } = useQuery({
    queryKey: ['classes'],
    queryFn: () => base44.entities.Class.list(),
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.Enrollment.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['enrollments'] });
      setIsFormOpen(false);
    },
  });

  const handleSubmit = (data) => {
    createMutation.mutate(data);
  };

  const statusColors = {
    Enrolled: 'bg-green-100 text-green-800',
    Completed: 'bg-blue-100 text-blue-800',
    Dropped: 'bg-red-100 text-red-800',
    Withdrawn: 'bg-gray-100 text-gray-800',
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Enrollment Management</h1>
          <p className="text-gray-600 mt-1">Manage student class enrollments</p>
        </div>
        <Button onClick={() => setIsFormOpen(true)} className="bg-blue-600 hover:bg-blue-700">
          <Plus className="w-4 h-4 mr-2" />
          Enroll Student
        </Button>
      </div>

      <Card className="bg-white shadow-md">
        <CardHeader>
          <CardTitle>Enrollments</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Student</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Class</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Enrollment Date</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Final Grade</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {enrollments.map((enrollment) => (
                  <tr key={enrollment.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 text-sm font-medium text-gray-900">{enrollment.student_name}</td>
                    <td className="px-6 py-4 text-sm text-gray-900">{enrollment.class_name}</td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {enrollment.enrollment_date ? format(new Date(enrollment.enrollment_date), 'MMM d, yyyy') : 'N/A'}
                    </td>
                    <td className="px-6 py-4">
                      <Badge className={statusColors[enrollment.status]}>{enrollment.status}</Badge>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">{enrollment.final_grade || '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <EnrollmentFormDialog
        open={isFormOpen}
        onOpenChange={setIsFormOpen}
        students={students}
        classes={classes}
        onSubmit={handleSubmit}
      />
    </div>
  );
}

function EnrollmentFormDialog({ open, onOpenChange, students, classes, onSubmit }) {
  const [formData, setFormData] = React.useState({
    student_id: '',
    student_name: '',
    class_id: '',
    class_name: '',
    enrollment_date: new Date().toISOString().split('T')[0],
    status: 'Enrolled',
  });

  const handleStudentChange = (studentId) => {
    const student = students.find(s => s.id === studentId);
    setFormData({ ...formData, student_id: studentId, student_name: student ? `${student.first_name} ${student.last_name}` : '' });
  };

  const handleClassChange = (classId) => {
    const cls = classes.find(c => c.id === classId);
    setFormData({ ...formData, class_id: classId, class_name: cls ? cls.class_name : '' });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md bg-white">
        <DialogHeader>
          <DialogTitle className="text-gray-900">Enroll Student</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-sm font-medium">Student *</label>
            <Select value={formData.student_id} onValueChange={handleStudentChange} required>
              <SelectTrigger>
                <SelectValue placeholder="Select student" />
              </SelectTrigger>
              <SelectContent>
                {students.map(s => <SelectItem key={s.id} value={s.id}>{s.first_name} {s.last_name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div>
            <label className="text-sm font-medium">Class *</label>
            <Select value={formData.class_id} onValueChange={handleClassChange} required>
              <SelectTrigger>
                <SelectValue placeholder="Select class" />
              </SelectTrigger>
              <SelectContent>
                {classes.map(c => <SelectItem key={c.id} value={c.id}>{c.class_name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button type="submit" className="bg-blue-600 hover:bg-blue-700">Enroll</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}