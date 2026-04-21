export const FEATURE_REGISTRY = {

  // ── Core administration ──────────────────────────────
  studentRecords:         { label: 'Student records & management',    module: 'core',          starter: true,  growth: true,  professional: true,  elite: true  },
  teacherManagement:      { label: 'Teacher management',              module: 'core',          starter: true,  growth: true,  professional: true,  elite: true  },
  parentManagement:       { label: 'Parent management & linking',     module: 'core',          starter: true,  growth: true,  professional: true,  elite: true  },
  timetable:              { label: 'Timetable management',            module: 'core',          starter: true,  growth: true,  professional: true,  elite: true  },
  userManagement:         { label: 'User management & roles',         module: 'core',          starter: true,  growth: true,  professional: true,  elite: true  },
  admissions:             { label: 'Admissions & enrolment',          module: 'core',          starter: true,  growth: true,  professional: true,  elite: true  },
  studentMedicalRecords:  { label: 'Student medical records',         module: 'core',          starter: true,  growth: true,  professional: true,  elite: true  },
  auditLogs:              { label: 'Audit logs',                      module: 'core',          starter: false, growth: true,  professional: true,  elite: true  },
  securitySettings:       { label: 'Security settings',               module: 'core',          starter: false, growth: false, professional: true,  elite: true  },

  // ── Academics & curriculum ───────────────────────────
  gradebook:              { label: 'Gradebook & report cards',        module: 'academics',     starter: true,  growth: true,  professional: true,  elite: true  },
  attendanceBasic:        { label: 'Attendance tracking',             module: 'academics',     starter: true,  growth: true,  professional: true,  elite: true  },
  behaviourTracking:      { label: 'Behaviour tracking',              module: 'academics',     starter: true,  growth: true,  professional: true,  elite: true  },
  classroomResources:     { label: 'Classroom resources',             module: 'academics',     starter: true,  growth: true,  professional: true,  elite: true  },
  curriculumMapping:      { label: 'Curriculum mapping',              module: 'academics',     starter: false, growth: true,  professional: true,  elite: true  },
  studentProgress:        { label: 'Student progress tracking',       module: 'academics',     starter: false, growth: true,  professional: true,  elite: true  },
  assignmentsLms:         { label: 'Assignments & LMS',               module: 'academics',     starter: false, growth: true,  professional: true,  elite: true  },
  parentHomework:         { label: 'Parent homework view',            module: 'academics',     starter: false, growth: true,  professional: true,  elite: true  },

  // ── CBT exams & assessment ───────────────────────────
  examCbt:                { label: 'CBT exam system',                 module: 'exams',         starter: false, growth: true,  professional: true,  elite: true  },
  questionBank:           { label: 'Question bank',                   module: 'exams',         starter: false, growth: true,  professional: true,  elite: true  },
  examAnalytics:          { label: 'Exam analytics',                  module: 'exams',         starter: false, growth: true,  professional: true,  elite: true  },
  proctoring:             { label: 'Live exam proctoring',            module: 'exams',         starter: false, growth: false, professional: true,  elite: true  },
  proctoringAnalytics:    { label: 'Proctoring analytics',            module: 'exams',         starter: false, growth: false, professional: true,  elite: true  },

  // ── Fees & finance ───────────────────────────────────
  feesBasic:              { label: 'Fee invoicing & collection',      module: 'fees',          starter: true,  growth: true,  professional: true,  elite: true  },
  feePolicies:            { label: 'Fee policies',                    module: 'fees',          starter: true,  growth: true,  professional: true,  elite: true  },
  feeReminders:           { label: 'Fee reminder system',             module: 'fees',          starter: true,  growth: true,  professional: true,  elite: true  },
  instalmentPlans:        { label: 'Instalment plans',                module: 'fees',          starter: false, growth: true,  professional: true,  elite: true  },
  expenseTracking:        { label: 'Expense tracking',                module: 'fees',          starter: false, growth: true,  professional: true,  elite: true  },
  salaryManagement:       { label: 'Salary management',               module: 'fees',          starter: false, growth: true,  professional: true,  elite: true  },
  paymentProviders:       { label: 'Payment gateway integration',     module: 'fees',          starter: false, growth: true,  professional: true,  elite: true  },
  scheduledReports:       { label: 'Scheduled financial reports',     module: 'fees',          starter: false, growth: false, professional: true,  elite: true  },

  // ── Communication ────────────────────────────────────
  emailNotifications:     { label: 'Email notifications',             module: 'communication', starter: true,  growth: true,  professional: true,  elite: true  },
  messagingCenter:        { label: 'Messaging center',                module: 'communication', starter: true,  growth: true,  professional: true,  elite: true  },
  contactLists:           { label: 'Contact lists',                   module: 'communication', starter: true,  growth: true,  professional: true,  elite: true  },
  smsNotifications:       { label: 'SMS notifications',               module: 'communication', starter: false, growth: true,  professional: true,  elite: true  },
  whatsappNotifications:  { label: 'WhatsApp notifications',          module: 'communication', starter: false, growth: true,  professional: true,  elite: true  },
  deliveryReports:        { label: 'Message delivery reports',        module: 'communication', starter: false, growth: true,  professional: true,  elite: true  },
  eventCalendar:          { label: 'Event calendar',                  module: 'communication', starter: true,  growth: true,  professional: true,  elite: true  },
  conferenceScheduling:   { label: 'Parent-teacher conferences',      module: 'communication', starter: false, growth: true,  professional: true,  elite: true  },

  // ── HR & staff operations ────────────────────────────
  staffClocking:          { label: 'Staff clocking in/out',           module: 'hr',            starter: false, growth: true,  professional: true,  elite: true  },
  clockingPermissions:    { label: 'Clocking permissions',            module: 'hr',            starter: false, growth: true,  professional: true,  elite: true  },
  tripsManagement:        { label: 'School trips management',         module: 'hr',            starter: false, growth: true,  professional: true,  elite: true  },
  clubsActivities:        { label: 'Clubs & activities',              module: 'hr',            starter: false, growth: true,  professional: true,  elite: true  },

  // ── Reports & analytics ──────────────────────────────
  basicReports:           { label: 'Basic reports',                   module: 'analytics',     starter: true,  growth: true,  professional: true,  elite: true  },
  advancedReports:        { label: 'Advanced reports dashboard',      module: 'analytics',     starter: false, growth: true,  professional: true,  elite: true  },
  customReports:          { label: 'Custom & scheduled reports',      module: 'analytics',     starter: false, growth: false, professional: true,  elite: true  },
  studentPerformanceRpts: { label: 'Student performance reports',     module: 'analytics',     starter: false, growth: true,  professional: true,  elite: true  },
  behaviourAnalytics:     { label: 'Behaviour analytics',             module: 'analytics',     starter: false, growth: true,  professional: true,  elite: true  },

  // ── AI features ──────────────────────────────────────
  aiLessonPlanner:        { label: 'AI lesson planner',               module: 'ai',            starter: false, growth: false, professional: true,  elite: true  },
  aiGradingAssistant:     { label: 'AI grading assistant',            module: 'ai',            starter: false, growth: false, professional: true,  elite: true  },

  // ── Advanced operations ──────────────────────────────
  biometricAttendance:    { label: 'Biometric / QR attendance',       module: 'advanced',      starter: false, growth: false, professional: true,  elite: true  },
  roomAccess:             { label: 'Room access management',          module: 'advanced',      starter: false, growth: false, professional: true,  elite: true  },
  scannerSettings:        { label: 'Scanner settings',                module: 'advanced',      starter: false, growth: false, professional: true,  elite: true  },
  backupGoogleDrive:      { label: 'Google Drive backup',             module: 'advanced',      starter: false, growth: true,  professional: true,  elite: true  },

  // ── Shop & commerce ──────────────────────────────────
  schoolShop:             { label: 'School shop',                     module: 'commerce',      starter: false, growth: false, professional: true,  elite: true  },
  bookshop:               { label: 'Bookshop management',             module: 'commerce',      starter: false, growth: false, professional: true,  elite: true  },
  vendorManagement:       { label: 'Vendor management',               module: 'commerce',      starter: false, growth: false, professional: true,  elite: true  },
  parentShop:             { label: 'Parent shop portal',              module: 'commerce',      starter: false, growth: false, professional: true,  elite: true  },

  // ── Gamification & wellbeing ─────────────────────────
  studentRewards:         { label: 'Student rewards & points',        module: 'gamification',  starter: false, growth: false, professional: true,  elite: true  },
  leaderboard:            { label: 'Leaderboard',                     module: 'gamification',  starter: false, growth: false, professional: true,  elite: true  },
  rewardsStore:           { label: 'Rewards store',                   module: 'gamification',  starter: false, growth: false, professional: true,  elite: true  },
};

export function canAccess(featureId, plan, featureOverridesJson) {
  const feature = FEATURE_REGISTRY[featureId];
  if (!feature) return false;
  let overrides = {};
  if (featureOverridesJson) {
    try { overrides = JSON.parse(featureOverridesJson); } catch {}
  }
  if (featureId in overrides) return overrides[featureId];
  return feature[plan] ?? false;
}

export function getSchoolFeatures(plan, featureOverridesJson) {
  let overrides = {};
  if (featureOverridesJson) {
    try { overrides = JSON.parse(featureOverridesJson); } catch {}
  }
  return Object.fromEntries(
    Object.entries(FEATURE_REGISTRY).map(([id, f]) => [
      id,
      id in overrides ? overrides[id] : (f[plan] ?? false)
    ])
  );
}

export const PLAN_FEATURES = {};
export { FEATURE_REGISTRY as default };