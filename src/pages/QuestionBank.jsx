import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Plus, Search, Filter, BookOpen, Edit, Trash2 } from 'lucide-react';

export default function QuestionBank() {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterSubject, setFilterSubject] = useState('all');
  const [filterDifficulty, setFilterDifficulty] = useState('all');
  const queryClient = useQueryClient();

  const { data: questions = [], isLoading } = useQuery({
    queryKey: ['questions'],
    queryFn: () => base44.entities.QuestionBank.list('-created_date'),
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.QuestionBank.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['questions'] });
      setIsFormOpen(false);
      setEditingQuestion(null);
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.QuestionBank.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['questions'] });
      setIsFormOpen(false);
      setEditingQuestion(null);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.QuestionBank.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['questions'] });
    },
  });

  const handleSubmit = (data) => {
    if (editingQuestion) {
      updateMutation.mutate({ id: editingQuestion.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const filteredQuestions = questions.filter(q => {
    const matchesSearch = q.question_text?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         q.topic?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesSubject = filterSubject === 'all' || q.subject === filterSubject;
    const matchesDifficulty = filterDifficulty === 'all' || q.difficulty === filterDifficulty;
    return matchesSearch && matchesSubject && matchesDifficulty;
  });

  const subjects = [...new Set(questions.map(q => q.subject).filter(Boolean))];

  const difficultyColors = {
    Easy: 'bg-green-100 text-green-800',
    Medium: 'bg-yellow-100 text-yellow-800',
    Hard: 'bg-red-100 text-red-800',
  };

  const questionTypeColors = {
    'Multiple Choice': 'bg-blue-100 text-blue-800',
    'True/False': 'bg-purple-100 text-purple-800',
    'Essay': 'bg-orange-100 text-orange-800',
    'Theory': 'bg-pink-100 text-pink-800',
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Question Bank</h1>
          <p className="text-gray-600 mt-1">Manage questions for exams and assessments</p>
        </div>
        <Button
          onClick={() => {
            setEditingQuestion(null);
            setIsFormOpen(true);
          }}
          className="bg-blue-600 hover:bg-blue-700"
        >
          <Plus className="w-4 h-4 mr-2" />
          Add Question
        </Button>
      </div>

      <Card className="bg-white shadow-md">
        <CardContent className="p-4">
          <div className="flex gap-4 flex-wrap">
            <div className="flex-1 min-w-[200px] relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <Input
                placeholder="Search questions..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={filterSubject} onValueChange={setFilterSubject}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="All Subjects" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Subjects</SelectItem>
                {subjects.map(subject => (
                  <SelectItem key={subject} value={subject}>{subject}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={filterDifficulty} onValueChange={setFilterDifficulty}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="All Difficulty" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Difficulty</SelectItem>
                <SelectItem value="Easy">Easy</SelectItem>
                <SelectItem value="Medium">Medium</SelectItem>
                <SelectItem value="Hard">Hard</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {isLoading ? (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {filteredQuestions.map((question) => (
            <Card key={question.id} className="bg-white shadow-md hover:shadow-lg transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-3">
                      <BookOpen className="w-5 h-5 text-blue-600" />
                      <Badge className={questionTypeColors[question.question_type] || 'bg-gray-100 text-gray-800'}>
                        {question.question_type}
                      </Badge>
                      <Badge className={difficultyColors[question.difficulty]}>
                        {question.difficulty}
                      </Badge>
                      <Badge variant="outline">{question.subject}</Badge>
                      {question.topic && <Badge variant="outline" className="text-xs">{question.topic}</Badge>}
                      <span className="text-sm font-semibold text-blue-600">{question.points} pts</span>
                    </div>
                    <p className="text-gray-900 font-medium mb-2">{question.question_text}</p>
                    {question.options && (
                      <div className="text-sm text-gray-600 ml-4">
                        {JSON.parse(question.options).map((opt, idx) => (
                          <div key={idx}>• {opt}</div>
                        ))}
                      </div>
                    )}
                    {question.tags && (
                      <div className="mt-2 text-xs text-gray-500">Tags: {question.tags}</div>
                    )}
                  </div>
                  <div className="flex gap-2 ml-4">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setEditingQuestion(question);
                        setIsFormOpen(true);
                      }}
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        if (confirm('Delete this question?')) {
                          deleteMutation.mutate(question.id);
                        }
                      }}
                    >
                      <Trash2 className="w-4 h-4 text-red-600" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <QuestionFormDialog
        open={isFormOpen}
        onOpenChange={setIsFormOpen}
        question={editingQuestion}
        onSubmit={handleSubmit}
      />
    </div>
  );
}

function QuestionFormDialog({ open, onOpenChange, question, onSubmit }) {
  const [formData, setFormData] = useState(
    question || {
      question_text: '',
      question_type: 'Multiple Choice',
      subject: '',
      topic: '',
      class_level: '',
      difficulty: 'Medium',
      options: '[]',
      correct_answer: '',
      points: 1,
      negative_marking: 0,
      explanation: '',
      tags: '',
      status: 'Active',
    }
  );

  const [optionsList, setOptionsList] = useState(
    question?.options ? JSON.parse(question.options) : ['', '', '', '']
  );

  React.useEffect(() => {
    if (question) {
      setFormData(question);
      setOptionsList(question.options ? JSON.parse(question.options) : ['', '', '', '']);
    } else {
      setFormData({
        question_text: '',
        question_type: 'Multiple Choice',
        subject: '',
        topic: '',
        class_level: '',
        difficulty: 'Medium',
        options: '[]',
        correct_answer: '',
        points: 1,
        negative_marking: 0,
        explanation: '',
        tags: '',
        status: 'Active',
      });
      setOptionsList(['', '', '', '']);
    }
  }, [question, open]);

  const handleSubmit = (e) => {
    e.preventDefault();
    const submitData = {
      ...formData,
      options: JSON.stringify(optionsList.filter(o => o.trim())),
    };
    onSubmit(submitData);
  };

  const isMCQ = formData.question_type === 'Multiple Choice' || formData.question_type === 'True/False';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{question ? 'Edit Question' : 'Add Question'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Question Type *</Label>
              <Select value={formData.question_type} onValueChange={(value) => setFormData({ ...formData, question_type: value })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Multiple Choice">Multiple Choice</SelectItem>
                  <SelectItem value="True/False">True/False</SelectItem>
                  <SelectItem value="Short Answer">Short Answer</SelectItem>
                  <SelectItem value="Essay">Essay</SelectItem>
                  <SelectItem value="Theory">Theory</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Difficulty *</Label>
              <Select value={formData.difficulty} onValueChange={(value) => setFormData({ ...formData, difficulty: value })}>
                <SelectTrigger>
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

          <div className="grid grid-cols-3 gap-4">
            <div>
              <Label>Subject *</Label>
              <Input
                value={formData.subject}
                onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                placeholder="e.g., Mathematics"
                required
              />
            </div>
            <div>
              <Label>Topic</Label>
              <Input
                value={formData.topic}
                onChange={(e) => setFormData({ ...formData, topic: e.target.value })}
                placeholder="e.g., Algebra"
              />
            </div>
            <div>
              <Label>Class Level</Label>
              <Input
                value={formData.class_level}
                onChange={(e) => setFormData({ ...formData, class_level: e.target.value })}
                placeholder="e.g., 10"
              />
            </div>
          </div>

          <div>
            <Label>Question Text *</Label>
            <Textarea
              value={formData.question_text}
              onChange={(e) => setFormData({ ...formData, question_text: e.target.value })}
              rows={3}
              required
            />
          </div>

          {isMCQ && (
            <div>
              <Label>Answer Options</Label>
              {optionsList.map((option, idx) => (
                <Input
                  key={idx}
                  value={option}
                  onChange={(e) => {
                    const newOptions = [...optionsList];
                    newOptions[idx] = e.target.value;
                    setOptionsList(newOptions);
                  }}
                  placeholder={`Option ${idx + 1}`}
                  className="mb-2"
                />
              ))}
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setOptionsList([...optionsList, ''])}
              >
                Add Option
              </Button>
            </div>
          )}

          <div>
            <Label>Correct Answer *</Label>
            <Input
              value={formData.correct_answer}
              onChange={(e) => setFormData({ ...formData, correct_answer: e.target.value })}
              placeholder="Enter correct answer or marking scheme"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Points *</Label>
              <Input
                type="number"
                value={formData.points}
                onChange={(e) => setFormData({ ...formData, points: parseFloat(e.target.value) })}
                min="0"
                step="0.5"
                required
              />
            </div>
            <div>
              <Label>Negative Marking</Label>
              <Input
                type="number"
                value={formData.negative_marking}
                onChange={(e) => setFormData({ ...formData, negative_marking: parseFloat(e.target.value) })}
                min="0"
                step="0.25"
              />
            </div>
          </div>

          <div>
            <Label>Explanation</Label>
            <Textarea
              value={formData.explanation}
              onChange={(e) => setFormData({ ...formData, explanation: e.target.value })}
              rows={2}
              placeholder="Explanation for the answer"
            />
          </div>

          <div>
            <Label>Tags (comma-separated)</Label>
            <Input
              value={formData.tags}
              onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
              placeholder="e.g., algebra, quadratic, equations"
            />
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" className="bg-blue-600 hover:bg-blue-700">
              {question ? 'Update' : 'Create'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}