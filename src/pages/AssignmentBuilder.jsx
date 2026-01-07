import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Plus, Save, CheckCircle, Sparkles, 
  GripVertical, X, BookOpen, ChevronLeft, Map,
  ClipboardList, HelpCircle, FolderKanban, FileText,
  FlaskConical, Video, Search, Loader2, AlertCircle
} from 'lucide-react';
import { motion, Reorder } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '../utils';
import { toast } from 'sonner';
import CreateQuestionDialog from '../components/CreateQuestionDialog';
import ReactQuill from 'react-quill';
import LatePolicyConfig from '../components/assignments/LatePolicyConfig';
import RubricBuilder from '../components/assignments/RubricBuilder';

export default function AssignmentBuilder() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const urlParams = new URLSearchParams(window.location.search);
  const assignmentId = urlParams.get('id');
  const [assignmentLoaded, setAssignmentLoaded] = useState(false);

  const [assignmentData, setAssignmentData] = useState({
    title: '',
    instructions: '',
    class_id: '',
    subject_id: '',
    subject_name: '',
    due_date: '',
    max_points: 100,
    type: 'Homework',
    status: 'Draft',
    allow_late_submissions: true,
    late_policy_config: JSON.stringify({ type: 'none', deduction_percent: 10, grace_period_hours: 0, max_deduction: 50 }),
    allow_group_submissions: false,
    rubric_id: '',
  });
  const [rubricBuilderOpen, setRubricBuilderOpen] = useState(false);

  const [selectedQuestions, setSelectedQuestions] = useState([]);
  const [createQuestionOpen, setCreateQuestionOpen] = useState(false);
  const [questionBankOpen, setQuestionBankOpen] = useState(false);
  const [aiGenerateOpen, setAiGenerateOpen] = useState(false);
  const [aiPrompt, setAiPrompt] = useState('');
  const [aiGenerating, setAiGenerating] = useState(false);
  const [questionCount, setQuestionCount] = useState(5);
  const [aiSourceFile, setAiSourceFile] = useState(null);
  const [aiSourceFileUrl, setAiSourceFileUrl] = useState('');
  const [instructionsDialogOpen, setInstructionsDialogOpen] = useState(false);

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

  const { data: classArms = [] } = useQuery({
    queryKey: ['class-arms'],
    queryFn: () => base44.entities.ClassArm.list(),
  });

  const { data: questionBank = [] } = useQuery({
    queryKey: ['questions'],
    queryFn: () => base44.entities.QuestionBank.list(),
  });

  const { data: rubrics = [] } = useQuery({
    queryKey: ['rubrics'],
    queryFn: () => base44.entities.Rubric.list(),
  });

  const { data: subjects = [] } = useQuery({
    queryKey: ['subjects'],
    queryFn: () => base44.entities.Subject.filter({ status: 'Active' }),
  });

  const { data: existingAssignment } = useQuery({
    queryKey: ['assignment', assignmentId],
    queryFn: async () => {
      if (!assignmentId) return null;
      return await base44.entities.Assignment.get(assignmentId);
    },
    enabled: !!assignmentId,
  });

  const { data: existingQuestions = [] } = useQuery({
    queryKey: ['assignment-questions', assignmentId],
    queryFn: async () => {
      if (!assignmentId) return [];
      const assignmentQuestions = await base44.entities.AssignmentQuestion.filter({ assignment_id: assignmentId }, 'order');
      const questionsWithData = [];
      for (const aq of assignmentQuestions) {
        if (aq.question_bank_id) {
          const qData = await base44.entities.QuestionBank.get(aq.question_bank_id);
          questionsWithData.push(qData);
        }
      }
      return questionsWithData;
    },
    enabled: !!assignmentId,
  });

  useEffect(() => {
    if (existingAssignment && subjects.length > 0 && !assignmentLoaded) {
      console.log('📝 Loading existing assignment:', existingAssignment);

      // Find subject_id from subject_name if only subject_name exists
      let subjectId = existingAssignment.subject_id || '';
      if (!subjectId && existingAssignment.subject_name) {
        const foundSubject = subjects.find(s => s.subject_name === existingAssignment.subject_name);
        subjectId = foundSubject?.id || '';
      }

      // Also ensure subject_name is set if subject_id exists
      let subjectName = existingAssignment.subject_name || '';
      if (!subjectName && subjectId) {
        const foundSubject = subjects.find(s => s.id === subjectId);
        subjectName = foundSubject?.subject_name || '';
      }

      setAssignmentData(prev => ({
        ...prev,
        ...existingAssignment,
        due_date: existingAssignment.due_date || '',
        subject_id: subjectId,
        subject_name: subjectName,
      }));
    }
  }, [existingAssignment, assignmentLoaded, subjects]);

  useEffect(() => {
    if (existingQuestions.length > 0 && !assignmentLoaded) {
      console.log('📚 Loading existing questions:', existingQuestions);
      setSelectedQuestions(existingQuestions);
    }
  }, [existingQuestions, assignmentLoaded]);

  useEffect(() => {
    if (existingAssignment && existingQuestions && !assignmentLoaded) {
      setAssignmentLoaded(true);
    }
  }, [existingAssignment, existingQuestions, assignmentLoaded]);

  const createAssignmentMutation = useMutation({
    mutationFn: async (data) => {
      console.log('🎯 mutationFn started with data:', data);
      console.log('📚 classArms:', classArms);
      console.log('❓ selectedQuestions:', selectedQuestions);
      
      const selectedArm = classArms.find(c => c.id === data.class_id);
      console.log('🏫 selectedArm:', selectedArm);
      
      let assignment;
      if (assignmentId) {
        // Update existing assignment
        await base44.entities.Assignment.update(assignmentId, {
          ...data,
          class_name: selectedArm ? `Grade ${selectedArm.grade_level} - ${selectedArm.arm_name}` : '',
          teacher_id: teacherProfile?.id || null,
        });
        
        // Delete existing assignment questions
        const oldQuestions = await base44.entities.AssignmentQuestion.filter({ assignment_id: assignmentId });
        for (const q of oldQuestions) {
          await base44.entities.AssignmentQuestion.delete(q.id);
        }
        
        assignment = { id: assignmentId };
      } else {
        // Create new assignment
        assignment = await base44.entities.Assignment.create({
          ...data,
          class_name: selectedArm ? `Grade ${selectedArm.grade_level} - ${selectedArm.arm_name}` : '',
          teacher_id: teacherProfile?.id || null,
        });
      }

      for (let i = 0; i < selectedQuestions.length; i++) {
        const q = selectedQuestions[i];
        
        if (q.id?.startsWith('temp_')) {
          const savedQ = await base44.entities.QuestionBank.create({
            question_text: q.question_text,
            question_type: q.question_type,
            subject: q.subject || '',
            topic: q.topic || '',
            class_level: q.class_level || '',
            difficulty: q.difficulty,
            options: q.options,
            correct_answer: q.correct_answer,
            correct_answers: q.correct_answers,
            allow_multiple_answers: q.allow_multiple_answers,
            points: q.points,
            explanation: q.explanation || '',
            tags: q.tags || '',
            media_url: q.image_url || '',
          });
          await base44.entities.AssignmentQuestion.create({
            assignment_id: assignment.id,
            question_bank_id: savedQ.id,
            order: i + 1,
          });
        } else {
          await base44.entities.AssignmentQuestion.create({
            assignment_id: assignment.id,
            question_bank_id: q.id,
            order: i + 1,
          });
        }
      }

      return assignment;
    },
    onSuccess: (result, variables) => {
      console.log('✨ Mutation SUCCESS!', result);
      queryClient.invalidateQueries({ queryKey: ['teacher-assignments'] });
      const isDraft = variables.status === 'Draft';
      toast.success(assignmentId 
        ? 'Assignment updated successfully!' 
        : isDraft 
          ? 'Assignment saved as draft!' 
          : 'Assignment published successfully!'
      );
      navigate(createPageUrl('TeacherAssignmentManager'));
    },
    onError: (error) => {
      console.error('💥 Mutation ERROR:', error);
      console.error('Error details:', {
        message: error.message,
        stack: error.stack,
        response: error.response
      });
      toast.error('Failed to save assignment: ' + (error.message || 'Unknown error'));
    },
  });

  const handleSaveDraft = () => {
    console.log('🔵 handleSaveDraft called');
    console.log('📋 assignmentData:', assignmentData);
    console.log('👤 user:', user);
    
    if (!assignmentData.title) {
      console.log('❌ Validation failed: No title');
      toast.error('Missing Assignment Title', {
        description: 'Please enter a title for your assignment in the Details tab.',
        duration: 5000,
      });
      return;
    }
    if (!assignmentData.class_id) {
      console.log('❌ Validation failed: No class_id');
      toast.error('No Class Selected', {
        description: 'Please select a class from the Details tab before saving.',
        duration: 5000,
      });
      return;
    }
    if (!assignmentData.subject_id) {
      console.log('❌ Validation failed: No subject_id');
      toast.error('No Subject Selected', {
        description: 'Please select a subject from the Details tab before saving.',
        duration: 5000,
      });
      return;
    }
    
    // Check user permissions - allow admin and teacher only
    const userType = user?.user_type || '';
    const isAdmin = user?.role === 'admin' || userType === 'admin';
    const isTeacher = userType === 'teacher';
    
    if (!isAdmin && !isTeacher) {
      console.log('❌ Validation failed: User not authorized');
      toast.error('Permission Denied', {
        description: 'Only teachers and administrators can create assignments. Please contact your admin.',
        duration: 5000,
      });
      return;
    }
    
    const dataToSave = { ...assignmentData, status: 'Draft' };
    console.log('✅ All validations passed. Calling mutate with:', dataToSave);
    console.log('📊 createAssignmentMutation state:', { 
      isPending: createAssignmentMutation.isPending,
      isError: createAssignmentMutation.isError,
      isSuccess: createAssignmentMutation.isSuccess 
    });
    createAssignmentMutation.mutate(dataToSave);
    console.log('🚀 mutate() called');
  };

  const handlePublish = () => {
    console.log('🟢 handlePublish called');
    console.log('📋 assignmentData:', assignmentData);
    console.log('❓ selectedQuestions:', selectedQuestions);
    console.log('👤 user:', user);
    
    if (!assignmentData.title) {
      console.log('❌ Validation failed: No title');
      toast.error('Missing Assignment Title', {
        description: 'Please enter a title for your assignment in the Details tab.',
        duration: 5000,
      });
      return;
    }
    if (!assignmentData.class_id) {
      console.log('❌ Validation failed: No class_id');
      toast.error('No Class Selected', {
        description: 'Please select a class from the Details tab before publishing.',
        duration: 5000,
      });
      return;
    }
    if (!assignmentData.subject_id) {
      console.log('❌ Validation failed: No subject_id');
      toast.error('No Subject Selected', {
        description: 'Please select a subject from the Details tab before publishing.',
        duration: 5000,
      });
      return;
    }
    if (!assignmentData.due_date) {
      console.log('❌ Validation failed: No due_date');
      toast.error('No Due Date Set', {
        description: 'Please set a due date in the Settings tab. Go to Settings → Due Date to select when this assignment is due.',
        duration: 6000,
      });
      return;
    }
    if (selectedQuestions.length === 0) {
      console.log('❌ Validation failed: No questions');
      toast.error('No Questions Added', {
        description: 'Please add at least one question to this assignment before publishing.',
        duration: 5000,
      });
      return;
    }
    
    // Check user permissions - allow admin and teacher only
    const userType = user?.user_type || '';
    const isAdmin = user?.role === 'admin' || userType === 'admin';
    const isTeacher = userType === 'teacher';
    
    if (!isAdmin && !isTeacher) {
      console.log('❌ Validation failed: User not authorized');
      toast.error('Permission Denied', {
        description: 'Only teachers and administrators can publish assignments. Please contact your admin.',
        duration: 5000,
      });
      return;
    }
    
    const dataToPublish = { ...assignmentData, status: 'Published' };
    console.log('✅ All validations passed. Calling mutate with:', dataToPublish);
    console.log('📊 createAssignmentMutation state:', { 
      isPending: createAssignmentMutation.isPending,
      isError: createAssignmentMutation.isError,
      isSuccess: createAssignmentMutation.isSuccess 
    });
    createAssignmentMutation.mutate(dataToPublish);
    console.log('🚀 mutate() called');
  };

  const handleCreateNewQuestion = (questionData) => {
    // Auto-tag with current assignment's subject and grade
    const selectedClass = classArms.find(c => c.id === assignmentData.class_id);
    const newQuestion = {
      ...questionData,
      id: `temp_${Date.now()}`,
      subject: assignmentData.subject_name || questionData.subject,
      class_level: selectedClass?.grade_level || questionData.class_level,
    };
    console.log('➕ Creating new question with tags:', { subject: newQuestion.subject, class_level: newQuestion.class_level });
    setSelectedQuestions([...selectedQuestions, newQuestion]);
    setCreateQuestionOpen(false);
    toast.success('Question added with subject and grade tags');
  };

  const totalPoints = selectedQuestions.reduce((sum, q) => sum + (q.points || 0), 0);

  const assignmentTypes = [
    { value: 'Homework', label: 'Homework', icon: ClipboardList },
    { value: 'Quiz', label: 'Quiz', icon: HelpCircle },
    { value: 'Project', label: 'Project', icon: FolderKanban },
    { value: 'Essay', label: 'Essay', icon: FileText },
    { value: 'Lab', label: 'Lab', icon: FlaskConical },
    { value: 'Video', label: 'Video', icon: Video },
    { value: 'Research', label: 'Research', icon: Search },
  ];

  const handleAIFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    setAiSourceFile(file);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      setAiSourceFileUrl(file_url);
      toast.success('File uploaded successfully');
    } catch (error) {
      toast.error('Failed to upload file');
      setAiSourceFile(null);
    }
  };

  const handleAIGenerate = async () => {
    if (!aiPrompt.trim() && !aiSourceFileUrl) {
      toast.error('Please enter a topic or upload a source file');
      return;
    }

    setAiGenerating(true);
    try {
      const promptText = `Generate ${questionCount} multiple choice questions${aiPrompt ? ` about: ${aiPrompt}` : ' based on the provided source material'}.

Each question should have 4 options with one correct answer.
Make questions educational and appropriate for students.
Vary the difficulty (easy, medium, hard).
${aiSourceFileUrl ? 'Use the uploaded file as the source material for generating questions.' : ''}

Return as JSON array with this exact structure:
{
  "questions": [
    {
      "question_text": "Question here?",
      "options": ["Option A", "Option B", "Option C", "Option D"],
      "correct_answer": "Option A",
      "difficulty": "Medium",
      "points": 2,
      "explanation": "Brief explanation why this is correct"
    }
  ]
}`;

      const response = await base44.integrations.Core.InvokeLLM({
        prompt: promptText,
        file_urls: aiSourceFileUrl ? [aiSourceFileUrl] : undefined,
        response_json_schema: {
          type: "object",
          properties: {
            questions: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  question_text: { type: "string" },
                  options: { type: "array", items: { type: "string" } },
                  correct_answer: { type: "string" },
                  difficulty: { type: "string" },
                  points: { type: "number" },
                  explanation: { type: "string" }
                }
              }
            }
          }
        }
      });

      if (response.questions && response.questions.length > 0) {
        // Auto-tag with current assignment's subject and grade
        const selectedClass = classArms.find(c => c.id === assignmentData.class_id);
        const newQuestions = response.questions.map((q, idx) => ({
          id: `temp_ai_${Date.now()}_${idx}`,
          question_text: q.question_text,
          question_type: 'Multiple Choice',
          options: JSON.stringify(q.options),
          correct_answer: q.correct_answer,
          difficulty: q.difficulty || 'Medium',
          points: q.points || 2,
          explanation: q.explanation || '',
          subject: assignmentData.subject_name || '',
          class_level: selectedClass?.grade_level || '',
        }));

        console.log('🤖 AI generated questions with tags:', newQuestions[0]);
        setSelectedQuestions([...selectedQuestions, ...newQuestions]);
        toast.success(`Generated ${newQuestions.length} questions with subject and grade tags!`);
        setAiGenerateOpen(false);
        setAiPrompt('');
        setAiSourceFile(null);
        setAiSourceFileUrl('');
      }
    } catch (error) {
      console.error('AI generation error:', error);
      toast.error('Failed to generate questions. Please try again.');
    } finally {
      setAiGenerating(false);
    }
  };

  return (
    <div className="h-[calc(100vh-100px)] flex flex-col bg-gray-50">
      {/* Top Bar */}
      <div className="bg-white border-b px-6 py-4 flex justify-between items-center">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={() => navigate(createPageUrl('TeacherAssignmentManager'))}>
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <Map className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">
                {assignmentId ? 'Edit Assignment' : 'Assignment Builder'}
              </h1>
              <div className="flex items-center gap-2">
                <Badge className={assignmentData.status === 'Published' ? 'bg-green-100 text-green-700 text-xs' : 'bg-red-100 text-red-700 text-xs'}>
                  {assignmentData.status || 'Draft'}
                </Badge>
                <span className="text-sm text-gray-500">{assignmentData.title || 'Untitled Assignment'}</span>
              </div>
            </div>
          </div>
        </div>
        <div className="flex gap-3">
          <Button 
            type="button"
            variant="outline" 
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              handleSaveDraft();
            }} 
            disabled={createAssignmentMutation.isPending}
          >
            {createAssignmentMutation.isPending ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Save className="w-4 h-4 mr-2" />
            )}
            Save Draft
          </Button>
          <Button 
            type="button"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              if (!assignmentData.due_date) {
                toast.error('Due Date Required', {
                  description: 'Please set a due date before publishing. You can set it in the details section below.',
                  duration: 5000,
                });
                return;
              }
              handlePublish();
            }} 
            disabled={createAssignmentMutation.isPending} 
            className="bg-blue-600 hover:bg-blue-700 text-white"
          >
            {createAssignmentMutation.isPending ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <CheckCircle className="w-4 h-4 mr-2" />
            )}
            Publish Assignment
          </Button>
        </div>
      </div>

      <div className="flex-1 flex gap-6 p-6 overflow-hidden">
        {/* Left Sidebar - Details & Settings */}
        <div className="w-80 flex flex-col gap-4 overflow-y-auto">
          <Card className="bg-white rounded-xl shadow-sm border">
            <CardContent className="p-4 space-y-4">
              <div>
                <Label className="text-xs uppercase text-gray-500">TYPE</Label>
                <div className="grid grid-cols-4 gap-2 mt-2">
                  {assignmentTypes.map((type) => {
                    const IconComponent = type.icon;
                    return (
                      <button
                        key={type.value}
                        onClick={() => setAssignmentData({ ...assignmentData, type: type.value })}
                        className={`p-3 rounded-xl border-2 transition-all flex flex-col items-center justify-center ${
                          assignmentData.type === type.value
                            ? 'border-blue-500 bg-blue-50'
                            : 'border-gray-200 hover:border-gray-300 bg-white'
                        }`}
                      >
                        <IconComponent className={`w-5 h-5 mb-1 ${
                          assignmentData.type === type.value ? 'text-blue-600' : 'text-gray-500'
                        }`} />
                        <p className={`text-xs font-medium ${
                          assignmentData.type === type.value ? 'text-blue-700' : 'text-gray-700'
                        }`}>{type.label}</p>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <Label htmlFor="due-date-input-top">Due Date *</Label>
                <Input
                  id="due-date-input-top"
                  type="datetime-local"
                  value={assignmentData.due_date}
                  onChange={(e) => setAssignmentData({ ...assignmentData, due_date: e.target.value })}
                  className="mt-1"
                />
                <p className="text-xs text-gray-500 mt-1">Required to publish assignment</p>
              </div>

              <div>
                <Label htmlFor="title-input">Assignment Title *</Label>
                <Input
                  id="title-input"
                  value={assignmentData.title}
                  onChange={(e) => setAssignmentData({ ...assignmentData, title: e.target.value })}
                  placeholder="e.g. Chapter 5 Review Questions"
                  className="mt-1"
                />
              </div>

              <div>
                <Label htmlFor="subject-select">Subject *</Label>
                <select
                  id="subject-select"
                  value={assignmentData.subject_id}
                  onChange={(e) => {
                    const subject = subjects.find(s => s.id === e.target.value);
                    console.log('📚 Subject selected:', subject);
                    setAssignmentData({ 
                      ...assignmentData, 
                      subject_id: e.target.value,
                      subject_name: subject?.subject_name || ''
                    });
                  }}
                  className="w-full p-2 border rounded-lg mt-1"
                >
                  <option value="">Select subject...</option>
                  {subjects.map(subject => (
                    <option key={subject.id} value={subject.id}>
                      {subject.subject_name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <Label htmlFor="class-select">Class *</Label>
                <select
                  id="class-select"
                  value={assignmentData.class_id}
                  onChange={(e) => setAssignmentData({ ...assignmentData, class_id: e.target.value })}
                  className="w-full p-2 border rounded-lg mt-1"
                >
                  <option value="">Select class...</option>
                  {classArms.map(arm => (
                    <option key={arm.id} value={arm.id}>
                      {arm.grade_level} - {arm.arm_name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <Label>Instructions (Optional)</Label>
                <Button 
                  variant="outline" 
                  className="w-full mt-1 justify-start text-left"
                  onClick={() => setInstructionsDialogOpen(true)}
                >
                  {assignmentData.instructions && assignmentData.instructions !== '<p><br></p>' 
                    ? <span className="truncate">Edit instructions...</span>
                    : <span className="text-gray-500">Add instructions for students...</span>
                  }
                </Button>
              </div>

              <LatePolicyConfig
                value={assignmentData.late_policy_config}
                onChange={(config) => setAssignmentData({ ...assignmentData, late_policy_config: config })}
              />

              <div className="flex items-center justify-between">
                <Label>Allow Group Submissions</Label>
                <Switch
                  checked={assignmentData.allow_group_submissions}
                  onCheckedChange={(checked) => setAssignmentData({ ...assignmentData, allow_group_submissions: checked })}
                />
              </div>

              <div>
                <Label>Grading Rubric (Optional)</Label>
                <div className="flex gap-2 mt-1">
                  <Select 
                    value={assignmentData.rubric_id} 
                    onValueChange={(v) => setAssignmentData({ ...assignmentData, rubric_id: v })}
                  >
                    <SelectTrigger className="flex-1">
                      <SelectValue placeholder="Select rubric..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={null}>No Rubric</SelectItem>
                      {rubrics.map(r => (
                        <SelectItem key={r.id} value={r.id}>
                          {r.name} ({r.total_points} pts)
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => setRubricBuilderOpen(true)}
                  >
                    <Plus className="w-4 h-4" />
                  </Button>
                </div>
              </div>
              </CardContent>
              </Card>
              </div>

        {/* Main Canvas */}
        <div className="flex-1 flex flex-col gap-4 overflow-hidden">
          {/* Stats Bar */}
          <div className="flex items-center justify-between bg-white rounded-xl shadow-sm border p-4">
            <div className="flex items-center gap-6">
              <div>
                <p className="text-xs text-gray-500"># Questions</p>
                <p className="text-2xl font-bold text-gray-900">{selectedQuestions.length}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Total Points</p>
                <p className="text-2xl font-bold text-gray-900">{totalPoints}</p>
              </div>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setAiGenerateOpen(true)} className="border-purple-300 text-purple-700 hover:bg-purple-50">
                <Sparkles className="w-4 h-4 mr-2" />
                AI Generate
              </Button>
              <Button variant="outline" onClick={() => {
                console.log('🏦 Add from Bank clicked');
                console.log('📚 questionBank:', questionBank);
                console.log('📋 assignmentData:', assignmentData);

                if (!assignmentData.class_id) {
                  toast.error('Please select a class first', {
                    description: 'You need to select a class before adding questions from the bank. Questions are filtered by grade level.',
                    duration: 5000,
                  });
                  return;
                }

                if (!assignmentData.subject_name) {
                  toast.error('Please select a subject first', {
                    description: 'You need to select a subject before adding questions from the bank. Questions are filtered by subject.',
                    duration: 5000,
                  });
                  return;
                }

                setQuestionBankOpen(true);
              }}>
                <Plus className="w-4 h-4 mr-2" />
                Add from Bank
              </Button>
              <Button onClick={() => setCreateQuestionOpen(true)} className="bg-gray-900 hover:bg-gray-800 text-white">
                <Plus className="w-4 h-4 mr-2" />
                Create Question
              </Button>
            </div>
          </div>

          {/* Questions List */}
          <div className="flex-1 overflow-y-auto">
            {selectedQuestions.length === 0 ? (
              <Card className="bg-white rounded-xl shadow-sm h-full flex items-center justify-center">
                <CardContent className="text-center p-12">
                  <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <BookOpen className="w-12 h-12 text-gray-400" />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">No questions added yet</h3>
                  <p className="text-gray-500 mb-6">Add questions from the bank or create new ones<br />to build your assignment.</p>
                  <Button onClick={() => setCreateQuestionOpen(true)} className="bg-blue-600 hover:bg-blue-700 text-white">
                    <Plus className="w-4 h-4 mr-2" />
                    Create Question
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <Reorder.Group axis="y" values={selectedQuestions} onReorder={setSelectedQuestions} className="space-y-3">
                {selectedQuestions.map((q, idx) => (
                  <Reorder.Item key={q.id} value={q}>
                    <Card className="bg-white shadow-sm hover:shadow-md transition-shadow cursor-move">
                      <CardContent className="p-4">
                        <div className="flex gap-3">
                          <GripVertical className="w-5 h-5 text-gray-400 flex-shrink-0 mt-1" />
                          <div className="flex-1">
                            <div className="flex items-start justify-between mb-2">
                              <div className="flex-1">
                                <p className="font-medium text-gray-900">{q.question_text}</p>
                                <div className="flex gap-2 mt-2 flex-wrap">
                                  <Badge variant="outline" className="text-xs">{q.question_type}</Badge>
                                  <Badge className="bg-blue-100 text-blue-800 text-xs">{q.points} pts</Badge>
                                  {q.difficulty && <Badge variant="outline" className="text-xs">{q.difficulty}</Badge>}
                                  {q.id?.startsWith('temp_') && <Badge className="bg-purple-100 text-purple-800 text-xs">New</Badge>}
                                </div>
                              </div>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setSelectedQuestions(selectedQuestions.filter(sq => sq.id !== q.id))}
                                className="text-red-500 hover:text-red-700"
                              >
                                <X className="w-4 h-4" />
                              </Button>
                            </div>

                            {q.options && JSON.parse(q.options).length > 0 && (
                              <div className="space-y-1 mt-3 pl-4">
                                {JSON.parse(q.options).map((option, optIdx) => {
                                  const isCorrect = q.allow_multiple_answers 
                                    ? q.correct_answers?.includes(option)
                                    : option === q.correct_answer;
                                  
                                  return (
                                    <div
                                      key={optIdx}
                                      className={`p-2 rounded-lg text-sm ${
                                        isCorrect ? 'bg-green-50 border border-green-200' : 'bg-gray-50'
                                      }`}
                                    >
                                      <span className="font-medium">{String.fromCharCode(65 + optIdx)}.</span> {option}
                                      {isCorrect && <span className="ml-2 text-green-600">✓</span>}
                                    </div>
                                  );
                                })}
                              </div>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </Reorder.Item>
                ))}
              </Reorder.Group>
            )}
          </div>
        </div>
      </div>

      {/* Create Question Dialog */}
      <CreateQuestionDialog
        open={createQuestionOpen}
        onOpenChange={setCreateQuestionOpen}
        question={null}
        onSubmit={handleCreateNewQuestion}
      />

      {/* Rubric Builder Dialog */}
      <RubricBuilder
        open={rubricBuilderOpen}
        onOpenChange={setRubricBuilderOpen}
        onRubricCreated={(rubric) => {
          setAssignmentData({ ...assignmentData, rubric_id: rubric.id });
        }}
      />

      {/* Instructions Dialog */}
      <Dialog open={instructionsDialogOpen} onOpenChange={setInstructionsDialogOpen}>
        <DialogContent className="bg-white max-w-2xl">
          <DialogHeader>
            <DialogTitle>Assignment Instructions</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <ReactQuill
              value={assignmentData.instructions}
              onChange={(value) => setAssignmentData({ ...assignmentData, instructions: value })}
              className="bg-white min-h-[200px]"
              placeholder="Enter instructions for students..."
            />
            <div className="flex justify-end">
              <Button onClick={() => setInstructionsDialogOpen(false)}>
                Done
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* AI Generate Dialog */}
      {/* Question Bank Dialog */}
      <Dialog open={questionBankOpen} onOpenChange={setQuestionBankOpen}>
        <DialogContent className="bg-white max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Add Questions from Bank</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {(() => {
              // Get the selected class grade level
              const selectedClass = classArms.find(c => c.id === assignmentData.class_id);
              const selectedGrade = selectedClass?.grade_level;
              const selectedSubject = assignmentData.subject_name;

              console.log('🔍 Filtering questions for:', { selectedGrade, selectedSubject });

              // Filter questions by grade and subject
              const filteredQuestions = questionBank.filter(q => {
                const matchesGrade = !selectedGrade || q.class_level === selectedGrade;
                const matchesSubject = !selectedSubject || q.subject === selectedSubject;
                return matchesGrade && matchesSubject;
              });

              console.log('📊 Filtered questions:', filteredQuestions.length, 'out of', questionBank.length);

              if (!assignmentData.class_id || !assignmentData.subject_name) {
                return (
                  <div className="text-center py-12">
                    <AlertCircle className="w-16 h-16 text-orange-300 mx-auto mb-4" />
                    <p className="text-gray-700 font-medium mb-2">Please select a class and subject first</p>
                    <p className="text-sm text-gray-500">Questions are filtered by grade level and subject</p>
                  </div>
                );
              }

              if (filteredQuestions.length === 0) {
                return (
                  <div className="text-center py-12">
                    <BookOpen className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-700 font-medium mb-2">No matching questions found</p>
                    <p className="text-sm text-gray-500">No questions for Grade {selectedGrade} - {selectedSubject}</p>
                    <p className="text-sm text-gray-400 mt-2">Create questions to add them to your bank.</p>
                  </div>
                );
              }

              return (
                <div>
                  <div className="bg-blue-50 p-3 rounded-lg mb-4">
                    <p className="text-sm text-blue-800">
                      Showing questions for <span className="font-semibold">Grade {selectedGrade}</span> - <span className="font-semibold">{selectedSubject}</span>
                    </p>
                  </div>
                  <div className="grid gap-3">
                    {filteredQuestions.map((q) => {
                      const alreadyAdded = selectedQuestions.some(sq => sq.id === q.id);
                      return (
                        <Card key={q.id} className={`${alreadyAdded ? 'bg-gray-50 opacity-60' : 'hover:shadow-md'} transition-all`}>
                          <CardContent className="p-4">
                            <div className="flex justify-between items-start gap-4">
                              <div className="flex-1">
                                <p className="font-medium text-gray-900">{q.question_text}</p>
                                <div className="flex gap-2 mt-2 flex-wrap">
                                  <Badge variant="outline" className="text-xs">{q.question_type}</Badge>
                                  <Badge className="bg-blue-100 text-blue-800 text-xs">{q.points} pts</Badge>
                                  {q.difficulty && <Badge variant="outline" className="text-xs">{q.difficulty}</Badge>}
                                </div>
                              </div>
                              <Button
                                size="sm"
                                disabled={alreadyAdded}
                                onClick={() => {
                                  setSelectedQuestions([...selectedQuestions, q]);
                                  toast.success('Question added');
                                }}
                                className={alreadyAdded ? '' : 'bg-blue-600 hover:bg-blue-700'}
                              >
                                {alreadyAdded ? 'Added' : 'Add'}
                              </Button>
                            </div>
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>
                </div>
              );
            })()}
          </div>
        </DialogContent>
      </Dialog>

      {/* AI Generate Dialog */}
      <Dialog open={aiGenerateOpen} onOpenChange={setAiGenerateOpen}>
        <DialogContent className="bg-white max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-purple-600" />
              Generate Questions with AI
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Topic or Description</Label>
              <Textarea
                value={aiPrompt}
                onChange={(e) => setAiPrompt(e.target.value)}
                placeholder="e.g., Photosynthesis process in plants, or World War II causes and effects..."
                rows={3}
                className="mt-1"
              />
            </div>
            
            <div>
              <Label>Upload Source Material (Optional)</Label>
              <p className="text-xs text-gray-500 mb-2">Upload a PDF, image, or document for the AI to generate questions from</p>
              <Input
                type="file"
                accept=".pdf,.png,.jpg,.jpeg,.doc,.docx,.txt"
                onChange={handleAIFileUpload}
                className="mt-1"
              />
              {aiSourceFile && (
                <div className="mt-2 p-2 bg-green-50 rounded-lg flex items-center justify-between">
                  <span className="text-sm text-green-700">{aiSourceFile.name}</span>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => { setAiSourceFile(null); setAiSourceFileUrl(''); }}
                    className="text-red-500 h-6 px-2"
                  >
                    Remove
                  </Button>
                </div>
              )}
            </div>

            <div>
              <Label>Number of Questions</Label>
              <div className="flex gap-2 mt-1">
                {[3, 5, 10, 15].map((num) => (
                  <Button
                    key={num}
                    variant={questionCount === num ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setQuestionCount(num)}
                    className={questionCount === num ? 'bg-purple-600 hover:bg-purple-700' : ''}
                  >
                    {num}
                  </Button>
                ))}
              </div>
            </div>
            <div className="bg-purple-50 p-3 rounded-lg text-sm text-purple-800">
              <p className="font-medium mb-1">How it works:</p>
              <ul className="list-disc list-inside space-y-1 text-purple-700">
                <li>Enter a topic OR upload source material (or both)</li>
                <li>AI will generate multiple choice questions</li>
                <li>Each question includes correct answer and explanation</li>
                <li>You can edit or remove any generated question</li>
              </ul>
            </div>
            <div className="flex justify-end gap-3 pt-2">
              <Button variant="outline" onClick={() => setAiGenerateOpen(false)}>Cancel</Button>
              <Button 
                onClick={handleAIGenerate} 
                disabled={aiGenerating || (!aiPrompt.trim() && !aiSourceFileUrl)}
                className="bg-purple-600 hover:bg-purple-700"
              >
                {aiGenerating ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 mr-2" />
                    Generate {questionCount} Questions
                  </>
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}