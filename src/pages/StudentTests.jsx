import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { FileText, Clock, CheckCircle } from 'lucide-react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '../utils';
import { format } from 'date-fns';

export default function StudentTests() {
  const [user, setUser] = useState(null);
  const [studentId, setStudentId] = useState(null);

  useEffect(() => {
    const fetchUser = async () => {
      const currentUser = await base44.auth.me();
      setUser(currentUser);
      setStudentId(currentUser.linked_student_id);
    };
    fetchUser();
  }, []);

  const { data: exams = [] } = useQuery({
    queryKey: ['student-exams'],
    queryFn: () => base44.entities.Exam.filter({ status: 'Active' }),
  });

  const { data: attempts = [] } = useQuery({
    queryKey: ['exam-attempts', studentId],
    queryFn: () => base44.entities.ExamAttempt.filter({ student_id: studentId }),
    enabled: !!studentId,
  });

  const availableExams = exams.filter(exam => 
    !attempts.some(attempt => attempt.exam_id === exam.id && attempt.status === 'Completed')
  );

  const completedAttempts = attempts.filter(a => a.status === 'Completed');

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-gray-900">My Tests</h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="text-center">
              <p className="text-3xl font-bold text-blue-600">{availableExams.length}</p>
              <p className="text-sm text-gray-600 mt-1">Available Tests</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="text-center">
              <p className="text-3xl font-bold text-green-600">{completedAttempts.length}</p>
              <p className="text-sm text-gray-600 mt-1">Completed</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="text-center">
              <p className="text-3xl font-bold text-yellow-600">{attempts.filter(a => a.status === 'In Progress').length}</p>
              <p className="text-sm text-gray-600 mt-1">In Progress</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Available Tests</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {availableExams.length === 0 ? (
              <div className="text-center py-12">
                <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">No Tests Available</h3>
                <p className="text-gray-600">There are no active tests at the moment. Check back later or contact your teacher.</p>
              </div>
            ) : (
              availableExams.map((exam) => (
                <div key={exam.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <FileText className="w-5 h-5 text-blue-600" />
                    <div>
                      <p className="font-medium">{exam.title}</p>
                      <p className="text-sm text-gray-600">{exam.subject} • {exam.duration_minutes} minutes</p>
                      <p className="text-sm text-gray-500">Due: {format(new Date(exam.end_date), 'MMM dd, yyyy')}</p>
                    </div>
                  </div>
                  <Link to={createPageUrl(`TakeExam?exam_id=${exam.id}`)}>
                    <Button>Start Test</Button>
                  </Link>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Completed Tests</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {completedAttempts.length === 0 ? (
              <div className="text-center py-12">
                <CheckCircle className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">No Completed Tests</h3>
                <p className="text-gray-600">You haven't completed any tests yet. Your results will appear here once you finish a test.</p>
              </div>
            ) : (
              completedAttempts.map((attempt) => (
                <div key={attempt.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <CheckCircle className="w-5 h-5 text-green-600" />
                    <div>
                      <p className="font-medium">{attempt.exam_title || 'Test'}</p>
                      <p className="text-sm text-gray-600">Completed: {format(new Date(attempt.submitted_date), 'MMM dd, yyyy')}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-xl font-bold text-blue-600">{attempt.score}/{attempt.total_points}</p>
                    <p className="text-sm text-gray-600">{attempt.percentage}%</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}