import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Fingerprint, Clock, CheckCircle, AlertCircle, Download, Camera, User } from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';
import Scanner from '../components/Scanner';

export default function BiometricAttendance() {
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [scannerOpen, setScannerOpen] = useState(false);
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  const [scannedStudent, setScannedStudent] = useState(null);
  const queryClient = useQueryClient();

  const { data: biometricRecords = [], isLoading } = useQuery({
    queryKey: ['biometric-attendance', selectedDate],
    queryFn: async () => {
      const all = await base44.entities.BiometricAttendance.list('-timestamp');
      return all.filter(r => r.date === selectedDate);
    },
  });

  const { data: students = [] } = useQuery({
    queryKey: ['students'],
    queryFn: () => base44.entities.Student.list(),
  });

  const { data: scannerSettings = [] } = useQuery({
    queryKey: ['scanner-settings'],
    queryFn: () => base44.entities.ScannerSettings.list(),
  });

  const attendanceScannerEnabled = scannerSettings.find(
    s => s.feature_name === 'biometric_attendance' && s.enabled
  );

  const simulateCheckInMutation = useMutation({
    mutationFn: async (studentId) => {
      const student = students.find(s => s.id === studentId);
      if (!student) return;

      const now = new Date();
      const time = format(now, 'HH:mm:ss');
      const isLate = now.getHours() > 8 || (now.getHours() === 8 && now.getMinutes() > 30);

      return base44.entities.BiometricAttendance.create({
        student_id: studentId,
        student_name: `${student.first_name} ${student.last_name}`,
        biometric_id: `BIO${student.student_id}`,
        timestamp: now.toISOString(),
        date: selectedDate,
        type: 'Check-In',
        device_id: 'DEVICE-001',
        status: isLate ? 'Late' : 'On Time',
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['biometric-attendance'] });
    },
  });

  const handleScanSuccess = async (data) => {
    setScannerOpen(false);

    try {
      // Fetch student details
      const response = await base44.functions.invoke('scanStudentAttendance', {
        student_id: data
      });

      if (response.data.success) {
        setScannedStudent(response.data.student);
        setConfirmDialogOpen(true);
      } else {
        toast.error(response.data.error || 'Student not found');
      }
    } catch (error) {
      toast.error('Error processing scan: ' + error.message);
    }
  };

  const handleConfirmAttendance = async () => {
    if (!scannedStudent) return;

    try {
      const response = await base44.functions.invoke('scanStudentAttendance', {
        student_id: scannedStudent.id,
        action: 'confirm'
      });

      if (response.data.success) {
        toast.success('Attendance recorded successfully');
        queryClient.invalidateQueries({ queryKey: ['biometric-attendance'] });
        setConfirmDialogOpen(false);
        setScannedStudent(null);
      } else {
        toast.error(response.data.error);
      }
    } catch (error) {
      toast.error('Error recording attendance: ' + error.message);
    }
  };

  const statusColors = {
    'On Time': 'bg-green-100 text-green-800',
    'Late': 'bg-orange-100 text-orange-800',
    'Early': 'bg-blue-100 text-blue-800',
  };

  const checkIns = biometricRecords.filter(r => r.type === 'Check-In');
  const checkOuts = biometricRecords.filter(r => r.type === 'Check-Out');
  const lateCount = biometricRecords.filter(r => r.status === 'Late').length;

  return (
    <div className="space-y-4 sm:space-y-6 p-4 sm:p-0">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Biometric Attendance</h1>
        <p className="text-sm sm:text-base text-gray-600 mt-1">Real-time attendance tracking via biometric devices</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
        <Card className="bg-white shadow-md">
          <CardContent className="p-4 sm:p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs sm:text-sm text-gray-600">Total Check-Ins</p>
                <p className="text-xl sm:text-2xl font-bold text-gray-900">{checkIns.length}</p>
              </div>
              <CheckCircle className="w-6 h-6 sm:w-8 sm:h-8 text-green-600" />
            </div>
          </CardContent>
        </Card>
        <Card className="bg-white shadow-md">
          <CardContent className="p-4 sm:p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs sm:text-sm text-gray-600">Check-Outs</p>
                <p className="text-xl sm:text-2xl font-bold text-gray-900">{checkOuts.length}</p>
              </div>
              <Clock className="w-6 h-6 sm:w-8 sm:h-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>
        <Card className="bg-white shadow-md">
          <CardContent className="p-4 sm:p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs sm:text-sm text-gray-600">Late Arrivals</p>
                <p className="text-xl sm:text-2xl font-bold text-orange-600">{lateCount}</p>
              </div>
              <AlertCircle className="w-6 h-6 sm:w-8 sm:h-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>
        <Card className="bg-white shadow-md">
          <CardContent className="p-4 sm:p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs sm:text-sm text-gray-600">Devices Active</p>
                <p className="text-xl sm:text-2xl font-bold text-blue-600">3</p>
              </div>
              <Fingerprint className="w-6 h-6 sm:w-8 sm:h-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Controls */}
      <Card className="bg-white shadow-md">
        <CardContent className="p-3 sm:p-4">
          <div className="flex flex-col sm:flex-row gap-2 sm:gap-4 items-stretch sm:items-center">
            <div className="flex-1">
              <Input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="text-sm"
              />
            </div>
            <Button variant="outline" className="text-sm px-3 py-2">
              <Download className="w-3 h-3 sm:w-4 sm:h-4 mr-2" />
              Export
            </Button>
            {attendanceScannerEnabled && (
              <Button
                onClick={() => setScannerOpen(true)}
                className="bg-blue-600 hover:bg-blue-700 text-sm px-3 py-2"
              >
                <Camera className="w-3 h-3 sm:w-4 sm:h-4 mr-2" />
                Scan Student
              </Button>
            )}
            <Button
              onClick={() => {
                const randomStudent = students[Math.floor(Math.random() * students.length)];
                if (randomStudent) {
                  simulateCheckInMutation.mutate(randomStudent.id);
                }
              }}
              variant="outline"
              disabled={students.length === 0}
              className="text-sm px-3 py-2"
            >
              <Fingerprint className="w-3 h-3 sm:w-4 sm:h-4 mr-2" />
              Simulate
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Records Table */}
      <Card className="bg-white shadow-md">
        <CardHeader className="p-4 sm:p-6">
          <CardTitle className="text-base sm:text-lg">Attendance Records - {format(new Date(selectedDate), 'MMMM d, yyyy')}</CardTitle>
        </CardHeader>
        <CardContent className="p-0 sm:p-6 sm:pt-0">
          {isLoading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            </div>
          ) : biometricRecords.length === 0 ? (
            <p className="text-center text-gray-500 py-8">No biometric records for this date</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="px-3 sm:px-6 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase">Student</th>
                    <th className="px-3 sm:px-6 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase hidden sm:table-cell">Biometric ID</th>
                    <th className="px-3 sm:px-6 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                    <th className="px-3 sm:px-6 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase">Time</th>
                    <th className="px-3 sm:px-6 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                    <th className="px-3 sm:px-6 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase hidden lg:table-cell">Device</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {biometricRecords.map((record) => (
                    <tr key={record.id} className="hover:bg-gray-50">
                      <td className="px-3 sm:px-6 py-3 sm:py-4 text-xs sm:text-sm font-medium text-gray-900">{record.student_name}</td>
                      <td className="px-3 sm:px-6 py-3 sm:py-4 text-xs sm:text-sm text-gray-600 hidden sm:table-cell">{record.biometric_id}</td>
                      <td className="px-3 sm:px-6 py-3 sm:py-4">
                        <Badge variant="outline" className="text-xs">
                          {record.type}
                        </Badge>
                      </td>
                      <td className="px-3 sm:px-6 py-3 sm:py-4 text-xs sm:text-sm text-gray-900">
                        {format(new Date(record.timestamp), 'HH:mm:ss')}
                      </td>
                      <td className="px-3 sm:px-6 py-3 sm:py-4">
                        <Badge className={`${statusColors[record.status]} text-xs`}>
                          {record.status}
                        </Badge>
                      </td>
                      <td className="px-3 sm:px-6 py-3 sm:py-4 text-xs sm:text-sm text-gray-600 hidden lg:table-cell">{record.device_id}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* API Integration Info */}
      <Card className="bg-blue-50 border-blue-200">
        <CardContent className="p-4 sm:p-6">
          <h3 className="font-semibold text-sm sm:text-base text-blue-900 mb-2">Biometric Device Integration</h3>
          <p className="text-xs sm:text-sm text-blue-800 mb-3">
            Connect your biometric devices (fingerprint scanners, card readers) via our REST API endpoint:
          </p>
          <code className="block bg-white p-2 sm:p-3 rounded text-xs sm:text-sm overflow-x-auto">
            POST /api/biometric-attendance
            <br />
            {"{"} student_id, biometric_id, timestamp, type {"}"}
          </code>
          <p className="text-xs text-blue-700 mt-2">
            Contact admin for API credentials and integration documentation.
          </p>
        </CardContent>
      </Card>

      {/* Scanner Dialog */}
      <Scanner
        isOpen={scannerOpen}
        onClose={() => setScannerOpen(false)}
        onScanSuccess={handleScanSuccess}
        title="Scan Student Card"
        description="Scan student's PVC card for attendance"
      />

      {/* Confirmation Dialog */}
      <Dialog open={confirmDialogOpen} onOpenChange={setConfirmDialogOpen}>
        <DialogContent className="max-w-md bg-white">
          <DialogHeader>
            <DialogTitle>Confirm Student Attendance</DialogTitle>
          </DialogHeader>
          {scannedStudent && (
            <div className="space-y-4">
              <div className="bg-blue-50 rounded-lg p-4 border-2 border-blue-200">
                <div className="flex items-center gap-3 mb-3">
                  {scannedStudent.photo_url ? (
                    <img 
                      src={scannedStudent.photo_url} 
                      alt={scannedStudent.name}
                      className="w-16 h-16 rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center">
                      <User className="w-8 h-8 text-gray-400" />
                    </div>
                  )}
                  <div className="flex-1">
                    <p className="font-semibold text-blue-900 text-lg">{scannedStudent.name}</p>
                    <p className="text-sm text-gray-600">ID: {scannedStudent.student_id}</p>
                  </div>
                </div>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Grade:</span>
                    <span className="font-medium">{scannedStudent.grade_level}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Status:</span>
                    <Badge variant="outline">{scannedStudent.status}</Badge>
                  </div>
                </div>
              </div>
              <p className="text-sm text-gray-600 text-center">
                Is this the correct student?
              </p>
              <div className="flex gap-3">
                <Button variant="outline" onClick={() => setConfirmDialogOpen(false)} className="flex-1">
                  Cancel
                </Button>
                <Button onClick={handleConfirmAttendance} className="flex-1 bg-blue-600 hover:bg-blue-700">
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Confirm
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}