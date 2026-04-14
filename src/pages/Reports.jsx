import React from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { FileText, Download, Calendar, Users, DollarSign, TrendingUp, BarChart3 } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { Link } from 'react-router-dom';
import { createPageUrl } from '../utils';

export default function Reports() {
  const { data: students = [] } = useQuery({
    queryKey: ['students'],
    queryFn: () => base44.entities.Student.list(),
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

  const { data: teachers = [] } = useQuery({
    queryKey: ['teachers'],
    queryFn: () => base44.entities.Teacher.list(),
  });

  const generateCSV = (data, headers, filename) => {
    const csvContent = [
      headers.join(','),
      ...data.map(row => headers.map(h => `"${row[h] || ''}"`).join(','))
    ].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${filename}_${format(new Date(), 'yyyy-MM-dd')}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const generateStudentReport = () => {
    const data = students.map(s => ({
      student_id_number: s.student_id_number,
      first_name: s.first_name,
      last_name: s.last_name,
      grade_level: s.grade_level,
      status: s.status,
      email: s.email || '',
      phone: s.phone || '',
    }));
    generateCSV(data, ['student_id_number', 'first_name', 'last_name', 'grade_level', 'status', 'email', 'phone'], 'student_report');
    toast.success('Student report generated successfully!');
  };

  const generateAttendanceReport = () => {
    const data = attendance.map(a => ({
      date: a.date,
      student_name: a.student_name,
      class_name: a.class_name,
      status: a.status,
      type: a.type,
    }));
    generateCSV(data, ['date', 'student_name', 'class_name', 'status', 'type'], 'attendance_report');
    toast.success('Attendance report generated successfully!');
  };

  const generateFinancialReport = () => {
    const data = invoices.map(i => ({
      invoice_number: i.invoice_number,
      student_name: i.student_name,
      total_amount: i.total_amount,
      amount_paid: i.amount_paid,
      balance: i.balance,
      status: i.status,
      due_date: i.due_date,
    }));
    generateCSV(data, ['invoice_number', 'student_name', 'total_amount', 'amount_paid', 'balance', 'status', 'due_date'], 'financial_report');
    toast.success('Financial report generated successfully!');
  };

  const generateAcademicReport = () => {
    const data = reportCards.map(r => ({
      student_name: r.student_name,
      session: r.session_name,
      term: r.term_name,
      total_score: r.total_score,
      average_score: r.average_score,
      grade: r.grade,
      position: r.position,
    }));
    generateCSV(data, ['student_name', 'session', 'term', 'total_score', 'average_score', 'grade', 'position'], 'academic_report');
    toast.success('Academic report generated successfully!');
  };

  const generatePerformanceReport = () => {
    const data = reportCards.map(r => ({
      student_name: r.student_name,
      average_score: r.average_score,
      grade: r.grade,
      position: r.position,
      session: r.session_name,
    }));
    generateCSV(data, ['student_name', 'average_score', 'grade', 'position', 'session'], 'performance_report');
    toast.success('Performance report generated successfully!');
  };

  const generateStaffReport = () => {
    const data = teachers.map(t => ({
      staff_id: t.staff_id,
      first_name: t.first_name,
      last_name: t.last_name,
      department: t.department,
      position: t.position,
      status: t.status,
      phone: t.phone || '',
    }));
    generateCSV(data, ['staff_id', 'first_name', 'last_name', 'department', 'position', 'status', 'phone'], 'staff_report');
    toast.success('Staff report generated successfully!');
  };
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Reports & Analytics</h1>
        <p className="text-gray-600 mt-1">Generate and download various reports</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card className="bg-white shadow-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="w-5 h-5 text-blue-600" />
              Student Reports
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm text-gray-600">Generate student enrollment and performance reports</p>
            <div className="grid gap-2">
              <Button variant="outline" size="sm" className="w-full" onClick={generateStudentReport}>
                <Download className="w-4 h-4 mr-2" />
                Quick CSV Export
              </Button>
              <Link to={createPageUrl('StudentPerformanceReports')}>
                <Button size="sm" className="w-full bg-blue-600 hover:bg-blue-700">
                  <BarChart3 className="w-4 h-4 mr-2" />
                  Open Report Module
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white shadow-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="w-5 h-5 text-green-600" />
              Attendance Reports
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm text-gray-600">Download attendance statistics and summaries</p>
            <Button variant="outline" size="sm" className="w-full" onClick={generateAttendanceReport}>
              <Download className="w-4 h-4 mr-2" />
              Generate Report
            </Button>
          </CardContent>
        </Card>

        <Card className="bg-white shadow-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="w-5 h-5 text-orange-600" />
              Financial Reports
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm text-gray-600">View fee collection and expense reports</p>
            <Button variant="outline" size="sm" className="w-full" onClick={generateFinancialReport}>
              <Download className="w-4 h-4 mr-2" />
              Generate Report
            </Button>
          </CardContent>
        </Card>

        <Card className="bg-white shadow-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5 text-purple-600" />
              Academic Reports
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm text-gray-600">Generate grade sheets and academic summaries</p>
            <Button variant="outline" size="sm" className="w-full" onClick={generateAcademicReport}>
              <Download className="w-4 h-4 mr-2" />
              Generate Report
            </Button>
          </CardContent>
        </Card>

        <Card className="bg-white shadow-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-red-600" />
              Performance Analytics
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm text-gray-600">Analyze student and school performance trends</p>
            <Button variant="outline" size="sm" className="w-full" onClick={generatePerformanceReport}>
              <Download className="w-4 h-4 mr-2" />
              Generate Report
            </Button>
          </CardContent>
        </Card>

        <Card className="bg-white shadow-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="w-5 h-5 text-indigo-600" />
              Staff Reports
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm text-gray-600">Generate teacher and staff reports</p>
            <Button variant="outline" size="sm" className="w-full" onClick={generateStaffReport}>
              <Download className="w-4 h-4 mr-2" />
              Generate Report
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}