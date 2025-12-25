import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Brain, Library, Edit, Trash2, Calendar, Video, Award } from 'lucide-react';
import { format } from 'date-fns';

export default function TeacherAssignments() {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isAIOpen, setIsAIOpen] = useState(false);
  const [isTemplatesOpen, setIsTemplatesOpen] = useState(false);
  const [editingAssignment, setEditingAssignment] = useState(null);
  const [aiGenerating, setAiGenerating] = useState(false);
  const queryClient = useQueryClient();

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    class_id: '',
    class_name: '',
    due_date: '',
    max_points: 100,
    type: 'Homework',
    status: 'Published',
    is_self_marking: false,
    questions: '',
    video_url: '',
    require_full_watch: false,
    min_watch_percentage: 80,
    is_independent_project: false,
    milestones: '',
  });

  const { data: assignments = [] } = useQuery({
    queryKey: ['teacher-assignments'],
    queryFn: () => base44.entities.Assignment.list('-created_date'),
  });

  const { data: classes = [] } = useQuery({
    queryKey: ['classes'],
    queryFn: () => base44.entities.Class.list(),
  });

  const { data: templates = [] } = useQuery({
    queryKey: ['homework-templates'],
    queryFn: () => base44.entities.HomeworkTemplate.list(),
  });

  const createMutation = useMutation({
    mutationFn: async (data) => {
      const user = await base44.auth.me();
      return base44.entities.Assignment.create({ ...data, teacher_id: user.id });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['teacher-assignments'] });
      setIsFormOpen(false);
      resetForm();
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Assignment.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['teacher-assignments'] });
      setIsFormOpen(false);
      resetForm();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.Assignment.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['teacher-assignments'] });
    },
  });

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      class_id: '',
      class_name: '',
      due_date: '',
      max_points: 100,
      type: 'Homework',
      status: 'Published',
      is_self_marking: false,
      questions: '',
      video_url: '',
      require_full_watch: false,
      min_watch_percentage: 80,
      is_independent_project: false,
      milestones: '',
    });
    setEditingAssignment(null);
  };

  const handleEdit = (assignment) => {
    setEditingAssignment(assignment);
    setFormData(assignment);
    setIsFormOpen(true);
  };

  const handleGenerateAI = async (prompt) => {
    setAiGenerating(true);
    try {
      const response = await base44.integrations.Core.InvokeLLM({
        prompt: `Generate a detailed homework assignment based on this request: "${prompt}"
        
        Include:
        - A clear, engaging title
        - Detailed instructions
        - Learning objectives
        - 5-10 self-marking questions with multiple choice answers
        - Estimated completion time
        
        Make it educational, age-appropriate, and aligned with curriculum standards.`,
        response_json_schema: {
          type: 'object',
          properties: {
            title: { type: 'string' },
            description: { type: 'string' },
            max_points: { type: 'number' },
            questions: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  question_text: { type: 'string' },
                  options: { type: 'array', items: { type: 'string' } },
                  correct_answer: { type: 'string' },
                  points: { type: 'number' }
                }
              }
            }
          }
        }
      });

      setFormData({
        ...formData,
        title: response.title,
        description: response.description,
        max_points: response.max_points,
        is_self_marking: true,
        questions: JSON.stringify(response.questions),
        ai_generated: true,
      });
      setIsAIOpen(false);
      setIsFormOpen(true);
    } catch (error) {
      alert('Error generating assignment: ' + error.message);
    } finally {
      setAiGenerating(false);
    }
  };

  const handleUseTemplate = (template) => {
    setFormData({
      ...formData,
      title: template.title,
      description: template.content,
      type: template.type,
      max_points: template.max_points,
      questions: template.questions,
      is_self_marking: template.questions ? true : false,
      template_id: template.id,
    });
    
    base44.entities.HomeworkTemplate.update(template.id, {
      usage_count: (template.usage_count || 0) + 1
    });
    
    setIsTemplatesOpen(false);
    setIsFormOpen(true);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const selectedClass = classes.find(c => c.id === formData.class_id);
    const submitData = { ...formData, class_name: selectedClass?.class_name };
    
    if (editingAssignment) {
      updateMutation.mutate({ id: editingAssignment.id, data: submitData });
    } else {
      createMutation.mutate(submitData);
    }
  };

  const typeColors = {
    Homework: 'bg-blue-100 text-blue-800',
    Quiz: 'bg-purple-100 text-purple-800',
    Project: 'bg-green-100 text-green-800',
    Essay: 'bg-orange-100 text-orange-800',
    Lab: 'bg-pink-100 text-pink-800',
    Video: 'bg-red-100 text-red-800',
    'Independent Learning': 'bg-indigo-100 text-indigo-800',
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Assignments & Homework</h1>
          <p className="text-gray-600 mt-1">Create and manage student assignments</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => setIsTemplatesOpen(true)} variant="outline">
            <Library className="w-4 h-4 mr-2" />
            Templates
          </Button>
          <Button onClick={() => setIsAIOpen(true)} variant="outline" className="bg-purple-50">
            <Brain className="w-4 h-4 mr-2" />
            AI Generate
          </Button>
          <Button onClick={() => { resetForm(); setIsFormOpen(true); }} className="bg-blue-600 hover:bg-blue-700">
            <Plus className="w-4 h-4 mr-2" />
            Create
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {assignments.map((assignment) => (
          <Card key={assignment.id} className="bg-white shadow-md hover:shadow-lg transition-shadow">
            <CardContent className="p-6">
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <h3 className="text-lg font-bold">{assignment.title}</h3>
                    <Badge className={typeColors[assignment.type]}>{assignment.type}</Badge>
                    {assignment.is_self_marking && <Badge className="bg-green-100 text-green-800">Auto-Grade</Badge>}
                    {assignment.ai_generated && <Badge className="bg-purple-100 text-purple-800"><Brain className="w-3 h-3 mr-1" />AI</Badge>}
                    {assignment.video_url && <Badge className="bg-red-100 text-red-800"><Video className="w-3 h-3 mr-1" />Video</Badge>}
                    {assignment.is_independent_project && <Badge className="bg-indigo-100 text-indigo-800">Project</Badge>}
                  </div>
                  <p className="text-sm text-gray-600 mb-2">{assignment.class_name}</p>
                  <p className="text-sm text-gray-700 line-clamp-2">{assignment.description}</p>
                  <div className="flex items-center gap-4 mt-3 text-sm">
                    <div className="flex items-center gap-1">
                      <Calendar className="w-4 h-4 text-gray-500" />
                      <span>Due: {format(new Date(assignment.due_date), 'MMM d, yyyy')}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Award className="w-4 h-4 text-gray-500" />
                      <span>{assignment.max_points} points</span>
                    </div>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={() => handleEdit(assignment)}>
                    <Edit className="w-4 h-4" />
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => {
                    if (confirm('Delete this assignment?')) deleteMutation.mutate(assignment.id);
                  }}>
                    <Trash2 className="w-4 h-4 text-red-600" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* AI Generation Dialog */}
      <Dialog open={isAIOpen} onOpenChange={setIsAIOpen}>
        <DialogContent className="bg-white">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-gray-900">
              <Brain className="w-5 h-5 text-purple-600" />
              AI Homework Generator
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={(e) => {
            e.preventDefault();
            handleGenerateAI(e.target.prompt.value);
          }} className="space-y-4">
            <div>
              <Label>Describe the homework you want to create</Label>
              <Textarea
                name="prompt"
                rows={4}
                placeholder="e.g., Create a quiz on photosynthesis for 9th grade biology with 10 multiple choice questions"
                required
              />
            </div>
            <Button type="submit" disabled={aiGenerating} className="w-full bg-purple-600 hover:bg-purple-700">
              {aiGenerating ? 'Generating...' : 'Generate with AI'}
            </Button>
          </form>
        </DialogContent>
      </Dialog>

      {/* Templates Dialog */}
      <Dialog open={isTemplatesOpen} onOpenChange={setIsTemplatesOpen}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto bg-white">
          <DialogHeader>
            <DialogTitle className="text-gray-900">Homework Templates</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {templates.map((template) => (
              <Card key={template.id} className="cursor-pointer hover:shadow-lg transition-shadow" onClick={() => handleUseTemplate(template)}>
                <CardHeader>
                  <CardTitle className="text-base">{template.title}</CardTitle>
                  <div className="flex gap-2 mt-2">
                    <Badge className="text-xs">{template.subject}</Badge>
                    <Badge className="text-xs">{template.grade_level}</Badge>
                    <Badge className="text-xs">{template.difficulty}</Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-gray-600 line-clamp-2">{template.description}</p>
                  <p className="text-xs text-gray-500 mt-2">Used {template.usage_count || 0} times</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </DialogContent>
      </Dialog>

      {/* Assignment Form */}
      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto bg-white">
          <DialogHeader>
            <DialogTitle className="text-gray-900">{editingAssignment ? 'Edit' : 'Create'} Assignment</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <Label>Title *</Label>
                <Input value={formData.title} onChange={(e) => setFormData({ ...formData, title: e.target.value })} required />
              </div>
              <div className="col-span-2">
                <Label>Description</Label>
                <Textarea value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} rows={4} />
              </div>
              <div>
                <Label>Class *</Label>
                <Select value={formData.class_id} onValueChange={(value) => setFormData({ ...formData, class_id: value })}>
                  <SelectTrigger><SelectValue placeholder="Select class" /></SelectTrigger>
                  <SelectContent>
                    {classes.map(c => <SelectItem key={c.id} value={c.id}>{c.class_name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Type *</Label>
                <Select value={formData.type} onValueChange={(value) => setFormData({ ...formData, type: value })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Homework">Homework</SelectItem>
                    <SelectItem value="Quiz">Quiz</SelectItem>
                    <SelectItem value="Project">Project</SelectItem>
                    <SelectItem value="Essay">Essay</SelectItem>
                    <SelectItem value="Lab">Lab</SelectItem>
                    <SelectItem value="Video">Video</SelectItem>
                    <SelectItem value="Independent Learning">Independent Learning</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Due Date *</Label>
                <Input type="date" value={formData.due_date} onChange={(e) => setFormData({ ...formData, due_date: e.target.value })} required />
              </div>
              <div>
                <Label>Max Points *</Label>
                <Input type="number" value={formData.max_points} onChange={(e) => setFormData({ ...formData, max_points: parseInt(e.target.value) })} required />
              </div>
              
              {formData.type === 'Video' && (
                <>
                  <div className="col-span-2">
                    <Label>Video URL</Label>
                    <Input value={formData.video_url} onChange={(e) => setFormData({ ...formData, video_url: e.target.value })} placeholder="https://..." />
                  </div>
                  <div>
                    <Label>Min Watch % Required</Label>
                    <Input type="number" value={formData.min_watch_percentage} onChange={(e) => setFormData({ ...formData, min_watch_percentage: parseInt(e.target.value) })} />
                  </div>
                  <div className="flex items-center gap-2">
                    <input type="checkbox" checked={formData.require_full_watch} onChange={(e) => setFormData({ ...formData, require_full_watch: e.target.checked })} />
                    <Label>Require Full Watch</Label>
                  </div>
                </>
              )}
              
              <div className="col-span-2 flex items-center gap-2">
                <input type="checkbox" checked={formData.is_self_marking} onChange={(e) => setFormData({ ...formData, is_self_marking: e.target.checked })} />
                <Label>Self-Marking (Auto-Grade)</Label>
              </div>
              
              <div className="col-span-2 flex items-center gap-2">
                <input type="checkbox" checked={formData.is_independent_project} onChange={(e) => setFormData({ ...formData, is_independent_project: e.target.checked })} />
                <Label>Independent Learning Project</Label>
              </div>
            </div>
            
            <div className="flex justify-end gap-3 pt-4">
              <Button type="button" variant="outline" onClick={() => setIsFormOpen(false)}>Cancel</Button>
              <Button type="submit" className="bg-blue-600 hover:bg-blue-700">{editingAssignment ? 'Update' : 'Create'}</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}