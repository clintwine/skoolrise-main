import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Plus, BookOpen, CheckCircle, AlertCircle, Clock, FileText } from 'lucide-react';
import { format, isValid } from 'date-fns';

// Helper to safely format dates
const safeFormat = (dateValue, formatString) => {
  if (!dateValue) return '-';
  try {
    const date = typeof dateValue === 'string' ? new Date(dateValue) : dateValue;
    if (!date || !isValid(date)) return '-';
    return format(date, formatString);
  } catch {
    return '-';
  }
};
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '../utils';
import GradeSubmissionDialog from '../components/assignments/GradeSubmissionDialog';
import RubricBuilder from '../components/assignments/RubricBuilder';

export default function TeacherAssignmentManager() {
  const navigate = useNavigate();
  const [gradeDialogOpen, setGradeDialogOpen] = useState(false);
  const [selectedSubmission, setSelectedSubmission] = useState(null);
  const [rubricBuilderOpen, setRubricBuilderOpen] = useState(false);
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

  const isAdmin = user?.role === 'admin' || user?.user_type === 'admin';

  const { data: assignments = [] } = useQuery({
    queryKey: ['teacher-assignments', teacherProfile?.id, isAdmin],
    queryFn: async () => {
      // Admins see all assignments, teachers see only their own
      if (isAdmin) {
        return await base44.entities.Assignment.list('-created_date');
      }
      if (!teacherProfile?.id) return [];
      return await base44.entities.Assignment.filter({ teacher_id: teacherProfile.id }, '-created_date');
    },
    enabled: isAdmin || !!teacherProfile?.id,
  });

  const { data: submissions = [] } = useQuery({
    queryKey: ['all-submissions', teacherProfile?.id, assignments.map(a => a.id)],
    queryFn: async () => {
      if (!teacherProfile?.id || assignments.length === 0) return [];
      const assignmentIds = assignments.map(a => a.id);
      const allSubmissions = await base44.entities.Submission.list('-submitted_date');
      return allSubmissions.filter(s => assignmentIds.includes(s.assignment_id));
    },
    enabled: !!teacherProfile?.id && assignments.length > 0,
  });

  const activeAssignments = assignments.filter(a => a.status === 'Published');
  const pendingGrading = submissions.filter(s => s.status === 'Submitted' || s.status === 'Late');

  const getSubmissionStats = (assignmentId) => {
    const assignmentSubs = submissions.filter(s => s.assignment_id === assignmentId);
    const submitted = assignmentSubs.filter(s => s.status === 'Submitted' || s.status === 'Graded' || s.status === 'Late').length;
    const graded = assignmentSubs.filter(s => s.status === 'Graded').length;
    return { submitted, graded, total: assignmentSubs.length };
  };

  const handleOpenGrading = (submission, assignment) => {
    setSelectedSubmission({ ...submission, assignment });
    setGradeDialogOpen(true);
  };

  return (
    <div className="space-y-4 sm:space-y-6 p-3 sm:p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-0">
        <div>
          <h1 className="text-3xl sm:text-4xl font-bold text-gray-900" style={{ fontFamily: 'Inter, sans-serif' }}>
            📚 Assignment Manager
          </h1>
          <p className="text-gray-600 mt-1 text-sm sm:text-lg">Create, manage, and grade assignments</p>
        </div>
        <div className="flex gap-2 w-full sm:w-auto">
          <Button
            onClick={() => setRubricBuilderOpen(true)}
            variant="outline"
            className="border-blue-300 text-blue-700 hover:bg-blue-50 px-3 py-3 sm:px-4 sm:py-6 text-sm sm:text-base rounded-xl sm:rounded-2xl flex-1 sm:flex-none"
          >
            <FileText className="w-4 h-4 sm:w-5 sm:h-5 mr-1 sm:mr-2" />
            Rubrics
          </Button>
          <Button
            onClick={() => navigate(createPageUrl('AssignmentBuilder'))}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-3 sm:px-6 sm:py-6 text-base sm:text-lg rounded-xl sm:rounded-2xl shadow-lg flex-1 sm:flex-none"
          >
            <Plus className="w-5 h-5 sm:w-6 sm:h-6 mr-2" />
            New Assignment
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-6">
        <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-2 border-blue-200">
          <CardContent className="p-4 sm:p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs sm:text-sm font-semibold text-blue-700 uppercase tracking-wide">Active</p>
                <p className="text-3xl sm:text-5xl font-bold text-blue-900 mt-1 sm:mt-2">{activeAssignments.length}</p>
              </div>
              <BookOpen className="w-12 h-12 sm:w-16 sm:h-16 text-blue-600 opacity-50" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-orange-50 to-orange-100 border-2 border-orange-200">
          <CardContent className="p-4 sm:p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs sm:text-sm font-semibold text-orange-700 uppercase tracking-wide">Pending Grading</p>
                <p className="text-3xl sm:text-5xl font-bold text-orange-900 mt-1 sm:mt-2">{pendingGrading.length}</p>
              </div>
              <Clock className="w-12 h-12 sm:w-16 sm:h-16 text-orange-600 opacity-50" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-50 to-green-100 border-2 border-green-200">
          <CardContent className="p-4 sm:p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs sm:text-sm font-semibold text-green-700 uppercase tracking-wide">Total Submissions</p>
                <p className="text-3xl sm:text-5xl font-bold text-green-900 mt-1 sm:mt-2">{submissions.length}</p>
              </div>
              <CheckCircle className="w-12 h-12 sm:w-16 sm:h-16 text-green-600 opacity-50" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="active" className="w-full">
        <TabsList className="grid w-full grid-cols-3 h-12 sm:h-14 bg-gray-100 rounded-xl sm:rounded-2xl p-1 sm:p-2">
          <TabsTrigger value="active" className="text-sm sm:text-lg font-semibold rounded-lg sm:rounded-xl">Active</TabsTrigger>
          <TabsTrigger value="grading" className="text-sm sm:text-lg font-semibold rounded-lg sm:rounded-xl">Needs Grading</TabsTrigger>
          <TabsTrigger value="all" className="text-sm sm:text-lg font-semibold rounded-lg sm:rounded-xl">All</TabsTrigger>
        </TabsList>

        <TabsContent value="active" className="mt-4 sm:mt-6">
          <div className="grid gap-3 sm:gap-4">
            {activeAssignments.map((assignment) => {
              const stats = getSubmissionStats(assignment.id);
              const dueDate = assignment.due_date ? new Date(assignment.due_date) : null;
              const isOverdue = dueDate && isValid(dueDate) && dueDate < new Date();
              return (
                <Card 
                  key={assignment.id} 
                  className="border-2 border-gray-200 hover:border-blue-300 transition-all hover:shadow-lg cursor-pointer"
                  onClick={() => navigate(createPageUrl(`AssignmentBuilder?id=${assignment.id}`))}
                >
                  <CardContent className="p-4 sm:p-6">
                    <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 sm:gap-0">
                      <div className="flex-1">
                        <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 mb-2">
                          <h3 className="text-lg sm:text-2xl font-bold text-gray-900">{assignment.title}</h3>
                          {isOverdue && (
                            <Badge className="bg-red-100 text-red-700 text-xs sm:text-sm px-2 py-0.5 sm:px-3 sm:py-1 w-fit">Overdue</Badge>
                          )}
                        </div>
                        <p className="text-sm sm:text-base text-gray-600 mb-2 sm:mb-3">{assignment.class_name}</p>
                        <div className="flex flex-col sm:flex-row sm:gap-4 gap-1 text-xs sm:text-sm">
                          <div className="flex items-center gap-1">
                            <Clock className="w-3 h-3 sm:w-4 sm:h-4 text-gray-500" />
                            <span className="text-gray-700 font-medium">
                              Due: {format(dueDate, 'MMM dd, yyyy h:mm a')}
                            </span>
                          </div>
                          <div className="text-gray-700">
                            <span className="font-semibold">{assignment.max_points}</span> points
                          </div>
                        </div>
                      </div>
                      <div className="text-left sm:text-right flex sm:flex-col gap-3 sm:gap-0">
                        <div className="flex-1 sm:mb-2">
                          <span className="text-2xl sm:text-3xl font-bold text-blue-600">{stats.submitted}</span>
                          <span className="text-gray-500 text-sm sm:text-lg"> submitted</span>
                        </div>
                        <div className="flex-1">
                          <span className="text-xl sm:text-2xl font-bold text-green-600">{stats.graded}</span>
                          <span className="text-gray-500 text-sm"> graded</span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
            {activeAssignments.length === 0 && (
              <Card className="border-2 border-dashed border-gray-300">
                <CardContent className="p-8 sm:p-12 text-center">
                  <BookOpen className="w-16 h-16 sm:w-20 sm:h-20 text-gray-300 mx-auto mb-3 sm:mb-4" />
                  <p className="text-gray-500 text-lg sm:text-xl">No active assignments</p>
                  <p className="text-gray-400 text-sm sm:text-base mt-2">Create your first assignment to get started!</p>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>

        <TabsContent value="grading" className="mt-4 sm:mt-6">
          <div className="grid gap-3 sm:gap-4">
            {pendingGrading.map((submission) => {
              const assignment = assignments.find(a => a.id === submission.assignment_id);
              if (!assignment) return null;
              return (
                <Card key={submission.id} className="border-2 border-orange-200 hover:border-orange-400 transition-all hover:shadow-lg">
                  <CardContent className="p-4 sm:p-6">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                      <div className="flex-1">
                        <h3 className="text-lg sm:text-xl font-bold text-gray-900">{assignment.title}</h3>
                        <p className="text-sm sm:text-base text-gray-600 mt-1">Submitted by: {submission.student_name}</p>
                        <p className="text-xs sm:text-sm text-gray-500 mt-1">
                          {format(new Date(submission.submitted_date), 'MMM dd, yyyy h:mm a')}
                        </p>
                        {submission.is_late && (
                          <Badge className="bg-red-100 text-red-700 mt-2 text-xs">Late Submission</Badge>
                        )}
                      </div>
                      <Button
                        onClick={() => handleOpenGrading(submission, assignment)}
                        className="bg-orange-600 hover:bg-orange-700 text-white px-4 py-2 sm:px-6 sm:py-3 rounded-xl w-full sm:w-auto text-sm sm:text-base"
                      >
                        Grade Now
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
            {pendingGrading.length === 0 && (
              <Card className="border-2 border-dashed border-gray-300">
                <CardContent className="p-12 sm:p-16 text-center">
                  <div className="w-24 h-24 sm:w-32 sm:h-32 bg-gradient-to-br from-green-100 to-blue-100 rounded-full flex items-center justify-center mx-auto mb-4 sm:mb-6">
                    <span className="text-5xl sm:text-7xl">✅</span>
                  </div>
                  <h3 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2 sm:mb-3">All Graded!</h3>
                  <p className="text-gray-600 text-base sm:text-lg">No submissions need grading at this time.</p>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>

        <TabsContent value="all" className="mt-4 sm:mt-6">
          <div className="grid gap-3 sm:gap-4">
            {assignments.map((assignment) => (
              <Card 
                key={assignment.id} 
                className="border-2 border-gray-200 hover:border-blue-300 transition-all hover:shadow-lg cursor-pointer"
                onClick={() => navigate(createPageUrl(`AssignmentBuilder?id=${assignment.id}`))}
              >
                <CardContent className="p-4 sm:p-6">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                    <div className="flex-1">
                      <h3 className="text-lg sm:text-xl font-bold text-gray-900">{assignment.title}</h3>
                      <p className="text-sm sm:text-base text-gray-600">{assignment.class_name}</p>
                    </div>
                    <Badge className={`w-fit ${
                      assignment.status === 'Published' ? 'bg-green-100 text-green-700' :
                      assignment.status === 'Draft' ? 'bg-gray-100 text-gray-700' :
                      'bg-red-100 text-red-700'
                    }`}>
                      {assignment.status}
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>

      {selectedSubmission && (
        <GradeSubmissionDialog
          open={gradeDialogOpen}
          onClose={() => {
            setGradeDialogOpen(false);
            setSelectedSubmission(null);
          }}
          submission={selectedSubmission}
        />
      )}

      <RubricBuilder
        open={rubricBuilderOpen}
        onOpenChange={setRubricBuilderOpen}
      />
    </div>
  );
}