import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AlertTriangle, Eye, CheckCircle, XCircle, Camera, Monitor } from 'lucide-react';
import { format } from 'date-fns';

export default function ProctoringMonitor() {
  const [selectedExam, setSelectedExam] = useState('');
  const [severityFilter, setSeverityFilter] = useState('all');
  const [reviewingLog, setReviewingLog] = useState(null);
  const [reviewNotes, setReviewNotes] = useState('');
  const [actionTaken, setActionTaken] = useState('');

  const queryClient = useQueryClient();

  const { data: exams = [] } = useQuery({
    queryKey: ['exams'],
    queryFn: () => base44.entities.Exam.list('-created_date'),
  });

  const { data: attempts = [] } = useQuery({
    queryKey: ['exam-attempts', selectedExam],
    queryFn: async () => {
      const allAttempts = await base44.entities.ExamAttempt.list();
      return selectedExam ? allAttempts.filter(a => a.exam_id === selectedExam && a.status === 'In Progress') : [];
    },
    enabled: !!selectedExam,
  });

  const { data: logs = [] } = useQuery({
    queryKey: ['proctoring-logs', selectedExam],
    queryFn: async () => {
      const allLogs = await base44.entities.ProctoringLog.list('-timestamp');
      return selectedExam ? allLogs.filter(l => l.exam_id === selectedExam) : [];
    },
    enabled: !!selectedExam,
  });

  const reviewMutation = useMutation({
    mutationFn: async ({ logId, notes, action }) => {
      return await base44.entities.ProctoringLog.update(logId, {
        requires_review: false,
        reviewed_by: (await base44.auth.me()).email,
        review_notes: notes,
        action_taken: action,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['proctoring-logs'] });
      setReviewingLog(null);
      setReviewNotes('');
      setActionTaken('');
    },
  });

  const filteredLogs = logs.filter(log => 
    severityFilter === 'all' || log.severity === severityFilter
  );

  const criticalCount = logs.filter(l => l.severity === 'Critical').length;
  const highCount = logs.filter(l => l.severity === 'High').length;
  const requiresReview = logs.filter(l => l.requires_review).length;

  const severityColors = {
    Low: 'bg-green-100 text-green-800',
    Medium: 'bg-yellow-100 text-yellow-800',
    High: 'bg-orange-100 text-orange-800',
    Critical: 'bg-red-100 text-red-800',
  };

  const severityIcons = {
    Low: <CheckCircle className="w-5 h-5 text-green-600" />,
    Medium: <AlertTriangle className="w-5 h-5 text-yellow-600" />,
    High: <AlertTriangle className="w-5 h-5 text-orange-600" />,
    Critical: <XCircle className="w-5 h-5 text-red-600" />,
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Proctoring Monitor</h1>
        <p className="text-gray-600 mt-1">Monitor and review exam proctoring events</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Active Attempts</p>
                <p className="text-2xl font-bold text-blue-600">{attempts.length}</p>
              </div>
              <Monitor className="w-8 h-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Critical Events</p>
                <p className="text-2xl font-bold text-red-600">{criticalCount}</p>
              </div>
              <AlertTriangle className="w-8 h-8 text-red-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">High Priority</p>
                <p className="text-2xl font-bold text-orange-600">{highCount}</p>
              </div>
              <AlertTriangle className="w-8 h-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Requires Review</p>
                <p className="text-2xl font-bold text-purple-600">{requiresReview}</p>
              </div>
              <Eye className="w-8 h-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>
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
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Severity Filter</label>
              <Select value={severityFilter} onValueChange={setSeverityFilter}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Severities</SelectItem>
                  <SelectItem value="Critical">Critical</SelectItem>
                  <SelectItem value="High">High</SelectItem>
                  <SelectItem value="Medium">Medium</SelectItem>
                  <SelectItem value="Low">Low</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {selectedExam && (
        <>
          <Card>
            <CardHeader>
              <CardTitle>Active Exam Attempts</CardTitle>
            </CardHeader>
            <CardContent>
              {attempts.length === 0 ? (
                <p className="text-center text-gray-500 py-8">No active attempts</p>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {attempts.map(attempt => (
                    <div key={attempt.id} className="p-4 border rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <p className="font-semibold">{attempt.student_name}</p>
                        <Camera className="w-5 h-5 text-blue-600" />
                      </div>
                      <p className="text-sm text-gray-600">Started: {format(new Date(attempt.start_time), 'p')}</p>
                      <p className="text-sm text-gray-600">Time: {attempt.time_taken || 0} min</p>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Proctoring Events</CardTitle>
            </CardHeader>
            <CardContent>
              {filteredLogs.length === 0 ? (
                <p className="text-center text-gray-500 py-8">No proctoring events recorded</p>
              ) : (
                <div className="space-y-4">
                  {filteredLogs.map(log => (
                    <div key={log.id} className="p-4 border rounded-lg">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            {severityIcons[log.severity]}
                            <span className="font-semibold text-gray-900">{log.student_name}</span>
                            <Badge className={severityColors[log.severity]}>{log.severity}</Badge>
                            <Badge variant="outline">{log.event_type}</Badge>
                            {log.requires_review && (
                              <Badge className="bg-purple-100 text-purple-800">Needs Review</Badge>
                            )}
                          </div>
                          <p className="text-sm text-gray-600 mb-1">{log.details}</p>
                          <p className="text-xs text-gray-500">{format(new Date(log.timestamp), 'PPp')}</p>
                          {log.reviewed_by && (
                            <div className="mt-2 p-2 bg-gray-50 rounded">
                              <p className="text-xs text-gray-600">Reviewed by: {log.reviewed_by}</p>
                              <p className="text-xs text-gray-600">Notes: {log.review_notes}</p>
                              <p className="text-xs text-gray-600">Action: {log.action_taken}</p>
                            </div>
                          )}
                        </div>
                        {log.requires_review && (
                          <Button
                            size="sm"
                            onClick={() => setReviewingLog(log)}
                            className="bg-purple-600 hover:bg-purple-700"
                          >
                            <Eye className="w-4 h-4 mr-2" />
                            Review
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </>
      )}

      {reviewingLog && (
        <Card className="border-2 border-purple-500">
          <CardHeader className="bg-purple-50">
            <CardTitle>Review Event: {reviewingLog.event_type}</CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="space-y-4">
              <div>
                <p className="text-sm text-gray-600">Student: <span className="font-semibold">{reviewingLog.student_name}</span></p>
                <p className="text-sm text-gray-600">Event: {reviewingLog.event_type}</p>
                <p className="text-sm text-gray-600">Details: {reviewingLog.details}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Review Notes</label>
                <Textarea
                  value={reviewNotes}
                  onChange={(e) => setReviewNotes(e.target.value)}
                  placeholder="Enter your review notes..."
                  rows={3}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Action Taken</label>
                <Select value={actionTaken} onValueChange={setActionTaken}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select action" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="No Action Required">No Action Required</SelectItem>
                    <SelectItem value="Warning Issued">Warning Issued</SelectItem>
                    <SelectItem value="Exam Invalidated">Exam Invalidated</SelectItem>
                    <SelectItem value="Flagged for Further Investigation">Flagged for Further Investigation</SelectItem>
                    <SelectItem value="Score Adjusted">Score Adjusted</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex justify-end gap-3">
                <Button variant="outline" onClick={() => setReviewingLog(null)}>
                  Cancel
                </Button>
                <Button
                  onClick={() => reviewMutation.mutate({ logId: reviewingLog.id, notes: reviewNotes, action: actionTaken })}
                  disabled={!reviewNotes || !actionTaken}
                  className="bg-purple-600 hover:bg-purple-700"
                >
                  Submit Review
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}