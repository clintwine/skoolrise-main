import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Calendar, Clock, ChevronLeft, ChevronRight } from 'lucide-react';

export default function TimetableCalendar() {
  const [selectedClassArm, setSelectedClassArm] = useState('');
  const [selectedTeacher, setSelectedTeacher] = useState('all');
  const [selectedCourse, setSelectedCourse] = useState('all');
  const [viewMode, setViewMode] = useState('week');
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

  const { data: timetable = [] } = useQuery({
    queryKey: ['timetable', selectedClassArm],
    queryFn: async () => {
      const allTimetable = await base44.entities.Timetable.list();
      return selectedClassArm ? allTimetable.filter(t => t.class_arm_id === selectedClassArm) : allTimetable;
    },
    enabled: !!selectedClassArm,
  });

  const filteredTimetable = timetable.filter(slot => {
    const teacherMatch = selectedTeacher === 'all' || slot.teacher_id === selectedTeacher;
    const courseMatch = selectedCourse === 'all' || slot.subject === selectedCourse;
    return teacherMatch && courseMatch;
  });

  const uniqueCourses = [...new Set(timetable.map(t => t.subject))];

  const daysOfWeek = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
  const timeSlots = [
    '08:00-09:00', '09:00-10:00', '10:00-11:00', '11:00-12:00',
    '12:00-13:00', '13:00-14:00', '14:00-15:00', '15:00-16:00'
  ];

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
          <h1 className="text-3xl font-bold text-gray-900">Interactive Timetable</h1>
          <p className="text-gray-600 mt-1">Visual calendar view of class schedules</p>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label>Class Arm</Label>
              <Select value={selectedClassArm} onValueChange={setSelectedClassArm}>
                <SelectTrigger>
                  <SelectValue placeholder="Select Class Arm" />
                </SelectTrigger>
                <SelectContent>
                  {classArms.map((arm) => (
                    <SelectItem key={arm.id} value={arm.id}>
                      {arm.grade_level} - {arm.arm_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
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
              <Label>Filter by Course</Label>
              <Select value={selectedCourse} onValueChange={setSelectedCourse}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Courses</SelectItem>
                  {uniqueCourses.map((course, idx) => (
                    <SelectItem key={idx} value={course}>
                      {course}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Timetable Grid */}
      {selectedClassArm ? (
        <Card>
          <CardHeader>
            <CardTitle>Weekly Schedule</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr>
                    <th className="border p-2 bg-gray-100 text-sm font-semibold text-gray-700 w-32">
                      Time
                    </th>
                    {daysOfWeek.map((day) => (
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
                      {daysOfWeek.map((day) => {
                        const period = getPeriodForSlot(day, time);
                        return (
                          <td 
                            key={`${day}-${time}`} 
                            className="border p-1 h-24 align-top cursor-pointer hover:bg-gray-50 transition-colors"
                            onClick={() => period && handleSlotClick(period)}
                          >
                            {period ? (
                              <div className={`h-full p-2 rounded border-l-4 ${getColorForSubject(period.subject)}`}>
                                <p className="font-semibold text-sm">{period.subject}</p>
                                <p className="text-xs mt-1">{period.teacher_name}</p>
                                <p className="text-xs text-gray-600">Room: {period.room}</p>
                              </div>
                            ) : (
                              <div className="h-full flex items-center justify-center text-gray-300">
                                <span className="text-xs">Free</span>
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
      ) : (
        <Card>
          <CardContent className="p-12 text-center">
            <Calendar className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">Please select a class arm to view the timetable</p>
          </CardContent>
        </Card>
      )}

      {/* Period Detail Dialog */}
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
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}