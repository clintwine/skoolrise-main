import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { useSchoolContext } from '@/hooks/useSchoolContext';
import { addSchoolFilter } from '@/utils/schoolFilter';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { FileText, Clock, CheckCircle } from 'lucide-react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '../utils';
import { format } from 'date-fns';

export default function StudentTests() {
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

  const { data: exams = [] } = useQuery({
    queryKey: ['student-tests', school_tenant_id],
    queryFn: () => base44.entities.Test.filter(addSchoolFilter({ status: 'Published' }, school_tenant_id), '-end_date', 50),
    enabled: isReady,
  });

  const { data: attempts = [] } = useQuery({
    queryKey: ['exam-attempts', studentId, school_tenant_id],
    queryFn: async () => {
      if (!studentId) return [];
      return await base44.entities.ExamAttempt.filter(addSchoolFilter({ student_id: studentId }, school_tenant_id));
    },
    enabled: !!studentId && isReady,
  });

  const availableExams = exams.filter(exam => {
    const isCompleted = attempts.some(attempt => attempt.exam_id === exam.id && attempt.status === 'Completed');
    const isStillOpen = !exam.end_date || new Date(exam.end_date) >= new Date();
    return !isCompleted && isStillOpen;
  });

  const completedAttempts = attempts.filter(a => a.status === 'Completed');

  if (!user && students.length === 0) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-10 bg-gray-200 rounded w-48"></div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[1,2,3].map((i) => <div key={i} className="h-28 bg-gray-100 rounded-xl"></div>)}
        </div>
        <div className="h-64 bg-gray-100 rounded-xl"></div>
      </div>
    );
  }

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