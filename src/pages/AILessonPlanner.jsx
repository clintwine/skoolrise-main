import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Brain, Loader, Download, Calendar } from 'lucide-react';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';

export default function AILessonPlanner() {
  const [generating, setGenerating] = useState(false);
  const [lessonPlan, setLessonPlan] = useState(null);
  const [formData, setFormData] = useState({
    subject: '',
    topic: '',
    grade_level: '',
    duration: '',
    learning_objectives: '',
    curriculum_standards: ''
  });

  const { data: subjects = [] } = useQuery({
    queryKey: ['subjects'],
    queryFn: () => base44.entities.Subject.filter({ status: 'Active' }),
  });

  const { data: classArms = [] } = useQuery({
    queryKey: ['class-arms'],
    queryFn: () => base44.entities.ClassArm.list(),
  });

  const uniqueGradeLevels = [...new Set(classArms.map(c => c.grade_level))].sort();

  const handleGenerate = async () => {
    if (!formData.subject || !formData.topic) {
      toast.error('Please fill in at least subject and topic');
      return;
    }

    setGenerating(true);
    try {
      const response = await base44.integrations.Core.InvokeLLM({
        prompt: `You are an expert educator and lesson planning specialist. Create a comprehensive lesson plan based on the following information:

Subject: ${formData.subject}
Topic: ${formData.topic}
Grade Level: ${formData.grade_level || 'Not specified'}
Duration: ${formData.duration || 'Not specified'}
Learning Objectives: ${formData.learning_objectives || 'Not specified'}
Curriculum Standards: ${formData.curriculum_standards || 'Not specified'}

Please create a detailed lesson plan that includes:
1. Title and overview
2. Learning objectives (clear, measurable goals)
3. Materials needed
4. Lesson structure (warm-up, main activities, closure)
5. Instructional strategies
6. Assessment methods
7. Differentiation strategies (for various learning levels)
8. Extension activities
9. Homework/follow-up activities

Format your response as a structured JSON object.`,
        response_json_schema: {
          type: 'object',
          properties: {
            title: { type: 'string' },
            overview: { type: 'string' },
            learning_objectives: { type: 'array', items: { type: 'string' } },
            materials: { type: 'array', items: { type: 'string' } },
            warm_up: { type: 'string' },
            main_activities: { type: 'array', items: { type: 'string' } },
            closure: { type: 'string' },
            instructional_strategies: { type: 'array', items: { type: 'string' } },
            assessment_methods: { type: 'array', items: { type: 'string' } },
            differentiation: { type: 'array', items: { type: 'string' } },
            extension_activities: { type: 'array', items: { type: 'string' } },
            homework: { type: 'string' }
          }
        }
      });

      setLessonPlan(response);
    } catch (error) {
      toast.error('Error generating lesson plan: ' + error.message);
    } finally {
      setGenerating(false);
    }
  };

  const handleDownload = () => {
    if (!lessonPlan) return;

    const content = `
LESSON PLAN
===========

Title: ${lessonPlan.title}
Subject: ${formData.subject}
Topic: ${formData.topic}
Grade Level: ${formData.grade_level}
Duration: ${formData.duration}

OVERVIEW
--------
${lessonPlan.overview}

LEARNING OBJECTIVES
-------------------
${lessonPlan.learning_objectives?.map((obj, idx) => `${idx + 1}. ${obj}`).join('\n')}

MATERIALS NEEDED
----------------
${lessonPlan.materials?.map(mat => `• ${mat}`).join('\n')}

LESSON STRUCTURE
----------------

Warm-Up:
${lessonPlan.warm_up}

Main Activities:
${lessonPlan.main_activities?.map((act, idx) => `${idx + 1}. ${act}`).join('\n')}

Closure:
${lessonPlan.closure}

INSTRUCTIONAL STRATEGIES
------------------------
${lessonPlan.instructional_strategies?.map(strat => `• ${strat}`).join('\n')}

ASSESSMENT METHODS
------------------
${lessonPlan.assessment_methods?.map(method => `• ${method}`).join('\n')}

DIFFERENTIATION
---------------
${lessonPlan.differentiation?.map(diff => `• ${diff}`).join('\n')}

EXTENSION ACTIVITIES
--------------------
${lessonPlan.extension_activities?.map(ext => `• ${ext}`).join('\n')}

HOMEWORK
--------
${lessonPlan.homework}
    `;

    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `lesson-plan-${formData.subject}-${formData.topic}.txt`;
    a.click();
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
          <Calendar className="w-8 h-8 text-indigo-600" />
          AI Lesson Planner
        </h1>
        <p className="text-gray-600 mt-1">Generate comprehensive lesson plans based on curriculum requirements</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Lesson Plan Parameters</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label>Subject *</Label>
              <Select value={formData.subject} onValueChange={(v) => setFormData({ ...formData, subject: v })}>
                <SelectTrigger>
                  <SelectValue placeholder="Select subject" />
                </SelectTrigger>
                <SelectContent>
                  {subjects.map((subject) => (
                    <SelectItem key={subject.id} value={subject.subject_name}>
                      {subject.subject_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Topic *</Label>
              <Input
                value={formData.topic}
                onChange={(e) => setFormData({ ...formData, topic: e.target.value })}
                placeholder="e.g., Fractions, Photosynthesis"
              />
            </div>
            <div>
              <Label>Grade Level</Label>
              <Select value={formData.grade_level} onValueChange={(v) => setFormData({ ...formData, grade_level: v })}>
                <SelectTrigger>
                  <SelectValue placeholder="Select grade level" />
                </SelectTrigger>
                <SelectContent>
                  {uniqueGradeLevels.map((grade) => (
                    <SelectItem key={grade} value={grade}>
                      {grade}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Duration</Label>
              <Input
                value={formData.duration}
                onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
                placeholder="e.g., 45 minutes, 1 hour"
              />
            </div>
          </div>

          <div>
            <Label>Learning Objectives (Optional)</Label>
            <Textarea
              value={formData.learning_objectives}
              onChange={(e) => setFormData({ ...formData, learning_objectives: e.target.value })}
              rows={3}
              placeholder="What should students learn from this lesson?"
            />
          </div>

          <div>
            <Label>Curriculum Standards (Optional)</Label>
            <Textarea
              value={formData.curriculum_standards}
              onChange={(e) => setFormData({ ...formData, curriculum_standards: e.target.value })}
              rows={2}
              placeholder="Any specific curriculum standards to address"
            />
          </div>

          <Button
            onClick={handleGenerate}
            disabled={generating}
            className="w-full bg-indigo-600 hover:bg-indigo-700"
          >
            {generating ? (
              <>
                <Loader className="w-5 h-5 mr-2 animate-spin" />
                Generating Lesson Plan...
              </>
            ) : (
              <>
                <Brain className="w-5 h-5 mr-2" />
                Generate Lesson Plan
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {lessonPlan && (
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle>Generated Lesson Plan</CardTitle>
              <Button onClick={handleDownload} variant="outline">
                <Download className="w-4 h-4 mr-2" />
                Download
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">{lessonPlan.title}</h2>
              <p className="text-gray-700">{lessonPlan.overview}</p>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Learning Objectives</h3>
              <ul className="list-disc list-inside space-y-1">
                {lessonPlan.learning_objectives?.map((obj, idx) => (
                  <li key={idx} className="text-gray-700">{obj}</li>
                ))}
              </ul>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Materials Needed</h3>
              <ul className="list-disc list-inside space-y-1">
                {lessonPlan.materials?.map((mat, idx) => (
                  <li key={idx} className="text-gray-700">{mat}</li>
                ))}
              </ul>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Lesson Structure</h3>
              <div className="space-y-4">
                <div className="bg-blue-50 p-4 rounded-lg">
                  <h4 className="font-semibold text-blue-900 mb-2">Warm-Up</h4>
                  <p className="text-gray-700">{lessonPlan.warm_up}</p>
                </div>
                <div className="bg-green-50 p-4 rounded-lg">
                  <h4 className="font-semibold text-green-900 mb-2">Main Activities</h4>
                  <ol className="list-decimal list-inside space-y-2">
                    {lessonPlan.main_activities?.map((act, idx) => (
                      <li key={idx} className="text-gray-700">{act}</li>
                    ))}
                  </ol>
                </div>
                <div className="bg-purple-50 p-4 rounded-lg">
                  <h4 className="font-semibold text-purple-900 mb-2">Closure</h4>
                  <p className="text-gray-700">{lessonPlan.closure}</p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Assessment Methods</h3>
                <ul className="list-disc list-inside space-y-1">
                  {lessonPlan.assessment_methods?.map((method, idx) => (
                    <li key={idx} className="text-gray-700">{method}</li>
                  ))}
                </ul>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Differentiation</h3>
                <ul className="list-disc list-inside space-y-1">
                  {lessonPlan.differentiation?.map((diff, idx) => (
                    <li key={idx} className="text-gray-700">{diff}</li>
                  ))}
                </ul>
              </div>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Extension Activities</h3>
              <ul className="list-disc list-inside space-y-1">
                {lessonPlan.extension_activities?.map((ext, idx) => (
                  <li key={idx} className="text-gray-700">{ext}</li>
                ))}
              </ul>
            </div>

            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Homework</h3>
              <p className="text-gray-700">{lessonPlan.homework}</p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}