import React, { useState } from 'react';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { 
  FileText, Plus, Save, Eye, Sparkles, Clock, 
  Target, X, GripVertical, Search, Wand2
} from 'lucide-react';
import { motion, Reorder } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '../utils';
import { toast } from 'sonner';

export default function ExamCreator() {
  const navigate = useNavigate();
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
  });

  const [selectedQuestions, setSelectedQuestions] = useState([]);
  const [aiPrompt, setAiPrompt] = useState('');
  const [aiGenerating, setAiGenerating] = useState(false);
  const [questionBankOpen, setQuestionBankOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const queryClient = useQueryClient();

  const { data: classes = [] } = useQuery({
    queryKey: ['classes'],
    queryFn: () => base44.entities.Class.list(),
  });

  const { data: questionBank = [] } = useQuery({
    queryKey: ['questions'],
    queryFn: () => base44.entities.QuestionBank.list(),
  });

  const createExamMutation = useMutation({
    mutationFn: async (data) => {
      const selectedClass = classes.find(c => c.id === data.class_id);
      const exam = await base44.entities.Exam.create({
        ...data,
        class_name: selectedClass?.class_name,
        teacher_id: selectedClass?.teacher_id,
        total_points: selectedQuestions.reduce((sum, q) => sum + q.points, 0),
      });

      for (let i = 0; i < selectedQuestions.length; i++) {
        const q = selectedQuestions[i];
        await base44.entities.ExamQuestion.create({
          exam_id: exam.id,
          question_bank_id: q.id,
          question_text: q.question_text,
          question_type: q.question_type,
          options: q.options,
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
      toast.success('Exam created successfully!');
      navigate(createPageUrl('ExamCommandCenter'));
    },
  });

  const handleAIGenerate = async () => {
    if (!aiPrompt) {
      toast.error('Please enter a prompt');
      return;
    }

    setAiGenerating(true);
    try {
      const response = await base44.integrations.Core.InvokeLLM({
        prompt: `Generate 5 exam questions based on this prompt: "${aiPrompt}". 
        
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
        options: JSON.stringify(q.options),
        subject: examData.subject,
      }));

      setSelectedQuestions([...selectedQuestions, ...generatedQuestions]);
      toast.success(`Generated ${generatedQuestions.length} questions!`);
      setAiPrompt('');
    } catch (error) {
      toast.error('AI generation failed: ' + error.message);
    } finally {
      setAiGenerating(false);
    }
  };

  const handleSaveExam = () => {
    if (!examData.title || !examData.class_id || !examData.subject) {
      toast.error('Please fill in required fields');
      return;
    }
    if (selectedQuestions.length === 0) {
      toast.error('Please add at least one question');
      return;
    }
    createExamMutation.mutate(examData);
  };

  const totalPoints = selectedQuestions.reduce((sum, q) => sum + q.points, 0);
  const estimatedDuration = Math.ceil(selectedQuestions.length * 2);

  const filteredQuestionBank = questionBank.filter(q => 
    (examData.subject ? q.subject === examData.subject : true) &&
    (searchQuery ? q.question_text.toLowerCase().includes(searchQuery.toLowerCase()) : true) &&
    !selectedQuestions.find(sq => sq.id === q.id)
  );

  return (
    <div className="h-[calc(100vh-120px)] flex gap-6">
      {/* Left Panel - Configuration (30%) */}
      <div className="w-[30%] space-y-4 overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h1 className="text-3xl font-bold text-text">Exam Builder</h1>
          <Button
            onClick={handleSaveExam}
            disabled={createExamMutation.isPending}
            className="bg-accent hover:bg-accent-hover text-white"
          >
            <Save className="w-4 h-4 mr-2" />
            {createExamMutation.isPending ? 'Saving...' : 'Save'}
          </Button>
        </div>

        <Tabs defaultValue="details" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="details">Details</TabsTrigger>
            <TabsTrigger value="settings">Settings</TabsTrigger>
          </TabsList>

          <TabsContent value="details" className="space-y-4 mt-4">
            <Card className="bg-white rounded-xl shadow-md">
              <CardContent className="p-4 space-y-4">
                <div>
                  <Label>Exam Title *</Label>
                  <Input
                    value={examData.title}
                    onChange={(e) => setExamData({ ...examData, title: e.target.value })}
                    placeholder="e.g., Mathematics Mid-Term"
                    className="mt-1"
                  />
                </div>

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

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label>Duration (min)</Label>
                    <Input
                      type="number"
                      value={examData.duration_minutes}
                      onChange={(e) => setExamData({ ...examData, duration_minutes: parseInt(e.target.value) })}
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label>Passing (%)</Label>
                    <Input
                      type="number"
                      value={examData.passing_score}
                      onChange={(e) => setExamData({ ...examData, passing_score: parseInt(e.target.value) })}
                      className="mt-1"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
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
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="settings" className="space-y-4 mt-4">
            <Card className="bg-white rounded-xl shadow-md">
              <CardContent className="p-4 space-y-4">
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
                  <Label>Fullscreen Mode</Label>
                  <Switch
                    checked={examData.fullscreen_mode}
                    onCheckedChange={(checked) => setExamData({ ...examData, fullscreen_mode: checked })}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <Label>Disable Copy/Paste</Label>
                  <Switch
                    checked={examData.disable_copy_paste}
                    onCheckedChange={(checked) => setExamData({ ...examData, disable_copy_paste: checked })}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <Label>Show Results</Label>
                  <Switch
                    checked={examData.show_results}
                    onCheckedChange={(checked) => setExamData({ ...examData, show_results: checked })}
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Right Panel - Paper Builder (70%) */}
      <div className="flex-1 flex flex-col space-y-4 overflow-hidden">
        {/* Sticky Stats Header */}
        <Card className="bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl shadow-lg sticky top-0 z-10">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-6">
                <div>
                  <p className="text-xs opacity-90">Total Questions</p>
                  <p className="text-2xl font-bold">{selectedQuestions.length}</p>
                </div>
                <div>
                  <p className="text-xs opacity-90">Total Marks</p>
                  <p className="text-2xl font-bold">{totalPoints}</p>
                </div>
                <div>
                  <p className="text-xs opacity-90">Est. Duration</p>
                  <p className="text-2xl font-bold">{estimatedDuration} min</p>
                </div>
              </div>
              <div className="flex gap-2">
                <Sheet open={questionBankOpen} onOpenChange={setQuestionBankOpen}>
                  <SheetTrigger asChild>
                    <Button variant="secondary" className="bg-white/20 hover:bg-white/30 text-white">
                      <Plus className="w-4 h-4 mr-2" />
                      Add Question
                    </Button>
                  </SheetTrigger>
                  <SheetContent className="w-[600px] overflow-y-auto">
                    <SheetHeader>
                      <SheetTitle>Question Bank</SheetTitle>
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
                        {filteredQuestionBank.map((q) => (
                          <Card key={q.id} className="hover:bg-gray-50 cursor-pointer transition-colors">
                            <CardContent className="p-4">
                              <p className="text-sm mb-2 line-clamp-2">{q.question_text}</p>
                              <div className="flex items-center justify-between">
                                <div className="flex gap-2">
                                  <Badge variant="outline">{q.question_type}</Badge>
                                  <Badge className="bg-blue-100 text-blue-800">{q.points} pts</Badge>
                                  <Badge variant="outline">{q.difficulty}</Badge>
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
                  onClick={() => document.getElementById('ai-prompt').focus()}
                >
                  <Sparkles className="w-4 h-4 mr-2" />
                  AI Generate
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* AI Generation Section */}
        <Card className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl shadow-md border-2 border-purple-200">
          <CardContent className="p-4">
            <div className="flex gap-2">
              <Textarea
                id="ai-prompt"
                placeholder="Generate questions with AI... e.g., 'Create 5 questions on Pythagoras theorem for grade 10'"
                value={aiPrompt}
                onChange={(e) => setAiPrompt(e.target.value)}
                className="flex-1 bg-white"
                rows={2}
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
          </CardContent>
        </Card>

        {/* Visual Block Editor */}
        <div className="flex-1 overflow-y-auto space-y-3">
          {selectedQuestions.length === 0 ? (
            <Card className="bg-white rounded-xl shadow-md h-full">
              <CardContent className="flex flex-col items-center justify-center h-full text-center p-12">
                <FileText className="w-16 h-16 text-gray-400 mb-4" />
                <h3 className="text-xl font-semibold text-text mb-2">No questions yet</h3>
                <p className="text-text-secondary mb-4">Add questions from the Question Bank or generate with AI</p>
                <Button onClick={() => setQuestionBankOpen(true)} className="bg-accent hover:bg-accent-hover text-white">
                  <Plus className="w-4 h-4 mr-2" />
                  Add First Question
                </Button>
              </CardContent>
            </Card>
          ) : (
            <Reorder.Group axis="y" values={selectedQuestions} onReorder={setSelectedQuestions} className="space-y-3">
              {selectedQuestions.map((q, idx) => (
                <Reorder.Item key={q.id} value={q}>
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                  >
                    <Card className="bg-white rounded-xl shadow-md hover:shadow-lg transition-shadow cursor-move">
                      <CardContent className="p-5">
                        <div className="flex gap-3">
                          <div className="flex items-start gap-2">
                            <GripVertical className="w-5 h-5 text-gray-400 mt-1" />
                            <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                              <span className="text-sm font-bold text-blue-600">{idx + 1}</span>
                            </div>
                          </div>
                          <div className="flex-1">
                            <div className="flex items-start justify-between mb-3">
                              <div className="flex-1">
                                <p className="text-base font-medium text-text mb-2">{q.question_text}</p>
                                <div className="flex gap-2 flex-wrap">
                                  <Badge variant="outline">{q.question_type}</Badge>
                                  <Badge className="bg-blue-100 text-blue-800">{q.points} points</Badge>
                                  {q.difficulty && (
                                    <Badge variant="outline">{q.difficulty}</Badge>
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
                                {JSON.parse(q.options).map((option, optIdx) => (
                                  <div
                                    key={optIdx}
                                    className={`p-2 rounded-lg text-sm ${
                                      option === q.correct_answer
                                        ? 'bg-green-50 border border-green-200 text-green-900'
                                        : 'bg-gray-50 text-gray-700'
                                    }`}
                                  >
                                    <span className="font-medium mr-2">{String.fromCharCode(65 + optIdx)}.</span>
                                    {option}
                                  </div>
                                ))}
                              </div>
                            )}

                            {q.explanation && (
                              <div className="mt-3 p-3 bg-blue-50 rounded-lg border border-blue-100">
                                <p className="text-xs font-semibold text-blue-900 mb-1">Explanation:</p>
                                <p className="text-sm text-blue-800">{q.explanation}</p>
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
  );
}