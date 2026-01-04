import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Calendar, Clock, Video, Phone, Users, CheckCircle } from 'lucide-react';
import { format, parseISO, addMinutes, isBefore, isAfter } from 'date-fns';
import { toast } from 'sonner';

export default function ParentBookingView({ parentId, parentName, parentEmail, students }) {
  const [selectedTeacher, setSelectedTeacher] = useState(null);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [selectedTime, setSelectedTime] = useState(null);
  const [bookingForm, setBookingForm] = useState({
    student_id: '',
    meeting_type: 'In-Person',
    purpose: '',
  });
  const [showConfirm, setShowConfirm] = useState(false);
  
  const queryClient = useQueryClient();

  const { data: teachers = [] } = useQuery({
    queryKey: ['teachers-for-booking'],
    queryFn: () => base44.entities.Teacher.list(),
  });

  const { data: availabilities = [] } = useQuery({
    queryKey: ['all-teacher-availability'],
    queryFn: async () => {
      const all = await base44.entities.TeacherAvailability.list();
      return all.filter(a => a.status === 'Active' && new Date(a.date) >= new Date());
    },
  });

  const { data: existingConferences = [] } = useQuery({
    queryKey: ['existing-conferences'],
    queryFn: () => base44.entities.Conference.list(),
  });

  const bookMutation = useMutation({
    mutationFn: async (data) => {
      const student = students.find(s => s.id === data.student_id);
      return await base44.entities.Conference.create({
        teacher_id: selectedTeacher.id,
        teacher_name: `${selectedTeacher.first_name} ${selectedTeacher.last_name}`,
        parent_id: parentId,
        parent_name: parentName,
        parent_email: parentEmail,
        student_id: data.student_id,
        student_name: `${student.first_name} ${student.last_name}`,
        scheduled_date: selectedTime,
        duration_minutes: selectedSlot.slot_duration,
        meeting_type: data.meeting_type,
        location: selectedSlot.location,
        purpose: data.purpose,
        status: 'Scheduled',
        requested_by: 'Parent',
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['existing-conferences'] });
      queryClient.invalidateQueries({ queryKey: ['parent-conferences'] });
      setShowConfirm(false);
      setSelectedTeacher(null);
      setSelectedSlot(null);
      setSelectedTime(null);
      toast.success('Conference booked successfully! You will receive a confirmation email.');
    },
  });

  const getAvailableSlots = (availability) => {
    const slots = [];
    const startTime = parseISO(`${availability.date}T${availability.start_time}`);
    const endTime = parseISO(`${availability.date}T${availability.end_time}`);
    const duration = availability.slot_duration || 30;
    
    let currentSlot = startTime;
    while (isBefore(addMinutes(currentSlot, duration), endTime) || 
           format(addMinutes(currentSlot, duration), 'HH:mm') === format(endTime, 'HH:mm')) {
      const slotTime = currentSlot.toISOString();
      const isBooked = existingConferences.some(c => 
        c.teacher_id === availability.teacher_id &&
        c.scheduled_date === slotTime &&
        c.status !== 'Cancelled'
      );
      
      if (!isBooked && isAfter(currentSlot, new Date())) {
        slots.push({
          time: slotTime,
          display: format(currentSlot, 'h:mm a'),
        });
      }
      currentSlot = addMinutes(currentSlot, duration);
    }
    return slots;
  };

  const teacherAvailabilities = selectedTeacher 
    ? availabilities.filter(a => a.teacher_id === selectedTeacher.id)
    : [];

  const meetingTypeIcons = {
    'In-Person': <Users className="w-4 h-4" />,
    'Virtual': <Video className="w-4 h-4" />,
    'Phone Call': <Phone className="w-4 h-4" />,
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="w-5 h-5 text-blue-600" />
            Book a Conference
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Select Teacher</label>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                {teachers.filter(t => t.status === 'Active').map(teacher => {
                  const hasAvailability = availabilities.some(a => a.teacher_id === teacher.id);
                  return (
                    <div
                      key={teacher.id}
                      onClick={() => hasAvailability && setSelectedTeacher(teacher)}
                      className={`p-4 border rounded-xl cursor-pointer transition-all ${
                        selectedTeacher?.id === teacher.id 
                          ? 'border-blue-500 bg-blue-50 ring-2 ring-blue-200' 
                          : hasAvailability 
                            ? 'hover:border-blue-300 hover:bg-gray-50' 
                            : 'opacity-50 cursor-not-allowed'
                      }`}
                    >
                      <p className="font-semibold text-gray-900">
                        {teacher.first_name} {teacher.last_name}
                      </p>
                      <p className="text-sm text-gray-600">{teacher.department}</p>
                      {!hasAvailability && (
                        <Badge variant="outline" className="mt-2 text-xs">No slots available</Badge>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {selectedTeacher && (
              <div>
                <label className="block text-sm font-medium mb-2">Select Date & Time</label>
                {teacherAvailabilities.length === 0 ? (
                  <p className="text-gray-500 text-center py-4">No available slots for this teacher</p>
                ) : (
                  <div className="space-y-4">
                    {teacherAvailabilities.map(availability => {
                      const slots = getAvailableSlots(availability);
                      const allowedTypes = availability.meeting_types 
                        ? JSON.parse(availability.meeting_types) 
                        : ['In-Person'];
                      
                      if (slots.length === 0) return null;
                      
                      return (
                        <div key={availability.id} className="border rounded-xl p-4">
                          <div className="flex items-center gap-3 mb-3">
                            <div className="text-center bg-blue-50 px-3 py-2 rounded-lg">
                              <p className="text-xs text-blue-600">{format(new Date(availability.date), 'EEE')}</p>
                              <p className="text-xl font-bold text-blue-700">{format(new Date(availability.date), 'd')}</p>
                              <p className="text-xs text-blue-600">{format(new Date(availability.date), 'MMM')}</p>
                            </div>
                            <div>
                              <p className="font-medium">{format(new Date(availability.date), 'EEEE, MMMM d, yyyy')}</p>
                              <p className="text-sm text-gray-600">{availability.slot_duration} minute slots</p>
                              <div className="flex gap-1 mt-1">
                                {allowedTypes.map(t => (
                                  <span key={t} className="text-xs text-gray-500 flex items-center gap-1">
                                    {meetingTypeIcons[t]} {t}
                                  </span>
                                ))}
                              </div>
                            </div>
                          </div>
                          <div className="flex flex-wrap gap-2">
                            {slots.map(slot => (
                              <Button
                                key={slot.time}
                                variant={selectedTime === slot.time && selectedSlot?.id === availability.id ? 'default' : 'outline'}
                                size="sm"
                                onClick={() => {
                                  setSelectedSlot(availability);
                                  setSelectedTime(slot.time);
                                }}
                                className={selectedTime === slot.time && selectedSlot?.id === availability.id 
                                  ? 'bg-blue-600' : ''}
                              >
                                <Clock className="w-3 h-3 mr-1" />
                                {slot.display}
                              </Button>
                            ))}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {selectedTime && selectedSlot && (
              <Button 
                onClick={() => setShowConfirm(true)} 
                className="w-full bg-blue-600 hover:bg-blue-700"
              >
                Continue to Book
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      <Dialog open={showConfirm} onOpenChange={setShowConfirm}>
        <DialogContent className="bg-white">
          <DialogHeader>
            <DialogTitle>Confirm Booking</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="bg-blue-50 p-4 rounded-xl">
              <p className="font-semibold text-blue-900">
                {selectedTeacher?.first_name} {selectedTeacher?.last_name}
              </p>
              <p className="text-sm text-blue-700">
                {selectedTime && format(new Date(selectedTime), 'EEEE, MMMM d, yyyy')}
              </p>
              <p className="text-sm text-blue-700">
                {selectedTime && format(new Date(selectedTime), 'h:mm a')} ({selectedSlot?.slot_duration} min)
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Select Child *</label>
              <Select 
                value={bookingForm.student_id} 
                onValueChange={(v) => setBookingForm({ ...bookingForm, student_id: v })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Choose child" />
                </SelectTrigger>
                <SelectContent>
                  {students.map(s => (
                    <SelectItem key={s.id} value={s.id}>
                      {s.first_name} {s.last_name} - Grade {s.grade_level}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Meeting Type</label>
              <Select 
                value={bookingForm.meeting_type} 
                onValueChange={(v) => setBookingForm({ ...bookingForm, meeting_type: v })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {(selectedSlot?.meeting_types ? JSON.parse(selectedSlot.meeting_types) : ['In-Person']).map(type => (
                    <SelectItem key={type} value={type}>
                      <span className="flex items-center gap-2">
                        {meetingTypeIcons[type]} {type}
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">What would you like to discuss?</label>
              <Textarea
                value={bookingForm.purpose}
                onChange={(e) => setBookingForm({ ...bookingForm, purpose: e.target.value })}
                placeholder="e.g., Academic progress, behavior concerns, upcoming events..."
                rows={3}
              />
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <Button variant="outline" onClick={() => setShowConfirm(false)}>Cancel</Button>
              <Button 
                onClick={() => bookMutation.mutate(bookingForm)}
                disabled={!bookingForm.student_id || bookMutation.isPending}
                className="bg-green-600 hover:bg-green-700"
              >
                <CheckCircle className="w-4 h-4 mr-2" />
                {bookMutation.isPending ? 'Booking...' : 'Confirm Booking'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}