import React, { useState, useMemo } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, GraduationCap, BookOpen, TrendingUp, CheckSquare, Award, DollarSign, AlertTriangle, Brain, Settings } from 'lucide-react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '../utils';
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { useCurrency } from '@/components/CurrencyProvider';
import AIInsightsWidget from '../components/dashboard/AIInsightsWidget';
import PredictiveAlerts from '../components/dashboard/PredictiveAlerts';
import DashboardWidgetGrid from '../components/dashboard/DashboardWidgetGrid';
import AcademicRiskBoard from '../components/analytics/AcademicRiskBoard';
import RiskSummaryCards from '../components/analytics/RiskSummaryCards';
import ErrorBoundary from '../components/ErrorBoundary';
import { DashboardSkeleton } from '../components/SkeletonLoader';
import ImplementationPriorityBoard from '../components/admin/ImplementationPriorityBoard';

export default function AdminDashboard() {
  const { formatAmount } = useCurrency();
  const [widgetLayout, setWidgetLayout] = useState(null);

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

  const { data: behaviors = [] } = useQuery({
    queryKey: ['behavior-records'],
    queryFn: () => base44.entities.Behavior.list('-date', 200),
  });

  const { data: implementationEpics = [] } = useQuery({
    queryKey: ['implementation-epics'],
    queryFn: () => base44.entities.ImplementationEpic.list('recommended_order'),
  });

  // Memoized calculations for performance
  const metrics = useMemo(() => {
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

    return {
      activeStudents, activeTeachers, activeClasses,
      totalInvoiced, totalCollected, totalOutstanding,
      presentCount, attendanceRate, avgScore
    };
  }, [students, teachers, classes, invoices, attendance, reportCards]);

  const { activeStudents, activeTeachers, activeClasses, totalInvoiced, totalCollected, totalOutstanding, presentCount, attendanceRate, avgScore } = metrics;

  // Memoized performance distribution
  const performanceData = useMemo(() => [
    { range: '90-100%', count: reportCards.filter(rc => rc.average_score >= 90).length },
    { range: '80-89%', count: reportCards.filter(rc => rc.average_score >= 80 && rc.average_score < 90).length },
    { range: '70-79%', count: reportCards.filter(rc => rc.average_score >= 70 && rc.average_score < 80).length },
    { range: '60-69%', count: reportCards.filter(rc => rc.average_score >= 60 && rc.average_score < 70).length },
    { range: 'Below 60%', count: reportCards.filter(rc => rc.average_score < 60).length },
  ], [reportCards]);

  const academicRiskStudents = useMemo(() => {
    return students.map((student) => {
      const studentAttendance = attendance.filter(record => record.student_id === student.id);
      const presentCount = studentAttendance.filter(record => record.status === 'Present').length;
      const attendanceRate = studentAttendance.length > 0 ? Math.round((presentCount / studentAttendance.length) * 100) : 100;

      const studentReports = reportCards.filter(report => report.student_id === student.id);
      const averageScore = studentReports.length > 0
        ? Math.round(studentReports.reduce((sum, report) => sum + (report.average_score || 0), 0) / studentReports.length)
        : 100;

      const studentInvoices = invoices.filter(invoice => invoice.student_id === student.id);
      const outstandingBalance = studentInvoices.reduce((sum, invoice) => sum + (invoice.balance || 0), 0);

      const studentBehaviors = behaviors.filter(record => record.student_id === student.id);
      const negativeBehaviorCount = studentBehaviors.filter(record => ['Demerit', 'Warning', 'Detention'].includes(record.type)).length;

      const riskSignals = [
        attendanceRate < 75,
        averageScore < 60,
        outstandingBalance > 0,
        negativeBehaviorCount >= 3,
      ].filter(Boolean).length;

      if (riskSignals === 0) return null;

      const reasonParts = [];
      const recommendedActions = [];

      if (attendanceRate < 75) {
        reasonParts.push('low attendance');
        recommendedActions.push('Contact parent about attendance');
      }
      if (averageScore < 60) {
        reasonParts.push('low academic performance');
        recommendedActions.push('Schedule academic intervention');
      }
      if (outstandingBalance > 0) {
        reasonParts.push('fee balance outstanding');
        recommendedActions.push('Send fee reminder');
      }
      if (negativeBehaviorCount >= 3) {
        reasonParts.push('repeat behavior incidents');
        recommendedActions.push('Book behavior follow-up');
      }

      return {
        id: student.id,
        student_name: `${student.first_name} ${student.last_name}`,
        attendanceRate,
        averageScore,
        outstandingBalance: formatAmount(outstandingBalance),
        riskLevel: riskSignals >= 3 ? 'High' : 'Medium',
        reason: reasonParts.join(', '),
        riskSignals,
        recommendedAction: recommendedActions[0],
      };
    }).filter(Boolean).sort((a, b) => (a.riskLevel === 'High' ? -1 : 1)).slice(0, 6);
  }, [students, attendance, reportCards, invoices, behaviors, formatAmount]);

  const riskStats = {
    total: academicRiskStudents.length,
    high: academicRiskStudents.filter((student) => student.riskLevel === 'High').length,
    medium: academicRiskStudents.filter((student) => student.riskLevel === 'Medium').length,
  };

  const COLORS = ['#10B981', '#3B82F6', '#F59E0B', '#EF4444', '#8B5CF6'];

  const stats = [
    { title: 'Total Students', value: activeStudents, icon: Users, color: 'bg-blue-500', link: 'StudentRecords' },
    { title: 'Active Teachers', value: activeTeachers, icon: GraduationCap, color: 'bg-green-500', link: 'TeacherManagement' },
    { title: 'Active Classes', value: activeClasses, icon: BookOpen, color: 'bg-purple-500', link: 'ActiveClasses', clickable: true },
    { title: 'Avg Performance', value: `${avgScore}%`, icon: Award, color: 'bg-orange-500', link: null, clickable: false },
  ];

  const isLoading = !students.length && !teachers.length && !classes.length;

  if (isLoading) {
    return <DashboardSkeleton />;
  }

  return (
    <ErrorBoundary fallbackMessage="Unable to load dashboard. Please refresh the page.">
    <DashboardWidgetGrid onLayoutChange={setWidgetLayout}>
      {({ isWidgetEnabled }) => (
    <div className="space-y-4 sm:space-y-6 p-4 sm:p-0">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 sm:gap-0">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Admin Dashboard</h1>
          <p className="text-sm sm:text-base text-gray-600 mt-1">School overview, analytics, live alerts, and AI recommendations</p>
        </div>
        <Link to={createPageUrl('AdminReportsDashboard')}>
          <button className="px-3 py-2 sm:px-4 sm:py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2 text-sm sm:text-base">
            <TrendingUp className="w-4 h-4 sm:w-5 sm:h-5" />
            Advanced Reports
          </button>
        </Link>
      </div>

      {isWidgetEnabled('students') && (
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {stats.map((stat) => {
          const Icon = stat.icon;
          const content = (
            <Card className={`${stat.clickable !== false ? 'hover:shadow-lg cursor-pointer' : ''} transition-shadow bg-white`}>
              <CardContent className="p-4 sm:p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs sm:text-sm font-medium text-gray-600">{stat.title}</p>
                    <p className="text-xl sm:text-3xl font-bold text-gray-900 mt-1 sm:mt-2">{stat.value}</p>
                  </div>
                  <div className={`${stat.color} p-2 sm:p-3 rounded-lg`}>
                    <Icon className="w-4 h-4 sm:w-6 sm:h-6 text-white" />
                  </div>
                </div>
              </CardContent>
            </Card>
          );
          
          if (stat.link) {
            return (
              <Link key={stat.title} to={createPageUrl(stat.link)}>
                {content}
              </Link>
            );
          }
          return <div key={stat.title}>{content}</div>;
        })}
      </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        {isWidgetEnabled('financial') && (
        <Card>
          <CardHeader className="p-4 sm:p-6">
            <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
              <DollarSign className="w-4 h-4 sm:w-5 sm:h-5" />
              Financial Summary
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 sm:p-6 pt-0 sm:pt-0">
            <div className="space-y-3 sm:space-y-4">
                <div className="flex justify-between items-center p-2 sm:p-3 bg-blue-50 rounded-lg">
                  <span className="text-xs sm:text-sm text-gray-700">Total Invoiced</span>
                  <span className="text-base sm:text-xl font-bold text-blue-600">{formatAmount(totalInvoiced)}</span>
                </div>
                <div className="flex justify-between items-center p-2 sm:p-3 bg-green-50 rounded-lg">
                  <span className="text-xs sm:text-sm text-gray-700">Collected</span>
                  <span className="text-base sm:text-xl font-bold text-green-600">{formatAmount(totalCollected)}</span>
                </div>
                <div className="flex justify-between items-center p-2 sm:p-3 bg-red-50 rounded-lg">
                  <span className="text-xs sm:text-sm text-gray-700">Outstanding</span>
                  <span className="text-base sm:text-xl font-bold text-red-600">{formatAmount(totalOutstanding)}</span>
                </div>
              </div>
          </CardContent>
        </Card>
        )}

        {isWidgetEnabled('attendance') && (
        <Card>
          <CardHeader className="p-4 sm:p-6">
            <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
              <CheckSquare className="w-4 h-4 sm:w-5 sm:h-5" />
              Attendance Overview
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 sm:p-6 pt-0 sm:pt-0">
            <div className="text-center py-6 sm:py-8">
              <div className="text-4xl sm:text-5xl font-bold text-green-600 mb-2">{attendanceRate}%</div>
              <p className="text-sm sm:text-base text-gray-600">Overall Attendance Rate</p>
              <div className="grid grid-cols-2 gap-3 sm:gap-4 mt-4 sm:mt-6">
                <div className="p-2 sm:p-3 bg-green-50 rounded-lg">
                  <p className="text-xl sm:text-2xl font-bold text-green-600">{presentCount}</p>
                  <p className="text-xs sm:text-sm text-gray-600">Present</p>
                </div>
                <div className="p-2 sm:p-3 bg-red-50 rounded-lg">
                  <p className="text-xl sm:text-2xl font-bold text-red-600">{attendance.length - presentCount}</p>
                  <p className="text-xs sm:text-sm text-gray-600">Absent/Late</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
        )}
      </div>

      {isWidgetEnabled('performance') && (
      <Card>
        <CardHeader className="p-4 sm:p-6">
          <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
            <TrendingUp className="w-4 h-4 sm:w-5 sm:h-5" />
            Student Performance Distribution
          </CardTitle>
        </CardHeader>
        <CardContent className="p-4 sm:p-6 pt-0 sm:pt-0">
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={performanceData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="range" style={{ fontSize: '12px' }} />
              <YAxis style={{ fontSize: '12px' }} />
              <Tooltip />
              <Legend />
              <Bar dataKey="count" fill="#3B82F6" name="Number of Students" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        {isWidgetEnabled('at-risk') && (
        <PredictiveAlerts />
        )}

        {isWidgetEnabled('ai-insights') && (
        <AIInsightsWidget />
        )}
      </div>

      <div className="space-y-4">
        <RiskSummaryCards stats={riskStats} />
        <AcademicRiskBoard students={academicRiskStudents} />
      </div>


      {isWidgetEnabled('quick-actions') && (
      <Card>
        <CardHeader className="p-4 sm:p-6">
          <CardTitle className="text-base sm:text-lg">Quick Actions</CardTitle>
        </CardHeader>
        <CardContent className="p-4 sm:p-6 pt-0 sm:pt-0">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
            <Link to={createPageUrl('StudentRecords')} className="p-3 sm:p-4 border-2 border-gray-200 rounded-lg hover:border-blue-500 hover:shadow-md transition-all">
              <Users className="w-6 h-6 sm:w-8 sm:h-8 text-blue-600 mb-2" />
              <h3 className="font-semibold text-sm sm:text-base text-gray-900">Manage Students</h3>
              <p className="text-xs sm:text-sm text-gray-600 mt-1">Add, edit, or view records</p>
            </Link>
            <Link to={createPageUrl('UnifiedAttendance')} className="p-3 sm:p-4 border-2 border-gray-200 rounded-lg hover:border-green-500 hover:shadow-md transition-all">
              <CheckSquare className="w-6 h-6 sm:w-8 sm:h-8 text-green-600 mb-2" />
              <h3 className="font-semibold text-sm sm:text-base text-gray-900">Track Attendance</h3>
              <p className="text-xs sm:text-sm text-gray-600 mt-1">Monitor attendance records</p>
            </Link>
            <Link to={createPageUrl('Reports')} className="p-3 sm:p-4 border-2 border-gray-200 rounded-lg hover:border-indigo-500 hover:shadow-md transition-all">
              <TrendingUp className="w-6 h-6 sm:w-8 sm:h-8 text-indigo-600 mb-2" />
              <h3 className="font-semibold text-sm sm:text-base text-gray-900">View Reports</h3>
              <p className="text-xs sm:text-sm text-gray-600 mt-1">Analytics and insights</p>
            </Link>
          </div>
        </CardContent>
      </Card>
      )}
    </div>
      )}
    </DashboardWidgetGrid>
    </ErrorBoundary>
  );
}