import React, { useState, useEffect, useRef } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useSchoolContext } from '@/hooks/useSchoolContext';
import { addSchoolFilter, withSchoolId } from '@/utils/schoolFilter';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { usePlanAccess } from '@/hooks/usePlanAccess';
import UpgradePrompt from '@/components/UpgradePrompt';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { AlertCircle, Clock, Flag, ChevronLeft, ChevronRight, Camera, CheckCircle } from 'lucide-react';
import { Textarea } from '@/components/ui/textarea';

export default function TakeExam() {
  const urlParams = new URLSearchParams(window.location.search);
  const examId = urlParams.get('id');
  
  const [currentUser, setCurrentUser] = useState(null);
  const [attemptId, setAttemptId] = useState(null);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState({});
  const [flagged, setFlagged] = useState({});
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [tabSwitches, setTabSwitches] = useState(0);
  const [proctoringSnapshots, setProctoringSnapshots] = useState([]);
  const [examStarted, setExamStarted] = useState(false);
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const autosaveTimerRef = useRef(null);

  const queryClient = useQueryClient();
  const { school_tenant_id, isReady } = useSchoolContext();
  const { hasAccess, planLabel, minimumPlanLabel, loading: planLoading } = usePlanAccess('examCbt');

  const { data: exam } = useQuery({
    queryKey: ['exam', examId, school_tenant_id],
    queryFn: async () => {
      // Security: only load exam from the student's school tenant
      const exams = await base44.entities.Exam.filter(addSchoolFilter({ id: examId }, school_tenant_id));
      return exams[0] || null;
    },
    enabled: !!examId && isReady,
  });

  const { data: questions = [] } = useQuery({
    queryKey: ['exam-questions', examId, school_tenant_id],
    queryFn: async () => {
      // Security: only load questions belonging to this school's exam
      const allQuestions = await base44.entities.ExamQuestion.filter(
        addSchoolFilter({ exam_id: examId }, school_tenant_id)
      );
      return allQuestions.sort((a, b) => a.order - b.order);
    },
    enabled: !!examId && isReady,
  });

  const [studentProfile, setStudentProfile] = useState(null);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const user = await base44.auth.me();
        setCurrentUser(user);
        
        const students = await base44.entities.Student.filter({ user_id: user.id });
        if (students.length > 0) {
          setStudentProfile(students[0]);
        }
      } catch (error) {
        console.error('Error fetching user:', error);
      }
    };
    fetchUser();
  }, []);

  // Start exam and create attempt
  const startExamMutation = useMutation({
    mutationFn: async () => {
      const attempt = await base44.entities.ExamAttempt.create(withSchoolId({
        exam_id: examId,
        student_id: studentProfile.id,
        student_name: `${studentProfile.first_name} ${studentProfile.last_name}`,
        start_time: new Date().toISOString(),
        status: 'In Progress',
        tab_switches: 0,
        answers: JSON.stringify({}),
      }, studentProfile.school_tenant_id));
      return attempt;
    },
    onSuccess: (attempt) => {
      setAttemptId(attempt.id);
      setTimeRemaining(exam.duration_minutes * 60);
      setExamStarted(true);
      
      if (exam.fullscreen_mode) {
        document.documentElement.requestFullscreen?.();
      }
      
      if (exam.enable_proctoring) {
        startProctoring();
      }
    },
  });

  // Auto-save answers
  const autosaveMutation = useMutation({
    mutationFn: async (data) => {
      if (!attemptId) return;
      return base44.entities.ExamAttempt.update(attemptId, {
        answers: JSON.stringify(answers),
        tab_switches: tabSwitches,
        proctoring_snapshots: JSON.stringify(proctoringSnapshots),
      });
    },
  });

  // Submit exam
  const submitExamMutation = useMutation({
    mutationFn: async () => {
      const endTime = new Date().toISOString();
      const timeSpent = (exam.duration_minutes * 60) - timeRemaining;
      
      // Auto-grade MCQs
      let score = 0;
      questions.forEach(q => {
        if ((q.question_type === 'Multiple Choice' || q.question_type === 'True/False') && answers[q.id]) {
          if (answers[q.id] === q.correct_answer) {
            score += q.points;
          } else if (q.negative_marking > 0) {
            score -= q.negative_marking;
          }
        }
      });

      const totalPoints = questions.reduce((sum, q) => sum + q.points, 0);
      const percentage = totalPoints > 0 ? (score / totalPoints) * 100 : 0;

      await base44.entities.ExamAttempt.update(attemptId, {
        end_time: endTime,
        time_spent_seconds: timeSpent,
        answers: JSON.stringify(answers),
        score: score,
        percentage: percentage,
        status: questions.some(q => q.question_type === 'Essay' || q.question_type === 'Theory') ? 'Submitted' : 'Graded',
        tab_switches: tabSwitches,
        proctoring_snapshots: JSON.stringify(proctoringSnapshots),
      });

      // Create exam result
      await base44.entities.ExamResult.create(withSchoolId({
        exam_id: examId,
        attempt_id: attemptId,
        student_id: studentProfile.id,
        student_name: `${studentProfile.first_name} ${studentProfile.last_name}`,
        subject: exam.subject,
        exam_type: exam.exam_type,
        score: score,
        percentage: percentage,
        session_id: exam.session_id,
        term_id: exam.term_id,
        published: false,
      }, studentProfile.school_tenant_id));

      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }

      return { score, percentage };
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ['exam-attempts'] });
      alert(`Exam submitted successfully! Score: ${result.percentage.toFixed(2)}%`);
      window.location.href = '/';
    },
  });

  // Timer countdown
  useEffect(() => {
    if (!examStarted || timeRemaining <= 0) return;

    const timer = setInterval(() => {
      setTimeRemaining(prev => {
        if (prev <= 1) {
          submitExamMutation.mutate();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [examStarted, timeRemaining]);

  // Auto-save every 30 seconds
  useEffect(() => {
    if (!examStarted) return;

    autosaveTimerRef.current = setInterval(() => {
      autosaveMutation.mutate();
    }, 30000);

    return () => clearInterval(autosaveTimerRef.current);
  }, [examStarted, answers, tabSwitches]);

  // Tab switch detection
  useEffect(() => {
    if (!examStarted || !exam?.fullscreen_mode) return;

    const handleVisibilityChange = () => {
      if (document.hidden) {
        setTabSwitches(prev => prev + 1);
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [examStarted, exam]);

  // Disable copy/paste
  useEffect(() => {
    if (!examStarted || !exam?.disable_copy_paste) return;

    const preventCopy = (e) => e.preventDefault();
    const preventPaste = (e) => e.preventDefault();
    const preventCut = (e) => e.preventDefault();

    document.addEventListener('copy', preventCopy);
    document.addEventListener('paste', preventPaste);
    document.addEventListener('cut', preventCut);

    return () => {
      document.removeEventListener('copy', preventCopy);
      document.removeEventListener('paste', preventPaste);
      document.removeEventListener('cut', preventCut);
    };
  }, [examStarted, exam]);

  // Proctoring
  const startProctoring = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }

      // Capture snapshot every 30 seconds
      setInterval(() => {
        captureSnapshot();
      }, 30000);
    } catch (err) {
      console.error('Camera access denied:', err);
    }
  };

  const captureSnapshot = () => {
    if (!videoRef.current) return;
    
    const canvas = document.createElement('canvas');
    canvas.width = videoRef.current.videoWidth;
    canvas.height = videoRef.current.videoHeight;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(videoRef.current, 0, 0);
    
    const dataUrl = canvas.toDataURL('image/jpeg', 0.5);
    setProctoringSnapshots(prev => [...prev, { timestamp: new Date().toISOString(), image: dataUrl }]);
  };

  const handleAnswerChange = (questionId, value) => {
    setAnswers(prev => ({ ...prev, [questionId]: value }));
  };

  if (planLoading) return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600" />
    </div>
  );
  if (!hasAccess) return (
    <UpgradePrompt
      feature="Online Exams"
      currentPlan={planLabel}
      minimumPlan={minimumPlanLabel}
    />
  );

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (!exam || !currentUser) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!examStarted) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
        <Card className="max-w-2xl w-full">
          <CardHeader>
            <CardTitle className="text-2xl">{exam.title}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-600">Duration</p>
                <p className="font-semibold">{exam.duration_minutes} minutes</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Total Questions</p>
                <p className="font-semibold">{questions.length}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Total Points</p>
                <p className="font-semibold">{exam.total_points}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Passing Score</p>
                <p className="font-semibold">{exam.passing_score}%</p>
              </div>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 space-y-2">
              <p className="font-semibold text-blue-900">Instructions:</p>
              <ul className="list-disc list-inside text-sm text-blue-800 space-y-1">
                {exam.fullscreen_mode && <li>Exam will be in fullscreen mode</li>}
                {exam.enable_proctoring && <li>Your webcam will be used for proctoring</li>}
                {exam.disable_copy_paste && <li>Copy/paste is disabled</li>}
                <li>Your answers will be auto-saved every 30 seconds</li>
                <li>Timer will start when you click "Start Exam"</li>
              </ul>
            </div>

            {tabSwitches > 5 && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <p className="text-red-800 text-sm">⚠️ Warning: Excessive tab switches detected ({tabSwitches})</p>
              </div>
            )}

            <Button
              onClick={() => startExamMutation.mutate()}
              className="w-full bg-blue-600 hover:bg-blue-700"
              disabled={startExamMutation.isPending}
            >
              Start Exam
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const question = questions[currentQuestion];
  const answeredCount = Object.keys(answers).length;
  const flaggedCount = Object.keys(flagged).filter(k => flagged[k]).length;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header with Timer */}
      <div className="bg-white shadow-md sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-gray-900">{exam.title}</h2>
            <p className="text-sm text-gray-600">Question {currentQuestion + 1} of {questions.length}</p>
          </div>
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-green-600" />
              <span className="text-sm font-medium">{answeredCount}/{questions.length} Answered</span>
            </div>
            {flaggedCount > 0 && (
              <div className="flex items-center gap-2">
                <Flag className="w-5 h-5 text-orange-600" />
                <span className="text-sm font-medium">{flaggedCount} Flagged</span>
              </div>
            )}
            <div className={`flex items-center gap-2 px-4 py-2 rounded-lg ${timeRemaining < 300 ? 'bg-red-100' : 'bg-blue-100'}`}>
              <Clock className={`w-5 h-5 ${timeRemaining < 300 ? 'text-red-600' : 'text-blue-600'}`} />
              <span className={`text-lg font-bold ${timeRemaining < 300 ? 'text-red-600' : 'text-blue-600'}`}>
                {formatTime(timeRemaining)}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto p-6">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Question Panel */}
          <div className="lg:col-span-3">
            <Card className="bg-white shadow-lg">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Badge className="bg-blue-600 text-white">Question {currentQuestion + 1}</Badge>
                    <Badge variant="outline">{question.question_type}</Badge>
                    <Badge className="bg-green-100 text-green-800">{question.points} points</Badge>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setFlagged(prev => ({ ...prev, [question.id]: !prev[question.id] }))}
                    className={flagged[question.id] ? 'text-orange-600' : 'text-gray-400'}
                  >
                    <Flag className="w-5 h-5" fill={flagged[question.id] ? 'currentColor' : 'none'} />
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="text-lg text-gray-900">{question.question_text}</div>

                {question.media_url && (
                  <img src={question.media_url} alt="Question media" className="max-w-full rounded-lg" />
                )}

                {/* MCQ/True-False */}
                {(question.question_type === 'Multiple Choice' || question.question_type === 'True/False') && question.options && (
                  <div className="space-y-3">
                    {JSON.parse(question.options).map((option, idx) => (
                      <label
                        key={idx}
                        className={`flex items-center gap-3 p-4 border-2 rounded-lg cursor-pointer transition-all ${
                          answers[question.id] === option ? 'border-blue-600 bg-blue-50' : 'border-gray-200 hover:border-blue-300'
                        }`}
                      >
                        <input
                          type="radio"
                          name={`question-${question.id}`}
                          value={option}
                          checked={answers[question.id] === option}
                          onChange={(e) => handleAnswerChange(question.id, e.target.value)}
                          className="w-5 h-5"
                        />
                        <span className="text-gray-900">{option}</span>
                      </label>
                    ))}
                  </div>
                )}

                {/* Essay/Theory/Short Answer */}
                {(question.question_type === 'Essay' || question.question_type === 'Theory' || question.question_type === 'Short Answer') && (
                  <Textarea
                    value={answers[question.id] || ''}
                    onChange={(e) => handleAnswerChange(question.id, e.target.value)}
                    rows={question.question_type === 'Essay' || question.question_type === 'Theory' ? 10 : 4}
                    placeholder="Type your answer here..."
                    className="w-full"
                  />
                )}

                {/* Navigation */}
                <div className="flex items-center justify-between pt-6 border-t">
                  <Button
                    variant="outline"
                    onClick={() => setCurrentQuestion(prev => Math.max(0, prev - 1))}
                    disabled={currentQuestion === 0}
                  >
                    <ChevronLeft className="w-4 h-4 mr-2" />
                    Previous
                  </Button>
                  {currentQuestion === questions.length - 1 ? (
                    <Button
                      onClick={() => {
                        if (confirm('Are you sure you want to submit your exam?')) {
                          submitExamMutation.mutate();
                        }
                      }}
                      className="bg-green-600 hover:bg-green-700"
                      disabled={submitExamMutation.isPending}
                    >
                      Submit Exam
                    </Button>
                  ) : (
                    <Button
                      onClick={() => setCurrentQuestion(prev => Math.min(questions.length - 1, prev + 1))}
                      className="bg-blue-600 hover:bg-blue-700"
                    >
                      Next
                      <ChevronRight className="w-4 h-4 ml-2" />
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Navigation Panel */}
          <div className="space-y-6">
            {exam.enable_proctoring && (
              <Card className="bg-white shadow-md">
                <CardHeader>
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Camera className="w-4 h-4" />
                    Proctoring Active
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <video
                    ref={videoRef}
                    autoPlay
                    muted
                    className="w-full rounded-lg"
                  />
                </CardContent>
              </Card>
            )}

            <Card className="bg-white shadow-md">
              <CardHeader>
                <CardTitle className="text-sm">Question Navigator</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-5 gap-2">
                  {questions.map((q, idx) => (
                    <button
                      key={q.id}
                      onClick={() => setCurrentQuestion(idx)}
                      className={`aspect-square rounded-lg text-sm font-medium transition-all ${
                        idx === currentQuestion
                          ? 'bg-blue-600 text-white'
                          : answers[q.id]
                          ? 'bg-green-100 text-green-800 hover:bg-green-200'
                          : flagged[q.id]
                          ? 'bg-orange-100 text-orange-800 hover:bg-orange-200'
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}
                    >
                      {idx + 1}
                    </button>
                  ))}
                </div>
              </CardContent>
            </Card>

            {tabSwitches > 0 && (
              <Card className="bg-yellow-50 border-yellow-200">
                <CardContent className="p-4">
                  <div className="flex items-start gap-2">
                    <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm font-semibold text-yellow-900">Tab Switches: {tabSwitches}</p>
                      <p className="text-xs text-yellow-800">Avoid switching tabs during exam</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}