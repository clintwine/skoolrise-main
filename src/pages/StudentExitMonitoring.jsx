import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { LogOut, Camera, CheckCircle, AlertCircle, Mail, User } from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';
import Scanner from '../components/Scanner';

export default function StudentExitMonitoring() {
  const [scannerOpen, setScannerOpen] = useState(false);
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  const [scannedStudent, setScannedStudent] = useState(null);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);

  const queryClient = useQueryClient();

  const { data: exitRecords = [], isLoading } = useQuery({
    queryKey: ['student-exits', selectedDate],
    queryFn: async () => {
      const all = await base44.entities.BiometricAttendance.filter({ 
        type: 'Check-Out',
        date: selectedDate 
      });
      return all.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    },
  });

  const { data: scannerSettings = [] } = useQuery({
    queryKey: ['scanner-settings'],
    queryFn: () => base44.entities.ScannerSettings.list(),
  });

  const exitScannerEnabled = scannerSettings.find(
    s => s.feature_name === 'student_exit' && s.enabled
  );

  const handleScanSuccess = async (data) => {
    setScannerOpen(false);

    try {
      // Fetch student and parent details
      const response = await base44.functions.invoke('scanStudentExitNotification', {
        student_id: data
      });

      if (response.data.success) {
        setScannedStudent({
          ...response.data.student,
          parent: response.data.parent
        });
        setConfirmDialogOpen(true);
      } else {
        toast.error(response.data.error || 'Student not found');
      }
    } catch (error) {
      toast.error('Error processing scan: ' + error.message);
    }
  };

  const handleConfirmExit = async () => {
    if (!scannedStudent) return;

    try {
      const response = await base44.functions.invoke('scanStudentExitNotification', {
        student_id: scannedStudent.id,
        action: 'confirm'
      });

      if (response.data.success) {
        toast.success(response.data.message);
        if (response.data.notification_sent) {
          toast.success('Parent notification sent via email');
        }
        queryClient.invalidateQueries({ queryKey: ['student-exits'] });
        setConfirmDialogOpen(false);
        setScannedStudent(null);
      } else {
        toast.error(response.data.error);
      }
    } catch (error) {
      toast.error('Error recording exit: ' + error.message);
    }
  };

  if (!exitScannerEnabled) {
    return (
      <div className="flex items-center justify-center min-h-[60vh] p-4">
        <Card className="max-w-md">
          <CardContent className="p-6 sm:p-8 text-center">
            <AlertCircle className="w-12 h-12 sm:w-16 sm:h-16 text-gray-400 mx-auto mb-3 sm:mb-4" />
            <h2 className="text-lg sm:text-xl font-semibold mb-2">Student Exit Scanner Disabled</h2>
            <p className="text-sm sm:text-base text-gray-600 mb-4">
              The student exit scanner feature is currently disabled. Please enable it in Scanner Settings.
            </p>
            <Button onClick={() => window.location.href = '/scanner-settings'} className="text-sm sm:text-base">
              Go to Scanner Settings
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6 p-4 sm:p-0">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Student Exit Monitoring</h1>
        <p className="text-sm sm:text-base text-gray-600 mt-1">Record student departures and notify parents</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
        <Card className="bg-white shadow-md">
          <CardContent className="p-4 sm:p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs sm:text-sm text-gray-600">Total Exits Today</p>
                <p className="text-xl sm:text-2xl font-bold text-gray-900">{exitRecords.length}</p>
              </div>
              <LogOut className="w-6 h-6 sm:w-8 sm:h-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>
        <Card className="bg-white shadow-md">
          <CardContent className="p-4 sm:p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs sm:text-sm text-gray-600">Notifications Sent</p>
                <p className="text-xl sm:text-2xl font-bold text-blue-600">{exitRecords.length}</p>
              </div>
              <Mail className="w-6 h-6 sm:w-8 sm:h-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>
        <Card className="bg-white shadow-md">
          <CardContent className="p-4 sm:p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs sm:text-sm text-gray-600">Last Exit</p>
                <p className="text-base sm:text-lg font-bold text-gray-900">
                  {exitRecords.length > 0 
                    ? format(new Date(exitRecords[0].timestamp), 'HH:mm')
                    : 'N/A'}
                </p>
              </div>
              <CheckCircle className="w-6 h-6 sm:w-8 sm:h-8 text-green-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Scanner Control */}
      <Card className="bg-gradient-to-r from-orange-50 to-red-50 border-orange-200">
        <CardContent className="p-4 sm:p-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-0">
            <div>
              <h3 className="font-semibold text-base sm:text-lg text-orange-900 mb-1">Scan Student Exit</h3>
              <p className="text-xs sm:text-sm text-orange-700">Scan student PVC card to record departure</p>
            </div>
            <Button
              onClick={() => setScannerOpen(true)}
              className="bg-orange-600 hover:bg-orange-700 text-sm sm:text-base px-4 py-2 sm:px-6 sm:py-3"
            >
              <Camera className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
              Start Scanner
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Exit Records */}
      <Card className="bg-white shadow-md">
        <CardHeader className="p-4 sm:p-6">
          <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:justify-between">
            <CardTitle className="text-base sm:text-lg">Exit Records - {format(new Date(selectedDate), 'MMMM d, yyyy')}</CardTitle>
            <Input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="w-full sm:w-48 text-sm"
            />
          </div>
        </CardHeader>
        <CardContent className="p-0 sm:p-6 sm:pt-0">
          {isLoading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            </div>
          ) : exitRecords.length === 0 ? (
            <p className="text-center text-gray-500 py-8">No exit records for this date</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="px-3 sm:px-6 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase">Student</th>
                    <th className="px-3 sm:px-6 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase hidden sm:table-cell">Student ID</th>
                    <th className="px-3 sm:px-6 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase">Exit Time</th>
                    <th className="px-3 sm:px-6 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase hidden lg:table-cell">Recorded By</th>
                    <th className="px-3 sm:px-6 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {exitRecords.map((record) => (
                    <tr key={record.id} className="hover:bg-gray-50">
                      <td className="px-3 sm:px-6 py-3 sm:py-4 text-xs sm:text-sm font-medium text-gray-900">{record.student_name}</td>
                      <td className="px-3 sm:px-6 py-3 sm:py-4 text-xs sm:text-sm text-gray-600 hidden sm:table-cell">{record.biometric_id}</td>
                      <td className="px-3 sm:px-6 py-3 sm:py-4 text-xs sm:text-sm text-gray-900">
                        {format(new Date(record.timestamp), 'HH:mm:ss')}
                      </td>
                      <td className="px-3 sm:px-6 py-3 sm:py-4 text-xs sm:text-sm text-gray-600 hidden lg:table-cell">{record.scanned_by_name}</td>
                      <td className="px-3 sm:px-6 py-3 sm:py-4">
                        <Badge className="bg-orange-100 text-orange-800 text-xs">
                          Departed
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Scanner Dialog */}
      <Scanner
        isOpen={scannerOpen}
        onClose={() => setScannerOpen(false)}
        onScanSuccess={handleScanSuccess}
        title="Scan Student Exit"
        description="Scan student's PVC card to record departure"
      />

      {/* Confirmation Dialog */}
      <Dialog open={confirmDialogOpen} onOpenChange={setConfirmDialogOpen}>
        <DialogContent className="max-w-xs sm:max-w-md bg-white p-4">
          <DialogHeader>
            <DialogTitle className="text-base sm:text-lg">Confirm Student Exit</DialogTitle>
          </DialogHeader>
          {scannedStudent && (
            <div className="space-y-4">
              <div className="bg-orange-50 rounded-lg p-3 sm:p-4 border-2 border-orange-200">
                <div className="flex items-center gap-2 mb-3">
                  <User className="w-4 h-4 sm:w-5 sm:h-5 text-orange-600" />
                  <span className="font-semibold text-sm sm:text-base text-orange-900">Student Details</span>
                </div>
                <div className="space-y-2 text-xs sm:text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Name:</span>
                    <span className="font-medium">{scannedStudent.name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Student ID:</span>
                    <span className="font-medium">{scannedStudent.student_id}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Grade:</span>
                    <span className="font-medium">{scannedStudent.grade_level}</span>
                  </div>
                </div>
              </div>

              {scannedStudent.parent && !scannedStudent.parent.warning ? (
                <div className="bg-blue-50 rounded-lg p-3 sm:p-4 border-2 border-blue-200">
                  <div className="flex items-center gap-2 mb-3">
                    <Mail className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600" />
                    <span className="font-semibold text-sm sm:text-base text-blue-900">Parent Notification</span>
                  </div>
                  <div className="space-y-2 text-xs sm:text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Parent:</span>
                      <span className="font-medium">{scannedStudent.parent.name}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Email:</span>
                      <span className="font-medium">{scannedStudent.parent.email}</span>
                    </div>
                    <p className="text-xs text-blue-700 mt-2">
                      An email notification will be sent to the parent
                    </p>
                  </div>
                </div>
              ) : (
                <div className="bg-yellow-50 rounded-lg p-3 sm:p-4 border-2 border-yellow-200">
                  <div className="flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 sm:w-5 sm:h-5 text-yellow-600" />
                    <span className="text-xs sm:text-sm text-yellow-800">No parent contact information found</span>
                  </div>
                </div>
              )}

              <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
                <Button variant="outline" onClick={() => setConfirmDialogOpen(false)} className="flex-1 text-sm">
                  Cancel
                </Button>
                <Button onClick={handleConfirmExit} className="flex-1 bg-orange-600 hover:bg-orange-700 text-sm">
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Confirm Exit
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}