import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Brain, Loader, CheckCircle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

export default function AIGradingAssistant() {
  const [selectedAssignment, setSelectedAssignment] = useState('');
  const [rubric, setRubric] = useState('');
  const [analyzing, setAnalyzing] = useState(false);
  const [suggestions, setSuggestions] = useState([]);
  const queryClient = useQueryClient();

  const { data: assignments = [] } = useQuery({
    queryKey: ['assignments'],
    queryFn: () => base44.entities.Assignment.list(),
  });

  const { data: submissions = [] } = useQuery({
    queryKey: ['submissions', selectedAssignment],
    queryFn: async () => {
      const allSubmissions = await base44.entities.Submission.list();
      return selectedAssignment ? allSubmissions.filter(s => s.assignment_id === selectedAssignment && s.status === 'Submitted') : [];
    },
    enabled: !!selectedAssignment,
  });

  const applyGradeMutation = useMutation({
    mutationFn: ({ submissionId, grade, feedback }) => 
      base44.entities.Submission.update(submissionId, { grade, feedback, status: 'Graded' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['submissions'] });
    },
  });

  const handleAnalyze = async () => {
    if (!selectedAssignment || !rubric) {
      alert('Please select an assignment and provide a rubric');
      return;
    }

    setAnalyzing(true);
    const newSuggestions = [];

    for (const submission of submissions) {
      try {
        const response = await base44.integrations.Core.InvokeLLM({
          prompt: `You are an expert grading assistant. Based on the following rubric and student submission, suggest a grade and provide detailed feedback.

Rubric:
${rubric}

Student Submission:
${submission.content || 'No content provided'}

Provide your response as a JSON object with:
- suggested_grade (number): The grade you suggest
- feedback (string): Detailed, constructive feedback explaining the grade
- strengths (array of strings): Key strengths in the submission
- improvements (array of strings): Areas for improvement`,
          response_json_schema: {
            type: 'object',
            properties: {
              suggested_grade: { type: 'number' },
              feedback: { type: 'string' },
              strengths: { type: 'array', items: { type: 'string' } },
              improvements: { type: 'array', items: { type: 'string' } }
            }
          }
        });

        newSuggestions.push({
          submissionId: submission.id,
          studentName: submission.student_name,
          ...response
        });
      } catch (error) {
        console.error('Error analyzing submission:', error);
      }
    }

    setSuggestions(newSuggestions);
    setAnalyzing(false);
  };

  const handleApplyGrade = (suggestion) => {
    applyGradeMutation.mutate({
      submissionId: suggestion.submissionId,
      grade: suggestion.suggested_grade,
      feedback: suggestion.feedback
    });
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
          <Brain className="w-8 h-8 text-purple-600" />
          AI Grading Assistant
        </h1>
        <p className="text-gray-600 mt-1">Get intelligent grading suggestions based on your rubric</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Setup Grading Parameters</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Select Assignment</label>
            <Select value={selectedAssignment} onValueChange={setSelectedAssignment}>
              <SelectTrigger>
                <SelectValue placeholder="Choose an assignment" />
              </SelectTrigger>
              <SelectContent>
                {assignments.map((assignment) => (
                  <SelectItem key={assignment.id} value={assignment.id}>
                    {assignment.title} - {assignment.class_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Grading Rubric</label>
            <Textarea
              value={rubric}
              onChange={(e) => setRubric(e.target.value)}
              rows={6}
              placeholder="Enter your grading rubric here... e.g.,&#10;&#10;Content Quality (40 points):&#10;- Demonstrates understanding of key concepts&#10;- Provides relevant examples&#10;&#10;Organization (30 points):&#10;- Clear structure and flow&#10;- Proper formatting&#10;&#10;Accuracy (30 points):&#10;- Factually correct information&#10;- Proper citations"
            />
          </div>

          <Button 
            onClick={handleAnalyze}
            disabled={analyzing || !selectedAssignment || !rubric}
            className="w-full bg-purple-600 hover:bg-purple-700"
          >
            {analyzing ? (
              <>
                <Loader className="w-5 h-5 mr-2 animate-spin" />
                Analyzing Submissions...
              </>
            ) : (
              <>
                <Brain className="w-5 h-5 mr-2" />
                Analyze {submissions.length} Submissions
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {suggestions.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-2xl font-bold text-gray-900">AI Grading Suggestions</h2>
          {suggestions.map((suggestion) => (
            <Card key={suggestion.submissionId}>
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle>{suggestion.studentName}</CardTitle>
                    <Badge className="mt-2 bg-purple-100 text-purple-800">
                      Suggested Grade: {suggestion.suggested_grade}
                    </Badge>
                  </div>
                  <Button
                    onClick={() => handleApplyGrade(suggestion)}
                    size="sm"
                    className="bg-green-600 hover:bg-green-700"
                  >
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Apply Grade
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h3 className="font-semibold text-gray-900 mb-2">Feedback:</h3>
                  <p className="text-gray-700 bg-gray-50 p-3 rounded-lg">{suggestion.feedback}</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <h3 className="font-semibold text-green-700 mb-2">Strengths:</h3>
                    <ul className="space-y-1">
                      {suggestion.strengths?.map((strength, idx) => (
                        <li key={idx} className="text-sm text-gray-700">✓ {strength}</li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <h3 className="font-semibold text-orange-700 mb-2">Areas for Improvement:</h3>
                    <ul className="space-y-1">
                      {suggestion.improvements?.map((improvement, idx) => (
                        <li key={idx} className="text-sm text-gray-700">• {improvement}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}