import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Plus, BookOpen, CheckCircle, AlertCircle, Clock } from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';
import CreateAssignmentDialog from '../components/assignments/CreateAssignmentDialog';
import GradeSubmissionDialog from '../components/assignments/GradeSubmissionDialog';

export default function TeacherAssignmentManager() {
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [gradeDialogOpen, setGradeDialogOpen] = useState(false);
  const [selectedSubmission, setSelectedSubmission] = useState(null);
  const queryClient = useQueryClient();

  const { data: assignments = [] } = useQuery({
    queryKey: ['teacher-assignments'],
    queryFn: () => base44.entities.Assignment.list('-created_date'),
  });

  const { data: submissions = [] } = useQuery({
    queryKey: ['all-submissions'],
    queryFn: () => base44.entities.Submission.list('-submitted_date'),
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
    <div className="space-y-6 p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold text-gray-900" style={{ fontFamily: 'Inter, sans-serif' }}>
            📚 Assignment Manager
          </h1>
          <p className="text-gray-600 mt-1 text-lg">Create, manage, and grade assignments</p>
        </div>
        <Button
          onClick={() => setCreateDialogOpen(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-6 text-lg rounded-2xl shadow-lg"
        >
          <Plus className="w-6 h-6 mr-2" />
          New Assignment
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-2 border-blue-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-blue-700 uppercase tracking-wide">Active</p>
                <p className="text-5xl font-bold text-blue-900 mt-2">{activeAssignments.length}</p>
              </div>
              <BookOpen className="w-16 h-16 text-blue-600 opacity-50" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-orange-50 to-orange-100 border-2 border-orange-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-orange-700 uppercase tracking-wide">Pending Grading</p>
                <p className="text-5xl font-bold text-orange-900 mt-2">{pendingGrading.length}</p>
              </div>
              <Clock className="w-16 h-16 text-orange-600 opacity-50" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-50 to-green-100 border-2 border-green-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-green-700 uppercase tracking-wide">Total Submissions</p>
                <p className="text-5xl font-bold text-green-900 mt-2">{submissions.length}</p>
              </div>
              <CheckCircle className="w-16 h-16 text-green-600 opacity-50" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="active" className="w-full">
        <TabsList className="grid w-full grid-cols-3 h-14 bg-gray-100 rounded-2xl p-2">
          <TabsTrigger value="active" className="text-lg font-semibold rounded-xl">Active</TabsTrigger>
          <TabsTrigger value="grading" className="text-lg font-semibold rounded-xl">Needs Grading</TabsTrigger>
          <TabsTrigger value="all" className="text-lg font-semibold rounded-xl">All Assignments</TabsTrigger>
        </TabsList>

        <TabsContent value="active" className="mt-6">
          <div className="grid gap-4">
            {activeAssignments.map((assignment) => {
              const stats = getSubmissionStats(assignment.id);
              const dueDate = new Date(assignment.due_date);
              const isOverdue = dueDate < new Date();
              return (
                <Card key={assignment.id} className="border-2 border-gray-200 hover:border-blue-300 transition-all hover:shadow-lg">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="text-2xl font-bold text-gray-900">{assignment.title}</h3>
                          {isOverdue && (
                            <Badge className="bg-red-100 text-red-700 text-sm px-3 py-1">Overdue</Badge>
                          )}
                        </div>
                        <p className="text-gray-600 mb-3">{assignment.class_name}</p>
                        <div className="flex gap-4 text-sm">
                          <div className="flex items-center gap-1">
                            <Clock className="w-4 h-4 text-gray-500" />
                            <span className="text-gray-700 font-medium">
                              Due: {format(dueDate, 'MMM dd, yyyy h:mm a')}
                            </span>
                          </div>
                          <div className="text-gray-700">
                            <span className="font-semibold">{assignment.max_points}</span> points
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="mb-2">
                          <span className="text-3xl font-bold text-blue-600">{stats.submitted}</span>
                          <span className="text-gray-500 text-lg"> submitted</span>
                        </div>
                        <div>
                          <span className="text-2xl font-bold text-green-600">{stats.graded}</span>
                          <span className="text-gray-500"> graded</span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
            {activeAssignments.length === 0 && (
              <Card className="border-2 border-dashed border-gray-300">
                <CardContent className="p-12 text-center">
                  <BookOpen className="w-20 h-20 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500 text-xl">No active assignments</p>
                  <p className="text-gray-400 mt-2">Create your first assignment to get started!</p>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>

        <TabsContent value="grading" className="mt-6">
          <div className="grid gap-4">
            {pendingGrading.map((submission) => {
              const assignment = assignments.find(a => a.id === submission.assignment_id);
              if (!assignment) return null;
              return (
                <Card key={submission.id} className="border-2 border-orange-200 hover:border-orange-400 transition-all hover:shadow-lg">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-xl font-bold text-gray-900">{assignment.title}</h3>
                        <p className="text-gray-600 mt-1">Submitted by: {submission.student_name}</p>
                        <p className="text-sm text-gray-500 mt-1">
                          {format(new Date(submission.submitted_date), 'MMM dd, yyyy h:mm a')}
                        </p>
                        {submission.is_late && (
                          <Badge className="bg-red-100 text-red-700 mt-2">Late Submission</Badge>
                        )}
                      </div>
                      <Button
                        onClick={() => handleOpenGrading(submission, assignment)}
                        className="bg-orange-600 hover:bg-orange-700 text-white px-6 py-3 rounded-xl"
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
                <CardContent className="p-16 text-center">
                  <div className="w-32 h-32 bg-gradient-to-br from-green-100 to-blue-100 rounded-full flex items-center justify-center mx-auto mb-6">
                    <span className="text-7xl">✅</span>
                  </div>
                  <h3 className="text-3xl font-bold text-gray-900 mb-3">All Graded!</h3>
                  <p className="text-gray-600 text-lg">No submissions need grading at this time.</p>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>

        <TabsContent value="all" className="mt-6">
          <div className="grid gap-4">
            {assignments.map((assignment) => (
              <Card key={assignment.id} className="border-2 border-gray-200">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-xl font-bold text-gray-900">{assignment.title}</h3>
                      <p className="text-gray-600">{assignment.class_name}</p>
                    </div>
                    <Badge className={
                      assignment.status === 'Published' ? 'bg-green-100 text-green-700' :
                      assignment.status === 'Draft' ? 'bg-gray-100 text-gray-700' :
                      'bg-red-100 text-red-700'
                    }>
                      {assignment.status}
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>

      <CreateAssignmentDialog
        open={createDialogOpen}
        onClose={() => setCreateDialogOpen(false)}
      />

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
    </div>
  );
}