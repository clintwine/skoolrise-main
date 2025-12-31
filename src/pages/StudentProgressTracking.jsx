import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Target, TrendingUp, TrendingDown, AlertCircle, Plus } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

export default function StudentProgressTracking() {
  const [selectedStudent, setSelectedStudent] = useState('');
  const [isGoalFormOpen, setIsGoalFormOpen] = useState(false);
  const [goalData, setGoalData] = useState({
    student_id: '',
    goal_title: '',
    subject: '',
    target_score: '',
    current_score: '',
    deadline: '',
    notes: ''
  });
  const queryClient = useQueryClient();

  const { data: user } = useQuery({
    queryKey: ['current-user'],
    queryFn: () => base44.auth.me(),
  });

  const { data: teachers = [] } = useQuery({
    queryKey: ['teachers', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      return await base44.entities.Teacher.filter({ user_id: user.id });
    },
    enabled: !!user?.id,
  });

  const teacherProfile = teachers[0];
  const isAdmin = user?.role === 'admin' || user?.user_types?.includes('admin');

  const { data: teacherClasses = [] } = useQuery({
    queryKey: ['teacher-classes', teacherProfile?.id],
    queryFn: async () => {
      if (!teacherProfile?.id) return [];
      return await base44.entities.Class.filter({ teacher_id: teacherProfile.id });
    },
    enabled: !!teacherProfile?.id && !!user && !isAdmin,
  });

  const { data: enrollments = [] } = useQuery({
    queryKey: ['class-enrollments', teacherClasses],
    queryFn: async () => {
      if (teacherClasses.length === 0) return [];
      const classIds = teacherClasses.map(c => c.id);
      const allEnrollments = await base44.entities.Enrollment.list();
      return allEnrollments.filter(e => classIds.includes(e.class_id));
    },
    enabled: teacherClasses.length > 0 && !!user && !isAdmin,
  });

  const { data: students = [] } = useQuery({
    queryKey: ['students', isAdmin, enrollments],
    queryFn: async () => {
      const allStudents = await base44.entities.Student.list();
      if (isAdmin) {
        return allStudents;
      }
      if (teacherProfile?.id && enrollments.length > 0) {
        const studentIds = enrollments.map(e => e.student_id);
        return allStudents.filter(s => studentIds.includes(s.id));
      }
      return [];
    },
    enabled: !!user && (isAdmin || (!!teacherProfile && enrollments !== undefined)),
  });

  const { data: submissions = [] } = useQuery({
    queryKey: ['submissions', selectedStudent],
    queryFn: async () => {
      const allSubmissions = await base44.entities.Submission.list();
      return selectedStudent ? allSubmissions.filter(s => s.student_id === selectedStudent && s.status === 'Graded') : [];
    },
    enabled: !!selectedStudent,
  });

  const { data: reportCards = [] } = useQuery({
    queryKey: ['report-cards', selectedStudent],
    queryFn: async () => {
      const allReports = await base44.entities.ReportCard.list();
      return selectedStudent ? allReports.filter(rc => rc.student_id === selectedStudent) : [];
    },
    enabled: !!selectedStudent,
  });

  const selectedStudentData = students.find(s => s.id === selectedStudent);

  // Calculate performance trends
  const performanceData = submissions
    .sort((a, b) => new Date(a.submitted_date) - new Date(b.submitted_date))
    .map((sub, idx) => ({
      index: idx + 1,
      grade: sub.grade,
      date: new Date(sub.submitted_date).toLocaleDateString()
    }));

  // Calculate statistics
  const avgGrade = submissions.length > 0 
    ? (submissions.reduce((sum, s) => sum + (s.grade || 0), 0) / submissions.length).toFixed(1)
    : 0;

  const recentSubmissions = submissions.slice(-5);
  const recentAvg = recentSubmissions.length > 0
    ? (recentSubmissions.reduce((sum, s) => sum + (s.grade || 0), 0) / recentSubmissions.length).toFixed(1)
    : 0;

  const trend = recentAvg > avgGrade ? 'improving' : recentAvg < avgGrade ? 'declining' : 'stable';

  // Identify struggling areas
  const assignmentsBySubject = {};
  submissions.forEach(sub => {
    const subject = sub.assignment_id; // Simplified - in real app would link to actual subject
    if (!assignmentsBySubject[subject]) {
      assignmentsBySubject[subject] = [];
    }
    assignmentsBySubject[subject].push(sub.grade || 0);
  });

  const subjectAverages = Object.entries(assignmentsBySubject).map(([subject, grades]) => ({
    subject,
    average: (grades.reduce((sum, g) => sum + g, 0) / grades.length).toFixed(1),
    count: grades.length
  })).sort((a, b) => a.average - b.average);

  const handleOpenGoalForm = () => {
    setGoalData({ ...goalData, student_id: selectedStudent });
    setIsGoalFormOpen(true);
  };

  const needsSupport = avgGrade < 70;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
          <Target className="w-8 h-8 text-blue-600" />
          Student Progress Tracking
        </h1>
        <p className="text-gray-600 mt-1">Monitor and analyze student performance over time</p>
      </div>

      <Card>
        <CardContent className="p-4">
          <Select value={selectedStudent} onValueChange={setSelectedStudent}>
            <SelectTrigger>
              <SelectValue placeholder="Select a student" />
            </SelectTrigger>
            <SelectContent>
              {students.map((student) => (
                <SelectItem key={student.id} value={student.id}>
                  {student.first_name} {student.last_name} - Grade {student.grade_level}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {selectedStudent && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Overall Average</p>
                    <p className="text-2xl font-bold text-blue-600">{avgGrade}%</p>
                  </div>
                  <Target className="w-8 h-8 text-blue-600" />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Recent Average</p>
                    <p className="text-2xl font-bold text-green-600">{recentAvg}%</p>
                  </div>
                  {trend === 'improving' ? <TrendingUp className="w-8 h-8 text-green-600" /> : 
                   trend === 'declining' ? <TrendingDown className="w-8 h-8 text-red-600" /> :
                   <TrendingUp className="w-8 h-8 text-gray-400" />}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Submissions</p>
                    <p className="text-2xl font-bold text-purple-600">{submissions.length}</p>
                  </div>
                  <Badge className={trend === 'improving' ? 'bg-green-100 text-green-800' : 
                                   trend === 'declining' ? 'bg-red-100 text-red-800' : 
                                   'bg-gray-100 text-gray-800'}>
                    {trend}
                  </Badge>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Status</p>
                    <Badge className={needsSupport ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'}>
                      {needsSupport ? 'Needs Support' : 'On Track'}
                    </Badge>
                  </div>
                  {needsSupport && <AlertCircle className="w-8 h-8 text-red-600" />}
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Performance Trend Over Time</CardTitle>
            </CardHeader>
            <CardContent>
              {performanceData.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={performanceData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="index" label={{ value: 'Assignment Number', position: 'insideBottom', offset: -5 }} />
                    <YAxis label={{ value: 'Grade (%)', angle: -90, position: 'insideLeft' }} />
                    <Tooltip />
                    <Legend />
                    <Line type="monotone" dataKey="grade" stroke="#3B82F6" strokeWidth={2} name="Grade" />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <p className="text-center text-gray-500 py-8">No graded submissions yet</p>
              )}
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Subject Performance</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {subjectAverages.slice(0, 5).map((subject, idx) => (
                    <div key={idx} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <span className="font-medium text-gray-900">Assignment {subject.subject}</span>
                      <div className="flex items-center gap-3">
                        <Badge className={subject.average >= 70 ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}>
                          {subject.average}%
                        </Badge>
                        <span className="text-sm text-gray-600">({subject.count} assignments)</span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <CardTitle>Learning Goals</CardTitle>
                  <Button onClick={handleOpenGoalForm} size="sm" className="bg-blue-600 hover:bg-blue-700">
                    <Plus className="w-4 h-4 mr-2" />
                    Set Goal
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-gray-500 text-center py-8">Goal setting feature - to be implemented</p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Report Cards History</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {reportCards.map((report) => (
                  <div key={report.id} className="flex justify-between items-center p-4 bg-gray-50 rounded-lg">
                    <div>
                      <p className="font-semibold">{report.term_name} - {report.session_name}</p>
                      <p className="text-sm text-gray-600">Position: {report.position}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold text-blue-600">{report.average_score}%</p>
                      <p className="text-sm text-gray-600">Average Score</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}