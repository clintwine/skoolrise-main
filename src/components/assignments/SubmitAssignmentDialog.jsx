import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Upload, FileText } from 'lucide-react';
import { toast } from 'sonner';

export default function SubmitAssignmentDialog({ open, onClose, assignment, studentId }) {
  const [textContent, setTextContent] = useState('');
  const [files, setFiles] = useState([]);
  const [uploading, setUploading] = useState(false);
  const queryClient = useQueryClient();

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

      // Check late status
      const dueDate = new Date(assignment.due_date);
      const now = new Date();
      const isLate = now > dueDate;

      return base44.entities.Submission.create({
        assignment_id: assignment.id,
        student_id: studentId,
        student_name: data.student_name,
        submitted_date: new Date().toISOString(),
        content: textContent,
        attachments: JSON.stringify(uploadedUrls),
        status: isLate ? 'Late' : 'Submitted',
        is_late: isLate,
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

    // Get student name
    const students = await base44.entities.Student.filter({ id: studentId });
    const student = students[0];
    const studentName = student ? `${student.first_name} ${student.last_name}` : 'Unknown';

    submitMutation.mutate({ student_name: studentName });
  };

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

          {/* Due Date Warning */}
          <div className="bg-blue-50 p-4 rounded-xl border-2 border-blue-200">
            <p className="text-sm text-blue-900">
              <strong>Due:</strong> {new Date(assignment?.due_date).toLocaleString()}
            </p>
            {new Date() > new Date(assignment?.due_date) && (
              <p className="text-sm text-red-600 font-semibold mt-2">
                ⚠️ This assignment is past due and will be marked as late
              </p>
            )}
          </div>

          {/* Buttons */}
          <div className="flex gap-4">
            <Button type="button" variant="outline" onClick={onClose} className="flex-1 text-lg py-6 rounded-xl">
              Cancel
            </Button>
            <Button
              type="submit"
              className="flex-1 bg-blue-600 hover:bg-blue-700 text-lg py-6 rounded-xl"
              disabled={submitMutation.isPending || uploading}
            >
              {uploading ? (
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