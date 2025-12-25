import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar, CheckCircle, XCircle, Clock, AlertCircle } from 'lucide-react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval } from 'date-fns';

export default function ParentAttendance() {
  const [user, setUser] = useState(null);
  const [studentIds, setStudentIds] = useState([]);
  const [selectedStudent, setSelectedStudent] = useState('');
  const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().substring(0, 7));

  useEffect(() => {
    const fetchUser = async () => {
      const currentUser = await base44.auth.me();
      setUser(currentUser);
      if (currentUser.parent_of_student_ids) {
        const ids = currentUser.parent_of_student_ids.split(',').map(id => id.trim());
        setStudentIds(ids);
        if (ids.length > 0) setSelectedStudent(ids[0]);
      }
    };
    fetchUser();
  }, []);

  const { data: students = [] } = useQuery({
    queryKey: ['parent-students', studentIds],
    queryFn: async () => {
      if (studentIds.length === 0) return [];
      const allStudents = await base44.entities.Student.list();
      return allStudents.filter(s => studentIds.includes(s.id));
    },
    enabled: studentIds.length > 0,
  });

  const { data: attendance = [] } = useQuery({
    queryKey: ['attendance', selectedStudent, selectedMonth],
    queryFn: async () => {
      if (!selectedStudent) return [];
      const allAttendance = await base44.entities.Attendance.list();
      return allAttendance.filter(a => 
        a.student_id === selectedStudent &&
        a.date.startsWith(selectedMonth)
      );
    },
    enabled: !!selectedStudent,
  });

  if (!user) {
    return (
      <div className="text-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
      </div>
    );
  }

  const monthStart = startOfMonth(new Date(selectedMonth + '-01'));
  const monthEnd = endOfMonth(monthStart);
  const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd });

  const attendanceMap = {};
  attendance.forEach(a => {
    attendanceMap[a.date] = a.status;
  });

  const present = attendance.filter(a => a.status === 'Present').length;
  const absent = attendance.filter(a => a.status === 'Absent').length;
  const late = attendance.filter(a => a.status === 'Late').length;
  const excused = attendance.filter(a => a.status === 'Excused').length;
  const attendanceRate = attendance.length > 0 ? ((present / attendance.length) * 100).toFixed(1) : 0;

  const statusIcons = {
    Present: <CheckCircle className="w-5 h-5 text-green-600" />,
    Absent: <XCircle className="w-5 h-5 text-red-600" />,
    Late: <Clock className="w-5 h-5 text-orange-600" />,
    Excused: <AlertCircle className="w-5 h-5 text-blue-600" />,
  };

  const statusColors = {
    Present: 'bg-green-100 text-green-800',
    Absent: 'bg-red-100 text-red-800',
    Late: 'bg-orange-100 text-orange-800',
    Excused: 'bg-blue-100 text-blue-800',
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Attendance Records</h1>
        <p className="text-gray-600 mt-1">View your child's attendance history</p>
      </div>

      <div className="flex gap-4">
        <Select value={selectedStudent} onValueChange={setSelectedStudent}>
          <SelectTrigger className="w-64">
            <SelectValue placeholder="Select student" />
          </SelectTrigger>
          <SelectContent>
            {students.map(student => (
              <SelectItem key={student.id} value={student.id}>
                {student.first_name} {student.last_name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <input
          type="month"
          value={selectedMonth}
          onChange={(e) => setSelectedMonth(e.target.value)}
          className="px-4 py-2 border rounded-lg"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card className="bg-white shadow-md">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Attendance Rate</p>
                <p className="text-3xl font-bold text-blue-600">{attendanceRate}%</p>
              </div>
              <Calendar className="w-8 h-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>
        <Card className="bg-white shadow-md">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Present</p>
                <p className="text-3xl font-bold text-green-600">{present}</p>
              </div>
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
          </CardContent>
        </Card>
        <Card className="bg-white shadow-md">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Absent</p>
                <p className="text-3xl font-bold text-red-600">{absent}</p>
              </div>
              <XCircle className="w-8 h-8 text-red-600" />
            </div>
          </CardContent>
        </Card>
        <Card className="bg-white shadow-md">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Late</p>
                <p className="text-3xl font-bold text-orange-600">{late}</p>
              </div>
              <Clock className="w-8 h-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>
        <Card className="bg-white shadow-md">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Excused</p>
                <p className="text-3xl font-bold text-blue-600">{excused}</p>
              </div>
              <AlertCircle className="w-8 h-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="bg-white shadow-md">
        <CardHeader>
          <CardTitle>Attendance Calendar - {format(monthStart, 'MMMM yyyy')}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-7 gap-2">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
              <div key={day} className="text-center font-semibold text-gray-700 text-sm p-2">
                {day}
              </div>
            ))}
            {Array(monthStart.getDay()).fill(null).map((_, idx) => (
              <div key={`empty-${idx}`} className="p-2"></div>
            ))}
            {daysInMonth.map((day) => {
              const dateStr = format(day, 'yyyy-MM-dd');
              const status = attendanceMap[dateStr];
              const isWeekend = day.getDay() === 0 || day.getDay() === 6;
              
              return (
                <div
                  key={dateStr}
                  className={`p-3 border rounded-lg text-center ${
                    status
                      ? status === 'Present'
                        ? 'bg-green-50 border-green-300'
                        : status === 'Absent'
                        ? 'bg-red-50 border-red-300'
                        : status === 'Late'
                        ? 'bg-orange-50 border-orange-300'
                        : 'bg-blue-50 border-blue-300'
                      : isWeekend
                      ? 'bg-gray-100'
                      : 'bg-white'
                  }`}
                >
                  <p className="text-sm font-medium">{format(day, 'd')}</p>
                  {status && (
                    <div className="mt-1 flex justify-center">
                      {statusIcons[status]}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      <Card className="bg-white shadow-md">
        <CardHeader>
          <CardTitle>Detailed Records</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {attendance.map((record) => (
              <div key={record.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-3">
                  {statusIcons[record.status]}
                  <div>
                    <p className="font-medium">{format(new Date(record.date), 'MMMM d, yyyy')}</p>
                    {record.class_name && (
                      <p className="text-sm text-gray-600">{record.class_name}</p>
                    )}
                  </div>
                </div>
                <Badge className={statusColors[record.status]}>{record.status}</Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}