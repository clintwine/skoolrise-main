import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useSchoolContext } from '@/hooks/useSchoolContext';
import { usePlanAccess } from '@/hooks/usePlanAccess';
import { addSchoolFilter } from '@/utils/schoolFilter';
import UpgradePrompt from '@/components/UpgradePrompt';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Fingerprint, Clock, CheckCircle, AlertCircle, Download, Camera, User } from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';
import Scanner from '../components/Scanner';
import { DateRangePicker } from '@/components/ui/date-range-picker';

export default function BiometricAttendance() {
  const [dateRange, setDateRange] = useState({
    from: new Date(),
    to: new Date(),
  });
  const [scannerOpen, setScannerOpen] = useState(false);
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  const [notFoundDialogOpen, setNotFoundDialogOpen] = useState(false);
  const [scannedStudent, setScannedStudent] = useState(null);
  const [scannedId, setScannedId] = useState(null);
  const queryClient = useQueryClient();
  const { school_tenant_id, isReady } = useSchoolContext();
  const { hasAccess, plan, minimumPlan, loading } = usePlanAccess('biometricAttendance');

  const { data: biometricRecords = [], isLoading } = useQuery({
    queryKey: ['biometric-attendance', dateRange, school_tenant_id],
    queryFn: async () => {
      if (!dateRange?.from || !dateRange?.to) return [];
      const fromDate = format(dateRange.from, 'yyyy-MM-dd');
      const toDate = format(dateRange.to, 'yyyy-MM-dd');
      const all = await base44.entities.BiometricAttendance.filter(addSchoolFilter({}, school_tenant_id), '-timestamp');
      return all.filter(r => r.date >= fromDate && r.date <= toDate);
    },
    enabled: isReady,
  });

  const { data: students = [] } = useQuery({
    queryKey: ['students', school_tenant_id],
    queryFn: () => base44.entities.Student.filter(addSchoolFilter({}, school_tenant_id)),
    enabled: isReady,
  });

  const { data: scannerSettings = [] } = useQuery({
    queryKey: ['scanner-settings'],
    queryFn: () => base44.entities.ScannerSettings.list(),
  });

  if (!loading && !hasAccess) {
    return <UpgradePrompt feature="Biometric Attendance" currentPlan={plan} minimumPlan={minimumPlan} />;
  }

  const attendanceScannerEnabled = scannerSettings.find(
    s => s.feature_name === 'biometric_attendance' && s.enabled
  );

  const handleScanSuccess = async (data) => {
    setScannerOpen(false);

    try {
      // Fetch student details
      const response = await base44.functions.invoke('scanStudentAttendance', {
        student_id_number: data
      });

      if (response.data.success) {
        setScannedStudent(response.data.student);
        setConfirmDialogOpen(true);
        setNotFoundDialogOpen(false);
      } else {
        setScannedId(data);
        setNotFoundDialogOpen(true);
        setConfirmDialogOpen(false);
        setScannedStudent(null);
      }
    } catch (error) {
      setScannedId(data);
      setNotFoundDialogOpen(true);
      setConfirmDialogOpen(false);
      setScannedStudent(null);
    }
  };

  const handleConfirmAttendance = async () => {
    if (!scannedStudent) return;

    try {
        const response = await base44.functions.invoke('scanStudentAttendance', {
          student_id_number: scannedStudent.student_id_number,
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

  const handleExport = () => {
    if (biometricRecords.length === 0) {
      toast.error('No records to export');
      return;
    }

    const headers = ['Student Name', 'Biometric ID', 'Type', 'Time', 'Status', 'Device', 'Date'];
    const csvData = biometricRecords.map(record => [
      record.student_name,
      record.biometric_id,
      record.type,
      format(new Date(record.timestamp), 'HH:mm:ss'),
      record.status,
      record.device_id,
      record.date
    ]);

    const csvContent = [
      headers.join(','),
      ...csvData.map(row => row.join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `biometric_attendance_${format(dateRange?.from || new Date(), 'yyyy-MM-dd')}_to_${format(dateRange?.to || new Date(), 'yyyy-MM-dd')}.csv`;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    a.remove();
    toast.success('Report exported successfully');
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
              <DateRangePicker
                dateRange={dateRange}
                setDateRange={setDateRange}
                className="w-full"
              />
            </div>
            <Button variant="outline" className="text-sm px-3 py-2" onClick={handleExport}>
              <Download className="w-3 h-3 sm:w-4 sm:h-4 mr-2" />
              Export
            </Button>
            <Button
              onClick={() => setScannerOpen(true)}
              className="bg-blue-600 hover:bg-blue-700 text-sm px-3 py-2"
              disabled={!attendanceScannerEnabled}
            >
              <Camera className="w-3 h-3 sm:w-4 sm:h-4 mr-2" />
              Scan Student
            </Button>
          </div>
        </CardContent>
      </Card>

      {!attendanceScannerEnabled && (
        <div className="bg-yellow-100 border border-yellow-300 text-yellow-800 p-3 sm:p-4 rounded-lg flex items-center gap-2 text-sm sm:text-base">
          <AlertCircle className="w-4 h-4 sm:w-5 sm:h-5" />
          Biometric attendance scanner is disabled. Enable it in Scanner Settings.
        </div>
      )}

      {/* Records Table */}
      <Card className="bg-white shadow-md">
        <CardHeader className="p-4 sm:p-6">
          <CardTitle className="text-base sm:text-lg">
            Attendance Records - {dateRange?.from && dateRange?.to ? `${format(dateRange.from, 'MMM dd, yyyy')} - ${format(dateRange.to, 'MMM dd, yyyy')}` : 'Select a date range'}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0 sm:p-6 sm:pt-0">
          {isLoading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            </div>
          ) : biometricRecords.length === 0 ? (
            <p className="text-center text-gray-500 py-8">No biometric records for this date range</p>
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
                    <p className="text-sm text-gray-600">ID: {scannedStudent.student_id_number}</p>
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

      {/* Not Found Dialog */}
      <Dialog open={notFoundDialogOpen} onOpenChange={setNotFoundDialogOpen}>
        <DialogContent className="max-w-md bg-white">
          <DialogHeader>
            <DialogTitle className="text-red-700">Student Not Recognized</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 text-center py-4">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto">
              <AlertCircle className="w-10 h-10 text-red-600" />
            </div>
            <div>
              <p className="text-lg font-semibold text-gray-800 mb-2">
                ID Not Found
              </p>
              <p className="text-sm text-gray-600">
                The ID <span className="font-mono px-2 py-1 bg-red-50 text-red-700 rounded font-semibold">{scannedId}</span> is not recognized in the system.
              </p>
            </div>
            <p className="text-xs text-gray-500">
              Please verify the student ID or contact administration to register this student.
            </p>
            <Button 
              onClick={() => setNotFoundDialogOpen(false)} 
              className="w-full bg-red-600 hover:bg-red-700"
            >
              Close
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}