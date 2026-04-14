import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar, Clock, Video, Phone, Users, Plus, Settings } from 'lucide-react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay } from 'date-fns';
import TeacherAvailabilityManager from '../components/conference/TeacherAvailabilityManager';
import ConferenceStats from '../components/conference/ConferenceStats';

export default function ConferenceScheduling() {
  const [user, setUser] = useState(null);
  const [showBookingForm, setShowBookingForm] = useState(false);
  const [selectedConference, setSelectedConference] = useState(null);
  const [currentDate, setCurrentDate] = useState(new Date());

  const [bookingForm, setBookingForm] = useState({
    student_id: '',
    scheduled_date: '',
    duration_minutes: 30,
    meeting_type: 'In-Person',
    purpose: '',
  });

  const queryClient = useQueryClient();

  useEffect(() => {
    const fetchUser = async () => {
      const currentUser = await base44.auth.me();
      setUser(currentUser);
    };
    fetchUser();
  }, []);

  const { data: conferences = [] } = useQuery({
    queryKey: ['conferences'],
    queryFn: () => base44.entities.Conference.list('-scheduled_date'),
  });

  const { data: students = [] } = useQuery({
    queryKey: ['students'],
    queryFn: () => base44.entities.Student.list(),
  });

  const { data: teachers = [] } = useQuery({
    queryKey: ['teachers'],
    queryFn: () => base44.entities.Teacher.list(),
  });

  const currentTeacher = teachers.find(t => t.user_id === user?.id);

  const createConferenceMutation = useMutation({
    mutationFn: async (data) => {
      const student = students.find(s => s.id === data.student_id);
      return await base44.entities.Conference.create({
        ...data,
        teacher_id: user?.teacher_id || user?.id,
        teacher_name: user?.full_name,
        parent_email: student?.parent_email,
        parent_name: student?.parent_name,
        student_name: `${student?.first_name} ${student?.last_name}`,
        requested_by: user?.role === 'admin' ? 'Admin' : 'Teacher',
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['conferences'] });
      setShowBookingForm(false);
      setBookingForm({
        student_id: '',
        scheduled_date: '',
        duration_minutes: 30,
        meeting_type: 'In-Person',
        purpose: '',
      });
    },
  });

  const updateStatusMutation = useMutation({
    mutationFn: ({ id, status }) => base44.entities.Conference.update(id, { status }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['conferences'] }),
  });

  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd });

  const getConferencesForDay = (day) => {
    return conferences.filter(c => isSameDay(new Date(c.scheduled_date), day));
  };

  const upcomingConferences = conferences.filter(c => 
    new Date(c.scheduled_date) >= new Date() && c.status !== 'Completed' && c.status !== 'Cancelled'
  );

  const statusColors = {
    Scheduled: 'bg-blue-100 text-blue-800',
    Confirmed: 'bg-green-100 text-green-800',
    Rescheduled: 'bg-yellow-100 text-yellow-800',
    Completed: 'bg-gray-100 text-gray-800',
    Cancelled: 'bg-red-100 text-red-800',
    'No Show': 'bg-orange-100 text-orange-800',
  };

  const meetingIcons = {
    'In-Person': <Users className="w-4 h-4" />,
    'Virtual': <Video className="w-4 h-4" />,
    'Phone Call': <Phone className="w-4 h-4" />,
  };

  if (!user) {
    return (
      <div className="text-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Conference Scheduling</h1>
          <p className="text-gray-600 mt-1">Manage parent-teacher conferences</p>
        </div>
        {(user.role === 'admin' || user.teacher_id) && (
          <Button onClick={() => setShowBookingForm(true)} className="bg-blue-600 hover:bg-blue-700">
            <Plus className="w-4 h-4 mr-2" />
            Schedule Conference
          </Button>
        )}
      </div>

      <ConferenceStats
        stats={{
          total: conferences.length,
          upcoming: upcomingConferences.length,
          month: conferences.filter(c => new Date(c.scheduled_date) >= monthStart && new Date(c.scheduled_date) <= monthEnd).length,
          completed: conferences.filter(c => c.status === 'Completed').length,
        }}
      />

      <Tabs defaultValue="upcoming" className="space-y-4">
        <TabsList>
          <TabsTrigger value="upcoming">Upcoming Conferences</TabsTrigger>
          <TabsTrigger value="calendar">Calendar View</TabsTrigger>
          {(user?.role === 'admin' || currentTeacher) && (
            <TabsTrigger value="availability">
              <Settings className="w-4 h-4 mr-1" />
              My Availability
            </TabsTrigger>
          )}
        </TabsList>

        <TabsContent value="upcoming">
          <Card className="bg-white shadow-md">
            <CardHeader>
              <CardTitle>Upcoming Conferences</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {upcomingConferences.slice(0, 10).map(conf => (
                  <div key={conf.id} className="rounded-2xl border border-gray-200 p-4 hover:bg-gray-50 transition-colors">
                    <div className="flex flex-col xl:flex-row xl:items-start xl:justify-between gap-4">
                      <div className="space-y-3">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-semibold text-gray-900">{conf.student_name}</span>
                          <Badge className={statusColors[conf.status]}>{conf.status}</Badge>
                          <span className="inline-flex items-center gap-1 text-sm text-gray-600">
                            {meetingIcons[conf.meeting_type]}
                            {conf.meeting_type}
                          </span>
                        </div>
                        <div className="grid sm:grid-cols-2 gap-3 text-sm text-gray-600">
                          <p>Parent: {conf.parent_name} ({conf.parent_email})</p>
                          <p>Date: {format(new Date(conf.scheduled_date), 'PPp')}</p>
                          <p>Duration: {conf.duration_minutes} minutes</p>
                          <p>Location: {conf.location || 'To be confirmed'}</p>
                        </div>
                        {conf.purpose && <p className="text-sm text-gray-600">Purpose: {conf.purpose}</p>}
                      </div>
                      <div className="flex gap-2">
                        {conf.status === 'Scheduled' && (
                          <Button
                            size="sm"
                            onClick={() => updateStatusMutation.mutate({ id: conf.id, status: 'Confirmed' })}
                            className="bg-green-600 hover:bg-green-700"
                          >
                            Confirm
                          </Button>
                        )}
                        {(conf.status === 'Scheduled' || conf.status === 'Confirmed') && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => updateStatusMutation.mutate({ id: conf.id, status: 'Completed' })}
                          >
                            Complete
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="calendar">
          <Card className="bg-white shadow-md">
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle>Calendar View - {format(currentDate, 'MMMM yyyy')}</CardTitle>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentDate(new Date(currentDate.setMonth(currentDate.getMonth() - 1)))}
                  >
                    Previous
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => setCurrentDate(new Date())}>
                    Today
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentDate(new Date(currentDate.setMonth(currentDate.getMonth() + 1)))}
                  >
                    Next
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-7 gap-2">
                {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                  <div key={day} className="text-center font-semibold text-gray-600 p-2">
                    {day}
                  </div>
                ))}
                {daysInMonth.map((day, idx) => {
                  const dayConferences = getConferencesForDay(day);
                  const isToday = isSameDay(day, new Date());
                  return (
                    <div
                      key={idx}
                      className={`min-h-24 border rounded-lg p-2 hover:bg-blue-50 cursor-pointer transition-colors ${isToday ? 'bg-blue-50 border-blue-300' : ''}`}
                      onClick={() => {
                        setBookingForm({
                          ...bookingForm,
                          scheduled_date: format(day, "yyyy-MM-dd'T'09:00"),
                        });
                        setShowBookingForm(true);
                      }}
                    >
                      <div className={`text-sm font-semibold mb-1 ${isToday ? 'text-blue-700' : 'text-gray-700'}`}>
                        {format(day, 'd')}
                      </div>
                      <div className="space-y-1">
                        {dayConferences.map(conf => (
                          <div
                            key={conf.id}
                            className="text-xs p-1 rounded bg-blue-100 text-blue-800 cursor-pointer hover:bg-blue-200"
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedConference(conf);
                            }}
                          >
                            {format(new Date(conf.scheduled_date), 'h:mm a')}
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {(user?.role === 'admin' || currentTeacher) && (
          <TabsContent value="availability">
            <TeacherAvailabilityManager 
              teacherId={currentTeacher?.id || user?.id}
              teacherName={currentTeacher ? `${currentTeacher.first_name} ${currentTeacher.last_name}` : user?.full_name}
            />
          </TabsContent>
        )}
      </Tabs>

      <Dialog open={showBookingForm} onOpenChange={setShowBookingForm}>
        <DialogContent className="bg-white">
          <DialogHeader>
            <DialogTitle className="text-gray-900">Schedule Conference</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Select Student *</label>
              <Select value={bookingForm.student_id} onValueChange={(value) => setBookingForm({ ...bookingForm, student_id: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose student" />
                </SelectTrigger>
                <SelectContent>
                  {students.map(s => (
                    <SelectItem key={s.id} value={s.id}>
                      {s.first_name} {s.last_name} - Parent: {s.parent_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Date & Time *</label>
              <Input
                type="datetime-local"
                value={bookingForm.scheduled_date}
                onChange={(e) => setBookingForm({ ...bookingForm, scheduled_date: e.target.value })}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Duration (minutes)</label>
                <Input
                  type="number"
                  value={bookingForm.duration_minutes}
                  onChange={(e) => setBookingForm({ ...bookingForm, duration_minutes: parseInt(e.target.value) })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Meeting Type</label>
                <Select value={bookingForm.meeting_type} onValueChange={(value) => setBookingForm({ ...bookingForm, meeting_type: value })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="In-Person">In-Person</SelectItem>
                    <SelectItem value="Virtual">Virtual</SelectItem>
                    <SelectItem value="Phone Call">Phone Call</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Purpose/Agenda</label>
              <Textarea
                value={bookingForm.purpose}
                onChange={(e) => setBookingForm({ ...bookingForm, purpose: e.target.value })}
                placeholder="What will be discussed..."
                rows={3}
              />
            </div>

            <div className="flex justify-end gap-3">
              <Button variant="outline" onClick={() => setShowBookingForm(false)}>Cancel</Button>
              <Button
                onClick={() => createConferenceMutation.mutate(bookingForm)}
                disabled={!bookingForm.student_id || !bookingForm.scheduled_date}
                className="bg-blue-600 hover:bg-blue-700"
              >
                Schedule Conference
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}