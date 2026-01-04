import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Calendar, Clock, Plus, Trash2 } from 'lucide-react';
import { format, addDays } from 'date-fns';
import { toast } from 'sonner';

export default function TeacherAvailabilityManager({ teacherId, teacherName }) {
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    date: format(new Date(), 'yyyy-MM-dd'),
    start_time: '09:00',
    end_time: '17:00',
    slot_duration: 30,
    is_recurring: false,
    recurrence_day: '',
    location: '',
    meeting_types: ['In-Person', 'Virtual', 'Phone Call'],
  });
  
  const queryClient = useQueryClient();

  const { data: availabilities = [] } = useQuery({
    queryKey: ['teacher-availability', teacherId],
    queryFn: async () => {
      const all = await base44.entities.TeacherAvailability.list();
      return all.filter(a => a.teacher_id === teacherId && a.status === 'Active');
    },
    enabled: !!teacherId,
  });

  const createMutation = useMutation({
    mutationFn: async (data) => {
      return await base44.entities.TeacherAvailability.create({
        ...data,
        teacher_id: teacherId,
        teacher_name: teacherName,
        meeting_types: JSON.stringify(data.meeting_types),
        status: 'Active',
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['teacher-availability'] });
      setShowForm(false);
      toast.success('Availability slot created');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.TeacherAvailability.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['teacher-availability'] });
      toast.success('Availability slot removed');
    },
  });

  const handleMeetingTypeToggle = (type) => {
    const types = form.meeting_types.includes(type)
      ? form.meeting_types.filter(t => t !== type)
      : [...form.meeting_types, type];
    setForm({ ...form, meeting_types: types });
  };

  const generateWeekSlots = () => {
    const slots = [];
    for (let i = 0; i < 5; i++) {
      const date = addDays(new Date(), i + 1);
      if (date.getDay() !== 0 && date.getDay() !== 6) {
        slots.push({
          date: format(date, 'yyyy-MM-dd'),
          start_time: '14:00',
          end_time: '17:00',
          slot_duration: 30,
          meeting_types: ['In-Person', 'Virtual'],
        });
      }
    }
    return slots;
  };

  const quickCreateWeek = async () => {
    const slots = generateWeekSlots();
    for (const slot of slots) {
      await base44.entities.TeacherAvailability.create({
        ...slot,
        teacher_id: teacherId,
        teacher_name: teacherName,
        meeting_types: JSON.stringify(slot.meeting_types),
        status: 'Active',
      });
    }
    queryClient.invalidateQueries({ queryKey: ['teacher-availability'] });
    toast.success('Week availability created');
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle className="flex items-center gap-2">
            <Calendar className="w-5 h-5 text-blue-600" />
            My Availability for Conferences
          </CardTitle>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={quickCreateWeek}>
              Quick: Add This Week
            </Button>
            <Button size="sm" onClick={() => setShowForm(true)} className="bg-blue-600 hover:bg-blue-700">
              <Plus className="w-4 h-4 mr-1" />
              Add Slot
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {availabilities.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <Calendar className="w-12 h-12 mx-auto mb-3 text-gray-300" />
            <p>No availability slots configured</p>
            <p className="text-sm">Add slots to allow parents to book conferences</p>
          </div>
        ) : (
          <div className="space-y-3">
            {availabilities.map((slot) => {
              const types = slot.meeting_types ? JSON.parse(slot.meeting_types) : [];
              return (
                <div key={slot.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-4">
                    <div className="text-center bg-white px-3 py-2 rounded-lg border">
                      <p className="text-xs text-gray-500">{format(new Date(slot.date), 'EEE')}</p>
                      <p className="text-lg font-bold text-gray-900">{format(new Date(slot.date), 'd')}</p>
                      <p className="text-xs text-gray-500">{format(new Date(slot.date), 'MMM')}</p>
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">
                        <Clock className="w-4 h-4 inline mr-1" />
                        {slot.start_time} - {slot.end_time}
                      </p>
                      <p className="text-sm text-gray-600">{slot.slot_duration} min slots</p>
                      <div className="flex gap-1 mt-1">
                        {types.map(t => (
                          <Badge key={t} variant="outline" className="text-xs">{t}</Badge>
                        ))}
                      </div>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => deleteMutation.mutate(slot.id)}
                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>

      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="bg-white">
          <DialogHeader>
            <DialogTitle>Add Availability Slot</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Date</label>
              <Input
                type="date"
                value={form.date}
                onChange={(e) => setForm({ ...form, date: e.target.value })}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Start Time</label>
                <Input
                  type="time"
                  value={form.start_time}
                  onChange={(e) => setForm({ ...form, start_time: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">End Time</label>
                <Input
                  type="time"
                  value={form.end_time}
                  onChange={(e) => setForm({ ...form, end_time: e.target.value })}
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Slot Duration</label>
              <Select 
                value={form.slot_duration.toString()} 
                onValueChange={(v) => setForm({ ...form, slot_duration: parseInt(v) })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="15">15 minutes</SelectItem>
                  <SelectItem value="20">20 minutes</SelectItem>
                  <SelectItem value="30">30 minutes</SelectItem>
                  <SelectItem value="45">45 minutes</SelectItem>
                  <SelectItem value="60">60 minutes</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Meeting Types Allowed</label>
              <div className="flex gap-4">
                {['In-Person', 'Virtual', 'Phone Call'].map(type => (
                  <label key={type} className="flex items-center gap-2 cursor-pointer">
                    <Checkbox
                      checked={form.meeting_types.includes(type)}
                      onCheckedChange={() => handleMeetingTypeToggle(type)}
                    />
                    <span className="text-sm">{type}</span>
                  </label>
                ))}
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Location (optional)</label>
              <Input
                value={form.location}
                onChange={(e) => setForm({ ...form, location: e.target.value })}
                placeholder="e.g., Room 101 or leave blank"
              />
            </div>
            <div className="flex justify-end gap-3 pt-2">
              <Button variant="outline" onClick={() => setShowForm(false)}>Cancel</Button>
              <Button 
                onClick={() => createMutation.mutate(form)}
                className="bg-blue-600 hover:bg-blue-700"
              >
                Add Availability
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </Card>
  );
}