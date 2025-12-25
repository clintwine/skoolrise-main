import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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
import { Plus, Calendar, Clock } from 'lucide-react';

export default function TimetableManagement() {
  const [selectedClassArm, setSelectedClassArm] = useState('');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingSlot, setEditingSlot] = useState(null);
  const queryClient = useQueryClient();

  const { data: classArms = [] } = useQuery({
    queryKey: ['class-arms'],
    queryFn: () => base44.entities.ClassArm.list(),
  });

  const { data: teachers = [] } = useQuery({
    queryKey: ['teachers'],
    queryFn: () => base44.entities.Teacher.list(),
  });

  const { data: timetable = [], isLoading } = useQuery({
    queryKey: ['timetable', selectedClassArm],
    queryFn: async () => {
      if (!selectedClassArm) return [];
      const all = await base44.entities.Timetable.list();
      return all.filter(t => t.class_arm_id === selectedClassArm);
    },
    enabled: !!selectedClassArm,
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.Timetable.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['timetable'] });
      setIsFormOpen(false);
      setEditingSlot(null);
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Timetable.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['timetable'] });
      setIsFormOpen(false);
      setEditingSlot(null);
    },
  });

  const handleSubmit = (data) => {
    const teacher = teachers.find(t => t.id === data.teacher_id);
    const classArm = classArms.find(c => c.id === selectedClassArm);
    const submitData = {
      ...data,
      class_arm_id: selectedClassArm,
      class_arm_name: classArm ? `${classArm.grade_level}${classArm.arm_name}` : '',
      teacher_name: teacher ? `${teacher.first_name} ${teacher.last_name}` : '',
    };

    if (editingSlot) {
      updateMutation.mutate({ id: editingSlot.id, data: submitData });
    } else {
      createMutation.mutate(submitData);
    }
  };

  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
  
  const groupedByDay = timetable.reduce((acc, slot) => {
    if (!acc[slot.day_of_week]) {
      acc[slot.day_of_week] = [];
    }
    acc[slot.day_of_week].push(slot);
    return acc;
  }, {});

  days.forEach(day => {
    if (groupedByDay[day]) {
      groupedByDay[day].sort((a, b) => (a.period_number || 0) - (b.period_number || 0));
    }
  });

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Timetable Management</h1>
          <p className="text-gray-600 mt-1">Manage class schedules and periods</p>
        </div>
        <Button
          onClick={() => {
            setEditingSlot(null);
            setIsFormOpen(true);
          }}
          disabled={!selectedClassArm}
          className="bg-blue-600 hover:bg-blue-700"
        >
          <Plus className="w-4 h-4 mr-2" />
          Add Period
        </Button>
      </div>

      <Card className="bg-white shadow-md">
        <CardContent className="p-4">
          <Label>Select Class Arm</Label>
          <Select value={selectedClassArm} onValueChange={setSelectedClassArm}>
            <SelectTrigger>
              <SelectValue placeholder="Choose a class arm" />
            </SelectTrigger>
            <SelectContent>
              {classArms.map(arm => (
                <SelectItem key={arm.id} value={arm.id}>
                  Grade {arm.grade_level} - {arm.arm_name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {selectedClassArm && (
        <Card className="bg-white shadow-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="w-5 h-5" />
              Weekly Timetable
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
              </div>
            ) : (
              <div className="space-y-6">
                {days.map(day => (
                  <div key={day}>
                    <h3 className="text-lg font-semibold text-gray-900 mb-3">{day}</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                      {groupedByDay[day]?.map(slot => (
                        <div
                          key={slot.id}
                          onClick={() => {
                            setEditingSlot(slot);
                            setIsFormOpen(true);
                          }}
                          className="p-4 border-2 border-gray-200 rounded-lg hover:border-blue-500 cursor-pointer transition-all"
                        >
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-sm font-semibold text-blue-600">Period {slot.period_number}</span>
                            <span className="text-xs text-gray-600 flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              {slot.start_time} - {slot.end_time}
                            </span>
                          </div>
                          <p className="font-semibold text-gray-900">{slot.subject}</p>
                          <p className="text-sm text-gray-600">{slot.teacher_name}</p>
                          {slot.room && <p className="text-xs text-gray-500">Room {slot.room}</p>}
                        </div>
                      ))}
                    </div>
                    {(!groupedByDay[day] || groupedByDay[day].length === 0) && (
                      <p className="text-sm text-gray-500 italic">No periods scheduled</p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      <TimetableFormDialog
        open={isFormOpen}
        onOpenChange={setIsFormOpen}
        slot={editingSlot}
        teachers={teachers}
        onSubmit={handleSubmit}
      />
    </div>
  );
}

function TimetableFormDialog({ open, onOpenChange, slot, teachers, onSubmit }) {
  const [formData, setFormData] = useState(
    slot || {
      day_of_week: 'Monday',
      period_number: 1,
      start_time: '',
      end_time: '',
      subject: '',
      teacher_id: '',
      room: '',
    }
  );

  React.useEffect(() => {
    if (slot) {
      setFormData(slot);
    } else {
      setFormData({
        day_of_week: 'Monday',
        period_number: 1,
        start_time: '',
        end_time: '',
        subject: '',
        teacher_id: '',
        room: '',
      });
    }
  }, [slot, open]);

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{slot ? 'Edit Period' : 'Add Period'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label>Day of Week *</Label>
            <Select value={formData.day_of_week} onValueChange={(value) => setFormData({ ...formData, day_of_week: value })}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Monday">Monday</SelectItem>
                <SelectItem value="Tuesday">Tuesday</SelectItem>
                <SelectItem value="Wednesday">Wednesday</SelectItem>
                <SelectItem value="Thursday">Thursday</SelectItem>
                <SelectItem value="Friday">Friday</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Period Number *</Label>
            <Input
              type="number"
              value={formData.period_number}
              onChange={(e) => setFormData({ ...formData, period_number: parseInt(e.target.value) })}
              min="1"
              required
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Start Time *</Label>
              <Input
                type="time"
                value={formData.start_time}
                onChange={(e) => setFormData({ ...formData, start_time: e.target.value })}
                required
              />
            </div>
            <div>
              <Label>End Time *</Label>
              <Input
                type="time"
                value={formData.end_time}
                onChange={(e) => setFormData({ ...formData, end_time: e.target.value })}
                required
              />
            </div>
          </div>
          <div>
            <Label>Subject *</Label>
            <Input
              value={formData.subject}
              onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
              placeholder="e.g., Mathematics"
              required
            />
          </div>
          <div>
            <Label>Teacher</Label>
            <Select value={formData.teacher_id} onValueChange={(value) => setFormData({ ...formData, teacher_id: value })}>
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
          <div>
            <Label>Room</Label>
            <Input
              value={formData.room}
              onChange={(e) => setFormData({ ...formData, room: e.target.value })}
              placeholder="e.g., 101"
            />
          </div>
          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" className="bg-blue-600 hover:bg-blue-700">
              {slot ? 'Update' : 'Create'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}