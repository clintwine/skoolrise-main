import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Upload, Calendar, Award, CheckCircle, Clock, Video, Play } from 'lucide-react';
import { format } from 'date-fns';

export default function StudentAssignments() {
  const [user, setUser] = useState(null);
  const [selectedAssignment, setSelectedAssignment] = useState(null);
  const [submissionContent, setSubmissionContent] = useState('');
  const [answers, setAnswers] = useState({});
  const [videoProgress, setVideoProgress] = useState(0);
  const queryClient = useQueryClient();

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const currentUser = await base44.auth.me();
        setUser(currentUser);
      } catch (error) {
        console.error('Error fetching user:', error);
      }
    };
    fetchUser();
  }, []);

  const { data: students = [] } = useQuery({
    queryKey: ['students', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      return await base44.entities.Student.filter({ user_id: user.id });
    },
    enabled: !!user?.id,
  });

  const studentProfile = students[0];

  const { data: enrollments = [] } = useQuery({
    queryKey: ['student-enrollments', studentProfile?.id],
    queryFn: async () => {
      if (!studentProfile?.id) return [];
      const allEnrollments = await base44.entities.Enrollment.list();
      return allEnrollments.filter(e => e.student_id === studentProfile.id);
    },
    enabled: !!studentProfile?.id,
  });

  const { data: assignments = [] } = useQuery({
    queryKey: ['student-assignments', studentProfile?.id],
    queryFn: async () => {
      if (!studentProfile?.id) return [];
      const classIds = enrollments.map(e => e.class_id);
      if (classIds.length === 0) return [];
      const allAssignments = await base44.entities.Assignment.list('-due_date');
      return allAssignments.filter(a => classIds.includes(a.class_id));
    },
    enabled: !!studentProfile?.id && enrollments.length > 0,
  });

  const { data: submissions = [] } = useQuery({
    queryKey: ['my-submissions', studentProfile?.id],
    queryFn: async () => {
      if (!studentProfile?.id) return [];
      return await base44.entities.Submission.filter({ student_id: studentProfile.id });
    },
    enabled: !!studentProfile?.id,
  });

  const submitMutation = useMutation({
    mutationFn: async (data) => {
      const submission = await base44.entities.Submission.create(data);
      
      // Auto-grade if self-marking
      if (selectedAssignment.is_self_marking && data.answers) {
        const questions = JSON.parse(selectedAssignment.questions);
        const studentAnswers = JSON.parse(data.answers);
        let score = 0;
        
        questions.forEach((q, idx) => {
          if (studentAnswers[idx] === q.correct_answer) {
            score += q.points;
          }
        });
        
        await base44.entities.Submission.update(submission.id, {
          grade: score,
          auto_graded: true,
          status: 'Graded',
          feedback: `Auto-graded: ${score}/${selectedAssignment.max_points} points`
        });
      }
      
      return submission;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-submissions'] });
      setSelectedAssignment(null);
      setSubmissionContent('');
      setAnswers({});
      alert('Assignment submitted successfully!');
    },
  });

  const handleSubmit = () => {
    if (!selectedAssignment) return;

    const submissionData = {
      assignment_id: selectedAssignment.id,
      student_id: user.id,
      student_name: user.full_name || user.email,
      submitted_date: new Date().toISOString(),
      content: submissionContent,
      status: 'Submitted',
    };

    if (selectedAssignment.is_self_marking) {
      submissionData.answers = JSON.stringify(answers);
    }

    if (selectedAssignment.video_url) {
      submissionData.video_completion_percentage = videoProgress;
    }

    submitMutation.mutate(submissionData);
  };

  const getSubmissionStatus = (assignmentId) => {
    return submissions.find(s => s.assignment_id === assignmentId);
  };

  const isOverdue = (dueDate) => new Date(dueDate) < new Date();

  const typeColors = {
    Homework: 'bg-blue-100 text-blue-800',
    Quiz: 'bg-purple-100 text-purple-800',
    Project: 'bg-green-100 text-green-800',
    Essay: 'bg-orange-100 text-orange-800',
    Lab: 'bg-pink-100 text-pink-800',
    Video: 'bg-red-100 text-red-800',
    'Independent Learning': 'bg-indigo-100 text-indigo-800',
  };

  if (!user) {
    return <div className="text-center py-12"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div></div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">My Assignments</h1>
        <p className="text-gray-600 mt-1">View and submit your homework</p>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {assignments.map((assignment) => {
          const submission = getSubmissionStatus(assignment.id);
          const overdue = isOverdue(assignment.due_date);
          
          return (
            <Card key={assignment.id} className={`shadow-md hover:shadow-lg transition-shadow ${overdue && !submission ? 'border-l-4 border-red-500' : ''}`}>
              <CardContent className="p-6">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="text-lg font-bold">{assignment.title}</h3>
                      <Badge className={typeColors[assignment.type]}>{assignment.type}</Badge>
                      {assignment.is_self_marking && <Badge className="bg-green-100 text-green-800">Auto-Grade</Badge>}
                      {assignment.video_url && <Badge className="bg-red-100 text-red-800"><Video className="w-3 h-3 mr-1" />Video</Badge>}
                    </div>
                    <p className="text-sm text-gray-600 mb-2">{assignment.class_name}</p>
                    <p className="text-sm text-gray-700 mb-3">{assignment.description}</p>
                    
                    <div className="flex items-center gap-4 text-sm">
                      <div className={`flex items-center gap-1 ${overdue && !submission ? 'text-red-600' : ''}`}>
                        <Calendar className="w-4 h-4" />
                        <span>Due: {format(new Date(assignment.due_date), 'MMM d, yyyy')}</span>
                        {overdue && !submission && <span className="ml-1 font-bold">OVERDUE</span>}
                      </div>
                      <div className="flex items-center gap-1">
                        <Award className="w-4 h-4" />
                        <span>{assignment.max_points} points</span>
                      </div>
                    </div>

                    {submission && (
                      <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <CheckCircle className="w-5 h-5 text-green-600" />
                            <span className="font-medium text-green-700">Submitted</span>
                          </div>
                          {submission.grade && (
                            <div className="text-right">
                              <p className="text-2xl font-bold text-blue-600">{submission.grade}/{assignment.max_points}</p>
                              <p className="text-xs text-gray-600">{((submission.grade / assignment.max_points) * 100).toFixed(1)}%</p>
                            </div>
                          )}
                        </div>
                        {submission.feedback && (
                          <p className="text-sm text-gray-700 mt-2">Feedback: {submission.feedback}</p>
                        )}
                      </div>
                    )}
                  </div>

                  {!submission && (
                    <Button onClick={() => setSelectedAssignment(assignment)} className="bg-blue-600 hover:bg-blue-700">
                      Start
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Submission Dialog */}
      <Dialog open={!!selectedAssignment} onOpenChange={() => setSelectedAssignment(null)}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto bg-white">
          <DialogHeader>
            <DialogTitle className="text-gray-900">{selectedAssignment?.title}</DialogTitle>
          </DialogHeader>
          {selectedAssignment && (
            <div className="space-y-4">
              <div className="p-4 bg-gray-50 rounded-lg">
                <p className="text-gray-700">{selectedAssignment.description}</p>
              </div>

              {selectedAssignment.video_url && (
                <div className="space-y-2">
                  <Label>Watch the Video</Label>
                  <div className="aspect-video bg-gray-900 rounded-lg flex items-center justify-center">
                    <Play className="w-16 h-16 text-white opacity-50" />
                  </div>
                  <p className="text-sm text-gray-600">Progress: {videoProgress}%</p>
                </div>
              )}

              {selectedAssignment.is_self_marking && selectedAssignment.questions && (
                <div className="space-y-4">
                  <h3 className="font-semibold">Questions:</h3>
                  {JSON.parse(selectedAssignment.questions).map((q, idx) => (
                    <div key={idx} className="p-4 border rounded-lg">
                      <p className="font-medium mb-2">{idx + 1}. {q.question_text} ({q.points} points)</p>
                      <div className="space-y-2">
                        {q.options.map((option, optIdx) => (
                          <label key={optIdx} className="flex items-center gap-2 cursor-pointer">
                            <input
                              type="radio"
                              name={`question-${idx}`}
                              value={option}
                              onChange={(e) => setAnswers({ ...answers, [idx]: e.target.value })}
                            />
                            <span>{option}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {!selectedAssignment.is_self_marking && (
                <div>
                  <Label>Your Answer</Label>
                  <Textarea
                    value={submissionContent}
                    onChange={(e) => setSubmissionContent(e.target.value)}
                    rows={10}
                    placeholder="Type your answer here..."
                  />
                </div>
              )}

              <div className="flex gap-3">
                <Button variant="outline" onClick={() => setSelectedAssignment(null)}>Cancel</Button>
                <Button onClick={handleSubmit} disabled={submitMutation.isPending} className="bg-green-600 hover:bg-green-700">
                  <Upload className="w-4 h-4 mr-2" />
                  {submitMutation.isPending ? 'Submitting...' : 'Submit Assignment'}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}