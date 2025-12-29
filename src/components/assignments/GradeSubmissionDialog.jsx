import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { FileText, Download } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';

export default function GradeSubmissionDialog({ open, onClose, submission }) {
  const [grade, setGrade] = useState(submission?.grade || '');
  const [feedback, setFeedback] = useState(submission?.feedback || '');
  const queryClient = useQueryClient();

  const gradeMutation = useMutation({
    mutationFn: async ({ id, data }) => {
      return base44.entities.Submission.update(id, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['all-submissions'] });
      toast.success('Submission graded successfully!');
      onClose();
    },
    onError: (error) => {
      toast.error('Failed to grade submission: ' + error.message);
    },
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!grade) {
      toast.error('Please enter a grade');
      return;
    }

    const numericGrade = parseFloat(grade);
    if (numericGrade > submission.assignment.max_points) {
      toast.error(`Grade cannot exceed ${submission.assignment.max_points} points`);
      return;
    }

    gradeMutation.mutate({
      id: submission.id,
      data: {
        grade: numericGrade,
        feedback,
        status: 'Graded',
      },
    });
  };

  if (!submission) return null;

  const attachments = submission.attachments ? JSON.parse(submission.attachments) : [];

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto bg-white">
        <DialogHeader>
          <DialogTitle className="text-3xl font-bold">📝 Grade Submission</DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-2 gap-6 mt-4">
          {/* Left Side - Student Work */}
          <div className="space-y-4">
            <div className="bg-blue-50 p-6 rounded-xl border-2 border-blue-200">
              <h3 className="text-xl font-bold text-blue-900 mb-2">Student Work</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Student:</span>
                  <span className="font-semibold">{submission.student_name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Assignment:</span>
                  <span className="font-semibold">{submission.assignment.title}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Submitted:</span>
                  <span className="font-semibold">{format(new Date(submission.submitted_date), 'MMM dd, h:mm a')}</span>
                </div>
                {submission.is_late && (
                  <Badge className="bg-red-100 text-red-700 mt-2">⚠️ Late Submission</Badge>
                )}
              </div>
            </div>

            {/* Text Content */}
            {submission.content && (
              <div className="bg-white p-6 rounded-xl border-2 border-gray-200">
                <h4 className="font-semibold text-gray-900 mb-3">Text Response:</h4>
                <div className="text-gray-700 whitespace-pre-wrap">{submission.content}</div>
              </div>
            )}

            {/* File Attachments */}
            {attachments.length > 0 && (
              <div className="bg-white p-6 rounded-xl border-2 border-gray-200">
                <h4 className="font-semibold text-gray-900 mb-3">📎 Attachments:</h4>
                <div className="space-y-2">
                  {attachments.map((file, idx) => (
                    <a
                      key={idx}
                      href={file}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                    >
                      <FileText className="w-5 h-5 text-blue-600" />
                      <span className="flex-1 text-blue-600 font-medium">View File {idx + 1}</span>
                      <Download className="w-4 h-4 text-gray-400" />
                    </a>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Right Side - Grading */}
          <div className="space-y-4">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Grade Input */}
              <div className="bg-green-50 p-6 rounded-xl border-2 border-green-200">
                <Label htmlFor="grade" className="text-lg font-bold text-green-900">
                  📊 Grade (out of {submission.assignment.max_points})
                </Label>
                <Input
                  id="grade"
                  type="number"
                  value={grade}
                  onChange={(e) => setGrade(e.target.value)}
                  placeholder="Enter grade"
                  className="mt-3 text-2xl p-6 rounded-xl border-2 text-center font-bold"
                  min="0"
                  max={submission.assignment.max_points}
                  step="0.5"
                  required
                />
                {grade && (
                  <div className="mt-3 text-center">
                    <span className="text-3xl font-bold text-green-600">
                      {((parseFloat(grade) / submission.assignment.max_points) * 100).toFixed(1)}%
                    </span>
                  </div>
                )}
              </div>

              {/* Feedback */}
              <div>
                <Label htmlFor="feedback" className="text-lg font-semibold">💬 Feedback</Label>
                <Textarea
                  id="feedback"
                  value={feedback}
                  onChange={(e) => setFeedback(e.target.value)}
                  placeholder="Great work! I especially liked..."
                  className="mt-2 min-h-[200px] text-lg rounded-xl border-2"
                />
              </div>

              {/* Buttons */}
              <div className="flex gap-4 pt-4">
                <Button type="button" variant="outline" onClick={onClose} className="flex-1 text-lg py-6 rounded-xl">
                  Cancel
                </Button>
                <Button
                  type="submit"
                  className="flex-1 bg-green-600 hover:bg-green-700 text-lg py-6 rounded-xl"
                  disabled={gradeMutation.isPending}
                >
                  {gradeMutation.isPending ? 'Saving...' : '✅ Submit Grade'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}