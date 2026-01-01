import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { createPageUrl } from './utils';
import { base44 } from '@/api/base44Client';
import { motion, AnimatePresence } from 'framer-motion';
import CommandPalette from './components/CommandPalette';
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
  LogOut as LogOutIcon,
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
  Bell,
  Camera,
  DoorOpen,
  Search
} from 'lucide-react';

export default function Layout({ children, currentPageName }) {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [commandPaletteOpen, setCommandPaletteOpen] = useState(false);
  const [openGroups, setOpenGroups] = useState(['workspace', 'school-setup', 'school-admin', 'academics', 'cbt', 'my-teaching', 'my-learning', 'parent-home', 'fees', 'communication']);

  // Public pages that don't need the layout wrapper
  const publicPages = ['LandingPage', 'PrivacyPolicy', 'TermsOfService', 'PublicApplicationForm', 'ActivationPage', 'ProfileSetupPage'];
  const isPublicPage = publicPages.includes(currentPageName);

  useEffect(() => {
    // Global keyboard shortcut for command palette
    const handleKeyDown = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setCommandPaletteOpen(true);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  useEffect(() => {
    // Skip auth check for public pages
    if (isPublicPage) {
      setLoading(false);
      return;
    }

    const fetchUser = async () => {
      try {
        const currentUser = await base44.auth.me();

        // Check activation and profile completion
        if (!currentUser.is_activated) {
          navigate(createPageUrl('ActivationPage'));
          return;
        }

        if (!currentUser.profile_completed) {
          navigate(createPageUrl('ProfileSetupPage'));
          return;
        }

        // Check if user has a role assigned
        const userTypes = currentUser.user_types || [];
        const hasRole = currentUser.role === 'admin' || userTypes.length > 0;
        
        if (!hasRole) {
          // User has no role - show message
          setUser({ ...currentUser, noRole: true });
          setLoading(false);
          return;
        }

        setUser(currentUser);

        // Redirect root pages to user-specific dashboard
        if (currentPageName === 'Dashboard' || currentPageName === 'AIGradingAssistant') {
          const isAdmin = currentUser.role === 'admin' || userTypes.includes('admin');
          const isTeacher = userTypes.includes('teacher');
          const isStudent = userTypes.includes('student');
          const isParent = userTypes.includes('parent');
          const isVendor = userTypes.includes('vendor');

          if (isAdmin) {
            navigate(createPageUrl('AdminDashboard'));
          } else if (isVendor) {
            navigate(createPageUrl('VendorDashboard'));
          } else if (isParent) {
            navigate(createPageUrl('ParentPortal'));
          } else if (isStudent) {
            navigate(createPageUrl('StudentDashboard'));
          } else if (isTeacher) {
            navigate(createPageUrl('TeacherDashboard'));
          }
        }
      } catch (error) {
        console.error('Failed to fetch user:', error);
        // Redirect to landing page if not authenticated
        navigate(createPageUrl('LandingPage'));
      } finally {
        setLoading(false);
      }
    };
    fetchUser();
    }, [navigate, isPublicPage, currentPageName]);

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

    const userTypes = user.user_types || [];
    const isAdmin = user.role === 'admin' || userTypes.includes('admin');
    const isTeacher = userTypes.includes('teacher');
    const isStudent = userTypes.includes('student');
    const isParent = userTypes.includes('parent');
    const isVendor = userTypes.includes('vendor');

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
          { name: 'User Management', icon: Users, path: 'UserManagement' },
          { name: 'Academic Sessions', icon: Calendar, path: 'AcademicSessions' },
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
          { name: 'Linking Requests', icon: UserCircle, path: 'AdminLinkingRequests' },
          { name: 'Student Exit', icon: LogOutIcon, path: 'StudentExitMonitoring' },
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
          { name: 'Exam Command Center', icon: FileText, path: 'ExamCommandCenter' },
          { name: 'Question Bank', icon: BookOpen, path: 'QuestionBank' },
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
          { name: 'Scanner Settings', icon: Camera, path: 'ScannerSettings' },
          { name: 'Room Access', icon: DoorOpen, path: 'RoomAccessManagement' },
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
        id: 'cbt-tools',
        groupName: 'CBT & ASSESSMENT',
        items: [
          { name: 'Question Bank', icon: BookOpen, path: 'QuestionBank' },
          { name: 'Create Exam', icon: Plus, path: 'ExamCreator' },
          { name: 'Grade Submissions', icon: Award, path: 'TeacherAssignments' },
        ]
      },
      {
        id: 'student-overview',
        groupName: 'STUDENT MANAGEMENT',
        items: [
          { name: 'View Students', icon: Users, path: 'StudentRecords' },
          { name: 'Add Student', icon: UserCircle, path: 'StudentRecords' },
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
          { name: 'Link Student', icon: UserCircle, path: 'ParentLinkingRequests' },
          { name: 'Calendar', icon: Calendar, path: 'ParentCalendar' },
          { name: 'Homework', icon: ClipboardList, path: 'ParentHomework' },
          { name: 'Fees & Payments', icon: DollarSign, path: 'ParentFees' },
          { name: 'Attendance', icon: CheckSquare, path: 'ParentAttendance' },
          { name: 'Reports', icon: FileText, path: 'ParentReports' },
          { name: 'Behavior', icon: Award, path: 'ParentBehavior' },
        ]
      }
    ];

    if (isAdmin) return adminGroups;
    if (isVendor) return vendorGroups;
    if (isParent) return parentGroups;
    if (isStudent) return studentGroups;
    if (isTeacher) return teacherGroups;
    return teacherGroups;
  };

  const navigationItems = getNavigationItems();

  // Return children directly for public pages without layout wrapper
  if (isPublicPage) {
    return <>{children}</>;
  }

  const getUserRole = () => {
    if (!user) return null;
    const userTypes = user.user_types || [];
    if (user.role === 'admin' || userTypes.includes('admin')) return 'admin';
    if (userTypes.includes('teacher')) return 'teacher';
    if (userTypes.includes('student')) return 'student';
    if (userTypes.includes('parent')) return 'parent';
    return null;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-accent mx-auto"></div>
          <p className="mt-4 text-text-secondary">Loading...</p>
        </div>
      </div>
    );
  }

  // If user has no role, show message
  if (user?.noRole) {
    return (
      <div className="min-h-screen bg-background">
        <header className="glass-morphism sticky top-0 z-50 shadow-sm">
          <div className="flex items-center justify-between px-4 py-3 lg:px-6">
            <div className="flex items-center">
              <img 
                src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/69441b6bd765d833c80ac7ff/90d2daf9a_oie_b7JlP4U16so5.png" 
                alt="SkoolRise Logo" 
                className="h-15 w-40"
              />
            </div>
            <button
              onClick={handleLogout}
              className="p-2 rounded-xl hover:bg-gray-100 transition-all duration-200"
              title="Logout"
            >
              <LogOutIcon className="w-5 h-5 text-text-secondary" />
            </button>
          </div>
        </header>
        <div className="flex items-center justify-center min-h-[80vh]">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-md p-8 bg-white rounded-2xl shadow-lg text-center"
          >
            <UserCircle className="w-20 h-20 text-gray-400 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-text mb-2">No Role Assigned</h2>
            <p className="text-text-secondary mb-4">
              Your account has been created but no role has been assigned yet. 
              Please contact your administrator to assign you a role (Teacher, Student, Parent, etc.) 
              so you can access the system.
            </p>
            <div className="p-4 bg-blue-50 rounded-xl text-sm text-blue-800">
              <p><strong>Email:</strong> {user.email}</p>
              <p className="mt-2">Contact your school administrator to complete your account setup.</p>
            </div>
          </motion.div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Command Palette */}
      <CommandPalette 
        isOpen={commandPaletteOpen} 
        onClose={() => setCommandPaletteOpen(false)}
        userRole={getUserRole()}
      />

      {/* Header */}
      <header className="glass-morphism sticky top-0 z-40 shadow-sm">
        <div className="flex items-center justify-between px-4 py-3 lg:px-6">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="lg:hidden p-2 rounded-xl hover:bg-gray-100 transition-all duration-200 hover:scale-105 active:scale-95"
            >
              {sidebarOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
            <div className="flex items-center">
              <img 
                src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/69441b6bd765d833c80ac7ff/90d2daf9a_oie_b7JlP4U16so5.png" 
                alt="SkoolRise Logo" 
                className="h-15 w-40"
              />
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setCommandPaletteOpen(true)}
              className="hidden md:flex items-center gap-2 px-4 py-2 rounded-xl bg-gray-100 hover:bg-gray-200 transition-all duration-200 hover:scale-105"
            >
              <Search className="w-4 h-4 text-text-secondary" />
              <span className="text-sm text-text-secondary">Search</span>
              <kbd className="px-2 py-0.5 text-xs bg-white rounded border text-text-secondary">⌘K</kbd>
            </button>
            <div className="text-right hidden sm:block">
              <p className="text-sm font-medium text-text">{user?.full_name || user?.email}</p>
              <p className="text-xs text-text-secondary capitalize">{user?.role}</p>
            </div>
            <button
              onClick={handleLogout}
              className="p-2 rounded-xl hover:bg-gray-100 transition-all duration-200 hover:scale-105 active:scale-95"
              title="Logout"
            >
              <LogOutIcon className="w-5 h-5 text-text-secondary" />
            </button>
          </div>
        </div>
      </header>

      <div className="flex">
        {/* Sidebar */}
        <aside
          className={`
            fixed lg:sticky top-0 left-0 z-30 h-screen
            glass-morphism shadow-lg transition-transform duration-300 ease-in-out
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
                      className="w-full flex items-center justify-between px-3 py-2 text-xs font-semibold text-text-secondary hover:text-text transition-all duration-200 uppercase tracking-wider rounded-xl hover:bg-gray-50"
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
                                flex items-center gap-3 px-4 py-2.5 rounded-xl transition-all duration-200 smooth-transition
                                ${
                                  isActive
                                    ? 'bg-accent text-white shadow-lg scale-105'
                                    : 'text-text hover:bg-gray-50 hover:scale-105'
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
            <AnimatePresence mode="wait">
              <motion.div
                key={currentPageName}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
              >
                {children}
              </motion.div>
            </AnimatePresence>
          </div>
        </main>
        </div>
        </div>
        );
}