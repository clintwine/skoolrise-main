import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Calendar, CheckCircle, XCircle, Clock, Users, UserCircle } from 'lucide-react';

export default function AttendanceManagement() {
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedClass, setSelectedClass] = useState('');
  const [isMarkingOpen, setIsMarkingOpen] = useState(false);
  const [studentAttendance, setStudentAttendance] = useState({});
  const queryClient = useQueryClient();

  const { data: classes = [] } = useQuery({
    queryKey: ['classes'],
    queryFn: () => base44.entities.Class.list(),
  });

  const { data: enrollments = [] } = useQuery({
    queryKey: ['enrollments', selectedClass],
    queryFn: async () => {
      const allEnrollments = await base44.entities.Enrollment.list();
      return selectedClass ? allEnrollments.filter(e => e.class_id === selectedClass) : allEnrollments;
    },
    enabled: !!selectedClass,
  });

  const { data: students = [] } = useQuery({
    queryKey: ['students'],
    queryFn: () => base44.entities.Student.list(),
  });

  const { data: attendance = [] } = useQuery({
    queryKey: ['attendance', selectedDate, selectedClass],
    queryFn: async () => {
      const allAttendance = await base44.entities.Attendance.list();
      return allAttendance.filter(a => 
        a.date === selectedDate && 
        (selectedClass ? a.class_id === selectedClass : true)
      );
    },
  });

  const markAttendanceMutation = useMutation({
    mutationFn: async (attendanceData) => {
      return await base44.entities.Attendance.bulkCreate(attendanceData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['attendance'] });
      setIsMarkingOpen(false);
      setStudentAttendance({});
    },
  });

  const enrolledStudents = students.filter(s => 
    enrollments.some(e => e.student_id === s.id)
  );

  React.useEffect(() => {
    if (selectedClass && enrolledStudents.length > 0) {
      const initial = {};
      enrolledStudents.forEach(student => {
        const existing = attendance.find(a => a.student_id === student.id);
        initial[student.id] = existing?.status || 'Present';
      });
      setStudentAttendance(initial);
    }
  }, [selectedClass, enrolledStudents.length, attendance.length]);

  const handleSaveAttendance = () => {
    const attendanceRecords = Object.entries(studentAttendance).map(([studentId, status]) => {
      const student = students.find(s => s.id === studentId);
      const selectedClassObj = classes.find(c => c.id === selectedClass);
      return {
        student_id: studentId,
        student_name: `${student?.first_name} ${student?.last_name}`,
        class_id: selectedClass,
        class_name: selectedClassObj?.class_name,
        date: selectedDate,
        status: status,
        type: 'Lesson',
      };
    });
    markAttendanceMutation.mutate(attendanceRecords);
  };

  // Calculate stats
  const presentCount = attendance.filter(a => a.status === 'Present').length;
  const absentCount = attendance.filter(a => a.status === 'Absent').length;
  const lateCount = attendance.filter(a => a.status === 'Late').length;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Attendance Management</h1>
          <p className="text-gray-600 mt-1">Track and manage student attendance</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Present</p>
                <p className="text-2xl font-bold text-green-600">{presentCount}</p>
              </div>
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Absent</p>
                <p className="text-2xl font-bold text-red-600">{absentCount}</p>
              </div>
              <XCircle className="w-8 h-8 text-red-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Late</p>
                <p className="text-2xl font-bold text-yellow-600">{lateCount}</p>
              </div>
              <Clock className="w-8 h-8 text-yellow-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total</p>
                <p className="text-2xl font-bold text-blue-600">{attendance.length}</p>
              </div>
              <Users className="w-8 h-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>Mark Attendance</CardTitle>
            <div className="flex gap-3">
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="px-3 py-2 border rounded-lg"
              />
              <Select value={selectedClass} onValueChange={setSelectedClass}>
                <SelectTrigger className="w-64">
                  <SelectValue placeholder="Select Class" />
                </SelectTrigger>
                <SelectContent>
                  {classes.map((cls) => (
                    <SelectItem key={cls.id} value={cls.id}>
                      {cls.class_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {!selectedClass ? (
            <p className="text-center text-gray-500 py-8">Please select a class to mark attendance</p>
          ) : enrolledStudents.length === 0 ? (
            <p className="text-center text-gray-500 py-8">No students enrolled in this class</p>
          ) : (
            <div className="space-y-4">
              <div className="space-y-3">
                {enrolledStudents.map((student) => {
                  const existing = attendance.find(a => a.student_id === student.id);
                  const currentStatus = studentAttendance[student.id] || existing?.status || 'Present';
                  
                  return (
                    <div key={student.id} className="flex justify-between items-center p-4 bg-gray-50 rounded-lg">
                      <div className="flex items-center gap-3">
                        {student.photo_url ? (
                          <img src={student.photo_url} alt={student.first_name} className="w-10 h-10 rounded-full object-cover" />
                        ) : (
                          <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                            <UserCircle className="w-6 h-6 text-blue-600" />
                          </div>
                        )}
                        <div>
                          <p className="font-medium">{student.first_name} {student.last_name}</p>
                          <p className="text-sm text-gray-600">ID: {student.student_id_number}</p>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant={currentStatus === 'Present' ? 'default' : 'outline'}
                          className={currentStatus === 'Present' ? 'bg-green-600 hover:bg-green-700' : ''}
                          onClick={() => setStudentAttendance({...studentAttendance, [student.id]: 'Present'})}
                        >
                          <CheckCircle className="w-4 h-4 mr-1" />
                          Present
                        </Button>
                        <Button
                          size="sm"
                          variant={currentStatus === 'Absent' ? 'default' : 'outline'}
                          className={currentStatus === 'Absent' ? 'bg-red-600 hover:bg-red-700' : ''}
                          onClick={() => setStudentAttendance({...studentAttendance, [student.id]: 'Absent'})}
                        >
                          <XCircle className="w-4 h-4 mr-1" />
                          Absent
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
              <div className="flex justify-end pt-4 border-t">
                <Button onClick={handleSaveAttendance} className="bg-blue-600 hover:bg-blue-700">
                  Update Attendance Records
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}