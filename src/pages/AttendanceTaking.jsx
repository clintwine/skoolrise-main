import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { CheckCircle, XCircle, Clock } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';

export default function AttendanceTaking() {
  const [user, setUser] = useState(null);
  const [selectedClass, setSelectedClass] = useState('');
  const [selectedDate, setSelectedDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [attendanceData, setAttendanceData] = useState({});
  const queryClient = useQueryClient();

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const currentUser = await base44.auth.me();
        setUser(currentUser);
      } catch (error) {
        console.error('Error fetching user:', error);
      }
    };
    fetchUser();
  }, []);

  const { data: teachers = [] } = useQuery({
    queryKey: ['teachers', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      return await base44.entities.Teacher.filter({ user_id: user.id });
    },
    enabled: !!user?.id,
  });

  const teacherProfile = teachers[0];

  const { data: classes = [] } = useQuery({
    queryKey: ['teacher-classes', teacherProfile?.id],
    queryFn: async () => {
      if (!teacherProfile?.id) return [];
      return await base44.entities.Class.filter({ teacher_id: teacherProfile.id });
    },
    enabled: !!teacherProfile?.id,
  });

  const { data: enrollments = [] } = useQuery({
    queryKey: ['class-enrollments', selectedClass],
    queryFn: () => base44.entities.Enrollment.filter({ class_id: selectedClass, status: 'Enrolled' }),
    enabled: !!selectedClass,
  });

  const { data: existingAttendance = [] } = useQuery({
    queryKey: ['attendance', selectedClass, selectedDate],
    queryFn: () => base44.entities.Attendance.filter({ class_id: selectedClass, date: selectedDate }),
    enabled: !!selectedClass && !!selectedDate,
  });

  useEffect(() => {
    const initialData = {};
    existingAttendance.forEach(record => {
      initialData[record.student_id] = record.status;
    });
    setAttendanceData(initialData);
  }, [existingAttendance]);

  const saveAttendanceMutation = useMutation({
    mutationFn: async (records) => {
      const promises = records.map(record => {
        const existing = existingAttendance.find(a => a.student_id === record.student_id);
        if (existing) {
          return base44.entities.Attendance.update(existing.id, { status: record.status });
        } else {
          return base44.entities.Attendance.create(record);
        }
      });
      return Promise.all(promises);
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['attendance']);
      toast.success('Attendance saved successfully');
    },
  });

  const handleSave = () => {
    const records = enrollments.map(enrollment => ({
      student_id: enrollment.student_id,
      student_name: enrollment.student_name,
      class_id: selectedClass,
      class_name: classes.find(c => c.id === selectedClass)?.class_name,
      date: selectedDate,
      status: attendanceData[enrollment.student_id] || 'Present',
    }));

    saveAttendanceMutation.mutate(records);
  };

  const setAllStatus = (status) => {
    const newData = {};
    enrollments.forEach(enrollment => {
      newData[enrollment.student_id] = status;
    });
    setAttendanceData(newData);
  };

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-gray-900">Take Attendance</h1>

      <Card>
        <CardHeader>
          <CardTitle>Select Class and Date</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">Class</label>
              <Select value={selectedClass} onValueChange={setSelectedClass}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a class" />
                </SelectTrigger>
                <SelectContent>
                  {classes.map(c => (
                    <SelectItem key={c.id} value={c.id}>{c.class_name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Date</label>
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="w-full px-3 py-2 border rounded-md"
              />
            </div>
          </div>
          {selectedClass && (
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => setAllStatus('Present')}>
                Mark All Present
              </Button>
              <Button variant="outline" size="sm" onClick={() => setAllStatus('Absent')}>
                Mark All Absent
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {selectedClass && enrollments.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Student Attendance</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {enrollments.map((enrollment) => (
                <div key={enrollment.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <span className="font-medium">{enrollment.student_name}</span>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant={attendanceData[enrollment.student_id] === 'Present' ? 'default' : 'outline'}
                      onClick={() => setAttendanceData({ ...attendanceData, [enrollment.student_id]: 'Present' })}
                    >
                      <CheckCircle className="w-4 h-4 mr-1" />
                      Present
                    </Button>
                    <Button
                      size="sm"
                      variant={attendanceData[enrollment.student_id] === 'Late' ? 'default' : 'outline'}
                      onClick={() => setAttendanceData({ ...attendanceData, [enrollment.student_id]: 'Late' })}
                    >
                      <Clock className="w-4 h-4 mr-1" />
                      Late
                    </Button>
                    <Button
                      size="sm"
                      variant={attendanceData[enrollment.student_id] === 'Absent' ? 'default' : 'outline'}
                      onClick={() => setAttendanceData({ ...attendanceData, [enrollment.student_id]: 'Absent' })}
                    >
                      <XCircle className="w-4 h-4 mr-1" />
                      Absent
                    </Button>
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-6">
              <Button onClick={handleSave} disabled={saveAttendanceMutation.isPending}>
                {saveAttendanceMutation.isPending ? 'Saving...' : 'Save Attendance'}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}