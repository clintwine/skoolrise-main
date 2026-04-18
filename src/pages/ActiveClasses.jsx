import React from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { useSchoolContext } from '@/hooks/useSchoolContext';
import { addSchoolFilter } from '@/utils/schoolFilter';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Clock, Users, MapPin, BookOpen } from 'lucide-react';
import { format } from 'date-fns';

export default function ActiveClasses() {
  const currentDay = format(new Date(), 'EEEE');
  const currentTime = format(new Date(), 'HH:mm');
  const { school_tenant_id, isReady } = useSchoolContext();

  const { data: timetable = [], isLoading } = useQuery({
    queryKey: ['timetable', school_tenant_id],
    queryFn: () => base44.entities.Timetable.filter(addSchoolFilter({}, school_tenant_id)),
    enabled: isReady,
  });

  const { data: classArms = [] } = useQuery({
    queryKey: ['class-arms', school_tenant_id],
    queryFn: () => base44.entities.ClassArm.filter(addSchoolFilter({}, school_tenant_id)),
    enabled: isReady,
  });

  // Filter classes happening right now based on day and time
  const activeClasses = timetable.filter(slot => {
    if (slot.day_of_week !== currentDay) return false;
    
    const startTime = slot.start_time;
    const endTime = slot.end_time;
    
    return currentTime >= startTime && currentTime <= endTime;
  });

  // Also get upcoming classes for today (within next 2 hours)
  const upcomingClasses = timetable.filter(slot => {
    if (slot.day_of_week !== currentDay) return false;
    
    const startTime = slot.start_time;
    const [currentHour, currentMin] = currentTime.split(':').map(Number);
    const [startHour, startMin] = startTime.split(':').map(Number);
    
    const currentMinutes = currentHour * 60 + currentMin;
    const startMinutes = startHour * 60 + startMin;
    
    // Show classes starting within the next 2 hours
    return startMinutes > currentMinutes && startMinutes <= currentMinutes + 120;
  }).slice(0, 5);

  const getClassArmName = (classArmId) => {
    const arm = classArms.find(c => c.id === classArmId);
    return arm ? `${arm.grade_level} - ${arm.arm_name}` : 'Unknown Class';
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Active Classes</h1>
        <p className="text-gray-600 mt-1">
          Classes currently in session - {currentDay}, {format(new Date(), 'h:mm a')}
        </p>
      </div>

      {/* Currently Active */}
      <div>
        <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-green-500 animate-pulse"></div>
          Currently In Session ({activeClasses.length})
        </h2>
        
        {activeClasses.length === 0 ? (
          <Card className="bg-white">
            <CardContent className="p-12 text-center">
              <BookOpen className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-600">No classes currently in session</p>
              <p className="text-sm text-gray-500 mt-2">Check back during school hours</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {activeClasses.map((slot) => (
              <Card key={slot.id} className="bg-white border-l-4 border-l-green-500 hover:shadow-lg transition-shadow">
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">{slot.subject}</CardTitle>
                    <Badge className="bg-green-100 text-green-800">Live</Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center gap-2 text-gray-600">
                      <Users className="w-4 h-4" />
                      <span>{slot.class_arm_name || getClassArmName(slot.class_arm_id)}</span>
                    </div>
                    <div className="flex items-center gap-2 text-gray-600">
                      <Clock className="w-4 h-4" />
                      <span>{slot.start_time} - {slot.end_time}</span>
                    </div>
                    {slot.room && (
                      <div className="flex items-center gap-2 text-gray-600">
                        <MapPin className="w-4 h-4" />
                        <span>Room {slot.room}</span>
                      </div>
                    )}
                    {slot.teacher_name && (
                      <p className="text-gray-700 font-medium mt-2">{slot.teacher_name}</p>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Upcoming Classes */}
      {upcomingClasses.length > 0 && (
        <div>
          <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Clock className="w-5 h-5 text-blue-600" />
            Coming Up Next
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {upcomingClasses.map((slot) => (
              <Card key={slot.id} className="bg-white border-l-4 border-l-blue-500 hover:shadow-lg transition-shadow">
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">{slot.subject}</CardTitle>
                    <Badge className="bg-blue-100 text-blue-800">Upcoming</Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center gap-2 text-gray-600">
                      <Users className="w-4 h-4" />
                      <span>{slot.class_arm_name || getClassArmName(slot.class_arm_id)}</span>
                    </div>
                    <div className="flex items-center gap-2 text-gray-600">
                      <Clock className="w-4 h-4" />
                      <span>{slot.start_time} - {slot.end_time}</span>
                    </div>
                    {slot.room && (
                      <div className="flex items-center gap-2 text-gray-600">
                        <MapPin className="w-4 h-4" />
                        <span>Room {slot.room}</span>
                      </div>
                    )}
                    {slot.teacher_name && (
                      <p className="text-gray-700 font-medium mt-2">{slot.teacher_name}</p>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}