import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  UserCheck, Calendar, CheckCircle, XCircle, Clock, 
  Users, BookOpen, Search, Camera, BarChart3
} from 'lucide-react';
import { format, isWithinInterval, parseISO, startOfDay, endOfDay } from 'date-fns';
import { toast } from 'sonner';
import Scanner from '../components/Scanner';

export default function UnifiedAttendance() {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState('school-arrival');
  const [selectedDate, setSelectedDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [selectedClass, setSelectedClass] = useState('');
  const [selectedSubject, setSelectedSubject] = useState('');
  const [selectedPeriod, setSelectedPeriod] = useState('');
  const [scannerOpen, setScannerOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const { data: classArms = [] } = useQuery({
    queryKey: ['class-arms'],
    queryFn: () => base44.entities.ClassArm.list(),
  });

  const { data: students = [] } = useQuery({
    queryKey: ['students'],
    queryFn: () => base44.entities.Student.list(),
  });

  const { data: timetable = [] } = useQuery({
    queryKey: ['timetable', selectedClass],
    queryFn: async () => {
      if (!selectedClass) return [];
      const all = await base44.entities.Timetable.list();
      return all.filter(t => t.class_arm_id === selectedClass);
    },
    enabled: !!selectedClass,
  });

  const { data: attendance = [] } = useQuery({
    queryKey: ['attendance', selectedDate],
    queryFn: async () => {
      const all = await base44.entities.Attendance.list();
      return all.filter(a => a.date === selectedDate);
    },
  });

  const createAttendanceMutation = useMutation({
    mutationFn: (data) => base44.entities.Attendance.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['attendance'] });
      toast.success('Attendance recorded');
    },
  });

  const updateAttendanceMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Attendance.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['attendance'] });
      toast.success('Attendance updated');
    },
  });

  const handleMarkAttendance = async (studentId, status) => {
    const student = students.find(s => s.id === studentId);
    const existingRecord = attendance.find(a => 
      a.student_id === studentId && 
      a.date === selectedDate &&
      a.attendance_type === activeTab.replace('-', '_')
    );

    const attendanceData = {
      student_id: studentId,
      student_name: student ? `${student.first_name} ${student.last_name}` : '',
      class_id: selectedClass,
      date: selectedDate,
      status: status,
      attendance_type: activeTab.replace('-', '_'),
      subject: selectedSubject || null,
      period_number: selectedPeriod ? parseInt(selectedPeriod) : null,
      time_recorded: new Date().toISOString(),
    };

    if (existingRecord) {
      updateAttendanceMutation.mutate({ id: existingRecord.id, data: { status } });
    } else {
      createAttendanceMutation.mutate(attendanceData);
    }
  };

  const getStudentStatus = (studentId) => {
    const record = attendance.find(a => 
      a.student_id === studentId && 
      a.date === selectedDate &&
      a.attendance_type === activeTab.replace('-', '_')
    );
    return record?.status || null;
  };

  const presentCount = attendance.filter(a => a.status === 'Present' && a.attendance_type === activeTab.replace('-', '_')).length;
  const absentCount = attendance.filter(a => a.status === 'Absent' && a.attendance_type === activeTab.replace('-', '_')).length;
  const lateCount = attendance.filter(a => a.status === 'Late' && a.attendance_type === activeTab.replace('-', '_')).length;
  const totalRecords = attendance.filter(a => a.attendance_type === activeTab.replace('-', '_')).length;

  const filteredStudents = students.filter(s => {
    if (!selectedClass) return true;
    const arm = classArms.find(a => a.id === selectedClass);
    return arm ? s.grade_level === arm.grade_level : false;
  }).filter(s =>
    searchQuery ? 
      `${s.first_name} ${s.last_name}`.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.student_id_number?.includes(searchQuery) : true
  );

  const getInitials = (student) => {
    return `${student.first_name?.charAt(0) || ''}${student.last_name?.charAt(0) || ''}`.toUpperCase();
  };

  const periods = timetable.filter(t => 
    t.day_of_week === format(new Date(selectedDate), 'EEEE')
  ).sort((a, b) => (a.period_number || 0) - (b.period_number || 0));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Attendance Hub</h1>
        <p className="text-gray-600 mt-1">Unified monitoring for School Arrival, Class Registers, and Subject Periods.</p>
      </div>

      {/* Date Picker */}
      <Card className="bg-white shadow-sm border">
        <CardContent className="p-4">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-gray-500" />
            <Label className="text-sm font-medium">Date:</Label>
            <Input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="w-48"
            />
          </div>
        </CardContent>
      </Card>

      {/* Stats Cards */}
      <div className="grid grid-cols-4 gap-4">
        <Card className="bg-white shadow-sm border">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Present</p>
                <p className="text-2xl font-bold text-green-600">{presentCount}</p>
              </div>
              <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
                <CheckCircle className="w-5 h-5 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-white shadow-sm border">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Absent</p>
                <p className="text-2xl font-bold text-red-600">{absentCount}</p>
              </div>
              <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center">
                <XCircle className="w-5 h-5 text-red-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-white shadow-sm border">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Late</p>
                <p className="text-2xl font-bold text-yellow-600">{lateCount}</p>
              </div>
              <div className="w-10 h-10 rounded-full bg-yellow-100 flex items-center justify-center">
                <Clock className="w-5 h-5 text-yellow-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-white shadow-sm border">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Total Records</p>
                <p className="text-2xl font-bold text-blue-600">{totalRecords}</p>
              </div>
              <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                <Users className="w-5 h-5 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="inline-flex bg-gray-100 rounded-full p-1">
          <TabsTrigger value="school-arrival" className="rounded-full data-[state=active]:bg-white data-[state=active]:shadow-sm">
            <UserCheck className="w-4 h-4 mr-2" />
            School Arrival (Bio)
          </TabsTrigger>
          <TabsTrigger value="class-register" className="rounded-full data-[state=active]:bg-white data-[state=active]:shadow-sm">
            <Users className="w-4 h-4 mr-2" />
            Class Register
          </TabsTrigger>
          <TabsTrigger value="subject-period" className="rounded-full data-[state=active]:bg-white data-[state=active]:shadow-sm">
            <BookOpen className="w-4 h-4 mr-2" />
            Subject Period
          </TabsTrigger>
          <TabsTrigger value="master-analytics" className="rounded-full data-[state=active]:bg-white data-[state=active]:shadow-sm">
            <BarChart3 className="w-4 h-4 mr-2" />
            Master Analytics
          </TabsTrigger>
        </TabsList>

        {/* School Arrival Tab */}
        <TabsContent value="school-arrival" className="mt-6 space-y-4">
          <Card className="bg-white shadow-sm border">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="font-semibold text-gray-900">Biometric Log</h3>
                  <p className="text-sm text-gray-500">Real-time log of students entering school premises.</p>
                </div>
                <Button onClick={() => setScannerOpen(true)} className="bg-gray-900 hover:bg-gray-800 text-white">
                  <Camera className="w-4 h-4 mr-2" />
                  Scan me
                </Button>
              </div>

              <div className="relative mb-4">
                <Search className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                <Input
                  placeholder="Search student..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>

              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Time</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Student</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {attendance
                      .filter(a => a.attendance_type === 'school_arrival')
                      .sort((a, b) => new Date(b.time_recorded) - new Date(a.time_recorded))
                      .slice(0, 20)
                      .map((record) => (
                        <tr key={record.id} className="hover:bg-gray-50">
                          <td className="px-4 py-3 text-sm text-gray-700">
                            {record.time_recorded && format(new Date(record.time_recorded), 'HH:mm')}
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-900 font-medium">{record.student_name}</td>
                          <td className="px-4 py-3">
                            <Badge className="bg-green-100 text-green-700">Checked In</Badge>
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
                {attendance.filter(a => a.attendance_type === 'school_arrival').length === 0 && (
                  <div className="text-center text-gray-500 py-8">No arrival records for this date</div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Class Register Tab */}
        <TabsContent value="class-register" className="mt-6 space-y-4">
          <Card className="bg-white shadow-sm border">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-gray-900">Class Register</h3>
                <Select value={selectedClass} onValueChange={setSelectedClass}>
                  <SelectTrigger className="w-48">
                    <SelectValue placeholder="Select class arm" />
                  </SelectTrigger>
                  <SelectContent>
                    {classArms.map(arm => (
                      <SelectItem key={arm.id} value={arm.id}>
                        Grade {arm.grade_level} - {arm.arm_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {!selectedClass ? (
                <div className="text-center text-gray-500 py-12">
                  Select a class arm to begin
                </div>
              ) : (
                <div className="space-y-2">
                  {filteredStudents.map((student) => {
                    const status = getStudentStatus(student.id);
                    return (
                      <div key={student.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                            <span className="text-blue-700 font-semibold text-sm">{getInitials(student)}</span>
                          </div>
                          <div>
                            <p className="font-medium text-gray-900">{student.first_name} {student.last_name}</p>
                            <p className="text-sm text-gray-500">SR/{selectedDate.split('-')[0].slice(2)}/{student.student_id_number}</p>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            onClick={() => handleMarkAttendance(student.id, 'Present')}
                            className={status === 'Present' ? 'bg-green-600 hover:bg-green-700 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}
                          >
                            Present
                          </Button>
                          <Button
                            size="sm"
                            onClick={() => handleMarkAttendance(student.id, 'Absent')}
                            className={status === 'Absent' ? 'bg-red-600 hover:bg-red-700 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}
                          >
                            Absent
                          </Button>
                          <Button
                            size="sm"
                            onClick={() => handleMarkAttendance(student.id, 'Late')}
                            className={status === 'Late' ? 'bg-yellow-500 hover:bg-yellow-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}
                          >
                            Late
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Subject Period Tab */}
        <TabsContent value="subject-period" className="mt-6 space-y-4">
          <Card className="bg-white shadow-sm border">
            <CardContent className="p-6">
              <div className="mb-4">
                <h3 className="font-semibold text-gray-900 mb-4">Subject Attendance</h3>
                <p className="text-sm text-gray-500 mb-4">Mark attendance for a specific class period.</p>
                
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <Label>Select Class Arm</Label>
                    <Select value={selectedClass} onValueChange={setSelectedClass}>
                      <SelectTrigger className="mt-1">
                        <SelectValue placeholder="Select class arm" />
                      </SelectTrigger>
                      <SelectContent>
                        {classArms.map(arm => (
                          <SelectItem key={arm.id} value={arm.id}>
                            Grade {arm.grade_level} - {arm.arm_name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Select Subject</Label>
                    <Select value={selectedSubject} onValueChange={setSelectedSubject} disabled={!selectedClass}>
                      <SelectTrigger className="mt-1">
                        <SelectValue placeholder="Select subject" />
                      </SelectTrigger>
                      <SelectContent>
                        {[...new Set(timetable.map(t => t.subject))].map((subject, idx) => (
                          <SelectItem key={idx} value={subject}>{subject}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Period</Label>
                    <Select value={selectedPeriod} onValueChange={setSelectedPeriod} disabled={!selectedSubject}>
                      <SelectTrigger className="mt-1">
                        <SelectValue placeholder="Select period" />
                      </SelectTrigger>
                      <SelectContent>
                        {periods.filter(p => p.subject === selectedSubject).map((period) => (
                          <SelectItem key={period.id} value={period.period_number.toString()}>
                            Period {period.period_number}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              {!selectedClass || !selectedSubject || !selectedPeriod ? (
                <div className="text-center text-gray-500 py-12">
                  Select Class Arm and Subject to begin
                </div>
              ) : (
                <div className="space-y-2 mt-6">
                  {filteredStudents.map((student) => {
                    const status = getStudentStatus(student.id);
                    return (
                      <div key={student.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50">
                        <div>
                          <p className="font-medium text-gray-900">{student.first_name} {student.last_name}</p>
                          <p className="text-sm text-gray-500">SR/{selectedDate.split('-')[0].slice(2)}/{student.student_id_number}</p>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            onClick={() => handleMarkAttendance(student.id, 'Present')}
                            className={status === 'Present' ? 'bg-green-600 text-white' : 'bg-gray-100 text-gray-700'}
                          >
                            Present
                          </Button>
                          <Button
                            size="sm"
                            onClick={() => handleMarkAttendance(student.id, 'Absent')}
                            className={status === 'Absent' ? 'bg-red-600 text-white' : 'bg-gray-100 text-gray-700'}
                          >
                            Absent
                          </Button>
                          <Button
                            size="sm"
                            onClick={() => handleMarkAttendance(student.id, 'Late')}
                            className={status === 'Late' ? 'bg-yellow-500 text-white' : 'bg-gray-100 text-gray-700'}
                          >
                            Late
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Master Analytics Tab */}
        <TabsContent value="master-analytics" className="mt-6 space-y-4">
          <Card className="bg-white shadow-sm border">
            <CardContent className="p-6">
              <h3 className="font-semibold text-gray-900 mb-4">Daily Attendance Master View</h3>
              
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Student</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Arrival Time (Bio)</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Class Status</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">True Status</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Issues</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {students.slice(0, 20).map((student) => {
                      const arrivalRecord = attendance.find(a => 
                        a.student_id === student.id && 
                        a.attendance_type === 'school_arrival'
                      );
                      const classRecord = attendance.find(a => 
                        a.student_id === student.id && 
                        a.attendance_type === 'class_register'
                      );
                      const trueStatus = classRecord?.status || (arrivalRecord ? 'Present' : 'Absent');
                      
                      return (
                        <tr key={student.id} className="hover:bg-gray-50">
                          <td className="px-4 py-3 text-sm font-medium text-gray-900">
                            {student.first_name} {student.last_name}
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-700">
                            {arrivalRecord?.time_recorded ? format(new Date(arrivalRecord.time_recorded), 'HH:mm') : '-'}
                          </td>
                          <td className="px-4 py-3">
                            {classRecord && (
                              <Badge className={
                                classRecord.status === 'Present' ? 'bg-green-100 text-green-700' :
                                classRecord.status === 'Absent' ? 'bg-red-100 text-red-700' :
                                'bg-yellow-100 text-yellow-700'
                              }>
                                {classRecord.status}
                              </Badge>
                            )}
                          </td>
                          <td className="px-4 py-3">
                            <Badge className={
                              trueStatus === 'Present' ? 'bg-green-100 text-green-700' :
                              trueStatus === 'Absent' ? 'bg-red-100 text-red-700' :
                              'bg-yellow-100 text-yellow-700'
                            }>
                              {trueStatus}
                            </Badge>
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-500">-</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Scanner Component */}
      {scannerOpen && (
        <Scanner
          open={scannerOpen}
          onClose={() => setScannerOpen(false)}
          onScanSuccess={(studentId) => {
            handleMarkAttendance(studentId, 'Present');
            setScannerOpen(false);
          }}
        />
      )}
    </div>
  );
}