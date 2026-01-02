import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Switch } from '@/components/ui/switch';
import { 
  Plus, Save, CheckCircle, Sparkles, 
  GripVertical, X, Clock, Target, Search, BookOpen
} from 'lucide-react';
import { motion, Reorder } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '../utils';
import { toast } from 'sonner';
import CreateQuestionDialog from '../components/CreateQuestionDialog';

export default function AssignmentBuilder() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [assignmentData, setAssignmentData] = useState({
    title: '',
    description: '',
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
  const [questionBankOpen, setQuestionBankOpen] = useState(false);
  const [createQuestionOpen, setCreateQuestionOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

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

      // Create assignment questions
      for (let i = 0; i < selectedQuestions.length; i++) {
        const q = selectedQuestions[i];
        
        // If temp question, save to QuestionBank first
        if (q.id?.startsWith('temp_')) {
          const savedQ = await base44.entities.QuestionBank.create(q);
          await base44.entities.AssignmentQuestion?.create({
            assignment_id: assignment.id,
            question_bank_id: savedQ.id,
            order: i + 1,
          });
        } else {
          await base44.entities.AssignmentQuestion?.create({
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
      toast.success('Assignment created successfully!');
      navigate(createPageUrl('TeacherAssignments'));
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
    toast.success('Question added to assignment');
  };

  const totalPoints = selectedQuestions.reduce((sum, q) => sum + q.points, 0);

  const filteredQuestionBank = questionBank.filter(q =>
    searchQuery ? q.question_text.toLowerCase().includes(searchQuery.toLowerCase()) : true
  );

  const assignmentTypes = [
    { value: 'Homework', label: 'Homework', icon: '📝', color: 'bg-blue-100 text-blue-800' },
    { value: 'Quiz', label: 'Quiz', icon: '❓', color: 'bg-purple-100 text-purple-800' },
    { value: 'Project', label: 'Project', icon: '🎯', color: 'bg-green-100 text-green-800' },
    { value: 'Essay', label: 'Essay', icon: '✍️', color: 'bg-orange-100 text-orange-800' },
    { value: 'Lab', label: 'Lab', icon: '🔬', color: 'bg-pink-100 text-pink-800' },
    { value: 'Video', label: 'Video', icon: '🎥', color: 'bg-red-100 text-red-800' },
    { value: 'Research', label: 'Research', icon: '📚', color: 'bg-indigo-100 text-indigo-800' },
  ];

  return (
    <div className="h-[calc(100vh-120px)] flex flex-col">
      {/* Sticky Top Bar */}
      <div className="bg-white border-b shadow-sm px-6 py-4 flex justify-between items-center sticky top-0 z-20">
        <div>
          <h1 className="text-2xl font-bold text-text">Assignment Builder</h1>
          <p className="text-sm text-text-secondary">
            {assignmentData.title || 'Untitled Assignment'} • {assignmentData.type}
          </p>
        </div>
        <div className="flex gap-3">
          <Button 
            variant="outline" 
            onClick={handleSaveDraft}
            disabled={createAssignmentMutation.isPending}
          >
            <Save className="w-4 h-4 mr-2" />
            Save Draft
          </Button>
          <Button 
            onClick={handlePublish}
            disabled={createAssignmentMutation.isPending}
            className="bg-green-600 hover:bg-green-700 text-white"
          >
            <CheckCircle className="w-4 h-4 mr-2" />
            {createAssignmentMutation.isPending ? 'Publishing...' : 'Publish Assignment'}
          </Button>
        </div>
      </div>

      <div className="flex-1 flex gap-6 p-6 overflow-hidden">
        {/* Left Panel - Configuration (30%) */}
        <div className="w-[30%] overflow-y-auto space-y-4">
          <Tabs defaultValue="details">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="details">Details</TabsTrigger>
              <TabsTrigger value="settings">Settings</TabsTrigger>
            </TabsList>

            <TabsContent value="details" className="space-y-4 mt-4">
              <Card className="bg-white rounded-xl shadow-md">
                <CardContent className="p-4 space-y-4">
                  <div>
                    <Label>Title *</Label>
                    <Input
                      value={assignmentData.title}
                      onChange={(e) => setAssignmentData({ ...assignmentData, title: e.target.value })}
                      placeholder="e.g., Chapter 5 Practice Problems"
                      className="mt-1"
                    />
                  </div>

                  <div>
                    <Label>Description</Label>
                    <Textarea
                      value={assignmentData.description}
                      onChange={(e) => setAssignmentData({ ...assignmentData, description: e.target.value })}
                      rows={4}
                      placeholder="Assignment instructions..."
                      className="mt-1"
                    />
                  </div>

                  <div>
                    <Label>Class *</Label>
                    <select
                      value={assignmentData.class_id}
                      onChange={(e) => setAssignmentData({ ...assignmentData, class_id: e.target.value })}
                      className="w-full p-2 border rounded-lg mt-1"
                    >
                      <option value="">Select class</option>
                      {classes.map(c => (
                        <option key={c.id} value={c.id}>{c.class_name}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <Label>Assignment Type *</Label>
                    <div className="grid grid-cols-2 gap-2 mt-2">
                      {assignmentTypes.map((type) => (
                        <button
                          key={type.value}
                          type="button"
                          onClick={() => setAssignmentData({ ...assignmentData, type: type.value })}
                          className={`p-3 rounded-xl border-2 transition-all ${
                            assignmentData.type === type.value
                              ? 'border-accent bg-accent/10'
                              : 'border-gray-200 hover:border-gray-300'
                          }`}
                        >
                          <div className="text-2xl mb-1">{type.icon}</div>
                          <p className="text-xs font-medium">{type.label}</p>
                        </button>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="settings" className="space-y-4 mt-4">
              <Card className="bg-white rounded-xl shadow-md">
                <CardContent className="p-4 space-y-4">
                  <div>
                    <Label>Due Date *</Label>
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
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>

        {/* Right Panel - Builder Canvas (70%) */}
        <div className="flex-1 flex flex-col space-y-4 overflow-hidden">
          {/* Sticky Stats Header */}
          <Card className="bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl shadow-lg">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-6">
                  <div>
                    <p className="text-xs opacity-90">Questions</p>
                    <p className="text-2xl font-bold">{selectedQuestions.length}</p>
                  </div>
                  <div>
                    <p className="text-xs opacity-90">Total Points</p>
                    <p className="text-2xl font-bold">{totalPoints}</p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Sheet open={questionBankOpen} onOpenChange={setQuestionBankOpen}>
                    <SheetTrigger asChild>
                      <Button variant="secondary" className="bg-white/20 hover:bg-white/30 text-white">
                        <BookOpen className="w-4 h-4 mr-2" />
                        Question Bank
                      </Button>
                    </SheetTrigger>
                    <SheetContent className="w-[600px] overflow-y-auto">
                      <SheetHeader>
                        <SheetTitle>Select Questions</SheetTitle>
                      </SheetHeader>
                      <div className="mt-6 space-y-4">
                        <div className="relative">
                          <Search className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                          <Input
                            placeholder="Search questions..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-10"
                          />
                        </div>
                        <div className="space-y-3">
                          {filteredQuestionBank
                            .filter(q => !selectedQuestions.find(sq => sq.id === q.id))
                            .map((q) => (
                            <Card key={q.id} className="hover:bg-gray-50 transition-colors">
                              <CardContent className="p-4">
                                <p className="text-sm mb-2 line-clamp-2">{q.question_text}</p>
                                <div className="flex items-center justify-between">
                                  <div className="flex gap-2">
                                    <Badge variant="outline">{q.question_type}</Badge>
                                    <Badge className="bg-blue-100 text-blue-800">{q.points} pts</Badge>
                                  </div>
                                  <Button
                                    size="sm"
                                    onClick={() => {
                                      setSelectedQuestions([...selectedQuestions, q]);
                                      toast.success('Question added');
                                    }}
                                  >
                                    <Plus className="w-3 h-3" />
                                  </Button>
                                </div>
                              </CardContent>
                            </Card>
                          ))}
                        </div>
                      </div>
                    </SheetContent>
                  </Sheet>

                  <Button 
                    variant="secondary"
                    className="bg-white/20 hover:bg-white/30 text-white"
                    onClick={() => setCreateQuestionOpen(true)}
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    New Question
                  </Button>

                  <Button 
                    variant="secondary"
                    className="bg-white/20 hover:bg-white/30 text-white"
                    disabled
                  >
                    <Sparkles className="w-4 h-4 mr-2" />
                    AI Generate
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Question Cards */}
          <div className="flex-1 overflow-y-auto space-y-3">
            {selectedQuestions.length === 0 ? (
              <Card className="bg-white rounded-xl shadow-md h-full">
                <CardContent className="flex flex-col items-center justify-center h-full text-center p-12">
                  <Target className="w-16 h-16 text-gray-400 mb-4" />
                  <h3 className="text-xl font-semibold text-text mb-2">No questions yet</h3>
                  <p className="text-text-secondary mb-4">Add questions from the bank or create new ones</p>
                  <div className="flex gap-2">
                    <Button 
                      onClick={() => setQuestionBankOpen(true)}
                      variant="outline"
                    >
                      <BookOpen className="w-4 h-4 mr-2" />
                      Browse Question Bank
                    </Button>
                    <Button 
                      onClick={() => setCreateQuestionOpen(true)}
                      className="bg-accent hover:bg-accent-hover text-white"
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Create Question
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <Reorder.Group axis="y" values={selectedQuestions} onReorder={setSelectedQuestions} className="space-y-3">
                {selectedQuestions.map((q, idx) => (
                  <Reorder.Item key={q.id} value={q}>
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                    >
                      <Card className="bg-white rounded-xl shadow-md hover:shadow-lg transition-shadow cursor-move">
                        <CardContent className="p-5">
                          <div className="flex gap-3">
                            <div className="flex items-start gap-2">
                              <GripVertical className="w-5 h-5 text-gray-400 mt-1" />
                              <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center flex-shrink-0">
                                <span className="text-sm font-bold text-purple-600">{idx + 1}</span>
                              </div>
                            </div>
                            <div className="flex-1">
                              <div className="flex items-start justify-between mb-3">
                                <div className="flex-1">
                                  <p className="text-base font-medium text-text mb-2">{q.question_text}</p>
                                  <div className="flex gap-2 flex-wrap">
                                    <Badge variant="outline">{q.question_type}</Badge>
                                    <Badge className="bg-blue-100 text-blue-800">{q.points} points</Badge>
                                    {q.difficulty && <Badge variant="outline">{q.difficulty}</Badge>}
                                    {q.id?.startsWith('temp_') && (
                                      <Badge className="bg-purple-100 text-purple-800">New</Badge>
                                    )}
                                  </div>
                                </div>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => setSelectedQuestions(selectedQuestions.filter(sq => sq.id !== q.id))}
                                  className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                >
                                  <X className="w-4 h-4" />
                                </Button>
                              </div>

                              {q.options && (
                                <div className="space-y-2 mt-3 pl-4">
                                  {JSON.parse(q.options).map((option, optIdx) => {
                                    const isCorrect = q.allow_multiple_answers 
                                      ? q.correct_answers?.includes(option)
                                      : option === q.correct_answer;
                                    
                                    return (
                                      <div
                                        key={optIdx}
                                        className={`p-2 rounded-lg text-sm ${
                                          isCorrect
                                            ? 'bg-green-50 border border-green-200 text-green-900'
                                            : 'bg-gray-50 text-gray-700'
                                        }`}
                                      >
                                        <span className="font-medium mr-2">{String.fromCharCode(65 + optIdx)}.</span>
                                        {option}
                                        {isCorrect && <span className="ml-2">✓</span>}
                                      </div>
                                    );
                                  })}
                                </div>
                              )}

                              {q.image_url && (
                                <div className="mt-3">
                                  <img 
                                    src={q.image_url} 
                                    alt="Question" 
                                    className="max-w-full max-h-48 rounded-lg border"
                                  />
                                </div>
                              )}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>
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