import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  Fingerprint, CheckCircle, XCircle, Clock, Users, 
  BookOpen, BarChart3, Camera, AlertCircle 
} from 'lucide-react';
import { toast } from 'sonner';
import Scanner from '../components/Scanner';

export default function UnifiedAttendance() {
  const [activeTab, setActiveTab] = useState('arrival');
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedClassArm, setSelectedClassArm] = useState('');
  const [selectedSubject, setSelectedSubject] = useState('');
  const [selectedPeriod, setSelectedPeriod] = useState('');
  const [studentAttendance, setStudentAttendance] = useState({});
  const [scannerOpen, setScannerOpen] = useState(false);
  const queryClient = useQueryClient();

  const { data: classArms = [] } = useQuery({
    queryKey: ['class-arms'],
    queryFn: () => base44.entities.ClassArm.list(),
  });

  const { data: students = [] } = useQuery({
    queryKey: ['students'],
    queryFn: () => base44.entities.Student.list(),
  });

  const { data: timetable = [] } = useQuery({
    queryKey: ['timetable'],
    queryFn: () => base44.entities.Timetable.list(),
  });

  const { data: attendance = [] } = useQuery({
    queryKey: ['attendance', selectedDate, selectedClassArm, activeTab],
    queryFn: async () => {
      const all = await base44.entities.Attendance.list();
      return all.filter(a => a.date === selectedDate);
    },
  });

  // Auto-select current period for subject attendance
  useEffect(() => {
    if (activeTab === 'subject' && selectedClassArm && timetable.length > 0) {
      const now = new Date();
      const currentDay = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][now.getDay()];
      const currentTime = now.getHours() * 60 + now.getMinutes();

      const currentSlot = timetable.find(t => {
        if (t.class_arm_id !== selectedClassArm || t.day_of_week !== currentDay) return false;
        const [startHour, startMin] = t.start_time.split(':').map(Number);
        const [endHour, endMin] = t.end_time.split(':').map(Number);
        const startTime = startHour * 60 + startMin;
        const endTime = endHour * 60 + endMin;
        return currentTime >= startTime && currentTime <= endTime;
      });

      if (currentSlot) {
        setSelectedSubject(currentSlot.subject);
        setSelectedPeriod(currentSlot.period_number.toString());
      }
    }
  }, [activeTab, selectedClassArm, timetable]);

  const createMutation = useMutation({
    mutationFn: async (records) => await base44.entities.Attendance.bulkCreate(records),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['attendance'] });
      setStudentAttendance({});
      toast.success('Attendance recorded successfully');
    },
  });

  const handleScanSuccess = async (data) => {
    setScannerOpen(false);
    const student = students.find(s => s.student_id_number === data);
    
    if (!student) {
      toast.error('Student not found');
      return;
    }

    const now = new Date();
    const record = {
      student_id: student.id,
      student_name: `${student.first_name} ${student.last_name}`,
      date: selectedDate,
      time: now.toTimeString().slice(0, 8),
      status: 'Present',
      type: 'arrival',
      class_arm_id: student.class_arm_id || '',
    };

    await base44.entities.Attendance.create(record);
    queryClient.invalidateQueries({ queryKey: ['attendance'] });
    toast.success(`Attendance recorded for ${student.first_name} ${student.last_name}`);
  };

  const handleSaveAttendance = (type) => {
    const records = Object.entries(studentAttendance).map(([studentId, status]) => {
      const student = students.find(s => s.id === studentId);
      const classArm = classArms.find(c => c.id === selectedClassArm);
      
      return {
        student_id: studentId,
        student_name: `${student?.first_name} ${student?.last_name}`,
        class_arm_id: selectedClassArm,
        class_arm_name: classArm ? `${classArm.grade_level}${classArm.arm_name}` : '',
        subject: type === 'subject' ? selectedSubject : null,
        period_number: type === 'subject' ? parseInt(selectedPeriod) : null,
        date: selectedDate,
        time: new Date().toTimeString().slice(0, 8),
        status: status,
        type: type,
      };
    });

    createMutation.mutate(records);
  };

  // Filter students by selected class arm
  const classStudents = students.filter(s => {
    if (!selectedClassArm) return false;
    const classArm = classArms.find(c => c.id === selectedClassArm);
    return s.grade_level === classArm?.grade_level;
  });

  // Initialize attendance state
  useEffect(() => {
    if (selectedClassArm && classStudents.length > 0) {
      const initial = {};
      classStudents.forEach(student => {
        const existing = attendance.find(a => 
          a.student_id === student.id && 
          a.type === activeTab &&
          (activeTab !== 'subject' || (a.subject === selectedSubject && a.period_number === parseInt(selectedPeriod)))
        );
        initial[student.id] = existing?.status || 'Present';
      });
      setStudentAttendance(initial);
    }
  }, [selectedClassArm, classStudents.length, attendance, activeTab, selectedSubject, selectedPeriod]);

  // Calculate stats
  const arrivalRecords = attendance.filter(a => a.type === 'arrival');
  const classRecords = attendance.filter(a => a.type === 'class');
  const subjectRecords = attendance.filter(a => a.type === 'subject');
  const presentCount = attendance.filter(a => a.status === 'Present').length;
  const absentCount = attendance.filter(a => a.status === 'Absent').length;
  const lateCount = attendance.filter(a => a.status === 'Late').length;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-4xl font-bold text-text">Unified Attendance Hub</h1>
          <p className="text-text-secondary mt-2">Comprehensive attendance tracking and analytics</p>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-white rounded-xl shadow-md">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-text-secondary">Present Today</p>
                <p className="text-3xl font-bold text-green-600">{presentCount}</p>
              </div>
              <CheckCircle className="w-10 h-10 text-green-600" />
            </div>
          </CardContent>
        </Card>
        <Card className="bg-white rounded-xl shadow-md">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-text-secondary">Absent</p>
                <p className="text-3xl font-bold text-red-600">{absentCount}</p>
              </div>
              <XCircle className="w-10 h-10 text-red-600" />
            </div>
          </CardContent>
        </Card>
        <Card className="bg-white rounded-xl shadow-md">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-text-secondary">Late</p>
                <p className="text-3xl font-bold text-yellow-600">{lateCount}</p>
              </div>
              <Clock className="w-10 h-10 text-yellow-600" />
            </div>
          </CardContent>
        </Card>
        <Card className="bg-white rounded-xl shadow-md">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-text-secondary">Total Records</p>
                <p className="text-3xl font-bold text-blue-600">{attendance.length}</p>
              </div>
              <Users className="w-10 h-10 text-blue-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-4 bg-white rounded-xl shadow-md p-1">
          <TabsTrigger value="arrival" className="flex items-center gap-2">
            <Fingerprint className="w-4 h-4" />
            School Arrival
          </TabsTrigger>
          <TabsTrigger value="class" className="flex items-center gap-2">
            <Users className="w-4 h-4" />
            Class Register
          </TabsTrigger>
          <TabsTrigger value="subject" className="flex items-center gap-2">
            <BookOpen className="w-4 h-4" />
            Subject Period
          </TabsTrigger>
          <TabsTrigger value="analytics" className="flex items-center gap-2">
            <BarChart3 className="w-4 h-4" />
            Master Analytics
          </TabsTrigger>
        </TabsList>

        {/* School Arrival Tab */}
        <TabsContent value="arrival" className="space-y-4">
          <Card className="bg-white rounded-xl shadow-md">
            <CardHeader>
              <CardTitle>School Arrival Tracking</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex gap-4">
                  <Input
                    type="date"
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                  />
                  <Button onClick={() => setScannerOpen(true)} className="bg-accent hover:bg-accent-hover">
                    <Camera className="w-4 h-4 mr-2" />
                    Simulate Scan
                  </Button>
                </div>

                <div className="border rounded-lg divide-y max-h-96 overflow-y-auto">
                  {arrivalRecords.length === 0 ? (
                    <p className="text-center text-text-secondary py-8">No arrival records for today</p>
                  ) : (
                    arrivalRecords.map((record) => (
                      <div key={record.id} className="p-4 flex justify-between items-center hover:bg-gray-50">
                        <div>
                          <p className="font-medium text-text">{record.student_name}</p>
                          <p className="text-sm text-text-secondary">Arrival: {record.time}</p>
                        </div>
                        <Badge className={
                          record.status === 'Present' ? 'bg-green-100 text-green-800' :
                          record.status === 'Late' ? 'bg-yellow-100 text-yellow-800' : 'bg-gray-100 text-gray-800'
                        }>
                          {record.status}
                        </Badge>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Class Register Tab */}
        <TabsContent value="class" className="space-y-4">
          <Card className="bg-white rounded-xl shadow-md">
            <CardHeader>
              <CardTitle>Class Register</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Date</Label>
                    <Input
                      type="date"
                      value={selectedDate}
                      onChange={(e) => setSelectedDate(e.target.value)}
                    />
                  </div>
                  <div>
                    <Label>Class Arm</Label>
                    <select 
                      value={selectedClassArm} 
                      onChange={(e) => setSelectedClassArm(e.target.value)}
                      className="w-full px-3 py-2 border rounded-lg"
                    >
                      <option value="">Select class arm</option>
                      {classArms.map(arm => (
                        <option key={arm.id} value={arm.id}>
                          {arm.grade_level}{arm.arm_name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {!selectedClassArm ? (
                  <p className="text-center text-text-secondary py-8">Please select a class arm</p>
                ) : classStudents.length === 0 ? (
                  <p className="text-center text-text-secondary py-8">No students in this class</p>
                ) : (
                  <>
                    <div className="space-y-3 max-h-96 overflow-y-auto">
                      {classStudents.map((student) => (
                        <div key={student.id} className="flex justify-between items-center p-4 bg-gray-50 rounded-lg">
                          <div>
                            <p className="font-medium text-text">{student.first_name} {student.last_name}</p>
                            <p className="text-sm text-text-secondary">ID: {student.student_id_number}</p>
                          </div>
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              variant={studentAttendance[student.id] === 'Present' ? 'default' : 'outline'}
                              className={studentAttendance[student.id] === 'Present' ? 'bg-green-600 hover:bg-green-700' : ''}
                              onClick={() => setStudentAttendance({...studentAttendance, [student.id]: 'Present'})}
                            >
                              <CheckCircle className="w-4 h-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant={studentAttendance[student.id] === 'Absent' ? 'default' : 'outline'}
                              className={studentAttendance[student.id] === 'Absent' ? 'bg-red-600 hover:bg-red-700' : ''}
                              onClick={() => setStudentAttendance({...studentAttendance, [student.id]: 'Absent'})}
                            >
                              <XCircle className="w-4 h-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant={studentAttendance[student.id] === 'Late' ? 'default' : 'outline'}
                              className={studentAttendance[student.id] === 'Late' ? 'bg-yellow-600 hover:bg-yellow-700' : ''}
                              onClick={() => setStudentAttendance({...studentAttendance, [student.id]: 'Late'})}
                            >
                              <Clock className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                    <div className="flex justify-end pt-4 border-t">
                      <Button onClick={() => handleSaveAttendance('class')} className="bg-accent hover:bg-accent-hover">
                        Save Class Register
                      </Button>
                    </div>
                  </>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Subject Period Tab */}
        <TabsContent value="subject" className="space-y-4">
          <Card className="bg-white rounded-xl shadow-md">
            <CardHeader>
              <CardTitle>Subject Period Attendance</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                    <Label>Date</Label>
                    <Input
                      type="date"
                      value={selectedDate}
                      onChange={(e) => setSelectedDate(e.target.value)}
                    />
                  </div>
                  <div>
                    <Label>Class Arm</Label>
                    <select 
                      value={selectedClassArm} 
                      onChange={(e) => setSelectedClassArm(e.target.value)}
                      className="w-full px-3 py-2 border rounded-lg"
                    >
                      <option value="">Select class arm</option>
                      {classArms.map(arm => (
                        <option key={arm.id} value={arm.id}>
                          {arm.grade_level}{arm.arm_name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <Label>Subject</Label>
                    <Input
                      value={selectedSubject}
                      onChange={(e) => setSelectedSubject(e.target.value)}
                      placeholder="e.g., Mathematics"
                    />
                  </div>
                  <div>
                    <Label>Period</Label>
                    <Input
                      type="number"
                      value={selectedPeriod}
                      onChange={(e) => setSelectedPeriod(e.target.value)}
                      placeholder="1"
                      min="1"
                    />
                  </div>
                </div>

                {selectedSubject && selectedPeriod && (
                  <div className="bg-blue-50 border border-blue-200 p-3 rounded-lg">
                    <p className="text-sm text-blue-800">
                      <AlertCircle className="w-4 h-4 inline mr-2" />
                      Taking attendance for <strong>{selectedSubject}</strong> - Period {selectedPeriod}
                    </p>
                  </div>
                )}

                {!selectedClassArm || !selectedSubject || !selectedPeriod ? (
                  <p className="text-center text-text-secondary py-8">Please fill in all fields</p>
                ) : classStudents.length === 0 ? (
                  <p className="text-center text-text-secondary py-8">No students in this class</p>
                ) : (
                  <>
                    <div className="space-y-3 max-h-96 overflow-y-auto">
                      {classStudents.map((student) => (
                        <div key={student.id} className="flex justify-between items-center p-4 bg-gray-50 rounded-lg">
                          <div>
                            <p className="font-medium text-text">{student.first_name} {student.last_name}</p>
                            <p className="text-sm text-text-secondary">ID: {student.student_id_number}</p>
                          </div>
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              variant={studentAttendance[student.id] === 'Present' ? 'default' : 'outline'}
                              className={studentAttendance[student.id] === 'Present' ? 'bg-green-600 hover:bg-green-700' : ''}
                              onClick={() => setStudentAttendance({...studentAttendance, [student.id]: 'Present'})}
                            >
                              <CheckCircle className="w-4 h-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant={studentAttendance[student.id] === 'Absent' ? 'default' : 'outline'}
                              className={studentAttendance[student.id] === 'Absent' ? 'bg-red-600 hover:bg-red-700' : ''}
                              onClick={() => setStudentAttendance({...studentAttendance, [student.id]: 'Absent'})}
                            >
                              <XCircle className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                    <div className="flex justify-end pt-4 border-t">
                      <Button onClick={() => handleSaveAttendance('subject')} className="bg-accent hover:bg-accent-hover">
                        Save Period Attendance
                      </Button>
                    </div>
                  </>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Master Analytics Tab */}
        <TabsContent value="analytics" className="space-y-4">
          <Card className="bg-white rounded-xl shadow-md">
            <CardHeader>
              <CardTitle>Master Analytics - True State</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                    <div className="flex items-center gap-3 mb-2">
                      <Fingerprint className="w-8 h-8 text-blue-600" />
                      <div>
                        <p className="text-sm text-blue-800">Arrival Records</p>
                        <p className="text-2xl font-bold text-blue-900">{arrivalRecords.length}</p>
                      </div>
                    </div>
                  </div>
                  <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                    <div className="flex items-center gap-3 mb-2">
                      <Users className="w-8 h-8 text-green-600" />
                      <div>
                        <p className="text-sm text-green-800">Class Registers</p>
                        <p className="text-2xl font-bold text-green-900">{classRecords.length}</p>
                      </div>
                    </div>
                  </div>
                  <div className="p-4 bg-purple-50 rounded-lg border border-purple-200">
                    <div className="flex items-center gap-3 mb-2">
                      <BookOpen className="w-8 h-8 text-purple-600" />
                      <div>
                        <p className="text-sm text-purple-800">Subject Periods</p>
                        <p className="text-2xl font-bold text-purple-900">{subjectRecords.length}</p>
                      </div>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-semibold text-text mb-3">Recent Activity</h3>
                  <div className="border rounded-lg divide-y max-h-96 overflow-y-auto">
                    {attendance.length === 0 ? (
                      <p className="text-center text-text-secondary py-8">No activity for {selectedDate}</p>
                    ) : (
                      attendance.slice(0, 20).map((record) => (
                        <div key={record.id} className="p-4 flex justify-between items-center hover:bg-gray-50">
                          <div>
                            <p className="font-medium text-text">{record.student_name}</p>
                            <p className="text-sm text-text-secondary">
                              {record.type === 'arrival' && 'School Arrival'}
                              {record.type === 'class' && `Class Register - ${record.class_arm_name}`}
                              {record.type === 'subject' && `${record.subject} - Period ${record.period_number}`}
                              {record.time && ` • ${record.time}`}
                            </p>
                          </div>
                          <Badge className={
                            record.status === 'Present' ? 'bg-green-100 text-green-800' :
                            record.status === 'Late' ? 'bg-yellow-100 text-yellow-800' :
                            record.status === 'Absent' ? 'bg-red-100 text-red-800' : 'bg-gray-100 text-gray-800'
                          }>
                            {record.status}
                          </Badge>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Scanner Dialog */}
      <Scanner
        isOpen={scannerOpen}
        onClose={() => setScannerOpen(false)}
        onScanSuccess={handleScanSuccess}
        title="Scan Student Card"
        description="Scan student ID for attendance"
      />
    </div>
  );
}