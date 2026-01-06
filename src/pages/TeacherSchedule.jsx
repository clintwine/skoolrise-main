import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Calendar as CalendarIcon, Clock, ChevronLeft, ChevronRight,
  MapPin, BookOpen, Users
} from 'lucide-react';
import { format, startOfWeek, endOfWeek, addWeeks, subWeeks, addDays, isSameDay, startOfDay } from 'date-fns';
import { motion } from 'framer-motion';

export default function TeacherSchedule() {
  const [currentWeek, setCurrentWeek] = useState(new Date());
  const [viewMode, setViewMode] = useState('weekly');

  const { data: user } = useQuery({
    queryKey: ['current-user'],
    queryFn: () => base44.auth.me(),
  });
  console.log('🔵 TeacherSchedule - User:', user);

  const { data: teachers = [] } = useQuery({
    queryKey: ['teachers', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      console.log('🔵 TeacherSchedule - Querying Teachers with user_id:', user.id);
      const result = await base44.entities.Teacher.filter({ user_id: user.id });
      console.log('🔵 TeacherSchedule - Teachers found:', result);
      
      // Also check all teachers to see what user_ids exist
      const allTeachers = await base44.entities.Teacher.list();
      console.log('🔵 TeacherSchedule - ALL Teachers in system:', allTeachers);
      console.log('🔵 TeacherSchedule - ALL Teacher user_ids:', allTeachers.map(t => ({ id: t.id, user_id: t.user_id, name: `${t.first_name} ${t.last_name}` })));
      
      return result;
    },
    enabled: !!user?.id,
  });

  const teacherProfile = teachers[0];
  console.log('🔵 TeacherSchedule - Teacher Profile:', teacherProfile);

  const { data: timetable = [] } = useQuery({
    queryKey: ['teacher-timetable', teacherProfile?.id],
    queryFn: async () => {
      if (!teacherProfile?.id) {
        console.log('🔵 TeacherSchedule - No teacher ID, skipping timetable fetch');
        return [];
      }
      const result = await base44.entities.Timetable.filter({ teacher_id: teacherProfile.id });
      console.log('🔵 TeacherSchedule - Timetable data:', result);
      return result;
    },
    enabled: !!teacherProfile?.id,
  });

  const weekStart = startOfWeek(currentWeek, { weekStartsOn: 1 });
  const weekEnd = endOfWeek(currentWeek, { weekStartsOn: 1 });
  const today = startOfDay(new Date());

  const daysOfWeek = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
  const weekDays = daysOfWeek.map((day, idx) => ({
    name: day,
    date: addDays(weekStart, idx),
  }));

  const getClassesForDay = (dayName) => {
    return timetable
      .filter(slot => slot.day_of_week === dayName)
      .sort((a, b) => {
        const timeA = a.start_time.split(':').map(Number);
        const timeB = b.start_time.split(':').map(Number);
        return timeA[0] * 60 + timeA[1] - (timeB[0] * 60 + timeB[1]);
      });
  };

  const getTodayClasses = () => {
    const todayName = format(today, 'EEEE');
    return getClassesForDay(todayName);
  };

  const goToToday = () => {
    setCurrentWeek(new Date());
  };

  const previousWeek = () => {
    setCurrentWeek(subWeeks(currentWeek, 1));
  };

  const nextWeek = () => {
    setCurrentWeek(addWeeks(currentWeek, 1));
  };

  const timeSlotColors = [
    'bg-blue-100 border-blue-300',
    'bg-purple-100 border-purple-300',
    'bg-green-100 border-green-300',
    'bg-orange-100 border-orange-300',
    'bg-pink-100 border-pink-300',
    'bg-indigo-100 border-indigo-300',
  ];

  if (!user || !teacherProfile) {
    return <div className="text-center py-12"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-accent mx-auto"></div></div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold text-text">My Schedule</h1>
          <p className="text-text-secondary mt-2">View your teaching timetable</p>
        </div>
        
        <div className="flex items-center gap-3">
          <Button variant="outline" onClick={previousWeek}>
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <Button variant="outline" onClick={goToToday}>
            Today
          </Button>
          <Button variant="outline" onClick={nextWeek}>
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
      </div>

      <Card className="bg-white rounded-xl shadow-md">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-2xl">
              {format(weekStart, 'MMM d')} - {format(weekEnd, 'MMM d, yyyy')}
            </CardTitle>
            <Tabs value={viewMode} onValueChange={setViewMode}>
              <TabsList>
                <TabsTrigger value="weekly">Weekly</TabsTrigger>
                <TabsTrigger value="daily">Daily</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
        </CardHeader>
        <CardContent>
          {viewMode === 'weekly' ? (
            <div className="overflow-x-auto">
              <div className="grid grid-cols-7 gap-4 min-w-[1000px]">
                {weekDays.map((day, idx) => {
                  const classes = getClassesForDay(day.name);
                  const isToday = isSameDay(day.date, today);
                  
                  return (
                    <motion.div
                      key={day.name}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: idx * 0.05 }}
                      className={`rounded-xl border-2 overflow-hidden ${
                        isToday ? 'border-accent bg-accent/5' : 'border-gray-200'
                      }`}
                    >
                      <div className={`p-3 text-center ${
                        isToday ? 'bg-accent text-white' : 'bg-gray-50'
                      }`}>
                        <p className="font-bold text-sm">{day.name}</p>
                        <p className="text-xs opacity-90">{format(day.date, 'MMM d')}</p>
                      </div>
                      
                      <div className="p-2 space-y-2">
                        {classes.length === 0 ? (
                          <div className="py-8 text-center">
                            <CalendarIcon className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                            <p className="text-xs text-gray-400">No classes</p>
                          </div>
                        ) : (
                          classes.map((slot, slotIdx) => (
                            <div
                              key={slot.id}
                              className={`p-3 rounded-lg border-l-4 ${timeSlotColors[slotIdx % timeSlotColors.length]} transition-all hover:scale-105 cursor-pointer`}
                            >
                              <div className="flex items-center gap-1 mb-1">
                                <Clock className="w-3 h-3" />
                                <p className="text-xs font-bold">
                                  {slot.start_time} - {slot.end_time}
                                </p>
                              </div>
                              <p className="text-sm font-semibold text-gray-900 mb-1">{slot.subject}</p>
                              <div className="space-y-1">
                                <div className="flex items-center gap-1">
                                  <Users className="w-3 h-3 text-gray-600" />
                                  <p className="text-xs text-gray-600">{slot.class_arm_name}</p>
                                </div>
                                {slot.room && (
                                  <div className="flex items-center gap-1">
                                    <MapPin className="w-3 h-3 text-gray-600" />
                                    <p className="text-xs text-gray-600">{slot.room}</p>
                                  </div>
                                )}
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              {daysOfWeek.map((dayName, idx) => {
                const classes = getClassesForDay(dayName);
                const dayDate = addDays(weekStart, idx);
                const isToday = isSameDay(dayDate, today);
                
                return (
                  <motion.div
                    key={dayName}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.05 }}
                  >
                    <Card className={`${isToday ? 'border-2 border-accent' : ''}`}>
                      <CardHeader className={`py-3 ${isToday ? 'bg-accent/10' : 'bg-gray-50'}`}>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <CalendarIcon className="w-5 h-5 text-gray-600" />
                            <div>
                              <p className="font-bold text-text">{dayName}</p>
                              <p className="text-sm text-text-secondary">{format(dayDate, 'MMM d, yyyy')}</p>
                            </div>
                          </div>
                          {isToday && <Badge className="bg-accent">Today</Badge>}
                        </div>
                      </CardHeader>
                      <CardContent className="pt-4">
                        {classes.length === 0 ? (
                          <div className="py-8 text-center">
                            <CalendarIcon className="w-12 h-12 text-gray-300 mx-auto mb-2" />
                            <p className="text-sm text-gray-400">No classes scheduled</p>
                          </div>
                        ) : (
                          <div className="space-y-3">
                            {classes.map((slot, slotIdx) => (
                              <div
                                key={slot.id}
                                className={`p-4 rounded-xl border-l-4 ${timeSlotColors[slotIdx % timeSlotColors.length]} transition-all hover:shadow-md`}
                              >
                                <div className="flex items-start justify-between mb-2">
                                  <div>
                                    <p className="text-lg font-bold text-gray-900">{slot.subject}</p>
                                    <p className="text-sm text-gray-600">{slot.class_arm_name}</p>
                                  </div>
                                  <Badge variant="outline" className="text-xs">
                                    Period {slot.period_number}
                                  </Badge>
                                </div>
                                
                                <div className="flex items-center gap-4 text-sm">
                                  <div className="flex items-center gap-1 text-gray-700">
                                    <Clock className="w-4 h-4" />
                                    <span className="font-medium">{slot.start_time} - {slot.end_time}</span>
                                  </div>
                                  {slot.room && (
                                    <div className="flex items-center gap-1 text-gray-700">
                                      <MapPin className="w-4 h-4" />
                                      <span>{slot.room}</span>
                                    </div>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  </motion.div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}