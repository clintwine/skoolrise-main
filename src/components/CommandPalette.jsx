import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '../utils';
import { 
  Home, Users, BookOpen, Calendar, ClipboardList, FileText, 
  BarChart3, Settings, GraduationCap, DollarSign, Mail, Award,
  TrendingUp, Building2, MessageSquare, Bell, Camera, Plus
} from 'lucide-react';

const navigationItems = [
  // Admin
  { name: 'Admin Dashboard', path: 'AdminDashboard', icon: BarChart3, category: 'Navigation', role: 'admin' },
  { name: 'User Management', path: 'UserManagement', icon: Users, category: 'Admin', role: 'admin' },
  { name: 'Academic Sessions', path: 'AcademicSessions', icon: Calendar, category: 'Admin', role: 'admin' },
  { name: 'Student Records', path: 'StudentRecords', icon: Users, category: 'Admin', role: 'admin' },
  { name: 'Teacher Management', path: 'TeacherManagement', icon: Users, category: 'Admin', role: 'admin' },
  { name: 'Class Management', path: 'ClassManagement', icon: GraduationCap, category: 'Admin', role: 'admin' },
  { name: 'Attendance Management', path: 'AttendanceManagement', icon: ClipboardList, category: 'Admin', role: 'admin' },
  { name: 'Fees Management', path: 'FeesManagement', icon: DollarSign, category: 'Admin', role: 'admin' },
  { name: 'Reports', path: 'Reports', icon: TrendingUp, category: 'Admin', role: 'admin' },
  { name: 'Settings', path: 'Settings', icon: Settings, category: 'Admin', role: 'admin' },
  
  // Teacher
  { name: 'Teacher Dashboard', path: 'TeacherDashboard', icon: BarChart3, category: 'Navigation', role: 'teacher' },
  { name: 'My Classes', path: 'MyClasses', icon: GraduationCap, category: 'Teaching', role: 'teacher' },
  { name: 'Assignments', path: 'TeacherAssignments', icon: ClipboardList, category: 'Teaching', role: 'teacher' },
  { name: 'Take Attendance', path: 'AttendanceTaking', icon: ClipboardList, category: 'Teaching', role: 'teacher' },
  { name: 'Gradebook', path: 'Gradebook', icon: Award, category: 'Teaching', role: 'teacher' },
  
  // Student
  { name: 'Student Dashboard', path: 'StudentDashboard', icon: BarChart3, category: 'Navigation', role: 'student' },
  { name: 'My Classes', path: 'StudentClasses', icon: GraduationCap, category: 'Learning', role: 'student' },
  { name: 'My Homework', path: 'StudentAssignments', icon: ClipboardList, category: 'Learning', role: 'student' },
  { name: 'Tests', path: 'StudentTests', icon: FileText, category: 'Learning', role: 'student' },
  { name: 'Grades', path: 'StudentGrades', icon: Award, category: 'Learning', role: 'student' },
  { name: 'Profile', path: 'StudentProfile', icon: Users, category: 'Learning', role: 'student' },
  
  // Parent
  { name: 'Parent Portal', path: 'ParentPortal', icon: Home, category: 'Navigation', role: 'parent' },
  { name: 'My Children', path: 'ParentStudentView', icon: Users, category: 'Parent', role: 'parent' },
  { name: 'Fees & Payments', path: 'ParentFees', icon: DollarSign, category: 'Parent', role: 'parent' },
  { name: 'Attendance', path: 'ParentAttendance', icon: ClipboardList, category: 'Parent', role: 'parent' },
  { name: 'Reports', path: 'ParentReports', icon: FileText, category: 'Parent', role: 'parent' },
];

export default function CommandPalette({ isOpen, onClose, userRole }) {
  const [search, setSearch] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
      return () => document.removeEventListener('keydown', handleKeyDown);
    }
  }, [isOpen, onClose]);

  const filteredItems = navigationItems.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(search.toLowerCase());
    const matchesRole = item.role === userRole || item.role === 'admin' && userRole === 'admin';
    return matchesSearch && matchesRole;
  });

  const groupedItems = filteredItems.reduce((acc, item) => {
    if (!acc[item.category]) acc[item.category] = [];
    acc[item.category].push(item);
    return acc;
  }, {});

  const handleNavigate = (path) => {
    navigate(createPageUrl(path));
    onClose();
    setSearch('');
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="p-0 max-w-2xl bg-white rounded-2xl shadow-2xl border-0">
        <div className="p-4 border-b">
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search pages... (Cmd+K to close)"
            className="border-0 focus:ring-0 text-lg"
            autoFocus
          />
        </div>
        <div className="max-h-96 overflow-y-auto p-2">
          {Object.keys(groupedItems).length === 0 ? (
            <div className="p-8 text-center text-gray-500">No results found</div>
          ) : (
            Object.entries(groupedItems).map(([category, items]) => (
              <div key={category} className="mb-4">
                <div className="px-3 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  {category}
                </div>
                <div className="space-y-1">
                  {items.map((item) => {
                    const Icon = item.icon;
                    return (
                      <button
                        key={item.path}
                        onClick={() => handleNavigate(item.path)}
                        className="w-full flex items-center gap-3 px-3 py-3 rounded-xl hover:bg-gray-100 transition-colors text-left group"
                      >
                        <Icon className="w-5 h-5 text-gray-400 group-hover:text-accent transition-colors" />
                        <span className="font-medium text-gray-900">{item.name}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            ))
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}