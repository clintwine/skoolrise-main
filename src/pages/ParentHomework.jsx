import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Calendar, Award, CheckCircle, Clock, AlertCircle } from 'lucide-react';
import { format, startOfWeek, addDays } from 'date-fns';

export default function ParentHomework() {
  const [user, setUser] = useState(null);
  const [studentIds, setStudentIds] = useState([]);
  const [selectedStudent, setSelectedStudent] = useState('');

  useEffect(() => {
    const fetchUser = async () => {
      const currentUser = await base44.auth.me();
      setUser(currentUser);
      if (currentUser.parent_of_student_ids) {
        const ids = currentUser.parent_of_student_ids.split(',').map(id => id.trim());
        setStudentIds(ids);
        setSelectedStudent(ids[0]);
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

  const { data: assignments = [] } = useQuery({
    queryKey: ['assignments'],
    queryFn: () => base44.entities.Assignment.list('-due_date'),
  });

  const { data: submissions = [] } = useQuery({
    queryKey: ['student-submissions', selectedStudent],
    queryFn: async () => {
      if (!selectedStudent) return [];
      const allSubmissions = await base44.entities.Submission.list();
      return allSubmissions.filter(s => s.student_id === selectedStudent);
    },
    enabled: !!selectedStudent,
  });

  const getSubmissionStatus = (assignmentId) => {
    return submissions.find(s => s.assignment_id === assignmentId);
  };

  const isOverdue = (dueDate) => new Date(dueDate) < new Date();
  
  const pendingAssignments = assignments.filter(a => !getSubmissionStatus(a.id) && !isOverdue(a.due_date));
  const overdueAssignments = assignments.filter(a => !getSubmissionStatus(a.id) && isOverdue(a.due_date));
  const completedAssignments = assignments.filter(a => getSubmissionStatus(a.id));

  const avgGrade = completedAssignments.length > 0
    ? (completedAssignments.reduce((sum, a) => {
        const sub = getSubmissionStatus(a.id);
        return sum + (sub?.grade || 0);
      }, 0) / completedAssignments.length).toFixed(1)
    : 0;

  // Calendar view
  const weekStart = startOfWeek(new Date());
  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));

  const getAssignmentsForDay = (day) => {
    return assignments.filter(a => {
      const dueDate = new Date(a.due_date);
      return format(dueDate, 'yyyy-MM-dd') === format(day, 'yyyy-MM-dd');
    });
  };

  if (!user) {
    return <div className="text-center py-12"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div></div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Homework & Assignments</h1>
        <p className="text-gray-600 mt-1">Track your child's assignments and progress</p>
      </div>

      {students.length > 1 && (
        <Card>
          <CardContent className="p-4">
            <select
              value={selectedStudent}
              onChange={(e) => setSelectedStudent(e.target.value)}
              className="w-full px-4 py-2 border rounded-lg"
            >
              {students.map(s => (
                <option key={s.id} value={s.id}>{s.first_name} {s.last_name}</option>
              ))}
            </select>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Pending</p>
                <p className="text-2xl font-bold text-blue-600">{pendingAssignments.length}</p>
              </div>
              <Clock className="w-8 h-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Overdue</p>
                <p className="text-2xl font-bold text-red-600">{overdueAssignments.length}</p>
              </div>
              <AlertCircle className="w-8 h-8 text-red-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Completed</p>
                <p className="text-2xl font-bold text-green-600">{completedAssignments.length}</p>
              </div>
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Avg Grade</p>
                <p className="text-2xl font-bold text-purple-600">{avgGrade}%</p>
              </div>
              <Award className="w-8 h-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="w-5 h-5" />
            This Week's Assignments
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-7 gap-2">
            {weekDays.map((day, idx) => {
              const dayAssignments = getAssignmentsForDay(day);
              const isToday = format(day, 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd');
              
              return (
                <div key={idx} className={`border rounded-lg p-3 ${isToday ? 'bg-blue-50 border-blue-300' : ''}`}>
                  <p className="text-sm font-semibold text-center mb-2">{format(day, 'EEE')}</p>
                  <p className="text-xs text-center text-gray-600 mb-3">{format(day, 'MMM d')}</p>
                  <div className="space-y-2">
                    {dayAssignments.map(a => {
                      const submission = getSubmissionStatus(a.id);
                      return (
                        <div key={a.id} className={`text-xs p-2 rounded ${submission ? 'bg-green-100' : 'bg-orange-100'}`}>
                          <p className="font-medium truncate">{a.title}</p>
                          <p className="text-gray-600">{a.class_name}</p>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {overdueAssignments.length > 0 && (
        <Card className="border-l-4 border-red-500">
          <CardHeader>
            <CardTitle className="text-red-600">Overdue Assignments</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {overdueAssignments.map(a => (
                <div key={a.id} className="p-4 bg-red-50 rounded-lg">
                  <h4 className="font-semibold">{a.title}</h4>
                  <p className="text-sm text-gray-600">{a.class_name}</p>
                  <p className="text-sm text-red-600 mt-1">
                    Was due: {format(new Date(a.due_date), 'MMM d, yyyy')}
                  </p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>All Assignments</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {assignments.slice(0, 10).map(a => {
              const submission = getSubmissionStatus(a.id);
              const overdue = isOverdue(a.due_date) && !submission;
              
              return (
                <div key={a.id} className={`p-4 border rounded-lg ${overdue ? 'border-red-300 bg-red-50' : ''}`}>
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <h4 className="font-semibold">{a.title}</h4>
                      <p className="text-sm text-gray-600">{a.class_name}</p>
                      <div className="flex items-center gap-4 mt-2 text-sm">
                        <div className="flex items-center gap-1">
                          <Calendar className="w-4 h-4" />
                          <span>Due: {format(new Date(a.due_date), 'MMM d')}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Award className="w-4 h-4" />
                          <span>{a.max_points} points</span>
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      {submission ? (
                        <div>
                          <Badge className="bg-green-100 text-green-800 mb-2">Submitted</Badge>
                          {submission.grade && (
                            <p className="text-lg font-bold">{submission.grade}/{a.max_points}</p>
                          )}
                        </div>
                      ) : overdue ? (
                        <Badge className="bg-red-100 text-red-800">Overdue</Badge>
                      ) : (
                        <Badge className="bg-orange-100 text-orange-800">Pending</Badge>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}