import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { 
  CheckCircle, Clock, AlertCircle, Award, 
  Search, Mail, Eye 
} from 'lucide-react';
import { format } from 'date-fns';

export default function AssignmentDetailSheet({ assignment, open, onOpenChange }) {
  const [searchQuery, setSearchQuery] = useState('');

  const { data: enrollments = [] } = useQuery({
    queryKey: ['enrollments', assignment?.class_id],
    queryFn: async () => {
      if (!assignment?.class_id) return [];
      return await base44.entities.Enrollment.filter({ class_id: assignment.class_id });
    },
    enabled: !!assignment?.class_id && open,
  });

  const { data: submissions = [] } = useQuery({
    queryKey: ['submissions', assignment?.id],
    queryFn: async () => {
      if (!assignment?.id) return [];
      return await base44.entities.Submission.filter({ assignment_id: assignment.id });
    },
    enabled: !!assignment?.id && open,
  });

  const { data: students = [] } = useQuery({
    queryKey: ['students-for-assignment'],
    queryFn: () => base44.entities.Student.list(),
    enabled: open,
  });

  const getStudentSubmission = (studentId) => {
    return submissions.find(s => s.student_id === studentId);
  };

  const enrolledStudents = enrollments
    .map(e => students.find(s => s.id === e.student_id))
    .filter(Boolean);

  const filteredStudents = enrolledStudents.filter(s =>
    searchQuery ? 
      `${s.first_name} ${s.last_name}`.toLowerCase().includes(searchQuery.toLowerCase()) : 
      true
  );

  const submittedCount = submissions.filter(s => s.status === 'Submitted' || s.status === 'Graded').length;
  const gradedCount = submissions.filter(s => s.status === 'Graded').length;
  const missingCount = enrolledStudents.length - submittedCount;
  const averageScore = gradedCount > 0 
    ? (submissions.filter(s => s.status === 'Graded').reduce((sum, s) => sum + (s.grade || 0), 0) / gradedCount).toFixed(1)
    : 0;

  if (!assignment) return null;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-[800px] overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="text-2xl font-bold">{assignment.title}</SheetTitle>
          <p className="text-sm text-text-secondary">{assignment.class_name}</p>
        </SheetHeader>

        <div className="mt-6 space-y-6">
          {/* Summary Stats */}
          <div className="grid grid-cols-4 gap-3">
            <Card className="bg-blue-50 border-blue-200">
              <CardContent className="p-4 text-center">
                <CheckCircle className="w-8 h-8 text-blue-600 mx-auto mb-2" />
                <p className="text-2xl font-bold text-blue-900">{submittedCount}</p>
                <p className="text-xs text-blue-700">Submitted</p>
              </CardContent>
            </Card>
            <Card className="bg-green-50 border-green-200">
              <CardContent className="p-4 text-center">
                <Award className="w-8 h-8 text-green-600 mx-auto mb-2" />
                <p className="text-2xl font-bold text-green-900">{gradedCount}</p>
                <p className="text-xs text-green-700">Graded</p>
              </CardContent>
            </Card>
            <Card className="bg-red-50 border-red-200">
              <CardContent className="p-4 text-center">
                <AlertCircle className="w-8 h-8 text-red-600 mx-auto mb-2" />
                <p className="text-2xl font-bold text-red-900">{missingCount}</p>
                <p className="text-xs text-red-700">Missing</p>
              </CardContent>
            </Card>
            <Card className="bg-purple-50 border-purple-200">
              <CardContent className="p-4 text-center">
                <Award className="w-8 h-8 text-purple-600 mx-auto mb-2" />
                <p className="text-2xl font-bold text-purple-900">{averageScore}%</p>
                <p className="text-xs text-purple-700">Average</p>
              </CardContent>
            </Card>
          </div>

          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
            <Input
              placeholder="Search students..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Student Table */}
          <div className="space-y-2">
            {filteredStudents.map((student) => {
              const submission = getStudentSubmission(student.id);
              const status = submission 
                ? submission.status 
                : new Date(assignment.due_date) < new Date() 
                  ? 'Missing' 
                  : 'Pending';

              return (
                <Card key={student.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <p className="font-semibold text-text">
                          {student.first_name} {student.last_name}
                        </p>
                        <p className="text-sm text-text-secondary">
                          {student.student_id_number}
                        </p>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <Badge className={
                            status === 'Graded' ? 'bg-green-100 text-green-800' :
                            status === 'Submitted' ? 'bg-blue-100 text-blue-800' :
                            status === 'Missing' ? 'bg-red-100 text-red-800' :
                            'bg-gray-100 text-gray-800'
                          }>
                            {status}
                          </Badge>
                          {submission?.submitted_date && (
                            <p className="text-xs text-text-secondary mt-1">
                              {format(new Date(submission.submitted_date), 'MMM d, h:mm a')}
                            </p>
                          )}
                          {submission?.grade && (
                            <p className="text-lg font-bold text-text mt-1">
                              {submission.grade}/{assignment.max_points}
                            </p>
                          )}
                        </div>
                        <div className="flex gap-2">
                          {submission && (
                            <Button size="sm" variant="outline">
                              <Eye className="w-3 h-3 mr-1" />
                              {submission.status === 'Graded' ? 'Review' : 'Grade'}
                            </Button>
                          )}
                          {!submission && (
                            <Button size="sm" variant="outline">
                              <Mail className="w-3 h-3 mr-1" />
                              Remind
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}