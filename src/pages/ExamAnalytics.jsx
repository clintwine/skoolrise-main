import React from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { TrendingUp, Award, AlertCircle, Target } from 'lucide-react';

export default function ExamAnalytics() {
  const urlParams = new URLSearchParams(window.location.search);
  const examId = urlParams.get('id');

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
      return allQuestions.filter(q => q.exam_id === examId);
    },
    enabled: !!examId,
  });

  const { data: attempts = [] } = useQuery({
    queryKey: ['exam-attempts', examId],
    queryFn: async () => {
      const allAttempts = await base44.entities.ExamAttempt.list();
      return allAttempts.filter(a => a.exam_id === examId && a.status === 'Graded');
    },
    enabled: !!examId,
  });

  const { data: results = [] } = useQuery({
    queryKey: ['exam-results', examId],
    queryFn: async () => {
      const allResults = await base44.entities.ExamResult.list();
      return allResults.filter(r => r.exam_id === examId);
    },
    enabled: !!examId,
  });

  if (!exam || attempts.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <p className="text-gray-600">No data available for analytics</p>
        </div>
      </div>
    );
  }

  // Item Analysis
  const itemAnalysis = questions.map(q => {
    const mcqAttempts = attempts.filter(a => {
      const answers = JSON.parse(a.answers || '{}');
      return answers[q.id] !== undefined;
    });

    const correct = mcqAttempts.filter(a => {
      const answers = JSON.parse(a.answers || '{}');
      return answers[q.id] === q.correct_answer;
    }).length;

    const difficulty = mcqAttempts.length > 0 ? (correct / mcqAttempts.length) * 100 : 0;
    
    return {
      question: `Q${q.order}`,
      difficulty: difficulty,
      attempts: mcqAttempts.length,
      correct: correct,
      incorrect: mcqAttempts.length - correct,
    };
  });

  // Performance Distribution
  const scoreRanges = [
    { range: '0-40%', count: 0, color: '#ef4444' },
    { range: '41-60%', count: 0, color: '#f97316' },
    { range: '61-80%', count: 0, color: '#eab308' },
    { range: '81-100%', count: 0, color: '#22c55e' },
  ];

  results.forEach(r => {
    if (r.percentage <= 40) scoreRanges[0].count++;
    else if (r.percentage <= 60) scoreRanges[1].count++;
    else if (r.percentage <= 80) scoreRanges[2].count++;
    else scoreRanges[3].count++;
  });

  // Topic Performance
  const topicPerformance = {};
  questions.forEach(q => {
    const topic = q.question_text.split(' ')[0]; // Simplified - could use actual topic field
    if (!topicPerformance[topic]) {
      topicPerformance[topic] = { total: 0, correct: 0 };
    }
    topicPerformance[topic].total++;
  });

  const topicData = Object.keys(topicPerformance).map(topic => ({
    topic,
    performance: (topicPerformance[topic].correct / topicPerformance[topic].total) * 100,
  }));

  // Rankings
  const rankings = results
    .map(r => ({ name: r.student_name, score: r.percentage }))
    .sort((a, b) => b.score - a.score)
    .slice(0, 10);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Exam Analytics</h1>
        <p className="text-gray-600 mt-1">{exam.title}</p>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-white shadow-md">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Attempts</p>
                <p className="text-3xl font-bold text-blue-600">{attempts.length}</p>
              </div>
              <TrendingUp className="w-8 h-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>
        <Card className="bg-white shadow-md">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Average Score</p>
                <p className="text-3xl font-bold text-green-600">
                  {(results.reduce((sum, r) => sum + r.percentage, 0) / results.length).toFixed(1)}%
                </p>
              </div>
              <Target className="w-8 h-8 text-green-600" />
            </div>
          </CardContent>
        </Card>
        <Card className="bg-white shadow-md">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Pass Rate</p>
                <p className="text-3xl font-bold text-purple-600">
                  {((results.filter(r => r.percentage >= (exam.passing_score || 40)).length / results.length) * 100).toFixed(1)}%
                </p>
              </div>
              <Award className="w-8 h-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>
        <Card className="bg-white shadow-md">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Flags</p>
                <p className="text-3xl font-bold text-orange-600">
                  {attempts.reduce((sum, a) => sum + (a.tab_switches || 0), 0)}
                </p>
              </div>
              <AlertCircle className="w-8 h-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Item Analysis */}
        <Card className="bg-white shadow-md">
          <CardHeader>
            <CardTitle>Item Analysis</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={itemAnalysis}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="question" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="correct" fill="#22c55e" name="Correct" />
                <Bar dataKey="incorrect" fill="#ef4444" name="Incorrect" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Performance Distribution */}
        <Card className="bg-white shadow-md">
          <CardHeader>
            <CardTitle>Performance Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={scoreRanges}
                  dataKey="count"
                  nameKey="range"
                  cx="50%"
                  cy="50%"
                  outerRadius={100}
                  label
                >
                  {scoreRanges.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Top 10 Rankings */}
        <Card className="bg-white shadow-md">
          <CardHeader>
            <CardTitle>Top 10 Performers</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {rankings.map((student, idx) => (
                <div key={idx} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <Badge className={idx === 0 ? 'bg-yellow-400 text-yellow-900' : idx === 1 ? 'bg-gray-300 text-gray-900' : idx === 2 ? 'bg-orange-300 text-orange-900' : 'bg-blue-100 text-blue-800'}>
                      #{idx + 1}
                    </Badge>
                    <span className="font-medium">{student.name}</span>
                  </div>
                  <span className="font-bold text-green-600">{student.score.toFixed(2)}%</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Question Difficulty Analysis */}
        <Card className="bg-white shadow-md">
          <CardHeader>
            <CardTitle>Question Difficulty</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {itemAnalysis.slice(0, 10).map((item, idx) => (
                <div key={idx} className="space-y-1">
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium">{item.question}</span>
                    <span className={`font-semibold ${item.difficulty > 70 ? 'text-green-600' : item.difficulty > 40 ? 'text-yellow-600' : 'text-red-600'}`}>
                      {item.difficulty.toFixed(1)}%
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full ${item.difficulty > 70 ? 'bg-green-500' : item.difficulty > 40 ? 'bg-yellow-500' : 'bg-red-500'}`}
                      style={{ width: `${item.difficulty}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}