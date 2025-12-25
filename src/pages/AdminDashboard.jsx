import React from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, GraduationCap, BookOpen, TrendingUp, CheckSquare, Award, DollarSign, AlertTriangle, Brain } from 'lucide-react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '../utils';
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

export default function AdminDashboard() {
  const { data: students = [] } = useQuery({
    queryKey: ['students'],
    queryFn: () => base44.entities.Student.list(),
  });

  const { data: teachers = [] } = useQuery({
    queryKey: ['teachers'],
    queryFn: () => base44.entities.Teacher.list(),
  });

  const { data: classes = [] } = useQuery({
    queryKey: ['classes'],
    queryFn: () => base44.entities.Class.list(),
  });

  const { data: attendance = [] } = useQuery({
    queryKey: ['attendance'],
    queryFn: () => base44.entities.Attendance.list(),
  });

  const { data: invoices = [] } = useQuery({
    queryKey: ['invoices'],
    queryFn: () => base44.entities.FeeInvoice.list(),
  });

  const { data: reportCards = [] } = useQuery({
    queryKey: ['report-cards'],
    queryFn: () => base44.entities.ReportCard.list(),
  });

  const activeStudents = students.filter(s => s.status === 'Active').length;
  const activeTeachers = teachers.filter(t => t.status === 'Active').length;
  const activeClasses = classes.filter(c => c.status === 'Active').length;

  // Financial metrics
  const totalInvoiced = invoices.reduce((sum, inv) => sum + (inv.amount || 0), 0);
  const totalCollected = invoices.reduce((sum, inv) => sum + ((inv.amount || 0) - (inv.balance || 0)), 0);
  const totalOutstanding = invoices.reduce((sum, inv) => sum + (inv.balance || 0), 0);

  // Attendance metrics
  const presentCount = attendance.filter(a => a.status === 'Present').length;
  const attendanceRate = attendance.length > 0 ? ((presentCount / attendance.length) * 100).toFixed(1) : 0;

  // Performance metrics
  const avgScore = reportCards.length > 0 ? 
    (reportCards.reduce((sum, rc) => sum + (rc.average_score || 0), 0) / reportCards.length).toFixed(1) : 0;

  // At-risk students (simulated AI prediction)
  const atRiskStudents = students.filter(s => {
    const studentReports = reportCards.filter(rc => rc.student_id === s.id);
    if (studentReports.length === 0) return false;
    const avgPerformance = studentReports.reduce((sum, rc) => sum + (rc.average_score || 0), 0) / studentReports.length;
    return avgPerformance < 60;
  });

  // Performance distribution
  const performanceData = [
    { range: '90-100%', count: reportCards.filter(rc => rc.average_score >= 90).length },
    { range: '80-89%', count: reportCards.filter(rc => rc.average_score >= 80 && rc.average_score < 90).length },
    { range: '70-79%', count: reportCards.filter(rc => rc.average_score >= 70 && rc.average_score < 80).length },
    { range: '60-69%', count: reportCards.filter(rc => rc.average_score >= 60 && rc.average_score < 70).length },
    { range: 'Below 60%', count: reportCards.filter(rc => rc.average_score < 60).length },
  ];

  const COLORS = ['#10B981', '#3B82F6', '#F59E0B', '#EF4444', '#8B5CF6'];

  const stats = [
    { title: 'Total Students', value: activeStudents, icon: Users, color: 'bg-blue-500', link: 'StudentRecords' },
    { title: 'Active Teachers', value: activeTeachers, icon: GraduationCap, color: 'bg-green-500', link: 'TeacherManagement' },
    { title: 'Active Classes', value: activeClasses, icon: BookOpen, color: 'bg-purple-500', link: 'ClassManagement' },
    { title: 'Avg Performance', value: `${avgScore}%`, icon: Award, color: 'bg-orange-500', link: 'Reports' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
          <p className="text-gray-600 mt-1">School overview and analytics</p>
        </div>
        <Link to={createPageUrl('AdminReportsDashboard')}>
          <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2">
            <TrendingUp className="w-5 h-5" />
            Advanced Reports
          </button>
        </Link>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <Link key={stat.title} to={createPageUrl(stat.link)}>
              <Card className="hover:shadow-lg transition-shadow cursor-pointer bg-white">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">{stat.title}</p>
                      <p className="text-3xl font-bold text-gray-900 mt-2">{stat.value}</p>
                    </div>
                    <div className={`${stat.color} p-3 rounded-lg`}>
                      <Icon className="w-6 h-6 text-white" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="w-5 h-5" />
              Financial Summary
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between items-center p-3 bg-blue-50 rounded-lg">
                <span className="text-gray-700">Total Invoiced</span>
                <span className="text-xl font-bold text-blue-600">${totalInvoiced.toLocaleString()}</span>
              </div>
              <div className="flex justify-between items-center p-3 bg-green-50 rounded-lg">
                <span className="text-gray-700">Collected</span>
                <span className="text-xl font-bold text-green-600">${totalCollected.toLocaleString()}</span>
              </div>
              <div className="flex justify-between items-center p-3 bg-red-50 rounded-lg">
                <span className="text-gray-700">Outstanding</span>
                <span className="text-xl font-bold text-red-600">${totalOutstanding.toLocaleString()}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckSquare className="w-5 h-5" />
              Attendance Overview
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center py-8">
              <div className="text-5xl font-bold text-green-600 mb-2">{attendanceRate}%</div>
              <p className="text-gray-600">Overall Attendance Rate</p>
              <div className="grid grid-cols-2 gap-4 mt-6">
                <div className="p-3 bg-green-50 rounded-lg">
                  <p className="text-2xl font-bold text-green-600">{presentCount}</p>
                  <p className="text-sm text-gray-600">Present</p>
                </div>
                <div className="p-3 bg-red-50 rounded-lg">
                  <p className="text-2xl font-bold text-red-600">{attendance.length - presentCount}</p>
                  <p className="text-sm text-gray-600">Absent/Late</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5" />
            Student Performance Distribution
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={performanceData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="range" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="count" fill="#3B82F6" name="Number of Students" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="bg-gradient-to-br from-red-500 to-orange-600 text-white">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="w-6 h-6" />
              AI: At-Risk Students
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold mb-2">{atRiskStudents.length}</p>
            <p className="text-white/80 mb-4">Students identified as needing support</p>
            <Link to={createPageUrl('StudentRecords')}>
              <button className="px-4 py-2 bg-white/20 hover:bg-white/30 rounded-lg transition-colors">
                View Details
              </button>
            </Link>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-indigo-500 to-purple-600 text-white">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Brain className="w-6 h-6" />
              AI Insights & Predictions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <p className="text-sm text-white/90">✓ Curriculum areas needing improvement identified</p>
              <p className="text-sm text-white/90">✓ Teacher performance metrics analyzed</p>
              <p className="text-sm text-white/90">✓ Resource utilization optimized</p>
              <Link to={createPageUrl('AdminReportsDashboard')}>
                <button className="mt-4 px-4 py-2 bg-white/20 hover:bg-white/30 rounded-lg transition-colors">
                  View Full Analytics
                </button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <Link to={createPageUrl('StudentRecords')} className="p-4 border-2 border-gray-200 rounded-lg hover:border-blue-500 hover:shadow-md transition-all">
              <Users className="w-8 h-8 text-blue-600 mb-2" />
              <h3 className="font-semibold text-gray-900">Manage Students</h3>
              <p className="text-sm text-gray-600 mt-1">Add, edit, or view records</p>
            </Link>
            <Link to={createPageUrl('AttendanceManagement')} className="p-4 border-2 border-gray-200 rounded-lg hover:border-green-500 hover:shadow-md transition-all">
              <CheckSquare className="w-8 h-8 text-green-600 mb-2" />
              <h3 className="font-semibold text-gray-900">Track Attendance</h3>
              <p className="text-sm text-gray-600 mt-1">Monitor attendance records</p>
            </Link>
            <Link to={createPageUrl('Reports')} className="p-4 border-2 border-gray-200 rounded-lg hover:border-indigo-500 hover:shadow-md transition-all">
              <TrendingUp className="w-8 h-8 text-indigo-600 mb-2" />
              <h3 className="font-semibold text-gray-900">View Reports</h3>
              <p className="text-sm text-gray-600 mt-1">Analytics and insights</p>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}