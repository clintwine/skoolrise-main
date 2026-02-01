/**
 * pages.config.js - Page routing configuration
 * 
 * This file is AUTO-GENERATED. Do not add imports or modify PAGES manually.
 * Pages are auto-registered when you create files in the ./pages/ folder.
 * 
 * THE ONLY EDITABLE VALUE: mainPage
 * This controls which page is the landing page (shown when users visit the app).
 * 
 * Example file structure:
 * 
 *   import HomePage from './pages/HomePage';
 *   import Dashboard from './pages/Dashboard';
 *   import Settings from './pages/Settings';
 *   
 *   export const PAGES = {
 *       "HomePage": HomePage,
 *       "Dashboard": Dashboard,
 *       "Settings": Settings,
 *   }
 *   
 *   export const pagesConfig = {
 *       mainPage: "HomePage",
 *       Pages: PAGES,
 *   };
 * 
 * Example with Layout (wraps all pages):
 *
 *   import Home from './pages/Home';
 *   import Settings from './pages/Settings';
 *   import __Layout from './Layout.jsx';
 *
 *   export const PAGES = {
 *       "Home": Home,
 *       "Settings": Settings,
 *   }
 *
 *   export const pagesConfig = {
 *       mainPage: "Home",
 *       Pages: PAGES,
 *       Layout: __Layout,
 *   };
 *
 * To change the main page from HomePage to Dashboard, use find_replace:
 *   Old: mainPage: "HomePage",
 *   New: mainPage: "Dashboard",
 *
 * The mainPage value must match a key in the PAGES object exactly.
 */
import AIGradingAssistant from './pages/AIGradingAssistant';
import AILessonPlanner from './pages/AILessonPlanner';
import AcademicsHub from './pages/AcademicsHub';
import ActivationPage from './pages/ActivationPage';
import ActiveClasses from './pages/ActiveClasses';
import Activities from './pages/Activities';
import AdminDashboard from './pages/AdminDashboard';
import AdminLinkingRequests from './pages/AdminLinkingRequests';
import AdminReportsDashboard from './pages/AdminReportsDashboard';
import AdmissionsManagement from './pages/AdmissionsManagement';
import AssignmentBuilder from './pages/AssignmentBuilder';
import AssignmentManagement from './pages/AssignmentManagement';
import AttendanceTaking from './pages/AttendanceTaking';
import AuditLogs from './pages/AuditLogs';
import BackupSettings from './pages/BackupSettings';
import BehaviorAnalytics from './pages/BehaviorAnalytics';
import BehaviorManagement from './pages/BehaviorManagement';
import BehaviorTracking from './pages/BehaviorTracking';
import BiometricAttendance from './pages/BiometricAttendance';
import BookshopManager from './pages/BookshopManager';
import BookshopReports from './pages/BookshopReports';
import ClassroomResources from './pages/ClassroomResources';
import ClubsManagement from './pages/ClubsManagement';
import ConferenceScheduling from './pages/ConferenceScheduling';
import ContactLists from './pages/ContactLists';
import Contacts from './pages/Contacts';
import CreateInvoice from './pages/CreateInvoice';
import CreateReportCard from './pages/CreateReportCard';
import CurriculumMapping from './pages/CurriculumMapping';
import DeliveryReports from './pages/DeliveryReports';
import DetailedExamAnalytics from './pages/DetailedExamAnalytics';
import EnrollmentManagement from './pages/EnrollmentManagement';
import EventCalendar from './pages/EventCalendar';
import ExamAnalytics from './pages/ExamAnalytics';
import ExamAttemptReview from './pages/ExamAttemptReview';
import ExamCommandCenter from './pages/ExamCommandCenter';
import ExamCreator from './pages/ExamCreator';
import ExamManagement from './pages/ExamManagement';
import ExamResults from './pages/ExamResults';
import ExpenseTracking from './pages/ExpenseTracking';
import FeePolicies from './pages/FeePolicies';
import FeeReminderSystem from './pages/FeeReminderSystem';
import FeesManagement from './pages/FeesManagement';
import GradeExam from './pages/GradeExam';
import Gradebook from './pages/Gradebook';
import ImprovedStudentRecords from './pages/ImprovedStudentRecords';
import InstalmentPlans from './pages/InstalmentPlans';
import InvoiceDetail from './pages/InvoiceDetail';
import LandingPage from './pages/LandingPage';
import MessagingCenter from './pages/MessagingCenter';
import MyClasses from './pages/MyClasses';
import NotificationsSettings from './pages/NotificationsSettings';
import ParentActivities from './pages/ParentActivities';
import ParentAssignmentView from './pages/ParentAssignmentView';
import ParentAttendance from './pages/ParentAttendance';
import ParentBehavior from './pages/ParentBehavior';
import ParentCalendar from './pages/ParentCalendar';
import ParentConferences from './pages/ParentConferences';
import ParentFees from './pages/ParentFees';
import ParentHomework from './pages/ParentHomework';
import ParentLinkingRequests from './pages/ParentLinkingRequests';
import ParentManagement from './pages/ParentManagement';
import ParentPortal from './pages/ParentPortal';
import ParentReports from './pages/ParentReports';
import ParentSchoolShop from './pages/ParentSchoolShop';
import ParentStudentView from './pages/ParentStudentView';
import PaymentProviders from './pages/PaymentProviders';
import PrivacyPolicy from './pages/PrivacyPolicy';
import ProctoringAnalytics from './pages/ProctoringAnalytics';
import ProctoringMonitor from './pages/ProctoringMonitor';
import ProfileSetupPage from './pages/ProfileSetupPage';
import PublicApplicationForm from './pages/PublicApplicationForm';
import QuestionBank from './pages/QuestionBank';
import ReportCardView from './pages/ReportCardView';
import ReportCardsManagement from './pages/ReportCardsManagement';
import Reports from './pages/Reports';
import RewardsStore from './pages/RewardsStore';
import RoomAccessManagement from './pages/RoomAccessManagement';
import SalaryManagement from './pages/SalaryManagement';
import ScannerSettings from './pages/ScannerSettings';
import ScheduledReports from './pages/ScheduledReports';
import SchoolSettings from './pages/SchoolSettings';
import SchoolShopManagement from './pages/SchoolShopManagement';
import SecuritySettings from './pages/SecuritySettings';
import Settings from './pages/Settings';
import SettingsHub from './pages/SettingsHub';
import StudentAssignmentDashboard from './pages/StudentAssignmentDashboard';
import StudentAssignments from './pages/StudentAssignments';
import StudentAttendance from './pages/StudentAttendance';
import StudentClasses from './pages/StudentClasses';
import StudentDashboard from './pages/StudentDashboard';
import StudentGrades from './pages/StudentGrades';
import StudentManagement from './pages/StudentManagement';
import StudentProfile from './pages/StudentProfile';
import StudentProgressTracking from './pages/StudentProgressTracking';
import StudentRecords from './pages/StudentRecords';
import StudentTests from './pages/StudentTests';
import TakeExam from './pages/TakeExam';
import TeacherAssignmentManager from './pages/TeacherAssignmentManager';
import TeacherAssignments from './pages/TeacherAssignments';
import TeacherDashboard from './pages/TeacherDashboard';
import TeacherManagement from './pages/TeacherManagement';
import TeacherSchedule from './pages/TeacherSchedule';
import TeacherTests from './pages/TeacherTests';
import TermsOfService from './pages/TermsOfService';
import TimetableManagement from './pages/TimetableManagement';
import TripsManagement from './pages/TripsManagement';
import UnifiedAttendance from './pages/UnifiedAttendance';
import UserManagement from './pages/UserManagement';
import UserProfile from './pages/UserProfile';
import VendorDashboard from './pages/VendorDashboard';
import VendorManagement from './pages/VendorManagement';
import VendorProfile from './pages/VendorProfile';
import __Layout from './Layout.jsx';


export const PAGES = {
    "AIGradingAssistant": AIGradingAssistant,
    "AILessonPlanner": AILessonPlanner,
    "AcademicsHub": AcademicsHub,
    "ActivationPage": ActivationPage,
    "ActiveClasses": ActiveClasses,
    "Activities": Activities,
    "AdminDashboard": AdminDashboard,
    "AdminLinkingRequests": AdminLinkingRequests,
    "AdminReportsDashboard": AdminReportsDashboard,
    "AdmissionsManagement": AdmissionsManagement,
    "AssignmentBuilder": AssignmentBuilder,
    "AssignmentManagement": AssignmentManagement,
    "AttendanceTaking": AttendanceTaking,
    "AuditLogs": AuditLogs,
    "BackupSettings": BackupSettings,
    "BehaviorAnalytics": BehaviorAnalytics,
    "BehaviorManagement": BehaviorManagement,
    "BehaviorTracking": BehaviorTracking,
    "BiometricAttendance": BiometricAttendance,
    "BookshopManager": BookshopManager,
    "BookshopReports": BookshopReports,
    "ClassroomResources": ClassroomResources,
    "ClubsManagement": ClubsManagement,
    "ConferenceScheduling": ConferenceScheduling,
    "ContactLists": ContactLists,
    "Contacts": Contacts,
    "CreateInvoice": CreateInvoice,
    "CreateReportCard": CreateReportCard,
    "CurriculumMapping": CurriculumMapping,
    "DeliveryReports": DeliveryReports,
    "DetailedExamAnalytics": DetailedExamAnalytics,
    "EnrollmentManagement": EnrollmentManagement,
    "EventCalendar": EventCalendar,
    "ExamAnalytics": ExamAnalytics,
    "ExamAttemptReview": ExamAttemptReview,
    "ExamCommandCenter": ExamCommandCenter,
    "ExamCreator": ExamCreator,
    "ExamManagement": ExamManagement,
    "ExamResults": ExamResults,
    "ExpenseTracking": ExpenseTracking,
    "FeePolicies": FeePolicies,
    "FeeReminderSystem": FeeReminderSystem,
    "FeesManagement": FeesManagement,
    "GradeExam": GradeExam,
    "Gradebook": Gradebook,
    "ImprovedStudentRecords": ImprovedStudentRecords,
    "InstalmentPlans": InstalmentPlans,
    "InvoiceDetail": InvoiceDetail,
    "LandingPage": LandingPage,
    "MessagingCenter": MessagingCenter,
    "MyClasses": MyClasses,
    "NotificationsSettings": NotificationsSettings,
    "ParentActivities": ParentActivities,
    "ParentAssignmentView": ParentAssignmentView,
    "ParentAttendance": ParentAttendance,
    "ParentBehavior": ParentBehavior,
    "ParentCalendar": ParentCalendar,
    "ParentConferences": ParentConferences,
    "ParentFees": ParentFees,
    "ParentHomework": ParentHomework,
    "ParentLinkingRequests": ParentLinkingRequests,
    "ParentManagement": ParentManagement,
    "ParentPortal": ParentPortal,
    "ParentReports": ParentReports,
    "ParentSchoolShop": ParentSchoolShop,
    "ParentStudentView": ParentStudentView,
    "PaymentProviders": PaymentProviders,
    "PrivacyPolicy": PrivacyPolicy,
    "ProctoringAnalytics": ProctoringAnalytics,
    "ProctoringMonitor": ProctoringMonitor,
    "ProfileSetupPage": ProfileSetupPage,
    "PublicApplicationForm": PublicApplicationForm,
    "QuestionBank": QuestionBank,
    "ReportCardView": ReportCardView,
    "ReportCardsManagement": ReportCardsManagement,
    "Reports": Reports,
    "RewardsStore": RewardsStore,
    "RoomAccessManagement": RoomAccessManagement,
    "SalaryManagement": SalaryManagement,
    "ScannerSettings": ScannerSettings,
    "ScheduledReports": ScheduledReports,
    "SchoolSettings": SchoolSettings,
    "SchoolShopManagement": SchoolShopManagement,
    "SecuritySettings": SecuritySettings,
    "Settings": Settings,
    "SettingsHub": SettingsHub,
    "StudentAssignmentDashboard": StudentAssignmentDashboard,
    "StudentAssignments": StudentAssignments,
    "StudentAttendance": StudentAttendance,
    "StudentClasses": StudentClasses,
    "StudentDashboard": StudentDashboard,
    "StudentGrades": StudentGrades,
    "StudentManagement": StudentManagement,
    "StudentProfile": StudentProfile,
    "StudentProgressTracking": StudentProgressTracking,
    "StudentRecords": StudentRecords,
    "StudentTests": StudentTests,
    "TakeExam": TakeExam,
    "TeacherAssignmentManager": TeacherAssignmentManager,
    "TeacherAssignments": TeacherAssignments,
    "TeacherDashboard": TeacherDashboard,
    "TeacherManagement": TeacherManagement,
    "TeacherSchedule": TeacherSchedule,
    "TeacherTests": TeacherTests,
    "TermsOfService": TermsOfService,
    "TimetableManagement": TimetableManagement,
    "TripsManagement": TripsManagement,
    "UnifiedAttendance": UnifiedAttendance,
    "UserManagement": UserManagement,
    "UserProfile": UserProfile,
    "VendorDashboard": VendorDashboard,
    "VendorManagement": VendorManagement,
    "VendorProfile": VendorProfile,
}

export const pagesConfig = {
    mainPage: "AIGradingAssistant",
    Pages: PAGES,
    Layout: __Layout,
};