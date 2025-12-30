import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { FileText, Plus, Users } from 'lucide-react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '../utils';

export default function TeacherTests() {
  const [user, setUser] = useState(null);
  const [teacherId, setTeacherId] = useState(null);

  useEffect(() => {
    const fetchUser = async () => {
      const currentUser = await base44.auth.me();
      setUser(currentUser);
      setTeacherId(currentUser.linked_teacher_id);
    };
    fetchUser();
  }, []);

  const { data: exams = [] } = useQuery({
    queryKey: ['teacher-exams', teacherId],
    queryFn: () => base44.entities.Exam.filter({ teacher_id: teacherId }),
    enabled: !!teacherId,
  });

  const { data: attempts = [] } = useQuery({
    queryKey: ['exam-attempts'],
    queryFn: () => base44.entities.ExamAttempt.list(),
  });

  const getExamAttempts = (examId) => {
    return attempts.filter(a => a.exam_id === examId);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-900">My Tests</h1>
        <Link to={createPageUrl('ExamCreator')}>
          <Button>
            <Plus className="w-4 h-4 mr-2" />
            Create New Test
          </Button>
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="text-center">
              <p className="text-3xl font-bold text-blue-600">{exams.length}</p>
              <p className="text-sm text-gray-600 mt-1">Total Tests</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="text-center">
              <p className="text-3xl font-bold text-green-600">{exams.filter(e => e.status === 'Active').length}</p>
              <p className="text-sm text-gray-600 mt-1">Active</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="text-center">
              <p className="text-3xl font-bold text-yellow-600">{attempts.length}</p>
              <p className="text-sm text-gray-600 mt-1">Total Attempts</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>My Tests</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {exams.length === 0 ? (
              <div className="text-center py-12">
                <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">No Tests Created</h3>
                <p className="text-gray-600 mb-4">Get started by creating your first test using our CBT platform</p>
                <Link to={createPageUrl('ExamCreator')}>
                  <Button>Create Your First Test</Button>
                </Link>
              </div>
            ) : (
              exams.map((exam) => (
                <div key={exam.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <FileText className="w-5 h-5 text-blue-600" />
                    <div>
                      <p className="font-medium">{exam.title}</p>
                      <p className="text-sm text-gray-600">{exam.subject} • {exam.duration_minutes} minutes</p>
                      <div className="flex items-center gap-2 mt-1">
                        <Users className="w-4 h-4 text-gray-500" />
                        <span className="text-sm text-gray-600">{getExamAttempts(exam.id).length} attempts</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                      exam.status === 'Active' ? 'bg-green-100 text-green-800' :
                      exam.status === 'Draft' ? 'bg-gray-100 text-gray-800' :
                      'bg-blue-100 text-blue-800'
                    }`}>
                      {exam.status}
                    </span>
                    <Link to={createPageUrl(`ExamManagement?exam_id=${exam.id}`)}>
                      <Button variant="outline" size="sm">View</Button>
                    </Link>
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