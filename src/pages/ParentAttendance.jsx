import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Calendar, CheckCircle, XCircle, Clock, AlertCircle, CalendarDays, TrendingUp } from 'lucide-react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, parseISO, isWithinInterval, startOfDay, endOfDay } from 'date-fns';

export default function ParentAttendance() {
  const [user, setUser] = useState(null);
  const [selectedStudent, setSelectedStudent] = useState('');
  const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().substring(0, 7));
  const [dateRangeMode, setDateRangeMode] = useState('month'); // 'month' | 'custom'
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  useEffect(() => {
    const fetchUser = async () => {
      const currentUser = await base44.auth.me();
      setUser(currentUser);
    };
    fetchUser();
  }, []);

  const { data: parents = [] } = useQuery({
    queryKey: ['parents', user?.id, user?.parent_profile_id],
    queryFn: async () => {
      if (!user?.id) return [];
      if (user.parent_profile_id) {
        const parent = await base44.entities.Parent.get(user.parent_profile_id);
        return parent ? [parent] : [];
      }
      return await base44.entities.Parent.filter({ user_id: user.id });
    },
    enabled: !!user?.id,
  });

  const parentProfile = parents[0];

  // Fetch students linked to this parent via linked_student_ids
  const { data: students = [] } = useQuery({
    queryKey: ['parent-linked-students', parentProfile?.id, parentProfile?.linked_student_ids],
    queryFn: async () => {
      if (!parentProfile?.id) return [];
      if (parentProfile.linked_student_ids) {
        try {
          const studentIds = JSON.parse(parentProfile.linked_student_ids);
          if (Array.isArray(studentIds) && studentIds.length > 0) {
            const allStudents = await base44.entities.Student.list();
            return allStudents.filter(s => studentIds.includes(s.id));
          }
        } catch (e) {}
      }
      return await base44.entities.Student.filter({ parent_id: parentProfile.id });
    },
    enabled: !!parentProfile?.id,
  });

  useEffect(() => {
    if (students.length > 0 && !selectedStudent) {
      setSelectedStudent(students[0].id);
    }
  }, [students, selectedStudent]);

  const { data: allAttendance = [] } = useQuery({
    queryKey: ['attendance', selectedStudent],
    queryFn: async () => {
      if (!selectedStudent) return [];
      return await base44.entities.Attendance.filter({ student_id: selectedStudent });
    },
    enabled: !!selectedStudent,
  });

  // Filter attendance based on selected date range
  const attendance = React.useMemo(() => {
    if (dateRangeMode === 'month') {
      return allAttendance.filter(a => a.date?.startsWith(selectedMonth));
    } else if (startDate && endDate) {
      const start = startOfDay(parseISO(startDate));
      const end = endOfDay(parseISO(endDate));
      return allAttendance.filter(a => {
        if (!a.date) return false;
        const recordDate = parseISO(a.date);
        return isWithinInterval(recordDate, { start, end });
      });
    }
    return allAttendance;
  }, [allAttendance, dateRangeMode, selectedMonth, startDate, endDate]);

  if (!user) {
    return (
      <div className="text-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
      </div>
    );
  }

  if (students.length === 0) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold text-gray-900">Attendance Records</h1>
        <Card>
          <CardContent className="p-12 text-center">
            <Calendar className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">No students linked to your account</p>
          </CardContent>
        </Card>
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

      <Card className="bg-white shadow-md">
        <CardContent className="p-4">
          <div className="flex flex-wrap gap-4 items-end">
            <div>
              <Label className="text-xs text-gray-500">Select Student</Label>
              <Select value={selectedStudent} onValueChange={setSelectedStudent}>
                <SelectTrigger className="w-64 mt-1">
                  <SelectValue placeholder="Select student" />
                </SelectTrigger>
                <SelectContent>
                  {students.map(s => (
                    <SelectItem key={s.id} value={s.id}>
                      {s.first_name} {s.last_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="text-xs text-gray-500">Date Range</Label>
              <Select value={dateRangeMode} onValueChange={(v) => setDateRangeMode(v)}>
                <SelectTrigger className="w-40 mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="month">By Month</SelectItem>
                  <SelectItem value="custom">Custom Range</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {dateRangeMode === 'month' ? (
              <div>
                <Label className="text-xs text-gray-500">Month</Label>
                <input
                  type="month"
                  value={selectedMonth}
                  onChange={(e) => setSelectedMonth(e.target.value)}
                  className="px-4 py-2 border rounded-lg mt-1 h-10"
                />
              </div>
            ) : (
              <>
                <div>
                  <Label className="text-xs text-gray-500">Start Date</Label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="px-4 py-2 border rounded-lg mt-1 h-10"
                  />
                </div>
                <div>
                  <Label className="text-xs text-gray-500">End Date</Label>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="px-4 py-2 border rounded-lg mt-1 h-10"
                  />
                </div>
              </>
            )}
          </div>
        </CardContent>
      </Card>

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

      {dateRangeMode === 'month' && (
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
      )}

      <Card className="bg-white shadow-md">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CalendarDays className="w-5 h-5" />
            Detailed Records
          </CardTitle>
        </CardHeader>
        <CardContent>
          {attendance.length === 0 ? (
            <p className="text-center text-gray-500 py-8">No attendance records for the selected period</p>
          ) : (
            <div className="space-y-2">
              {attendance.sort((a, b) => new Date(b.date) - new Date(a.date)).map((record) => (
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
          )}
        </CardContent>
      </Card>
    </div>
  );
}