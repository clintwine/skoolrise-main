import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { X, Image as ImageIcon, Check } from 'lucide-react';

export default function CreateQuestionDialog({ open, onOpenChange, question, onSubmit }) {
  const [formData, setFormData] = useState({
    question_text: '',
    question_type: 'Multiple Choice',
    subject: '',
    topic: '',
    class_level: '',
    difficulty: 'Medium',
    options: '[]',
    correct_answer: '',
    correct_answers: [],
    allow_multiple_answers: false,
    points: 1,
    negative_marking: 0,
    explanation: '',
    tags: '',
    model_answer: '',
    image_url: '',
    status: 'Active',
  });

  const [optionsList, setOptionsList] = useState(['', '', '', '']);
  const [selectedCorrectAnswers, setSelectedCorrectAnswers] = useState([]);

  useEffect(() => {
    if (question) {
      setFormData(question);
      setOptionsList(question.options ? JSON.parse(question.options) : ['', '', '', '']);
      setSelectedCorrectAnswers(question.correct_answers || []);
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
        correct_answers: [],
        allow_multiple_answers: false,
        points: 1,
        negative_marking: 0,
        explanation: '',
        tags: '',
        model_answer: '',
        image_url: '',
        status: 'Active',
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
      setFormData({ ...formData, correct_answer: option });
    }
  };

  const isMCQ = formData.question_type === 'Multiple Choice';
  const isTrueFalse = formData.question_type === 'True/False';
  const isEssay = formData.question_type === 'Essay' || formData.question_type === 'Theory';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[95vh] overflow-y-auto bg-white">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-text">
            {question ? 'Edit Question' : 'Create Question'}
          </DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Metadata Grid */}
          <div className="grid grid-cols-3 gap-4">
            <div>
              <Label>Question Type *</Label>
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
                  <SelectItem value="Theory">Theory</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Difficulty *</Label>
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
              <Label>Points *</Label>
              <Input
                type="number"
                value={formData.points}
                onChange={(e) => setFormData({ ...formData, points: parseFloat(e.target.value) })}
                min="0"
                step="0.5"
                required
                className="mt-1"
              />
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
                className="mt-1"
              />
            </div>
            <div>
              <Label>Topic</Label>
              <Input
                value={formData.topic}
                onChange={(e) => setFormData({ ...formData, topic: e.target.value })}
                placeholder="e.g., Algebra"
                className="mt-1"
              />
            </div>
            <div>
              <Label>Class Level</Label>
              <Input
                value={formData.class_level}
                onChange={(e) => setFormData({ ...formData, class_level: e.target.value })}
                placeholder="e.g., 10"
                className="mt-1"
              />
            </div>
          </div>

          {/* Question Text */}
          <div>
            <Label>Question Text *</Label>
            <Textarea
              value={formData.question_text}
              onChange={(e) => setFormData({ ...formData, question_text: e.target.value })}
              rows={3}
              required
              className="mt-1"
            />
          </div>

          {/* Image Support */}
          <div>
            <Label className="flex items-center gap-2">
              <ImageIcon className="w-4 h-4" />
              Image URL (optional)
            </Label>
            <Input
              type="url"
              value={formData.image_url}
              onChange={(e) => setFormData({ ...formData, image_url: e.target.value })}
              placeholder="https://example.com/image.png"
              className="mt-1"
            />
            {formData.image_url && (
              <div className="mt-2 border rounded-lg p-2">
                <img 
                  src={formData.image_url} 
                  alt="Question preview" 
                  className="max-w-full max-h-64 rounded-lg"
                  onError={(e) => e.target.style.display = 'none'}
                />
              </div>
            )}
          </div>

          {/* Multiple Choice Options */}
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
                  <Label className="text-sm">Allow multiple correct answers</Label>
                </div>
              </div>
              
              {formData.allow_multiple_answers && (
                <div className="bg-blue-50 p-3 rounded-lg border border-blue-200">
                  <p className="text-sm text-blue-800">
                    💡 Student hint: "Please select {selectedCorrectAnswers.length || '[n]'} answer(s)"
                  </p>
                </div>
              )}

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
                      
                      // Update selected answers if this option was selected
                      if (selectedCorrectAnswers.includes(option)) {
                        setSelectedCorrectAnswers(prev => 
                          prev.map(a => a === option ? e.target.value : a)
                        );
                      }
                    }}
                    placeholder={`Option ${String.fromCharCode(65 + idx)}`}
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
                      <X className="w-4 h-4" />
                    </Button>
                  )}
                </div>
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

          {/* True/False Options */}
          {isTrueFalse && (
            <div className="space-y-3">
              <Label>Select Correct Answer</Label>
              <div className="grid grid-cols-2 gap-4">
                <button
                  type="button"
                  onClick={() => {
                    setFormData({ ...formData, correct_answer: 'True' });
                    setSelectedCorrectAnswers(['True']);
                  }}
                  className={`p-6 rounded-xl border-2 transition-all ${
                    formData.correct_answer === 'True'
                      ? 'border-green-500 bg-green-50'
                      : 'border-gray-200 hover:border-green-300'
                  }`}
                >
                  <div className="text-center">
                    <div className={`text-4xl mb-2 ${formData.correct_answer === 'True' ? 'text-green-600' : 'text-gray-400'}`}>
                      ✓
                    </div>
                    <p className="text-lg font-semibold">True</p>
                  </div>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setFormData({ ...formData, correct_answer: 'False' });
                    setSelectedCorrectAnswers(['False']);
                  }}
                  className={`p-6 rounded-xl border-2 transition-all ${
                    formData.correct_answer === 'False'
                      ? 'border-red-500 bg-red-50'
                      : 'border-gray-200 hover:border-red-300'
                  }`}
                >
                  <div className="text-center">
                    <div className={`text-4xl mb-2 ${formData.correct_answer === 'False' ? 'text-red-600' : 'text-gray-400'}`}>
                      ✗
                    </div>
                    <p className="text-lg font-semibold">False</p>
                  </div>
                </button>
              </div>
            </div>
          )}

          {/* Correct Answer for other types */}
          {!isMCQ && !isTrueFalse && (
            <div>
              <Label>Correct Answer / Marking Scheme *</Label>
              <Textarea
                value={formData.correct_answer}
                onChange={(e) => setFormData({ ...formData, correct_answer: e.target.value })}
                placeholder="Enter correct answer or marking scheme"
                rows={2}
                required
                className="mt-1"
              />
            </div>
          )}

          {/* Model Answer for Essays */}
          {isEssay && (
            <div>
              <Label>Model Answer / Keywords (for auto-grading)</Label>
              <Textarea
                value={formData.model_answer}
                onChange={(e) => setFormData({ ...formData, model_answer: e.target.value })}
                rows={4}
                placeholder="Provide a model answer or key points for future AI grading support"
                className="mt-1"
              />
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Explanation</Label>
              <Textarea
                value={formData.explanation}
                onChange={(e) => setFormData({ ...formData, explanation: e.target.value })}
                rows={2}
                placeholder="Explanation for the answer"
                className="mt-1"
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
                className="mt-1"
              />
            </div>
          </div>

          {/* Tags */}
          <div>
            <Label>Tags (comma-separated)</Label>
            <Input
              value={formData.tags}
              onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
              placeholder="e.g., algebra, quadratic, equations"
              className="mt-1"
            />
            {formData.tags && (
              <div className="flex gap-2 mt-2 flex-wrap">
                {formData.tags.split(',').map((tag, idx) => (
                  <Badge key={idx} variant="outline">{tag.trim()}</Badge>
                ))}
              </div>
            )}
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" className="bg-accent hover:bg-accent-hover text-white">
              {question ? 'Update Question' : 'Create Question'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}