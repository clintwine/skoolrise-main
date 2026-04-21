import React from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { usePlanAccess } from '@/hooks/usePlanAccess';
import UpgradePrompt from '@/components/UpgradePrompt';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Camera, AlertTriangle, Eye, Activity } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

export default function ProctoringAnalytics() {
  const { hasAccess, planLabel, minimumPlanLabel, loading: planLoading } = usePlanAccess('proctoringAnalytics');
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

  const { data: attempts = [] } = useQuery({
    queryKey: ['exam-attempts', examId],
    queryFn: async () => {
      const allAttempts = await base44.entities.ExamAttempt.list();
      return allAttempts.filter(a => a.exam_id === examId && (a.status === 'Submitted' || a.status === 'Graded'));
    },
    enabled: !!examId,
  });

  if (planLoading) return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600" />
    </div>
  );
  if (!hasAccess) return (
    <UpgradePrompt
      feature="Proctoring Analytics"
      currentPlan={planLabel}
      minimumPlan={minimumPlanLabel}
    />
  );
  if (!exam) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const totalAttempts = attempts.length;
  const flaggedAttempts = attempts.filter(a => a.flagged_for_review || a.tab_switches > 5).length;
  const avgTabSwitches = attempts.reduce((sum, a) => sum + (a.tab_switches || 0), 0) / (totalAttempts || 1);
  const attemptsWithSnapshots = attempts.filter(a => {
    try {
      return a.proctoring_snapshots && JSON.parse(a.proctoring_snapshots).length > 0;
    } catch {
      return false;
    }
  }).length;

  // Tab switch distribution
  const tabSwitchData = [
    { range: '0', count: attempts.filter(a => (a.tab_switches || 0) === 0).length },
    { range: '1-2', count: attempts.filter(a => (a.tab_switches || 0) >= 1 && (a.tab_switches || 0) <= 2).length },
    { range: '3-5', count: attempts.filter(a => (a.tab_switches || 0) >= 3 && (a.tab_switches || 0) <= 5).length },
    { range: '6-10', count: attempts.filter(a => (a.tab_switches || 0) >= 6 && (a.tab_switches || 0) <= 10).length },
    { range: '10+', count: attempts.filter(a => (a.tab_switches || 0) > 10).length },
  ];

  // Time spent vs tab switches correlation
  const suspiciousStudents = attempts
    .filter(a => a.tab_switches > 5 || a.flagged_for_review)
    .sort((a, b) => (b.tab_switches || 0) - (a.tab_switches || 0))
    .slice(0, 10);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Proctoring Analytics</h1>
        <p className="text-gray-600 mt-1">{exam.title}</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-white shadow-md">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Attempts</p>
                <p className="text-3xl font-bold text-blue-600">{totalAttempts}</p>
              </div>
              <Activity className="w-8 h-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>
        <Card className="bg-white shadow-md">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Flagged</p>
                <p className="text-3xl font-bold text-red-600">{flaggedAttempts}</p>
              </div>
              <AlertTriangle className="w-8 h-8 text-red-600" />
            </div>
          </CardContent>
        </Card>
        <Card className="bg-white shadow-md">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Avg Tab Switches</p>
                <p className="text-3xl font-bold text-orange-600">{avgTabSwitches.toFixed(1)}</p>
              </div>
              <Eye className="w-8 h-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>
        <Card className="bg-white shadow-md">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">With Snapshots</p>
                <p className="text-3xl font-bold text-purple-600">{attemptsWithSnapshots}</p>
              </div>
              <Camera className="w-8 h-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="bg-white shadow-md">
          <CardHeader>
            <CardTitle>Tab Switch Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={tabSwitchData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="range" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="count" fill="#f97316" name="Students" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="bg-white shadow-md">
          <CardHeader>
            <CardTitle>Suspicious Activity</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {suspiciousStudents.length === 0 ? (
                <p className="text-center text-gray-500 py-8">No suspicious activity detected</p>
              ) : (
                suspiciousStudents.map((attempt, idx) => (
                  <div key={attempt.id} className="p-3 bg-red-50 border border-red-200 rounded-lg">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-semibold text-gray-900">{attempt.student_name}</p>
                        <p className="text-sm text-gray-600">
                          {attempt.tab_switches || 0} tab switches
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        {attempt.flagged_for_review && (
                          <Badge className="bg-red-600 text-white">Flagged</Badge>
                        )}
                        <Button variant="outline" size="sm">
                          Review
                        </Button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="bg-white shadow-md">
        <CardHeader>
          <CardTitle>All Attempts - Proctoring Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Student</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tab Switches</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Snapshots</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">IP Address</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {attempts.map((attempt) => {
                  let snapshotCount = 0;
                  try {
                    snapshotCount = attempt.proctoring_snapshots ? JSON.parse(attempt.proctoring_snapshots).length : 0;
                  } catch {}

                  const isSuspicious = attempt.tab_switches > 5 || attempt.flagged_for_review;

                  return (
                    <tr key={attempt.id} className={isSuspicious ? 'bg-red-50' : 'hover:bg-gray-50'}>
                      <td className="px-6 py-4 text-sm font-medium text-gray-900">{attempt.student_name}</td>
                      <td className="px-6 py-4">
                        <span className={`text-sm font-semibold ${attempt.tab_switches > 5 ? 'text-red-600' : 'text-gray-900'}`}>
                          {attempt.tab_switches || 0}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">{snapshotCount}</td>
                      <td className="px-6 py-4 text-sm text-gray-600">{attempt.ip_address || 'N/A'}</td>
                      <td className="px-6 py-4">
                        {attempt.flagged_for_review ? (
                          <Badge className="bg-red-100 text-red-800">Flagged</Badge>
                        ) : (
                          <Badge className="bg-green-100 text-green-800">Clear</Badge>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => window.location.href = `/GradeExam?id=${examId}`}
                        >
                          View Details
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
    </div>
  );
}