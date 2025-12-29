import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { FileText, Download, Edit2 } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';

export default function GradeSubmissionDialog({ open, onClose, submission }) {
  const [grade, setGrade] = useState(submission?.grade || '');
  const [feedback, setFeedback] = useState(submission?.feedback || '');
  const [rubricScores, setRubricScores] = useState({});
  const [manualOverride, setManualOverride] = useState(false);
  const queryClient = useQueryClient();

  // Fetch rubric if assignment has one
  const { data: rubric } = useQuery({
    queryKey: ['rubric', submission?.assignment?.rubric_id],
    queryFn: async () => {
      if (!submission?.assignment?.rubric_id) return null;
      const rubrics = await base44.entities.Rubric.filter({ id: submission.assignment.rubric_id });
      return rubrics[0] || null;
    },
    enabled: !!submission?.assignment?.rubric_id,
  });

  // Parse rubric criteria
  const rubricCriteria = rubric ? JSON.parse(rubric.criteria || '[]') : [];

  // Initialize rubric scores from existing submission
  useEffect(() => {
    if (submission?.rubric_scores) {
      try {
        const scores = JSON.parse(submission.rubric_scores);
        setRubricScores(scores);
      } catch (e) {
        console.error('Failed to parse rubric scores:', e);
      }
    }
  }, [submission]);

  // Calculate total from rubric selections
  useEffect(() => {
    if (!manualOverride && Object.keys(rubricScores).length > 0) {
      const total = Object.values(rubricScores).reduce((sum, score) => sum + score, 0);
      setGrade(total.toString());
    }
  }, [rubricScores, manualOverride]);

  const handleRubricClick = (criterionName, score) => {
    setRubricScores(prev => ({
      ...prev,
      [criterionName]: score
    }));
    setManualOverride(false);
  };

  const handleManualGradeChange = (e) => {
    setGrade(e.target.value);
    setManualOverride(true);
  };

  const gradeMutation = useMutation({
    mutationFn: async ({ id, data }) => {
      const updatedSubmission = await base44.entities.Submission.update(id, data);
      
      // If this is a group submission, grade all group members
      if (updatedSubmission.submission_group_id) {
        const groups = await base44.entities.SubmissionGroup.filter({ 
          id: updatedSubmission.submission_group_id 
        });
        
        if (groups.length > 0) {
          const group = groups[0];
          const studentIds = JSON.parse(group.student_ids || '[]');
          
          // Update or create submissions for all group members
          const updatePromises = studentIds.map(async (studentId) => {
            // Skip if this is the current submission's student
            if (studentId === updatedSubmission.student_id) return;
            
            // Check if submission exists for this student
            const existingSubmissions = await base44.entities.Submission.filter({
              assignment_id: updatedSubmission.assignment_id,
              student_id: studentId
            });
            
            if (existingSubmissions.length > 0) {
              // Update existing submission
              await base44.entities.Submission.update(existingSubmissions[0].id, {
                grade: data.grade,
                feedback: data.feedback,
                status: data.status,
                rubric_scores: data.rubric_scores
              });
            } else {
              // Create new submission for group member
              const studentInfo = await base44.entities.Student.filter({ id: studentId });
              const studentName = studentInfo.length > 0 
                ? `${studentInfo[0].first_name} ${studentInfo[0].last_name}` 
                : 'Unknown';
              
              await base44.entities.Submission.create({
                assignment_id: updatedSubmission.assignment_id,
                student_id: studentId,
                student_name: studentName,
                submission_group_id: updatedSubmission.submission_group_id,
                submitted_date: updatedSubmission.submitted_date,
                content: updatedSubmission.content,
                attachments: updatedSubmission.attachments,
                grade: data.grade,
                feedback: data.feedback,
                status: data.status,
                is_late: updatedSubmission.is_late,
                late_penalty_applied: updatedSubmission.late_penalty_applied,
                rubric_scores: data.rubric_scores
              });
            }
          });
          
          await Promise.all(updatePromises);
        }
      }
      
      return updatedSubmission;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['all-submissions'] });
      toast.success('Submission graded successfully (applied to all group members)');
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
        rubric_scores: Object.keys(rubricScores).length > 0 ? JSON.stringify(rubricScores) : null,
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
              {/* Rubric Matrix */}
              {rubricCriteria.length > 0 && (
                <div className="bg-purple-50 p-6 rounded-xl border-2 border-purple-200">
                  <h3 className="text-lg font-bold text-purple-900 mb-4">📋 Grading Rubric</h3>
                  <div className="space-y-4">
                    {rubricCriteria.map((criterion, idx) => (
                      <div key={idx} className="bg-white p-4 rounded-lg border-2 border-gray-200">
                        <h4 className="font-semibold text-gray-900 mb-2">{criterion.name}</h4>
                        <p className="text-xs text-gray-600 mb-3">{criterion.description}</p>
                        <div className="grid grid-cols-2 gap-2">
                          {criterion.levels?.map((level, levelIdx) => {
                            const isSelected = rubricScores[criterion.name] === level.score;
                            return (
                              <button
                                key={levelIdx}
                                type="button"
                                onClick={() => handleRubricClick(criterion.name, level.score)}
                                className={`p-3 rounded-lg border-2 transition-all text-left ${
                                  isSelected
                                    ? 'border-purple-600 bg-purple-100 shadow-md'
                                    : 'border-gray-300 bg-white hover:border-purple-400 hover:bg-purple-50'
                                }`}
                              >
                                <div className="flex justify-between items-center mb-1">
                                  <span className="font-semibold text-sm">{level.label}</span>
                                  <Badge className={isSelected ? 'bg-purple-600 text-white' : 'bg-gray-200 text-gray-700'}>
                                    {level.score} pts
                                  </Badge>
                                </div>
                                <p className="text-xs text-gray-600">{level.description}</p>
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Grade Input */}
              <div className="bg-green-50 p-6 rounded-xl border-2 border-green-200">
                <div className="flex items-center justify-between mb-3">
                  <Label htmlFor="grade" className="text-lg font-bold text-green-900">
                    📊 Total Grade (out of {submission.assignment.max_points})
                  </Label>
                  {rubricCriteria.length > 0 && manualOverride && (
                    <Badge className="bg-orange-500 text-white">
                      <Edit2 className="w-3 h-3 mr-1" />
                      Manual Override
                    </Badge>
                  )}
                </div>
                <Input
                  id="grade"
                  type="number"
                  value={grade}
                  onChange={handleManualGradeChange}
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
                {rubricCriteria.length > 0 && !manualOverride && (
                  <p className="text-xs text-gray-600 text-center mt-2">
                    Auto-calculated from rubric selections
                  </p>
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