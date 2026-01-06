import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, AlertCircle, Camera } from 'lucide-react';

export default function GradeExam() {
  const urlParams = new URLSearchParams(window.location.search);
  const examId = urlParams.get('id');
  const [selectedAttempt, setSelectedAttempt] = useState(null);
  const queryClient = useQueryClient();

  const { data: exam } = useQuery({
    queryKey: ['exam', examId],
    queryFn: async () => {
      const exams = await base44.entities.Exam.list();
      return exams.find(e => e.id === examId);
    },
    enabled: !!examId,
  });

  const { data: questions = [] } = useQuery({
    queryKey: ['exam-questions', examId],
    queryFn: async () => {
      const allQuestions = await base44.entities.ExamQuestion.list();
      return allQuestions.filter(q => q.exam_id === examId).sort((a, b) => a.order - b.order);
    },
    enabled: !!examId,
  });

  const { data: attempts = [] } = useQuery({
    queryKey: ['exam-attempts', examId],
    queryFn: async () => {
      const allAttempts = await base44.entities.ExamAttempt.list();
      return allAttempts.filter(a => a.exam_id === examId && (a.status === 'Submitted' || a.status === 'Graded'));
    },
    enabled: !!examId,
  });

  const gradeMutation = useMutation({
    mutationFn: async ({ attemptId, grades, totalScore, feedback }) => {
      const attempt = attempts.find(a => a.id === attemptId);
      const answers = JSON.parse(attempt.answers || '{}');

      // Merge manual grades with auto-graded scores
      const finalScore = totalScore;
      const percentage = exam.total_points > 0 ? (finalScore / exam.total_points) * 100 : 0;

      await base44.entities.ExamAttempt.update(attemptId, {
        score: finalScore,
        percentage: percentage,
        status: 'Graded',
        feedback: feedback,
        graded_by: (await base44.auth.me()).email,
      });

      // Update or create result
      const existingResults = await base44.entities.ExamResult.list();
      const existingResult = existingResults.find(r => r.attempt_id === attemptId);

      if (existingResult) {
        await base44.entities.ExamResult.update(existingResult.id, {
          score: finalScore,
          percentage: percentage,
        });
      } else {
        await base44.entities.ExamResult.create({
          exam_id: examId,
          attempt_id: attemptId,
          student_id: attempt.student_id,
          student_name: attempt.student_name,
          subject: exam.subject,
          exam_type: exam.exam_type,
          score: finalScore,
          percentage: percentage,
          session_id: exam.session_id,
          term_id: exam.term_id,
          published: false,
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['exam-attempts'] });
      alert('Grading saved successfully!');
      setSelectedAttempt(null);
    },
  });

  if (!examId) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Grade Exam</h1>
          <p className="text-gray-600 mt-1">Grade student exam submissions</p>
        </div>
        <Card className="bg-white rounded-xl shadow-md">
          <CardContent className="p-16 text-center">
            <CheckCircle className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No Exam Selected</h3>
            <p className="text-gray-600">Please select an exam from the Exam Management page to grade submissions.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!exam) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const needsGrading = attempts.filter(a => a.status === 'Submitted');
  const graded = attempts.filter(a => a.status === 'Graded');

  if (selectedAttempt) {
    return <GradingInterface
      attempt={selectedAttempt}
      exam={exam}
      questions={questions}
      onSubmit={(data) => gradeMutation.mutate({ ...data, attemptId: selectedAttempt.id })}
      onCancel={() => setSelectedAttempt(null)}
    />;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Grade Exam: {exam.title}</h1>
        <p className="text-gray-600 mt-1">{needsGrading.length} submissions need grading</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="bg-white shadow-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-orange-600" />
              Needs Grading ({needsGrading.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {needsGrading.map((attempt) => (
              <div key={attempt.id} className="p-4 border rounded-lg hover:bg-gray-50">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-semibold">{attempt.student_name}</p>
                    <p className="text-sm text-gray-600">
                      Submitted: {new Date(attempt.end_time).toLocaleString()}
                    </p>
                    {attempt.tab_switches > 0 && (
                      <Badge className="bg-yellow-100 text-yellow-800 mt-1">
                        {attempt.tab_switches} tab switches
                      </Badge>
                    )}
                  </div>
                  <Button
                    onClick={() => setSelectedAttempt(attempt)}
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    Grade
                  </Button>
                </div>
              </div>
            ))}
            {needsGrading.length === 0 && (
              <p className="text-center text-gray-500 py-8">No submissions to grade</p>
            )}
          </CardContent>
        </Card>

        <Card className="bg-white shadow-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-green-600" />
              Graded ({graded.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 max-h-[600px] overflow-y-auto">
            {graded.map((attempt) => (
              <div key={attempt.id} className="p-4 border rounded-lg">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <p className="font-semibold">{attempt.student_name}</p>
                    <p className="text-sm text-gray-600">
                      Score: {attempt.score}/{exam.total_points} ({attempt.percentage?.toFixed(2)}%)
                    </p>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setSelectedAttempt(attempt)}
                  >
                    Review
                  </Button>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function GradingInterface({ attempt, exam, questions, onSubmit, onCancel }) {
  const answers = JSON.parse(attempt.answers || '{}');
  const [grades, setGrades] = useState({});
  const [feedback, setFeedback] = useState(attempt.feedback || '');
  const [showProctoring, setShowProctoring] = useState(false);

  const snapshots = attempt.proctoring_snapshots ? JSON.parse(attempt.proctoring_snapshots) : [];

  // Calculate initial score (auto-graded MCQs)
  let autoGradedScore = 0;
  questions.forEach(q => {
    if ((q.question_type === 'Multiple Choice' || q.question_type === 'True/False') && answers[q.id]) {
      if (answers[q.id] === q.correct_answer) {
        autoGradedScore += q.points;
      } else if (q.negative_marking > 0) {
        autoGradedScore -= q.negative_marking;
      }
    }
  });

  const manualGradingQuestions = questions.filter(q =>
    q.question_type === 'Essay' || q.question_type === 'Theory' || q.question_type === 'Short Answer'
  );

  const totalManualScore = Object.values(grades).reduce((sum, val) => sum + (parseFloat(val) || 0), 0);
  const finalScore = autoGradedScore + totalManualScore;

  const handleSubmit = () => {
    if (manualGradingQuestions.some(q => grades[q.id] === undefined)) {
      if (!confirm('Some questions are not graded. Continue?')) return;
    }
    onSubmit({ grades, totalScore: finalScore, feedback });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Grading: {attempt.student_name}</h2>
          <p className="text-gray-600">Submitted: {new Date(attempt.end_time).toLocaleString()}</p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" onClick={onCancel}>Cancel</Button>
          <Button onClick={handleSubmit} className="bg-green-600 hover:bg-green-700">
            Save Grading
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-3 space-y-6">
          {questions.map((question, idx) => {
            const studentAnswer = answers[question.id];
            const isCorrect = studentAnswer === question.correct_answer;
            const isAutoGraded = question.question_type === 'Multiple Choice' || question.question_type === 'True/False';

            return (
              <Card key={question.id} className="bg-white shadow-md">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Badge>Q{idx + 1}</Badge>
                      <Badge variant="outline">{question.question_type}</Badge>
                      <Badge className="bg-blue-100 text-blue-800">{question.points} pts</Badge>
                      {isAutoGraded && (
                        <Badge className={isCorrect ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}>
                          {isCorrect ? 'Correct' : 'Incorrect'}
                        </Badge>
                      )}
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-gray-900 font-medium">{question.question_text}</p>

                  {isAutoGraded && (
                    <div className="space-y-2">
                      <div className="bg-gray-50 p-3 rounded">
                        <p className="text-sm text-gray-600">Student Answer:</p>
                        <p className="font-medium">{studentAnswer || 'Not answered'}</p>
                      </div>
                      <div className="bg-green-50 p-3 rounded">
                        <p className="text-sm text-gray-600">Correct Answer:</p>
                        <p className="font-medium">{question.correct_answer}</p>
                      </div>
                    </div>
                  )}

                  {!isAutoGraded && (
                    <div className="space-y-3">
                      <div className="bg-gray-50 p-4 rounded">
                        <p className="text-sm text-gray-600 mb-2">Student Answer:</p>
                        <p className="whitespace-pre-wrap">{studentAnswer || 'Not answered'}</p>
                      </div>
                      {question.correct_answer && (
                        <div className="bg-blue-50 p-4 rounded">
                          <p className="text-sm text-gray-600 mb-2">Marking Scheme:</p>
                          <p className="whitespace-pre-wrap">{question.correct_answer}</p>
                        </div>
                      )}
                      <div className="flex items-center gap-4">
                        <label className="text-sm font-medium">Score:</label>
                        <Input
                          type="number"
                          min="0"
                          max={question.points}
                          step="0.5"
                          value={grades[question.id] || ''}
                          onChange={(e) => setGrades({ ...grades, [question.id]: e.target.value })}
                          className="w-24"
                          placeholder="0"
                        />
                        <span className="text-sm text-gray-600">/ {question.points}</span>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}

          <Card className="bg-white shadow-md">
            <CardHeader>
              <CardTitle>Overall Feedback</CardTitle>
            </CardHeader>
            <CardContent>
              <Textarea
                value={feedback}
                onChange={(e) => setFeedback(e.target.value)}
                rows={4}
                placeholder="Provide feedback to the student..."
              />
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card className="bg-white shadow-md">
            <CardHeader>
              <CardTitle className="text-sm">Score Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <p className="text-sm text-gray-600">Auto-graded (MCQ)</p>
                <p className="text-2xl font-bold text-blue-600">{autoGradedScore}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Manual grading</p>
                <p className="text-2xl font-bold text-orange-600">{totalManualScore}</p>
              </div>
              <div className="pt-3 border-t">
                <p className="text-sm text-gray-600">Total Score</p>
                <p className="text-3xl font-bold text-green-600">{finalScore} / {exam.total_points}</p>
                <p className="text-lg text-gray-700">{((finalScore / exam.total_points) * 100).toFixed(2)}%</p>
              </div>
            </CardContent>
          </Card>

          {attempt.tab_switches > 0 && (
            <Card className="bg-yellow-50 border-yellow-200">
              <CardContent className="p-4">
                <p className="text-sm font-semibold text-yellow-900">⚠️ Tab Switches: {attempt.tab_switches}</p>
                <p className="text-xs text-yellow-800 mt-1">Student switched tabs during exam</p>
              </CardContent>
            </Card>
          )}

          {snapshots.length > 0 && (
            <Card className="bg-white shadow-md">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Camera className="w-4 h-4" />
                    Proctoring ({snapshots.length})
                  </CardTitle>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowProctoring(!showProctoring)}
                  >
                    {showProctoring ? 'Hide' : 'Show'}
                  </Button>
                </div>
              </CardHeader>
              {showProctoring && (
                <CardContent className="space-y-2 max-h-[400px] overflow-y-auto">
                  {snapshots.map((snap, idx) => (
                    <div key={idx} className="border rounded p-2">
                      <img src={snap.image} alt={`Snapshot ${idx + 1}`} className="w-full rounded" />
                      <p className="text-xs text-gray-600 mt-1">
                        {new Date(snap.timestamp).toLocaleTimeString()}
                      </p>
                    </div>
                  ))}
                </CardContent>
              )}
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}