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
  const [selectedClass, setSelectedClass] = useState('');
  const [selectedDate, setSelectedDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [attendanceData, setAttendanceData] = useState({});
  const queryClient = useQueryClient();

  const { data: user } = useQuery({
    queryKey: ['current-user'],
    queryFn: () => base44.auth.me(),
  });

  const { data: teachers = [] } = useQuery({
    queryKey: ['teachers', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      return await base44.entities.Teacher.filter({ user_id: user.id });
    },
    enabled: !!user?.id,
  });

  const teacherProfile = teachers[0];

  const { data: allocations = [] } = useQuery({
    queryKey: ['teacher-allocations', teacherProfile?.id],
    queryFn: async () => {
      if (!teacherProfile?.id) return [];
      return await base44.entities.SubjectAllocation.filter({ teacher_id: teacherProfile.id });
    },
    enabled: !!teacherProfile?.id,
  });

  const { data: classes = [] } = useQuery({
    queryKey: ['teacher-classes', allocations],
    queryFn: async () => {
      if (allocations.length === 0) return [];
      const classArmIds = [...new Set(allocations.map(a => a.class_arm_id))];
      const allClassArms = await base44.entities.ClassArm.list();
      return allClassArms.filter(ca => classArmIds.includes(ca.id));
    },
    enabled: allocations.length > 0,
  });

  const { data: students = [] } = useQuery({
    queryKey: ['students'],
    queryFn: () => base44.entities.Student.list(),
  });

  const { data: enrollments = [] } = useQuery({
    queryKey: ['class-enrollments', selectedClass],
    queryFn: async () => {
      if (!selectedClass) return [];
      const selectedClassArm = classes.find(c => c.id === selectedClass);
      if (!selectedClassArm) return [];
      return students.filter(s => s.grade_level === selectedClassArm.grade_level);
    },
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
    enrollments.forEach(student => {
      if (!initialData[student.id]) {
        initialData[student.id] = 'Present';
      }
    });
    setAttendanceData(initialData);
  }, [existingAttendance, enrollments]);

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
    const selectedClassArm = classes.find(c => c.id === selectedClass);
    const records = enrollments.map(student => ({
      student_id: student.id,
      student_name: `${student.first_name} ${student.last_name}`,
      class_id: selectedClass,
      class_name: selectedClassArm ? `${selectedClassArm.grade_level}${selectedClassArm.arm_name}` : '',
      date: selectedDate,
      status: attendanceData[student.id] || 'Present',
    }));

    saveAttendanceMutation.mutate(records);
  };

  const setAllStatus = (status) => {
    const newData = {};
    enrollments.forEach(student => {
      newData[student.id] = status;
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
                    <SelectItem key={c.id} value={c.id}>
                      {c.grade_level}{c.arm_name}
                    </SelectItem>
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
              {enrollments.map((student) => (
                <div key={student.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <span className="font-medium">{student.first_name} {student.last_name}</span>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant={attendanceData[student.id] === 'Present' ? 'default' : 'outline'}
                      onClick={() => setAttendanceData({ ...attendanceData, [student.id]: 'Present' })}
                    >
                      <CheckCircle className="w-4 h-4 mr-1" />
                      Present
                    </Button>
                    <Button
                      size="sm"
                      variant={attendanceData[student.id] === 'Late' ? 'default' : 'outline'}
                      onClick={() => setAttendanceData({ ...attendanceData, [student.id]: 'Late' })}
                    >
                      <Clock className="w-4 h-4 mr-1" />
                      Late
                    </Button>
                    <Button
                      size="sm"
                      variant={attendanceData[student.id] === 'Absent' ? 'default' : 'outline'}
                      onClick={() => setAttendanceData({ ...attendanceData, [student.id]: 'Absent' })}
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