import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Plus, Users, MapPin, UserCircle } from 'lucide-react';

export default function ClassArms() {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingArm, setEditingArm] = useState(null);
  const queryClient = useQueryClient();

  const { data: arms = [], isLoading } = useQuery({
    queryKey: ['class-arms'],
    queryFn: () => base44.entities.ClassArm.list('-grade_level'),
  });

  const { data: teachers = [] } = useQuery({
    queryKey: ['teachers'],
    queryFn: () => base44.entities.Teacher.list(),
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.ClassArm.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['class-arms'] });
      setIsFormOpen(false);
      setEditingArm(null);
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.ClassArm.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['class-arms'] });
      setIsFormOpen(false);
      setEditingArm(null);
    },
  });

  const handleSubmit = (data) => {
    const teacher = teachers.find(t => t.id === data.class_teacher_id);
    const submitData = {
      ...data,
      class_teacher_name: teacher ? `${teacher.first_name} ${teacher.last_name}` : '',
    };

    if (editingArm) {
      updateMutation.mutate({ id: editingArm.id, data: submitData });
    } else {
      createMutation.mutate(submitData);
    }
  };

  const groupedArms = arms.reduce((acc, arm) => {
    if (!acc[arm.grade_level]) {
      acc[arm.grade_level] = [];
    }
    acc[arm.grade_level].push(arm);
    return acc;
  }, {});

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Class Arms</h1>
          <p className="text-gray-600 mt-1">Manage class sections and arms</p>
        </div>
        <Button
          onClick={() => {
            setEditingArm(null);
            setIsFormOpen(true);
          }}
          className="bg-blue-600 hover:bg-blue-700"
        >
          <Plus className="w-4 h-4 mr-2" />
          Add Class Arm
        </Button>
      </div>

      {isLoading ? (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
        </div>
      ) : (
        <div className="space-y-6">
          {Object.keys(groupedArms).sort().map((gradeLevel) => (
            <div key={gradeLevel}>
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Grade {gradeLevel}</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {groupedArms[gradeLevel].map((arm) => (
                  <Card key={arm.id} className="bg-white shadow-md hover:shadow-lg transition-shadow">
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-lg">Class {arm.grade_level}{arm.arm_name}</CardTitle>
                        <Badge className={arm.status === 'Active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}>
                          {arm.status}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <UserCircle className="w-4 h-4" />
                          <span>{arm.class_teacher_name || 'No teacher assigned'}</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <Users className="w-4 h-4" />
                          <span>{arm.current_students || 0} / {arm.max_students || '-'} students</span>
                        </div>
                        {arm.room && (
                          <div className="flex items-center gap-2 text-sm text-gray-600">
                            <MapPin className="w-4 h-4" />
                            <span>Room {arm.room}</span>
                          </div>
                        )}
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setEditingArm(arm);
                            setIsFormOpen(true);
                          }}
                          className="w-full mt-2"
                        >
                          Edit
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      <ArmFormDialog
        open={isFormOpen}
        onOpenChange={setIsFormOpen}
        arm={editingArm}
        teachers={teachers}
        onSubmit={handleSubmit}
      />
    </div>
  );
}

function ArmFormDialog({ open, onOpenChange, arm, teachers, onSubmit }) {
  const [formData, setFormData] = useState(
    arm || {
      arm_name: '',
      grade_level: '',
      class_teacher_id: '',
      max_students: 30,
      current_students: 0,
      room: '',
      status: 'Active',
    }
  );

  React.useEffect(() => {
    if (arm) {
      setFormData(arm);
    } else {
      setFormData({
        arm_name: '',
        grade_level: '',
        class_teacher_id: '',
        max_students: 30,
        current_students: 0,
        room: '',
        status: 'Active',
      });
    }
  }, [arm, open]);

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{arm ? 'Edit Class Arm' : 'Add Class Arm'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Grade Level *</Label>
              <Input
                value={formData.grade_level}
                onChange={(e) => setFormData({ ...formData, grade_level: e.target.value })}
                placeholder="e.g., 10"
                required
              />
            </div>
            <div>
              <Label>Arm Name *</Label>
              <Input
                value={formData.arm_name}
                onChange={(e) => setFormData({ ...formData, arm_name: e.target.value })}
                placeholder="e.g., A, Gold"
                required
              />
            </div>
          </div>
          <div>
            <Label>Class Teacher</Label>
            <Select value={formData.class_teacher_id} onValueChange={(value) => setFormData({ ...formData, class_teacher_id: value })}>
              <SelectTrigger>
                <SelectValue placeholder="Select teacher" />
              </SelectTrigger>
              <SelectContent>
                {teachers.map(teacher => (
                  <SelectItem key={teacher.id} value={teacher.id}>
                    {teacher.first_name} {teacher.last_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Max Students</Label>
              <Input
                type="number"
                value={formData.max_students}
                onChange={(e) => setFormData({ ...formData, max_students: parseInt(e.target.value) })}
              />
            </div>
            <div>
              <Label>Room Number</Label>
              <Input
                value={formData.room}
                onChange={(e) => setFormData({ ...formData, room: e.target.value })}
                placeholder="e.g., 101"
              />
            </div>
          </div>
          <div>
            <Label>Status</Label>
            <Select value={formData.status} onValueChange={(value) => setFormData({ ...formData, status: value })}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Active">Active</SelectItem>
                <SelectItem value="Inactive">Inactive</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" className="bg-blue-600 hover:bg-blue-700">
              {arm ? 'Update' : 'Create'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}