import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Trash2, GripVertical, Copy, Save, FileText } from 'lucide-react';
import { toast } from 'sonner';

const DEFAULT_LEVELS = [
  { score: 4, label: 'Excellent', description: 'Exceeds expectations' },
  { score: 3, label: 'Good', description: 'Meets expectations' },
  { score: 2, label: 'Satisfactory', description: 'Approaching expectations' },
  { score: 1, label: 'Needs Improvement', description: 'Below expectations' },
  { score: 0, label: 'Not Demonstrated', description: 'No evidence of skill' },
];

export default function RubricBuilder({ open, onOpenChange, onRubricCreated, existingRubric }) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [criteria, setCriteria] = useState([]);
  const [isTemplate, setIsTemplate] = useState(false);
  
  const queryClient = useQueryClient();

  const { data: rubricTemplates = [] } = useQuery({
    queryKey: ['rubric-templates'],
    queryFn: async () => {
      const all = await base44.entities.Rubric.list();
      return all.filter(r => r.is_template);
    },
    enabled: open,
  });

  useEffect(() => {
    if (existingRubric) {
      setName(existingRubric.name || '');
      setDescription(existingRubric.description || '');
      setCriteria(existingRubric.criteria ? JSON.parse(existingRubric.criteria) : []);
      setIsTemplate(existingRubric.is_template || false);
    } else {
      resetForm();
    }
  }, [existingRubric, open]);

  const resetForm = () => {
    setName('');
    setDescription('');
    setCriteria([]);
    setIsTemplate(false);
  };

  const saveMutation = useMutation({
    mutationFn: async (data) => {
      if (existingRubric?.id) {
        return await base44.entities.Rubric.update(existingRubric.id, data);
      }
      return await base44.entities.Rubric.create(data);
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ['rubrics'] });
      queryClient.invalidateQueries({ queryKey: ['rubric-templates'] });
      toast.success(existingRubric ? 'Rubric updated!' : 'Rubric created!');
      if (onRubricCreated) onRubricCreated(result);
      onOpenChange(false);
    },
  });

  const addCriterion = () => {
    setCriteria([...criteria, {
      name: '',
      description: '',
      weight: 1,
      levels: [...DEFAULT_LEVELS],
    }]);
  };

  const updateCriterion = (index, field, value) => {
    const newCriteria = [...criteria];
    newCriteria[index][field] = value;
    setCriteria(newCriteria);
  };

  const removeCriterion = (index) => {
    setCriteria(criteria.filter((_, i) => i !== index));
  };

  const updateLevel = (criterionIndex, levelIndex, field, value) => {
    const newCriteria = [...criteria];
    newCriteria[criterionIndex].levels[levelIndex][field] = value;
    setCriteria(newCriteria);
  };

  const loadTemplate = (templateId) => {
    const template = rubricTemplates.find(t => t.id === templateId);
    if (template) {
      setName(template.name + ' (Copy)');
      setDescription(template.description || '');
      setCriteria(JSON.parse(template.criteria));
      toast.success('Template loaded');
    }
  };

  const calculateTotalPoints = () => {
    return criteria.reduce((sum, c) => {
      const maxLevel = Math.max(...c.levels.map(l => l.score));
      return sum + (maxLevel * (c.weight || 1));
    }, 0);
  };

  const handleSave = () => {
    if (!name.trim()) {
      toast.error('Please enter a rubric name');
      return;
    }
    if (criteria.length === 0) {
      toast.error('Please add at least one criterion');
      return;
    }

    saveMutation.mutate({
      name,
      description,
      criteria: JSON.stringify(criteria),
      total_points: calculateTotalPoints(),
      is_template: isTemplate,
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto bg-white">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-blue-600" />
            {existingRubric ? 'Edit Rubric' : 'Create Rubric'}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Template Loader */}
          {!existingRubric && rubricTemplates.length > 0 && (
            <div className="bg-blue-50 p-4 rounded-lg">
              <Label className="text-blue-800">Load from Template</Label>
              <Select onValueChange={loadTemplate}>
                <SelectTrigger className="mt-2">
                  <SelectValue placeholder="Select a template..." />
                </SelectTrigger>
                <SelectContent>
                  {rubricTemplates.map(t => (
                    <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Basic Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label>Rubric Name *</Label>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g., Essay Writing Rubric"
              />
            </div>
            <div className="flex items-end gap-4">
              <div className="flex-1">
                <Label>Total Points</Label>
                <Input value={calculateTotalPoints()} disabled className="bg-gray-50" />
              </div>
              <label className="flex items-center gap-2 pb-2">
                <input
                  type="checkbox"
                  checked={isTemplate}
                  onChange={(e) => setIsTemplate(e.target.checked)}
                  className="rounded"
                />
                <span className="text-sm">Save as template</span>
              </label>
            </div>
          </div>

          <div>
            <Label>Description</Label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe what this rubric assesses..."
              rows={2}
            />
          </div>

          {/* Criteria */}
          <div>
            <div className="flex justify-between items-center mb-3">
              <Label className="text-lg">Criteria</Label>
              <Button onClick={addCriterion} size="sm" className="bg-blue-600 hover:bg-blue-700">
                <Plus className="w-4 h-4 mr-1" />
                Add Criterion
              </Button>
            </div>

            {criteria.length === 0 ? (
              <div className="text-center py-8 border-2 border-dashed rounded-lg">
                <p className="text-gray-500">No criteria added yet</p>
                <Button onClick={addCriterion} variant="link" className="mt-2">
                  Add your first criterion
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                {criteria.map((criterion, cIndex) => (
                  <Card key={cIndex} className="border-l-4 border-l-blue-500">
                    <CardContent className="pt-4">
                      <div className="flex gap-4 mb-4">
                        <div className="flex-1">
                          <Label>Criterion Name</Label>
                          <Input
                            value={criterion.name}
                            onChange={(e) => updateCriterion(cIndex, 'name', e.target.value)}
                            placeholder="e.g., Content & Ideas"
                          />
                        </div>
                        <div className="w-24">
                          <Label>Weight</Label>
                          <Input
                            type="number"
                            value={criterion.weight || 1}
                            onChange={(e) => updateCriterion(cIndex, 'weight', parseInt(e.target.value) || 1)}
                            min="1"
                          />
                        </div>
                        <div className="flex items-end">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => removeCriterion(cIndex)}
                            className="text-red-600 hover:bg-red-50"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>

                      <div>
                        <Label>Description</Label>
                        <Input
                          value={criterion.description}
                          onChange={(e) => updateCriterion(cIndex, 'description', e.target.value)}
                          placeholder="What does this criterion assess?"
                        />
                      </div>

                      <div className="mt-4">
                        <Label className="text-sm text-gray-600">Scoring Levels</Label>
                        <div className="grid grid-cols-5 gap-2 mt-2">
                          {criterion.levels.map((level, lIndex) => (
                            <div key={lIndex} className="p-2 bg-gray-50 rounded-lg text-center">
                              <Input
                                type="number"
                                value={level.score}
                                onChange={(e) => updateLevel(cIndex, lIndex, 'score', parseInt(e.target.value) || 0)}
                                className="text-center font-bold mb-1 h-8"
                              />
                              <Input
                                value={level.label}
                                onChange={(e) => updateLevel(cIndex, lIndex, 'label', e.target.value)}
                                className="text-xs text-center h-7 mb-1"
                                placeholder="Label"
                              />
                              <textarea
                                value={level.description}
                                onChange={(e) => updateLevel(cIndex, lIndex, 'description', e.target.value)}
                                className="w-full text-xs p-1 border rounded resize-none"
                                rows={2}
                                placeholder="Description"
                              />
                            </div>
                          ))}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button 
              onClick={handleSave} 
              className="bg-blue-600 hover:bg-blue-700"
              disabled={saveMutation.isPending}
            >
              <Save className="w-4 h-4 mr-2" />
              {saveMutation.isPending ? 'Saving...' : 'Save Rubric'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}