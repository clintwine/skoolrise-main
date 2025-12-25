import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, GraduationCap, BookOpen, TrendingUp, CheckSquare, Award } from 'lucide-react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '../utils';

export default function AdminDashboard() {
  const { data: students = [] } = useQuery({
    queryKey: ['students'],
    queryFn: () => base44.entities.Student.list(),
  });

  const { data: teachers = [] } = useQuery({
    queryKey: ['teachers'],
    queryFn: () => base44.entities.Teacher.list(),
  });

  const { data: classes = [] } = useQuery({
    queryKey: ['classes'],
    queryFn: () => base44.entities.Class.list(),
  });

  const { data: courses = [] } = useQuery({
    queryKey: ['courses'],
    queryFn: () => base44.entities.Course.list(),
  });

  const activeStudents = students.filter(s => s.status === 'Active').length;
  const activeTeachers = teachers.filter(t => t.status === 'Active').length;
  const activeClasses = classes.filter(c => c.status === 'Active').length;
  const activeCourses = courses.filter(c => c.status === 'Active').length;

  const stats = [
    {
      title: 'Total Students',
      value: activeStudents,
      icon: Users,
      color: 'bg-blue-500',
      link: 'StudentRecords',
    },
    {
      title: 'Active Teachers',
      value: activeTeachers,
      icon: GraduationCap,
      color: 'bg-green-500',
      link: 'TeacherManagement',
    },
    {
      title: 'Active Classes',
      value: activeClasses,
      icon: BookOpen,
      color: 'bg-purple-500',
      link: 'ClassManagement',
    },
    {
      title: 'Total Courses',
      value: activeCourses,
      icon: Award,
      color: 'bg-orange-500',
      link: 'CourseManagement',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
        <p className="text-gray-600 mt-1">School overview and statistics</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
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

      {/* Quick Actions */}
      <Card className="bg-white border-0 shadow-md">
        <CardHeader>
          <CardTitle className="text-xl">Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <Link
              to={createPageUrl('StudentRecords')}
              className="p-4 border-2 border-gray-200 rounded-lg hover:border-blue-500 hover:shadow-md transition-all"
            >
              <Users className="w-8 h-8 text-blue-600 mb-2" />
              <h3 className="font-semibold text-gray-900">Manage Students</h3>
              <p className="text-sm text-gray-600 mt-1">Add, edit, or view student records</p>
            </Link>
            <Link
              to={createPageUrl('AttendanceManagement')}
              className="p-4 border-2 border-gray-200 rounded-lg hover:border-green-500 hover:shadow-md transition-all"
            >
              <CheckSquare className="w-8 h-8 text-green-600 mb-2" />
              <h3 className="font-semibold text-gray-900">Track Attendance</h3>
              <p className="text-sm text-gray-600 mt-1">Monitor student attendance records</p>
            </Link>
            <Link
              to={createPageUrl('TestManagement')}
              className="p-4 border-2 border-gray-200 rounded-lg hover:border-purple-500 hover:shadow-md transition-all"
            >
              <Award className="w-8 h-8 text-purple-600 mb-2" />
              <h3 className="font-semibold text-gray-900">Computer-Based Testing</h3>
              <p className="text-sm text-gray-600 mt-1">Create and manage tests</p>
            </Link>
            <Link
              to={createPageUrl('ClassManagement')}
              className="p-4 border-2 border-gray-200 rounded-lg hover:border-orange-500 hover:shadow-md transition-all"
            >
              <GraduationCap className="w-8 h-8 text-orange-600 mb-2" />
              <h3 className="font-semibold text-gray-900">Manage Classes</h3>
              <p className="text-sm text-gray-600 mt-1">Setup and organize classes</p>
            </Link>
            <Link
              to={createPageUrl('Reports')}
              className="p-4 border-2 border-gray-200 rounded-lg hover:border-indigo-500 hover:shadow-md transition-all"
            >
              <TrendingUp className="w-8 h-8 text-indigo-600 mb-2" />
              <h3 className="font-semibold text-gray-900">View Reports</h3>
              <p className="text-sm text-gray-600 mt-1">Analytics and insights</p>
            </Link>
            <Link
              to={createPageUrl('CourseManagement')}
              className="p-4 border-2 border-gray-200 rounded-lg hover:border-pink-500 hover:shadow-md transition-all"
            >
              <BookOpen className="w-8 h-8 text-pink-600 mb-2" />
              <h3 className="font-semibold text-gray-900">Manage Courses</h3>
              <p className="text-sm text-gray-600 mt-1">Create and update courses</p>
            </Link>
          </div>
        </CardContent>
      </Card>

      {/* Recent Activity */}
      <Card className="bg-white border-0 shadow-md">
        <CardHeader>
          <CardTitle className="text-xl">System Overview</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg">
              <div>
                <p className="font-medium text-gray-900">Total Enrolled Students</p>
                <p className="text-sm text-gray-600">Active students in the system</p>
              </div>
              <p className="text-2xl font-bold text-blue-600">{activeStudents}</p>
            </div>
            <div className="flex items-center justify-between p-4 bg-green-50 rounded-lg">
              <div>
                <p className="font-medium text-gray-900">Teaching Staff</p>
                <p className="text-sm text-gray-600">Active teachers</p>
              </div>
              <p className="text-2xl font-bold text-green-600">{activeTeachers}</p>
            </div>
            <div className="flex items-center justify-between p-4 bg-purple-50 rounded-lg">
              <div>
                <p className="font-medium text-gray-900">Active Classes</p>
                <p className="text-sm text-gray-600">Ongoing classes this term</p>
              </div>
              <p className="text-2xl font-bold text-purple-600">{activeClasses}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}