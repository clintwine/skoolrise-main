import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Link2, BookOpen, Target } from 'lucide-react';
import CurriculumStats from '../components/curriculum/CurriculumStats';

export default function CurriculumMapping() {
  const [showStandardForm, setShowStandardForm] = useState(false);
  const [showMappingForm, setShowMappingForm] = useState(false);
  const [editingStandard, setEditingStandard] = useState(null);
  const [selectedSubject, setSelectedSubject] = useState('all');
  const [selectedGrade, setSelectedGrade] = useState('all');
  
  const [standardForm, setStandardForm] = useState({
    code: '',
    title: '',
    description: '',
    subject: '',
    grade_level: '',
    category: '',
    framework: 'Custom',
    learning_objectives: '',
  });

  const [mappingForm, setMappingForm] = useState({
    standard_id: '',
    entity_type: 'Assignment',
    entity_id: '',
    proficiency_level: 'Develop',
    coverage_notes: '',
  });

  const queryClient = useQueryClient();

  const { data: standards = [] } = useQuery({
    queryKey: ['curriculum-standards'],
    queryFn: () => base44.entities.CurriculumStandard.list(),
  });

  const { data: mappings = [] } = useQuery({
    queryKey: ['standard-mappings'],
    queryFn: () => base44.entities.StandardMapping.list(),
  });

  const { data: assignments = [] } = useQuery({
    queryKey: ['assignments'],
    queryFn: () => base44.entities.Assignment.list(),
  });

  const { data: exams = [] } = useQuery({
    queryKey: ['exams'],
    queryFn: () => base44.entities.Exam.list(),
  });

  const createStandardMutation = useMutation({
    mutationFn: (data) => base44.entities.CurriculumStandard.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['curriculum-standards'] });
      setShowStandardForm(false);
      setStandardForm({
        code: '',
        title: '',
        description: '',
        subject: '',
        grade_level: '',
        category: '',
        framework: 'Custom',
        learning_objectives: '',
      });
    },
  });

  const createMappingMutation = useMutation({
    mutationFn: async (data) => {
      const standard = standards.find(s => s.id === data.standard_id);
      return await base44.entities.StandardMapping.create({
        ...data,
        standard_code: standard?.code,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['standard-mappings'] });
      setShowMappingForm(false);
      setMappingForm({
        standard_id: '',
        entity_type: 'Assignment',
        entity_id: '',
        proficiency_level: 'Develop',
        coverage_notes: '',
      });
    },
  });

  const filteredStandards = standards.filter(s => 
    (selectedSubject === 'all' || s.subject === selectedSubject) &&
    (selectedGrade === 'all' || s.grade_level === selectedGrade)
  );

  const subjects = [...new Set(standards.map(s => s.subject))];
  const grades = [...new Set(standards.map(s => s.grade_level))];

  const getEntityName = (entityType, entityId) => {
    if (entityType === 'Assignment') {
      return assignments.find(a => a.id === entityId)?.title || 'Unknown';
    }
    if (entityType === 'Exam') {
      return exams.find(e => e.id === entityId)?.title || 'Unknown';
    }
    return 'Unknown';
  };

  const frameworkColors = {
    'Common Core': 'bg-blue-100 text-blue-800',
    'State Standard': 'bg-green-100 text-green-800',
    'International Baccalaureate': 'bg-purple-100 text-purple-800',
    'AP': 'bg-orange-100 text-orange-800',
    'Custom': 'bg-gray-100 text-gray-800',
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Curriculum Mapping</h1>
          <p className="text-gray-600 mt-1">Manage curriculum standards and map to content</p>
        </div>
        <div className="flex gap-3">
          <Button onClick={() => setShowMappingForm(true)} variant="outline">
            <Link2 className="w-4 h-4 mr-2" />
            Map Standard
          </Button>
          <Button onClick={() => setShowStandardForm(true)} className="bg-blue-600 hover:bg-blue-700">
            <Plus className="w-4 h-4 mr-2" />
            Add Standard
          </Button>
        </div>
      </div>

      <CurriculumStats
        stats={{
          standards: standards.length,
          mappings: mappings.length,
          subjects: subjects.length,
          grades: grades.length,
        }}
      />

      <Card>
        <CardHeader>
          <CardTitle>Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Select value={selectedSubject} onValueChange={setSelectedSubject}>
              <SelectTrigger>
                <SelectValue placeholder="All Subjects" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Subjects</SelectItem>
                {subjects.map(subject => (
                  <SelectItem key={subject} value={subject}>{subject}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={selectedGrade} onValueChange={setSelectedGrade}>
              <SelectTrigger>
                <SelectValue placeholder="All Grades" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Grades</SelectItem>
                {grades.map(grade => (
                  <SelectItem key={grade} value={grade}>Grade {grade}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Curriculum Standards</CardTitle>
          <p className="text-sm text-gray-500">Map standards to assignments and exams to keep teaching, assessment, and planning aligned.</p>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {filteredStandards.map(standard => {
              const standardMappings = mappings.filter(m => m.standard_id === standard.id);
              
              return (
                <div key={standard.id} className="p-4 border rounded-lg">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="font-mono text-sm font-semibold text-blue-600">{standard.code}</span>
                        <Badge className={frameworkColors[standard.framework]}>{standard.framework}</Badge>
                        <Badge variant="outline">Grade {standard.grade_level}</Badge>
                        <Badge variant="outline">{standard.subject}</Badge>
                      </div>
                      <h3 className="font-semibold text-gray-900 mb-1">{standard.title}</h3>
                      <p className="text-sm text-gray-600">{standard.description}</p>
                      {standard.category && (
                        <p className="text-xs text-gray-500 mt-1">Category: {standard.category}</p>
                      )}
                    </div>
                  </div>
                  
                  {standardMappings.length > 0 && (
                    <div className="mt-3 pt-3 border-t">
                      <p className="text-xs font-medium text-gray-700 mb-2">Mapped to:</p>
                      <div className="flex flex-wrap gap-2">
                        {standardMappings.map(mapping => (
                          <Badge key={mapping.id} variant="outline" className="text-xs">
                            {mapping.entity_type}: {getEntityName(mapping.entity_type, mapping.entity_id)}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      <Dialog open={showStandardForm} onOpenChange={setShowStandardForm}>
        <DialogContent className="max-w-2xl bg-white">
          <DialogHeader>
            <DialogTitle className="text-gray-900">Add Curriculum Standard</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Standard Code *</label>
                <Input
                  value={standardForm.code}
                  onChange={(e) => setStandardForm({ ...standardForm, code: e.target.value })}
                  placeholder="e.g., CCSS.MATH.7.G.A.1"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Framework</label>
                <Select value={standardForm.framework} onValueChange={(value) => setStandardForm({ ...standardForm, framework: value })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Common Core">Common Core</SelectItem>
                    <SelectItem value="State Standard">State Standard</SelectItem>
                    <SelectItem value="International Baccalaureate">International Baccalaureate</SelectItem>
                    <SelectItem value="AP">AP</SelectItem>
                    <SelectItem value="Custom">Custom</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Title *</label>
              <Input
                value={standardForm.title}
                onChange={(e) => setStandardForm({ ...standardForm, title: e.target.value })}
                placeholder="Short title for the standard"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
              <Textarea
                value={standardForm.description}
                onChange={(e) => setStandardForm({ ...standardForm, description: e.target.value })}
                placeholder="Full description of the standard"
                rows={3}
              />
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Subject *</label>
                <Input
                  value={standardForm.subject}
                  onChange={(e) => setStandardForm({ ...standardForm, subject: e.target.value })}
                  placeholder="e.g., Mathematics"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Grade Level *</label>
                <Input
                  value={standardForm.grade_level}
                  onChange={(e) => setStandardForm({ ...standardForm, grade_level: e.target.value })}
                  placeholder="e.g., 7"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                <Input
                  value={standardForm.category}
                  onChange={(e) => setStandardForm({ ...standardForm, category: e.target.value })}
                  placeholder="e.g., Geometry"
                />
              </div>
            </div>

            <div className="flex justify-end gap-3">
              <Button variant="outline" onClick={() => setShowStandardForm(false)}>Cancel</Button>
              <Button
                onClick={() => createStandardMutation.mutate(standardForm)}
                disabled={!standardForm.code || !standardForm.title || !standardForm.subject || !standardForm.grade_level}
                className="bg-blue-600 hover:bg-blue-700"
              >
                Create Standard
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={showMappingForm} onOpenChange={setShowMappingForm}>
        <DialogContent className="bg-white">
          <DialogHeader>
            <DialogTitle className="text-gray-900">Map Standard to Content</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Select Standard *</label>
              <Select value={mappingForm.standard_id} onValueChange={(value) => setMappingForm({ ...mappingForm, standard_id: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose standard" />
                </SelectTrigger>
                <SelectContent>
                  {standards.map(s => (
                    <SelectItem key={s.id} value={s.id}>
                      {s.code} - {s.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Entity Type *</label>
              <Select value={mappingForm.entity_type} onValueChange={(value) => setMappingForm({ ...mappingForm, entity_type: value, entity_id: '' })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Assignment">Assignment</SelectItem>
                  <SelectItem value="Exam">Exam</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Select Content *</label>
              <Select value={mappingForm.entity_id} onValueChange={(value) => setMappingForm({ ...mappingForm, entity_id: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose content" />
                </SelectTrigger>
                <SelectContent>
                  {mappingForm.entity_type === 'Assignment' && assignments.map(a => (
                    <SelectItem key={a.id} value={a.id}>{a.title}</SelectItem>
                  ))}
                  {mappingForm.entity_type === 'Exam' && exams.map(e => (
                    <SelectItem key={e.id} value={e.id}>{e.title}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Proficiency Level</label>
              <Select value={mappingForm.proficiency_level} onValueChange={(value) => setMappingForm({ ...mappingForm, proficiency_level: value })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Introduce">Introduce</SelectItem>
                  <SelectItem value="Develop">Develop</SelectItem>
                  <SelectItem value="Master">Master</SelectItem>
                  <SelectItem value="Assess">Assess</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Coverage Notes</label>
              <Textarea
                value={mappingForm.coverage_notes}
                onChange={(e) => setMappingForm({ ...mappingForm, coverage_notes: e.target.value })}
                placeholder="How is this standard covered?"
                rows={2}
              />
            </div>

            <div className="flex justify-end gap-3">
              <Button variant="outline" onClick={() => setShowMappingForm(false)}>Cancel</Button>
              <Button
                onClick={() => createMappingMutation.mutate(mappingForm)}
                disabled={!mappingForm.standard_id || !mappingForm.entity_id}
                className="bg-green-600 hover:bg-green-700"
              >
                Create Mapping
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}