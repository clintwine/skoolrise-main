import React, { useState, useMemo } from 'react';
import { base44 } from '@/api/base44Client';
import { useMutation, useQueryClient } from '@tantml:react-query';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Upload, FileText, AlertTriangle, XCircle } from 'lucide-react';
import { toast } from 'sonner';
import { differenceInHours, differenceInDays } from 'date-fns';

export default function SubmitAssignmentDialog({ open, onClose, assignment, studentId }) {
  const [textContent, setTextContent] = useState('');
  const [files, setFiles] = useState([]);
  const [uploading, setUploading] = useState(false);
  const queryClient = useQueryClient();

  const lateInfo = useMemo(() => {
    if (!assignment) return null;

    const dueDate = new Date(assignment.due_date);
    const now = new Date();
    const isLate = now > dueDate;

    let latePolicy = { type: 'flag', deduction_percent: 0, grace_period_hours: 0 };
    try {
      if (assignment.late_policy_config) {
        latePolicy = JSON.parse(assignment.late_policy_config);
      }
    } catch (e) {
      console.error('Failed to parse late policy:', e);
    }

    if (!isLate) {
      return { isLate: false, policy: latePolicy };
    }

    // Check grace period
    const hoursLate = differenceInHours(now, dueDate);
    if (hoursLate <= (latePolicy.grace_period_hours || 0)) {
      return { isLate: false, policy: latePolicy, inGracePeriod: true };
    }

    // Calculate penalty for auto-deduct
    let penalty = 0;
    if (latePolicy.type === 'deduct') {
      const daysLate = Math.ceil(differenceInDays(now, dueDate));
      const deductionPerDay = (assignment.max_points * (latePolicy.deduction_percent || 10)) / 100;
      penalty = Math.min(daysLate * deductionPerDay, assignment.max_points);
    }

    return {
      isLate: true,
      policy: latePolicy,
      hoursLate,
      daysLate: Math.ceil(differenceInDays(now, dueDate)),
      penalty,
      inGracePeriod: false,
    };
  }, [assignment]);

  const submitMutation = useMutation({
    mutationFn: async (data) => {
      // Upload files first
      const uploadedUrls = [];
      if (files.length > 0) {
        setUploading(true);
        for (const file of files) {
          try {
            const response = await base44.integrations.Core.UploadFile({ file });
            uploadedUrls.push(response.file_url);
          } catch (error) {
            toast.error(`Failed to upload ${file.name}`);
          }
        }
        setUploading(false);
      }

      return base44.entities.Submission.create({
        assignment_id: assignment.id,
        student_id: studentId,
        student_name: data.student_name,
        submitted_date: new Date().toISOString(),
        content: textContent,
        attachments: JSON.stringify(uploadedUrls),
        status: lateInfo.isLate ? 'Late' : 'Submitted',
        is_late: lateInfo.isLate,
        late_penalty_applied: lateInfo.penalty || 0,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-submissions'] });
      toast.success('Assignment submitted successfully! 🎉');
      onClose();
      setTextContent('');
      setFiles([]);
    },
    onError: (error) => {
      toast.error('Failed to submit: ' + error.message);
    },
  });

  const handleFileChange = (e) => {
    const selectedFiles = Array.from(e.target.files || []);
    setFiles(selectedFiles);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!textContent && files.length === 0) {
      toast.error('Please add content or upload a file');
      return;
    }

    // Check if strict block policy prevents submission
    if (lateInfo?.isLate && lateInfo.policy.type === 'strict') {
      toast.error('Submissions are not allowed after the due date');
      return;
    }

    // Get student name
    const students = await base44.entities.Student.filter({ id: studentId });
    const student = students[0];
    const studentName = student ? `${student.first_name} ${student.last_name}` : 'Unknown';

    submitMutation.mutate({ student_name: studentName });
  };

  const isSubmitDisabled = lateInfo?.isLate && lateInfo.policy.type === 'strict';

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl bg-white">
        <DialogHeader>
          <DialogTitle className="text-3xl font-bold">📤 Submit Assignment</DialogTitle>
          <p className="text-lg text-gray-600 mt-2">{assignment?.title}</p>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6 mt-4">
          {/* Text Entry */}
          {(assignment?.submission_type === 'Text' || assignment?.submission_type === 'Both') && (
            <div>
              <Label className="text-lg font-semibold">✍️ Your Response</Label>
              <Textarea
                value={textContent}
                onChange={(e) => setTextContent(e.target.value)}
                placeholder="Type your response here..."
                className="mt-2 min-h-[200px] text-lg rounded-xl border-2"
              />
            </div>
          )}

          {/* File Upload */}
          {(assignment?.submission_type === 'File' || assignment?.submission_type === 'Both') && (
            <div>
              <Label className="text-lg font-semibold">📎 Upload Files</Label>
              <div className="mt-2">
                <Input
                  type="file"
                  onChange={handleFileChange}
                  multiple
                  className="text-lg rounded-xl border-2"
                />
                {files.length > 0 && (
                  <div className="mt-3 space-y-2">
                    {files.map((file, idx) => (
                      <div key={idx} className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg">
                        <FileText className="w-5 h-5 text-blue-600" />
                        <span className="text-sm font-medium">{file.name}</span>
                        <span className="text-xs text-gray-500">
                          ({(file.size / 1024 / 1024).toFixed(2)} MB)
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Due Date and Late Policy Warnings */}
          <div className="bg-blue-50 p-4 rounded-xl border-2 border-blue-200">
            <p className="text-sm text-blue-900">
              <strong>Due:</strong> {new Date(assignment?.due_date).toLocaleString()}
            </p>
          </div>

          {/* Strict Block Warning */}
          {lateInfo?.isLate && lateInfo.policy.type === 'strict' && (
            <div className="bg-red-500 text-white p-4 rounded-xl border-2 border-red-600 flex items-center gap-3">
              <XCircle className="w-8 h-8 flex-shrink-0" />
              <div>
                <p className="font-bold text-lg">Submissions Closed</p>
                <p className="text-sm">This assignment is past due and no longer accepts submissions.</p>
              </div>
            </div>
          )}

          {/* Auto-Deduct Warning */}
          {lateInfo?.isLate && lateInfo.policy.type === 'deduct' && (
            <div className="bg-orange-500 text-white p-4 rounded-xl border-2 border-orange-600">
              <div className="flex items-start gap-3 mb-3">
                <AlertTriangle className="w-8 h-8 flex-shrink-0" />
                <div>
                  <p className="font-bold text-lg">Late Submission Penalty</p>
                  <p className="text-sm">You are submitting {lateInfo.daysLate} day(s) late.</p>
                </div>
              </div>
              <div className="bg-white/20 rounded-lg p-3">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm">Original Points:</span>
                  <span className="text-lg font-bold">{assignment?.max_points}</span>
                </div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm">Late Penalty ({lateInfo.policy.deduction_percent}% per day):</span>
                  <span className="text-lg font-bold">-{lateInfo.penalty.toFixed(1)}</span>
                </div>
                <div className="border-t border-white/30 pt-2 flex justify-between items-center">
                  <span className="font-semibold">Maximum Possible Grade:</span>
                  <span className="text-2xl font-bold">
                    {Math.max(0, assignment?.max_points - lateInfo.penalty).toFixed(1)}
                  </span>
                </div>
              </div>
              <p className="text-xs mt-3 opacity-90">
                This penalty will be automatically applied to your grade when graded.
              </p>
            </div>
          )}

          {/* Flag Late Warning */}
          {lateInfo?.isLate && lateInfo.policy.type === 'flag' && (
            <div className="bg-yellow-500 text-white p-4 rounded-xl border-2 border-yellow-600 flex items-center gap-3">
              <AlertTriangle className="w-6 h-6 flex-shrink-0" />
              <div>
                <p className="font-semibold">Late Submission</p>
                <p className="text-sm">This assignment is past due and will be marked as late.</p>
              </div>
            </div>
          )}

          {/* Grace Period Notice */}
          {lateInfo?.inGracePeriod && (
            <div className="bg-green-500 text-white p-4 rounded-xl border-2 border-green-600 flex items-center gap-3">
              <FileText className="w-6 h-6 flex-shrink-0" />
              <div>
                <p className="font-semibold">Within Grace Period</p>
                <p className="text-sm">You're submitting within the grace period. No penalty will be applied.</p>
              </div>
            </div>
          )}

          {/* Buttons */}
          <div className="flex gap-4">
            <Button type="button" variant="outline" onClick={onClose} className="flex-1 text-lg py-6 rounded-xl">
              Cancel
            </Button>
            <Button
              type="submit"
              className="flex-1 bg-blue-600 hover:bg-blue-700 text-lg py-6 rounded-xl disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={submitMutation.isPending || uploading || isSubmitDisabled}
            >
              {isSubmitDisabled ? (
                <>
                  <XCircle className="w-5 h-5 mr-2" />
                  Submissions Closed
                </>
              ) : uploading ? (
                'Uploading...'
              ) : submitMutation.isPending ? (
                'Submitting...'
              ) : (
                <>
                  <Upload className="w-5 h-5 mr-2" />
                  Submit Assignment
                </>
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}