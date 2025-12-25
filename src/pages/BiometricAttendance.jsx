import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tantml:react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Fingerprint, Clock, CheckCircle, AlertCircle, Download } from 'lucide-react';
import { format } from 'date-fns';

export default function BiometricAttendance() {
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
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

  const statusColors = {
    'On Time': 'bg-green-100 text-green-800',
    'Late': 'bg-orange-100 text-orange-800',
    'Early': 'bg-blue-100 text-blue-800',
  };

  const checkIns = biometricRecords.filter(r => r.type === 'Check-In');
  const checkOuts = biometricRecords.filter(r => r.type === 'Check-Out');
  const lateCount = biometricRecords.filter(r => r.status === 'Late').length;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Biometric Attendance</h1>
        <p className="text-gray-600 mt-1">Real-time attendance tracking via biometric devices</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-white shadow-md">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Check-Ins</p>
                <p className="text-2xl font-bold text-gray-900">{checkIns.length}</p>
              </div>
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
          </CardContent>
        </Card>
        <Card className="bg-white shadow-md">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Check-Outs</p>
                <p className="text-2xl font-bold text-gray-900">{checkOuts.length}</p>
              </div>
              <Clock className="w-8 h-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>
        <Card className="bg-white shadow-md">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Late Arrivals</p>
                <p className="text-2xl font-bold text-orange-600">{lateCount}</p>
              </div>
              <AlertCircle className="w-8 h-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>
        <Card className="bg-white shadow-md">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Devices Active</p>
                <p className="text-2xl font-bold text-blue-600">3</p>
              </div>
              <Fingerprint className="w-8 h-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Controls */}
      <Card className="bg-white shadow-md">
        <CardContent className="p-4">
          <div className="flex gap-4 items-center">
            <div className="flex-1">
              <Input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
              />
            </div>
            <Button variant="outline">
              <Download className="w-4 h-4 mr-2" />
              Export
            </Button>
            <Button
              onClick={() => {
                const randomStudent = students[Math.floor(Math.random() * students.length)];
                if (randomStudent) {
                  simulateCheckInMutation.mutate(randomStudent.id);
                }
              }}
              className="bg-blue-600 hover:bg-blue-700"
              disabled={students.length === 0}
            >
              <Fingerprint className="w-4 h-4 mr-2" />
              Simulate Check-In
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Records Table */}
      <Card className="bg-white shadow-md">
        <CardHeader>
          <CardTitle>Attendance Records - {format(new Date(selectedDate), 'MMMM d, yyyy')}</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            </div>
          ) : biometricRecords.length === 0 ? (
            <p className="text-center text-gray-500 py-8">No biometric records for this date</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Student</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Biometric ID</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Time</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Device</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {biometricRecords.map((record) => (
                    <tr key={record.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 text-sm font-medium text-gray-900">{record.student_name}</td>
                      <td className="px-6 py-4 text-sm text-gray-600">{record.biometric_id}</td>
                      <td className="px-6 py-4">
                        <Badge variant="outline">
                          {record.type}
                        </Badge>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900">
                        {format(new Date(record.timestamp), 'HH:mm:ss')}
                      </td>
                      <td className="px-6 py-4">
                        <Badge className={statusColors[record.status]}>
                          {record.status}
                        </Badge>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">{record.device_id}</td>
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
        <CardContent className="p-6">
          <h3 className="font-semibold text-blue-900 mb-2">Biometric Device Integration</h3>
          <p className="text-sm text-blue-800 mb-3">
            Connect your biometric devices (fingerprint scanners, card readers) via our REST API endpoint:
          </p>
          <code className="block bg-white p-3 rounded text-sm">
            POST /api/biometric-attendance
            <br />
            {"{"} student_id, biometric_id, timestamp, type {"}"}
          </code>
          <p className="text-xs text-blue-700 mt-2">
            Contact admin for API credentials and integration documentation.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}