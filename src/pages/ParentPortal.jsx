import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Users, GraduationCap, DollarSign, FileText, Calendar, Award } from 'lucide-react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '../utils';

export default function ParentPortal() {
  const [user, setUser] = useState(null);
  const [studentIds, setStudentIds] = useState([]);

  useEffect(() => {
    const fetchUser = async () => {
      const currentUser = await base44.auth.me();
      setUser(currentUser);
      if (currentUser.parent_of_student_ids) {
        setStudentIds(currentUser.parent_of_student_ids.split(',').map(id => id.trim()));
      }
    };
    fetchUser();
  }, []);

  const { data: students = [] } = useQuery({
    queryKey: ['parent-students', studentIds],
    queryFn: async () => {
      if (studentIds.length === 0) return [];
      const allStudents = await base44.entities.Student.list();
      return allStudents.filter(s => studentIds.includes(s.id));
    },
    enabled: studentIds.length > 0,
  });

  const { data: invoices = [] } = useQuery({
    queryKey: ['parent-invoices', studentIds],
    queryFn: async () => {
      if (studentIds.length === 0) return [];
      const allInvoices = await base44.entities.FeeInvoice.list();
      return allInvoices.filter(inv => studentIds.includes(inv.student_id));
    },
    enabled: studentIds.length > 0,
  });

  const { data: reportCards = [] } = useQuery({
    queryKey: ['parent-reports', studentIds],
    queryFn: async () => {
      if (studentIds.length === 0) return [];
      const allReports = await base44.entities.ReportCard.list();
      return allReports.filter(rep => studentIds.includes(rep.student_id));
    },
    enabled: studentIds.length > 0,
  });

  const totalOutstanding = invoices.reduce((sum, inv) => sum + (inv.balance || 0), 0);
  const overdueInvoices = invoices.filter(inv => inv.status === 'Overdue').length;

  if (!user) {
    return (
      <div className="text-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Parent Portal</h1>
        <p className="text-gray-600 mt-1">Welcome, {user.full_name}</p>
      </div>

      {/* My Children */}
      <div>
        <h2 className="text-xl font-semibold text-gray-900 mb-4">My Children</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {students.map((student) => (
            <Link key={student.id} to={createPageUrl('ParentStudentView')}>
              <Card className="bg-white shadow-md hover:shadow-lg transition-shadow cursor-pointer">
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center">
                      <Users className="w-6 h-6 text-blue-600" />
                    </div>
                    <div>
                      <CardTitle className="text-lg">
                        {student.first_name} {student.last_name}
                      </CardTitle>
                      <p className="text-sm text-gray-600">Grade {student.grade_level}</p>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">Student ID:</span>
                      <span className="font-medium">{student.student_id}</span>
                    </div>
                    <Badge className={student.status === 'Active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}>
                      {student.status}
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-white shadow-md">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Outstanding Fees</p>
                <p className="text-2xl font-bold text-orange-600">${totalOutstanding.toLocaleString()}</p>
              </div>
              <DollarSign className="w-8 h-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>
        <Card className="bg-white shadow-md">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Overdue Invoices</p>
                <p className="text-2xl font-bold text-red-600">{overdueInvoices}</p>
              </div>
              <Calendar className="w-8 h-8 text-red-600" />
            </div>
          </CardContent>
        </Card>
        <Card className="bg-white shadow-md">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Report Cards</p>
                <p className="text-2xl font-bold text-blue-600">{reportCards.length}</p>
              </div>
              <Award className="w-8 h-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card className="bg-white shadow-md">
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Link
              to={createPageUrl('ParentFees')}
              className="p-4 border-2 border-gray-200 rounded-lg hover:border-blue-500 hover:shadow-md transition-all"
            >
              <DollarSign className="w-8 h-8 text-blue-600 mb-2" />
              <h3 className="font-semibold text-gray-900">View Invoices</h3>
              <p className="text-sm text-gray-600 mt-1">Check fee payments</p>
            </Link>
            <Link
              to={createPageUrl('ParentReports')}
              className="p-4 border-2 border-gray-200 rounded-lg hover:border-green-500 hover:shadow-md transition-all"
            >
              <FileText className="w-8 h-8 text-green-600 mb-2" />
              <h3 className="font-semibold text-gray-900">Report Cards</h3>
              <p className="text-sm text-gray-600 mt-1">View academic reports</p>
            </Link>
            <Link
              to={createPageUrl('ParentAttendance')}
              className="p-4 border-2 border-gray-200 rounded-lg hover:border-purple-500 hover:shadow-md transition-all"
            >
              <Calendar className="w-8 h-8 text-purple-600 mb-2" />
              <h3 className="font-semibold text-gray-900">Attendance</h3>
              <p className="text-sm text-gray-600 mt-1">View attendance records</p>
            </Link>
            <Link
              to={createPageUrl('ParentBehavior')}
              className="p-4 border-2 border-gray-200 rounded-lg hover:border-orange-500 hover:shadow-md transition-all"
            >
              <Award className="w-8 h-8 text-orange-600 mb-2" />
              <h3 className="font-semibold text-gray-900">Behavior</h3>
              <p className="text-sm text-gray-600 mt-1">View behavior records</p>
            </Link>
          </div>
        </CardContent>
      </Card>

      {/* Recent Report Cards */}
      {reportCards.length > 0 && (
        <Card className="bg-white shadow-md">
          <CardHeader>
            <CardTitle>Recent Report Cards</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {reportCards.slice(0, 5).map((report) => (
                <div key={report.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <p className="font-medium">{report.student_name}</p>
                    <p className="text-sm text-gray-600">Average: {report.average_score}%</p>
                  </div>
                  <Link to={createPageUrl(`ReportCardView?id=${report.id}`)}>
                    <Badge className="bg-blue-100 text-blue-800">View Report</Badge>
                  </Link>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}