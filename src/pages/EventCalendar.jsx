import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Calendar, Plus, Edit, Bell, X } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, isToday } from 'date-fns';

export default function EventCalendar() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    event_type: 'Other',
    start_date: '',
    end_date: '',
    location: '',
    target_audience: 'All',
    visible_to_parents: true,
    visible_to_students: true,
    visible_to_teachers: true,
    reminder_days_before: 1,
  });
  const queryClient = useQueryClient();

  const { data: events = [] } = useQuery({
    queryKey: ['events'],
    queryFn: () => base44.entities.Event.list('-start_date'),
  });

  const { data: classes = [] } = useQuery({
    queryKey: ['classes'],
    queryFn: () => base44.entities.Class.list(),
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.Event.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['events'] });
      setIsFormOpen(false);
      resetForm();
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Event.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['events'] });
      setIsFormOpen(false);
      resetForm();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.Event.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['events'] });
    },
  });

  const sendNotificationMutation = useMutation({
    mutationFn: async (event) => {
      await base44.integrations.Core.SendEmail({
        to: 'admin@school.com',
        subject: `Event Notification: ${event.title}`,
        body: `Event: ${event.title}\nDate: ${format(new Date(event.start_date), 'PPP')}\nLocation: ${event.location || 'TBA'}\n\n${event.description}`,
      });
      await base44.entities.Event.update(event.id, { notification_sent: true });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['events'] });
      alert('Notification sent successfully!');
    },
  });

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      event_type: 'Other',
      start_date: '',
      end_date: '',
      location: '',
      target_audience: 'All',
      visible_to_parents: true,
      visible_to_students: true,
      visible_to_teachers: true,
      reminder_days_before: 1,
    });
    setEditingEvent(null);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (editingEvent) {
      updateMutation.mutate({ id: editingEvent.id, data: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd });

  const getEventsForDay = (day) => {
    return events.filter(event => {
      const eventStart = new Date(event.start_date);
      return isSameDay(eventStart, day);
    });
  };

  const eventTypeColors = {
    'Holiday': 'bg-red-100 text-red-800',
    'Exam': 'bg-blue-100 text-blue-800',
    'Meeting': 'bg-purple-100 text-purple-800',
    'Sports Day': 'bg-green-100 text-green-800',
    'Parent-Teacher Conference': 'bg-yellow-100 text-yellow-800',
    'Assembly': 'bg-indigo-100 text-indigo-800',
    'Field Trip': 'bg-pink-100 text-pink-800',
    'Other': 'bg-gray-100 text-gray-800',
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Event Calendar</h1>
          <p className="text-gray-600 mt-1">Manage school events and activities</p>
        </div>
        <Button onClick={() => { resetForm(); setIsFormOpen(true); }} className="bg-blue-600 hover:bg-blue-700">
          <Plus className="w-4 h-4 mr-2" />
          Add Event
        </Button>
      </div>

      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>{format(currentDate, 'MMMM yyyy')}</CardTitle>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setCurrentDate(new Date(currentDate.setMonth(currentDate.getMonth() - 1)))}>
                Previous
              </Button>
              <Button variant="outline" onClick={() => setCurrentDate(new Date())}>
                Today
              </Button>
              <Button variant="outline" onClick={() => setCurrentDate(new Date(currentDate.setMonth(currentDate.getMonth() + 1)))}>
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
              const dayEvents = getEventsForDay(day);
              return (
                <div
                  key={idx}
                  className={`min-h-[100px] border rounded-lg p-2 ${
                    isToday(day) ? 'bg-blue-50 border-blue-300' : 'bg-white'
                  } ${!isSameMonth(day, currentDate) ? 'opacity-50' : ''}`}
                >
                  <div className="text-sm font-semibold text-gray-700 mb-1">
                    {format(day, 'd')}
                  </div>
                  <div className="space-y-1">
                    {dayEvents.map(event => (
                      <div
                        key={event.id}
                        className={`text-xs p-1 rounded cursor-pointer ${eventTypeColors[event.event_type]}`}
                        onClick={() => {
                          setEditingEvent(event);
                          setFormData(event);
                          setIsFormOpen(true);
                        }}
                      >
                        {event.title}
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Upcoming Events</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {events.filter(e => new Date(e.start_date) >= new Date()).slice(0, 10).map(event => (
              <div key={event.id} className="p-4 border rounded-lg flex justify-between items-start">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <h3 className="font-semibold text-gray-900">{event.title}</h3>
                    <Badge className={eventTypeColors[event.event_type]}>{event.event_type}</Badge>
                    {event.notification_sent && <Badge className="bg-green-100 text-green-800">Notified</Badge>}
                  </div>
                  <p className="text-sm text-gray-600 mb-2">{event.description}</p>
                  <div className="text-sm text-gray-500">
                    <p><Calendar className="w-4 h-4 inline mr-1" />{format(new Date(event.start_date), 'PPP')}</p>
                    {event.location && <p>Location: {event.location}</p>}
                  </div>
                </div>
                <div className="flex gap-2">
                  {!event.notification_sent && (
                    <Button size="sm" variant="outline" onClick={() => sendNotificationMutation.mutate(event)}>
                      <Bell className="w-4 h-4" />
                    </Button>
                  )}
                  <Button size="sm" variant="outline" onClick={() => { setEditingEvent(event); setFormData(event); setIsFormOpen(true); }}>
                    <Edit className="w-4 h-4" />
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => deleteMutation.mutate(event.id)}>
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent className="max-w-2xl bg-white">
          <DialogHeader>
            <DialogTitle>{editingEvent ? 'Edit Event' : 'New Event'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Event Title *</Label>
                <Input value={formData.title} onChange={(e) => setFormData({...formData, title: e.target.value})} required />
              </div>
              <div>
                <Label>Event Type *</Label>
                <Select value={formData.event_type} onValueChange={(value) => setFormData({...formData, event_type: value})}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Holiday">Holiday</SelectItem>
                    <SelectItem value="Exam">Exam</SelectItem>
                    <SelectItem value="Meeting">Meeting</SelectItem>
                    <SelectItem value="Sports Day">Sports Day</SelectItem>
                    <SelectItem value="Parent-Teacher Conference">Parent-Teacher Conference</SelectItem>
                    <SelectItem value="Assembly">Assembly</SelectItem>
                    <SelectItem value="Field Trip">Field Trip</SelectItem>
                    <SelectItem value="Other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Start Date *</Label>
                <Input type="datetime-local" value={formData.start_date} onChange={(e) => setFormData({...formData, start_date: e.target.value})} required />
              </div>
              <div>
                <Label>End Date *</Label>
                <Input type="datetime-local" value={formData.end_date} onChange={(e) => setFormData({...formData, end_date: e.target.value})} required />
              </div>
              <div>
                <Label>Location</Label>
                <Input value={formData.location} onChange={(e) => setFormData({...formData, location: e.target.value})} />
              </div>
              <div>
                <Label>Target Audience</Label>
                <Select value={formData.target_audience} onValueChange={(value) => setFormData({...formData, target_audience: value})}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="All">All</SelectItem>
                    <SelectItem value="Students">Students</SelectItem>
                    <SelectItem value="Parents">Parents</SelectItem>
                    <SelectItem value="Teachers">Teachers</SelectItem>
                    <SelectItem value="Specific Class">Specific Class</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="col-span-2">
                <Label>Description</Label>
                <Textarea value={formData.description} onChange={(e) => setFormData({...formData, description: e.target.value})} rows={3} />
              </div>
              <div className="col-span-2">
                <Label className="mb-2 block">Visibility Settings</Label>
                <div className="flex gap-4">
                  <label className="flex items-center gap-2">
                    <input 
                      type="checkbox" 
                      checked={formData.visible_to_parents} 
                      onChange={(e) => setFormData({...formData, visible_to_parents: e.target.checked})}
                      className="rounded"
                    />
                    <span className="text-sm">Parents</span>
                  </label>
                  <label className="flex items-center gap-2">
                    <input 
                      type="checkbox" 
                      checked={formData.visible_to_students} 
                      onChange={(e) => setFormData({...formData, visible_to_students: e.target.checked})}
                      className="rounded"
                    />
                    <span className="text-sm">Students</span>
                  </label>
                  <label className="flex items-center gap-2">
                    <input 
                      type="checkbox" 
                      checked={formData.visible_to_teachers} 
                      onChange={(e) => setFormData({...formData, visible_to_teachers: e.target.checked})}
                      className="rounded"
                    />
                    <span className="text-sm">Teachers</span>
                  </label>
                </div>
              </div>
            </div>
            <div className="flex justify-end gap-3 pt-4 border-t">
              <Button type="button" variant="outline" onClick={() => setIsFormOpen(false)}>Cancel</Button>
              <Button type="submit" className="bg-blue-600 hover:bg-blue-700">
                {editingEvent ? 'Update' : 'Create'} Event
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}