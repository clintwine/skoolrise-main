import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Calendar, Clock, Video, Phone, Users, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';
import ParentBookingView from '../components/conference/ParentBookingView';

export default function ParentConferences() {
  const [user, setUser] = useState(null);
  const [selectedConference, setSelectedConference] = useState(null);
  const queryClient = useQueryClient();

  useEffect(() => {
    const fetchUser = async () => {
      const currentUser = await base44.auth.me();
      setUser(currentUser);
    };
    fetchUser();
  }, []);

  const { data: parents = [] } = useQuery({
    queryKey: ['parent-profile', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      return await base44.entities.Parent.filter({ user_id: user.id });
    },
    enabled: !!user?.id,
  });

  const parentProfile = parents[0];

  const { data: students = [] } = useQuery({
    queryKey: ['parent-students', parentProfile?.id],
    queryFn: async () => {
      if (!parentProfile?.id) return [];
      return await base44.entities.Student.filter({ parent_id: parentProfile.id });
    },
    enabled: !!parentProfile?.id,
  });

  const studentIds = students.map(s => s.id);

  const { data: conferences = [] } = useQuery({
    queryKey: ['parent-conferences', studentIds],
    queryFn: async () => {
      if (studentIds.length === 0) return [];
      const all = await base44.entities.Conference.list('-scheduled_date');
      return all.filter(c => studentIds.includes(c.student_id) || c.parent_email === user?.email);
    },
    enabled: studentIds.length > 0,
  });

  const cancelMutation = useMutation({
    mutationFn: (id) => base44.entities.Conference.update(id, { status: 'Cancelled' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['parent-conferences'] });
      toast.success('Conference cancelled');
    },
  });

  const upcomingConferences = conferences.filter(c => 
    new Date(c.scheduled_date) >= new Date() && 
    c.status !== 'Completed' && 
    c.status !== 'Cancelled'
  );

  const pastConferences = conferences.filter(c => 
    new Date(c.scheduled_date) < new Date() || 
    c.status === 'Completed' || 
    c.status === 'Cancelled'
  );

  const statusColors = {
    Scheduled: 'bg-blue-100 text-blue-800',
    Confirmed: 'bg-green-100 text-green-800',
    Rescheduled: 'bg-yellow-100 text-yellow-800',
    Completed: 'bg-gray-100 text-gray-800',
    Cancelled: 'bg-red-100 text-red-800',
    'No Show': 'bg-orange-100 text-orange-800',
  };

  const meetingTypeIcons = {
    'In-Person': <Users className="w-4 h-4" />,
    'Virtual': <Video className="w-4 h-4" />,
    'Phone Call': <Phone className="w-4 h-4" />,
  };

  if (!user || !parentProfile) {
    return (
      <div className="text-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Parent-Teacher Conferences</h1>
        <p className="text-gray-600 mt-1">Book and manage conferences with your child's teachers</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Upcoming</p>
                <p className="text-2xl font-bold text-blue-600">{upcomingConferences.length}</p>
              </div>
              <Calendar className="w-8 h-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Confirmed</p>
                <p className="text-2xl font-bold text-green-600">
                  {conferences.filter(c => c.status === 'Confirmed').length}
                </p>
              </div>
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Completed</p>
                <p className="text-2xl font-bold text-gray-600">
                  {conferences.filter(c => c.status === 'Completed').length}
                </p>
              </div>
              <Users className="w-8 h-8 text-gray-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="book" className="space-y-4">
        <TabsList>
          <TabsTrigger value="book">Book New</TabsTrigger>
          <TabsTrigger value="upcoming">Upcoming ({upcomingConferences.length})</TabsTrigger>
          <TabsTrigger value="past">Past Conferences</TabsTrigger>
        </TabsList>

        <TabsContent value="book">
          <ParentBookingView
            parentId={parentProfile.id}
            parentName={`${parentProfile.first_name} ${parentProfile.last_name}`}
            parentEmail={user.email}
            students={students}
          />
        </TabsContent>

        <TabsContent value="upcoming">
          <Card>
            <CardHeader>
              <CardTitle>Upcoming Conferences</CardTitle>
            </CardHeader>
            <CardContent>
              {upcomingConferences.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <Calendar className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                  <p>No upcoming conferences</p>
                  <p className="text-sm">Book a new conference from the "Book New" tab</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {upcomingConferences.map(conf => (
                    <div key={conf.id} className="p-4 border rounded-xl hover:bg-gray-50 transition-colors">
                      <div className="flex items-start justify-between">
                        <div className="flex gap-4">
                          <div className="text-center bg-blue-50 px-3 py-2 rounded-lg min-w-[60px]">
                            <p className="text-xs text-blue-600">{format(new Date(conf.scheduled_date), 'EEE')}</p>
                            <p className="text-xl font-bold text-blue-700">{format(new Date(conf.scheduled_date), 'd')}</p>
                            <p className="text-xs text-blue-600">{format(new Date(conf.scheduled_date), 'MMM')}</p>
                          </div>
                          <div>
                            <div className="flex items-center gap-2 mb-1">
                              <p className="font-semibold text-gray-900">{conf.teacher_name}</p>
                              <Badge className={statusColors[conf.status]}>{conf.status}</Badge>
                            </div>
                            <p className="text-sm text-gray-600">Student: {conf.student_name}</p>
                            <p className="text-sm text-gray-600 flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              {format(new Date(conf.scheduled_date), 'h:mm a')} ({conf.duration_minutes} min)
                            </p>
                            <p className="text-sm text-gray-600 flex items-center gap-1">
                              {meetingTypeIcons[conf.meeting_type]}
                              {conf.meeting_type}
                              {conf.location && ` • ${conf.location}`}
                            </p>
                            {conf.purpose && (
                              <p className="text-sm text-gray-500 mt-1">Purpose: {conf.purpose}</p>
                            )}
                          </div>
                        </div>
                        <div className="flex flex-col gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setSelectedConference(conf)}
                          >
                            Details
                          </Button>
                          {(conf.status === 'Scheduled' || conf.status === 'Confirmed') && (
                            <Button
                              variant="outline"
                              size="sm"
                              className="text-red-600 hover:bg-red-50"
                              onClick={() => cancelMutation.mutate(conf.id)}
                            >
                              Cancel
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="past">
          <Card>
            <CardHeader>
              <CardTitle>Past Conferences</CardTitle>
            </CardHeader>
            <CardContent>
              {pastConferences.length === 0 ? (
                <p className="text-center py-8 text-gray-500">No past conferences</p>
              ) : (
                <div className="space-y-3">
                  {pastConferences.map(conf => (
                    <div key={conf.id} className="p-4 border rounded-lg">
                      <div className="flex justify-between items-start">
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <p className="font-semibold text-gray-900">{conf.teacher_name}</p>
                            <Badge className={statusColors[conf.status]}>{conf.status}</Badge>
                          </div>
                          <p className="text-sm text-gray-600">Student: {conf.student_name}</p>
                          <p className="text-sm text-gray-600">
                            {format(new Date(conf.scheduled_date), 'PPp')}
                          </p>
                        </div>
                        {conf.notes && (
                          <Button variant="outline" size="sm" onClick={() => setSelectedConference(conf)}>
                            View Notes
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Dialog open={!!selectedConference} onOpenChange={() => setSelectedConference(null)}>
        <DialogContent className="bg-white max-w-lg">
          <DialogHeader>
            <DialogTitle>Conference Details</DialogTitle>
          </DialogHeader>
          {selectedConference && (
            <div className="space-y-4">
              <div className="bg-gray-50 p-4 rounded-xl">
                <div className="flex items-center gap-2 mb-2">
                  <Badge className={statusColors[selectedConference.status]}>
                    {selectedConference.status}
                  </Badge>
                </div>
                <p className="font-semibold text-lg">{selectedConference.teacher_name}</p>
                <p className="text-gray-600">Student: {selectedConference.student_name}</p>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-500">Date & Time</p>
                  <p className="font-medium">{format(new Date(selectedConference.scheduled_date), 'PPp')}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Duration</p>
                  <p className="font-medium">{selectedConference.duration_minutes} minutes</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Meeting Type</p>
                  <p className="font-medium flex items-center gap-1">
                    {meetingTypeIcons[selectedConference.meeting_type]}
                    {selectedConference.meeting_type}
                  </p>
                </div>
                {selectedConference.location && (
                  <div>
                    <p className="text-sm text-gray-500">Location</p>
                    <p className="font-medium">{selectedConference.location}</p>
                  </div>
                )}
              </div>

              {selectedConference.purpose && (
                <div>
                  <p className="text-sm text-gray-500">Purpose</p>
                  <p className="text-gray-700">{selectedConference.purpose}</p>
                </div>
              )}

              {selectedConference.notes && (
                <div>
                  <p className="text-sm text-gray-500">Notes</p>
                  <p className="text-gray-700 bg-gray-50 p-3 rounded-lg">{selectedConference.notes}</p>
                </div>
              )}

              {selectedConference.action_items && (
                <div>
                  <p className="text-sm text-gray-500">Action Items</p>
                  <p className="text-gray-700 bg-yellow-50 p-3 rounded-lg">{selectedConference.action_items}</p>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}