import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { X, Trash2, Plus, Check } from 'lucide-react';

export default function CreateQuestionDialog({ open, onOpenChange, question, onSubmit }) {
  const [formData, setFormData] = useState({
    question_text: '',
    question_type: 'Multiple Choice',
    subject: '',
    topic: '',
    class_level: '',
    difficulty: 'Easy',
    points: 1,
    explanation: '',
    tags: '',
    image_url: '',
    allow_multiple_answers: false,
  });

  const [optionsList, setOptionsList] = useState(['', '', '', '']);
  const [selectedCorrectAnswers, setSelectedCorrectAnswers] = useState([]);

  useEffect(() => {
    if (question) {
      setFormData(question);
      setOptionsList(question.options ? JSON.parse(question.options) : ['', '', '', '']);
      setSelectedCorrectAnswers(question.correct_answers || (question.correct_answer ? [question.correct_answer] : []));
    } else {
      setFormData({
        question_text: '',
        question_type: 'Multiple Choice',
        subject: '',
        topic: '',
        class_level: '',
        difficulty: 'Easy',
        points: 1,
        explanation: '',
        tags: '',
        image_url: '',
        allow_multiple_answers: false,
      });
      setOptionsList(['', '', '', '']);
      setSelectedCorrectAnswers([]);
    }
  }, [question, open]);

  const handleSubmit = (e) => {
    e.preventDefault();
    const submitData = {
      ...formData,
      options: JSON.stringify(optionsList.filter(o => o.trim())),
      correct_answer: selectedCorrectAnswers[0] || '',
      correct_answers: selectedCorrectAnswers,
    };
    onSubmit(submitData);
  };

  const handleCorrectAnswerToggle = (option) => {
    if (formData.allow_multiple_answers) {
      setSelectedCorrectAnswers(prev => 
        prev.includes(option) ? prev.filter(a => a !== option) : [...prev, option]
      );
    } else {
      setSelectedCorrectAnswers([option]);
    }
  };

  const isMCQ = formData.question_type === 'Multiple Choice';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto bg-white">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold">
            {question ? 'Edit Question' : 'Create New Question'}
          </DialogTitle>
          <p className="text-sm text-gray-500">Add a new question to the bank/exam.</p>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          {/* Metadata Grid */}
          <div className="grid grid-cols-3 gap-4">
            <div>
              <Label>Question Type</Label>
              <Select 
                value={formData.question_type} 
                onValueChange={(value) => setFormData({ ...formData, question_type: value })}
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
              <Label>Difficulty</Label>
              <Select 
                value={formData.difficulty} 
                onValueChange={(value) => setFormData({ ...formData, difficulty: value })}
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
            <div>
              <Label>Points</Label>
              <Input
                type="number"
                value={formData.points}
                onChange={(e) => setFormData({ ...formData, points: parseFloat(e.target.value) })}
                min="1"
                step="1"
                className="mt-1"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Subject (Optional)</Label>
              <Input
                value={formData.subject}
                onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                placeholder="e.g. Math"
                className="mt-1"
              />
            </div>
            <div>
              <Label>Topic (Optional)</Label>
              <Input
                value={formData.topic}
                onChange={(e) => setFormData({ ...formData, topic: e.target.value })}
                placeholder="e.g. Algebra"
                className="mt-1"
              />
            </div>
          </div>

          {/* Question Text */}
          <div>
            <Label>Question Text</Label>
            <Textarea
              value={formData.question_text}
              onChange={(e) => setFormData({ ...formData, question_text: e.target.value })}
              placeholder="Enter your question here..."
              rows={4}
              required
              className="mt-1"
            />
          </div>

          {/* Question Image */}
          <div>
            <Label>Question Image (Optional)</Label>
            <Input
              type="url"
              value={formData.image_url}
              onChange={(e) => setFormData({ ...formData, image_url: e.target.value })}
              placeholder="https://..."
              className="mt-1"
            />
            <p className="text-xs text-gray-500 mt-1">Paste an image address.</p>
          </div>

          {/* MCQ Options */}
          {isMCQ && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label>Answer Options</Label>
                <div className="flex items-center gap-2">
                  <Switch
                    checked={formData.allow_multiple_answers}
                    onCheckedChange={(checked) => {
                      setFormData({ ...formData, allow_multiple_answers: checked });
                      if (!checked) setSelectedCorrectAnswers(selectedCorrectAnswers.slice(0, 1));
                    }}
                  />
                  <Label className="text-sm">Allow multiple answers</Label>
                </div>
              </div>

              {optionsList.map((option, idx) => (
                <div key={idx} className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleCorrectAnswerToggle(option)}
                    className={`flex-shrink-0 w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${
                      selectedCorrectAnswers.includes(option)
                        ? 'bg-green-500 border-green-500'
                        : 'border-gray-300'
                    }`}
                  >
                    {selectedCorrectAnswers.includes(option) && (
                      <Check className="w-4 h-4 text-white" />
                    )}
                  </button>
                  <Input
                    value={option}
                    onChange={(e) => {
                      const newOptions = [...optionsList];
                      newOptions[idx] = e.target.value;
                      setOptionsList(newOptions);
                      
                      if (selectedCorrectAnswers.includes(option)) {
                        setSelectedCorrectAnswers(prev => 
                          prev.map(a => a === option ? e.target.value : a)
                        );
                      }
                    }}
                    placeholder={`Option ${idx + 1}`}
                    className="flex-1"
                  />
                  {optionsList.length > 2 && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setOptionsList(optionsList.filter((_, i) => i !== idx));
                        setSelectedCorrectAnswers(selectedCorrectAnswers.filter(a => a !== option));
                      }}
                    >
                      <Trash2 className="w-4 h-4 text-gray-400" />
                    </Button>
                  )}
                </div>
              ))}
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setOptionsList([...optionsList, ''])}
                className="w-full"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Option
              </Button>
            </div>
          )}

          {/* Tags */}
          <div>
            <Label>Tags</Label>
            <Input
              value={formData.tags}
              onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
              placeholder="e.g. Algebra, Week 1, Hard"
              className="mt-1"
            />
          </div>

          {/* Explanation */}
          <div>
            <Label>Explanation (Optional)</Label>
            <Textarea
              value={formData.explanation}
              onChange={(e) => setFormData({ ...formData, explanation: e.target.value })}
              placeholder="Why is it correct?"
              rows={3}
              className="mt-1"
            />
          </div>

          {/* Auto-save indicator */}
          <div className="flex items-center gap-2 text-sm text-green-600">
            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
            <span>Auto-saved to draft</span>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" className="bg-gray-900 hover:bg-gray-800 text-white">
              Add Question
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}