import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useSchoolTenant } from '@/hooks/useSchoolTenant';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  UserCheck, Calendar, CheckCircle, XCircle, Clock, 
  Users, BookOpen, Search, Camera, BarChart3, CalendarDays
} from 'lucide-react';
import { format, isValid, parseISO, startOfDay, endOfDay, isAfter, isBefore, isEqual } from 'date-fns';

// Helper to safely format dates
const safeFormat = (dateValue, formatString) => {
  if (!dateValue) return '-';
  try {
    const date = typeof dateValue === 'string' ? new Date(dateValue) : dateValue;
    if (!date || !isValid(date)) return '-';
    return format(date, formatString);
  } catch {
    return '-';
  }
};
import { toast } from 'sonner';
import Scanner from '../components/Scanner';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { X, Check } from 'lucide-react';

const DEFAULT_AVATAR = 'https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/69441b6bd765d833c80ac7ff/a351a651d_image.png';

export default function UnifiedAttendance() {
  const queryClient = useQueryClient();
  const { schoolTenantId, isLoading: tenantLoading } = useSchoolTenant();
  const tenantFilter = schoolTenantId ? { school_tenant_id: schoolTenantId } : {};
  const [activeTab, setActiveTab] = useState('school-arrival');
  const today = format(new Date(), 'yyyy-MM-dd');
  const [selectedDate, setSelectedDate] = useState(today);
  const [endDate, setEndDate] = useState('');
  const [useDateRange, setUseDateRange] = useState(false);
  const [selectedClass, setSelectedClass] = useState('');
  const [selectedSubject, setSelectedSubject] = useState('');
  const [selectedPeriod, setSelectedPeriod] = useState('');
  const [scannerOpen, setScannerOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [scannedStudent, setScannedStudent] = useState(null);
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);

  const { data: classArms = [] } = useQuery({
    queryKey: ['class-arms', schoolTenantId],
    queryFn: () => schoolTenantId ? base44.entities.ClassArm.filter(tenantFilter) : base44.entities.ClassArm.list(),
    enabled: !tenantLoading,
  });

  const { data: students = [] } = useQuery({
    queryKey: ['students', schoolTenantId],
    queryFn: () => schoolTenantId ? base44.entities.Student.filter(tenantFilter) : base44.entities.Student.list(),
    enabled: !tenantLoading,
  });

  const { data: timetable = [] } = useQuery({
    queryKey: ['timetable', selectedClass, schoolTenantId],
    queryFn: async () => {
      if (!selectedClass) return [];
      const filter = { ...tenantFilter, class_arm_id: selectedClass };
      return schoolTenantId ? await base44.entities.Timetable.filter(filter) : (await base44.entities.Timetable.list()).filter(t => t.class_arm_id === selectedClass);
    },
    enabled: !!selectedClass && !tenantLoading,
  });

  const { data: attendance = [] } = useQuery({
    queryKey: ['attendance', selectedDate, endDate, useDateRange, schoolTenantId],
    queryFn: async () => {
      const dateFilter = { ...tenantFilter };
      if (!useDateRange || !endDate) dateFilter.date = selectedDate;
      const all = schoolTenantId
        ? await base44.entities.Attendance.filter(dateFilter)
        : await base44.entities.Attendance.list();
      if (useDateRange && endDate) {
        return all.filter(a => a.date >= selectedDate && a.date <= endDate);
      }
      return all.filter(a => a.date === selectedDate);
    },
    enabled: !tenantLoading,
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

  const handleMarkAttendance = (studentId, status, forceArrival = false) => {
    const student = students.find(s => s.id === studentId);
    const attendanceType = forceArrival ? 'school_arrival' : activeTab.replace(/-/g, '_');
    const existingRecord = attendance.find(a => 
      a.student_id === studentId && 
      a.date === selectedDate &&
      a.attendance_type === attendanceType &&
      (attendanceType !== 'subject_period' || (a.subject === selectedSubject && (!selectedPeriod || selectedPeriod === 'none' || a.period_number === parseInt(selectedPeriod))))
    );

    // For school arrival, use student's class arm if available
    let classArmId = selectedClass;
    let classArmName = '';
    
    if (attendanceType === 'school_arrival' && student?.grade_level) {
      const studentArm = classArms.find(c => c.grade_level === student.grade_level);
      if (studentArm) {
        classArmId = studentArm.id;
        classArmName = `Grade ${studentArm.grade_level} - ${studentArm.arm_name}`;
      }
    } else {
      const classArm = classArms.find(c => c.id === selectedClass);
      classArmName = classArm ? `Grade ${classArm.grade_level} - ${classArm.arm_name}` : '';
    }

    const attendanceData = {
      student_id: studentId,
      student_name: student ? `${student.first_name} ${student.last_name}` : '',
      class_id: classArmId || null,
      class_arm_id: classArmId || null,
      class_arm_name: classArmName,
      date: selectedDate,
      status: status,
      type: attendanceType === 'school_arrival' ? 'arrival' : attendanceType === 'class_register' ? 'class' : 'subject',
      attendance_type: attendanceType,
      subject: selectedSubject || null,
      period_number: selectedPeriod && selectedPeriod !== 'none' ? parseInt(selectedPeriod) : null,
      time_recorded: new Date().toISOString(),
      school_tenant_id: schoolTenantId || undefined,
    };

    if (existingRecord) {
      updateAttendanceMutation.mutate({ id: existingRecord.id, data: { status } });
    } else {
      createAttendanceMutation.mutate(attendanceData);
    }
  };

  const getStudentStatus = (studentId) => {
    const attendanceType = activeTab.replace(/-/g, '_');
    const record = attendance.find(a => 
      a.student_id === studentId && 
      a.date === selectedDate &&
      a.attendance_type === attendanceType &&
      (attendanceType !== 'subject_period' || (a.subject === selectedSubject && (!selectedPeriod || selectedPeriod === 'none' || a.period_number === parseInt(selectedPeriod))))
    );
    return record?.status || null;
  };

  // Filter attendance based on type for stats - handle both old 'type' and new 'attendance_type' fields
  const filteredForStats = attendance.filter(a => {
    const attendanceType = activeTab.replace(/-/g, '_');
    // Check both attendance_type and type fields for backward compatibility
    return a.attendance_type === attendanceType || 
           (attendanceType === 'school_arrival' && a.type === 'arrival') ||
           (attendanceType === 'class_register' && a.type === 'class') ||
           (attendanceType === 'subject_period' && a.type === 'subject');
  });
  
  const presentCount = filteredForStats.filter(a => a.status === 'Present').length;
  const absentCount = filteredForStats.filter(a => a.status === 'Absent').length;
  const lateCount = filteredForStats.filter(a => a.status === 'Late').length;
  const totalRecords = filteredForStats.length;

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
    t.day_of_week === safeFormat(selectedDate, 'EEEE')
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
          <div className="flex flex-wrap items-center gap-4">
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

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="use-date-range"
                checked={useDateRange}
                onChange={(e) => setUseDateRange(e.target.checked)}
                className="rounded"
              />
              <Label htmlFor="use-date-range" className="text-sm">Date Range</Label>
            </div>

            {useDateRange && (
              <div className="flex items-center gap-2">
                <Label className="text-sm font-medium">To:</Label>
                <Input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  min={selectedDate}
                  className="w-48"
                />
              </div>
            )}
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
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Time</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Student</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Class</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {attendance
                      .filter(a => a.attendance_type === 'school_arrival' || a.type === 'arrival')
                      .sort((a, b) => new Date(b.time_recorded || b.created_date) - new Date(a.time_recorded || a.created_date))
                      .slice(0, 20)
                      .map((record) => (
                        <tr key={record.id} className="hover:bg-gray-50">
                          <td className="px-4 py-3 text-sm text-gray-700">
                            {safeFormat(record.date || record.created_date, 'dd MMM yyyy')}
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-700">
                            {safeFormat(record.time_recorded || record.created_date, 'HH:mm')}
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-900 font-medium">{record.student_name || 'Unknown'}</td>
                          <td className="px-4 py-3 text-sm text-gray-600">{record.class_arm_name || '-'}</td>
                          <td className="px-4 py-3">
                            <Badge className={
                              record.status === 'Present' ? 'bg-green-100 text-green-700' :
                              record.status === 'Late' ? 'bg-yellow-100 text-yellow-700' :
                              'bg-red-100 text-red-700'
                            }>
                              {record.status === 'Present' ? 'Checked In' : record.status}
                            </Badge>
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
                {attendance.filter(a => a.attendance_type === 'school_arrival' || a.type === 'arrival').length === 0 && (
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
              <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
                <h3 className="font-semibold text-gray-900">Class Register</h3>
                <div className="flex flex-wrap gap-4 items-center">
                  <div className="flex items-center gap-2">
                    <Label className="text-sm">Date:</Label>
                    <Input
                      type="date"
                      value={selectedDate}
                      onChange={(e) => {
                        if (e.target.value >= today) {
                          setSelectedDate(e.target.value);
                        } else {
                          toast.error('Cannot select past dates for class register');
                        }
                      }}
                      min={today}
                      className="w-40"
                    />
                  </div>
                  <Select value={selectedClass} onValueChange={setSelectedClass}>
                    <SelectTrigger className="w-48">
                      <SelectValue placeholder="Select class" />
                    </SelectTrigger>
                    <SelectContent>
                      {classArms.map(arm => (
                        <SelectItem key={arm.id} value={arm.id}>
                          {arm.grade_level} - {arm.arm_name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {selectedClass && (
                <div className="relative mb-4">
                  <Search className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                  <Input
                    placeholder="Search student by name..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
              )}

              {!selectedClass ? (
                <div className="text-center text-gray-500 py-12">
                  Select a class to begin taking attendance
                </div>
              ) : (
                <div className="space-y-2">
                  {filteredStudents.length === 0 ? (
                    <div className="text-center text-gray-500 py-8">
                      {searchQuery ? 'No students found matching your search' : 'No students in this class'}
                    </div>
                  ) : (
                    filteredStudents.map((student) => {
                      const status = getStudentStatus(student.id);
                      return (
                        <div key={student.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                              <span className="text-blue-700 font-semibold text-sm">{getInitials(student)}</span>
                            </div>
                            <div>
                              <p className="font-medium text-gray-900">{student.first_name} {student.last_name}</p>
                              <p className="text-sm text-gray-500">ID: {student.student_id_number}</p>
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              variant={status === 'Present' ? 'default' : 'outline'}
                              onClick={() => handleMarkAttendance(student.id, 'Present')}
                              className={status === 'Present' ? 'bg-green-600 hover:bg-green-700 text-white border-green-600' : 'border-gray-300 hover:bg-green-50 hover:text-green-700 hover:border-green-300'}
                            >
                              Present
                            </Button>
                            <Button
                              size="sm"
                              variant={status === 'Absent' ? 'default' : 'outline'}
                              onClick={() => handleMarkAttendance(student.id, 'Absent')}
                              className={status === 'Absent' ? 'bg-red-600 hover:bg-red-700 text-white border-red-600' : 'border-gray-300 hover:bg-red-50 hover:text-red-700 hover:border-red-300'}
                            >
                              Absent
                            </Button>
                            <Button
                              size="sm"
                              variant={status === 'Late' ? 'default' : 'outline'}
                              onClick={() => handleMarkAttendance(student.id, 'Late')}
                              className={status === 'Late' ? 'bg-yellow-500 hover:bg-yellow-600 text-white border-yellow-500' : 'border-gray-300 hover:bg-yellow-50 hover:text-yellow-700 hover:border-yellow-300'}
                            >
                              Late
                            </Button>
                          </div>
                        </div>
                      );
                    })
                  )}
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
                    <Label>Select Class *</Label>
                    <Select value={selectedClass} onValueChange={setSelectedClass}>
                      <SelectTrigger className="mt-1">
                        <SelectValue placeholder="Select class" />
                      </SelectTrigger>
                      <SelectContent>
                        {classArms.map(arm => (
                          <SelectItem key={arm.id} value={arm.id}>
                            {arm.grade_level} - {arm.arm_name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Select Subject *</Label>
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
                    <Label>Period (Optional)</Label>
                    <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
                      <SelectTrigger className="mt-1">
                        <SelectValue placeholder="Select period (optional)" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">No specific period</SelectItem>
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

              {!selectedClass || !selectedSubject ? (
                <div className="text-center text-gray-500 py-12">
                  Select Class Arm and Subject to begin taking attendance
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
                            variant={status === 'Present' ? 'default' : 'outline'}
                            onClick={() => handleMarkAttendance(student.id, 'Present')}
                            className={status === 'Present' ? 'bg-green-600 hover:bg-green-700 text-white border-green-600' : 'border-gray-300 hover:bg-green-50 hover:text-green-700 hover:border-green-300'}
                          >
                            Present
                          </Button>
                          <Button
                            size="sm"
                            variant={status === 'Absent' ? 'default' : 'outline'}
                            onClick={() => handleMarkAttendance(student.id, 'Absent')}
                            className={status === 'Absent' ? 'bg-red-600 hover:bg-red-700 text-white border-red-600' : 'border-gray-300 hover:bg-red-50 hover:text-red-700 hover:border-red-300'}
                          >
                            Absent
                          </Button>
                          <Button
                            size="sm"
                            variant={status === 'Late' ? 'default' : 'outline'}
                            onClick={() => handleMarkAttendance(student.id, 'Late')}
                            className={status === 'Late' ? 'bg-yellow-500 hover:bg-yellow-600 text-white border-yellow-500' : 'border-gray-300 hover:bg-yellow-50 hover:text-yellow-700 hover:border-yellow-300'}
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
                            {safeFormat(arrivalRecord?.time_recorded, 'HH:mm')}
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
      <Scanner
        isOpen={scannerOpen}
        onClose={() => setScannerOpen(false)}
        onScanSuccess={(scannedData) => {
          setScannerOpen(false);
          // Normalize scanned data - trim whitespace and convert to string
          const normalizedScan = String(scannedData).trim().toLowerCase();
          
          // Find student by ID or student_id_number (flexible matching)
          const student = students.find(s => {
            const studentId = String(s.id || '').trim().toLowerCase();
            const studentIdNumber = String(s.student_id_number || '').trim().toLowerCase();
            
            return studentId === normalizedScan || 
                   studentIdNumber === normalizedScan ||
                   studentIdNumber.includes(normalizedScan) ||
                   normalizedScan.includes(studentIdNumber);
          });
          
          if (student) {
            setScannedStudent(student);
            setConfirmDialogOpen(true);
          } else {
            toast.error(`Student not found for ID: ${scannedData}`);
          }
        }}
      />

      {/* Scan Confirmation Dialog */}
      <Dialog open={confirmDialogOpen} onOpenChange={setConfirmDialogOpen}>
        <DialogContent className="max-w-sm bg-white p-6">
          {scannedStudent && (
            <div className="flex flex-col items-center text-center">
              <img
                src={scannedStudent.photo_url || DEFAULT_AVATAR}
                alt={`${scannedStudent.first_name} ${scannedStudent.last_name}`}
                className="w-28 h-28 rounded-full object-cover border-4 border-green-100 mb-4"
              />
              <h3 className="text-xl font-semibold text-gray-900">
                {scannedStudent.first_name} {scannedStudent.last_name}
              </h3>
              <p className="text-gray-500 mb-6">
                ID: #{scannedStudent.student_id_number}
              </p>
              <div className="flex gap-4 w-full">
                <Button
                  onClick={() => {
                    setConfirmDialogOpen(false);
                    setScannedStudent(null);
                  }}
                  className="flex-1 bg-red-500 hover:bg-red-600 text-white rounded-full py-3"
                >
                  <X className="w-5 h-5 mr-2" />
                  No
                </Button>
                <Button
                  onClick={() => {
                    handleMarkAttendance(scannedStudent.id, 'Present', true);
                    setConfirmDialogOpen(false);
                    setScannedStudent(null);
                  }}
                  className="flex-1 bg-green-500 hover:bg-green-600 text-white rounded-full py-3"
                >
                  <Check className="w-5 h-5 mr-2" />
                  Yes
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}