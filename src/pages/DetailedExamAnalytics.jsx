import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { BarChart3, TrendingUp, Target, Users, Award } from 'lucide-react';

export default function DetailedExamAnalytics() {
  const [selectedExam, setSelectedExam] = useState('');
  const [selectedClass, setSelectedClass] = useState('all');

  const { data: exams = [] } = useQuery({
    queryKey: ['exams'],
    queryFn: () => base44.entities.Exam.list('-created_date'),
  });

  const { data: results = [] } = useQuery({
    queryKey: ['exam-results', selectedExam],
    queryFn: async () => {
      const allResults = await base44.entities.ExamResult.list();
      return selectedExam ? allResults.filter(r => r.exam_id === selectedExam) : [];
    },
    enabled: !!selectedExam,
  });

  const { data: questions = [] } = useQuery({
    queryKey: ['exam-questions', selectedExam],
    queryFn: async () => {
      const allQuestions = await base44.entities.ExamQuestion.list();
      return selectedExam ? allQuestions.filter(q => q.exam_id === selectedExam) : [];
    },
    enabled: !!selectedExam,
  });

  const { data: attempts = [] } = useQuery({
    queryKey: ['exam-attempts', selectedExam],
    queryFn: async () => {
      const allAttempts = await base44.entities.ExamAttempt.list();
      return selectedExam ? allAttempts.filter(a => a.exam_id === selectedExam) : [];
    },
    enabled: !!selectedExam,
  });

  const filteredResults = selectedClass === 'all' 
    ? results 
    : results.filter(r => r.class_id === selectedClass);

  // Calculate statistics
  const averageScore = filteredResults.length > 0
    ? (filteredResults.reduce((sum, r) => sum + r.percentage, 0) / filteredResults.length).toFixed(1)
    : 0;

  const passRate = filteredResults.length > 0
    ? ((filteredResults.filter(r => r.percentage >= 50).length / filteredResults.length) * 100).toFixed(1)
    : 0;

  const highestScore = filteredResults.length > 0
    ? Math.max(...filteredResults.map(r => r.percentage)).toFixed(1)
    : 0;

  const lowestScore = filteredResults.length > 0
    ? Math.min(...filteredResults.map(r => r.percentage)).toFixed(1)
    : 0;

  const averageTime = attempts.length > 0
    ? (attempts.reduce((sum, a) => sum + (a.time_taken || 0), 0) / attempts.length).toFixed(1)
    : 0;

  // Question difficulty analysis
  const questionAnalysis = questions.map(q => {
    const questionAttempts = attempts.filter(a => {
      const answers = a.answers ? JSON.parse(a.answers) : {};
      return answers[q.id];
    });

    const correctCount = questionAttempts.filter(a => {
      const answers = JSON.parse(a.answers);
      return answers[q.id]?.is_correct;
    }).length;

    const successRate = questionAttempts.length > 0
      ? ((correctCount / questionAttempts.length) * 100).toFixed(1)
      : 0;

    return {
      question: q,
      successRate: parseFloat(successRate),
      attemptCount: questionAttempts.length,
    };
  });

  questionAnalysis.sort((a, b) => a.successRate - b.successRate);

  // Grade distribution
  const gradeRanges = [
    { label: 'A (90-100%)', min: 90, max: 100, color: 'bg-green-500' },
    { label: 'B (80-89%)', min: 80, max: 89, color: 'bg-blue-500' },
    { label: 'C (70-79%)', min: 70, max: 79, color: 'bg-yellow-500' },
    { label: 'D (60-69%)', min: 60, max: 69, color: 'bg-orange-500' },
    { label: 'F (0-59%)', min: 0, max: 59, color: 'bg-red-500' },
  ];

  const gradeDistribution = gradeRanges.map(range => ({
    ...range,
    count: filteredResults.filter(r => r.percentage >= range.min && r.percentage <= range.max).length,
  }));

  const maxCount = Math.max(...gradeDistribution.map(g => g.count), 1);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Detailed Exam Analytics</h1>
        <p className="text-gray-600 mt-1">In-depth analysis of exam performance and question difficulty</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Select Exam</label>
              <Select value={selectedExam} onValueChange={setSelectedExam}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose exam" />
                </SelectTrigger>
                <SelectContent>
                  {exams.map(exam => (
                    <SelectItem key={exam.id} value={exam.id}>
                      {exam.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {selectedExam && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Average Score</p>
                    <p className="text-2xl font-bold text-blue-600">{averageScore}%</p>
                  </div>
                  <BarChart3 className="w-8 h-8 text-blue-600" />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Pass Rate</p>
                    <p className="text-2xl font-bold text-green-600">{passRate}%</p>
                  </div>
                  <Target className="w-8 h-8 text-green-600" />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Highest</p>
                    <p className="text-2xl font-bold text-purple-600">{highestScore}%</p>
                  </div>
                  <Award className="w-8 h-8 text-purple-600" />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Lowest</p>
                    <p className="text-2xl font-bold text-orange-600">{lowestScore}%</p>
                  </div>
                  <TrendingUp className="w-8 h-8 text-orange-600" />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Avg Time</p>
                    <p className="text-2xl font-bold text-gray-900">{averageTime} min</p>
                  </div>
                  <Users className="w-8 h-8 text-gray-600" />
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Grade Distribution</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {gradeDistribution.map((grade) => (
                  <div key={grade.label}>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-gray-700">{grade.label}</span>
                      <span className="text-sm font-semibold text-gray-900">{grade.count} students</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-6">
                      <div
                        className={`${grade.color} h-6 rounded-full flex items-center justify-end pr-2`}
                        style={{ width: `${(grade.count / maxCount) * 100}%` }}
                      >
                        <span className="text-xs font-semibold text-white">
                          {filteredResults.length > 0 ? ((grade.count / filteredResults.length) * 100).toFixed(1) : 0}%
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Question Difficulty Analysis</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {questionAnalysis.map((analysis, index) => (
                  <div key={analysis.question.id} className="p-4 border rounded-lg">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1">
                        <p className="font-medium text-gray-900">Question {index + 1}</p>
                        <p className="text-sm text-gray-600 mt-1">{analysis.question.question_text.substring(0, 100)}...</p>
                      </div>
                      <div className="text-right ml-4">
                        <Badge className={
                          analysis.successRate >= 70 ? 'bg-green-100 text-green-800' :
                          analysis.successRate >= 50 ? 'bg-yellow-100 text-yellow-800' :
                          'bg-red-100 text-red-800'
                        }>
                          {analysis.successRate}% correct
                        </Badge>
                      </div>
                    </div>
                    <div className="flex items-center gap-4 text-sm text-gray-600">
                      <span>Type: {analysis.question.question_type}</span>
                      <span>Points: {analysis.question.points}</span>
                      <span>Attempts: {analysis.attemptCount}</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                      <div
                        className={`h-2 rounded-full ${
                          analysis.successRate >= 70 ? 'bg-green-500' :
                          analysis.successRate >= 50 ? 'bg-yellow-500' :
                          'bg-red-500'
                        }`}
                        style={{ width: `${analysis.successRate}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Student Performance</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Rank</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Student</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Score</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Percentage</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Grade</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {filteredResults
                      .sort((a, b) => b.percentage - a.percentage)
                      .map((result, index) => (
                        <tr key={result.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 text-sm font-medium text-gray-900">{index + 1}</td>
                          <td className="px-6 py-4 text-sm text-gray-900">{result.student_name}</td>
                          <td className="px-6 py-4 text-sm text-gray-900">{result.score}/{result.weighted_score}</td>
                          <td className="px-6 py-4 text-sm font-semibold text-gray-900">{result.percentage}%</td>
                          <td className="px-6 py-4">
                            <Badge className={
                              result.percentage >= 90 ? 'bg-green-100 text-green-800' :
                              result.percentage >= 80 ? 'bg-blue-100 text-blue-800' :
                              result.percentage >= 70 ? 'bg-yellow-100 text-yellow-800' :
                              result.percentage >= 60 ? 'bg-orange-100 text-orange-800' :
                              'bg-red-100 text-red-800'
                            }>
                              {result.grade}
                            </Badge>
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}