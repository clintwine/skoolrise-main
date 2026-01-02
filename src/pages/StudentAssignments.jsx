import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Progress } from '@/components/ui/progress';
import { 
  Calendar, Award, Clock, Video, FileText, 
  CheckCircle, XCircle, AlertCircle, Eye, Check, X
} from 'lucide-react';
import { format, formatDistanceToNow } from 'date-fns';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';

export default function StudentAssignments() {
  const [user, setUser] = useState(null);
  const [selectedAssignment, setSelectedAssignment] = useState(null);
  const [viewMode, setViewMode] = useState('dashboard'); // dashboard, submission, results
  const [submissionContent, setSubmissionContent] = useState('');
  const [questionAnswers, setQuestionAnswers] = useState({});
  const [draftSaving, setDraftSaving] = useState(false);
  const queryClient = useQueryClient();

  useEffect(() => {
    const fetchUser = async () => {
      const currentUser = await base44.auth.me();
      setUser(currentUser);
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
      return allAssignments.filter(a => classIds.includes(a.class_id) && a.status === 'Published');
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

  const { data: assignmentQuestions = [] } = useQuery({
    queryKey: ['assignment-questions', selectedAssignment?.id],
    queryFn: async () => {
      if (!selectedAssignment?.id) return [];
      const links = await base44.entities.AssignmentQuestion.filter({ assignment_id: selectedAssignment.id });
      const questionBankIds = links.map(l => l.question_bank_id);
      if (questionBankIds.length === 0) return [];
      const allQuestions = await base44.entities.QuestionBank.list();
      return links.map(link => {
        const question = allQuestions.find(q => q.id === link.question_bank_id);
        return { ...question, order: link.order };
      }).sort((a, b) => a.order - b.order);
    },
    enabled: !!selectedAssignment?.id && selectedAssignment.type === 'Quiz',
  });

  // Auto-save draft every 30 seconds
  useEffect(() => {
    if (!selectedAssignment || viewMode !== 'submission') return;
    
    const interval = setInterval(() => {
      saveDraft();
    }, 30000);

    return () => clearInterval(interval);
  }, [selectedAssignment, questionAnswers, submissionContent, viewMode]);

  const saveDraft = async () => {
    if (!selectedAssignment || !studentProfile) return;
    setDraftSaving(true);
    try {
      const draftData = {
        answers: JSON.stringify(questionAnswers),
        content: submissionContent,
      };
      localStorage.setItem(`draft_${selectedAssignment.id}`, JSON.stringify(draftData));
    } finally {
      setTimeout(() => setDraftSaving(false), 500);
    }
  };

  const loadDraft = (assignmentId) => {
    const draft = localStorage.getItem(`draft_${assignmentId}`);
    if (draft) {
      const parsed = JSON.parse(draft);
      setQuestionAnswers(parsed.answers ? JSON.parse(parsed.answers) : {});
      setSubmissionContent(parsed.content || '');
    }
  };

  const submitMutation = useMutation({
    mutationFn: async (data) => {
      const submission = await base44.entities.Submission.create(data);
      
      // Auto-grade MCQ and True/False questions
      if (assignmentQuestions.length > 0) {
        let score = 0;
        assignmentQuestions.forEach((q) => {
          const studentAnswer = data.answers ? JSON.parse(data.answers)[q.id] : null;
          if (q.question_type === 'Multiple Choice' || q.question_type === 'True/False') {
            const correctAnswers = q.correct_answers || [q.correct_answer];
            if (Array.isArray(studentAnswer)) {
              if (JSON.stringify(studentAnswer.sort()) === JSON.stringify(correctAnswers.sort())) {
                score += q.points;
              }
            } else if (correctAnswers.includes(studentAnswer)) {
              score += q.points;
            }
          }
        });
        
        const hasEssay = assignmentQuestions.some(q => q.question_type === 'Essay' || q.question_type === 'Theory');
        
        await base44.entities.Submission.update(submission.id, {
          grade: hasEssay ? null : score,
          status: hasEssay ? 'Submitted' : 'Graded',
          feedback: hasEssay ? null : `Auto-graded objective questions: ${score} points`,
        });
      }
      
      return submission;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-submissions'] });
      localStorage.removeItem(`draft_${selectedAssignment.id}`);
      toast.success('Assignment submitted successfully!');
      setViewMode('dashboard');
      setSelectedAssignment(null);
      setQuestionAnswers({});
      setSubmissionContent('');
    },
  });

  const handleSubmit = () => {
    if (!selectedAssignment || !studentProfile) return;

    // Validation
    if (selectedAssignment.type === 'Quiz' && Object.keys(questionAnswers).length === 0) {
      toast.error('Please answer at least one question');
      return;
    }

    if ((selectedAssignment.type === 'Essay' || selectedAssignment.type === 'Homework') && !submissionContent.trim()) {
      toast.error('Please provide your answer');
      return;
    }

    const now = new Date();
    const dueDate = new Date(selectedAssignment.due_date);
    const isLate = now > dueDate;

    const submissionData = {
      assignment_id: selectedAssignment.id,
      student_id: studentProfile.id,
      student_name: `${studentProfile.first_name} ${studentProfile.last_name}`,
      submitted_date: now.toISOString(),
      content: submissionContent,
      answers: JSON.stringify(questionAnswers),
      status: 'Submitted',
      is_late: isLate,
    };

    submitMutation.mutate(submissionData);
  };

  const openAssignment = (assignment) => {
    const submission = getSubmissionStatus(assignment.id);
    setSelectedAssignment(assignment);
    if (submission) {
      setViewMode('results');
      if (submission.answers) {
        setQuestionAnswers(JSON.parse(submission.answers));
      }
      if (submission.content) {
        setSubmissionContent(submission.content);
      }
    } else {
      setViewMode('submission');
      loadDraft(assignment.id);
    }
  };

  const getSubmissionStatus = (assignmentId) => {
    return submissions.find(s => s.assignment_id === assignmentId);
  };

  const getStatusBadge = (assignment) => {
    const submission = getSubmissionStatus(assignment.id);
    const now = new Date();
    const dueDate = new Date(assignment.due_date);
    
    if (submission) {
      if (submission.status === 'Graded') {
        return <Badge className="bg-green-100 text-green-800"><CheckCircle className="w-3 h-3 mr-1" />Graded</Badge>;
      }
      return <Badge className="bg-yellow-100 text-yellow-800"><Clock className="w-3 h-3 mr-1" />Submitted</Badge>;
    }
    
    if (now > dueDate) {
      return <Badge className="bg-red-100 text-red-800"><AlertCircle className="w-3 h-3 mr-1" />Late</Badge>;
    }
    
    return <Badge className="bg-blue-100 text-blue-800"><FileText className="w-3 h-3 mr-1" />To Do</Badge>;
  };

  const getTypeIcon = (type) => {
    const icons = {
      Homework: FileText,
      Quiz: CheckCircle,
      Project: Award,
      Essay: FileText,
      Lab: Award,
      Video: Video,
      'Independent Learning': FileText,
    };
    return icons[type] || FileText;
  };

  if (!user || !studentProfile) {
    return <div className="text-center py-12"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-accent mx-auto"></div></div>;
  }

  if (viewMode === 'dashboard') {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-4xl font-bold text-text">My Assignments</h1>
          <p className="text-text-secondary mt-2">Complete your homework and track your progress</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <AnimatePresence>
            {assignments.map((assignment, idx) => {
              const submission = getSubmissionStatus(assignment.id);
              const TypeIcon = getTypeIcon(assignment.type);
              const now = new Date();
              const dueDate = new Date(assignment.due_date);
              const isOverdue = now > dueDate && !submission;
              
              return (
                <motion.div
                  key={assignment.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.05 }}
                >
                  <Card 
                    className={`bg-white shadow-md rounded-2xl hover:shadow-xl transition-all duration-300 cursor-pointer hover:scale-105 ${
                      isOverdue ? 'border-2 border-red-300' : ''
                    }`}
                    onClick={() => openAssignment(assignment)}
                  >
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between mb-3">
                        <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                          submission?.status === 'Graded' ? 'bg-green-100' :
                          submission ? 'bg-yellow-100' :
                          isOverdue ? 'bg-red-100' : 'bg-blue-100'
                        }`}>
                          <TypeIcon className={`w-6 h-6 ${
                            submission?.status === 'Graded' ? 'text-green-600' :
                            submission ? 'text-yellow-600' :
                            isOverdue ? 'text-red-600' : 'text-blue-600'
                          }`} />
                        </div>
                        {getStatusBadge(assignment)}
                      </div>
                      
                      <h3 className="text-lg font-bold text-text mb-1 line-clamp-2">{assignment.title}</h3>
                      <p className="text-sm text-text-secondary mb-3">{assignment.class_name}</p>
                      
                      <div className="space-y-2 text-sm">
                        <div className="flex items-center justify-between">
                          <span className="text-text-secondary flex items-center gap-1">
                            <Calendar className="w-4 h-4" />
                            Due {formatDistanceToNow(dueDate, { addSuffix: true })}
                          </span>
                          <span className="font-medium text-text flex items-center gap-1">
                            <Award className="w-4 h-4" />
                            {assignment.max_points} pts
                          </span>
                        </div>
                        
                        {submission?.grade !== null && submission?.grade !== undefined && (
                          <div className="pt-2 border-t">
                            <div className="flex items-center justify-between">
                              <span className="text-text-secondary">Your Score:</span>
                              <span className="text-2xl font-bold text-accent">
                                {submission.grade}/{assignment.max_points}
                              </span>
                            </div>
                            <Progress value={(submission.grade / assignment.max_points) * 100} className="mt-2" />
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      </div>
    );
  }

  if (viewMode === 'submission') {
    return (
      <div className="h-[calc(100vh-120px)] flex gap-6">
        {/* Sidebar - Instructions */}
        <div className="w-[30%] space-y-4 overflow-y-auto">
          <Button variant="outline" onClick={() => { setViewMode('dashboard'); setSelectedAssignment(null); }}>
            ← Back to Assignments
          </Button>
          
          <Card className="bg-white rounded-xl shadow-md sticky top-0">
            <CardHeader>
              <CardTitle className="text-xl">{selectedAssignment.title}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm text-text-secondary mb-1">Class</p>
                <p className="font-medium text-text">{selectedAssignment.class_name}</p>
              </div>
              
              <div>
                <p className="text-sm text-text-secondary mb-1">Due Date</p>
                <p className="font-medium text-text flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  {format(new Date(selectedAssignment.due_date), 'MMM d, yyyy h:mm a')}
                </p>
              </div>
              
              <div>
                <p className="text-sm text-text-secondary mb-1">Points</p>
                <p className="font-medium text-text flex items-center gap-2">
                  <Award className="w-4 h-4" />
                  {selectedAssignment.max_points} points
                </p>
              </div>
              
              <div className="pt-4 border-t">
                <p className="text-sm text-text-secondary mb-2">Instructions</p>
                <div 
                  className="text-sm text-text prose prose-sm max-w-none"
                  dangerouslySetInnerHTML={{ __html: selectedAssignment.description }}
                />
              </div>

              {draftSaving && (
                <div className="flex items-center gap-2 text-sm text-green-600">
                  <Clock className="w-4 h-4 animate-spin" />
                  Saving draft...
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Main Area - Submission Workspace */}
        <div className="flex-1 space-y-4 overflow-y-auto">
          <Card className="bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl shadow-lg">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm opacity-90">Assignment Progress</p>
                  <p className="text-2xl font-bold">
                    {selectedAssignment.type === 'Quiz' 
                      ? `${Object.keys(questionAnswers).length}/${assignmentQuestions.length} answered`
                      : submissionContent.length > 0 ? 'In Progress' : 'Not Started'}
                  </p>
                </div>
                <Button 
                  onClick={handleSubmit} 
                  disabled={submitMutation.isPending}
                  className="bg-white text-blue-600 hover:bg-gray-100"
                  size="lg"
                >
                  {submitMutation.isPending ? 'Submitting...' : 'Submit Assignment'}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Question-Based Assignment */}
          {selectedAssignment.type === 'Quiz' && assignmentQuestions.length > 0 && (
            <div className="space-y-4">
              {assignmentQuestions.map((question, idx) => (
                <Card key={question.id} className="bg-white rounded-xl shadow-md">
                  <CardContent className="p-6">
                    <div className="flex gap-3 mb-4">
                      <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                        <span className="text-sm font-bold text-blue-600">{idx + 1}</span>
                      </div>
                      <div className="flex-1">
                        <p className="font-medium text-text mb-2">{question.question_text}</p>
                        <Badge variant="outline">{question.points} points</Badge>
                      </div>
                    </div>

                    {question.image_url && (
                      <img src={question.image_url} alt="Question" className="max-w-full max-h-64 rounded-lg mb-4" />
                    )}

                    {/* Multiple Choice */}
                    {question.question_type === 'Multiple Choice' && (
                      <div className="space-y-2 ml-11">
                        {JSON.parse(question.options).map((option, optIdx) => (
                          <label key={optIdx} className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 cursor-pointer border">
                            {question.allow_multiple_answers ? (
                              <Checkbox
                                checked={(questionAnswers[question.id] || []).includes(option)}
                                onCheckedChange={(checked) => {
                                  const current = questionAnswers[question.id] || [];
                                  setQuestionAnswers({
                                    ...questionAnswers,
                                    [question.id]: checked 
                                      ? [...current, option]
                                      : current.filter(a => a !== option)
                                  });
                                }}
                              />
                            ) : (
                              <input
                                type="radio"
                                name={`question-${question.id}`}
                                checked={questionAnswers[question.id] === option}
                                onChange={() => setQuestionAnswers({ ...questionAnswers, [question.id]: option })}
                                className="w-4 h-4"
                              />
                            )}
                            <span className="text-sm">{option}</span>
                          </label>
                        ))}
                      </div>
                    )}

                    {/* True/False */}
                    {question.question_type === 'True/False' && (
                      <div className="grid grid-cols-2 gap-4 ml-11">
                        <button
                          onClick={() => setQuestionAnswers({ ...questionAnswers, [question.id]: 'True' })}
                          className={`p-4 rounded-xl border-2 transition-all ${
                            questionAnswers[question.id] === 'True'
                              ? 'border-green-500 bg-green-50'
                              : 'border-gray-200 hover:border-green-300'
                          }`}
                        >
                          <Check className={`w-6 h-6 mx-auto mb-2 ${questionAnswers[question.id] === 'True' ? 'text-green-600' : 'text-gray-400'}`} />
                          <p className="font-semibold">True</p>
                        </button>
                        <button
                          onClick={() => setQuestionAnswers({ ...questionAnswers, [question.id]: 'False' })}
                          className={`p-4 rounded-xl border-2 transition-all ${
                            questionAnswers[question.id] === 'False'
                              ? 'border-red-500 bg-red-50'
                              : 'border-gray-200 hover:border-red-300'
                          }`}
                        >
                          <X className={`w-6 h-6 mx-auto mb-2 ${questionAnswers[question.id] === 'False' ? 'text-red-600' : 'text-gray-400'}`} />
                          <p className="font-semibold">False</p>
                        </button>
                      </div>
                    )}

                    {/* Essay */}
                    {(question.question_type === 'Essay' || question.question_type === 'Theory') && (
                      <Textarea
                        value={questionAnswers[question.id] || ''}
                        onChange={(e) => setQuestionAnswers({ ...questionAnswers, [question.id]: e.target.value })}
                        rows={6}
                        placeholder="Type your answer here..."
                        className="ml-11"
                      />
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {/* Text/Essay Assignment */}
          {(selectedAssignment.type === 'Essay' || selectedAssignment.type === 'Homework') && (
            <Card className="bg-white rounded-xl shadow-md">
              <CardContent className="p-6">
                <Textarea
                  value={submissionContent}
                  onChange={(e) => setSubmissionContent(e.target.value)}
                  rows={20}
                  placeholder="Type your answer here..."
                  className="text-base"
                />
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    );
  }

  // Results View
  if (viewMode === 'results') {
    const submission = getSubmissionStatus(selectedAssignment.id);
    const percentage = submission?.grade ? ((submission.grade / selectedAssignment.max_points) * 100).toFixed(1) : null;

    return (
      <div className="space-y-6 max-w-5xl mx-auto">
        <Button variant="outline" onClick={() => { setViewMode('dashboard'); setSelectedAssignment(null); }}>
          ← Back to Assignments
        </Button>

        <Card className="bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl shadow-lg">
          <CardContent className="p-8 text-center">
            <h2 className="text-3xl font-bold mb-2">{selectedAssignment.title}</h2>
            {submission?.grade !== null && submission?.grade !== undefined ? (
              <>
                <p className="text-6xl font-bold my-4">{submission.grade}/{selectedAssignment.max_points}</p>
                <p className="text-2xl opacity-90">{percentage}%</p>
                <Badge className={`mt-4 ${
                  parseFloat(percentage) >= 90 ? 'bg-green-500' :
                  parseFloat(percentage) >= 70 ? 'bg-blue-500' :
                  parseFloat(percentage) >= 50 ? 'bg-yellow-500' : 'bg-red-500'
                }`}>
                  {parseFloat(percentage) >= 70 ? 'Great Job!' : 'Keep Practicing!'}
                </Badge>
              </>
            ) : (
              <>
                <CheckCircle className="w-16 h-16 mx-auto my-4" />
                <p className="text-xl">Submitted - Awaiting Grade</p>
              </>
            )}
          </CardContent>
        </Card>

        {submission?.feedback && (
          <Card className="bg-white rounded-xl shadow-md">
            <CardHeader>
              <CardTitle>Teacher Feedback</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="prose prose-sm max-w-none" dangerouslySetInnerHTML={{ __html: submission.feedback }} />
            </CardContent>
          </Card>
        )}

        {assignmentQuestions.length > 0 && (
          <Card className="bg-white rounded-xl shadow-md">
            <CardHeader>
              <CardTitle>Answer Review</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {assignmentQuestions.map((question, idx) => {
                const studentAnswer = questionAnswers[question.id];
                const correctAnswers = question.correct_answers || [question.correct_answer];
                let isCorrect = false;
                
                if (question.question_type === 'Multiple Choice' && Array.isArray(studentAnswer)) {
                  isCorrect = JSON.stringify(studentAnswer.sort()) === JSON.stringify(correctAnswers.sort());
                } else {
                  isCorrect = correctAnswers.includes(studentAnswer);
                }

                return (
                  <div key={question.id} className="p-4 border rounded-lg">
                    <div className="flex gap-3 mb-3">
                      <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                        <span className="text-sm font-bold text-blue-600">{idx + 1}</span>
                      </div>
                      <div className="flex-1">
                        <p className="font-medium mb-2">{question.question_text}</p>
                        <Badge variant="outline">{question.points} points</Badge>
                      </div>
                      {(question.question_type === 'Multiple Choice' || question.question_type === 'True/False') && (
                        <div>
                          {isCorrect ? (
                            <Badge className="bg-green-100 text-green-800"><CheckCircle className="w-3 h-3 mr-1" />Correct</Badge>
                          ) : (
                            <Badge className="bg-red-100 text-red-800"><XCircle className="w-3 h-3 mr-1" />Incorrect</Badge>
                          )}
                        </div>
                      )}
                    </div>

                    <div className="ml-11 space-y-2">
                      <div className="p-3 bg-blue-50 rounded-lg">
                        <p className="text-sm font-medium text-blue-900 mb-1">Your Answer:</p>
                        <p className="text-sm text-blue-800">
                          {Array.isArray(studentAnswer) ? studentAnswer.join(', ') : studentAnswer || 'Not answered'}
                        </p>
                      </div>

                      {(question.question_type === 'Multiple Choice' || question.question_type === 'True/False') && !isCorrect && (
                        <div className="p-3 bg-green-50 rounded-lg">
                          <p className="text-sm font-medium text-green-900 mb-1">Correct Answer:</p>
                          <p className="text-sm text-green-800">{correctAnswers.join(', ')}</p>
                        </div>
                      )}

                      {question.explanation && (
                        <div className="p-3 bg-gray-50 rounded-lg">
                          <p className="text-sm font-medium text-gray-900 mb-1">Explanation:</p>
                          <p className="text-sm text-gray-700">{question.explanation}</p>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </CardContent>
          </Card>
        )}
      </div>
    );
  }

  return null;
}