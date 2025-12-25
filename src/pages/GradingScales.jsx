import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Plus, Edit, Trash2, Award } from 'lucide-react';

export default function GradingScales() {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingGrade, setEditingGrade] = useState(null);
  const queryClient = useQueryClient();

  const { data: grades = [], isLoading } = useQuery({
    queryKey: ['grading-scales'],
    queryFn: () => base44.entities.GradingScale.list('-min_score'),
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.GradingScale.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['grading-scales'] });
      setIsFormOpen(false);
      setEditingGrade(null);
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.GradingScale.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['grading-scales'] });
      setIsFormOpen(false);
      setEditingGrade(null);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.GradingScale.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['grading-scales'] });
    },
  });

  const handleSubmit = (data) => {
    if (editingGrade) {
      updateMutation.mutate({ id: editingGrade.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const groupedGrades = grades.reduce((acc, grade) => {
    if (!acc[grade.scale_name]) {
      acc[grade.scale_name] = [];
    }
    acc[grade.scale_name].push(grade);
    return acc;
  }, {});

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Grading Scales</h1>
          <p className="text-gray-600 mt-1">Configure grade ranges and GPA values</p>
        </div>
        <Button
          onClick={() => {
            setEditingGrade(null);
            setIsFormOpen(true);
          }}
          className="bg-blue-600 hover:bg-blue-700"
        >
          <Plus className="w-4 h-4 mr-2" />
          Add Grade
        </Button>
      </div>

      {isLoading ? (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
        </div>
      ) : (
        <div className="space-y-6">
          {Object.keys(groupedGrades).map((scaleName) => (
            <Card key={scaleName} className="bg-white shadow-md">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Award className="w-6 h-6 text-blue-600" />
                    <CardTitle>{scaleName}</CardTitle>
                  </div>
                  {groupedGrades[scaleName][0]?.is_active && (
                    <Badge className="bg-green-100 text-green-800">Active</Badge>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50 border-b">
                      <tr>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Grade</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Range</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Grade Point</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Remark</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {groupedGrades[scaleName].map((grade) => (
                        <tr key={grade.id} className="hover:bg-gray-50">
                          <td className="px-4 py-3">
                            <span className="text-lg font-bold text-blue-600">{grade.grade}</span>
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-900">
                            {grade.min_score}% - {grade.max_score}%
                          </td>
                          <td className="px-4 py-3 text-sm font-medium text-gray-900">
                            {grade.grade_point || '-'}
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-600">
                            {grade.remark || '-'}
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  setEditingGrade(grade);
                                  setIsFormOpen(true);
                                }}
                              >
                                <Edit className="w-4 h-4" />
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  if (confirm('Delete this grade?')) {
                                    deleteMutation.mutate(grade.id);
                                  }
                                }}
                              >
                                <Trash2 className="w-4 h-4 text-red-600" />
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <GradeFormDialog
        open={isFormOpen}
        onOpenChange={setIsFormOpen}
        grade={editingGrade}
        onSubmit={handleSubmit}
      />
    </div>
  );
}

function GradeFormDialog({ open, onOpenChange, grade, onSubmit }) {
  const [formData, setFormData] = useState(
    grade || {
      scale_name: '',
      grade: '',
      min_score: 0,
      max_score: 0,
      grade_point: 0,
      remark: '',
      is_active: true,
    }
  );

  React.useEffect(() => {
    if (grade) {
      setFormData(grade);
    } else {
      setFormData({
        scale_name: '',
        grade: '',
        min_score: 0,
        max_score: 0,
        grade_point: 0,
        remark: '',
        is_active: true,
      });
    }
  }, [grade, open]);

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md bg-white">
        <DialogHeader>
          <DialogTitle className="text-gray-900">{grade ? 'Edit Grade' : 'Add Grade'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label>Scale Name *</Label>
            <Input
              value={formData.scale_name}
              onChange={(e) => setFormData({ ...formData, scale_name: e.target.value })}
              placeholder="e.g., Standard Grading"
              required
            />
          </div>
          <div>
            <Label>Grade Letter *</Label>
            <Input
              value={formData.grade}
              onChange={(e) => setFormData({ ...formData, grade: e.target.value })}
              placeholder="e.g., A, B+, C"
              required
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Min Score % *</Label>
              <Input
                type="number"
                value={formData.min_score}
                onChange={(e) => setFormData({ ...formData, min_score: parseFloat(e.target.value) })}
                min="0"
                max="100"
                required
              />
            </div>
            <div>
              <Label>Max Score % *</Label>
              <Input
                type="number"
                value={formData.max_score}
                onChange={(e) => setFormData({ ...formData, max_score: parseFloat(e.target.value) })}
                min="0"
                max="100"
                required
              />
            </div>
          </div>
          <div>
            <Label>Grade Point</Label>
            <Input
              type="number"
              step="0.1"
              value={formData.grade_point}
              onChange={(e) => setFormData({ ...formData, grade_point: parseFloat(e.target.value) })}
            />
          </div>
          <div>
            <Label>Remark</Label>
            <Input
              value={formData.remark}
              onChange={(e) => setFormData({ ...formData, remark: e.target.value })}
              placeholder="e.g., Excellent, Good, Pass"
            />
          </div>
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="is_active"
              checked={formData.is_active}
              onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
              className="w-4 h-4"
            />
            <Label htmlFor="is_active">Active scale</Label>
          </div>
          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" className="bg-blue-600 hover:bg-blue-700">
              {grade ? 'Update' : 'Create'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}