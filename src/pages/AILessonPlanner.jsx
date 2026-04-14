import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Brain, Loader, Download, Calendar, Clock, BookOpen, Users, Target, Lightbulb, CheckCircle } from 'lucide-react';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import LessonPlanSummaryCards from '../components/ai/LessonPlanSummaryCards';
import LessonPlannerSuggestions from '../components/ai/LessonPlannerSuggestions';
import LessonPlannerResourcePanel from '../components/ai/LessonPlannerResourcePanel';
import { base44 } from '@/api/base44Client';

export default function AILessonPlanner() {
  const [generating, setGenerating] = useState(false);
  const [lessonPlan, setLessonPlan] = useState(null);
  const [formData, setFormData] = useState({
    subject: '',
    topic: '',
    grade_level: '',
    duration: '45 minutes',
    learning_objectives: '',
    curriculum_standards: '',
    student_prior_knowledge: '',
    available_resources: '',
    class_size: '',
    special_needs_considerations: ''
  });

  const { data: subjects = [] } = useQuery({
    queryKey: ['subjects'],
    queryFn: () => base44.entities.Subject.filter({ status: 'Active' }),
  });

  const { data: classArms = [] } = useQuery({
    queryKey: ['class-arms'],
    queryFn: () => base44.entities.ClassArm.list(),
  });

  const { data: standards = [] } = useQuery({
    queryKey: ['curriculum-standards-ai'],
    queryFn: () => base44.entities.CurriculumStandard.filter({ status: 'Active' }),
  });

  const { data: templates = [] } = useQuery({
    queryKey: ['homework-templates-ai'],
    queryFn: () => base44.entities.HomeworkTemplate.list(),
  });

  const { data: resources = [] } = useQuery({
    queryKey: ['teacher-resources-ai'],
    queryFn: () => base44.entities.TeacherResource.list('-created_date'),
  });

  const uniqueGradeLevels = [...new Set(classArms.map(c => c.grade_level))].sort();

  const suggestedStandards = standards.filter(
    (item) =>
      (!formData.subject || item.subject === formData.subject) &&
      (!formData.grade_level || item.grade_level === formData.grade_level)
  );

  const suggestedTemplates = templates.filter(
    (item) =>
      (!formData.subject || item.subject === formData.subject) &&
      (!formData.grade_level || item.grade_level === formData.grade_level)
  ).slice(0, 3);

  const suggestedResources = resources.filter(
    (item) =>
      (!formData.subject || item.subject === formData.subject) &&
      (!formData.grade_level || item.grade_level === formData.grade_level)
  );

  const handleGenerate = async () => {
    if (!formData.subject || !formData.topic || !formData.grade_level) {
      toast.error('Please fill in subject, topic, and grade level');
      return;
    }

    setGenerating(true);
    try {
      const response = await base44.integrations.Core.InvokeLLM({
        prompt: `You are an expert K-12 educator and curriculum specialist with extensive experience creating detailed, classroom-ready lesson plans. Create a COMPREHENSIVE and DETAILED lesson plan that a teacher can use directly in their classroom.

LESSON DETAILS:
- Subject: ${formData.subject}
- Topic: ${formData.topic}
- Grade Level: ${formData.grade_level}
- Duration: ${formData.duration || '45 minutes'}
- Class Size: ${formData.class_size || 'Standard class (20-30 students)'}
- Learning Objectives: ${formData.learning_objectives || 'To be determined based on topic'}
- Curriculum Standards: ${formData.curriculum_standards || 'Align with common K-12 standards'}
- Student Prior Knowledge: ${formData.student_prior_knowledge || 'Assume grade-appropriate prior knowledge'}
- Available Resources: ${formData.available_resources || 'Standard classroom materials'}
- Special Needs Considerations: ${formData.special_needs_considerations || 'Include general differentiation strategies'}

IMPORTANT INSTRUCTIONS:
1. Create SPECIFIC, ACTIONABLE content - not just outlines or generic descriptions
2. Include ACTUAL examples, problems, questions, and activities that can be used directly
3. Provide WORD-FOR-WORD scripts for key explanations the teacher should give
4. Include SPECIFIC discussion questions with expected student responses
5. Create REAL practice problems or activities with solutions/expected outcomes
6. Time each section precisely to fit the duration
7. Make everything grade-appropriate for ${formData.grade_level} students

Generate a complete, detailed lesson plan with all sections filled with specific, usable content.`,
        response_json_schema: {
          type: 'object',
          properties: {
            title: { type: 'string', description: 'Engaging lesson title' },
            overview: { type: 'string', description: 'Brief overview of what students will learn' },
            grade_level: { type: 'string' },
            duration: { type: 'string' },
            learning_objectives: { 
              type: 'array', 
              items: { type: 'string' },
              description: 'Specific, measurable learning objectives (use Bloom taxonomy verbs)'
            },
            materials: { 
              type: 'array', 
              items: { type: 'string' },
              description: 'Specific materials needed with quantities'
            },
            standards_alignment: { type: 'string', description: 'Relevant curriculum standards addressed' },
            warm_up: {
              type: 'object',
              properties: {
                duration: { type: 'string' },
                activity: { type: 'string', description: 'Detailed warm-up activity' },
                teacher_script: { type: 'string', description: 'What the teacher says to introduce the lesson' },
                expected_responses: { type: 'string', description: 'Expected student responses or engagement' }
              }
            },
            direct_instruction: {
              type: 'object',
              properties: {
                duration: { type: 'string' },
                content: { type: 'string', description: 'Detailed explanation of concepts' },
                teacher_script: { type: 'string', description: 'Key explanations teacher should give verbatim' },
                examples: { type: 'array', items: { type: 'string' }, description: 'Specific worked examples to demonstrate' },
                visual_aids: { type: 'string', description: 'What to write/draw on board or show' },
                check_understanding: { type: 'array', items: { type: 'string' }, description: 'Quick questions to check understanding' }
              }
            },
            guided_practice: {
              type: 'object',
              properties: {
                duration: { type: 'string' },
                activity: { type: 'string', description: 'Detailed guided practice activity' },
                problems_or_tasks: { type: 'array', items: { type: 'string' }, description: 'Specific problems/tasks with answers' },
                teacher_role: { type: 'string', description: 'What teacher does during this phase' },
                student_grouping: { type: 'string', description: 'Individual, pairs, or groups' }
              }
            },
            independent_practice: {
              type: 'object',
              properties: {
                duration: { type: 'string' },
                activity: { type: 'string', description: 'What students do independently' },
                problems_or_tasks: { type: 'array', items: { type: 'string' }, description: 'Specific problems/tasks for students' },
                expected_outcomes: { type: 'string', description: 'What successful completion looks like' }
              }
            },
            closure: {
              type: 'object',
              properties: {
                duration: { type: 'string' },
                activity: { type: 'string', description: 'How to wrap up the lesson' },
                discussion_questions: { type: 'array', items: { type: 'string' }, description: 'Reflection questions to ask' },
                exit_ticket: { type: 'string', description: 'Quick assessment question for end of class' }
              }
            },
            differentiation: {
              type: 'object',
              properties: {
                struggling_learners: { type: 'array', items: { type: 'string' }, description: 'Specific supports for struggling students' },
                advanced_learners: { type: 'array', items: { type: 'string' }, description: 'Extension activities for advanced students' },
                english_learners: { type: 'array', items: { type: 'string' }, description: 'Supports for ELL students' }
              }
            },
            assessment: {
              type: 'object',
              properties: {
                formative: { type: 'array', items: { type: 'string' }, description: 'How to assess during lesson' },
                summative: { type: 'string', description: 'End assessment or homework' }
              }
            },
            homework: { type: 'string', description: 'Specific homework assignment with details' },
            teacher_notes: { type: 'string', description: 'Tips, common misconceptions, and preparation notes' },
            cross_curricular_connections: { type: 'array', items: { type: 'string' }, description: 'Connections to other subjects' }
          }
        }
      });

      setLessonPlan(response);
      toast.success('Lesson plan generated successfully!');
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
============
Title: ${lessonPlan.title}
Subject: ${formData.subject}
Topic: ${formData.topic}
Grade Level: ${lessonPlan.grade_level || formData.grade_level}
Duration: ${lessonPlan.duration || formData.duration}

${lessonPlan.standards_alignment ? `STANDARDS ALIGNMENT\n------------------\n${lessonPlan.standards_alignment}\n\n` : ''}
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
================

WARM-UP (${lessonPlan.warm_up?.duration || '5 minutes'})
${'-'.repeat(40)}
Activity: ${lessonPlan.warm_up?.activity}

Teacher Script:
${lessonPlan.warm_up?.teacher_script}

Expected Responses: ${lessonPlan.warm_up?.expected_responses}

DIRECT INSTRUCTION (${lessonPlan.direct_instruction?.duration || '15 minutes'})
${'-'.repeat(40)}
${lessonPlan.direct_instruction?.content}

Teacher Script:
${lessonPlan.direct_instruction?.teacher_script}

Examples to Demonstrate:
${lessonPlan.direct_instruction?.examples?.map((ex, idx) => `${idx + 1}. ${ex}`).join('\n')}

Visual Aids: ${lessonPlan.direct_instruction?.visual_aids}

Check Understanding Questions:
${lessonPlan.direct_instruction?.check_understanding?.map((q, idx) => `${idx + 1}. ${q}`).join('\n')}

GUIDED PRACTICE (${lessonPlan.guided_practice?.duration || '10 minutes'})
${'-'.repeat(40)}
Activity: ${lessonPlan.guided_practice?.activity}
Grouping: ${lessonPlan.guided_practice?.student_grouping}
Teacher Role: ${lessonPlan.guided_practice?.teacher_role}

Problems/Tasks:
${lessonPlan.guided_practice?.problems_or_tasks?.map((p, idx) => `${idx + 1}. ${p}`).join('\n')}

INDEPENDENT PRACTICE (${lessonPlan.independent_practice?.duration || '10 minutes'})
${'-'.repeat(40)}
Activity: ${lessonPlan.independent_practice?.activity}

Problems/Tasks:
${lessonPlan.independent_practice?.problems_or_tasks?.map((p, idx) => `${idx + 1}. ${p}`).join('\n')}

Expected Outcomes: ${lessonPlan.independent_practice?.expected_outcomes}

CLOSURE (${lessonPlan.closure?.duration || '5 minutes'})
${'-'.repeat(40)}
Activity: ${lessonPlan.closure?.activity}

Discussion Questions:
${lessonPlan.closure?.discussion_questions?.map((q, idx) => `${idx + 1}. ${q}`).join('\n')}

Exit Ticket: ${lessonPlan.closure?.exit_ticket}

DIFFERENTIATION
===============
For Struggling Learners:
${lessonPlan.differentiation?.struggling_learners?.map(s => `• ${s}`).join('\n')}

For Advanced Learners:
${lessonPlan.differentiation?.advanced_learners?.map(s => `• ${s}`).join('\n')}

For English Learners:
${lessonPlan.differentiation?.english_learners?.map(s => `• ${s}`).join('\n')}

ASSESSMENT
==========
Formative:
${lessonPlan.assessment?.formative?.map(a => `• ${a}`).join('\n')}

Summative: ${lessonPlan.assessment?.summative}

HOMEWORK
--------
${lessonPlan.homework}

TEACHER NOTES
-------------
${lessonPlan.teacher_notes}

CROSS-CURRICULAR CONNECTIONS
----------------------------
${lessonPlan.cross_curricular_connections?.map(c => `• ${c}`).join('\n')}
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
        <p className="text-gray-600 mt-1">Generate comprehensive, classroom-ready lesson plans for K-12 education</p>
      </div>

      <LessonPlannerSuggestions
        suggestedStandards={suggestedStandards}
        suggestedTemplates={suggestedTemplates}
        onPickStandard={(standard) => setFormData({ ...formData, curriculum_standards: standard.code })}
        onPickTemplate={(template) => setFormData({
          ...formData,
          available_resources: template.description || formData.available_resources,
          learning_objectives: template.content || formData.learning_objectives,
        })}
      />

      <LessonPlannerResourcePanel
        resources={suggestedResources}
        onAddResource={(resource) => setFormData({
          ...formData,
          available_resources: formData.available_resources
            ? `${formData.available_resources}\n${resource.title}${resource.resource_url ? ` - ${resource.resource_url}` : ''}`
            : `${resource.title}${resource.resource_url ? ` - ${resource.resource_url}` : ''}`,
        })}
      />

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BookOpen className="w-5 h-5" />
            Lesson Plan Parameters
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label>Subject *</Label>
              <Select value={formData.subject} onValueChange={(v) => setFormData({ ...formData, subject: v })}>
                <SelectTrigger>
                  <SelectValue placeholder="Select subject" />
                </SelectTrigger>
                <SelectContent>
                  {subjects.length > 0 ? (
                    subjects.map((subject) => (
                      <SelectItem key={subject.id} value={subject.subject_name}>
                        {subject.subject_name}
                      </SelectItem>
                    ))
                  ) : (
                    <>
                      <SelectItem value="Mathematics">Mathematics</SelectItem>
                      <SelectItem value="English Language Arts">English Language Arts</SelectItem>
                      <SelectItem value="Science">Science</SelectItem>
                      <SelectItem value="Social Studies">Social Studies</SelectItem>
                      <SelectItem value="History">History</SelectItem>
                      <SelectItem value="Geography">Geography</SelectItem>
                      <SelectItem value="Biology">Biology</SelectItem>
                      <SelectItem value="Chemistry">Chemistry</SelectItem>
                      <SelectItem value="Physics">Physics</SelectItem>
                      <SelectItem value="Art">Art</SelectItem>
                      <SelectItem value="Music">Music</SelectItem>
                      <SelectItem value="Physical Education">Physical Education</SelectItem>
                    </>
                  )}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Topic *</Label>
              <Input
                value={formData.topic}
                onChange={(e) => setFormData({ ...formData, topic: e.target.value })}
                placeholder="e.g., Fractions, Photosynthesis, Civil War"
              />
            </div>
            <div>
              <Label>Grade Level *</Label>
              <Select value={formData.grade_level} onValueChange={(v) => setFormData({ ...formData, grade_level: v })}>
                <SelectTrigger>
                  <SelectValue placeholder="Select grade level" />
                </SelectTrigger>
                <SelectContent>
                  {uniqueGradeLevels.length > 0 ? (
                    uniqueGradeLevels.map((grade) => (
                      <SelectItem key={grade} value={grade}>
                        {grade}
                      </SelectItem>
                    ))
                  ) : (
                    <>
                      <SelectItem value="Kindergarten">Kindergarten</SelectItem>
                      <SelectItem value="1st Grade">1st Grade</SelectItem>
                      <SelectItem value="2nd Grade">2nd Grade</SelectItem>
                      <SelectItem value="3rd Grade">3rd Grade</SelectItem>
                      <SelectItem value="4th Grade">4th Grade</SelectItem>
                      <SelectItem value="5th Grade">5th Grade</SelectItem>
                      <SelectItem value="6th Grade">6th Grade</SelectItem>
                      <SelectItem value="7th Grade">7th Grade</SelectItem>
                      <SelectItem value="8th Grade">8th Grade</SelectItem>
                      <SelectItem value="9th Grade">9th Grade</SelectItem>
                      <SelectItem value="10th Grade">10th Grade</SelectItem>
                      <SelectItem value="11th Grade">11th Grade</SelectItem>
                      <SelectItem value="12th Grade">12th Grade</SelectItem>
                    </>
                  )}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label>Lesson Duration</Label>
              <Select value={formData.duration} onValueChange={(v) => setFormData({ ...formData, duration: v })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="30 minutes">30 minutes</SelectItem>
                  <SelectItem value="45 minutes">45 minutes</SelectItem>
                  <SelectItem value="60 minutes">60 minutes (1 hour)</SelectItem>
                  <SelectItem value="90 minutes">90 minutes (1.5 hours)</SelectItem>
                  <SelectItem value="120 minutes">120 minutes (2 hours)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Class Size</Label>
              <Input
                value={formData.class_size}
                onChange={(e) => setFormData({ ...formData, class_size: e.target.value })}
                placeholder="e.g., 25 students"
              />
            </div>
          </div>

          <div>
            <Label>Learning Objectives (Optional)</Label>
            <Textarea
              value={formData.learning_objectives}
              onChange={(e) => setFormData({ ...formData, learning_objectives: e.target.value })}
              rows={2}
              placeholder="What should students know or be able to do by the end of the lesson?"
            />
          </div>

          <div>
            <Label>Student Prior Knowledge (Optional)</Label>
            <Textarea
              value={formData.student_prior_knowledge}
              onChange={(e) => setFormData({ ...formData, student_prior_knowledge: e.target.value })}
              rows={2}
              placeholder="What do students already know about this topic? What prerequisite skills do they have?"
            />
          </div>

          <div>
            <Label>Available Resources (Optional)</Label>
            <Textarea
              value={formData.available_resources}
              onChange={(e) => setFormData({ ...formData, available_resources: e.target.value })}
              rows={2}
              placeholder="e.g., Smartboard, manipulatives, textbooks, computers, lab equipment"
            />
          </div>

          <div>
            <Label>Special Needs Considerations (Optional)</Label>
            <Textarea
              value={formData.special_needs_considerations}
              onChange={(e) => setFormData({ ...formData, special_needs_considerations: e.target.value })}
              rows={2}
              placeholder="Any specific accommodations needed? ELL students? IEP requirements?"
            />
          </div>

          <div>
            <Label>Curriculum Standards (Optional)</Label>
            <Textarea
              value={formData.curriculum_standards}
              onChange={(e) => setFormData({ ...formData, curriculum_standards: e.target.value })}
              rows={2}
              placeholder="e.g., Common Core, state standards, or specific curriculum requirements"
            />
          </div>

          <Button
            onClick={handleGenerate}
            disabled={generating}
            className="w-full bg-indigo-600 hover:bg-indigo-700 h-12 text-lg"
          >
            {generating ? (
              <>
                <Loader className="w-5 h-5 mr-2 animate-spin" />
                Generating Detailed Lesson Plan...
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
        <div className="space-y-4">
          <LessonPlanSummaryCards lessonPlan={lessonPlan} fallbackDuration={formData.duration} />
          <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle className="text-2xl">{lessonPlan.title}</CardTitle>
              <Button onClick={handleDownload} variant="outline">
                <Download className="w-4 h-4 mr-2" />
                Download
              </Button>
            </div>
            <div className="flex gap-4 text-sm text-gray-600">
              <span className="flex items-center gap-1"><BookOpen className="w-4 h-4" /> {formData.subject}</span>
              <span className="flex items-center gap-1"><Users className="w-4 h-4" /> {lessonPlan.grade_level || formData.grade_level}</span>
              <span className="flex items-center gap-1"><Clock className="w-4 h-4" /> {lessonPlan.duration || formData.duration}</span>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="bg-indigo-50 p-4 rounded-lg">
              <h3 className="font-semibold text-indigo-900 mb-2">Overview</h3>
              <p className="text-gray-700">{lessonPlan.overview}</p>
            </div>

            {lessonPlan.standards_alignment && (
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="font-semibold text-gray-900 mb-2">Standards Alignment</h3>
                <p className="text-gray-700">{lessonPlan.standards_alignment}</p>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2 flex items-center gap-2">
                  <Target className="w-5 h-5 text-green-600" />
                  Learning Objectives
                </h3>
                <ul className="space-y-2">
                  {lessonPlan.learning_objectives?.map((obj, idx) => (
                    <li key={idx} className="flex items-start gap-2 text-gray-700">
                      <CheckCircle className="w-4 h-4 text-green-600 mt-1 flex-shrink-0" />
                      {obj}
                    </li>
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
            </div>

            <div className="space-y-4">
              <h3 className="text-xl font-semibold text-gray-900">Lesson Structure</h3>
              
              {lessonPlan.warm_up && (
                <div className="bg-yellow-50 p-4 rounded-lg border-l-4 border-yellow-400">
                  <h4 className="font-semibold text-yellow-900 mb-2">🌅 Warm-Up ({lessonPlan.warm_up.duration})</h4>
                  <p className="text-gray-700 mb-2">{lessonPlan.warm_up.activity}</p>
                  {lessonPlan.warm_up.teacher_script && (
                    <div className="bg-white p-3 rounded mt-2">
                      <p className="text-sm font-medium text-gray-600">Teacher Script:</p>
                      <p className="text-gray-700 italic">"{lessonPlan.warm_up.teacher_script}"</p>
                    </div>
                  )}
                </div>
              )}

              {lessonPlan.direct_instruction && (
                <div className="bg-blue-50 p-4 rounded-lg border-l-4 border-blue-400">
                  <h4 className="font-semibold text-blue-900 mb-2">📚 Direct Instruction ({lessonPlan.direct_instruction.duration})</h4>
                  <p className="text-gray-700 mb-3">{lessonPlan.direct_instruction.content}</p>
                  
                  {lessonPlan.direct_instruction.teacher_script && (
                    <div className="bg-white p-3 rounded mb-3">
                      <p className="text-sm font-medium text-gray-600">Teacher Script:</p>
                      <p className="text-gray-700 italic">"{lessonPlan.direct_instruction.teacher_script}"</p>
                    </div>
                  )}
                  
                  {lessonPlan.direct_instruction.examples?.length > 0 && (
                    <div className="mb-3">
                      <p className="text-sm font-medium text-gray-600 mb-1">Examples to Demonstrate:</p>
                      <ol className="list-decimal list-inside space-y-1">
                        {lessonPlan.direct_instruction.examples.map((ex, idx) => (
                          <li key={idx} className="text-gray-700">{ex}</li>
                        ))}
                      </ol>
                    </div>
                  )}

                  {lessonPlan.direct_instruction.check_understanding?.length > 0 && (
                    <div>
                      <p className="text-sm font-medium text-gray-600 mb-1">Check Understanding:</p>
                      <ul className="list-disc list-inside space-y-1">
                        {lessonPlan.direct_instruction.check_understanding.map((q, idx) => (
                          <li key={idx} className="text-gray-700">{q}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}

              {lessonPlan.guided_practice && (
                <div className="bg-green-50 p-4 rounded-lg border-l-4 border-green-400">
                  <h4 className="font-semibold text-green-900 mb-2">👥 Guided Practice ({lessonPlan.guided_practice.duration})</h4>
                  <p className="text-gray-700 mb-2">{lessonPlan.guided_practice.activity}</p>
                  <p className="text-sm text-gray-600 mb-2">Grouping: {lessonPlan.guided_practice.student_grouping}</p>
                  
                  {lessonPlan.guided_practice.problems_or_tasks?.length > 0 && (
                    <div className="bg-white p-3 rounded">
                      <p className="text-sm font-medium text-gray-600 mb-1">Problems/Tasks:</p>
                      <ol className="list-decimal list-inside space-y-1">
                        {lessonPlan.guided_practice.problems_or_tasks.map((p, idx) => (
                          <li key={idx} className="text-gray-700">{p}</li>
                        ))}
                      </ol>
                    </div>
                  )}
                </div>
              )}

              {lessonPlan.independent_practice && (
                <div className="bg-purple-50 p-4 rounded-lg border-l-4 border-purple-400">
                  <h4 className="font-semibold text-purple-900 mb-2">✏️ Independent Practice ({lessonPlan.independent_practice.duration})</h4>
                  <p className="text-gray-700 mb-2">{lessonPlan.independent_practice.activity}</p>
                  
                  {lessonPlan.independent_practice.problems_or_tasks?.length > 0 && (
                    <div className="bg-white p-3 rounded">
                      <p className="text-sm font-medium text-gray-600 mb-1">Problems/Tasks:</p>
                      <ol className="list-decimal list-inside space-y-1">
                        {lessonPlan.independent_practice.problems_or_tasks.map((p, idx) => (
                          <li key={idx} className="text-gray-700">{p}</li>
                        ))}
                      </ol>
                    </div>
                  )}
                </div>
              )}

              {lessonPlan.closure && (
                <div className="bg-orange-50 p-4 rounded-lg border-l-4 border-orange-400">
                  <h4 className="font-semibold text-orange-900 mb-2">🎯 Closure ({lessonPlan.closure.duration})</h4>
                  <p className="text-gray-700 mb-2">{lessonPlan.closure.activity}</p>
                  
                  {lessonPlan.closure.discussion_questions?.length > 0 && (
                    <div className="mb-2">
                      <p className="text-sm font-medium text-gray-600 mb-1">Discussion Questions:</p>
                      <ul className="list-disc list-inside space-y-1">
                        {lessonPlan.closure.discussion_questions.map((q, idx) => (
                          <li key={idx} className="text-gray-700">{q}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                  
                  {lessonPlan.closure.exit_ticket && (
                    <div className="bg-white p-3 rounded">
                      <p className="text-sm font-medium text-gray-600">Exit Ticket:</p>
                      <p className="text-gray-700">{lessonPlan.closure.exit_ticket}</p>
                    </div>
                  )}
                </div>
              )}
            </div>

            {lessonPlan.differentiation && (
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  <Lightbulb className="w-5 h-5 text-yellow-500" />
                  Differentiation Strategies
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-red-50 p-3 rounded-lg">
                    <h4 className="font-medium text-red-900 mb-2">Struggling Learners</h4>
                    <ul className="list-disc list-inside text-sm space-y-1">
                      {lessonPlan.differentiation.struggling_learners?.map((s, idx) => (
                        <li key={idx} className="text-gray-700">{s}</li>
                      ))}
                    </ul>
                  </div>
                  <div className="bg-green-50 p-3 rounded-lg">
                    <h4 className="font-medium text-green-900 mb-2">Advanced Learners</h4>
                    <ul className="list-disc list-inside text-sm space-y-1">
                      {lessonPlan.differentiation.advanced_learners?.map((s, idx) => (
                        <li key={idx} className="text-gray-700">{s}</li>
                      ))}
                    </ul>
                  </div>
                  <div className="bg-blue-50 p-3 rounded-lg">
                    <h4 className="font-medium text-blue-900 mb-2">English Learners</h4>
                    <ul className="list-disc list-inside text-sm space-y-1">
                      {lessonPlan.differentiation.english_learners?.map((s, idx) => (
                        <li key={idx} className="text-gray-700">{s}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            )}

            {lessonPlan.assessment && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Formative Assessment</h3>
                  <ul className="list-disc list-inside space-y-1">
                    {lessonPlan.assessment.formative?.map((a, idx) => (
                      <li key={idx} className="text-gray-700">{a}</li>
                    ))}
                  </ul>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Summative Assessment</h3>
                  <p className="text-gray-700">{lessonPlan.assessment.summative}</p>
                </div>
              </div>
            )}

            {lessonPlan.homework && (
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">📝 Homework</h3>
                <p className="text-gray-700">{lessonPlan.homework}</p>
              </div>
            )}

            {lessonPlan.teacher_notes && (
              <div className="bg-amber-50 p-4 rounded-lg border border-amber-200">
                <h3 className="text-lg font-semibold text-amber-900 mb-2">📌 Teacher Notes</h3>
                <p className="text-gray-700">{lessonPlan.teacher_notes}</p>
              </div>
            )}

            {lessonPlan.cross_curricular_connections?.length > 0 && (
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Cross-Curricular Connections</h3>
                <ul className="list-disc list-inside space-y-1">
                  {lessonPlan.cross_curricular_connections.map((c, idx) => (
                    <li key={idx} className="text-gray-700">{c}</li>
                  ))}
                </ul>
              </div>
            )}
          </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}