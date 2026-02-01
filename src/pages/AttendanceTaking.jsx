import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { BookOpen, School, LogOut } from 'lucide-react';
import ClassAttendance from '../components/attendance/ClassAttendance';
import SchoolAttendance from '../components/attendance/SchoolAttendance';
import StudentExit from '../components/attendance/StudentExit';

export default function AttendanceTaking() {
  const [activeTab, setActiveTab] = useState('class');

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Attendance Management</h1>
        <p className="text-gray-600 mt-1">Manage class attendance, school arrivals, and student exits</p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3 lg:w-auto lg:inline-flex">
          <TabsTrigger value="class" className="flex items-center gap-2">
            <BookOpen className="w-4 h-4" />
            <span className="hidden sm:inline">Class Attendance</span>
            <span className="sm:hidden">Class</span>
          </TabsTrigger>
          <TabsTrigger value="school" className="flex items-center gap-2">
            <School className="w-4 h-4" />
            <span className="hidden sm:inline">School Attendance</span>
            <span className="sm:hidden">School</span>
          </TabsTrigger>
          <TabsTrigger value="exit" className="flex items-center gap-2">
            <LogOut className="w-4 h-4" />
            <span className="hidden sm:inline">Student Exit</span>
            <span className="sm:hidden">Exit</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="class" className="mt-6">
          <ClassAttendance />
        </TabsContent>

        <TabsContent value="school" className="mt-6">
          <SchoolAttendance />
        </TabsContent>

        <TabsContent value="exit" className="mt-6">
          <StudentExit />
        </TabsContent>
      </Tabs>
    </div>
  );
}