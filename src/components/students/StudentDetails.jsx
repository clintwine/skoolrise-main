import React from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  UserCircle,
  GraduationCap,
  Calendar,
  Award,
  ClipboardList,
} from 'lucide-react';

export default function StudentDetails({ student, onEdit, onClose }) {
  const statusColors = {
    Active: 'bg-green-500 text-white',
    Inactive: 'bg-gray-100 text-gray-800',
    Suspended: 'bg-red-100 text-red-800',
    Graduated: 'bg-blue-100 text-blue-800',
    Withdrawn: 'bg-orange-100 text-orange-800',
  };

  const { data: enrollments = [] } = useQuery({
    queryKey: ['student-enrollments', student?.id],
    queryFn: () => base44.entities.Enrollment.filter({ student_id: student?.id }),
    enabled: !!student?.id,
  });

  const { data: attendance = [] } = useQuery({
    queryKey: ['student-attendance', student?.id],
    queryFn: () => base44.entities.Attendance.filter({ student_id: student?.id }),
    enabled: !!student?.id,
  });

  const { data: behavior = [] } = useQuery({
    queryKey: ['student-behavior', student?.id],
    queryFn: () => base44.entities.Behavior.filter({ student_id: student?.id }),
    enabled: !!student?.id,
  });

  const { data: reportCards = [] } = useQuery({
    queryKey: ['student-reports', student?.id],
    queryFn: () => base44.entities.ReportCard.filter({ student_id: student?.id }),
    enabled: !!student?.id,
  });

  // Calculate stats
  const presentCount = attendance.filter(a => a.status === 'Present').length;
  const attendanceRate = attendance.length > 0 
    ? ((presentCount / attendance.length) * 100).toFixed(0) 
    : 100;
  
  const behaviorPoints = behavior.reduce((sum, b) => sum + (b.points || 0), 0);
  
  const avgGrade = reportCards.length > 0
    ? (reportCards.reduce((sum, r) => sum + (r.average_score || 0), 0) / reportCards.length).toFixed(0)
    : 0;

  const getInitials = () => {
    return `${student?.first_name?.charAt(0) || ''}${student?.last_name?.charAt(0) || ''}`.toUpperCase();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start gap-4 p-4 bg-gray-50 rounded-lg">
        {student?.photo_url ? (
          <img
            src={student.photo_url}
            alt={`${student.first_name} ${student.last_name}`}
            className="w-16 h-16 rounded-full object-cover"
          />
        ) : (
          <div className="w-16 h-16 rounded-full bg-blue-100 flex items-center justify-center">
            <UserCircle className="w-10 h-10 text-blue-600" />
          </div>
        )}
        <div className="flex-1">
          <h2 className="text-xl font-bold text-gray-900">
            {student?.first_name} {student?.last_name}
          </h2>
          <p className="text-gray-600 text-sm">ID: {student?.student_id_number}</p>
          <div className="flex items-center gap-2 mt-2">
            <Badge className={statusColors[student?.status]}>
              {student?.status}
            </Badge>
            <Badge variant="outline">Grade {student?.grade_level}</Badge>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-4 gap-4">
        <Card className="bg-white border shadow-sm">
          <CardContent className="p-4 text-center">
            <div className="w-10 h-10 mx-auto mb-2 rounded-full bg-blue-100 flex items-center justify-center">
              <GraduationCap className="w-5 h-5 text-blue-600" />
            </div>
            <p className="text-2xl font-bold text-gray-900">{enrollments.length}</p>
            <p className="text-sm text-gray-500">Classes</p>
          </CardContent>
        </Card>
        
        <Card className="bg-white border shadow-sm">
          <CardContent className="p-4 text-center">
            <div className="w-10 h-10 mx-auto mb-2 rounded-full bg-green-100 flex items-center justify-center">
              <Calendar className="w-5 h-5 text-green-600" />
            </div>
            <p className="text-2xl font-bold text-gray-900">{attendanceRate}%</p>
            <p className="text-sm text-gray-500">Attendance</p>
          </CardContent>
        </Card>
        
        <Card className="bg-white border shadow-sm">
          <CardContent className="p-4 text-center">
            <div className="w-10 h-10 mx-auto mb-2 rounded-full bg-purple-100 flex items-center justify-center">
              <Award className="w-5 h-5 text-purple-600" />
            </div>
            <p className="text-2xl font-bold text-gray-900">{behaviorPoints}</p>
            <p className="text-sm text-gray-500">Behavior Pts</p>
          </CardContent>
        </Card>
        
        <Card className="bg-white border shadow-sm">
          <CardContent className="p-4 text-center">
            <div className="w-10 h-10 mx-auto mb-2 rounded-full bg-orange-100 flex items-center justify-center">
              <ClipboardList className="w-5 h-5 text-orange-600" />
            </div>
            <p className="text-2xl font-bold text-gray-900">{avgGrade}%</p>
            <p className="text-sm text-gray-500">Avg Grade</p>
          </CardContent>
        </Card>
      </div>

      {/* Enrolled Classes */}
      <Card className="bg-white border shadow-sm">
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-semibold">Enrolled Classes</CardTitle>
        </CardHeader>
        <CardContent>
          {enrollments.length === 0 ? (
            <p className="text-gray-500 text-sm">No class enrollments found</p>
          ) : (
            <div className="space-y-2">
              {enrollments.map((enrollment) => (
                <div key={enrollment.id} className="p-2 bg-gray-50 rounded-lg flex justify-between items-center">
                  <span className="font-medium text-sm">{enrollment.class_name}</span>
                  <Badge variant="outline" className="text-xs">{enrollment.status}</Badge>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Recent Behavior */}
      <Card className="bg-white border shadow-sm">
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-semibold">Recent Behavior</CardTitle>
        </CardHeader>
        <CardContent>
          {behavior.length === 0 ? (
            <p className="text-gray-500 text-sm">No behavior records found</p>
          ) : (
            <div className="space-y-2">
              {behavior.slice(0, 5).map((b) => (
                <div key={b.id} className="p-2 bg-gray-50 rounded-lg flex justify-between items-center">
                  <div>
                    <p className="font-medium text-sm">{b.type}</p>
                    <p className="text-xs text-gray-500">{b.description}</p>
                  </div>
                  <Badge className={b.points > 0 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}>
                    {b.points > 0 ? '+' : ''}{b.points} pts
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="flex justify-end gap-3 pt-4 border-t">
        <Button variant="outline" onClick={onClose}>
          Close
        </Button>
        <Button onClick={onEdit} className="bg-blue-600 hover:bg-blue-700 text-white">
          Edit Student
        </Button>
      </div>
    </div>
  );
}