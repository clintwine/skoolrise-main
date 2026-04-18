import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useSchoolTenant } from '@/hooks/useSchoolTenant';
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
import LmsIntegrationPanel from '../components/academics/LmsIntegrationPanel';
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
  const { schoolTenantId, isLoading: tenantLoading } = useSchoolTenant();
  const tenantFilter = schoolTenantId ? { school_tenant_id: schoolTenantId } : {};

  const { data: classArms = [] } = useQuery({
    queryKey: ['class-arms', schoolTenantId],
    queryFn: () => schoolTenantId ? base44.entities.ClassArm.filter(tenantFilter) : base44.entities.ClassArm.list(),
    enabled: !tenantLoading,
  });

  const { data: subjects = [] } = useQuery({
    queryKey: ['subjects', schoolTenantId],
    queryFn: () => schoolTenantId ? base44.entities.Subject.filter(tenantFilter) : base44.entities.Subject.list(),
    enabled: !tenantLoading,
  });

  const { data: teachers = [] } = useQuery({
    queryKey: ['teachers', schoolTenantId],
    queryFn: () => schoolTenantId ? base44.entities.Teacher.filter(tenantFilter) : base44.entities.Teacher.list(),
    enabled: !tenantLoading,
  });

  const { data: allocations = [] } = useQuery({
    queryKey: ['allocations', schoolTenantId],
    queryFn: () => schoolTenantId ? base44.entities.SubjectAllocation.filter(tenantFilter) : base44.entities.SubjectAllocation.list(),
    enabled: !tenantLoading,
  });

  const { data: sessions = [] } = useQuery({
    queryKey: ['sessions', schoolTenantId],
    queryFn: () => schoolTenantId ? base44.entities.AcademicSession.filter(tenantFilter) : base44.entities.AcademicSession.list(),
    enabled: !tenantLoading,
  });

  const { data: terms = [] } = useQuery({
    queryKey: ['terms', schoolTenantId],
    queryFn: () => schoolTenantId ? base44.entities.Term.filter(tenantFilter) : base44.entities.Term.list(),
    enabled: !tenantLoading,
  });

  const { data: gradingScales = [] } = useQuery({
    queryKey: ['grading-scales', schoolTenantId],
    queryFn: () => schoolTenantId ? base44.entities.GradingScale.filter(tenantFilter) : base44.entities.GradingScale.list(),
    enabled: !tenantLoading,
  });

  return (
    <div className="space-y-4 sm:space-y-6 px-2 sm:px-0">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-text">Academics Hub</h1>
        <p className="text-sm sm:text-base text-text-secondary mt-1">Manage school structure, curriculum, and teacher allocations.</p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="flex flex-wrap bg-gray-100 rounded-xl sm:rounded-full p-1 gap-1 w-full sm:w-auto sm:inline-flex">
          <TabsTrigger value="classes" className="flex items-center gap-1 sm:gap-2 rounded-lg sm:rounded-full px-2 sm:px-4 py-2 text-xs sm:text-sm data-[state=active]:bg-white data-[state=active]:shadow-sm flex-1 sm:flex-none justify-center">
            <GraduationCap className="w-3 h-3 sm:w-4 sm:h-4" />
            <span className="hidden sm:inline">Classes</span>
            <span className="sm:hidden">Class</span>
          </TabsTrigger>
          <TabsTrigger value="subjects" className="flex items-center gap-1 sm:gap-2 rounded-lg sm:rounded-full px-2 sm:px-4 py-2 text-xs sm:text-sm data-[state=active]:bg-white data-[state=active]:shadow-sm flex-1 sm:flex-none justify-center">
            <BookOpen className="w-3 h-3 sm:w-4 sm:h-4" />
            <span className="hidden sm:inline">Subjects</span>
            <span className="sm:hidden">Subj</span>
          </TabsTrigger>
          <TabsTrigger value="allocations" className="flex items-center gap-1 sm:gap-2 rounded-lg sm:rounded-full px-2 sm:px-4 py-2 text-xs sm:text-sm data-[state=active]:bg-white data-[state=active]:shadow-sm flex-1 sm:flex-none justify-center">
            <Users className="w-3 h-3 sm:w-4 sm:h-4" />
            <span className="hidden sm:inline">Allocations</span>
            <span className="sm:hidden">Alloc</span>
          </TabsTrigger>
          <TabsTrigger value="sessions" className="flex items-center gap-1 sm:gap-2 rounded-lg sm:rounded-full px-2 sm:px-4 py-2 text-xs sm:text-sm data-[state=active]:bg-white data-[state=active]:shadow-sm flex-1 sm:flex-none justify-center">
            <Calendar className="w-3 h-3 sm:w-4 sm:h-4" />
            <span className="hidden sm:inline">Sessions</span>
            <span className="sm:hidden">Sess</span>
          </TabsTrigger>
          <TabsTrigger value="grading" className="flex items-center gap-1 sm:gap-2 rounded-lg sm:rounded-full px-2 sm:px-4 py-2 text-xs sm:text-sm data-[state=active]:bg-white data-[state=active]:shadow-sm flex-1 sm:flex-none justify-center">
            <Award className="w-3 h-3 sm:w-4 sm:h-4" />
            <span className="hidden sm:inline">Grading</span>
            <span className="sm:hidden">Grade</span>
          </TabsTrigger>
          <TabsTrigger value="integrations" className="flex items-center gap-1 sm:gap-2 rounded-lg sm:rounded-full px-2 sm:px-4 py-2 text-xs sm:text-sm data-[state=active]:bg-white data-[state=active]:shadow-sm flex-1 sm:flex-none justify-center">
            <BookOpen className="w-3 h-3 sm:w-4 sm:h-4" />
            <span className="hidden sm:inline">LMS + AI</span>
            <span className="sm:hidden">LMS</span>
          </TabsTrigger>
        </TabsList>

        {/* Classes Tab */}
        <TabsContent value="classes" className="space-y-4 mt-4 sm:mt-6">
          <Card className="bg-white rounded-xl shadow-sm border">
            <CardHeader className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 p-4 sm:p-6 pb-2">
              <div>
                <CardTitle className="text-base sm:text-lg font-semibold">Class Structures</CardTitle>
                <p className="text-xs sm:text-sm text-gray-500 mt-1">Define grade levels and arms</p>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="text-xs sm:text-sm"
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
                  <Upload className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
                  <span className="hidden sm:inline">Bulk </span>Import
                </Button>
                <Button onClick={() => setClassDialog({ open: true, editing: null })} className="bg-gray-900 hover:bg-gray-800 text-white text-xs sm:text-sm" size="sm">
                  <Plus className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
                  <span className="hidden sm:inline">New Class </span>Add
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
        <TabsContent value="allocations" className="space-y-4 mt-6">
          <Card className="bg-white rounded-xl shadow-sm border">
            <CardHeader className="flex flex-row items-start justify-between pb-2">
              <div>
                <CardTitle className="text-lg font-semibold">Teacher Allocations</CardTitle>
                <p className="text-sm text-gray-500 mt-1">Assign teachers to subjects for specific classes.</p>
              </div>
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
                <Button onClick={() => setAllocationDialog({ open: true, editing: null })} className="bg-green-600 hover:bg-green-700 text-white">
                  <Plus className="w-4 h-4 mr-2" />
                  Assign Teacher
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-0">
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
        <TabsContent value="sessions" className="space-y-4 mt-6">
          <Card className="bg-white rounded-xl shadow-sm border">
            <CardHeader className="flex flex-row items-start justify-between pb-2">
              <div>
                <CardTitle className="text-lg font-semibold">Academic Calendar</CardTitle>
                <p className="text-sm text-gray-500 mt-1">Manage academic sessions and terms.</p>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => setBulkImport({
                    open: true,
                    entity: 'AcademicSession',
                    schema: {
                      type: 'object',
                      properties: {
                        session_name: { type: 'string' },
                        start_date: { type: 'string' },
                        end_date: { type: 'string' },
                        is_current: { type: 'boolean' }
                      },
                      required: ['session_name', 'start_date', 'end_date']
                    },
                    template: [{ session_name: '2024/2025', start_date: '2024-09-01', end_date: '2025-07-31', is_current: false }]
                  })}
                >
                  <Upload className="w-4 h-4 mr-2" />
                  Import Sessions
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setBulkImport({
                    open: true,
                    entity: 'Term',
                    schema: {
                      type: 'object',
                      properties: {
                        session_id: { type: 'string' },
                        term_name: { type: 'string' },
                        term_number: { type: 'number' },
                        start_date: { type: 'string' },
                        end_date: { type: 'string' },
                        is_current: { type: 'boolean' }
                      },
                      required: ['session_id', 'term_name', 'start_date', 'end_date']
                    },
                    template: [{ session_id: '', term_name: 'First Term', term_number: 1, start_date: '2024-09-01', end_date: '2024-12-15', is_current: false }]
                  })}
                >
                  <Upload className="w-4 h-4 mr-2" />
                  Import Terms
                </Button>
                <Button onClick={() => setTermDialog({ open: true, editing: null })} variant="outline">
                  <Plus className="w-4 h-4 mr-2" />
                  Add Term
                </Button>
                <Button onClick={() => setSessionDialog({ open: true, editing: null })} className="bg-gray-900 hover:bg-gray-800 text-white">
                  <Plus className="w-4 h-4 mr-2" />
                  Add Session
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <SessionsWithTerms 
                sessions={sessions}
                terms={terms}
                onEditSession={(session) => setSessionDialog({ open: true, editing: session })}
                onEditTerm={(term) => setTermDialog({ open: true, editing: term })}
              />
            </CardContent>
          </Card>
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

        <TabsContent value="integrations" className="space-y-4 mt-4 sm:mt-6">
          <LmsIntegrationPanel
            integrations={[
              { name: 'Google Drive resource sync', description: 'Ready to support shared teaching materials and linked class resources.', active: true },
              { name: 'Assignment sync foundation', description: 'Internal academic structures are now ready for future LMS-style assignment sync.', active: false },
              { name: 'Standards-linked assessment flow', description: 'Curriculum standards can guide future external assessment mapping.', active: false },
            ]}
            pathways={[
              { title: 'Support Path', level: 'Needs help', description: 'Recommend revision resources and teacher follow-up for students below target.' },
              { title: 'Core Path', level: 'On track', description: 'Keep students on the main learning sequence with regular assignments and checks.' },
              { title: 'Stretch Path', level: 'Advanced', description: 'Suggest deeper challenge tasks and extension activities for high performers.' },
            ]}
          />
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

  const armColors = ['bg-red-500', 'bg-blue-500', 'bg-green-500', 'bg-purple-500', 'bg-orange-500', 'bg-pink-500'];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-4">
      {Object.entries(groupedByGrade).map(([grade, arms]) => (
        <Card key={grade} className="border rounded-xl overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b bg-gray-50">
            <h3 className="font-semibold text-gray-900">{grade}</h3>
            <Badge className="bg-blue-100 text-blue-700">{arms.length} Arms</Badge>
          </div>
          <CardContent className="p-0">
            {arms.map((arm, idx) => (
              <div 
                key={arm.id} 
                className="flex items-center gap-3 px-4 py-3 border-b last:border-b-0 hover:bg-gray-50 cursor-pointer"
                onClick={() => onEdit(arm)}
              >
                <div className={`w-8 h-8 rounded-lg ${armColors[idx % armColors.length]} flex items-center justify-center text-white text-sm font-semibold`}>
                  {arm.arm_name}
                </div>
                <span className="text-gray-700 font-medium">{grade} {arm.arm_name}</span>
              </div>
            ))}
          </CardContent>
        </Card>
      ))}
      {classArms.length === 0 && (
        <div className="col-span-full text-center text-gray-500 py-12">
          No class arms yet. Add your first class!
        </div>
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

  const getInitials = (name) => {
    if (!name) return '?';
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="border-b">
            <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Class Arm</th>
            <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Subject</th>
            <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Assigned Teacher</th>
            <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Room</th>
            <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
            <th className="px-6 py-4 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Action</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {allocations.map((allocation) => (
            <tr key={allocation.id} className="hover:bg-gray-50">
              <td className="px-6 py-4 text-sm font-medium text-gray-900">{allocation.class_arm_name}</td>
              <td className="px-6 py-4 text-sm text-gray-700">{allocation.subject_name}</td>
              <td className="px-6 py-4">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center text-purple-700 text-xs font-semibold">
                    {getInitials(allocation.teacher_name)}
                  </div>
                  <span className="text-sm text-gray-900">{allocation.teacher_name}</span>
                </div>
              </td>
              <td className="px-6 py-4 text-sm text-gray-700">{allocation.room || '-'}</td>
              <td className="px-6 py-4">
                <Badge className="bg-green-100 text-green-700 font-medium">Active</Badge>
              </td>
              <td className="px-6 py-4 text-right">
                <div className="flex justify-end gap-1">
                  <Button variant="ghost" size="sm" onClick={() => onEdit(allocation)} className="text-gray-500 hover:text-gray-700">
                    <Edit className="w-4 h-4" />
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => deleteMutation.mutate(allocation.id)} className="text-red-400 hover:text-red-600">
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {allocations.length === 0 && (
        <div className="text-center text-gray-500 py-12">
          No allocations yet. Assign teachers to subjects!
        </div>
      )}
    </div>
  );
}

// Component: SessionsWithTerms
function SessionsWithTerms({ sessions, terms, onEditSession, onEditTerm }) {
  const queryClient = useQueryClient();
  
  const deleteSessionMutation = useMutation({
    mutationFn: (id) => base44.entities.AcademicSession.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sessions'] });
      toast.success('Session deleted');
    },
  });

  const deleteTermMutation = useMutation({
    mutationFn: (id) => base44.entities.Term.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['terms'] });
      toast.success('Term deleted');
    },
  });

  const getSessionTerms = (sessionId) => {
    return terms.filter(t => t.session_id === sessionId);
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
      {sessions.map((session) => {
        const sessionTerms = getSessionTerms(session.id);
        return (
          <Card key={session.id} className="border rounded-xl overflow-hidden">
            <div className="p-4 border-b">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
                    <Calendar className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900">{session.session_name} Session</h4>
                    <p className="text-sm text-gray-500">
                      {session.start_date} — {session.end_date}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {session.is_current && (
                    <Badge className="bg-green-600 text-white">Current</Badge>
                  )}
                  <Badge variant="outline" className="text-gray-600">Active</Badge>
                </div>
              </div>
            </div>
            <CardContent className="p-4">
              <div className="flex items-center justify-between text-sm text-gray-600 mb-2">
                <span>Terms ({sessionTerms.length})</span>
                <Button variant="ghost" size="sm" onClick={() => onEditSession(session)} className="h-6 px-2">
                  <Edit className="w-3 h-3" />
                </Button>
              </div>
              {sessionTerms.length === 0 ? (
                <p className="text-sm text-gray-400">No terms configured for this session.</p>
              ) : (
                <div className="space-y-2">
                  {sessionTerms.map((term) => (
                    <div key={term.id} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-gray-700">{term.term_name}</span>
                        {term.is_current && (
                          <Badge className="bg-green-100 text-green-700 text-xs">Current</Badge>
                        )}
                      </div>
                      <div className="flex gap-1">
                        <Button variant="ghost" size="sm" onClick={() => onEditTerm(term)} className="h-6 w-6 p-0">
                          <Edit className="w-3 h-3" />
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => deleteTermMutation.mutate(term.id)} className="h-6 w-6 p-0 text-red-500">
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        );
      })}
      {sessions.length === 0 && (
        <div className="col-span-full text-center text-gray-500 py-12">
          No sessions yet. Add an academic session!
        </div>
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
      <DialogContent className="w-[95vw] max-w-md bg-white p-4 sm:p-6">
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
      <DialogContent className="w-[95vw] max-w-md bg-white p-4 sm:p-6">
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
      <DialogContent className="w-[95vw] max-w-md bg-white p-4 sm:p-6">
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
      <DialogContent className="w-[95vw] max-w-md bg-white p-4 sm:p-6">
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
      <DialogContent className="w-[95vw] max-w-md bg-white p-4 sm:p-6">
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
      <DialogContent className="w-[95vw] max-w-md bg-white p-4 sm:p-6">
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