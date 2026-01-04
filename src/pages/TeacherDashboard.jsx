import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BookOpen, Users, ClipboardList, Award, Brain, Target, Calendar as CalendarIcon, TrendingUp } from 'lucide-react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '../utils';
import { Badge } from '@/components/ui/badge';

export default function TeacherDashboard() {
  const [user, setUser] = useState(null);
  const [teacherProfile, setTeacherProfile] = useState(null);

  useEffect(() => {
    const fetchUser = async () => {
      const currentUser = await base44.auth.me();
      setUser(currentUser);
      
      // Fetch teacher profile
      if (currentUser?.teacher_profile_id) {
        const profile = await base44.entities.Teacher.get(currentUser.teacher_profile_id);
        setTeacherProfile(profile);
      } else if (currentUser?.id) {
        const teachers = await base44.entities.Teacher.filter({ user_id: currentUser.id });
        setTeacherProfile(teachers[0]);
      }
    };
    fetchUser();
  }, []);

  const { data: classes = [] } = useQuery({
    queryKey: ['teacher-classes', user?.id],
    queryFn: async () => {
      const allClasses = await base44.entities.Class.list();
      return user ? allClasses.filter(c => c.teacher_id === user.id) : [];
    },
    enabled: !!user,
  });

  const { data: assignments = [] } = useQuery({
    queryKey: ['teacher-assignments', user?.id],
    queryFn: async () => {
      const allAssignments = await base44.entities.Assignment.list('-created_date');
      return user ? allAssignments.filter(a => a.teacher_id === user.id).slice(0, 10) : [];
    },
    enabled: !!user,
  });

  const { data: submissions = [] } = useQuery({
    queryKey: ['submissions'],
    queryFn: () => base44.entities.Submission.list(),
  });

  const pendingGrading = submissions.filter(s => s.status === 'Submitted').length;

  const stats = [
    {
      title: 'My Classes',
      value: classes.filter(c => c.status === 'Active').length,
      icon: BookOpen,
      color: 'bg-blue-500',
      link: 'MyClasses',
    },
    {
      title: 'Active Assignments',
      value: assignments.filter(a => a.status === 'Published').length,
      icon: ClipboardList,
      color: 'bg-green-500',
      link: 'TeacherAssignments',
    },
    {
      title: 'Pending Grading',
      value: pendingGrading,
      icon: Award,
      color: 'bg-purple-500',
      link: 'Gradebook',
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Teacher Dashboard</h1>
        <p className="text-gray-600 mt-1">Welcome back! Here's your overview</p>
      </div>

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

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="bg-white border-0 shadow-md">
          <CardHeader>
            <CardTitle className="text-xl">Recent Assignments</CardTitle>
          </CardHeader>
          <CardContent>
            {assignments.length === 0 ? (
              <div className="text-center py-8">
                <ClipboardList className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                <p className="text-gray-600">No assignments yet</p>
                <Link to={createPageUrl('TeacherAssignments')}>
                  <button className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                    Create Assignment
                  </button>
                </Link>
              </div>
            ) : (
              <div className="space-y-3">
                {assignments.slice(0, 5).map((assignment) => (
                  <div
                    key={assignment.id}
                    className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                  >
                    <div>
                      <h4 className="font-semibold text-gray-900">{assignment.title}</h4>
                      <p className="text-sm text-gray-600">{assignment.class_name}</p>
                    </div>
                    <Badge className="bg-blue-100 text-blue-800">{assignment.status}</Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-indigo-500 to-purple-600 text-white border-0 shadow-md">
          <CardHeader>
            <CardTitle className="text-xl flex items-center gap-2">
              <Brain className="w-6 h-6" />
              AI-Powered Features
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <Link to={createPageUrl('AIGradingAssistant')} className="block p-3 bg-white/10 rounded-lg hover:bg-white/20 transition-colors">
                <h3 className="font-semibold flex items-center gap-2">
                  <Award className="w-5 h-5" />
                  AI Grading Assistant
                </h3>
                <p className="text-sm text-white/80 mt-1">Get grading suggestions based on rubrics</p>
              </Link>
              <Link to={createPageUrl('StudentProgressTracking')} className="block p-3 bg-white/10 rounded-lg hover:bg-white/20 transition-colors">
                <h3 className="font-semibold flex items-center gap-2">
                  <Target className="w-5 h-5" />
                  Student Progress Tracking
                </h3>
                <p className="text-sm text-white/80 mt-1">Set goals and track student progress</p>
              </Link>
              <Link to={createPageUrl('AILessonPlanner')} className="block p-3 bg-white/10 rounded-lg hover:bg-white/20 transition-colors">
                <h3 className="font-semibold flex items-center gap-2">
                  <CalendarIcon className="w-5 h-5" />
                  AI Lesson Planner
                </h3>
                <p className="text-sm text-white/80 mt-1">Generate lesson plans from curriculum</p>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="bg-white border-0 shadow-md">
        <CardHeader>
          <CardTitle className="text-xl">Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Link
              to={createPageUrl('TeacherSchedule')}
              className="p-4 border-2 border-gray-200 rounded-lg hover:border-indigo-500 hover:shadow-md transition-all"
            >
              <CalendarIcon className="w-8 h-8 text-indigo-600 mb-2" />
              <h3 className="font-semibold text-gray-900">My Schedule</h3>
              <p className="text-sm text-gray-600 mt-1">View your teaching timetable</p>
            </Link>
            <Link
              to={createPageUrl('AttendanceTaking')}
              className="p-4 border-2 border-gray-200 rounded-lg hover:border-blue-500 hover:shadow-md transition-all"
            >
              <Users className="w-8 h-8 text-blue-600 mb-2" />
              <h3 className="font-semibold text-gray-900">Take Attendance</h3>
              <p className="text-sm text-gray-600 mt-1">Mark student attendance</p>
            </Link>
            <Link
              to={createPageUrl('TeacherAssignments')}
              className="p-4 border-2 border-gray-200 rounded-lg hover:border-green-500 hover:shadow-md transition-all"
            >
              <ClipboardList className="w-8 h-8 text-green-600 mb-2" />
              <h3 className="font-semibold text-gray-900">Create Assignment</h3>
              <p className="text-sm text-gray-600 mt-1">Add new homework or task</p>
            </Link>
            <Link
              to={createPageUrl('Gradebook')}
              className="p-4 border-2 border-gray-200 rounded-lg hover:border-purple-500 hover:shadow-md transition-all"
            >
              <Award className="w-8 h-8 text-purple-600 mb-2" />
              <h3 className="font-semibold text-gray-900">View Gradebook</h3>
              <p className="text-sm text-gray-600 mt-1">Grade assignments and tests</p>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}