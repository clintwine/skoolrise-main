import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useSchoolContext } from '@/hooks/useSchoolContext';
import { addSchoolFilter, withSchoolId } from '@/utils/schoolFilter';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Calendar, Plus, Edit, Bell, X, ChevronLeft, ChevronRight } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, isToday } from 'date-fns';
import useIsMobile from '../components/hooks/useIsMobile';
import MobileHeader from '../components/mobile/MobileHeader';
import MobileTable, { MobileTableRow } from '../components/mobile/MobileTable';
import MobileDialog from '../components/mobile/MobileDialog';
import { MobileInput, MobileSelect, MobileTextarea, MobileFormActions } from '../components/mobile/MobileForm';

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

  const { school_tenant_id, isReady } = useSchoolContext();

  const { data: events = [] } = useQuery({
    queryKey: ['events', school_tenant_id],
    queryFn: () => base44.entities.Event.filter(addSchoolFilter({}, school_tenant_id), '-start_date'),
    enabled: isReady,
  });

  const { data: classes = [] } = useQuery({
    queryKey: ['classes', school_tenant_id],
    queryFn: () => base44.entities.Class.filter(addSchoolFilter({}, school_tenant_id)),
    enabled: isReady,
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.Event.create(withSchoolId(data, school_tenant_id)),
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

  const isMobile = useIsMobile();
  const upcomingEvents = events.filter(e => new Date(e.start_date) >= new Date()).slice(0, 10);

  // Mobile View
  if (isMobile) {
    return (
      <div className="p-4 pb-24">
        <MobileHeader
          title="Events"
          subtitle={format(currentDate, 'MMMM yyyy')}
          onAdd={() => { resetForm(); setIsFormOpen(true); }}
          addLabel="Add"
        />

        {/* Month Navigation */}
        <div className="flex items-center justify-between mb-4 bg-white rounded-lg p-3 shadow-sm gap-2">
          <Button variant="ghost" size="sm" className="shrink-0" onClick={() => setCurrentDate(new Date(currentDate.setMonth(currentDate.getMonth() - 1)))}>
            <ChevronLeft className="w-5 h-5" />
          </Button>
          <span className="font-semibold text-sm text-center flex-1">{format(currentDate, 'MMMM yyyy')}</span>
          <Button variant="ghost" size="sm" className="shrink-0" onClick={() => setCurrentDate(new Date(currentDate.setMonth(currentDate.getMonth() + 1)))}>
            <ChevronRight className="w-5 h-5" />
          </Button>
        </div>

        {/* Upcoming Events List */}
        <h3 className="font-semibold text-gray-900 mb-3">Upcoming Events</h3>
        <MobileTable
          data={upcomingEvents}
          emptyMessage="No upcoming events"
          renderItem={(event) => (
            <MobileTableRow
              key={event.id}
              primary={event.title}
              secondary={event.location || 'No location'}
              tertiary={format(new Date(event.start_date), 'PPP')}
              badge={event.event_type}
              icon={Calendar}
              onClick={() => { setEditingEvent(event); setFormData(event); setIsFormOpen(true); }}
              actions={[
                { label: 'Edit', icon: Edit, onClick: () => { setEditingEvent(event); setFormData(event); setIsFormOpen(true); } },
                { label: 'Delete', icon: X, onClick: () => deleteMutation.mutate(event.id), destructive: true },
              ]}
            />
          )}
        />

        <EventFormDialog
          open={isFormOpen}
          onOpenChange={setIsFormOpen}
          formData={formData}
          setFormData={setFormData}
          onSubmit={handleSubmit}
          editingEvent={editingEvent}
          isMobile={true}
        />
      </div>
    );
  }

  // Desktop View
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

      <EventFormDialog
        open={isFormOpen}
        onOpenChange={setIsFormOpen}
        formData={formData}
        setFormData={setFormData}
        onSubmit={handleSubmit}
        editingEvent={editingEvent}
        isMobile={false}
      />
    </div>
  );
}

function EventFormDialog({ open, onOpenChange, formData, setFormData, onSubmit, editingEvent, isMobile }) {
  const eventTypeOptions = [
    { value: 'Holiday', label: 'Holiday' },
    { value: 'Exam', label: 'Exam' },
    { value: 'Meeting', label: 'Meeting' },
    { value: 'Sports Day', label: 'Sports Day' },
    { value: 'Parent-Teacher Conference', label: 'Parent-Teacher Conference' },
    { value: 'Assembly', label: 'Assembly' },
    { value: 'Field Trip', label: 'Field Trip' },
    { value: 'Other', label: 'Other' },
  ];

  const handleSubmit = (e) => {
    e?.preventDefault?.();
    onSubmit(e);
  };

  if (isMobile) {
    return (
      <MobileDialog open={open} onOpenChange={onOpenChange} title={editingEvent ? 'Edit Event' : 'New Event'}>
        <div className="space-y-4">
          <MobileInput
            label="Event Title"
            required
            value={formData.title}
            onChange={(e) => setFormData({...formData, title: e.target.value})}
          />
          <MobileSelect
            label="Event Type"
            value={formData.event_type}
            onValueChange={(value) => setFormData({...formData, event_type: value})}
            options={eventTypeOptions}
          />
          <MobileInput
            label="Start Date"
            type="datetime-local"
            value={formData.start_date}
            onChange={(e) => setFormData({...formData, start_date: e.target.value})}
          />
          <MobileInput
            label="End Date"
            type="datetime-local"
            value={formData.end_date}
            onChange={(e) => setFormData({...formData, end_date: e.target.value})}
          />
          <MobileInput
            label="Location"
            value={formData.location}
            onChange={(e) => setFormData({...formData, location: e.target.value})}
          />
          <MobileTextarea
            label="Description"
            value={formData.description}
            onChange={(e) => setFormData({...formData, description: e.target.value})}
          />
          <MobileFormActions
            onCancel={() => onOpenChange(false)}
            onSubmit={handleSubmit}
            submitLabel={editingEvent ? 'Update' : 'Create'}
          />
        </div>
      </MobileDialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
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
                  {eventTypeOptions.map(opt => <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>)}
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
                </SelectContent>
              </Select>
            </div>
            <div className="col-span-2">
              <Label>Description</Label>
              <Textarea value={formData.description} onChange={(e) => setFormData({...formData, description: e.target.value})} rows={3} />
            </div>
          </div>
          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button type="submit" className="bg-blue-600 hover:bg-blue-700">
              {editingEvent ? 'Update' : 'Create'} Event
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}