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
import { Plus, Calendar, Clock, Upload, List, Grid3x3 } from 'lucide-react';
import BulkImportDialog from '../components/admin/BulkImportDialog';

export default function TimetableManagement() {
  const [selectedClassArm, setSelectedClassArm] = useState('');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingSlot, setEditingSlot] = useState(null);
  const [isImportOpen, setIsImportOpen] = useState(false);
  const [viewMode, setViewMode] = useState('calendar');
  const [selectedTeacher, setSelectedTeacher] = useState('all');
  const [selectedCourse, setSelectedCourse] = useState('all');
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
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
    mutationFn: async ({ id, data }) => {
      const updateData = { ...data };
      delete updateData.id;
      delete updateData.created_date;
      delete updateData.updated_date;
      delete updateData.created_by;
      return await base44.entities.Timetable.update(id, updateData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['timetable'] });
      setIsFormOpen(false);
      setEditingSlot(null);
      setIsDetailOpen(false);
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

    if (editingSlot?.id) {
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

  // Calendar view helpers
  const timeSlots = [
    '08:00-09:00', '09:00-10:00', '10:00-11:00', '11:00-12:00',
    '12:00-13:00', '13:00-14:00', '14:00-15:00', '15:00-16:00'
  ];

  const filteredTimetable = timetable.filter(slot => {
    const teacherMatch = selectedTeacher === 'all' || slot.teacher_id === selectedTeacher;
    const courseMatch = selectedCourse === 'all' || slot.subject === selectedCourse;
    return teacherMatch && courseMatch;
  });

  const uniqueCourses = [...new Set(timetable.map(t => t.subject))];

  const getPeriodForSlot = (day, time) => {
    return filteredTimetable.find(t => 
      t.day_of_week === day && 
      `${t.start_time}-${t.end_time}` === time
    );
  };

  const handleSlotClick = (period) => {
    setSelectedSlot(period);
    setIsDetailOpen(true);
  };

  const getColorForSubject = (subject) => {
    const colors = [
      'bg-blue-100 border-blue-300 text-blue-800',
      'bg-green-100 border-green-300 text-green-800',
      'bg-purple-100 border-purple-300 text-purple-800',
      'bg-orange-100 border-orange-300 text-orange-800',
      'bg-pink-100 border-pink-300 text-pink-800',
      'bg-indigo-100 border-indigo-300 text-indigo-800',
    ];
    const index = subject?.charCodeAt(0) % colors.length || 0;
    return colors[index];
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Timetables</h1>
          <p className="text-gray-600 mt-1">Manage and view class schedules</p>
        </div>
        <div className="flex gap-2">
          <div className="flex bg-gray-100 rounded-lg p-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setViewMode('list')}
              className={viewMode === 'list' ? 'bg-blue-600 text-white hover:bg-blue-700 hover:text-white' : 'text-gray-700 hover:bg-gray-200'}
            >
              <List className="w-4 h-4 mr-2" />
              List
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setViewMode('calendar')}
              className={viewMode === 'calendar' ? 'bg-blue-600 text-white hover:bg-blue-700 hover:text-white' : 'text-gray-700 hover:bg-gray-200'}
            >
              <Grid3x3 className="w-4 h-4 mr-2" />
              Calendar
            </Button>
          </div>
          <Button
            onClick={() => setIsImportOpen(true)}
            disabled={!selectedClassArm}
            variant="outline"
            className="border-gray-300 text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Upload className="w-4 h-4 mr-2" />
            Bulk Import
          </Button>
          <Button
            onClick={() => {
              setEditingSlot(null);
              setIsFormOpen(true);
            }}
            disabled={!selectedClassArm}
            className="bg-blue-600 hover:bg-blue-700 text-white disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Period
          </Button>
        </div>
      </div>

      <Card className="bg-white shadow-md">
        <CardContent className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
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
            </div>
            {viewMode === 'calendar' && (
              <>
                <div>
                  <Label>Filter by Teacher</Label>
                  <Select value={selectedTeacher} onValueChange={setSelectedTeacher}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Teachers</SelectItem>
                      {teachers.map((teacher) => (
                        <SelectItem key={teacher.id} value={teacher.id}>
                          {teacher.first_name} {teacher.last_name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Filter by Subject</Label>
                  <Select value={selectedCourse} onValueChange={setSelectedCourse}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Subjects</SelectItem>
                      {uniqueCourses.map((course, idx) => (
                        <SelectItem key={idx} value={course}>
                          {course}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </>
            )}
          </div>
        </CardContent>
      </Card>

      {selectedClassArm && viewMode === 'list' && (
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

      {selectedClassArm && viewMode === 'calendar' && (
        <Card className="bg-white shadow-md">
          <CardHeader>
            <CardTitle>Calendar View</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr>
                    <th className="border p-2 bg-gray-100 text-sm font-semibold text-gray-700 w-32">
                      Time
                    </th>
                    {days.map((day) => (
                      <th key={day} className="border p-2 bg-gray-100 text-sm font-semibold text-gray-700">
                        {day}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {timeSlots.map((time) => (
                    <tr key={time}>
                      <td className="border p-2 bg-gray-50 text-xs font-medium text-gray-600 text-center">
                        {time}
                      </td>
                      {days.map((day) => {
                        const period = getPeriodForSlot(day, time);
                        const teacherConflict = selectedTeacher !== 'all' && timetable.find(t => 
                          t.teacher_id === selectedTeacher && 
                          t.day_of_week === day && 
                          `${t.start_time}-${t.end_time}` === time &&
                          t.class_arm_id !== selectedClassArm
                        );
                        
                        return (
                          <td 
                            key={`${day}-${time}`} 
                            className="border p-1 h-24 align-top cursor-pointer hover:bg-gray-50 transition-colors"
                            onClick={() => {
                              if (period) {
                                handleSlotClick(period);
                              } else if (!teacherConflict) {
                                // Open create dialog with pre-filled data
                                setEditingSlot({
                                  day_of_week: day,
                                  start_time: time.split('-')[0],
                                  end_time: time.split('-')[1],
                                  period_number: timeSlots.indexOf(time) + 1,
                                  subject: '',
                                  teacher_id: '',
                                  room: '',
                                });
                                setIsFormOpen(true);
                              }
                            }}
                          >
                            {period ? (
                              <div className={`h-full p-2 rounded border-l-4 ${getColorForSubject(period.subject)}`}>
                                <p className="font-semibold text-sm">{period.subject}</p>
                                <p className="text-xs mt-1">{period.teacher_name}</p>
                                <p className="text-xs text-gray-600">Room: {period.room}</p>
                              </div>
                            ) : teacherConflict ? (
                              <div className="h-full flex flex-col items-center justify-center bg-red-50 border border-red-200 rounded">
                                <p className="text-xs text-red-700 font-semibold">Occupied</p>
                                <p className="text-xs text-red-600">{teacherConflict.class_arm_name}</p>
                              </div>
                            ) : (
                              <div className="h-full flex items-center justify-center text-gray-300 hover:text-blue-500 hover:bg-blue-50 rounded transition-colors">
                                <span className="text-xs">+ Add</span>
                              </div>
                            )}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {!selectedClassArm && (
        <Card>
          <CardContent className="p-12 text-center">
            <Calendar className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">Please select a class arm to view the timetable</p>
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

      {selectedClassArm && (
        <BulkImportDialog
          open={isImportOpen}
          onOpenChange={setIsImportOpen}
          entityName="Timetable"
          entitySchema={{
            type: "object",
            properties: {
              day_of_week: { type: "string" },
              period_number: { type: "number" },
              start_time: { type: "string" },
              end_time: { type: "string" },
              subject: { type: "string" },
              teacher_id: { type: "string" },
              teacher_name: { type: "string" },
              room: { type: "string" }
            },
            required: ["day_of_week", "period_number", "start_time", "end_time", "subject"]
          }}
          templateData={[
            { day_of_week: "Monday", period_number: 1, start_time: "08:00", end_time: "09:00", subject: "Mathematics", room: "101" }
          ]}
          onImportComplete={() => {
            queryClient.invalidateQueries({ queryKey: ['timetable'] });
            setIsImportOpen(false);
          }}
        />
      )}

      {/* Period Detail Dialog for Calendar View */}
      <Dialog open={isDetailOpen} onOpenChange={setIsDetailOpen}>
        <DialogContent className="bg-white">
          <DialogHeader>
            <DialogTitle>Period Details</DialogTitle>
          </DialogHeader>
          {selectedSlot && (
            <div className="space-y-4">
              <div>
                <Label>Subject</Label>
                <p className="text-lg font-semibold">{selectedSlot.subject}</p>
              </div>
              <div>
                <Label>Teacher</Label>
                <p>{selectedSlot.teacher_name}</p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Day</Label>
                  <p>{selectedSlot.day_of_week}</p>
                </div>
                <div>
                  <Label>Period Number</Label>
                  <p>{selectedSlot.period_number}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Start Time</Label>
                  <p>{selectedSlot.start_time}</p>
                </div>
                <div>
                  <Label>End Time</Label>
                  <p>{selectedSlot.end_time}</p>
                </div>
              </div>
              <div>
                <Label>Room</Label>
                <p>{selectedSlot.room}</p>
              </div>
              <Button 
                onClick={() => {
                  setIsDetailOpen(false);
                  setEditingSlot(selectedSlot);
                  setIsFormOpen(true);
                }}
                className="w-full bg-blue-600 hover:bg-blue-700"
              >
                Edit Period
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function TimetableFormDialog({ open, onOpenChange, slot, teachers, onSubmit }) {
  const { data: subjects = [] } = useQuery({
    queryKey: ['subjects'],
    queryFn: () => base44.entities.Subject.list(),
  });
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
      <DialogContent className="max-w-md bg-white">
        <DialogHeader>
          <DialogTitle className="text-gray-900">{slot ? 'Edit Period' : 'Add Period'}</DialogTitle>
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
            <select
              value={formData.subject}
              onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
              className="w-full px-3 py-2 border rounded-lg"
              required
            >
              <option value="">Select subject</option>
              {subjects.map(subject => (
                <option key={subject.id} value={subject.subject_name}>
                  {subject.subject_name}
                </option>
              ))}
            </select>
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