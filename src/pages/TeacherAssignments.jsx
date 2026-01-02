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
import { Plus, Brain, Library, Edit, Trash2, Calendar, Video, Award, Bell, Users } from 'lucide-react';
import { format, formatDistanceToNow } from 'date-fns';
import { motion } from 'framer-motion';
import { DashboardSkeleton } from '@/components/SkeletonLoader';
import AssignmentDetailSheet from '../components/AssignmentDetailSheet';
import { useNavigate } from 'react-router-dom';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';

export default function TeacherAssignments() {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isAIOpen, setIsAIOpen] = useState(false);
  const [isTemplatesOpen, setIsTemplatesOpen] = useState(false);
  const [editingAssignment, setEditingAssignment] = useState(null);
  const [aiGenerating, setAiGenerating] = useState(false);
  const [detailSheetOpen, setDetailSheetOpen] = useState(false);
  const [selectedAssignment, setSelectedAssignment] = useState(null);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const queryClient = useQueryClient();
  const navigate = useNavigate();

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

  const { data: user } = useQuery({
    queryKey: ['current-user'],
    queryFn: () => base44.auth.me(),
  });

  const { data: teachers = [] } = useQuery({
    queryKey: ['teachers', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      return await base44.entities.Teacher.filter({ user_id: user.id });
    },
    enabled: !!user?.id,
  });

  const teacherProfile = teachers[0];

  const { data: assignments = [], isLoading: assignmentsLoading } = useQuery({
    queryKey: ['teacher-assignments', teacherProfile?.id],
    queryFn: async () => {
      if (!teacherProfile?.id) return [];
      return await base44.entities.Assignment.filter({ teacher_id: teacherProfile.id }, '-created_date');
    },
    enabled: !!teacherProfile?.id,
  });

  const { data: allSubmissions = [] } = useQuery({
    queryKey: ['all-submissions'],
    queryFn: () => base44.entities.Submission.list('-created_date', 50),
  });

  // Filter submissions for teacher's assignments
  const teacherAssignmentIds = assignments.map(a => a.id);
  const submissions = allSubmissions.filter(s => teacherAssignmentIds.includes(s.assignment_id));
  const unreadSubmissions = submissions.filter(s => !s.teacher_viewed && s.status === 'Submitted');
  const recentUnreadSubmissions = unreadSubmissions.slice(0, 5);

  const markAllAsReadMutation = useMutation({
    mutationFn: async () => {
      const updatePromises = unreadSubmissions.map(s => 
        base44.entities.Submission.update(s.id, { teacher_viewed: true })
      );
      return Promise.all(updatePromises);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['all-submissions'] });
      setNotificationsOpen(false);
    },
  });

  const { data: classes = [] } = useQuery({
    queryKey: ['teacher-classes', teacherProfile?.id],
    queryFn: async () => {
      if (!teacherProfile?.id) return [];
      return await base44.entities.Class.filter({ teacher_id: teacherProfile.id });
    },
    enabled: !!teacherProfile?.id,
  });

  const { data: templates = [] } = useQuery({
    queryKey: ['homework-templates'],
    queryFn: () => base44.entities.HomeworkTemplate.list(),
  });

  const createMutation = useMutation({
    mutationFn: async (data) => {
      if (!teacherProfile?.id) {
        throw new Error('Teacher profile not loaded');
      }
      return base44.entities.Assignment.create({ ...data, teacher_id: teacherProfile.id });
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
    
    if (!teacherProfile?.id) {
      alert('Please wait for your profile to load');
      return;
    }
    
    const selectedClass = classes.find(c => c.id === formData.class_id);
    const submitData = { ...formData, class_name: selectedClass?.class_name };
    
    if (editingAssignment) {
      updateMutation.mutate({ id: editingAssignment.id, data: submitData });
    } else {
      createMutation.mutate(submitData);
    }
  };

  const recentSubmissions = submissions.slice(0, 5);
  const unreadCount = recentSubmissions.filter(s => !s.teacher_viewed).length;

  const typeColors = {
    Homework: 'bg-blue-100 text-blue-800',
    Quiz: 'bg-purple-100 text-purple-800',
    Project: 'bg-green-100 text-green-800',
    Essay: 'bg-orange-100 text-orange-800',
    Lab: 'bg-pink-100 text-pink-800',
    Video: 'bg-red-100 text-red-800',
    Research: 'bg-indigo-100 text-indigo-800',
  };

  if (assignmentsLoading) {
    return <DashboardSkeleton />;
  }

  return (
    <div className="space-y-6">
      <motion.div 
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex justify-between items-start"
      >
        <div>
          <h1 className="text-4xl font-bold text-text">Assignment Manager</h1>
          <p className="text-text-secondary mt-2">Create, track, and grade student assignments</p>
        </div>
        <div className="flex gap-3 items-center">
          {/* Notification Bell */}
          <Popover open={notificationsOpen} onOpenChange={setNotificationsOpen}>
            <PopoverTrigger asChild>
              <button className="relative p-2 hover:bg-gray-100 rounded-xl transition-colors">
                <Bell className="w-6 h-6 text-text-secondary" />
                {unreadSubmissions.length > 0 && (
                  <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center animate-pulse">
                    {unreadSubmissions.length}
                  </span>
                )}
              </button>
            </PopoverTrigger>
            <PopoverContent className="w-96 p-0" align="end">
              <div className="p-4 border-b">
                <div className="flex justify-between items-center">
                  <h3 className="font-semibold text-text">Recent Submissions</h3>
                  {unreadSubmissions.length > 0 && (
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={() => markAllAsReadMutation.mutate()}
                      disabled={markAllAsReadMutation.isPending}
                      className="text-xs"
                    >
                      Mark all as read
                    </Button>
                  )}
                </div>
              </div>
              <div className="max-h-96 overflow-y-auto">
                {recentUnreadSubmissions.length === 0 ? (
                  <div className="p-8 text-center text-text-secondary">
                    <Bell className="w-12 h-12 mx-auto mb-2 opacity-30" />
                    <p className="text-sm">No new submissions</p>
                  </div>
                ) : (
                  <div className="divide-y">
                    {recentUnreadSubmissions.map((submission) => {
                      const assignment = assignments.find(a => a.id === submission.assignment_id);
                      return (
                        <div 
                          key={submission.id} 
                          className="p-4 hover:bg-gray-50 cursor-pointer transition-colors"
                          onClick={() => {
                            base44.entities.Submission.update(submission.id, { teacher_viewed: true });
                            queryClient.invalidateQueries({ queryKey: ['all-submissions'] });
                            setNotificationsOpen(false);
                          }}
                        >
                          <div className="flex justify-between items-start mb-1">
                            <p className="font-medium text-text text-sm">{submission.student_name}</p>
                            {submission.is_late && (
                              <Badge className="bg-red-100 text-red-800 text-xs">Late</Badge>
                            )}
                          </div>
                          <p className="text-xs text-text-secondary mb-1">{assignment?.title}</p>
                          <p className="text-xs text-text-secondary">
                            {formatDistanceToNow(new Date(submission.submitted_date), { addSuffix: true })}
                          </p>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </PopoverContent>
          </Popover>

          <Button 
            onClick={() => navigate(createPageUrl('AssignmentBuilder'))}
            className="bg-accent hover:bg-accent-hover text-white px-6"
          >
            <Plus className="w-5 h-5 mr-2" />
            Create Assignment
          </Button>
        </div>
      </motion.div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-white shadow-md rounded-xl">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-text-secondary">Active</p>
                <p className="text-3xl font-bold text-text">
                  {assignments.filter(a => a.status === 'Published').length}
                </p>
              </div>
              <CheckCircle className="w-10 h-10 text-green-600" />
            </div>
          </CardContent>
        </Card>
        <Card className="bg-white shadow-md rounded-xl">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-text-secondary">Grading</p>
                <p className="text-3xl font-bold text-text">
                  {submissions.filter(s => s.status === 'Submitted').length}
                </p>
              </div>
              <Clock className="w-10 h-10 text-orange-600" />
            </div>
          </CardContent>
        </Card>
        <Card className="bg-white shadow-md rounded-xl">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-text-secondary">Completed</p>
                <p className="text-3xl font-bold text-text">
                  {submissions.filter(s => s.status === 'Graded').length}
                </p>
              </div>
              <Award className="w-10 h-10 text-blue-600" />
            </div>
          </CardContent>
        </Card>
        <Card className="bg-white shadow-md rounded-xl">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-text-secondary">Total</p>
                <p className="text-3xl font-bold text-text">{assignments.length}</p>
              </div>
              <Users className="w-10 h-10 text-purple-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="space-y-4">
        {assignments.length === 0 ? (
          <Card className="bg-white rounded-2xl shadow-md">
            <CardContent className="p-16 text-center">
              <Users className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-2xl font-semibold text-text mb-2">No assignments yet</h3>
              <p className="text-text-secondary mb-6">Create your first assignment to get started</p>
              <Button 
                onClick={() => navigate(createPageUrl('AssignmentBuilder'))}
                className="bg-accent hover:bg-accent-hover text-white"
              >
                <Plus className="w-4 h-4 mr-2" />
                Create First Assignment
              </Button>
            </CardContent>
          </Card>
        ) : (
          assignments.map((assignment, index) => (
            <motion.div
              key={assignment.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.05 }}
            >
              <Card 
                className="bg-white shadow-md hover:shadow-xl transition-all duration-300 cursor-pointer rounded-2xl"
                onClick={() => {
                  setSelectedAssignment(assignment);
                  setDetailSheetOpen(true);
                }}
              >
                <CardContent className="p-6">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="text-lg font-bold text-text">{assignment.title}</h3>
                        <Badge className={typeColors[assignment.type]}>{assignment.type}</Badge>
                        {assignment.is_self_marking && <Badge className="bg-green-100 text-green-800">Auto-Grade</Badge>}
                        {assignment.ai_generated && <Badge className="bg-purple-100 text-purple-800"><Brain className="w-3 h-3 mr-1" />AI</Badge>}
                        {assignment.video_url && <Badge className="bg-red-100 text-red-800"><Video className="w-3 h-3 mr-1" />Video</Badge>}
                      </div>
                      <p className="text-sm text-text-secondary mb-2">{assignment.class_name}</p>
                      <p className="text-sm text-text line-clamp-2">{assignment.description}</p>
                      <div className="flex items-center gap-4 mt-3 text-sm">
                        <div className="flex items-center gap-1">
                          <Calendar className="w-4 h-4 text-text-secondary" />
                          <span className="text-text-secondary">Due: {format(new Date(assignment.due_date), 'MMM d, yyyy')}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Award className="w-4 h-4 text-text-secondary" />
                          <span className="text-text-secondary">{assignment.max_points} points</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-2" onClick={(e) => e.stopPropagation()}>
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
            </motion.div>
          ))
        )}
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

      {/* Assignment Detail Sheet */}
      <AssignmentDetailSheet
        assignment={selectedAssignment}
        open={detailSheetOpen}
        onOpenChange={setDetailSheetOpen}
      />
    </div>
  );
}