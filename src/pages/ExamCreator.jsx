import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Progress } from '@/components/ui/progress';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { 
  FileText, Plus, Save, Eye, Sparkles, Clock, 
  Target, X, GripVertical, Search, Wand2, ChevronLeft,
  ChevronRight, Check, Edit, Trash2, List
} from 'lucide-react';
import { motion, Reorder, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '../utils';
import { toast } from 'sonner';

export default function ExamCreator() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  
  // View mode: 'setup' | 'builder' | 'review'
  const [viewMode, setViewMode] = useState('setup');
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  
  const [examData, setExamData] = useState({
    title: '',
    exam_type: 'Continuous Assessment (CA)',
    class_id: '',
    subject: '',
    duration_minutes: 60,
    ca_weight: 30,
    exam_weight: 70,
    include_in_broadsheet: true,
    start_date: '',
    end_date: '',
    shuffle_questions: false,
    shuffle_options: false,
    enable_proctoring: true,
    fullscreen_mode: true,
    disable_copy_paste: true,
    allow_review: true,
    show_results: false,
    passing_score: 40,
    status: 'Draft',
    total_questions: 10,
  });

  const [questions, setQuestions] = useState([]);
  const [currentQuestion, setCurrentQuestion] = useState({
    question_text: '',
    question_type: 'Multiple Choice',
    options: ['', '', '', ''],
    correct_answer: '',
    points: 5,
    difficulty: 'Medium',
    explanation: '',
  });
  
  const [aiPrompt, setAiPrompt] = useState('');
  const [aiGenerating, setAiGenerating] = useState(false);
  const [questionBankOpen, setQuestionBankOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const { data: classes = [] } = useQuery({
    queryKey: ['classes'],
    queryFn: () => base44.entities.Class.list(),
  });

  const { data: questionBank = [] } = useQuery({
    queryKey: ['questions'],
    queryFn: () => base44.entities.QuestionBank.list(),
  });

  // Initialize questions array when entering builder mode
  useEffect(() => {
    if (viewMode === 'builder' && questions.length === 0) {
      // Create empty question slots
      const emptyQuestions = Array.from({ length: examData.total_questions }, (_, i) => ({
        id: `q_${i}`,
        question_text: '',
        question_type: 'Multiple Choice',
        options: ['', '', '', ''],
        correct_answer: '',
        points: 5,
        difficulty: 'Medium',
        explanation: '',
        status: 'empty', // 'empty', 'draft', 'complete'
      }));
      setQuestions(emptyQuestions);
      setCurrentQuestionIndex(0);
    }
  }, [viewMode, examData.total_questions]);

  // Load current question into form when index changes
  useEffect(() => {
    if (questions[currentQuestionIndex]) {
      setCurrentQuestion({
        ...questions[currentQuestionIndex],
        options: questions[currentQuestionIndex].options || ['', '', '', ''],
      });
    }
  }, [currentQuestionIndex, questions]);

  const saveCurrentQuestion = () => {
    const isComplete = currentQuestion.question_text.trim() !== '' && 
      (currentQuestion.question_type !== 'Multiple Choice' || 
       (currentQuestion.options.some(o => o.trim() !== '') && currentQuestion.correct_answer));
    
    const updatedQuestions = [...questions];
    updatedQuestions[currentQuestionIndex] = {
      ...currentQuestion,
      id: questions[currentQuestionIndex]?.id || `q_${currentQuestionIndex}`,
      status: currentQuestion.question_text.trim() === '' ? 'empty' : (isComplete ? 'complete' : 'draft'),
    };
    setQuestions(updatedQuestions);
    return isComplete;
  };

  const handleNext = () => {
    saveCurrentQuestion();
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    }
  };

  const handlePrevious = () => {
    saveCurrentQuestion();
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1);
    }
  };

  const handleJumpToQuestion = (index) => {
    saveCurrentQuestion();
    setCurrentQuestionIndex(index);
  };

  const addMoreQuestions = (count) => {
    const newQuestions = Array.from({ length: count }, (_, i) => ({
      id: `q_${questions.length + i}`,
      question_text: '',
      question_type: 'Multiple Choice',
      options: ['', '', '', ''],
      correct_answer: '',
      points: 5,
      difficulty: 'Medium',
      explanation: '',
      status: 'empty',
    }));
    setQuestions([...questions, ...newQuestions]);
    setExamData({ ...examData, total_questions: examData.total_questions + count });
  };

  const handleOptionChange = (index, value) => {
    const newOptions = [...currentQuestion.options];
    newOptions[index] = value;
    setCurrentQuestion({ ...currentQuestion, options: newOptions });
  };

  const handleAIGenerate = async () => {
    if (!aiPrompt) {
      toast.error('Please enter a prompt');
      return;
    }

    setAiGenerating(true);
    try {
      const response = await base44.integrations.Core.InvokeLLM({
        prompt: `Generate exam questions based on this prompt: "${aiPrompt}". 
        
Return a JSON array of questions with the following structure:
[{
  "question_text": "Question text here",
  "question_type": "Multiple Choice" or "True/False" or "Essay",
  "options": ["Option A", "Option B", "Option C", "Option D"] (for MCQ),
  "correct_answer": "correct option",
  "points": 5,
  "difficulty": "Easy" or "Medium" or "Hard",
  "explanation": "Explanation of the correct answer"
}]`,
        response_json_schema: {
          type: "object",
          properties: {
            questions: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  question_text: { type: "string" },
                  question_type: { type: "string" },
                  options: { type: "array", items: { type: "string" } },
                  correct_answer: { type: "string" },
                  points: { type: "number" },
                  difficulty: { type: "string" },
                  explanation: { type: "string" }
                }
              }
            }
          }
        }
      });

      const generatedQuestions = response.questions.map((q, idx) => ({
        ...q,
        id: `ai-${Date.now()}-${idx}`,
        options: q.options || ['', '', '', ''],
        status: 'complete',
      }));

      // Fill empty slots or add new questions
      const updatedQuestions = [...questions];
      let filledCount = 0;
      
      for (let i = 0; i < updatedQuestions.length && filledCount < generatedQuestions.length; i++) {
        if (updatedQuestions[i].status === 'empty') {
          updatedQuestions[i] = { ...generatedQuestions[filledCount], id: updatedQuestions[i].id };
          filledCount++;
        }
      }
      
      // Add remaining as new questions
      if (filledCount < generatedQuestions.length) {
        const remaining = generatedQuestions.slice(filledCount).map((q, idx) => ({
          ...q,
          id: `q_${updatedQuestions.length + idx}`,
        }));
        updatedQuestions.push(...remaining);
        setExamData({ ...examData, total_questions: updatedQuestions.length });
      }
      
      setQuestions(updatedQuestions);
      toast.success(`Generated ${generatedQuestions.length} questions!`);
      setAiPrompt('');
    } catch (error) {
      toast.error('AI generation failed: ' + error.message);
    } finally {
      setAiGenerating(false);
    }
  };

  const addFromQuestionBank = (q) => {
    // Find first empty slot or add new
    const emptyIndex = questions.findIndex(question => question.status === 'empty');
    
    if (emptyIndex !== -1) {
      const updatedQuestions = [...questions];
      updatedQuestions[emptyIndex] = {
        ...q,
        id: questions[emptyIndex].id,
        options: q.options ? (typeof q.options === 'string' ? JSON.parse(q.options) : q.options) : ['', '', '', ''],
        status: 'complete',
      };
      setQuestions(updatedQuestions);
      setCurrentQuestionIndex(emptyIndex);
    } else {
      const newQuestion = {
        ...q,
        id: `q_${questions.length}`,
        options: q.options ? (typeof q.options === 'string' ? JSON.parse(q.options) : q.options) : ['', '', '', ''],
        status: 'complete',
      };
      setQuestions([...questions, newQuestion]);
      setCurrentQuestionIndex(questions.length);
      setExamData({ ...examData, total_questions: examData.total_questions + 1 });
    }
    toast.success('Question added');
  };

  const createExamMutation = useMutation({
    mutationFn: async (data) => {
      const selectedClass = classes.find(c => c.id === data.class_id);
      const validQuestions = questions.filter(q => q.status === 'complete');
      
      const exam = await base44.entities.Exam.create({
        ...data,
        class_name: selectedClass?.class_name,
        teacher_id: selectedClass?.teacher_id,
        total_points: validQuestions.reduce((sum, q) => sum + (q.points || 0), 0),
        status: 'Published',
      });

      for (let i = 0; i < validQuestions.length; i++) {
        const q = validQuestions[i];
        await base44.entities.ExamQuestion.create({
          exam_id: exam.id,
          question_bank_id: q.question_bank_id || null,
          question_text: q.question_text,
          question_type: q.question_type,
          options: Array.isArray(q.options) ? JSON.stringify(q.options) : q.options,
          correct_answer: q.correct_answer,
          points: q.points,
          negative_marking: q.negative_marking || 0,
          order: i + 1,
          explanation: q.explanation,
        });
      }

      return exam;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['exams'] });
      toast.success('Exam published successfully!');
      navigate(createPageUrl('ExamCommandCenter'));
    },
  });

  const handlePublish = () => {
    saveCurrentQuestion();
    const completeQuestions = questions.filter(q => q.status === 'complete');
    
    if (!examData.title || !examData.class_id || !examData.subject) {
      toast.error('Please fill in exam details');
      setViewMode('setup');
      return;
    }
    if (completeQuestions.length === 0) {
      toast.error('Please add at least one complete question');
      return;
    }
    createExamMutation.mutate(examData);
  };

  const totalPoints = questions.filter(q => q.status === 'complete').reduce((sum, q) => sum + (q.points || 0), 0);
  const completedCount = questions.filter(q => q.status === 'complete').length;
  const draftCount = questions.filter(q => q.status === 'draft').length;
  const progress = questions.length > 0 ? (completedCount / questions.length) * 100 : 0;

  const filteredQuestionBank = questionBank.filter(q => 
    (examData.subject ? q.subject === examData.subject : true) &&
    (searchQuery ? q.question_text.toLowerCase().includes(searchQuery.toLowerCase()) : true)
  );

  // Setup View
  if (viewMode === 'setup') {
    return (
      <div className="max-w-3xl mx-auto space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold text-gray-900">Create New Exam</h1>
        </div>

        <Card className="bg-white rounded-xl shadow-md">
          <CardHeader>
            <CardTitle>Exam Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>Exam Title *</Label>
              <Input
                value={examData.title}
                onChange={(e) => setExamData({ ...examData, title: e.target.value })}
                placeholder="e.g., Mathematics Mid-Term Exam"
                className="mt-1"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Class *</Label>
                <Select value={examData.class_id} onValueChange={(value) => setExamData({ ...examData, class_id: value })}>
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Select class" />
                  </SelectTrigger>
                  <SelectContent>
                    {classes.map(cls => (
                      <SelectItem key={cls.id} value={cls.id}>{cls.class_name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Subject *</Label>
                <Input
                  value={examData.subject}
                  onChange={(e) => setExamData({ ...examData, subject: e.target.value })}
                  placeholder="e.g., Mathematics"
                  className="mt-1"
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label>Exam Type</Label>
                <Select value={examData.exam_type} onValueChange={(value) => setExamData({ ...examData, exam_type: value })}>
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Continuous Assessment (CA)">CA</SelectItem>
                    <SelectItem value="Mid-Term Exam">Mid-Term</SelectItem>
                    <SelectItem value="Final Exam">Final</SelectItem>
                    <SelectItem value="Mock Exam">Mock</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Duration (minutes)</Label>
                <Input
                  type="number"
                  value={examData.duration_minutes}
                  onChange={(e) => setExamData({ ...examData, duration_minutes: parseInt(e.target.value) })}
                  className="mt-1"
                />
              </div>
              <div>
                <Label>Total Questions</Label>
                <Input
                  type="number"
                  value={examData.total_questions}
                  onChange={(e) => setExamData({ ...examData, total_questions: parseInt(e.target.value) || 10 })}
                  min="1"
                  className="mt-1"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Start Date</Label>
                <Input
                  type="datetime-local"
                  value={examData.start_date}
                  onChange={(e) => setExamData({ ...examData, start_date: e.target.value })}
                  className="mt-1"
                />
              </div>
              <div>
                <Label>End Date</Label>
                <Input
                  type="datetime-local"
                  value={examData.end_date}
                  onChange={(e) => setExamData({ ...examData, end_date: e.target.value })}
                  className="mt-1"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 pt-4 border-t">
              <div className="flex items-center justify-between">
                <Label>Shuffle Questions</Label>
                <Switch
                  checked={examData.shuffle_questions}
                  onCheckedChange={(checked) => setExamData({ ...examData, shuffle_questions: checked })}
                />
              </div>
              <div className="flex items-center justify-between">
                <Label>Shuffle Options</Label>
                <Switch
                  checked={examData.shuffle_options}
                  onCheckedChange={(checked) => setExamData({ ...examData, shuffle_options: checked })}
                />
              </div>
              <div className="flex items-center justify-between">
                <Label>Enable Proctoring</Label>
                <Switch
                  checked={examData.enable_proctoring}
                  onCheckedChange={(checked) => setExamData({ ...examData, enable_proctoring: checked })}
                />
              </div>
              <div className="flex items-center justify-between">
                <Label>Show Results</Label>
                <Switch
                  checked={examData.show_results}
                  onCheckedChange={(checked) => setExamData({ ...examData, show_results: checked })}
                />
              </div>
            </div>

            <div className="flex justify-end pt-4">
              <Button 
                onClick={() => {
                  if (!examData.title || !examData.class_id || !examData.subject) {
                    toast.error('Please fill in required fields');
                    return;
                  }
                  setViewMode('builder');
                }}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                Start Building Questions
                <ChevronRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Question Builder View
  if (viewMode === 'builder') {
    return (
      <div className="h-[calc(100vh-120px)] flex flex-col">
        {/* Top Stats Bar */}
        <Card className="bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl shadow-lg mb-4">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-6">
                <Button variant="ghost" onClick={() => setViewMode('setup')} className="text-white hover:bg-white/20">
                  <ChevronLeft className="w-4 h-4 mr-2" />
                  Back to Setup
                </Button>
                <div className="h-8 w-px bg-white/30" />
                <div>
                  <p className="text-xs opacity-90">Progress</p>
                  <p className="text-lg font-bold">{completedCount}/{questions.length} Complete</p>
                </div>
                <div>
                  <p className="text-xs opacity-90">Total Marks</p>
                  <p className="text-lg font-bold">{totalPoints}</p>
                </div>
              </div>
              <div className="flex gap-2">
                <Sheet open={questionBankOpen} onOpenChange={setQuestionBankOpen}>
                  <SheetTrigger asChild>
                    <Button variant="secondary" className="bg-white/20 hover:bg-white/30 text-white">
                      <Search className="w-4 h-4 mr-2" />
                      Question Bank
                    </Button>
                  </SheetTrigger>
                  <SheetContent className="w-[500px] overflow-y-auto">
                    <SheetHeader>
                      <SheetTitle>Question Bank</SheetTitle>
                    </SheetHeader>
                    <div className="mt-4 space-y-4">
                      <div className="relative">
                        <Search className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                        <Input
                          placeholder="Search questions..."
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          className="pl-10"
                        />
                      </div>
                      <div className="space-y-2">
                        {filteredQuestionBank.map((q) => (
                          <div key={q.id} className="p-3 border rounded-lg hover:bg-gray-50">
                            <p className="text-sm mb-2 line-clamp-2">{q.question_text}</p>
                            <div className="flex items-center justify-between">
                              <div className="flex gap-1">
                                <Badge variant="outline" className="text-xs">{q.question_type}</Badge>
                                <Badge className="bg-blue-100 text-blue-800 text-xs">{q.points} pts</Badge>
                              </div>
                              <Button size="sm" onClick={() => addFromQuestionBank(q)} className="bg-blue-600 hover:bg-blue-700 text-white">
                                <Plus className="w-3 h-3" />
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </SheetContent>
                </Sheet>

                <Button 
                  onClick={() => {
                    saveCurrentQuestion();
                    setViewMode('review');
                  }}
                  className="bg-white/20 hover:bg-white/30 text-white"
                >
                  <List className="w-4 h-4 mr-2" />
                  Review All
                </Button>

                <Button 
                  onClick={handlePublish}
                  disabled={createExamMutation.isPending}
                  className="bg-green-500 hover:bg-green-600 text-white"
                >
                  <Check className="w-4 h-4 mr-2" />
                  {createExamMutation.isPending ? 'Publishing...' : 'Publish Exam'}
                </Button>
              </div>
            </div>
            <Progress value={progress} className="mt-3 h-2 bg-white/20" />
          </CardContent>
        </Card>

        <div className="flex-1 flex gap-4 overflow-hidden">
          {/* Question Navigator */}
          <Card className="w-48 bg-white rounded-xl shadow-md overflow-hidden flex flex-col">
            <CardHeader className="p-3 border-b">
              <CardTitle className="text-sm">Questions</CardTitle>
            </CardHeader>
            <div className="flex-1 overflow-y-auto p-2">
              <div className="grid grid-cols-4 gap-1">
                {questions.map((q, idx) => (
                  <button
                    key={q.id}
                    onClick={() => handleJumpToQuestion(idx)}
                    className={`w-10 h-10 rounded-lg text-sm font-medium transition-all ${
                      idx === currentQuestionIndex
                        ? 'bg-blue-600 text-white'
                        : q.status === 'complete'
                        ? 'bg-green-100 text-green-800 hover:bg-green-200'
                        : q.status === 'draft'
                        ? 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    {idx + 1}
                  </button>
                ))}
              </div>
              <Button 
                variant="outline" 
                size="sm" 
                className="w-full mt-3"
                onClick={() => addMoreQuestions(5)}
              >
                <Plus className="w-3 h-3 mr-1" />
                Add 5 More
              </Button>
            </div>
          </Card>

          {/* Main Question Editor */}
          <Card className="flex-1 bg-white rounded-xl shadow-md overflow-hidden flex flex-col">
            <CardHeader className="p-4 border-b flex flex-row items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                  <span className="font-bold text-blue-600">{currentQuestionIndex + 1}</span>
                </div>
                <div>
                  <CardTitle className="text-lg">Question {currentQuestionIndex + 1}</CardTitle>
                  <p className="text-sm text-gray-500">
                    {currentQuestion.status === 'complete' ? '✓ Complete' : 
                     currentQuestion.status === 'draft' ? '● Draft' : 'Not started'}
                  </p>
                </div>
              </div>
              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  onClick={handlePrevious} 
                  disabled={currentQuestionIndex === 0}
                >
                  <ChevronLeft className="w-4 h-4" />
                  Previous
                </Button>
                <Button 
                  onClick={handleNext}
                  disabled={currentQuestionIndex === questions.length - 1}
                  className="bg-blue-600 hover:bg-blue-700 text-white"
                >
                  Next
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            </CardHeader>

            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              <div>
                <Label>Question Text *</Label>
                <Textarea
                  value={currentQuestion.question_text}
                  onChange={(e) => setCurrentQuestion({ ...currentQuestion, question_text: e.target.value })}
                  placeholder="Enter your question here..."
                  rows={3}
                  className="mt-1"
                />
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label>Question Type</Label>
                  <Select 
                    value={currentQuestion.question_type} 
                    onValueChange={(value) => setCurrentQuestion({ ...currentQuestion, question_type: value })}
                  >
                    <SelectTrigger className="mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Multiple Choice">Multiple Choice</SelectItem>
                      <SelectItem value="True/False">True/False</SelectItem>
                      <SelectItem value="Short Answer">Short Answer</SelectItem>
                      <SelectItem value="Essay">Essay</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Points</Label>
                  <Input
                    type="number"
                    value={currentQuestion.points}
                    onChange={(e) => setCurrentQuestion({ ...currentQuestion, points: parseInt(e.target.value) || 0 })}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label>Difficulty</Label>
                  <Select 
                    value={currentQuestion.difficulty} 
                    onValueChange={(value) => setCurrentQuestion({ ...currentQuestion, difficulty: value })}
                  >
                    <SelectTrigger className="mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Easy">Easy</SelectItem>
                      <SelectItem value="Medium">Medium</SelectItem>
                      <SelectItem value="Hard">Hard</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {currentQuestion.question_type === 'Multiple Choice' && (
                <div className="space-y-3">
                  <Label>Answer Options</Label>
                  {currentQuestion.options.map((option, idx) => (
                    <div key={idx} className="flex items-center gap-2">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                        option === currentQuestion.correct_answer 
                          ? 'bg-green-100 text-green-700' 
                          : 'bg-gray-100 text-gray-600'
                      }`}>
                        {String.fromCharCode(65 + idx)}
                      </div>
                      <Input
                        value={option}
                        onChange={(e) => handleOptionChange(idx, e.target.value)}
                        placeholder={`Option ${String.fromCharCode(65 + idx)}`}
                        className="flex-1"
                      />
                      <Button
                        type="button"
                        variant={option === currentQuestion.correct_answer ? "default" : "outline"}
                        size="sm"
                        onClick={() => setCurrentQuestion({ ...currentQuestion, correct_answer: option })}
                        className={option === currentQuestion.correct_answer ? "bg-green-600 hover:bg-green-700" : ""}
                      >
                        {option === currentQuestion.correct_answer ? <Check className="w-4 h-4" /> : 'Set Correct'}
                      </Button>
                    </div>
                  ))}
                </div>
              )}

              {currentQuestion.question_type === 'True/False' && (
                <div>
                  <Label>Correct Answer</Label>
                  <div className="flex gap-4 mt-2">
                    <Button
                      type="button"
                      variant={currentQuestion.correct_answer === 'True' ? 'default' : 'outline'}
                      onClick={() => setCurrentQuestion({ ...currentQuestion, correct_answer: 'True' })}
                      className={currentQuestion.correct_answer === 'True' ? 'bg-green-600 hover:bg-green-700' : ''}
                    >
                      True
                    </Button>
                    <Button
                      type="button"
                      variant={currentQuestion.correct_answer === 'False' ? 'default' : 'outline'}
                      onClick={() => setCurrentQuestion({ ...currentQuestion, correct_answer: 'False' })}
                      className={currentQuestion.correct_answer === 'False' ? 'bg-green-600 hover:bg-green-700' : ''}
                    >
                      False
                    </Button>
                  </div>
                </div>
              )}

              {(currentQuestion.question_type === 'Short Answer' || currentQuestion.question_type === 'Essay') && (
                <div>
                  <Label>Expected Answer / Marking Guide</Label>
                  <Textarea
                    value={currentQuestion.correct_answer}
                    onChange={(e) => setCurrentQuestion({ ...currentQuestion, correct_answer: e.target.value })}
                    placeholder="Enter the expected answer or marking criteria..."
                    rows={3}
                    className="mt-1"
                  />
                </div>
              )}

              <div>
                <Label>Explanation (Optional)</Label>
                <Textarea
                  value={currentQuestion.explanation}
                  onChange={(e) => setCurrentQuestion({ ...currentQuestion, explanation: e.target.value })}
                  placeholder="Explain the correct answer..."
                  rows={2}
                  className="mt-1"
                />
              </div>
            </div>

            {/* AI Generation */}
            <div className="p-4 border-t bg-gradient-to-r from-purple-50 to-pink-50">
              <div className="flex gap-2">
                <Textarea
                  placeholder="Generate questions with AI... e.g., 'Create 5 questions on Pythagoras theorem'"
                  value={aiPrompt}
                  onChange={(e) => setAiPrompt(e.target.value)}
                  className="flex-1 bg-white"
                  rows={1}
                />
                <Button
                  onClick={handleAIGenerate}
                  disabled={aiGenerating}
                  className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white"
                >
                  {aiGenerating ? (
                    <Wand2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4 mr-2" />
                      Generate
                    </>
                  )}
                </Button>
              </div>
            </div>
          </Card>
        </div>
      </div>
    );
  }

  // Review View
  if (viewMode === 'review') {
    return (
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-4">
            <Button variant="outline" onClick={() => setViewMode('builder')}>
              <ChevronLeft className="w-4 h-4 mr-2" />
              Back to Editor
            </Button>
            <h1 className="text-2xl font-bold text-gray-900">Review All Questions</h1>
          </div>
          <div className="flex gap-2">
            <Badge className="bg-green-100 text-green-800">{completedCount} Complete</Badge>
            <Badge className="bg-yellow-100 text-yellow-800">{draftCount} Draft</Badge>
            <Badge className="bg-gray-100 text-gray-800">{questions.length - completedCount - draftCount} Empty</Badge>
            <Button 
              onClick={handlePublish}
              disabled={createExamMutation.isPending}
              className="bg-green-600 hover:bg-green-700 text-white ml-4"
            >
              <Check className="w-4 h-4 mr-2" />
              Publish Exam
            </Button>
          </div>
        </div>

        <div className="space-y-3">
          {questions.map((q, idx) => (
            <Card key={q.id} className={`bg-white rounded-xl shadow-sm border-l-4 ${
              q.status === 'complete' ? 'border-l-green-500' :
              q.status === 'draft' ? 'border-l-yellow-500' : 'border-l-gray-300'
            }`}>
              <CardContent className="p-4">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center flex-shrink-0">
                    <span className="font-bold text-gray-600">{idx + 1}</span>
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-gray-900 mb-2">
                      {q.question_text || <span className="text-gray-400 italic">No question text</span>}
                    </p>
                    <div className="flex gap-2 flex-wrap">
                      <Badge variant="outline">{q.question_type}</Badge>
                      <Badge className="bg-blue-100 text-blue-800">{q.points} pts</Badge>
                      <Badge variant="outline">{q.difficulty}</Badge>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => {
                        setCurrentQuestionIndex(idx);
                        setViewMode('builder');
                      }}
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm"
                      className="text-red-600 hover:bg-red-50"
                      onClick={() => {
                        const updated = questions.filter((_, i) => i !== idx);
                        setQuestions(updated);
                      }}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }
}