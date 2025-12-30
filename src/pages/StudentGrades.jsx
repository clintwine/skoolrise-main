import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Award, TrendingUp } from 'lucide-react';

export default function StudentGrades() {
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

  const { data: reportCards = [] } = useQuery({
    queryKey: ['student-grades', studentId],
    queryFn: () => base44.entities.ReportCard.filter({ student_id: studentId }),
    enabled: !!studentId,
  });

  const { data: examResults = [] } = useQuery({
    queryKey: ['exam-results', studentId],
    queryFn: () => base44.entities.ExamResult.filter({ student_id: studentId }),
    enabled: !!studentId,
  });

  const avgGrade = reportCards.length > 0 
    ? (reportCards.reduce((sum, rc) => sum + (rc.average_score || 0), 0) / reportCards.length).toFixed(1)
    : 0;

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-gray-900">My Grades</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Average Grade</p>
                <p className="text-3xl font-bold text-blue-600">{avgGrade}%</p>
              </div>
              <Award className="w-12 h-12 text-blue-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Assessments</p>
                <p className="text-3xl font-bold text-green-600">{examResults.length}</p>
              </div>
              <TrendingUp className="w-12 h-12 text-green-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Exam Results</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {examResults.length === 0 ? (
              <div className="text-center py-12">
                <Award className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">No Exam Results Yet</h3>
                <p className="text-gray-600">Your exam results will appear here once your teacher grades your assessments.</p>
              </div>
            ) : (
              examResults.map((result) => (
                <div key={result.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <p className="font-medium">{result.subject}</p>
                    <p className="text-sm text-gray-600">{result.exam_type}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold text-blue-600">{result.percentage}%</p>
                    <p className="text-sm text-gray-600">Grade: {result.grade}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Report Cards</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {reportCards.length === 0 ? (
              <div className="text-center py-12">
                <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">No Report Cards</h3>
                <p className="text-gray-600">Report cards will be available here at the end of each term.</p>
              </div>
            ) : (
              reportCards.map((report) => (
                <div key={report.id} className="p-4 border rounded-lg">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <p className="font-medium">{report.term_name}</p>
                      <p className="text-sm text-gray-600">{report.session_name}</p>
                    </div>
                    <span className="text-2xl font-bold text-blue-600">{report.average_score}%</span>
                  </div>
                  <p className="text-sm text-gray-600">{report.comments}</p>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}