import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { CheckCircle, XCircle, Clock, Eye, Edit } from 'lucide-react';
import { format } from 'date-fns';

export default function ExamAttemptReview() {
  const [selectedAttempt, setSelectedAttempt] = useState(null);
  const [manualGrades, setManualGrades] = useState({});
  const [feedback, setFeedback] = useState({});

  const urlParams = new URLSearchParams(window.location.search);
  const attemptId = urlParams.get('attemptId');

  const { data: attempt, refetch } = useQuery({
    queryKey: ['exam-attempt', attemptId],
    queryFn: async () => {
      const attempts = await base44.entities.ExamAttempt.list();
      return attempts.find(a => a.id === attemptId);
    },
    enabled: !!attemptId,
  });

  const { data: exam } = useQuery({
    queryKey: ['exam', attempt?.exam_id],
    queryFn: async () => {
      const exams = await base44.entities.Exam.list();
      return exams.find(e => e.id === attempt.exam_id);
    },
    enabled: !!attempt?.exam_id,
  });

  const { data: questions = [] } = useQuery({
    queryKey: ['exam-questions', attempt?.exam_id],
    queryFn: async () => {
      const allQuestions = await base44.entities.ExamQuestion.list();
      return allQuestions.filter(q => q.exam_id === attempt.exam_id);
    },
    enabled: !!attempt?.exam_id,
  });

  useEffect(() => {
    if (attempt && questions.length > 0) {
      const answers = attempt.answers ? JSON.parse(attempt.answers) : {};
      const grades = {};
      const feedbackMap = {};
      
      questions.forEach(q => {
        grades[q.id] = answers[q.id]?.points || 0;
        feedbackMap[q.id] = answers[q.id]?.feedback || '';
      });
      
      setManualGrades(grades);
      setFeedback(feedbackMap);
    }
  }, [attempt, questions]);

  const handleGradeChange = (questionId, value) => {
    setManualGrades({ ...manualGrades, [questionId]: parseFloat(value) || 0 });
  };

  const handleFeedbackChange = (questionId, value) => {
    setFeedback({ ...feedback, [questionId]: value });
  };

  const handleSaveGrades = async () => {
    const totalScore = Object.values(manualGrades).reduce((sum, score) => sum + score, 0);
    const answers = attempt.answers ? JSON.parse(attempt.answers) : {};
    
    questions.forEach(q => {
      if (answers[q.id]) {
        answers[q.id].points = manualGrades[q.id];
        answers[q.id].feedback = feedback[q.id];
      }
    });

    await base44.entities.ExamAttempt.update(attempt.id, {
      score: totalScore,
      answers: JSON.stringify(answers),
      status: 'Graded'
    });

    refetch();
    alert('Grades saved successfully!');
  };

  if (!attempt || !exam) {
    return (
      <div className="text-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
      </div>
    );
  }

  const answers = attempt.answers ? JSON.parse(attempt.answers) : {};
  const totalPossible = questions.reduce((sum, q) => sum + q.points, 0);
  const percentage = totalPossible > 0 ? ((attempt.score / totalPossible) * 100).toFixed(1) : 0;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Exam Attempt Review</h1>
        <p className="text-gray-600 mt-1">Review and grade student responses</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Score</p>
                <p className="text-2xl font-bold text-blue-600">{attempt.score}/{totalPossible}</p>
                <p className="text-xs text-gray-500">{percentage}%</p>
              </div>
              <CheckCircle className="w-8 h-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Time Taken</p>
                <p className="text-2xl font-bold text-gray-900">{attempt.time_taken || 0} min</p>
              </div>
              <Clock className="w-8 h-8 text-gray-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Status</p>
                <Badge className={attempt.status === 'Graded' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}>
                  {attempt.status}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Questions</p>
                <p className="text-2xl font-bold text-gray-900">{questions.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Student Information</CardTitle>
            <Button onClick={handleSaveGrades} className="bg-blue-600 hover:bg-blue-700">
              <Edit className="w-4 h-4 mr-2" />
              Save Grades
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-600">Student</p>
              <p className="font-semibold">{attempt.student_name}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Exam</p>
              <p className="font-semibold">{exam.title}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Started</p>
              <p className="font-semibold">{format(new Date(attempt.start_time), 'PPp')}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Submitted</p>
              <p className="font-semibold">{attempt.end_time ? format(new Date(attempt.end_time), 'PPp') : 'In Progress'}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Question-by-Question Review</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {questions.map((question, index) => {
              const studentAnswer = answers[question.id];
              const isCorrect = studentAnswer?.is_correct;

              return (
                <div key={question.id} className="p-4 border rounded-lg">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="font-semibold text-gray-900">Question {index + 1}</span>
                        <Badge className="bg-gray-100 text-gray-800">{question.question_type}</Badge>
                        <Badge className="bg-blue-100 text-blue-800">{question.points} pts</Badge>
                        {isCorrect !== undefined && (
                          isCorrect ? 
                            <CheckCircle className="w-5 h-5 text-green-600" /> : 
                            <XCircle className="w-5 h-5 text-red-600" />
                        )}
                      </div>
                      <p className="text-gray-900 mb-3">{question.question_text}</p>

                      {question.question_type === 'Multiple Choice' && (
                        <div className="space-y-2 mb-3">
                          <p className="text-sm font-medium text-gray-700">Options:</p>
                          {JSON.parse(question.options || '[]').map((opt, i) => (
                            <div key={i} className={`p-2 rounded ${
                              studentAnswer?.answer === opt ? 'bg-blue-50 border-2 border-blue-500' : 'bg-gray-50'
                            }`}>
                              {opt}
                            </div>
                          ))}
                        </div>
                      )}

                      {(question.question_type === 'Short Answer' || question.question_type === 'Essay') && (
                        <div className="mb-3">
                          <p className="text-sm font-medium text-gray-700">Student Answer:</p>
                          <div className="p-3 bg-gray-50 rounded mt-1">
                            <p className="text-gray-900">{studentAnswer?.answer || 'No answer provided'}</p>
                          </div>
                        </div>
                      )}

                      <div className="mb-3">
                        <p className="text-sm font-medium text-gray-700">Correct Answer:</p>
                        <p className="text-gray-900">{question.correct_answer}</p>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Points Awarded
                      </label>
                      <Input
                        type="number"
                        min="0"
                        max={question.points}
                        value={manualGrades[question.id] || 0}
                        onChange={(e) => handleGradeChange(question.id, e.target.value)}
                        className="w-32"
                      />
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Feedback
                      </label>
                      <Textarea
                        value={feedback[question.id] || ''}
                        onChange={(e) => handleFeedbackChange(question.id, e.target.value)}
                        placeholder="Provide feedback for this question..."
                        rows={2}
                      />
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