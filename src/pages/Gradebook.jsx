import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Award, Edit, CheckCircle, XCircle, Clock } from 'lucide-react';

export default function Gradebook() {
  const [selectedSubmission, setSelectedSubmission] = useState(null);
  const [grade, setGrade] = useState('');
  const [feedback, setFeedback] = useState('');
  const queryClient = useQueryClient();

  const { data: assignments = [] } = useQuery({
    queryKey: ['assignments'],
    queryFn: () => base44.entities.Assignment.list('-created_date'),
  });

  const { data: submissions = [] } = useQuery({
    queryKey: ['submissions'],
    queryFn: () => base44.entities.Submission.list('-submitted_date'),
  });

  const { data: students = [] } = useQuery({
    queryKey: ['students'],
    queryFn: () => base44.entities.Student.list(),
  });

  const gradeMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Submission.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['submissions'] });
      setSelectedSubmission(null);
      setGrade('');
      setFeedback('');
    },
  });

  const handleGrade = () => {
    if (!selectedSubmission || !grade) return;
    
    gradeMutation.mutate({
      id: selectedSubmission.id,
      data: {
        grade: parseFloat(grade),
        feedback,
        status: 'Graded',
      }
    });
  };

  const openGradeDialog = (submission) => {
    setSelectedSubmission(submission);
    setGrade(submission.grade?.toString() || '');
    setFeedback(submission.feedback || '');
  };

  const pendingSubmissions = submissions.filter(s => s.status === 'Submitted');
  const gradedSubmissions = submissions.filter(s => s.status === 'Graded');

  const getAssignmentById = (id) => assignments.find(a => a.id === id);
  const getStudentById = (id) => students.find(s => s.id === id);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
          <Award className="w-8 h-8 text-blue-600" />
          Gradebook
        </h1>
        <p className="text-gray-600 mt-1">Grade student assignments and track progress</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Pending Grading</p>
                <p className="text-3xl font-bold text-orange-600">{pendingSubmissions.length}</p>
              </div>
              <Clock className="w-8 h-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Graded</p>
                <p className="text-3xl font-bold text-green-600">{gradedSubmissions.length}</p>
              </div>
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Submissions</p>
                <p className="text-3xl font-bold text-blue-600">{submissions.length}</p>
              </div>
              <Award className="w-8 h-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Submissions Awaiting Grading</CardTitle>
        </CardHeader>
        <CardContent>
          {pendingSubmissions.length === 0 ? (
            <div className="text-center py-8">
              <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-3" />
              <p className="text-gray-600">All caught up! No submissions pending.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {pendingSubmissions.map((submission) => {
                const assignment = getAssignmentById(submission.assignment_id);
                const student = getStudentById(submission.student_id);
                
                return (
                  <div key={submission.id} className="p-4 border rounded-lg hover:bg-gray-50">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <h4 className="font-semibold">{submission.student_name}</h4>
                        <p className="text-sm text-gray-600">{assignment?.title}</p>
                        <p className="text-xs text-gray-500 mt-1">
                          Submitted: {new Date(submission.submitted_date).toLocaleString()}
                        </p>
                        {submission.auto_graded && (
                          <Badge className="bg-green-100 text-green-800 mt-2">Auto-Graded</Badge>
                        )}
                      </div>
                      <Button onClick={() => openGradeDialog(submission)} size="sm" className="bg-blue-600 hover:bg-blue-700">
                        <Edit className="w-4 h-4 mr-2" />
                        Grade
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Recent Graded Submissions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Student</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Assignment</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Grade</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Percentage</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {gradedSubmissions.slice(0, 20).map((submission) => {
                  const assignment = getAssignmentById(submission.assignment_id);
                  const percentage = assignment ? (submission.grade / assignment.max_points * 100).toFixed(1) : 0;
                  
                  return (
                    <tr key={submission.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-sm">{submission.student_name}</td>
                      <td className="px-4 py-3 text-sm">{assignment?.title}</td>
                      <td className="px-4 py-3 text-sm font-bold">{submission.grade}/{assignment?.max_points}</td>
                      <td className="px-4 py-3">
                        <Badge className={percentage >= 70 ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}>
                          {percentage}%
                        </Badge>
                      </td>
                      <td className="px-4 py-3">
                        <Button variant="outline" size="sm" onClick={() => openGradeDialog(submission)}>
                          Edit
                        </Button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Grade Dialog */}
      <Dialog open={!!selectedSubmission} onOpenChange={() => setSelectedSubmission(null)}>
        <DialogContent className="max-w-2xl bg-white">
          <DialogHeader>
            <DialogTitle className="text-gray-900">Grade Submission</DialogTitle>
          </DialogHeader>
          {selectedSubmission && (
            <div className="space-y-4">
              <div className="p-4 bg-gray-50 rounded-lg">
                <p className="font-semibold">{selectedSubmission.student_name}</p>
                <p className="text-sm text-gray-600">{getAssignmentById(selectedSubmission.assignment_id)?.title}</p>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Student's Work</label>
                <div className="p-4 border rounded-lg bg-white">
                  <p className="whitespace-pre-wrap">{selectedSubmission.content || 'No content provided'}</p>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  Grade (out of {getAssignmentById(selectedSubmission.assignment_id)?.max_points})
                </label>
                <Input
                  type="number"
                  value={grade}
                  onChange={(e) => setGrade(e.target.value)}
                  placeholder="Enter grade"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Feedback</label>
                <Textarea
                  value={feedback}
                  onChange={(e) => setFeedback(e.target.value)}
                  rows={4}
                  placeholder="Provide feedback to the student..."
                />
              </div>

              <div className="flex justify-end gap-3">
                <Button variant="outline" onClick={() => setSelectedSubmission(null)}>Cancel</Button>
                <Button onClick={handleGrade} disabled={gradeMutation.isPending} className="bg-green-600 hover:bg-green-700">
                  {gradeMutation.isPending ? 'Saving...' : 'Save Grade'}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}