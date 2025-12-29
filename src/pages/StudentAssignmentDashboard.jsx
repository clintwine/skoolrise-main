import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Clock, CheckCircle, AlertTriangle, Upload } from 'lucide-react';
import { format, isPast, differenceInDays } from 'date-fns';
import { toast } from 'sonner';
import SubmitAssignmentDialog from '../components/assignments/SubmitAssignmentDialog';

export default function StudentAssignmentDashboard() {
  const [selectedAssignment, setSelectedAssignment] = useState(null);
  const [submitDialogOpen, setSubmitDialogOpen] = useState(false);
  const queryClient = useQueryClient();

  const { data: user } = useQuery({
    queryKey: ['current-user'],
    queryFn: () => base44.auth.me(),
  });

  const { data: students = [] } = useQuery({
    queryKey: ['students'],
    queryFn: () => base44.entities.Student.list(),
    enabled: !!user,
  });

  const currentStudent = students.find(s => s.user_id === user?.id);

  const { data: enrollments = [] } = useQuery({
    queryKey: ['my-enrollments'],
    queryFn: () => base44.entities.Enrollment.filter({ student_id: currentStudent?.id }),
    enabled: !!currentStudent,
  });

  const classIds = enrollments.map(e => e.class_id);

  const { data: allAssignments = [] } = useQuery({
    queryKey: ['student-assignments'],
    queryFn: () => base44.entities.Assignment.list(),
    enabled: classIds.length > 0,
  });

  const myAssignments = allAssignments.filter(a => 
    classIds.includes(a.class_id) && a.status === 'Published'
  );

  const { data: submissions = [] } = useQuery({
    queryKey: ['my-submissions'],
    queryFn: () => base44.entities.Submission.filter({ student_id: currentStudent?.id }),
    enabled: !!currentStudent,
  });

  const getAssignmentStatus = (assignment) => {
    const submission = submissions.find(s => s.assignment_id === assignment.id);
    const dueDate = new Date(assignment.due_date);
    const now = new Date();

    if (submission) {
      if (submission.status === 'Graded') {
        return { label: 'Graded', color: 'bg-green-100 text-green-700 border-green-300', icon: CheckCircle };
      }
      return { label: 'Submitted', color: 'bg-blue-100 text-blue-700 border-blue-300', icon: CheckCircle };
    }

    if (isPast(dueDate)) {
      return { label: 'MISSING', color: 'bg-red-100 text-red-700 border-red-300', icon: AlertTriangle };
    }

    const daysUntilDue = differenceInDays(dueDate, now);
    if (daysUntilDue <= 1) {
      return { label: 'Due Soon', color: 'bg-yellow-100 text-yellow-700 border-yellow-300', icon: Clock };
    }

    return { label: 'To Do', color: 'bg-purple-100 text-purple-700 border-purple-300', icon: Clock };
  };

  const sortedAssignments = [...myAssignments].sort((a, b) => 
    new Date(a.due_date) - new Date(b.due_date)
  );

  const handleOpenSubmit = (assignment) => {
    setSelectedAssignment(assignment);
    setSubmitDialogOpen(true);
  };

  return (
    <div className="space-y-6 p-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="text-center mb-8">
        <h1 className="text-5xl font-bold text-gray-900 mb-2" style={{ fontFamily: 'Inter, sans-serif' }}>
          📚 My Assignments
        </h1>
        <p className="text-gray-600 text-xl">Stay on top of your work!</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-2 border-blue-200">
          <CardContent className="p-6 text-center">
            <Clock className="w-12 h-12 text-blue-600 mx-auto mb-2" />
            <p className="text-4xl font-bold text-blue-900">
              {sortedAssignments.filter(a => !submissions.find(s => s.assignment_id === a.id)).length}
            </p>
            <p className="text-sm font-semibold text-blue-700 uppercase">To Do</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-50 to-green-100 border-2 border-green-200">
          <CardContent className="p-6 text-center">
            <CheckCircle className="w-12 h-12 text-green-600 mx-auto mb-2" />
            <p className="text-4xl font-bold text-green-900">
              {submissions.filter(s => s.status === 'Submitted' || s.status === 'Graded').length}
            </p>
            <p className="text-sm font-semibold text-green-700 uppercase">Submitted</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-red-50 to-red-100 border-2 border-red-200">
          <CardContent className="p-6 text-center">
            <AlertTriangle className="w-12 h-12 text-red-600 mx-auto mb-2" />
            <p className="text-4xl font-bold text-red-900">
              {sortedAssignments.filter(a => {
                const sub = submissions.find(s => s.assignment_id === a.id);
                return !sub && isPast(new Date(a.due_date));
              }).length}
            </p>
            <p className="text-sm font-semibold text-red-700 uppercase">Missing</p>
          </CardContent>
        </Card>
      </div>

      {/* Assignment List */}
      <div className="space-y-4">
        <h2 className="text-2xl font-bold text-gray-900">📅 Upcoming Work</h2>
        
        {sortedAssignments.map((assignment) => {
          const status = getAssignmentStatus(assignment);
          const StatusIcon = status.icon;
          const dueDate = new Date(assignment.due_date);
          const submission = submissions.find(s => s.assignment_id === assignment.id);

          return (
            <Card key={assignment.id} className="border-2 border-gray-200 hover:border-blue-300 transition-all hover:shadow-lg">
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-2xl font-bold text-gray-900">{assignment.title}</h3>
                      <Badge className={`${status.color} px-4 py-1.5 rounded-full font-semibold border-2 flex items-center gap-1`}>
                        <StatusIcon className="w-4 h-4" />
                        {status.label}
                      </Badge>
                    </div>
                    
                    <p className="text-gray-600 mb-3">{assignment.class_name}</p>
                    
                    <div className="flex gap-4 text-sm mb-3">
                      <div className="flex items-center gap-1">
                        <Clock className="w-4 h-4 text-gray-500" />
                        <span className="text-gray-700 font-medium">
                          Due: {format(dueDate, 'EEEE, MMM dd')} at {format(dueDate, 'h:mm a')}
                        </span>
                      </div>
                      <div className="text-gray-700">
                        <span className="font-semibold">{assignment.max_points}</span> points
                      </div>
                    </div>

                    {submission?.status === 'Graded' && (
                      <div className="bg-green-50 p-4 rounded-xl border-2 border-green-200">
                        <div className="flex items-center justify-between">
                          <span className="text-green-900 font-semibold">Your Grade:</span>
                          <span className="text-3xl font-bold text-green-600">
                            {submission.grade}/{assignment.max_points}
                          </span>
                        </div>
                        {submission.feedback && (
                          <div className="mt-2 text-sm text-gray-700">
                            <span className="font-semibold">Feedback: </span>
                            {submission.feedback}
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  <div>
                    {!submission ? (
                      <Button
                        onClick={() => handleOpenSubmit(assignment)}
                        className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl text-lg"
                        disabled={isPast(dueDate)}
                      >
                        <Upload className="w-5 h-5 mr-2" />
                        Submit
                      </Button>
                    ) : submission.status !== 'Graded' ? (
                      <Badge className="bg-blue-100 text-blue-700 text-lg px-4 py-2">
                        ✓ Submitted
                      </Badge>
                    ) : null}
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}

        {sortedAssignments.length === 0 && (
          <Card className="border-2 border-dashed border-gray-300">
            <CardContent className="p-16 text-center">
              <div className="w-32 h-32 bg-gradient-to-br from-green-100 to-blue-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <span className="text-7xl">🎉</span>
              </div>
              <h3 className="text-3xl font-bold text-gray-900 mb-3">All Caught Up!</h3>
              <p className="text-gray-600 text-lg">You have no assignments right now. Great job!</p>
            </CardContent>
          </Card>
        )}
      </div>

      {selectedAssignment && (
        <SubmitAssignmentDialog
          open={submitDialogOpen}
          onClose={() => {
            setSubmitDialogOpen(false);
            setSelectedAssignment(null);
          }}
          assignment={selectedAssignment}
          studentId={currentStudent?.id}
        />
      )}
    </div>
  );
}