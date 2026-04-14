import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Target, TrendingUp, TrendingDown, AlertCircle, Plus, CheckCircle, Clock, X } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import StudentInsightCards from '../components/ai/StudentInsightCards';

export default function StudentProgressTracking() {
  const [selectedStudent, setSelectedStudent] = useState('');
  const [isGoalFormOpen, setIsGoalFormOpen] = useState(false);
  const [goalData, setGoalData] = useState({
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

  const { data: students = [] } = useQuery({
    queryKey: ['students'],
    queryFn: () => base44.entities.Student.list(),
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

  const { data: goals = [] } = useQuery({
    queryKey: ['student-goals', selectedStudent],
    queryFn: () => base44.entities.StudentGoal.filter({ student_id: selectedStudent }),
    enabled: !!selectedStudent,
  });

  const selectedStudentData = students.find(s => s.id === selectedStudent);

  const createGoalMutation = useMutation({
    mutationFn: (data) => base44.entities.StudentGoal.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries(['student-goals']);
      toast.success('Goal created successfully');
      setIsGoalFormOpen(false);
      setGoalData({ goal_title: '', subject: '', target_score: '', current_score: '', deadline: '', notes: '' });
    },
    onError: (error) => {
      toast.error('Failed to create goal: ' + error.message);
    }
  });

  const updateGoalMutation = useMutation({
    mutationFn: ({ id, status }) => base44.entities.StudentGoal.update(id, { status }),
    onSuccess: () => {
      queryClient.invalidateQueries(['student-goals']);
      toast.success('Goal updated');
    }
  });

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
    const subject = sub.assignment_id;
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
    setGoalData({ goal_title: '', subject: '', target_score: '', current_score: '', deadline: '', notes: '' });
    setIsGoalFormOpen(true);
  };

  const handleSubmitGoal = () => {
    if (!goalData.goal_title || !goalData.target_score) {
      toast.error('Please fill in goal title and target score');
      return;
    }

    createGoalMutation.mutate({
      student_id: selectedStudent,
      student_name: selectedStudentData ? `${selectedStudentData.first_name} ${selectedStudentData.last_name}` : '',
      teacher_id: teacherProfile?.id || '',
      goal_title: goalData.goal_title,
      subject: goalData.subject,
      target_score: parseFloat(goalData.target_score),
      current_score: goalData.current_score ? parseFloat(goalData.current_score) : 0,
      deadline: goalData.deadline,
      notes: goalData.notes,
      status: 'In Progress'
    });
  };

  const needsSupport = avgGrade < 70;

  const getStatusColor = (status) => {
    switch (status) {
      case 'Achieved': return 'bg-green-100 text-green-800';
      case 'Not Achieved': return 'bg-red-100 text-red-800';
      case 'Cancelled': return 'bg-gray-100 text-gray-800';
      default: return 'bg-blue-100 text-blue-800';
    }
  };

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
          <StudentInsightCards
            avgGrade={avgGrade}
            recentAvg={recentAvg}
            submissionsCount={submissions.length}
            needsSupport={needsSupport}
            trend={trend}
          />

          <Card>
            <CardHeader>
              <CardTitle>Performance Trend Over Time</CardTitle>
              {subjectAverages[0] && (
                <p className="text-sm text-gray-500">Lowest-performing area currently: Assignment {subjectAverages[0].subject} at {subjectAverages[0].average}%</p>
              )}
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
                {goals.length === 0 ? (
                  <p className="text-gray-500 text-center py-8">No goals set yet. Click "Set Goal" to create one.</p>
                ) : (
                  <div className="space-y-3">
                    {goals.map((goal) => (
                      <div key={goal.id} className="p-4 border rounded-lg">
                        <div className="flex justify-between items-start mb-2">
                          <div>
                            <p className="font-semibold">{goal.goal_title}</p>
                            {goal.subject && <p className="text-sm text-gray-600">{goal.subject}</p>}
                          </div>
                          <Badge className={getStatusColor(goal.status)}>{goal.status}</Badge>
                        </div>
                        <div className="flex items-center gap-4 text-sm text-gray-600 mb-2">
                          <span>Target: {goal.target_score}%</span>
                          {goal.current_score > 0 && <span>Current: {goal.current_score}%</span>}
                          {goal.deadline && <span>Due: {new Date(goal.deadline).toLocaleDateString()}</span>}
                        </div>
                        {goal.status === 'In Progress' && (
                          <div className="flex gap-2 mt-2">
                            <Button 
                              size="sm" 
                              variant="outline" 
                              className="text-green-600 hover:bg-green-50"
                              onClick={() => updateGoalMutation.mutate({ id: goal.id, status: 'Achieved' })}
                            >
                              <CheckCircle className="w-3 h-3 mr-1" /> Achieved
                            </Button>
                            <Button 
                              size="sm" 
                              variant="outline" 
                              className="text-red-600 hover:bg-red-50"
                              onClick={() => updateGoalMutation.mutate({ id: goal.id, status: 'Not Achieved' })}
                            >
                              <X className="w-3 h-3 mr-1" /> Not Achieved
                            </Button>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Report Cards History</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {reportCards.length === 0 ? (
                  <p className="text-gray-500 text-center py-8">No report cards found</p>
                ) : (
                  reportCards.map((report) => (
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
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </>
      )}

      {/* Goal Form Dialog */}
      <Dialog open={isGoalFormOpen} onOpenChange={setIsGoalFormOpen}>
        <DialogContent className="bg-white max-w-md">
          <DialogHeader>
            <DialogTitle>Set Learning Goal for {selectedStudentData?.first_name} {selectedStudentData?.last_name}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Goal Title *</Label>
              <Input
                value={goalData.goal_title}
                onChange={(e) => setGoalData({ ...goalData, goal_title: e.target.value })}
                placeholder="e.g., Improve Math Grade"
              />
            </div>
            <div>
              <Label>Subject</Label>
              <Input
                value={goalData.subject}
                onChange={(e) => setGoalData({ ...goalData, subject: e.target.value })}
                placeholder="e.g., Mathematics"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Target Score (%) *</Label>
                <Input
                  type="number"
                  value={goalData.target_score}
                  onChange={(e) => setGoalData({ ...goalData, target_score: e.target.value })}
                  placeholder="e.g., 85"
                />
              </div>
              <div>
                <Label>Current Score (%)</Label>
                <Input
                  type="number"
                  value={goalData.current_score}
                  onChange={(e) => setGoalData({ ...goalData, current_score: e.target.value })}
                  placeholder="e.g., 70"
                />
              </div>
            </div>
            <div>
              <Label>Deadline</Label>
              <Input
                type="date"
                value={goalData.deadline}
                onChange={(e) => setGoalData({ ...goalData, deadline: e.target.value })}
              />
            </div>
            <div>
              <Label>Notes</Label>
              <Textarea
                value={goalData.notes}
                onChange={(e) => setGoalData({ ...goalData, notes: e.target.value })}
                placeholder="Additional notes or strategies..."
                rows={3}
              />
            </div>
            <div className="flex justify-end gap-3 pt-4 border-t">
              <Button variant="outline" onClick={() => setIsGoalFormOpen(false)}>Cancel</Button>
              <Button 
                onClick={handleSubmitGoal} 
                className="bg-blue-600 hover:bg-blue-700"
                disabled={createGoalMutation.isPending}
              >
                {createGoalMutation.isPending ? 'Creating...' : 'Create Goal'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}