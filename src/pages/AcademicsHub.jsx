import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { 
  Plus, GraduationCap, BookOpen, Users, Calendar, 
  Award, Upload, Trash2, Edit 
} from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import BulkImportDialog from '../components/admin/BulkImportDialog';
import { toast } from 'sonner';

export default function AcademicsHub() {
  const [activeTab, setActiveTab] = useState('classes');
  const [classDialog, setClassDialog] = useState({ open: false, editing: null });
  const [subjectDialog, setSubjectDialog] = useState({ open: false, editing: null });
  const [allocationDialog, setAllocationDialog] = useState({ open: false, editing: null });
  const [sessionDialog, setSessionDialog] = useState({ open: false, editing: null });
  const [termDialog, setTermDialog] = useState({ open: false, editing: null });
  const [gradeScaleDialog, setGradeScaleDialog] = useState({ open: false, editing: null });
  const [bulkImport, setBulkImport] = useState({ open: false, entity: '', schema: null, template: [] });
  const queryClient = useQueryClient();

  const { data: classArms = [] } = useQuery({
    queryKey: ['class-arms'],
    queryFn: () => base44.entities.ClassArm.list(),
  });

  const { data: subjects = [] } = useQuery({
    queryKey: ['subjects'],
    queryFn: () => base44.entities.Subject.list(),
  });

  const { data: teachers = [] } = useQuery({
    queryKey: ['teachers'],
    queryFn: () => base44.entities.Teacher.list(),
  });

  const { data: allocations = [] } = useQuery({
    queryKey: ['allocations'],
    queryFn: () => base44.entities.SubjectAllocation.list(),
  });

  const { data: sessions = [] } = useQuery({
    queryKey: ['sessions'],
    queryFn: () => base44.entities.AcademicSession.list(),
  });

  const { data: terms = [] } = useQuery({
    queryKey: ['terms'],
    queryFn: () => base44.entities.Term.list(),
  });

  const { data: gradingScales = [] } = useQuery({
    queryKey: ['grading-scales'],
    queryFn: () => base44.entities.GradingScale.list(),
  });

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-4xl font-bold text-text">Academics Hub</h1>
          <p className="text-text-secondary mt-2">Manage classes, subjects, allocations, sessions, and grading</p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-5 bg-white rounded-xl shadow-md p-1">
          <TabsTrigger value="classes" className="flex items-center gap-2 data-[state=active]:bg-blue-600 data-[state=active]:text-white">
            <GraduationCap className="w-4 h-4" />
            Classes
          </TabsTrigger>
          <TabsTrigger value="subjects" className="flex items-center gap-2 data-[state=active]:bg-blue-600 data-[state=active]:text-white">
            <BookOpen className="w-4 h-4" />
            Subjects
          </TabsTrigger>
          <TabsTrigger value="allocations" className="flex items-center gap-2 data-[state=active]:bg-blue-600 data-[state=active]:text-white">
            <Users className="w-4 h-4" />
            Allocations
          </TabsTrigger>
          <TabsTrigger value="sessions" className="flex items-center gap-2 data-[state=active]:bg-blue-600 data-[state=active]:text-white">
            <Calendar className="w-4 h-4" />
            Sessions & Terms
          </TabsTrigger>
          <TabsTrigger value="grading" className="flex items-center gap-2 data-[state=active]:bg-blue-600 data-[state=active]:text-white">
            <Award className="w-4 h-4" />
            Grading
          </TabsTrigger>
        </TabsList>

        {/* Classes Tab */}
        <TabsContent value="classes" className="space-y-4">
          <Card className="bg-white rounded-xl shadow-md">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Class Arms</CardTitle>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => setBulkImport({
                    open: true,
                    entity: 'ClassArm',
                    schema: {
                      type: 'object',
                      properties: {
                        arm_name: { type: 'string' },
                        grade_level: { type: 'string' },
                        max_students: { type: 'number' },
                        room: { type: 'string' }
                      },
                      required: ['arm_name', 'grade_level']
                    },
                    template: [{ arm_name: 'A', grade_level: 'JSS1', max_students: 40, room: '101' }]
                  })}
                >
                  <Upload className="w-4 h-4 mr-2" />
                  Bulk Import
                </Button>
                <Button onClick={() => setClassDialog({ open: true, editing: null })} className="bg-blue-600 hover:bg-blue-700 text-white">
                  <Plus className="w-4 h-4 mr-2" />
                  Add Class
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <ClassArmsTable 
                classArms={classArms} 
                onEdit={(arm) => setClassDialog({ open: true, editing: arm })}
              />
            </CardContent>
          </Card>
        </TabsContent>

        {/* Subjects Tab */}
        <TabsContent value="subjects" className="space-y-4">
          <Card className="bg-white rounded-xl shadow-md">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Subjects</CardTitle>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => setBulkImport({
                    open: true,
                    entity: 'Subject',
                    schema: {
                      type: 'object',
                      properties: {
                        subject_name: { type: 'string' },
                        subject_code: { type: 'string' },
                        department: { type: 'string' },
                        grade_levels: { type: 'string' },
                        is_core: { type: 'boolean' }
                      },
                      required: ['subject_name', 'subject_code']
                    },
                    template: [{ subject_name: 'Mathematics', subject_code: 'MTH', department: 'Sciences', grade_levels: 'JSS1-SS3', is_core: true }]
                  })}
                >
                  <Upload className="w-4 h-4 mr-2" />
                  Bulk Import
                </Button>
                <Button onClick={() => setSubjectDialog({ open: true, editing: null })} className="bg-blue-600 hover:bg-blue-700 text-white">
                  <Plus className="w-4 h-4 mr-2" />
                  Add Subject
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <SubjectsTable 
                subjects={subjects} 
                onEdit={(subject) => setSubjectDialog({ open: true, editing: subject })}
              />
            </CardContent>
          </Card>
        </TabsContent>

        {/* Allocations Tab */}
        <TabsContent value="allocations" className="space-y-4">
          <Card className="bg-white rounded-xl shadow-md">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Subject Allocations</CardTitle>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => setBulkImport({
                    open: true,
                    entity: 'SubjectAllocation',
                    schema: {
                      type: 'object',
                      properties: {
                        class_arm_id: { type: 'string' },
                        subject_id: { type: 'string' },
                        teacher_id: { type: 'string' },
                        room: { type: 'string' }
                      },
                      required: ['class_arm_id', 'subject_id', 'teacher_id']
                    },
                    template: [{ class_arm_id: '', subject_id: '', teacher_id: '', room: '101' }]
                  })}
                >
                  <Upload className="w-4 h-4 mr-2" />
                  Bulk Import
                </Button>
                <Button onClick={() => setAllocationDialog({ open: true, editing: null })} className="bg-blue-600 hover:bg-blue-700 text-white">
                  <Plus className="w-4 h-4 mr-2" />
                  Add Allocation
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <AllocationsTable 
                allocations={allocations}
                classArms={classArms}
                subjects={subjects}
                teachers={teachers}
                onEdit={(allocation) => setAllocationDialog({ open: true, editing: allocation })}
              />
            </CardContent>
          </Card>
        </TabsContent>

        {/* Sessions & Terms Tab */}
        <TabsContent value="sessions" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="bg-white rounded-xl shadow-md">
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Academic Sessions</CardTitle>
                <Button onClick={() => setSessionDialog({ open: true, editing: null })} size="sm" className="bg-blue-600 hover:bg-blue-700 text-white">
                  <Plus className="w-4 h-4 mr-2" />
                  Add Session
                </Button>
              </CardHeader>
              <CardContent>
                <SessionsTable 
                  sessions={sessions} 
                  onEdit={(session) => setSessionDialog({ open: true, editing: session })}
                />
              </CardContent>
            </Card>

            <Card className="bg-white rounded-xl shadow-md">
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Terms</CardTitle>
                <Button onClick={() => setTermDialog({ open: true, editing: null })} size="sm" className="bg-blue-600 hover:bg-blue-700 text-white">
                  <Plus className="w-4 h-4 mr-2" />
                  Add Term
                </Button>
              </CardHeader>
              <CardContent>
                <TermsTable 
                  terms={terms} 
                  sessions={sessions}
                  onEdit={(term) => setTermDialog({ open: true, editing: term })}
                />
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Grading Tab */}
        <TabsContent value="grading" className="space-y-4">
          <Card className="bg-white rounded-xl shadow-md">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Grading Scales</CardTitle>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => setBulkImport({
                    open: true,
                    entity: 'GradingScale',
                    schema: {
                      type: 'object',
                      properties: {
                        scale_name: { type: 'string' },
                        grade: { type: 'string' },
                        min_score: { type: 'number' },
                        max_score: { type: 'number' },
                        grade_point: { type: 'number' },
                        remark: { type: 'string' }
                      },
                      required: ['scale_name', 'grade', 'min_score', 'max_score']
                    },
                    template: [{ scale_name: 'Standard Grading', grade: 'A', min_score: 70, max_score: 100, grade_point: 5, remark: 'Excellent' }]
                  })}
                >
                  <Upload className="w-4 h-4 mr-2" />
                  Bulk Import
                </Button>
                <Button onClick={() => setGradeScaleDialog({ open: true, editing: null })} className="bg-blue-600 hover:bg-blue-700 text-white">
                  <Plus className="w-4 h-4 mr-2" />
                  Add Grade Scale
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <GradingScalesTable 
                gradingScales={gradingScales} 
                onEdit={(scale) => setGradeScaleDialog({ open: true, editing: scale })}
              />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Dialogs */}
      <ClassArmDialog {...classDialog} onOpenChange={(open) => setClassDialog({ ...classDialog, open })} />
      <SubjectDialog {...subjectDialog} onOpenChange={(open) => setSubjectDialog({ ...subjectDialog, open })} />
      <AllocationDialog 
        {...allocationDialog} 
        classArms={classArms}
        subjects={subjects}
        teachers={teachers}
        onOpenChange={(open) => setAllocationDialog({ ...allocationDialog, open })} 
      />
      <SessionDialog {...sessionDialog} onOpenChange={(open) => setSessionDialog({ ...sessionDialog, open })} />
      <TermDialog {...termDialog} sessions={sessions} onOpenChange={(open) => setTermDialog({ ...termDialog, open })} />
      <GradeScaleDialog {...gradeScaleDialog} onOpenChange={(open) => setGradeScaleDialog({ ...gradeScaleDialog, open })} />

      {/* Bulk Import Dialog */}
      <BulkImportDialog
        open={bulkImport.open}
        onOpenChange={(open) => setBulkImport({ ...bulkImport, open })}
        entityName={bulkImport.entity}
        entitySchema={bulkImport.schema}
        templateData={bulkImport.template}
        onImportComplete={() => {
          queryClient.invalidateQueries();
          setBulkImport({ open: false, entity: '', schema: null, template: [] });
        }}
      />
    </div>
  );
}

// Component: ClassArmsTable
function ClassArmsTable({ classArms, onEdit }) {
  const queryClient = useQueryClient();
  
  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.ClassArm.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['class-arms'] });
      toast.success('Class arm deleted');
    },
  });

  const groupedByGrade = classArms.reduce((acc, arm) => {
    if (!acc[arm.grade_level]) acc[arm.grade_level] = [];
    acc[arm.grade_level].push(arm);
    return acc;
  }, {});

  return (
    <div className="space-y-4">
      {Object.entries(groupedByGrade).map(([grade, arms]) => (
        <div key={grade}>
          <h3 className="text-lg font-semibold text-text mb-2">Grade {grade}</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {arms.map((arm) => (
              <Card key={arm.id} className="hover:shadow-lg transition-shadow">
                <CardContent className="p-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="font-semibold text-text text-lg">{grade}{arm.arm_name}</h4>
                      <p className="text-sm text-text-secondary">Room: {arm.room || 'N/A'}</p>
                      <p className="text-sm text-text-secondary">Capacity: {arm.max_students || 'N/A'}</p>
                    </div>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="sm" onClick={() => onEdit(arm)}>
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => deleteMutation.mutate(arm.id)}>
                        <Trash2 className="w-4 h-4 text-red-600" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      ))}
      {classArms.length === 0 && (
        <p className="text-center text-text-secondary py-8">No class arms yet. Add your first class!</p>
      )}
    </div>
  );
}

// Component: SubjectsTable
function SubjectsTable({ subjects, onEdit }) {
  const queryClient = useQueryClient();
  
  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.Subject.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['subjects'] });
      toast.success('Subject deleted');
    },
  });

  return (
    <div className="space-y-2">
      {subjects.map((subject) => (
        <div key={subject.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50">
          <div className="flex-1">
            <div className="flex items-center gap-3">
              <h4 className="font-semibold text-text">{subject.subject_name}</h4>
              <Badge variant="outline">{subject.subject_code}</Badge>
              {subject.is_core && <Badge className="bg-blue-100 text-blue-800">Core</Badge>}
            </div>
            <p className="text-sm text-text-secondary mt-1">
              {subject.department} • {subject.grade_levels}
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="ghost" size="sm" onClick={() => onEdit(subject)}>
              <Edit className="w-4 h-4" />
            </Button>
            <Button variant="ghost" size="sm" onClick={() => deleteMutation.mutate(subject.id)}>
              <Trash2 className="w-4 h-4 text-red-600" />
            </Button>
          </div>
        </div>
      ))}
      {subjects.length === 0 && (
        <p className="text-center text-text-secondary py-8">No subjects yet. Add your first subject!</p>
      )}
    </div>
  );
}

// Component: AllocationsTable
function AllocationsTable({ allocations, classArms, subjects, teachers, onEdit }) {
  const queryClient = useQueryClient();
  
  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.SubjectAllocation.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['allocations'] });
      toast.success('Allocation deleted');
    },
  });

  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-4 py-3 text-left text-sm font-semibold text-text">Class</th>
            <th className="px-4 py-3 text-left text-sm font-semibold text-text">Subject</th>
            <th className="px-4 py-3 text-left text-sm font-semibold text-text">Teacher</th>
            <th className="px-4 py-3 text-left text-sm font-semibold text-text">Room</th>
            <th className="px-4 py-3 text-right text-sm font-semibold text-text">Actions</th>
          </tr>
        </thead>
        <tbody>
          {allocations.map((allocation) => (
            <tr key={allocation.id} className="border-t hover:bg-gray-50">
              <td className="px-4 py-3 text-sm">{allocation.class_arm_name}</td>
              <td className="px-4 py-3 text-sm">{allocation.subject_name}</td>
              <td className="px-4 py-3 text-sm">{allocation.teacher_name}</td>
              <td className="px-4 py-3 text-sm">{allocation.room || 'N/A'}</td>
              <td className="px-4 py-3 text-right">
                <div className="flex justify-end gap-2">
                  <Button variant="ghost" size="sm" onClick={() => onEdit(allocation)}>
                    <Edit className="w-4 h-4" />
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => deleteMutation.mutate(allocation.id)}>
                    <Trash2 className="w-4 h-4 text-red-600" />
                  </Button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {allocations.length === 0 && (
        <p className="text-center text-text-secondary py-8">No allocations yet. Assign teachers to subjects!</p>
      )}
    </div>
  );
}

// Component: SessionsTable
function SessionsTable({ sessions, onEdit }) {
  const queryClient = useQueryClient();
  
  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.AcademicSession.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sessions'] });
      toast.success('Session deleted');
    },
  });

  return (
    <div className="space-y-2">
      {sessions.map((session) => (
        <div key={session.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50">
          <div>
            <h4 className="font-semibold text-text">{session.session_name}</h4>
            <p className="text-sm text-text-secondary">
              {new Date(session.start_date).toLocaleDateString()} - {new Date(session.end_date).toLocaleDateString()}
            </p>
            {session.is_current && <Badge className="bg-green-100 text-green-800 mt-1">Current</Badge>}
          </div>
          <div className="flex gap-2">
            <Button variant="ghost" size="sm" onClick={() => onEdit(session)}>
              <Edit className="w-4 h-4" />
            </Button>
            <Button variant="ghost" size="sm" onClick={() => deleteMutation.mutate(session.id)}>
              <Trash2 className="w-4 h-4 text-red-600" />
            </Button>
          </div>
        </div>
      ))}
      {sessions.length === 0 && (
        <p className="text-center text-text-secondary py-8">No sessions yet. Add an academic session!</p>
      )}
    </div>
  );
}

// Component: TermsTable
function TermsTable({ terms, sessions, onEdit }) {
  const queryClient = useQueryClient();
  
  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.Term.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['terms'] });
      toast.success('Term deleted');
    },
  });

  return (
    <div className="space-y-2">
      {terms.map((term) => {
        const session = sessions.find(s => s.id === term.session_id);
        return (
          <div key={term.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50">
            <div>
              <h4 className="font-semibold text-text">{term.term_name}</h4>
              <p className="text-sm text-text-secondary">
                {session?.session_name} • {new Date(term.start_date).toLocaleDateString()} - {new Date(term.end_date).toLocaleDateString()}
              </p>
              {term.is_current && <Badge className="bg-green-100 text-green-800 mt-1">Current</Badge>}
            </div>
            <div className="flex gap-2">
              <Button variant="ghost" size="sm" onClick={() => onEdit(term)}>
                <Edit className="w-4 h-4" />
              </Button>
              <Button variant="ghost" size="sm" onClick={() => deleteMutation.mutate(term.id)}>
                <Trash2 className="w-4 h-4 text-red-600" />
              </Button>
            </div>
          </div>
        );
      })}
      {terms.length === 0 && (
        <p className="text-center text-text-secondary py-8">No terms yet. Add a term!</p>
      )}
    </div>
  );
}

// Component: GradingScalesTable
function GradingScalesTable({ gradingScales, onEdit }) {
  const queryClient = useQueryClient();
  
  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.GradingScale.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['grading-scales'] });
      toast.success('Grading scale deleted');
    },
  });

  const groupedByScale = gradingScales.reduce((acc, scale) => {
    if (!acc[scale.scale_name]) acc[scale.scale_name] = [];
    acc[scale.scale_name].push(scale);
    return acc;
  }, {});

  return (
    <div className="space-y-6">
      {Object.entries(groupedByScale).map(([scaleName, scales]) => (
        <div key={scaleName}>
          <h3 className="text-lg font-semibold text-text mb-3">{scaleName}</h3>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-2 text-left text-sm font-semibold">Grade</th>
                  <th className="px-4 py-2 text-left text-sm font-semibold">Score Range</th>
                  <th className="px-4 py-2 text-left text-sm font-semibold">Grade Point</th>
                  <th className="px-4 py-2 text-left text-sm font-semibold">Remark</th>
                  <th className="px-4 py-2 text-right text-sm font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody>
                {scales.map((scale) => (
                  <tr key={scale.id} className="border-t hover:bg-gray-50">
                    <td className="px-4 py-2">
                      <Badge className="bg-blue-100 text-blue-800">{scale.grade}</Badge>
                    </td>
                    <td className="px-4 py-2 text-sm">{scale.min_score}-{scale.max_score}%</td>
                    <td className="px-4 py-2 text-sm">{scale.grade_point}</td>
                    <td className="px-4 py-2 text-sm">{scale.remark}</td>
                    <td className="px-4 py-2 text-right">
                      <div className="flex justify-end gap-2">
                        <Button variant="ghost" size="sm" onClick={() => onEdit(scale)}>
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => deleteMutation.mutate(scale.id)}>
                          <Trash2 className="w-4 h-4 text-red-600" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ))}
      {gradingScales.length === 0 && (
        <p className="text-center text-text-secondary py-8">No grading scales yet. Add a grading scale!</p>
      )}
    </div>
  );
}

// Dialogs (simplified versions - each would be a full form)
function ClassArmDialog({ open, editing, onOpenChange }) {
  const [formData, setFormData] = useState(editing || {
    arm_name: '',
    grade_level: '',
    max_students: 40,
    room: '',
  });
  const queryClient = useQueryClient();

  React.useEffect(() => {
    setFormData(editing || { arm_name: '', grade_level: '', max_students: 40, room: '' });
  }, [editing, open]);

  const mutation = useMutation({
    mutationFn: (data) => editing ? base44.entities.ClassArm.update(editing.id, data) : base44.entities.ClassArm.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['class-arms'] });
      onOpenChange(false);
      toast.success(editing ? 'Class arm updated' : 'Class arm created');
    },
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    mutation.mutate(formData);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-white">
        <DialogHeader>
          <DialogTitle>{editing ? 'Edit' : 'Add'} Class Arm</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Grade Level *</Label>
              <Input value={formData.grade_level} onChange={(e) => setFormData({ ...formData, grade_level: e.target.value })} placeholder="e.g., JSS1" required />
            </div>
            <div>
              <Label>Arm Name *</Label>
              <Input value={formData.arm_name} onChange={(e) => setFormData({ ...formData, arm_name: e.target.value })} placeholder="e.g., A" required />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Max Students</Label>
              <Input type="number" value={formData.max_students} onChange={(e) => setFormData({ ...formData, max_students: parseInt(e.target.value) })} />
            </div>
            <div>
              <Label>Room</Label>
              <Input value={formData.room} onChange={(e) => setFormData({ ...formData, room: e.target.value })} placeholder="e.g., 101" />
            </div>
          </div>
          <div className="flex justify-end gap-3">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white">{editing ? 'Update' : 'Create'}</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function SubjectDialog({ open, editing, onOpenChange }) {
  const [formData, setFormData] = useState(editing || {
    subject_name: '',
    subject_code: '',
    department: '',
    grade_levels: '',
    is_core: false,
  });
  const queryClient = useQueryClient();

  React.useEffect(() => {
    setFormData(editing || { subject_name: '', subject_code: '', department: '', grade_levels: '', is_core: false });
  }, [editing, open]);

  const mutation = useMutation({
    mutationFn: (data) => editing ? base44.entities.Subject.update(editing.id, data) : base44.entities.Subject.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['subjects'] });
      onOpenChange(false);
      toast.success(editing ? 'Subject updated' : 'Subject created');
    },
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    mutation.mutate(formData);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-white">
        <DialogHeader>
          <DialogTitle>{editing ? 'Edit' : 'Add'} Subject</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Subject Name *</Label>
              <Input value={formData.subject_name} onChange={(e) => setFormData({ ...formData, subject_name: e.target.value })} placeholder="e.g., Mathematics" required />
            </div>
            <div>
              <Label>Subject Code *</Label>
              <Input value={formData.subject_code} onChange={(e) => setFormData({ ...formData, subject_code: e.target.value })} placeholder="e.g., MTH" required />
            </div>
          </div>
          <div>
            <Label>Department</Label>
            <Input value={formData.department} onChange={(e) => setFormData({ ...formData, department: e.target.value })} placeholder="e.g., Sciences" />
          </div>
          <div>
            <Label>Grade Levels</Label>
            <Input value={formData.grade_levels} onChange={(e) => setFormData({ ...formData, grade_levels: e.target.value })} placeholder="e.g., JSS1-SS3" />
          </div>
          <div className="flex items-center gap-2">
            <Switch checked={formData.is_core} onCheckedChange={(checked) => setFormData({ ...formData, is_core: checked })} />
            <Label>Core Subject</Label>
          </div>
          <div className="flex justify-end gap-3">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white">{editing ? 'Update' : 'Create'}</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function AllocationDialog({ open, editing, classArms, subjects, teachers, onOpenChange }) {
  const [formData, setFormData] = useState(editing || {
    class_arm_id: '',
    subject_id: '',
    teacher_id: '',
    room: '',
  });
  const queryClient = useQueryClient();

  React.useEffect(() => {
    setFormData(editing || { class_arm_id: '', subject_id: '', teacher_id: '', room: '' });
  }, [editing, open]);

  const mutation = useMutation({
    mutationFn: (data) => {
      const classArm = classArms.find(c => c.id === data.class_arm_id);
      const subject = subjects.find(s => s.id === data.subject_id);
      const teacher = teachers.find(t => t.id === data.teacher_id);
      const submitData = {
        ...data,
        class_arm_name: classArm ? `${classArm.grade_level}${classArm.arm_name}` : '',
        subject_name: subject?.subject_name || '',
        teacher_name: teacher ? `${teacher.first_name} ${teacher.last_name}` : '',
      };
      return editing ? base44.entities.SubjectAllocation.update(editing.id, submitData) : base44.entities.SubjectAllocation.create(submitData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['allocations'] });
      onOpenChange(false);
      toast.success(editing ? 'Allocation updated' : 'Allocation created');
    },
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    mutation.mutate(formData);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-white">
        <DialogHeader>
          <DialogTitle>{editing ? 'Edit' : 'Add'} Allocation</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label>Class Arm *</Label>
            <Select value={formData.class_arm_id} onValueChange={(value) => setFormData({ ...formData, class_arm_id: value })}>
              <SelectTrigger>
                <SelectValue placeholder="Select class arm" />
              </SelectTrigger>
              <SelectContent>
                {classArms.map(arm => (
                  <SelectItem key={arm.id} value={arm.id}>
                    {arm.grade_level}{arm.arm_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Subject *</Label>
            <Select value={formData.subject_id} onValueChange={(value) => setFormData({ ...formData, subject_id: value })}>
              <SelectTrigger>
                <SelectValue placeholder="Select subject" />
              </SelectTrigger>
              <SelectContent>
                {subjects.map(subject => (
                  <SelectItem key={subject.id} value={subject.id}>
                    {subject.subject_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Teacher *</Label>
            <Select value={formData.teacher_id} onValueChange={(value) => setFormData({ ...formData, teacher_id: value })}>
              <SelectTrigger>
                <SelectValue placeholder="Select teacher" />
              </SelectTrigger>
              <SelectContent>
                {teachers.map(teacher => (
                  <SelectItem key={teacher.id} value={teacher.id}>
                    {teacher.first_name} {teacher.last_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Room</Label>
            <Input value={formData.room} onChange={(e) => setFormData({ ...formData, room: e.target.value })} placeholder="e.g., 101" />
          </div>
          <div className="flex justify-end gap-3">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white">{editing ? 'Update' : 'Create'}</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function SessionDialog({ open, editing, onOpenChange }) {
  const [formData, setFormData] = useState(editing || {
    session_name: '',
    start_date: '',
    end_date: '',
    is_current: false,
  });
  const queryClient = useQueryClient();

  React.useEffect(() => {
    setFormData(editing || { session_name: '', start_date: '', end_date: '', is_current: false });
  }, [editing, open]);

  const mutation = useMutation({
    mutationFn: (data) => editing ? base44.entities.AcademicSession.update(editing.id, data) : base44.entities.AcademicSession.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sessions'] });
      onOpenChange(false);
      toast.success(editing ? 'Session updated' : 'Session created');
    },
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    mutation.mutate(formData);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-white">
        <DialogHeader>
          <DialogTitle>{editing ? 'Edit' : 'Add'} Academic Session</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label>Session Name *</Label>
            <Input value={formData.session_name} onChange={(e) => setFormData({ ...formData, session_name: e.target.value })} placeholder="e.g., 2024-2025" required />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Start Date *</Label>
              <Input type="date" value={formData.start_date} onChange={(e) => setFormData({ ...formData, start_date: e.target.value })} required />
            </div>
            <div>
              <Label>End Date *</Label>
              <Input type="date" value={formData.end_date} onChange={(e) => setFormData({ ...formData, end_date: e.target.value })} required />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Switch checked={formData.is_current} onCheckedChange={(checked) => setFormData({ ...formData, is_current: checked })} />
            <Label>Current Session</Label>
          </div>
          <div className="flex justify-end gap-3">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white">{editing ? 'Update' : 'Create'}</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function TermDialog({ open, editing, sessions, onOpenChange }) {
  const [formData, setFormData] = useState(editing || {
    session_id: '',
    term_name: '',
    term_number: 1,
    start_date: '',
    end_date: '',
    is_current: false,
  });
  const queryClient = useQueryClient();

  React.useEffect(() => {
    setFormData(editing || { session_id: '', term_name: '', term_number: 1, start_date: '', end_date: '', is_current: false });
  }, [editing, open]);

  const mutation = useMutation({
    mutationFn: (data) => editing ? base44.entities.Term.update(editing.id, data) : base44.entities.Term.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['terms'] });
      onOpenChange(false);
      toast.success(editing ? 'Term updated' : 'Term created');
    },
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    mutation.mutate(formData);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-white">
        <DialogHeader>
          <DialogTitle>{editing ? 'Edit' : 'Add'} Term</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label>Academic Session *</Label>
            <Select value={formData.session_id} onValueChange={(value) => setFormData({ ...formData, session_id: value })}>
              <SelectTrigger>
                <SelectValue placeholder="Select session" />
              </SelectTrigger>
              <SelectContent>
                {sessions.map(session => (
                  <SelectItem key={session.id} value={session.id}>
                    {session.session_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Term Name *</Label>
              <Input value={formData.term_name} onChange={(e) => setFormData({ ...formData, term_name: e.target.value })} placeholder="e.g., First Term" required />
            </div>
            <div>
              <Label>Term Number *</Label>
              <Input type="number" value={formData.term_number} onChange={(e) => setFormData({ ...formData, term_number: parseInt(e.target.value) })} min="1" max="3" required />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Start Date *</Label>
              <Input type="date" value={formData.start_date} onChange={(e) => setFormData({ ...formData, start_date: e.target.value })} required />
            </div>
            <div>
              <Label>End Date *</Label>
              <Input type="date" value={formData.end_date} onChange={(e) => setFormData({ ...formData, end_date: e.target.value })} required />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Switch checked={formData.is_current} onCheckedChange={(checked) => setFormData({ ...formData, is_current: checked })} />
            <Label>Current Term</Label>
          </div>
          <div className="flex justify-end gap-3">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white">{editing ? 'Update' : 'Create'}</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function GradeScaleDialog({ open, editing, onOpenChange }) {
  const [formData, setFormData] = useState(editing || {
    scale_name: '',
    grade: '',
    min_score: 0,
    max_score: 100,
    grade_point: 0,
    remark: '',
  });
  const queryClient = useQueryClient();

  React.useEffect(() => {
    setFormData(editing || { scale_name: '', grade: '', min_score: 0, max_score: 100, grade_point: 0, remark: '' });
  }, [editing, open]);

  const mutation = useMutation({
    mutationFn: (data) => editing ? base44.entities.GradingScale.update(editing.id, data) : base44.entities.GradingScale.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['grading-scales'] });
      onOpenChange(false);
      toast.success(editing ? 'Grade scale updated' : 'Grade scale created');
    },
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    mutation.mutate(formData);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-white">
        <DialogHeader>
          <DialogTitle>{editing ? 'Edit' : 'Add'} Grade Scale</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label>Scale Name *</Label>
            <Input value={formData.scale_name} onChange={(e) => setFormData({ ...formData, scale_name: e.target.value })} placeholder="e.g., Standard Grading" required />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Grade *</Label>
              <Input value={formData.grade} onChange={(e) => setFormData({ ...formData, grade: e.target.value })} placeholder="e.g., A" required />
            </div>
            <div>
              <Label>Grade Point *</Label>
              <Input type="number" step="0.1" value={formData.grade_point} onChange={(e) => setFormData({ ...formData, grade_point: parseFloat(e.target.value) })} required />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Min Score *</Label>
              <Input type="number" value={formData.min_score} onChange={(e) => setFormData({ ...formData, min_score: parseFloat(e.target.value) })} min="0" max="100" required />
            </div>
            <div>
              <Label>Max Score *</Label>
              <Input type="number" value={formData.max_score} onChange={(e) => setFormData({ ...formData, max_score: parseFloat(e.target.value) })} min="0" max="100" required />
            </div>
          </div>
          <div>
            <Label>Remark</Label>
            <Input value={formData.remark} onChange={(e) => setFormData({ ...formData, remark: e.target.value })} placeholder="e.g., Excellent" />
          </div>
          <div className="flex justify-end gap-3">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white">{editing ? 'Update' : 'Create'}</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}