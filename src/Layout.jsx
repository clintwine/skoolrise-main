import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from './utils';
import { base44 } from '@/api/base44Client';
import {
  GraduationCap,
  Users,
  BookOpen,
  Calendar,
  ClipboardList,
  FileText,
  BarChart3,
  Settings,
  Menu,
  X,
  LogOut,
  UserCircle,
  Award,
  CheckSquare
} from 'lucide-react';

export default function Layout({ children, currentPageName }) {
  const [user, setUser] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const currentUser = await base44.auth.me();
        setUser(currentUser);
      } catch (error) {
        console.error('Failed to fetch user:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchUser();
  }, []);

  const handleLogout = () => {
    base44.auth.logout();
  };

  // Navigation items based on user role
  const getNavigationItems = () => {
    if (!user) return [];

    const adminItems = [
      { name: 'Dashboard', icon: BarChart3, path: 'AdminDashboard' },
      { name: 'Students', icon: Users, path: 'StudentRecords' },
      { name: 'Teachers', icon: UserCircle, path: 'TeacherManagement' },
      { name: 'Courses', icon: BookOpen, path: 'CourseManagement' },
      { name: 'Classes', icon: GraduationCap, path: 'ClassManagement' },
      { name: 'Attendance', icon: CheckSquare, path: 'AttendanceManagement' },
      { name: 'Assignments', icon: ClipboardList, path: 'AssignmentManagement' },
      { name: 'Tests (CBT)', icon: FileText, path: 'TestManagement' },
      { name: 'Behavior', icon: Award, path: 'BehaviorManagement' },
      { name: 'Reports', icon: BarChart3, path: 'Reports' },
      { name: 'Settings', icon: Settings, path: 'Settings' },
    ];

    const teacherItems = [
      { name: 'Dashboard', icon: BarChart3, path: 'TeacherDashboard' },
      { name: 'My Classes', icon: GraduationCap, path: 'MyClasses' },
      { name: 'Attendance', icon: CheckSquare, path: 'AttendanceTaking' },
      { name: 'Assignments', icon: ClipboardList, path: 'TeacherAssignments' },
      { name: 'Tests (CBT)', icon: FileText, path: 'TeacherTests' },
      { name: 'Gradebook', icon: Award, path: 'Gradebook' },
      { name: 'Behavior', icon: Award, path: 'BehaviorTracking' },
      { name: 'Students', icon: Users, path: 'StudentRecords' },
    ];

    const studentItems = [
      { name: 'Dashboard', icon: BarChart3, path: 'StudentDashboard' },
      { name: 'My Classes', icon: GraduationCap, path: 'StudentClasses' },
      { name: 'Assignments', icon: ClipboardList, path: 'StudentAssignments' },
      { name: 'Tests', icon: FileText, path: 'StudentTests' },
      { name: 'Grades', icon: Award, path: 'StudentGrades' },
      { name: 'Attendance', icon: CheckSquare, path: 'StudentAttendance' },
      { name: 'Profile', icon: UserCircle, path: 'StudentProfile' },
    ];

    const parentItems = [
      { name: 'Dashboard', icon: BarChart3, path: 'ParentDashboard' },
      { name: 'My Children', icon: Users, path: 'ParentChildren' },
      { name: 'Attendance', icon: CheckSquare, path: 'ParentAttendance' },
      { name: 'Grades', icon: Award, path: 'ParentGrades' },
      { name: 'Behavior', icon: Award, path: 'ParentBehavior' },
    ];

    if (user.role === 'admin') return adminItems;
    // For now, treat non-admin users as teachers
    // You can extend this with custom user.user_type field later
    return teacherItems;
  };

  const navigationItems = getNavigationItems();

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      {/* Header */}
      <header className="bg-white shadow-sm sticky top-0 z-40">
        <div className="flex items-center justify-between px-4 py-3 lg:px-6">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="lg:hidden p-2 rounded-lg hover:bg-gray-100 transition-colors"
            >
              {sidebarOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
            <div className="flex items-center gap-2">
              <GraduationCap className="w-8 h-8 text-blue-600" />
              <div>
                <h1 className="text-xl font-bold text-gray-900">SchoolMIS</h1>
                <p className="text-xs text-gray-500 hidden sm:block">Management Information System</p>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right hidden sm:block">
              <p className="text-sm font-medium text-gray-900">{user?.full_name || user?.email}</p>
              <p className="text-xs text-gray-500 capitalize">{user?.role}</p>
            </div>
            <button
              onClick={handleLogout}
              className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
              title="Logout"
            >
              <LogOut className="w-5 h-5 text-gray-600" />
            </button>
          </div>
        </div>
      </header>

      <div className="flex">
        {/* Sidebar */}
        <aside
          className={`
            fixed lg:sticky top-0 left-0 z-30 h-screen
            bg-white shadow-lg transition-transform duration-300 ease-in-out
            w-64 lg:translate-x-0
            ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
          `}
        >
          <nav className="h-full overflow-y-auto pt-20 lg:pt-4 pb-6 px-3">
            <div className="space-y-1">
              {navigationItems.map((item) => {
                const Icon = item.icon;
                const isActive = currentPageName === item.path;
                return (
                  <Link
                    key={item.path}
                    to={createPageUrl(item.path)}
                    onClick={() => setSidebarOpen(false)}
                    className={`
                      flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200
                      ${
                        isActive
                          ? 'bg-blue-600 text-white shadow-md'
                          : 'text-gray-700 hover:bg-gray-100'
                      }
                    `}
                  >
                    <Icon className="w-5 h-5" />
                    <span className="font-medium">{item.name}</span>
                  </Link>
                );
              })}
            </div>
          </nav>
        </aside>

        {/* Overlay for mobile */}
        {sidebarOpen && (
          <div
            className="fixed inset-0 bg-black bg-opacity-50 z-20 lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {/* Main Content */}
        <main className="flex-1 min-h-screen">
          <div className="p-4 lg:p-8">
            {children}
          </div>
        </main>
      </div>

      {/* Custom Styling */}
      <style>{`
        :root {
          --primary: #21325E;
          --secondary: #3B82F6;
          --accent: #10B981;
          --text: #1F2937;
          --background: #F8FAFC;
        }
      `}</style>
    </div>
  );
}