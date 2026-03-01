// Centralized permissions configuration
export const DEFAULT_PERMISSIONS = [
  // Students
  { name: 'view_students', display_name: 'View Students', category: 'students', description: 'View student records' },
  { name: 'manage_students', display_name: 'Manage Students', category: 'students', description: 'Create, edit, delete students' },
  { name: 'view_student_grades', display_name: 'View Student Grades', category: 'students', description: 'View student grades and progress' },
  
  // Teachers
  { name: 'view_teachers', display_name: 'View Teachers', category: 'teachers', description: 'View teacher records' },
  { name: 'manage_teachers', display_name: 'Manage Teachers', category: 'teachers', description: 'Create, edit, delete teachers' },
  
  // Academics
  { name: 'view_classes', display_name: 'View Classes', category: 'academics', description: 'View class information' },
  { name: 'manage_classes', display_name: 'Manage Classes', category: 'academics', description: 'Create, edit, delete classes' },
  { name: 'take_attendance', display_name: 'Take Attendance', category: 'academics', description: 'Record student attendance' },
  { name: 'manage_assignments', display_name: 'Manage Assignments', category: 'academics', description: 'Create and grade assignments' },
  { name: 'view_report_cards', display_name: 'View Report Cards', category: 'academics', description: 'View report cards' },
  { name: 'manage_report_cards', display_name: 'Manage Report Cards', category: 'academics', description: 'Create and edit report cards' },
  { name: 'view_timetables', display_name: 'View Timetables', category: 'academics', description: 'View class timetables' },
  { name: 'manage_timetables', display_name: 'Manage Timetables', category: 'academics', description: 'Create and edit timetables' },
  { name: 'manage_curriculum', display_name: 'Manage Curriculum', category: 'academics', description: 'Manage curriculum standards and mappings' },
  
  // Fees
  { name: 'view_fees', display_name: 'View Fees', category: 'fees', description: 'View fee invoices and payments' },
  { name: 'manage_fees', display_name: 'Manage Fees', category: 'fees', description: 'Create invoices and record payments' },
  { name: 'view_financial_reports', display_name: 'View Financial Reports', category: 'fees', description: 'View financial summaries' },
  { name: 'manage_fee_policies', display_name: 'Manage Fee Policies', category: 'fees', description: 'Create and edit fee policies' },
  { name: 'manage_salaries', display_name: 'Manage Salaries', category: 'fees', description: 'Manage staff salaries' },
  { name: 'manage_expenses', display_name: 'Manage Expenses', category: 'fees', description: 'Track and manage expenses' },
  
  // Exams
  { name: 'view_exams', display_name: 'View Exams', category: 'exams', description: 'View exam information' },
  { name: 'create_exams', display_name: 'Create Exams', category: 'exams', description: 'Create and manage exams' },
  { name: 'grade_exams', display_name: 'Grade Exams', category: 'exams', description: 'Grade exam submissions' },
  { name: 'view_question_bank', display_name: 'View Question Bank', category: 'exams', description: 'Access question bank' },
  { name: 'manage_question_bank', display_name: 'Manage Question Bank', category: 'exams', description: 'Add/edit questions' },
  { name: 'proctor_exams', display_name: 'Proctor Exams', category: 'exams', description: 'Monitor exam sessions' },
  
  // Behavior & Gamification
  { name: 'view_behavior', display_name: 'View Behavior', category: 'behavior', description: 'View behavior records' },
  { name: 'manage_behavior', display_name: 'Manage Behavior', category: 'behavior', description: 'Record behavior incidents' },
  { name: 'view_leaderboard', display_name: 'View Leaderboard', category: 'behavior', description: 'View student leaderboards' },
  { name: 'manage_rewards', display_name: 'Manage Rewards', category: 'behavior', description: 'Manage rewards and achievements' },
  { name: 'award_points', display_name: 'Award Points', category: 'behavior', description: 'Award or deduct points' },
  
  // Reports & Analytics
  { name: 'view_reports', display_name: 'View Reports', category: 'reports', description: 'View analytics and reports' },
  { name: 'export_data', display_name: 'Export Data', category: 'reports', description: 'Export data to files' },
  { name: 'view_audit_logs', display_name: 'View Audit Logs', category: 'reports', description: 'View system audit logs' },
  { name: 'view_analytics', display_name: 'View Analytics', category: 'reports', description: 'View predictive analytics and insights' },
  { name: 'manage_scheduled_reports', display_name: 'Manage Scheduled Reports', category: 'reports', description: 'Create and manage scheduled reports' },
  
  // Communication
  { name: 'send_messages', display_name: 'Send Messages', category: 'communication', description: 'Send messages to users' },
  { name: 'send_bulk_messages', display_name: 'Send Bulk Messages', category: 'communication', description: 'Send messages to multiple users' },
  { name: 'manage_announcements', display_name: 'Manage Announcements', category: 'communication', description: 'Create school announcements' },
  { name: 'manage_contact_lists', display_name: 'Manage Contact Lists', category: 'communication', description: 'Create and manage contact lists' },
  { name: 'view_delivery_reports', display_name: 'View Delivery Reports', category: 'communication', description: 'View message delivery status' },
  
  // Activities & Events
  { name: 'view_events', display_name: 'View Events', category: 'activities', description: 'View school events' },
  { name: 'manage_events', display_name: 'Manage Events', category: 'activities', description: 'Create and manage events' },
  { name: 'manage_trips', display_name: 'Manage Trips', category: 'activities', description: 'Manage school trips' },
  { name: 'manage_clubs', display_name: 'Manage Clubs', category: 'activities', description: 'Manage school clubs' },
  { name: 'manage_shop', display_name: 'Manage School Shop', category: 'activities', description: 'Manage school shop products' },
  
  // Bookshop
  { name: 'view_bookshop', display_name: 'View Bookshop', category: 'bookshop', description: 'View bookshop inventory' },
  { name: 'manage_bookshop', display_name: 'Manage Bookshop', category: 'bookshop', description: 'Manage bookshop inventory and sales' },
  { name: 'manage_vendors', display_name: 'Manage Vendors', category: 'bookshop', description: 'Manage book vendors' },
  
  // Settings & Administration
  { name: 'manage_users', display_name: 'Manage Users', category: 'settings', description: 'Manage user accounts' },
  { name: 'manage_school_settings', display_name: 'Manage School Settings', category: 'settings', description: 'Edit school configuration' },
  { name: 'manage_security', display_name: 'Manage Security', category: 'settings', description: 'Manage security settings' },
  { name: 'manage_permissions', display_name: 'Manage Permissions', category: 'settings', description: 'Manage role and user permissions' },
  { name: 'manage_backups', display_name: 'Manage Backups', category: 'settings', description: 'Configure and run backups' },
  { name: 'view_sessions', display_name: 'View Sessions', category: 'settings', description: 'View active user sessions' },
  { name: 'manage_admissions', display_name: 'Manage Admissions', category: 'settings', description: 'Manage admission applications' },
  { name: 'manage_clocking', display_name: 'Manage Clocking', category: 'settings', description: 'Manage staff clocking permissions' },
  { name: 'manage_room_access', display_name: 'Manage Room Access', category: 'settings', description: 'Manage room access controls' },
];

export const ROLE_DEFAULT_PERMISSIONS = {
  admin: DEFAULT_PERMISSIONS.map(p => p.name),
  teacher: [
    'view_students', 'view_student_grades', 'view_classes', 'take_attendance', 
    'manage_assignments', 'view_report_cards', 'view_timetables', 'view_exams', 
    'create_exams', 'grade_exams', 'view_question_bank', 'manage_question_bank',
    'view_behavior', 'manage_behavior', 'award_points', 'view_leaderboard',
    'send_messages', 'view_events'
  ],
  student: [
    'view_exams', 'view_leaderboard', 'view_events'
  ],
  parent: [
    'view_students', 'view_student_grades', 'view_fees', 'view_report_cards', 
    'send_messages', 'view_behavior', 'view_events', 'view_leaderboard'
  ],
  vendor: [
    'view_bookshop'
  ]
};

export const categoryIcons = {
  students: 'Users',
  teachers: 'Users',
  academics: 'BookOpen',
  fees: 'DollarSign',
  exams: 'GraduationCap',
  behavior: 'Award',
  reports: 'FileText',
  communication: 'MessageSquare',
  activities: 'Calendar',
  bookshop: 'BookMarked',
  settings: 'Settings'
};