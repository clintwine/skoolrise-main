import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { useSchoolContext } from '@/hooks/useSchoolContext';
import { addSchoolFilter } from '@/utils/schoolFilter';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Calendar, Clock, MapPin, ChevronLeft, ChevronRight, Users } from 'lucide-react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, isToday, addMonths, subMonths } from 'date-fns';

export default function ParentCalendar() {
  const [user, setUser] = useState(null);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedEvent, setSelectedEvent] = useState(null);

  useEffect(() => {
    const fetchUser = async () => {
      const currentUser = await base44.auth.me();
      setUser(currentUser);
    };
    fetchUser();
  }, []);

  const { school_tenant_id, isReady } = useSchoolContext();

  const { data: events = [] } = useQuery({
    queryKey: ['parent-events', school_tenant_id],
    queryFn: async () => {
      const allEvents = await base44.entities.Event.filter(addSchoolFilter({}, school_tenant_id), '-start_date');
      // Filter events visible to parents
      return allEvents.filter(event => 
        event.visible_to_parents !== false && 
        (event.target_audience === 'All' || 
         event.target_audience === 'Parents' ||
         event.target_audience === 'Students')
      );
    },
    enabled: isReady,
  });

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
    'Holiday': 'bg-red-100 text-red-800 border-red-200',
    'Exam': 'bg-blue-100 text-blue-800 border-blue-200',
    'Meeting': 'bg-purple-100 text-purple-800 border-purple-200',
    'Sports Day': 'bg-green-100 text-green-800 border-green-200',
    'Parent-Teacher Conference': 'bg-yellow-100 text-yellow-800 border-yellow-200',
    'Assembly': 'bg-indigo-100 text-indigo-800 border-indigo-200',
    'Field Trip': 'bg-pink-100 text-pink-800 border-pink-200',
    'Club Activity': 'bg-teal-100 text-teal-800 border-teal-200',
    'School Trip': 'bg-orange-100 text-orange-800 border-orange-200',
    'Other': 'bg-gray-100 text-gray-800 border-gray-200',
  };

  const upcomingEvents = events
    .filter(e => new Date(e.start_date) >= new Date())
    .slice(0, 10);

  if (!user) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">School Calendar</h1>
        <p className="text-gray-600 mt-1">View upcoming school events and activities</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Calendar */}
        <div className="lg:col-span-2">
          <Card className="bg-white shadow-md">
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="w-5 h-5" />
                  {format(currentDate, 'MMMM yyyy')}
                </CardTitle>
                <div className="flex gap-2">
                  <Button 
                    variant="outline" 
                    size="icon"
                    onClick={() => setCurrentDate(subMonths(currentDate, 1))}
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </Button>
                  <Button 
                    variant="outline"
                    onClick={() => setCurrentDate(new Date())}
                  >
                    Today
                  </Button>
                  <Button 
                    variant="outline" 
                    size="icon"
                    onClick={() => setCurrentDate(addMonths(currentDate, 1))}
                  >
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-7 gap-1">
                {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                  <div key={day} className="text-center font-semibold text-gray-600 p-2 text-sm">
                    {day}
                  </div>
                ))}
                {Array(monthStart.getDay()).fill(null).map((_, idx) => (
                  <div key={`empty-${idx}`} className="p-2 min-h-[80px]"></div>
                ))}
                {daysInMonth.map((day) => {
                  const dayEvents = getEventsForDay(day);
                  const isCurrentDay = isToday(day);
                  
                  return (
                    <div
                      key={day.toISOString()}
                      className={`p-2 min-h-[80px] border rounded-lg ${
                        isCurrentDay ? 'bg-blue-50 border-blue-300' : 'bg-white border-gray-200'
                      } hover:bg-gray-50 transition-colors`}
                    >
                      <div className={`text-sm font-semibold mb-1 ${
                        isCurrentDay ? 'text-blue-600' : 'text-gray-700'
                      }`}>
                        {format(day, 'd')}
                      </div>
                      <div className="space-y-1">
                        {dayEvents.slice(0, 2).map(event => (
                          <div
                            key={event.id}
                            className={`text-xs p-1 rounded cursor-pointer truncate ${eventTypeColors[event.event_type]}`}
                            onClick={() => setSelectedEvent(event)}
                          >
                            {event.title}
                          </div>
                        ))}
                        {dayEvents.length > 2 && (
                          <div className="text-xs text-gray-500 text-center">
                            +{dayEvents.length - 2} more
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Upcoming Events Sidebar */}
        <div>
          <Card className="bg-white shadow-md">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="w-5 h-5" />
                Upcoming Events
              </CardTitle>
            </CardHeader>
            <CardContent>
              {upcomingEvents.length === 0 ? (
                <p className="text-center text-gray-500 py-8">No upcoming events</p>
              ) : (
                <div className="space-y-3">
                  {upcomingEvents.map(event => (
                    <div 
                      key={event.id} 
                      className="p-3 border rounded-lg hover:bg-gray-50 cursor-pointer transition-colors"
                      onClick={() => setSelectedEvent(event)}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h4 className="font-medium text-gray-900 text-sm">{event.title}</h4>
                          <p className="text-xs text-gray-500 mt-1">
                            {format(new Date(event.start_date), 'MMM d, yyyy')}
                          </p>
                        </div>
                        <Badge className={`${eventTypeColors[event.event_type]} text-xs`}>
                          {event.event_type}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Legend */}
          <Card className="bg-white shadow-md mt-4">
            <CardHeader>
              <CardTitle className="text-sm">Event Types</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-2">
                {Object.entries(eventTypeColors).map(([type, color]) => (
                  <div key={type} className="flex items-center gap-2">
                    <div className={`w-3 h-3 rounded ${color.split(' ')[0]}`}></div>
                    <span className="text-xs text-gray-600">{type}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Event Details Dialog */}
      <Dialog open={!!selectedEvent} onOpenChange={() => setSelectedEvent(null)}>
        <DialogContent className="max-w-lg bg-white">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Calendar className="w-5 h-5 text-blue-600" />
              Event Details
            </DialogTitle>
          </DialogHeader>
          {selectedEvent && (
            <div className="space-y-4">
              <div>
                <h3 className="text-xl font-semibold text-gray-900">{selectedEvent.title}</h3>
                <Badge className={`${eventTypeColors[selectedEvent.event_type]} mt-2`}>
                  {selectedEvent.event_type}
                </Badge>
              </div>

              {selectedEvent.description && (
                <p className="text-gray-600">{selectedEvent.description}</p>
              )}

              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2 text-gray-600">
                  <Clock className="w-4 h-4" />
                  <span>
                    {format(new Date(selectedEvent.start_date), 'EEEE, MMMM d, yyyy')}
                    {' at '}
                    {format(new Date(selectedEvent.start_date), 'h:mm a')}
                  </span>
                </div>
                
                {selectedEvent.end_date && (
                  <div className="flex items-center gap-2 text-gray-600">
                    <Clock className="w-4 h-4" />
                    <span>
                      Ends: {format(new Date(selectedEvent.end_date), 'h:mm a')}
                    </span>
                  </div>
                )}

                {selectedEvent.location && (
                  <div className="flex items-center gap-2 text-gray-600">
                    <MapPin className="w-4 h-4" />
                    <span>{selectedEvent.location}</span>
                  </div>
                )}

                <div className="flex items-center gap-2 text-gray-600">
                  <Users className="w-4 h-4" />
                  <span>For: {selectedEvent.target_audience}</span>
                </div>
              </div>

              <div className="pt-4 border-t">
                <Button 
                  onClick={() => setSelectedEvent(null)}
                  className="w-full"
                  variant="outline"
                >
                  Close
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}