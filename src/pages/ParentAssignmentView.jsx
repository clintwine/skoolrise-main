import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { useSchoolContext } from '@/hooks/useSchoolContext';
import { addSchoolFilter } from '@/utils/schoolFilter';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Clock, CheckCircle, AlertTriangle, XCircle } from 'lucide-react';
import { format, isPast } from 'date-fns';

export default function ParentAssignmentView() {
  const [selectedStudentId, setSelectedStudentId] = useState('');

  const { data: user } = useQuery({
    queryKey: ['current-user'],
    queryFn: () => base44.auth.me(),
  });

  const { school_tenant_id, isReady } = useSchoolContext();

  const { data: parents = [] } = useQuery({
    queryKey: ['parents', user?.id],
    queryFn: () => base44.entities.Parent.filter({ user_id: user?.id }),
    enabled: !!user?.id,
  });

  const currentParent = parents[0];

  const { data: allStudents = [] } = useQuery({
    queryKey: ['all-students', school_tenant_id],
    queryFn: () => base44.entities.Student.filter(addSchoolFilter({}, school_tenant_id)),
    enabled: isReady,
  });

  const myChildren = allStudents.filter(s => s.parent_id === currentParent?.id);

  const { data: enrollments = [] } = useQuery({
    queryKey: ['child-enrollments', currentParent?.id],
    queryFn: () => base44.entities.Enrollment.filter(addSchoolFilter({}, school_tenant_id)),
    enabled: myChildren.length > 0 && isReady,
  });

  const { data: allAssignments = [] } = useQuery({
    queryKey: ['all-assignments', school_tenant_id],
    queryFn: () => base44.entities.Assignment.filter(addSchoolFilter({ status: 'Published' }, school_tenant_id)),
    enabled: isReady,
  });

  const { data: submissions = [] } = useQuery({
    queryKey: ['child-submissions', selectedStudentId],
    queryFn: () => selectedStudentId
      ? base44.entities.Submission.filter({ student_id: selectedStudentId })
      : [],
    enabled: !!selectedStudentId,
  });

  const selectedStudent = myChildren.find(s => s.id === selectedStudentId);
  const studentEnrollments = enrollments.filter(e => e.student_id === selectedStudentId);
  const classIds = studentEnrollments.map(e => e.class_id);
  
  const studentAssignments = allAssignments.filter(a => 
    classIds.includes(a.class_id) && a.status === 'Published'
  ).sort((a, b) => new Date(a.due_date) - new Date(b.due_date));

  const getAssignmentStatus = (assignment) => {
    const submission = submissions.find(s => 
      s.assignment_id === assignment.id && s.student_id === selectedStudentId
    );
    const dueDate = new Date(assignment.due_date);

    if (submission) {
      if (submission.status === 'Graded') {
        return {
          label: 'Graded',
          color: 'bg-green-100 text-green-700 border-green-300',
          icon: CheckCircle,
        };
      }
      if (submission.is_late) {
        return {
          label: 'Submitted Late',
          color: 'bg-orange-100 text-orange-700 border-orange-300',
          icon: Clock,
        };
      }
      return {
        label: 'Submitted',
        color: 'bg-blue-100 text-blue-700 border-blue-300',
        icon: CheckCircle,
      };
    }

    if (isPast(dueDate)) {
      return {
        label: 'MISSING',
        color: 'bg-red-100 text-red-700 border-red-300 text-lg font-bold',
        icon: XCircle,
      };
    }

    return {
      label: 'Not Submitted',
      color: 'bg-purple-100 text-purple-700 border-purple-300',
      icon: Clock,
    };
  };

  const getStats = () => {
    if (!selectedStudentId) return { total: 0, submitted: 0, missing: 0, graded: 0 };

    const total = studentAssignments.length;
    const submitted = studentAssignments.filter(a => {
      const sub = submissions.find(s => s.assignment_id === a.id && s.student_id === selectedStudentId);
      return sub && (sub.status === 'Submitted' || sub.status === 'Graded' || sub.status === 'Late');
    }).length;
    
    const missing = studentAssignments.filter(a => {
      const sub = submissions.find(s => s.assignment_id === a.id && s.student_id === selectedStudentId);
      return !sub && isPast(new Date(a.due_date));
    }).length;

    const graded = studentAssignments.filter(a => {
      const sub = submissions.find(s => s.assignment_id === a.id && s.student_id === selectedStudentId);
      return sub?.status === 'Graded';
    }).length;

    return { total, submitted, missing, graded };
  };

  const stats = getStats();

  return (
    <div className="space-y-4 sm:space-y-6 p-4 sm:p-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="text-center mb-6 sm:mb-8">
        <h1 className="text-3xl sm:text-5xl font-bold text-gray-900 mb-2" style={{ fontFamily: 'Inter, sans-serif' }}>
          👪 My Child's Assignments
        </h1>
        <p className="text-base sm:text-xl text-gray-600">Track your child's progress</p>
      </div>

      {/* Child Selector */}
      <Card className="bg-gradient-to-br from-purple-50 to-blue-50 border-2 border-purple-200">
        <CardContent className="p-4 sm:p-6">
          <label className="text-base sm:text-lg font-semibold text-gray-900 block mb-2 sm:mb-3">Select Child:</label>
          <Select value={selectedStudentId} onValueChange={setSelectedStudentId}>
            <SelectTrigger className="text-base sm:text-xl p-4 sm:p-6 rounded-xl border-2 bg-white">
              <SelectValue placeholder="Choose a child" />
            </SelectTrigger>
            <SelectContent>
              {myChildren.map((child) => (
                <SelectItem key={child.id} value={child.id} className="text-base sm:text-lg">
                  {child.first_name} {child.last_name} - {child.grade_level}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {/* Stats */}
      {selectedStudentId && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
          <Card className="bg-blue-50 border-2 border-blue-200">
            <CardContent className="p-4 sm:p-6 text-center">
              <p className="text-2xl sm:text-4xl font-bold text-blue-900">{stats.total}</p>
              <p className="text-xs sm:text-sm font-semibold text-blue-700 uppercase mt-1">Total</p>
            </CardContent>
          </Card>

          <Card className="bg-green-50 border-2 border-green-200">
            <CardContent className="p-4 sm:p-6 text-center">
              <p className="text-2xl sm:text-4xl font-bold text-green-900">{stats.submitted}</p>
              <p className="text-xs sm:text-sm font-semibold text-green-700 uppercase mt-1">Submitted</p>
            </CardContent>
          </Card>

          <Card className="bg-purple-50 border-2 border-purple-200">
            <CardContent className="p-4 sm:p-6 text-center">
              <p className="text-2xl sm:text-4xl font-bold text-purple-900">{stats.graded}</p>
              <p className="text-xs sm:text-sm font-semibold text-purple-700 uppercase mt-1">Graded</p>
            </CardContent>
          </Card>

          <Card className="bg-red-50 border-2 border-red-200">
            <CardContent className="p-4 sm:p-6 text-center">
              <p className="text-2xl sm:text-4xl font-bold text-red-900">{stats.missing}</p>
              <p className="text-xs sm:text-sm font-semibold text-red-700 uppercase mt-1">Missing</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Assignments List */}
      {selectedStudentId && (
        <div className="space-y-3 sm:space-y-4">
          <h2 className="text-xl sm:text-2xl font-bold text-gray-900">📋 Assignment List</h2>
          
          {studentAssignments.map((assignment) => {
            const status = getAssignmentStatus(assignment);
            const StatusIcon = status.icon;
            const dueDate = new Date(assignment.due_date);
            const submission = submissions.find(s => 
              s.assignment_id === assignment.id && s.student_id === selectedStudentId
            );

            const isMissing = status.label === 'MISSING';
            
            return (
              <Card 
                key={assignment.id} 
                className={`border-2 transition-all ${
                  isMissing 
                    ? 'bg-red-50 border-red-300 shadow-md' 
                    : 'border-gray-200 hover:border-blue-200'
                }`}
              >
                <CardContent className="p-4 sm:p-6">
                  <div className="space-y-3 sm:space-y-4">
                    {/* Title and Status */}
                    <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2 sm:gap-4">
                      <h3 className="text-lg sm:text-2xl font-bold text-gray-900 flex-1">{assignment.title}</h3>
                      <Badge className={`${status.color} px-3 sm:px-4 py-1 sm:py-1.5 rounded-full font-semibold border-2 flex items-center gap-1 sm:gap-2 w-fit text-xs sm:text-sm`}>
                        <StatusIcon className="w-3 h-3 sm:w-4 sm:h-4" />
                        {status.label}
                      </Badge>
                    </div>

                    {/* Due Date */}
                    <div className="flex items-center gap-2 text-gray-700">
                      <Clock className="w-4 h-4 sm:w-5 sm:h-5 text-gray-500" />
                      <span className="font-semibold text-xs sm:text-sm">Due:</span>
                      <span className="text-xs sm:text-sm">{format(dueDate, 'EEEE, MMMM dd, yyyy \'at\' h:mm a')}</span>
                    </div>

                    {/* Grade (if graded) */}
                    {submission?.status === 'Graded' && (
                      <div className="bg-gradient-to-br from-green-50 to-green-100 p-3 sm:p-4 rounded-xl border-2 border-green-200">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-green-900 font-bold text-sm sm:text-lg">Grade Received:</span>
                          <span className="text-2xl sm:text-3xl font-bold text-green-600">
                            {submission.grade}/{assignment.max_points}
                          </span>
                        </div>
                        <div className="text-xs sm:text-sm text-gray-600">
                          {((submission.grade / assignment.max_points) * 100).toFixed(1)}%
                        </div>
                      </div>
                    )}

                    {/* Teacher Feedback */}
                    {submission?.feedback && (
                      <div className="bg-blue-50 p-3 sm:p-4 rounded-xl border-2 border-blue-200">
                        <p className="text-xs sm:text-sm font-bold text-blue-900 mb-2">Teacher Feedback:</p>
                        <p className="text-sm sm:text-base text-gray-800 leading-relaxed">{submission.feedback}</p>
                      </div>
                    )}

                    {/* Missing Warning */}
                    {isMissing && (
                      <div className="bg-red-100 p-3 sm:p-4 rounded-xl border-2 border-red-300 flex items-start gap-2 sm:gap-3">
                        <AlertTriangle className="w-5 h-5 sm:w-6 sm:h-6 text-red-600 flex-shrink-0 mt-0.5" />
                        <div>
                          <p className="font-bold text-sm sm:text-base text-red-900">Assignment Not Submitted</p>
                          <p className="text-xs sm:text-sm text-red-700 mt-1">This assignment was due and has not been completed.</p>
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}

          {studentAssignments.length === 0 && (
            <Card className="border-2 border-dashed border-gray-300">
              <CardContent className="p-8 sm:p-16 text-center">
                <div className="w-24 h-24 sm:w-32 sm:h-32 bg-gradient-to-br from-green-100 to-blue-100 rounded-full flex items-center justify-center mx-auto mb-4 sm:mb-6">
                  <span className="text-5xl sm:text-7xl">✅</span>
                </div>
                <h3 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2 sm:mb-3">All Caught Up!</h3>
                <p className="text-base sm:text-lg text-gray-600">No assignments found for this student.</p>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {!selectedStudentId && (
        <Card className="border-2 border-dashed border-gray-300">
          <CardContent className="p-8 sm:p-12 text-center">
            <AlertTriangle className="w-16 h-16 sm:w-20 sm:h-20 text-gray-300 mx-auto mb-3 sm:mb-4" />
            <p className="text-base sm:text-xl text-gray-500">Please select a child to view assignments</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}