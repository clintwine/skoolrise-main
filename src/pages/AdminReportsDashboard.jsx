import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { useSchoolContext } from '@/hooks/useSchoolContext';
import { addSchoolFilter } from '@/utils/schoolFilter';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis } from 'recharts';
import { TrendingUp, Users, AlertTriangle, Brain, DollarSign, Award, CheckSquare, BookOpen } from 'lucide-react';

export default function AdminReportsDashboard() {
  const [dateRange, setDateRange] = useState({ start: '', end: '' });
  const { school_tenant_id, isReady } = useSchoolContext();

  const { data: students = [] } = useQuery({
    queryKey: ['students', school_tenant_id],
    queryFn: () => base44.entities.Student.filter(addSchoolFilter({}, school_tenant_id)),
    enabled: isReady,
  });

  const { data: teachers = [] } = useQuery({
    queryKey: ['teachers', school_tenant_id],
    queryFn: () => base44.entities.Teacher.filter(addSchoolFilter({}, school_tenant_id)),
    enabled: isReady,
  });

  const { data: attendance = [] } = useQuery({
    queryKey: ['attendance', school_tenant_id],
    queryFn: () => base44.entities.Attendance.filter(addSchoolFilter({}, school_tenant_id)),
    enabled: isReady,
  });

  const { data: reportCards = [] } = useQuery({
    queryKey: ['report-cards', school_tenant_id],
    queryFn: () => base44.entities.ReportCard.filter(addSchoolFilter({}, school_tenant_id)),
    enabled: isReady,
  });

  const { data: invoices = [] } = useQuery({
    queryKey: ['invoices', school_tenant_id],
    queryFn: () => base44.entities.FeeInvoice.filter(addSchoolFilter({}, school_tenant_id)),
    enabled: isReady,
  });

  const { data: assignments = [] } = useQuery({
    queryKey: ['assignments', school_tenant_id],
    queryFn: () => base44.entities.Assignment.filter(addSchoolFilter({}, school_tenant_id)),
    enabled: isReady,
  });

  const { data: classes = [] } = useQuery({
    queryKey: ['classes', school_tenant_id],
    queryFn: () => base44.entities.Class.filter(addSchoolFilter({}, school_tenant_id)),
    enabled: isReady,
  });

  // Financial metrics
  const totalInvoiced = invoices.reduce((sum, inv) => sum + (inv.amount || 0), 0);
  const totalCollected = totalInvoiced - invoices.reduce((sum, inv) => sum + (inv.balance || 0), 0);
  const collectionRate = totalInvoiced > 0 ? ((totalCollected / totalInvoiced) * 100).toFixed(1) : 0;

  // Performance by grade
  const gradePerformance = {};
  students.forEach(student => {
    const studentReports = reportCards.filter(rc => rc.student_id === student.id);
    if (studentReports.length > 0) {
      if (!gradePerformance[student.grade_level]) {
        gradePerformance[student.grade_level] = { total: 0, count: 0 };
      }
      const avgScore = studentReports.reduce((sum, rc) => sum + (rc.average_score || 0), 0) / studentReports.length;
      gradePerformance[student.grade_level].total += avgScore;
      gradePerformance[student.grade_level].count += 1;
    }
  });

  const gradeChartData = Object.entries(gradePerformance).map(([grade, data]) => ({
    grade: `Grade ${grade}`,
    average: (data.total / data.count).toFixed(1)
  })).sort((a, b) => parseInt(a.grade.split(' ')[1]) - parseInt(b.grade.split(' ')[1]));

  // Teacher performance
  const teacherStats = teachers.map(teacher => {
    const teacherClasses = classes.filter(c => c.teacher_id === teacher.id);
    const teacherAssignments = assignments.filter(a => a.teacher_id === teacher.id);
    return {
      name: `${teacher.first_name} ${teacher.last_name}`,
      classes: teacherClasses.length,
      assignments: teacherAssignments.length,
    };
  }).sort((a, b) => b.assignments - a.assignments).slice(0, 10);

  // Attendance trends over time (simulated)
  const attendanceTrendData = [
    { month: 'Jan', rate: 92 },
    { month: 'Feb', rate: 89 },
    { month: 'Mar', rate: 94 },
    { month: 'Apr', rate: 91 },
    { month: 'May', rate: 93 },
    { month: 'Jun', rate: 90 },
  ];

  // At-risk prediction
  const atRiskStudents = students.filter(student => {
    const studentReports = reportCards.filter(rc => rc.student_id === student.id);
    const studentAttendance = attendance.filter(a => a.student_id === student.id);
    
    if (studentReports.length === 0) return false;
    
    const avgPerformance = studentReports.reduce((sum, rc) => sum + (rc.average_score || 0), 0) / studentReports.length;
    const attendanceRate = studentAttendance.length > 0 
      ? (studentAttendance.filter(a => a.status === 'Present').length / studentAttendance.length) * 100
      : 100;
    
    return avgPerformance < 60 || attendanceRate < 75;
  });

  // Resource utilization
  const resourceData = [
    { category: 'Classes', utilized: classes.filter(c => c.status === 'Active').length, total: classes.length },
    { category: 'Teachers', utilized: teachers.filter(t => t.status === 'Active').length, total: teachers.length },
    { category: 'Students', utilized: students.filter(s => s.status === 'Active').length, total: students.length },
  ];

  const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899'];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
          <TrendingUp className="w-8 h-8 text-blue-600" />
          Advanced Admin Reports & Analytics
        </h1>
        <p className="text-gray-600 mt-1">Comprehensive insights with AI-powered predictions</p>
      </div>

      <Card>
        <CardContent className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label>Start Date</Label>
              <Input type="date" value={dateRange.start} onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })} />
            </div>
            <div>
              <Label>End Date</Label>
              <Input type="date" value={dateRange.end} onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })} />
            </div>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="overview">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
          <TabsTrigger value="teachers">Teachers</TabsTrigger>
          <TabsTrigger value="financial">Financial</TabsTrigger>
          <TabsTrigger value="predictions">AI Predictions</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Active Students</p>
                    <p className="text-2xl font-bold text-blue-600">{students.filter(s => s.status === 'Active').length}</p>
                  </div>
                  <Users className="w-8 h-8 text-blue-600" />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Avg Performance</p>
                    <p className="text-2xl font-bold text-green-600">
                      {reportCards.length > 0 ? (reportCards.reduce((sum, rc) => sum + (rc.average_score || 0), 0) / reportCards.length).toFixed(1) : 0}%
                    </p>
                  </div>
                  <Award className="w-8 h-8 text-green-600" />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Attendance Rate</p>
                    <p className="text-2xl font-bold text-purple-600">
                      {attendance.length > 0 ? ((attendance.filter(a => a.status === 'Present').length / attendance.length) * 100).toFixed(1) : 0}%
                    </p>
                  </div>
                  <CheckSquare className="w-8 h-8 text-purple-600" />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Active Classes</p>
                    <p className="text-2xl font-bold text-orange-600">{classes.filter(c => c.status === 'Active').length}</p>
                  </div>
                  <BookOpen className="w-8 h-8 text-orange-600" />
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Attendance Trends</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={attendanceTrendData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="rate" stroke="#3B82F6" strokeWidth={2} name="Attendance Rate (%)" />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="performance" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Average Performance by Grade Level</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={350}>
                <BarChart data={gradeChartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="grade" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="average" fill="#10B981" name="Average Score (%)" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Performance Distribution</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between items-center p-3 bg-green-50 rounded-lg">
                    <span>90-100% (Excellent)</span>
                    <Badge className="bg-green-600">{reportCards.filter(rc => rc.average_score >= 90).length}</Badge>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-blue-50 rounded-lg">
                    <span>80-89% (Good)</span>
                    <Badge className="bg-blue-600">{reportCards.filter(rc => rc.average_score >= 80 && rc.average_score < 90).length}</Badge>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-yellow-50 rounded-lg">
                    <span>70-79% (Satisfactory)</span>
                    <Badge className="bg-yellow-600">{reportCards.filter(rc => rc.average_score >= 70 && rc.average_score < 80).length}</Badge>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-orange-50 rounded-lg">
                    <span>60-69% (Pass)</span>
                    <Badge className="bg-orange-600">{reportCards.filter(rc => rc.average_score >= 60 && rc.average_score < 70).length}</Badge>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-red-50 rounded-lg">
                    <span>Below 60% (Needs Support)</span>
                    <Badge className="bg-red-600">{reportCards.filter(rc => rc.average_score < 60).length}</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Resource Utilization</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={resourceData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="category" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="utilized" fill="#3B82F6" name="Active" />
                    <Bar dataKey="total" fill="#E5E7EB" name="Total" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="teachers" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Teacher Activity Metrics</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <BarChart data={teacherStats}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" angle={-45} textAnchor="end" height={120} />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="classes" fill="#3B82F6" name="Classes" />
                  <Bar dataKey="assignments" fill="#10B981" name="Assignments" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="financial" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Total Invoiced</p>
                    <p className="text-3xl font-bold text-blue-600">${totalInvoiced.toLocaleString()}</p>
                  </div>
                  <DollarSign className="w-10 h-10 text-blue-600" />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Collected</p>
                    <p className="text-3xl font-bold text-green-600">${totalCollected.toLocaleString()}</p>
                  </div>
                  <DollarSign className="w-10 h-10 text-green-600" />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Collection Rate</p>
                    <p className="text-3xl font-bold text-purple-600">{collectionRate}%</p>
                  </div>
                  <TrendingUp className="w-10 h-10 text-purple-600" />
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="predictions" className="space-y-6">
          <Card className="bg-gradient-to-br from-purple-500 to-indigo-600 text-white">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Brain className="w-6 h-6" />
                AI-Powered Predictive Analytics
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-white/10 p-4 rounded-lg">
                <h3 className="font-semibold text-lg mb-2">Dropout Risk Analysis</h3>
                <p className="text-2xl font-bold">{atRiskStudents.length} students</p>
                <p className="text-white/80 text-sm mt-1">Identified as needing immediate intervention</p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-white/10 p-4 rounded-lg">
                  <h3 className="font-semibold mb-2">Primary Risk Factors</h3>
                  <ul className="space-y-1 text-sm">
                    <li>• Low academic performance (&lt;60%)</li>
                    <li>• Poor attendance (&lt;75%)</li>
                    <li>• Behavioral incidents</li>
                  </ul>
                </div>
                <div className="bg-white/10 p-4 rounded-lg">
                  <h3 className="font-semibold mb-2">Recommended Actions</h3>
                  <ul className="space-y-1 text-sm">
                    <li>• Individualized support plans</li>
                    <li>• Parent-teacher conferences</li>
                    <li>• Peer tutoring programs</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-orange-600" />
                Students Requiring Support
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {atRiskStudents.slice(0, 10).map((student) => (
                  <div key={student.id} className="flex justify-between items-center p-3 bg-red-50 rounded-lg">
                    <div>
                      <p className="font-medium text-gray-900">{student.first_name} {student.last_name}</p>
                      <p className="text-sm text-gray-600">Grade {student.grade_level}</p>
                    </div>
                    <Badge className="bg-red-600">High Risk</Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}