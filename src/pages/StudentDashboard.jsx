import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BookOpen, ClipboardList, FileText, Award, Calendar } from 'lucide-react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '../utils';
import { format } from 'date-fns';

export default function StudentDashboard() {
  const [user, setUser] = useState(null);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const currentUser = await base44.auth.me();
        setUser(currentUser);
      } catch (error) {
        console.error('Error fetching user:', error);
      }
    };
    fetchUser();
  }, []);

  const { data: students = [] } = useQuery({
    queryKey: ['students', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      return await base44.entities.Student.filter({ user_id: user.id });
    },
    enabled: !!user?.id,
  });

  const studentProfile = students[0];

  const { data: enrollments = [] } = useQuery({
    queryKey: ['student-enrollments', studentProfile?.id],
    queryFn: async () => {
      if (!studentProfile?.id) return [];
      const allEnrollments = await base44.entities.Enrollment.list();
      return allEnrollments.filter(e => e.student_id === studentProfile.id);
    },
    enabled: !!studentProfile?.id,
  });

  const { data: assignments = [] } = useQuery({
    queryKey: ['student-assignments', studentProfile?.id],
    queryFn: async () => {
      if (!studentProfile?.id) return [];
      const classIds = enrollments.map(e => e.class_id);
      if (classIds.length === 0) return [];
      const allAssignments = await base44.entities.Assignment.list('-due_date', 10);
      return allAssignments.filter(a => classIds.includes(a.class_id));
    },
    enabled: !!studentProfile?.id && enrollments.length > 0,
  });

  const stats = [
    {
      title: 'Enrolled Classes',
      value: enrollments.filter(e => e.status === 'Enrolled').length,
      icon: BookOpen,
      color: 'bg-blue-500',
      link: 'StudentClasses',
    },
    {
      title: 'Pending Assignments',
      value: assignments.filter(a => a.status === 'Published').length,
      icon: ClipboardList,
      color: 'bg-orange-500',
      link: 'StudentAssignments',
    },
    {
      title: 'Upcoming Tests',
      value: 0,
      icon: FileText,
      color: 'bg-purple-500',
      link: 'StudentTests',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Student Dashboard</h1>
        <p className="text-gray-600 mt-1">Welcome back! Here's your learning overview</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-6">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <Link key={stat.title} to={createPageUrl(stat.link)}>
              <Card className="hover:shadow-lg transition-shadow duration-200 cursor-pointer bg-white border-0">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">{stat.title}</p>
                      <p className="text-3xl font-bold text-gray-900 mt-2">{stat.value}</p>
                    </div>
                    <div className={`${stat.color} p-3 rounded-lg`}>
                      <Icon className="w-6 h-6 text-white" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          );
        })}
      </div>

      {/* Upcoming Assignments */}
      <Card className="bg-white border-0 shadow-md">
        <CardHeader>
          <CardTitle className="text-xl">Upcoming Assignments</CardTitle>
        </CardHeader>
        <CardContent>
          {assignments.length === 0 ? (
            <div className="text-center py-8">
              <ClipboardList className="w-12 h-12 text-gray-400 mx-auto mb-3" />
              <p className="text-gray-600">No assignments at the moment</p>
            </div>
          ) : (
            <div className="space-y-3">
              {assignments.slice(0, 5).map((assignment) => (
                <div
                  key={assignment.id}
                  className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <div className="flex-1">
                    <h4 className="font-semibold text-gray-900">{assignment.title}</h4>
                    <p className="text-sm text-gray-600">{assignment.class_name}</p>
                  </div>
                  <div className="text-right">
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Calendar className="w-4 h-4" />
                      <span>
                        {assignment.due_date
                          ? format(new Date(assignment.due_date), 'MMM d, yyyy')
                          : 'No due date'}
                      </span>
                    </div>
                    {assignment.max_points && (
                      <p className="text-sm font-medium text-gray-900 mt-1">
                        {assignment.max_points} points
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* My Classes */}
      <Card className="bg-white border-0 shadow-md">
        <CardHeader>
          <CardTitle className="text-xl">My Classes</CardTitle>
        </CardHeader>
        <CardContent>
          {enrollments.length === 0 ? (
            <div className="text-center py-8">
              <BookOpen className="w-12 h-12 text-gray-400 mx-auto mb-3" />
              <p className="text-gray-600">No classes enrolled yet</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {enrollments.filter(e => e.status === 'Enrolled').slice(0, 6).map((enrollment) => (
                <div
                  key={enrollment.id}
                  className="p-4 bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg border border-blue-200"
                >
                  <BookOpen className="w-8 h-8 text-blue-600 mb-2" />
                  <h4 className="font-semibold text-gray-900">{enrollment.class_name}</h4>
                  <p className="text-sm text-gray-600 mt-1">
                    {enrollment.final_grade ? `Grade: ${enrollment.final_grade}` : 'In Progress'}
                  </p>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}