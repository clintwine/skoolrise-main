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
  CheckSquare,
  ChevronDown,
  ChevronRight,
  Building2,
  BookMarked,
  TrendingUp,
  DollarSign,
  Home,
  Mail,
  Plus,
  Gift,
  MessageSquare,
  Bell
} from 'lucide-react';

export default function Layout({ children, currentPageName }) {
  const [user, setUser] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [openGroups, setOpenGroups] = useState(['workspace', 'school-setup', 'school-admin', 'academics', 'cbt', 'my-teaching', 'my-learning', 'parent-home', 'fees', 'communication']);

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

  const toggleGroup = (groupId) => {
    setOpenGroups(prev => 
      prev.includes(groupId) 
        ? prev.filter(id => id !== groupId)
        : [...prev, groupId]
    );
  };

  // Navigation items based on user role
  const getNavigationItems = () => {
    if (!user) return [];

    const vendorGroups = [
      {
        id: 'vendor-home',
        groupName: 'VENDOR PORTAL',
        items: [
          { name: 'Dashboard', icon: Home, path: 'VendorDashboard' },
          { name: 'My Profile', icon: UserCircle, path: 'VendorProfile' },
        ]
      }
    ];

    const adminGroups = [
      {
        id: 'workspace',
        groupName: 'WORKSPACE',
        items: [
          { name: 'Dashboard', icon: BarChart3, path: 'AdminDashboard' },
        ]
      },
      {
        id: 'school-setup',
        groupName: 'SCHOOL SETUP',
        items: [
          { name: 'Academic Sessions', icon: Calendar, path: 'AcademicSessions' },
          { name: 'Terms', icon: Calendar, path: 'TermsManagement' },
          { name: 'Grading Scales', icon: Award, path: 'GradingScales' },
          { name: 'Class Arms', icon: Users, path: 'ClassArms' },
          { name: 'Teachers', icon: UserCircle, path: 'TeacherManagement' },
          { name: 'Courses', icon: BookMarked, path: 'CourseManagement' },
          { name: 'Classes', icon: GraduationCap, path: 'ClassManagement' },
          { name: 'Timetables', icon: Calendar, path: 'TimetableManagement' },
          { name: 'Admissions', icon: UserCircle, path: 'AdmissionsManagement' },
        ]
      },
      {
        id: 'student-mgmt',
        groupName: 'STUDENT MANAGEMENT',
        items: [
          { name: 'Students', icon: Users, path: 'StudentRecords' },
          { name: 'Enrollments', icon: BookOpen, path: 'EnrollmentManagement' },
        ]
      },
      {
        id: 'academics',
        groupName: 'ACADEMICS & RECORDS',
        items: [
          { name: 'Attendance', icon: CheckSquare, path: 'AttendanceManagement' },
          { name: 'Biometric Attendance', icon: CheckSquare, path: 'BiometricAttendance' },
          { name: 'Assignments', icon: ClipboardList, path: 'AssignmentManagement' },
          { name: 'Behavior', icon: Award, path: 'BehaviorManagement' },
          { name: 'Behavior Analytics', icon: TrendingUp, path: 'BehaviorAnalytics' },
          { name: 'Report Cards', icon: FileText, path: 'ReportCardsManagement' },
          { name: 'Curriculum Mapping', icon: BookOpen, path: 'CurriculumMapping' },
          { name: 'Conference Scheduling', icon: Calendar, path: 'ConferenceScheduling' },
        ]
      },
      {
        id: 'cbt',
        groupName: 'CBT / EXAMINATIONS',
        items: [
          { name: 'Question Bank', icon: BookOpen, path: 'QuestionBank' },
          { name: 'Create Exam', icon: Plus, path: 'ExamCreator' },
          { name: 'Manage Exams', icon: FileText, path: 'ExamManagement' },
          { name: 'Attempt Review', icon: FileText, path: 'ExamAttemptReview' },
          { name: 'Proctoring Monitor', icon: Award, path: 'ProctoringMonitor' },
          { name: 'Exam Analytics', icon: BarChart3, path: 'DetailedExamAnalytics' },
        ]
      },
      {
        id: 'school-settings',
        groupName: 'SCHOOL BRANDING',
        items: [
          { name: 'School Info', icon: Building2, path: 'SchoolSettings' },
        ]
      },
      {
        id: 'fees',
        groupName: 'FEES & FINANCE',
        items: [
          { name: 'Fee Policies', icon: FileText, path: 'FeePolicies' },
          { name: 'Fees Management', icon: DollarSign, path: 'FeesManagement' },
          { name: 'Fee Reminders', icon: Bell, path: 'FeeReminderSystem' },
          { name: 'Instalment Plans', icon: Calendar, path: 'InstalmentPlans' },
          { name: 'Salary Management', icon: DollarSign, path: 'SalaryManagement' },
          { name: 'Expense Tracking', icon: TrendingUp, path: 'ExpenseTracking' },
        ]
      },
      {
        id: 'bookshop',
        groupName: 'BOOKSHOP',
        items: [
          { name: 'Bookshop Manager', icon: BookMarked, path: 'BookshopManager' },
          { name: 'Bookshop Reports', icon: TrendingUp, path: 'BookshopReports' },
          { name: 'Vendor Management', icon: Building2, path: 'VendorManagement' },
        ]
      },
      {
        id: 'communication',
        groupName: 'COMMUNICATION',
        items: [
          { name: 'Messaging Center', icon: Mail, path: 'MessagingCenter' },
          { name: 'Contact Lists', icon: Users, path: 'ContactLists' },
          { name: 'Delivery Reports', icon: BarChart3, path: 'DeliveryReports' },
          { name: 'Secure Messaging', icon: MessageSquare, path: 'SecureMessaging' },
          { name: 'Class Discussions', icon: MessageSquare, path: 'ClassDiscussions' },
          { name: 'Event Calendar', icon: Calendar, path: 'EventCalendar' },
        ]
      },
      {
        id: 'analytics',
        groupName: 'REPORTS & ANALYTICS',
        items: [
          { name: 'Reports', icon: TrendingUp, path: 'Reports' },
        ]
      },
      {
        id: 'settings',
        groupName: 'SYSTEM',
        items: [
          { name: 'Settings', icon: Settings, path: 'Settings' },
        ]
      }
    ];

    const teacherGroups = [
      {
        id: 'workspace',
        groupName: 'WORKSPACE',
        items: [
          { name: 'Dashboard', icon: BarChart3, path: 'TeacherDashboard' },
        ]
      },
      {
        id: 'my-teaching',
        groupName: 'MY TEACHING',
        items: [
          { name: 'My Classes', icon: GraduationCap, path: 'MyClasses' },
          { name: 'Attendance', icon: CheckSquare, path: 'AttendanceTaking' },
          { name: 'Assignments', icon: ClipboardList, path: 'TeacherAssignments' },
          { name: 'Tests (CBT)', icon: FileText, path: 'TeacherTests' },
          { name: 'Gradebook', icon: Award, path: 'Gradebook' },
          { name: 'Behavior', icon: Award, path: 'BehaviorTracking' },
          { name: 'Student Progress', icon: TrendingUp, path: 'StudentProgressTracking' },
          { name: 'Resources', icon: BookOpen, path: 'ClassroomResources' },
        ]
        },
      {
        id: 'student-overview',
        groupName: 'STUDENT OVERVIEW',
        items: [
          { name: 'Students', icon: Users, path: 'StudentRecords' },
        ]
      }
    ];

    const studentGroups = [
      {
        id: 'workspace',
        groupName: 'WORKSPACE',
        items: [
          { name: 'Dashboard', icon: BarChart3, path: 'StudentDashboard' },
        ]
      },
      {
        id: 'my-learning',
        groupName: 'MY LEARNING',
        items: [
          { name: 'My Classes', icon: GraduationCap, path: 'StudentClasses' },
          { name: 'My Homework', icon: ClipboardList, path: 'StudentAssignments' },
          { name: 'Tests', icon: FileText, path: 'StudentTests' },
          { name: 'Grades', icon: Award, path: 'StudentGrades' },
          { name: 'Rewards Store', icon: Gift, path: 'RewardsStore' },
          { name: 'Attendance', icon: CheckSquare, path: 'StudentAttendance' },
          { name: 'Profile', icon: UserCircle, path: 'StudentProfile' },
        ]
      }
    ];

    const parentGroups = [
      {
        id: 'parent-home',
        groupName: 'PARENT PORTAL',
        items: [
          { name: 'Home', icon: Home, path: 'ParentPortal' },
          { name: 'My Children', icon: Users, path: 'ParentStudentView' },
          { name: 'Calendar', icon: Calendar, path: 'ParentCalendar' },
          { name: 'Homework', icon: ClipboardList, path: 'ParentHomework' },
          { name: 'Fees & Payments', icon: DollarSign, path: 'ParentFees' },
          { name: 'Attendance', icon: CheckSquare, path: 'ParentAttendance' },
          { name: 'Reports', icon: FileText, path: 'ParentReports' },
          { name: 'Behavior', icon: Award, path: 'ParentBehavior' },
        ]
      }
    ];

    if (user.role === 'admin') return adminGroups;
    if (user.role === 'parent') return parentGroups;
    if (user.role === 'vendor' || user.vendor_id) return vendorGroups;
    return teacherGroups;
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
              <img 
                src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/69441b6bd765d833c80ac7ff/9f8b26af8_ChatGPTImageDec27202508_39_37PM.png" 
                alt="SkoolRise Logo" 
                className="h-10 object-contain"
              />
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
            <div className="space-y-6">
              {navigationItems.map((group) => {
                const isGroupOpen = openGroups.includes(group.id);
                return (
                  <div key={group.id} className="space-y-1">
                    <button
                      onClick={() => toggleGroup(group.id)}
                      className="w-full flex items-center justify-between px-3 py-2 text-xs font-semibold text-gray-500 hover:text-gray-700 transition-colors uppercase tracking-wider"
                    >
                      <span>{group.groupName}</span>
                      {isGroupOpen ? (
                        <ChevronDown className="w-4 h-4" />
                      ) : (
                        <ChevronRight className="w-4 h-4" />
                      )}
                    </button>
                    {isGroupOpen && (
                      <div className="space-y-1">
                        {group.items.map((item) => {
                          const Icon = item.icon;
                          const isActive = currentPageName === item.path;
                          return (
                            <Link
                              key={item.path}
                              to={createPageUrl(item.path)}
                              onClick={() => setSidebarOpen(false)}
                              className={`
                                flex items-center gap-3 px-4 py-2.5 rounded-lg transition-all duration-200
                                ${
                                  isActive
                                    ? 'bg-blue-600 text-white shadow-md'
                                    : 'text-gray-700 hover:bg-gray-100'
                                }
                              `}
                            >
                              <Icon className="w-5 h-5" />
                              <span className="font-medium text-sm">{item.name}</span>
                            </Link>
                          );
                        })}
                      </div>
                    )}
                  </div>
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