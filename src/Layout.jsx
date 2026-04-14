import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { createPageUrl } from './utils';
import { base44 } from '@/api/base44Client';
import { motion, AnimatePresence } from 'framer-motion';
import CommandPalette from './components/CommandPalette';
import NoRoleScreen from './components/NoRoleScreen';
import MobileBottomNav from './components/MobileBottomNav';
import OfflineIndicator from './components/OfflineIndicator';
import { CurrencyProvider } from './components/CurrencyProvider';
import NotificationCenter from './components/NotificationCenter';
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
  Search,
  Clock,
  Shield,
  Database,
  Trophy
} from 'lucide-react';

export default function Layout({ children, currentPageName }) {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [commandPaletteOpen, setCommandPaletteOpen] = useState(false);
  const [openGroups, setOpenGroups] = useState(['workspace', 'school-setup', 'school-admin', 'academics', 'cbt', 'my-teaching', 'my-learning', 'parent-home', 'fees', 'communication']);
  const [hasClockingPermission, setHasClockingPermission] = useState(false);

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

        // Strict validation: user_type must match exactly ONE profile
        const userType = currentUser.user_type || '';
        const hasRole = currentUser.role === 'admin' || !!userType;
        
        if (!hasRole) {
          // User has no role - show message
          setUser({ ...currentUser, noRole: true });
          setLoading(false);
          return;
        }

        setUser(currentUser);

        // Check if user has clocking permission
        let userHasClockingPermission = false;
        try {
          const clockingPermissions = await base44.entities.ClockingPermission.filter({ 
            user_id: currentUser.id,
            is_active: true 
          });
          userHasClockingPermission = clockingPermissions.length > 0;
          setHasClockingPermission(userHasClockingPermission);
        } catch (e) {
          console.log('No clocking permissions found');
        }

        // Define allowed pages per role
        const adminPages = [
          'AdminDashboard', 'SchoolSettings', 'AcademicsHub', 'TeacherManagement', 'TimetableManagement',
          'AdmissionsManagement', 'StudentRecords', 'ParentManagement', 'EnrollmentManagement', 'AdminLinkingRequests',
          'UnifiedAttendance', 'AssignmentManagement', 'BehaviorManagement', 'BehaviorAnalytics', 'ReportCardsManagement',
          'CurriculumMapping', 'ConferenceScheduling', 'ExamCommandCenter', 'ExamManagement', 'QuestionBank',
          'FeePolicies', 'FeesManagement', 'FeeReminderSystem', 'InstalmentPlans', 'PaymentProviders', 'SalaryManagement', 'ExpenseTracking',
          'BookshopManager', 'BookshopReports', 'VendorManagement', 'SchoolShopManagement', 'TripsManagement',
          'ClubsManagement', 'Activities', 'MessagingCenter', 'ContactLists', 'DeliveryReports', 'EventCalendar',
          'Reports', 'ScheduledReports', 'UserManagement', 'SettingsHub', 'ScannerSettings', 'RoomAccessManagement',
          'UserProfile', 'CreateReportCard', 'InvoiceDetail', 'CreateInvoice', 'AuditLogs', 'BackupSettings',
          'NotificationsSettings', 'SecuritySettings', 'ExamCreator', 'ActiveClasses', 'StaffClocking', 'ClockingPermissions', 'NotificationsPage',
          'StudentLeaderboard', 'StudentPerformanceReports'
        ];
        
        const teacherPages = [
          'TeacherDashboard', 'TeacherSchedule', 'MyClasses', 'AttendanceTaking', 'Gradebook', 'BehaviorTracking',
          'StudentProgressTracking', 'ClassroomResources', 'AILessonPlanner', 'EventCalendar', 'TeacherAssignmentManager',
          'TeacherAssignments', 'TeacherTests', 'QuestionBank', 'ExamCreator', 'ExamManagement', 'ExamCommandCenter',
          'DetailedExamAnalytics', 'ExamResults', 'ExamAttemptReview', 'GradeExam', 'UserProfile', 'AssignmentBuilder', 'StaffClocking', 'NotificationsPage'
        ];
        
        const studentPages = [
          'StudentDashboard', 'StudentClasses', 'StudentAssignments', 'StudentTests', 'StudentGrades',
          'RewardsStore', 'StudentLeaderboard', 'StudentAttendance', 'UserProfile', 'TakeExam', 'StudentAssignmentDashboard', 'NotificationsPage'
        ];
        
        const parentPages = [
          'ParentPortal', 'ParentStudentView', 'ParentSchoolShop', 'ParentActivities', 'ParentCalendar',
          'ParentHomework', 'ParentFees', 'ParentAttendance', 'ParentReports',
          'ParentBehavior', 'ParentLinkingRequests', 'ParentAssignmentView', 'UserProfile', 'NotificationsPage'
        ];
        
        const vendorPages = [
          'VendorDashboard', 'VendorProfile', 'UserProfile'
        ];

        const isAdmin = currentUser.role === 'admin' || userType === 'admin';
        const isTeacher = userType === 'teacher';
        const isStudent = userType === 'student';
        const isParent = userType === 'parent';
        const isVendor = userType === 'vendor';

        // Determine user's allowed pages
        let allowedPages = [];
        let defaultDashboard = 'AdminDashboard';
        
        if (isAdmin) {
          allowedPages = adminPages;
          defaultDashboard = 'AdminDashboard';
        } else if (isTeacher) {
          allowedPages = teacherPages;
          defaultDashboard = 'TeacherDashboard';
        } else if (isStudent) {
          allowedPages = studentPages;
          defaultDashboard = 'StudentDashboard';
        } else if (isParent) {
          allowedPages = parentPages;
          defaultDashboard = 'ParentPortal';
        } else if (isVendor) {
          allowedPages = vendorPages;
          defaultDashboard = 'VendorDashboard';
        }

        // Redirect root/generic pages to user-specific dashboard
        if (currentPageName === 'Dashboard' || currentPageName === 'AIGradingAssistant') {
          navigate(createPageUrl(defaultDashboard));
          return;
        }

        // Allow StaffClocking page if user has permission
        if (currentPageName === 'StaffClocking' && userHasClockingPermission) {
          allowedPages.push('StaffClocking');
        }

        // Check if current page is allowed for this user role
        if (!allowedPages.includes(currentPageName) && !publicPages.includes(currentPageName)) {
          console.warn(`User type '${userType}' not allowed on page '${currentPageName}', redirecting to ${defaultDashboard}`);
          navigate(createPageUrl(defaultDashboard));
          return;
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

    const userType = user.user_type || '';
    const isAdmin = user.role === 'admin' || userType === 'admin';
    const isTeacher = userType === 'teacher';
    const isStudent = userType === 'student';
    const isParent = userType === 'parent';
    const isVendor = userType === 'vendor';

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
              { name: 'School Branding', icon: Building2, path: 'SchoolSettings' },
            ]
          },
      {
        id: 'school-setup',
        groupName: 'SCHOOL SETUP',
        items: [
          { name: 'Academics', icon: GraduationCap, path: 'AcademicsHub' },
          { name: 'Teachers', icon: UserCircle, path: 'TeacherManagement' },
          { name: 'Timetables', icon: Calendar, path: 'TimetableManagement' },
          { name: 'Admissions', icon: UserCircle, path: 'AdmissionsManagement' },
        ]
      },
      {
        id: 'student-mgmt',
        groupName: 'STUDENT MANAGEMENT',
        items: [
          { name: 'Students', icon: Users, path: 'StudentRecords' },
          { name: 'Parents', icon: Users, path: 'ParentManagement' },
          { name: 'Enrollments', icon: BookOpen, path: 'EnrollmentManagement' },
          { name: 'Linking Requests', icon: UserCircle, path: 'AdminLinkingRequests' },

        ]
      },
      {
          id: 'academics',
          groupName: 'ACADEMICS & RECORDS',
          items: [
            { name: 'Unified Attendance', icon: CheckSquare, path: 'UnifiedAttendance' },
            { name: 'Assignments', icon: ClipboardList, path: 'AssignmentManagement' },
            { name: 'Behavior', icon: Award, path: 'BehaviorManagement' },
            { name: 'Behavior Analytics', icon: TrendingUp, path: 'BehaviorAnalytics' },
            { name: 'Report Cards', icon: FileText, path: 'ReportCardsManagement' },
            { name: 'Curriculum Mapping', icon: BookOpen, path: 'CurriculumMapping' },
            { name: 'Conferences', icon: Calendar, path: 'ConferenceScheduling' },
          ]
        },
      {
        id: 'cbt',
        groupName: 'CBT / EXAMINATIONS',
        items: [
          { name: 'Exam Command Center', icon: FileText, path: 'ExamCommandCenter' },
          { name: 'Exam Management', icon: ClipboardList, path: 'ExamManagement' },
          { name: 'Question Bank', icon: BookOpen, path: 'QuestionBank' },
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
          { name: 'Payment Providers', icon: DollarSign, path: 'PaymentProviders' },
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
        id: 'activities',
        groupName: 'ACTIVITIES & SHOP',
        items: [
          { name: 'School Shop', icon: BookMarked, path: 'SchoolShopManagement' },
          { name: 'School Trips', icon: Users, path: 'TripsManagement' },
          { name: 'Clubs', icon: Award, path: 'ClubsManagement' },
          { name: 'Activities', icon: ClipboardList, path: 'Activities' },
        ]
        },
      {
        id: 'communication',
        groupName: 'COMMUNICATION',
        items: [
          { name: 'Messaging Center', icon: Mail, path: 'MessagingCenter' },
          { name: 'Contact Lists', icon: Users, path: 'ContactLists' },
          { name: 'Delivery Reports', icon: BarChart3, path: 'DeliveryReports' },
          { name: 'Event Calendar', icon: Calendar, path: 'EventCalendar' },
        ]
      },
      {
        id: 'analytics',
        groupName: 'REPORTS & ANALYTICS',
        items: [
          { name: 'Reports', icon: TrendingUp, path: 'Reports' },
          { name: 'Student Performance', icon: BarChart3, path: 'StudentPerformanceReports' },
          { name: 'Scheduled Reports', icon: Calendar, path: 'ScheduledReports' },
        ]
      },
      {
        id: 'settings',
        groupName: 'SYSTEM',
        items: [
          { name: 'User Management', icon: Users, path: 'UserManagement' },
          { name: 'Clocking Permissions', icon: Clock, path: 'ClockingPermissions' },
          { name: 'Staff Clocking', icon: Clock, path: 'StaffClocking' },
          { name: 'Settings Hub', icon: Settings, path: 'SettingsHub' },
          { name: 'Scanner Settings', icon: Camera, path: 'ScannerSettings' },
          { name: 'Room Access', icon: DoorOpen, path: 'RoomAccessManagement' },
          { name: 'Security Settings', icon: Shield, path: 'SecuritySettings' },
          { name: 'Audit Logs', icon: FileText, path: 'AuditLogs' },
          { name: 'Backup Settings', icon: Database, path: 'BackupSettings' },
        ]
      }
    ];

    let teacherGroups = [
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
          { name: 'My Schedule', icon: Calendar, path: 'TeacherSchedule' },
          { name: 'My Classes', icon: GraduationCap, path: 'MyClasses' },
          { name: 'Attendance', icon: CheckSquare, path: 'AttendanceTaking' },
          { name: 'Gradebook', icon: Award, path: 'Gradebook' },
          { name: 'Behavior', icon: Award, path: 'BehaviorTracking' },
          { name: 'Student Progress', icon: TrendingUp, path: 'StudentProgressTracking' },
          { name: 'Resources', icon: BookOpen, path: 'ClassroomResources' },
          { name: 'AI Lesson Planner', icon: BookMarked, path: 'AILessonPlanner' },
          { name: 'Event Calendar', icon: Calendar, path: 'EventCalendar' },
        ]
      },
      {
          id: 'cbt-tools',
          groupName: 'CBT & ASSESSMENT',
          items: [
            { name: 'Assignment Manager', icon: ClipboardList, path: 'TeacherAssignmentManager' },
            { name: 'Assignments', icon: ClipboardList, path: 'TeacherAssignments' },
            { name: 'Tests', icon: FileText, path: 'TeacherTests' },
            { name: 'Question Bank', icon: BookOpen, path: 'QuestionBank' },
            { name: 'Create Exam', icon: Plus, path: 'ExamCreator' },
            { name: 'Exam Management', icon: FileText, path: 'ExamManagement' },
            { name: 'Exam Command Center', icon: BarChart3, path: 'ExamCommandCenter' },
            { name: 'Exam Analytics', icon: TrendingUp, path: 'DetailedExamAnalytics' },
            { name: 'Exam Results', icon: Award, path: 'ExamResults' },
            { name: 'Review Attempts', icon: CheckSquare, path: 'ExamAttemptReview' },
            { name: 'Grade Exam', icon: Award, path: 'GradeExam' },
          ]
        }
    ];

    // Add Staff Clocking for teachers with permission
    if (hasClockingPermission && isTeacher) {
      teacherGroups.push({
        id: 'staff-tools',
        groupName: 'STAFF TOOLS',
        items: [
          { name: 'Staff Clocking', icon: Clock, path: 'StaffClocking' },
        ]
      });
    }

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
          { name: 'Leaderboard', icon: Trophy, path: 'StudentLeaderboard' },
          { name: 'Attendance', icon: CheckSquare, path: 'StudentAttendance' },
          { name: 'Profile', icon: UserCircle, path: 'UserProfile' },
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
              { name: 'School Shop', icon: BookMarked, path: 'ParentSchoolShop' },
              { name: 'Activities', icon: Award, path: 'ParentActivities' },
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
    const userType = user.user_type || '';
    if (user.role === 'admin' || userType === 'admin') return 'admin';
    if (userType === 'teacher') return 'teacher';
    if (userType === 'student') return 'student';
    if (userType === 'parent') return 'parent';
    if (userType === 'vendor') return 'vendor';
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

  // If user has no role, show message with request button
  if (user?.noRole) {
    return <NoRoleScreen user={user} onLogout={handleLogout} />;
  }

  return (
    <CurrencyProvider>
      <div className="min-h-screen bg-background">
        {/* Offline Indicator */}
        <OfflineIndicator />

        {/* Command Palette */}
        <CommandPalette 
          isOpen={commandPaletteOpen} 
          onClose={() => setCommandPaletteOpen(false)}
          userRole={getUserRole()}
        />

      {/* Header */}
      <header className="bg-white sticky top-0 z-40 shadow-sm border-b border-gray-200">
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
            <NotificationCenter userId={user?.id} />
            <Link 
              to={createPageUrl('UserProfile')} 
              className="text-right hidden sm:block hover:bg-gray-100 p-2 rounded-xl transition-all"
            >
              <p className="text-sm font-medium text-text">{user?.full_name || user?.email}</p>
              <p className="text-xs text-text-secondary capitalize">{user?.role}</p>
            </Link>
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
            bg-white shadow-lg transition-transform duration-300 ease-in-out border-r border-gray-200
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
                                flex items-center gap-3 px-4 py-2.5 rounded-xl transition-all duration-200
                                ${
                                  isActive
                                    ? 'bg-blue-600 text-white shadow-md font-medium'
                                    : 'text-gray-700 hover:bg-blue-50 hover:text-blue-700'
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
          <div className="p-4 lg:p-8 pb-24 lg:pb-8">
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

        {/* Mobile Bottom Navigation */}
        <MobileBottomNav 
          userRole={getUserRole()} 
          currentPageName={currentPageName} 
        />
      </div>
    </div>
    </CurrencyProvider>
  );
}