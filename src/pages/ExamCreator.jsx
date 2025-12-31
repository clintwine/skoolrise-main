import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { FileText, Plus, Settings, Save, Eye } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '../utils';

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
  const queryClient = useQueryClient();

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
    queryKey: ['teacher-classes', teacherProfile?.id],
    queryFn: async () => {
      if (!teacherProfile?.id) return [];
      return await base44.entities.Class.filter({ teacher_id: teacherProfile.id });
    },
    enabled: !!teacherProfile?.id,
  });

  const { data: sessions = [] } = useQuery({
    queryKey: ['sessions'],
    queryFn: () => base44.entities.AcademicSession.list(),
  });

  const { data: terms = [] } = useQuery({
    queryKey: ['terms'],
    queryFn: () => base44.entities.Term.list(),
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

      // Create exam questions
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
    onSuccess: (exam) => {
      queryClient.invalidateQueries({ queryKey: ['exams'] });
      alert('Exam created successfully!');
      navigate(createPageUrl(`ExamManagement`));
    },
  });

  const handleAddQuestion = (question) => {
    if (!selectedQuestions.find(q => q.id === question.id)) {
      setSelectedQuestions([...selectedQuestions, question]);
    }
  };

  const handleRemoveQuestion = (questionId) => {
    setSelectedQuestions(selectedQuestions.filter(q => q.id !== questionId));
  };

  const handleSaveExam = () => {
    if (!examData.title || !examData.class_id || !examData.subject) {
      alert('Please fill in required fields');
      return;
    }
    if (selectedQuestions.length === 0) {
      alert('Please add at least one question');
      return;
    }
    createExamMutation.mutate(examData);
  };

  const filteredQuestions = questionBank.filter(q => 
    examData.subject ? q.subject === examData.subject : true
  );

  const totalPoints = selectedQuestions.reduce((sum, q) => sum + q.points, 0);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Exam Creator</h1>
          <p className="text-gray-600 mt-1">Create and configure exams with advanced settings</p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" onClick={() => navigate(createPageUrl('ExamManagement'))}>
            <Eye className="w-4 h-4 mr-2" />
            View All Exams
          </Button>
          <Button
            onClick={handleSaveExam}
            disabled={createExamMutation.isPending}
            className="bg-blue-600 hover:bg-blue-700"
          >
            <Save className="w-4 h-4 mr-2" />
            {createExamMutation.isPending ? 'Saving...' : 'Save Exam'}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Exam Settings */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="bg-white shadow-md">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="w-5 h-5" />
                Exam Details
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Exam Title *</Label>
                <Input
                  value={examData.title}
                  onChange={(e) => setExamData({ ...examData, title: e.target.value })}
                  placeholder="e.g., Mathematics Mid-Term Exam"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Exam Type *</Label>
                  <Select value={examData.exam_type} onValueChange={(value) => setExamData({ ...examData, exam_type: value })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Continuous Assessment (CA)">Continuous Assessment (CA)</SelectItem>
                      <SelectItem value="Mid-Term Exam">Mid-Term Exam</SelectItem>
                      <SelectItem value="Final Exam">Final Exam</SelectItem>
                      <SelectItem value="Mock Exam">Mock Exam</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Class *</Label>
                  <Select value={examData.class_id} onValueChange={(value) => setExamData({ ...examData, class_id: value })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select class" />
                    </SelectTrigger>
                    <SelectContent>
                      {classes.map(cls => (
                        <SelectItem key={cls.id} value={cls.id}>{cls.class_name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Subject *</Label>
                  <Input
                    value={examData.subject}
                    onChange={(e) => setExamData({ ...examData, subject: e.target.value })}
                    placeholder="e.g., Mathematics"
                  />
                </div>
                <div>
                  <Label>Duration (minutes) *</Label>
                  <Input
                    type="number"
                    value={examData.duration_minutes}
                    onChange={(e) => setExamData({ ...examData, duration_minutes: parseInt(e.target.value) })}
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label>CA Weight (%)</Label>
                  <Input
                    type="number"
                    value={examData.ca_weight}
                    onChange={(e) => setExamData({ ...examData, ca_weight: parseInt(e.target.value) })}
                    min="0"
                    max="100"
                  />
                </div>
                <div>
                  <Label>Exam Weight (%)</Label>
                  <Input
                    type="number"
                    value={examData.exam_weight}
                    onChange={(e) => setExamData({ ...examData, exam_weight: parseInt(e.target.value) })}
                    min="0"
                    max="100"
                  />
                </div>
                <div>
                  <Label>Passing Score (%)</Label>
                  <Input
                    type="number"
                    value={examData.passing_score}
                    onChange={(e) => setExamData({ ...examData, passing_score: parseInt(e.target.value) })}
                    min="0"
                    max="100"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Start Date & Time</Label>
                  <Input
                    type="datetime-local"
                    value={examData.start_date}
                    onChange={(e) => setExamData({ ...examData, start_date: e.target.value })}
                  />
                </div>
                <div>
                  <Label>End Date & Time</Label>
                  <Input
                    type="datetime-local"
                    value={examData.end_date}
                    onChange={(e) => setExamData({ ...examData, end_date: e.target.value })}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white shadow-md">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="w-5 h-5" />
                Exam Settings
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between">
                <Label>Shuffle Questions</Label>
                <input
                  type="checkbox"
                  checked={examData.shuffle_questions}
                  onChange={(e) => setExamData({ ...examData, shuffle_questions: e.target.checked })}
                  className="w-4 h-4"
                />
              </div>
              <div className="flex items-center justify-between">
                <Label>Shuffle Answer Options</Label>
                <input
                  type="checkbox"
                  checked={examData.shuffle_options}
                  onChange={(e) => setExamData({ ...examData, shuffle_options: e.target.checked })}
                  className="w-4 h-4"
                />
              </div>
              <div className="flex items-center justify-between">
                <Label>Enable Proctoring (Webcam)</Label>
                <input
                  type="checkbox"
                  checked={examData.enable_proctoring}
                  onChange={(e) => setExamData({ ...examData, enable_proctoring: e.target.checked })}
                  className="w-4 h-4"
                />
              </div>
              <div className="flex items-center justify-between">
                <Label>Fullscreen Mode</Label>
                <input
                  type="checkbox"
                  checked={examData.fullscreen_mode}
                  onChange={(e) => setExamData({ ...examData, fullscreen_mode: e.target.checked })}
                  className="w-4 h-4"
                />
              </div>
              <div className="flex items-center justify-between">
                <Label>Disable Copy/Paste</Label>
                <input
                  type="checkbox"
                  checked={examData.disable_copy_paste}
                  onChange={(e) => setExamData({ ...examData, disable_copy_paste: e.target.checked })}
                  className="w-4 h-4"
                />
              </div>
              <div className="flex items-center justify-between">
                <Label>Allow Review Before Submit</Label>
                <input
                  type="checkbox"
                  checked={examData.allow_review}
                  onChange={(e) => setExamData({ ...examData, allow_review: e.target.checked })}
                  className="w-4 h-4"
                />
              </div>
              <div className="flex items-center justify-between">
                <Label>Show Results Immediately</Label>
                <input
                  type="checkbox"
                  checked={examData.show_results}
                  onChange={(e) => setExamData({ ...examData, show_results: e.target.checked })}
                  className="w-4 h-4"
                />
              </div>
              <div className="flex items-center justify-between">
                <Label>Include in Term Broadsheet</Label>
                <input
                  type="checkbox"
                  checked={examData.include_in_broadsheet}
                  onChange={(e) => setExamData({ ...examData, include_in_broadsheet: e.target.checked })}
                  className="w-4 h-4"
                />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Question Selection */}
        <div className="space-y-6">
          <Card className="bg-white shadow-md">
            <CardHeader>
              <CardTitle>Selected Questions ({selectedQuestions.length})</CardTitle>
              <p className="text-sm text-gray-600">Total Points: {totalPoints}</p>
            </CardHeader>
            <CardContent className="max-h-[400px] overflow-y-auto space-y-2">
              {selectedQuestions.map((q, idx) => (
                <div key={q.id} className="p-3 border rounded-lg">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <p className="text-sm font-medium">{idx + 1}. {q.question_text.substring(0, 60)}...</p>
                      <div className="flex gap-2 mt-1">
                        <Badge className="text-xs">{q.question_type}</Badge>
                        <Badge className="text-xs bg-blue-100 text-blue-800">{q.points} pts</Badge>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRemoveQuestion(q.id)}
                      className="text-red-600"
                    >
                      ×
                    </Button>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card className="bg-white shadow-md">
            <CardHeader>
              <CardTitle>Question Bank</CardTitle>
            </CardHeader>
            <CardContent className="max-h-[400px] overflow-y-auto space-y-2">
              {filteredQuestions.filter(q => !selectedQuestions.find(sq => sq.id === q.id)).map((q) => (
                <div key={q.id} className="p-3 border rounded-lg hover:bg-gray-50">
                  <p className="text-sm mb-2">{q.question_text.substring(0, 80)}...</p>
                  <div className="flex items-center justify-between">
                    <div className="flex gap-2">
                      <Badge className="text-xs">{q.difficulty}</Badge>
                      <Badge className="text-xs">{q.points} pts</Badge>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleAddQuestion(q)}
                    >
                      <Plus className="w-3 h-3" />
                    </Button>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}