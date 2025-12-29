import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
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

  const { data: parents = [] } = useQuery({
    queryKey: ['parents'],
    queryFn: () => base44.entities.Parent.list(),
    enabled: !!user,
  });

  const currentParent = parents.find(p => p.user_id === user?.id);

  const { data: allStudents = [] } = useQuery({
    queryKey: ['all-students'],
    queryFn: () => base44.entities.Student.list(),
  });

  const myChildren = allStudents.filter(s => s.parent_id === currentParent?.id);

  const { data: enrollments = [] } = useQuery({
    queryKey: ['child-enrollments'],
    queryFn: () => base44.entities.Enrollment.list(),
    enabled: myChildren.length > 0,
  });

  const { data: allAssignments = [] } = useQuery({
    queryKey: ['all-assignments'],
    queryFn: () => base44.entities.Assignment.list(),
  });

  const { data: submissions = [] } = useQuery({
    queryKey: ['child-submissions'],
    queryFn: () => base44.entities.Submission.list(),
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
          color: 'bg-green-500 text-white',
          icon: CheckCircle,
        };
      }
      if (submission.is_late) {
        return {
          label: 'Submitted Late',
          color: 'bg-orange-500 text-white',
          icon: Clock,
        };
      }
      return {
        label: 'Submitted',
        color: 'bg-blue-500 text-white',
        icon: CheckCircle,
      };
    }

    if (isPast(dueDate)) {
      return {
        label: 'MISSING',
        color: 'bg-red-500 text-white text-lg font-bold',
        icon: XCircle,
      };
    }

    return {
      label: 'Not Submitted',
      color: 'bg-gray-400 text-white',
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
    <div className="space-y-6 p-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="text-center mb-8">
        <h1 className="text-5xl font-bold text-gray-900 mb-2" style={{ fontFamily: 'Inter, sans-serif' }}>
          👪 My Child's Assignments
        </h1>
        <p className="text-gray-600 text-xl">Track your child's progress</p>
      </div>

      {/* Child Selector */}
      <Card className="bg-gradient-to-br from-purple-50 to-blue-50 border-2 border-purple-200">
        <CardContent className="p-6">
          <label className="text-lg font-semibold text-gray-900 block mb-3">Select Child:</label>
          <Select value={selectedStudentId} onValueChange={setSelectedStudentId}>
            <SelectTrigger className="text-xl p-6 rounded-xl border-2 bg-white">
              <SelectValue placeholder="Choose a child" />
            </SelectTrigger>
            <SelectContent>
              {myChildren.map((child) => (
                <SelectItem key={child.id} value={child.id} className="text-lg">
                  {child.first_name} {child.last_name} - {child.grade_level}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {/* Stats */}
      {selectedStudentId && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="bg-blue-50 border-2 border-blue-200">
            <CardContent className="p-6 text-center">
              <p className="text-4xl font-bold text-blue-900">{stats.total}</p>
              <p className="text-sm font-semibold text-blue-700 uppercase mt-1">Total</p>
            </CardContent>
          </Card>

          <Card className="bg-green-50 border-2 border-green-200">
            <CardContent className="p-6 text-center">
              <p className="text-4xl font-bold text-green-900">{stats.submitted}</p>
              <p className="text-sm font-semibold text-green-700 uppercase mt-1">Submitted</p>
            </CardContent>
          </Card>

          <Card className="bg-purple-50 border-2 border-purple-200">
            <CardContent className="p-6 text-center">
              <p className="text-4xl font-bold text-purple-900">{stats.graded}</p>
              <p className="text-sm font-semibold text-purple-700 uppercase mt-1">Graded</p>
            </CardContent>
          </Card>

          <Card className="bg-red-50 border-2 border-red-200">
            <CardContent className="p-6 text-center">
              <p className="text-4xl font-bold text-red-900">{stats.missing}</p>
              <p className="text-sm font-semibold text-red-700 uppercase mt-1">Missing</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Assignments List */}
      {selectedStudentId && (
        <div className="space-y-4">
          <h2 className="text-2xl font-bold text-gray-900">📋 Assignment List</h2>
          
          {studentAssignments.map((assignment) => {
            const status = getAssignmentStatus(assignment);
            const StatusIcon = status.icon;
            const dueDate = new Date(assignment.due_date);
            const submission = submissions.find(s => 
              s.assignment_id === assignment.id && s.student_id === selectedStudentId
            );

            return (
              <Card key={assignment.id} className="border-2 border-gray-200">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-2xl font-bold text-gray-900">{assignment.title}</h3>
                        <Badge className={`${status.color} px-4 py-1 flex items-center gap-2`}>
                          <StatusIcon className="w-4 h-4" />
                          {status.label}
                        </Badge>
                      </div>
                      
                      <p className="text-gray-600 mb-3">{assignment.class_name}</p>
                      
                      <div className="flex gap-4 text-sm mb-3">
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

                      {submission?.status === 'Graded' && (
                        <div className="bg-green-50 p-4 rounded-xl border-2 border-green-200">
                          <div className="flex items-center justify-between">
                            <span className="text-green-900 font-semibold">Grade Received:</span>
                            <span className="text-3xl font-bold text-green-600">
                              {submission.grade}/{assignment.max_points}
                            </span>
                          </div>
                          {submission.feedback && (
                            <div className="mt-2 text-sm text-gray-700">
                              <span className="font-semibold">Teacher Feedback: </span>
                              {submission.feedback}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}

          {studentAssignments.length === 0 && (
            <Card className="border-2 border-dashed border-gray-300">
              <CardContent className="p-12 text-center">
                <CheckCircle className="w-20 h-20 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500 text-xl">No assignments found</p>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {!selectedStudentId && (
        <Card className="border-2 border-dashed border-gray-300">
          <CardContent className="p-12 text-center">
            <AlertTriangle className="w-20 h-20 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500 text-xl">Please select a child to view assignments</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}