import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { useSchoolContext } from '@/hooks/useSchoolContext';
import { addSchoolFilter } from '@/utils/schoolFilter';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Calendar, CheckCircle, XCircle, Clock } from 'lucide-react';
import { format } from 'date-fns';

export default function StudentAttendance() {
  const { user, school_tenant_id, isReady } = useSchoolContext();
  const [studentId, setStudentId] = useState(null);

  const { data: students = [] } = useQuery({
    queryKey: ['students', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      return await base44.entities.Student.filter({ user_id: user.id });
    },
    enabled: !!user?.id && isReady,
  });

  const studentProfile = students[0];

  useEffect(() => {
    if (studentProfile?.id) {
      setStudentId(studentProfile.id);
    }
  }, [studentProfile]);

  const { data: attendance = [] } = useQuery({
    queryKey: ['student-attendance', studentId, school_tenant_id],
    queryFn: async () => {
      if (!studentId) return [];
      return await base44.entities.Attendance.filter(addSchoolFilter({ student_id: studentId }, school_tenant_id));
    },
    enabled: !!studentId && isReady,
  });

  const stats = {
    present: attendance.filter(a => a.status === 'Present').length,
    absent: attendance.filter(a => a.status === 'Absent').length,
    late: attendance.filter(a => a.status === 'Late').length,
    total: attendance.length,
  };

  const attendanceRate = stats.total > 0 ? ((stats.present / stats.total) * 100).toFixed(1) : 0;

  const getStatusIcon = (status) => {
    switch (status) {
      case 'Present':
        return <CheckCircle className="w-5 h-5 text-green-600" />;
      case 'Absent':
        return <XCircle className="w-5 h-5 text-red-600" />;
      case 'Late':
        return <Clock className="w-5 h-5 text-yellow-600" />;
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-gray-900">My Attendance</h1>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="text-center">
              <p className="text-3xl font-bold text-blue-600">{attendanceRate}%</p>
              <p className="text-sm text-gray-600 mt-1">Attendance Rate</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="text-center">
              <p className="text-3xl font-bold text-green-600">{stats.present}</p>
              <p className="text-sm text-gray-600 mt-1">Present</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="text-center">
              <p className="text-3xl font-bold text-red-600">{stats.absent}</p>
              <p className="text-sm text-gray-600 mt-1">Absent</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="text-center">
              <p className="text-3xl font-bold text-yellow-600">{stats.late}</p>
              <p className="text-sm text-gray-600 mt-1">Late</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Attendance History</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {attendance.length === 0 ? (
              <div className="text-center py-12">
                <Calendar className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">No Attendance Records</h3>
                <p className="text-gray-600">Your attendance records will appear here once your teachers start tracking attendance.</p>
              </div>
            ) : (
              attendance.map((record) => (
                <div key={record.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center gap-3">
                    {getStatusIcon(record.status)}
                    <div>
                      <p className="font-medium">{record.class_name || 'Class'}</p>
                      <p className="text-sm text-gray-600">
                        {format(new Date(record.date), 'MMMM dd, yyyy')}
                      </p>
                    </div>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                    record.status === 'Present' ? 'bg-green-100 text-green-800' :
                    record.status === 'Absent' ? 'bg-red-100 text-red-800' :
                    'bg-yellow-100 text-yellow-800'
                  }`}>
                    {record.status}
                  </span>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}