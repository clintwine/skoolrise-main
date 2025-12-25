import React from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BookOpen, Users, ClipboardList, Award } from 'lucide-react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '../utils';

export default function TeacherDashboard() {
  const { data: classes = [] } = useQuery({
    queryKey: ['teacher-classes'],
    queryFn: () => base44.entities.Class.list(),
  });

  const { data: assignments = [] } = useQuery({
    queryKey: ['teacher-assignments'],
    queryFn: () => base44.entities.Assignment.list('-created_date', 10),
  });

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
      title: 'Tests Created',
      value: 0,
      icon: Award,
      color: 'bg-purple-500',
      link: 'TeacherTests',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Teacher Dashboard</h1>
        <p className="text-gray-600 mt-1">Welcome back! Here's your overview</p>
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

      {/* Recent Assignments */}
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
                  <div className="text-right">
                    <p className="text-sm text-gray-600">Due Date</p>
                    <p className="font-medium text-gray-900">{assignment.due_date}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <Card className="bg-white border-0 shadow-md">
        <CardHeader>
          <CardTitle className="text-xl">Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
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