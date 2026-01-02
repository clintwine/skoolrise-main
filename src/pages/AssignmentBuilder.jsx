import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { 
  Plus, Save, CheckCircle, Sparkles, 
  GripVertical, X, BookOpen, ChevronLeft, Map
} from 'lucide-react';
import { motion, Reorder } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '../utils';
import { toast } from 'sonner';
import CreateQuestionDialog from '../components/CreateQuestionDialog';
import ReactQuill from 'react-quill';

export default function AssignmentBuilder() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [assignmentData, setAssignmentData] = useState({
    title: '',
    instructions: '',
    class_id: '',
    due_date: '',
    max_points: 100,
    type: 'Homework',
    status: 'Draft',
    allow_late_submissions: true,
    late_penalty_percent: 10,
    allow_group_submissions: false,
  });

  const [selectedQuestions, setSelectedQuestions] = useState([]);
  const [createQuestionOpen, setCreateQuestionOpen] = useState(false);
  const [questionBankOpen, setQuestionBankOpen] = useState(false);

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

  const { data: classes = [] } = useQuery({
    queryKey: ['classes'],
    queryFn: () => base44.entities.Class.list(),
  });

  const { data: questionBank = [] } = useQuery({
    queryKey: ['questions'],
    queryFn: () => base44.entities.QuestionBank.list(),
  });

  const createAssignmentMutation = useMutation({
    mutationFn: async (data) => {
      const selectedClass = classes.find(c => c.id === data.class_id);
      const assignment = await base44.entities.Assignment.create({
        ...data,
        class_name: selectedClass?.class_name,
        teacher_id: teacherProfile?.id,
      });

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
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['teacher-assignments'] });
      toast.success('Assignment published successfully!');
      navigate(createPageUrl('TeacherAssignmentManager'));
    },
  });

  const handleSaveDraft = () => {
    if (!assignmentData.title || !assignmentData.class_id) {
      toast.error('Please fill in title and class');
      return;
    }
    createAssignmentMutation.mutate({ ...assignmentData, status: 'Draft' });
  };

  const handlePublish = () => {
    if (!assignmentData.title || !assignmentData.class_id || !assignmentData.due_date) {
      toast.error('Please fill in all required fields');
      return;
    }
    if (selectedQuestions.length === 0) {
      toast.error('Please add at least one question');
      return;
    }
    createAssignmentMutation.mutate({ ...assignmentData, status: 'Published' });
  };

  const handleCreateNewQuestion = (questionData) => {
    const newQuestion = {
      ...questionData,
      id: `temp_${Date.now()}`,
    };
    setSelectedQuestions([...selectedQuestions, newQuestion]);
    setCreateQuestionOpen(false);
    toast.success('Question added');
  };

  const totalPoints = selectedQuestions.reduce((sum, q) => sum + (q.points || 0), 0);

  const assignmentTypes = [
    { value: 'Homework', label: 'Homework', icon: '📝' },
    { value: 'Quiz', label: 'Quiz', icon: '❓' },
    { value: 'Project', label: 'Project', icon: '🎯' },
    { value: 'Essay', label: 'Essay', icon: '✍️' },
    { value: 'Lab', label: 'Lab', icon: '🔬' },
    { value: 'Video', label: 'Video', icon: '🎥' },
    { value: 'Research', label: 'Research', icon: '📚' },
  ];

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
              <h1 className="text-xl font-bold text-gray-900">Assignment Builder</h1>
              <div className="flex items-center gap-2">
                <Badge className="bg-red-100 text-red-700 text-xs">Draft</Badge>
                <span className="text-sm text-gray-500">{assignmentData.title || 'Untitled Assignment'}</span>
              </div>
            </div>
          </div>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" onClick={handleSaveDraft} disabled={createAssignmentMutation.isPending}>
            <Save className="w-4 h-4 mr-2" />
            Save Draft
          </Button>
          <Button onClick={handlePublish} disabled={createAssignmentMutation.isPending} className="bg-blue-600 hover:bg-blue-700 text-white">
            <CheckCircle className="w-4 h-4 mr-2" />
            Publish Assignment
          </Button>
        </div>
      </div>

      <div className="flex-1 flex gap-6 p-6 overflow-hidden">
        {/* Left Sidebar - Details & Settings */}
        <div className="w-80 flex flex-col gap-4 overflow-y-auto">
          <Tabs defaultValue="details" className="bg-white rounded-xl shadow-sm border">
            <TabsList className="grid w-full grid-cols-2 p-1">
              <TabsTrigger value="details">Details</TabsTrigger>
              <TabsTrigger value="settings">Settings</TabsTrigger>
            </TabsList>

            <TabsContent value="details" className="p-4 space-y-4">
              <div>
                <Label className="text-xs uppercase text-gray-500">TYPE</Label>
                <div className="grid grid-cols-4 gap-2 mt-2">
                  {assignmentTypes.map((type) => (
                    <button
                      key={type.value}
                      onClick={() => setAssignmentData({ ...assignmentData, type: type.value })}
                      className={`p-3 rounded-lg border transition-all ${
                        assignmentData.type === type.value
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <div className="text-2xl mb-1">{type.icon}</div>
                      <p className="text-xs font-medium">{type.label}</p>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <Label>Assignment Title</Label>
                <Input
                  value={assignmentData.title}
                  onChange={(e) => setAssignmentData({ ...assignmentData, title: e.target.value })}
                  placeholder="e.g. Chapter 5 Review Questions"
                  className="mt-1"
                />
              </div>

              <div>
                <Label>Class</Label>
                <select
                  value={assignmentData.class_id}
                  onChange={(e) => setAssignmentData({ ...assignmentData, class_id: e.target.value })}
                  className="w-full p-2 border rounded-lg mt-1"
                >
                  <option value="">Select class...</option>
                  {classes.map(c => (
                    <option key={c.id} value={c.id}>{c.class_name}</option>
                  ))}
                </select>
              </div>

              <div>
                <Label>Instructions (Optional)</Label>
                <ReactQuill
                  value={assignmentData.instructions}
                  onChange={(value) => setAssignmentData({ ...assignmentData, instructions: value })}
                  className="mt-1 bg-white"
                  placeholder="Enter instructions for students..."
                />
              </div>
            </TabsContent>

            <TabsContent value="settings" className="p-4 space-y-4">
              <div>
                <Label>Due Date</Label>
                <Input
                  type="datetime-local"
                  value={assignmentData.due_date}
                  onChange={(e) => setAssignmentData({ ...assignmentData, due_date: e.target.value })}
                  className="mt-1"
                />
              </div>

              <div className="flex items-center justify-between">
                <Label>Allow Late Submissions</Label>
                <Switch
                  checked={assignmentData.allow_late_submissions}
                  onCheckedChange={(checked) => setAssignmentData({ ...assignmentData, allow_late_submissions: checked })}
                />
              </div>

              {assignmentData.allow_late_submissions && (
                <div>
                  <Label>Late Penalty (%)</Label>
                  <Input
                    type="number"
                    value={assignmentData.late_penalty_percent}
                    onChange={(e) => setAssignmentData({ ...assignmentData, late_penalty_percent: parseInt(e.target.value) })}
                    className="mt-1"
                  />
                </div>
              )}

              <div className="flex items-center justify-between">
                <Label>Allow Group Submissions</Label>
                <Switch
                  checked={assignmentData.allow_group_submissions}
                  onCheckedChange={(checked) => setAssignmentData({ ...assignmentData, allow_group_submissions: checked })}
                />
              </div>
            </TabsContent>
          </Tabs>
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
              <Button variant="outline" onClick={() => setQuestionBankOpen(true)}>
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
    </div>
  );
}