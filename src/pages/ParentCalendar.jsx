import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Calendar, BookOpen, FileText, Award } from 'lucide-react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, isToday, isSameMonth } from 'date-fns';

export default function ParentCalendar() {
  const [user, setUser] = useState(null);
  const [studentIds, setStudentIds] = useState([]);
  const [currentDate, setCurrentDate] = useState(new Date());

  useEffect(() => {
    const fetchUser = async () => {
      const currentUser = await base44.auth.me();
      setUser(currentUser);
      if (currentUser.parent_of_student_ids) {
        const ids = currentUser.parent_of_student_ids.split(',').map(id => id.trim());
        setStudentIds(ids);
      }
    };
    fetchUser();
  }, []);

  const { data: assignments = [] } = useQuery({
    queryKey: ['parent-assignments', studentIds],
    queryFn: async () => {
      if (studentIds.length === 0) return [];
      const allAssignments = await base44.entities.Assignment.list();
      const enrollments = await base44.entities.Enrollment.list();
      const studentClasses = enrollments.filter(e => studentIds.includes(e.student_id)).map(e => e.class_id);
      return allAssignments.filter(a => studentClasses.includes(a.class_id));
    },
    enabled: studentIds.length > 0,
  });

  const { data: events = [] } = useQuery({
    queryKey: ['events'],
    queryFn: () => base44.entities.Event.list(),
  });

  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd });

  const getItemsForDay = (day) => {
    const dayAssignments = assignments.filter(a => isSameDay(new Date(a.due_date), day));
    const dayEvents = events.filter(e => isSameDay(new Date(e.start_date), day));
    return { assignments: dayAssignments, events: dayEvents };
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
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Family Calendar</h1>
        <p className="text-gray-600 mt-1">View all homework, exams, and events</p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>{format(currentDate, 'MMMM yyyy')}</CardTitle>
            <div className="flex gap-2">
              <button
                onClick={() => setCurrentDate(new Date(currentDate.setMonth(currentDate.getMonth() - 1)))}
                className="px-3 py-1 border rounded hover:bg-gray-50"
              >
                Previous
              </button>
              <button
                onClick={() => setCurrentDate(new Date())}
                className="px-3 py-1 border rounded hover:bg-gray-50"
              >
                Today
              </button>
              <button
                onClick={() => setCurrentDate(new Date(currentDate.setMonth(currentDate.getMonth() + 1)))}
                className="px-3 py-1 border rounded hover:bg-gray-50"
              >
                Next
              </button>
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
              const { assignments: dayAssignments, events: dayEvents } = getItemsForDay(day);
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
                    {dayAssignments.map(assignment => (
                      <div key={assignment.id} className="text-xs p-1 rounded bg-blue-100 text-blue-800 flex items-center gap-1">
                        <BookOpen className="w-3 h-3" />
                        <span className="truncate">{assignment.title}</span>
                      </div>
                    ))}
                    {dayEvents.map(event => (
                      <div key={event.id} className="text-xs p-1 rounded bg-purple-100 text-purple-800 flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        <span className="truncate">{event.title}</span>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Upcoming Assignments</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {assignments
                .filter(a => new Date(a.due_date) >= new Date())
                .slice(0, 5)
                .map(assignment => (
                  <div key={assignment.id} className="p-3 border rounded-lg">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <p className="font-semibold text-gray-900">{assignment.title}</p>
                        <p className="text-sm text-gray-600">{assignment.class_name}</p>
                        <p className="text-sm text-gray-500">Due: {format(new Date(assignment.due_date), 'PPP')}</p>
                      </div>
                      <Badge className="bg-blue-100 text-blue-800">{assignment.type}</Badge>
                    </div>
                  </div>
                ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Upcoming Events</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {events
                .filter(e => new Date(e.start_date) >= new Date())
                .slice(0, 5)
                .map(event => (
                  <div key={event.id} className="p-3 border rounded-lg">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <p className="font-semibold text-gray-900">{event.title}</p>
                        <p className="text-sm text-gray-500">{format(new Date(event.start_date), 'PPP')}</p>
                        {event.location && <p className="text-sm text-gray-500">{event.location}</p>}
                      </div>
                      <Badge className="bg-purple-100 text-purple-800">{event.event_type}</Badge>
                    </div>
                  </div>
                ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}