import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from 'sonner';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';

export default function CreateAssignmentDialog({ open, onClose }) {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    class_id: '',
    due_date: '',
    max_points: 100,
    submission_type: 'File',
    late_policy_type: 'flag',
    deduction_percent: 10,
    grace_period_hours: 0,
    allow_group_submissions: false,
  });

  const queryClient = useQueryClient();

  const { data: classes = [] } = useQuery({
    queryKey: ['classes'],
    queryFn: () => base44.entities.Class.list(),
  });

  const createMutation = useMutation({
    mutationFn: async (data) => {
      const className = classes.find(c => c.id === data.class_id)?.class_name;
      return base44.entities.Assignment.create({
        ...data,
        class_name: className,
        late_policy_config: JSON.stringify({
          type: data.late_policy_type,
          deduction_percent: data.deduction_percent,
          grace_period_hours: data.grace_period_hours,
        }),
        status: 'Published',
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['teacher-assignments'] });
      toast.success('Assignment created successfully!');
      onClose();
      setFormData({
        title: '',
        description: '',
        class_id: '',
        due_date: '',
        max_points: 100,
        submission_type: 'File',
        late_policy_type: 'flag',
        deduction_percent: 10,
        grace_period_hours: 0,
        allow_group_submissions: false,
      });
    },
    onError: (error) => {
      toast.error('Failed to create assignment: ' + error.message);
    },
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.title || !formData.class_id || !formData.due_date) {
      toast.error('Please fill in all required fields');
      return;
    }
    createMutation.mutate(formData);
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto bg-white">
        <DialogHeader>
          <DialogTitle className="text-3xl font-bold">✨ Create New Assignment</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-6 mt-4">
          {/* Title */}
          <div>
            <Label htmlFor="title" className="text-lg font-semibold">Title *</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="e.g., Chapter 5 Book Report"
              className="mt-2 text-lg p-6 rounded-xl border-2"
              required
            />
          </div>

          {/* Description */}
          <div>
            <Label className="text-lg font-semibold">Description</Label>
            <div className="mt-2 border-2 rounded-xl overflow-hidden">
              <ReactQuill
                value={formData.description}
                onChange={(value) => setFormData({ ...formData, description: value })}
                placeholder="Add instructions, requirements, or helpful tips..."
                className="bg-white"
                theme="snow"
              />
            </div>
          </div>

          {/* Class and Due Date */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="text-lg font-semibold">Class *</Label>
              <Select value={formData.class_id} onValueChange={(value) => setFormData({ ...formData, class_id: value })}>
                <SelectTrigger className="mt-2 text-lg p-6 rounded-xl border-2">
                  <SelectValue placeholder="Select a class" />
                </SelectTrigger>
                <SelectContent>
                  {classes.map((cls) => (
                    <SelectItem key={cls.id} value={cls.id}>{cls.class_name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="due_date" className="text-lg font-semibold">Due Date *</Label>
              <Input
                id="due_date"
                type="datetime-local"
                value={formData.due_date}
                onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
                className="mt-2 text-lg p-6 rounded-xl border-2"
                required
              />
            </div>
          </div>

          {/* Max Points and Submission Type */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="max_points" className="text-lg font-semibold">Max Points</Label>
              <Input
                id="max_points"
                type="number"
                value={formData.max_points}
                onChange={(e) => setFormData({ ...formData, max_points: parseInt(e.target.value) })}
                className="mt-2 text-lg p-6 rounded-xl border-2"
                min="0"
              />
            </div>

            <div>
              <Label className="text-lg font-semibold">Submission Type</Label>
              <Select value={formData.submission_type} onValueChange={(value) => setFormData({ ...formData, submission_type: value })}>
                <SelectTrigger className="mt-2 text-lg p-6 rounded-xl border-2">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="File">📎 File Upload</SelectItem>
                  <SelectItem value="Text">✍️ Text Entry</SelectItem>
                  <SelectItem value="Both">📎✍️ Both</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Late Policy */}
          <div className="bg-orange-50 p-6 rounded-xl border-2 border-orange-200">
            <Label className="text-lg font-bold text-orange-900">⏰ Late Policy</Label>
            <div className="mt-4 space-y-4">
              <Select value={formData.late_policy_type} onValueChange={(value) => setFormData({ ...formData, late_policy_type: value })}>
                <SelectTrigger className="text-lg p-6 rounded-xl border-2 bg-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="strict">🚫 Strict Block (no late submissions)</SelectItem>
                  <SelectItem value="flag">🚩 Flag Late (accept but mark as late)</SelectItem>
                  <SelectItem value="deduct">➖ Auto-Deduct Points</SelectItem>
                </SelectContent>
              </Select>

              {formData.late_policy_type === 'deduct' && (
                <div>
                  <Label className="text-sm font-semibold">Deduction Percentage</Label>
                  <Input
                    type="number"
                    value={formData.deduction_percent}
                    onChange={(e) => setFormData({ ...formData, deduction_percent: parseInt(e.target.value) })}
                    className="mt-2 rounded-xl border-2 bg-white"
                    min="0"
                    max="100"
                  />
                </div>
              )}

              <div>
                <Label className="text-sm font-semibold">Grace Period (hours)</Label>
                <Input
                  type="number"
                  value={formData.grace_period_hours}
                  onChange={(e) => setFormData({ ...formData, grace_period_hours: parseInt(e.target.value) })}
                  className="mt-2 rounded-xl border-2 bg-white"
                  min="0"
                />
              </div>
            </div>
          </div>

          {/* Group Submissions */}
          <div className="flex items-center gap-3 p-4 bg-blue-50 rounded-xl border-2 border-blue-200">
            <Checkbox
              id="allow_groups"
              checked={formData.allow_group_submissions}
              onCheckedChange={(checked) => setFormData({ ...formData, allow_group_submissions: checked })}
              className="data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600"
            />
            <Label htmlFor="allow_groups" className="text-lg font-semibold cursor-pointer">
              👥 Allow Group Submissions
            </Label>
          </div>

          {/* Buttons */}
          <div className="flex gap-4 pt-4">
            <Button type="button" variant="outline" onClick={onClose} className="flex-1 text-lg py-6 rounded-xl">
              Cancel
            </Button>
            <Button type="submit" className="flex-1 bg-blue-600 hover:bg-blue-700 text-lg py-6 rounded-xl" disabled={createMutation.isPending}>
              {createMutation.isPending ? 'Creating...' : '✅ Create Assignment'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}