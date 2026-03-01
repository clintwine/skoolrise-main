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
  const [studentProfile, setStudentProfile] = useState(null);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const currentUser = await base44.auth.me();
        setUser(currentUser);
        
        // Fetch student profile
        if (currentUser?.student_profile_id) {
          const profile = await base44.entities.Student.get(currentUser.student_profile_id);
          setStudentProfile(profile);
        } else if (currentUser?.id) {
          const students = await base44.entities.Student.filter({ user_id: currentUser.id });
          setStudentProfile(students[0]);
        }
      } catch (error) {
        console.error('Error fetching user:', error);
      }
    };
    fetchUser();
  }, []);

  const { data: enrollments = [] } = useQuery({
    queryKey: ['student-enrollments', studentProfile?.id],
    queryFn: async () => {
      if (!studentProfile?.id) return [];
      return await base44.entities.Enrollment.filter({ student_id: studentProfile.id });
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
    <div className="space-y-4 sm:space-y-6 px-2 sm:px-0">
      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Student Dashboard</h1>
        <p className="text-sm sm:text-base text-gray-600 mt-1">Welcome back! Here's your learning overview</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 lg:gap-6">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <Link key={stat.title} to={createPageUrl(stat.link)}>
              <Card className="hover:shadow-lg transition-shadow duration-200 cursor-pointer bg-white border-0">
                <CardContent className="p-4 sm:p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs sm:text-sm font-medium text-gray-600">{stat.title}</p>
                      <p className="text-xl sm:text-3xl font-bold text-gray-900 mt-1 sm:mt-2">{stat.value}</p>
                    </div>
                    <div className={`${stat.color} p-2 sm:p-3 rounded-lg`}>
                      <Icon className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
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
        <CardHeader className="p-4 sm:p-6">
          <CardTitle className="text-lg sm:text-xl">Upcoming Assignments</CardTitle>
        </CardHeader>
        <CardContent className="p-4 sm:p-6 pt-0">
          {assignments.length === 0 ? (
            <div className="text-center py-6 sm:py-8">
              <ClipboardList className="w-10 h-10 sm:w-12 sm:h-12 text-gray-400 mx-auto mb-3" />
              <p className="text-sm sm:text-base text-gray-600">No assignments at the moment</p>
            </div>
          ) : (
            <div className="space-y-2 sm:space-y-3">
              {assignments.slice(0, 5).map((assignment) => (
                <div
                  key={assignment.id}
                  className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-3 sm:p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors gap-2"
                >
                  <div className="flex-1 min-w-0">
                    <h4 className="font-semibold text-gray-900 text-sm sm:text-base truncate">{assignment.title}</h4>
                    <p className="text-xs sm:text-sm text-gray-600 truncate">{assignment.class_name}</p>
                  </div>
                  <div className="flex items-center justify-between sm:justify-end sm:text-right gap-2">
                    <div className="flex items-center gap-1 text-xs sm:text-sm text-gray-600">
                      <Calendar className="w-3 h-3 sm:w-4 sm:h-4" />
                      <span>
                        {assignment.due_date
                          ? format(new Date(assignment.due_date), 'MMM d')
                          : 'No due date'}
                      </span>
                    </div>
                    {assignment.max_points && (
                      <p className="text-xs sm:text-sm font-medium text-gray-900">
                        {assignment.max_points} pts
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
        <CardHeader className="p-4 sm:p-6">
          <CardTitle className="text-lg sm:text-xl">My Classes</CardTitle>
        </CardHeader>
        <CardContent className="p-4 sm:p-6 pt-0">
          {enrollments.length === 0 ? (
            <div className="text-center py-6 sm:py-8">
              <BookOpen className="w-10 h-10 sm:w-12 sm:h-12 text-gray-400 mx-auto mb-3" />
              <p className="text-sm sm:text-base text-gray-600">No classes enrolled yet</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
              {enrollments.filter(e => e.status === 'Enrolled').slice(0, 6).map((enrollment) => (
                <div
                  key={enrollment.id}
                  className="p-3 sm:p-4 bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg border border-blue-200"
                >
                  <BookOpen className="w-6 h-6 sm:w-8 sm:h-8 text-blue-600 mb-2" />
                  <h4 className="font-semibold text-gray-900 text-sm sm:text-base truncate">{enrollment.class_name}</h4>
                  <p className="text-xs sm:text-sm text-gray-600 mt-1">
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