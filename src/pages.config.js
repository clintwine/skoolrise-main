import AcademicSessions from './pages/AcademicSessions';
import Activities from './pages/Activities';
import AdminDashboard from './pages/AdminDashboard';
import AttendanceManagement from './pages/AttendanceManagement';
import BehaviorManagement from './pages/BehaviorManagement';
import BiometricAttendance from './pages/BiometricAttendance';
import BookshopManager from './pages/BookshopManager';
import BookshopReports from './pages/BookshopReports';
import ClassArms from './pages/ClassArms';
import ClassManagement from './pages/ClassManagement';
import Companies from './pages/Companies';
import CompanyDetail from './pages/CompanyDetail';
import Contacts from './pages/Contacts';
import CourseManagement from './pages/CourseManagement';
import Dashboard from './pages/Dashboard';
import Deals from './pages/Deals';
import EnrollmentManagement from './pages/EnrollmentManagement';
import ExamAnalytics from './pages/ExamAnalytics';
import ExamCreator from './pages/ExamCreator';
import ExamManagement from './pages/ExamManagement';
import ExamResults from './pages/ExamResults';
import ExpenseTracking from './pages/ExpenseTracking';
import FeesManagement from './pages/FeesManagement';
import GeneralSettings from './pages/GeneralSettings';
import GradeExam from './pages/GradeExam';
import GradingScales from './pages/GradingScales';
import MessagingCenter from './pages/MessagingCenter';
import NotificationsSettings from './pages/NotificationsSettings';
import ParentAttendance from './pages/ParentAttendance';
import ParentBehavior from './pages/ParentBehavior';
import ParentFees from './pages/ParentFees';
import ParentPortal from './pages/ParentPortal';
import ParentReports from './pages/ParentReports';
import ParentStudentView from './pages/ParentStudentView';
import ProctoringAnalytics from './pages/ProctoringAnalytics';
import QuestionBank from './pages/QuestionBank';
import ReportCardsManagement from './pages/ReportCardsManagement';
import Reports from './pages/Reports';
import SalaryManagement from './pages/SalaryManagement';
import SchoolSettings from './pages/SchoolSettings';
import SecuritySettings from './pages/SecuritySettings';
import Settings from './pages/Settings';
import StudentDashboard from './pages/StudentDashboard';
import StudentManagement from './pages/StudentManagement';
import StudentRecords from './pages/StudentRecords';
import TakeExam from './pages/TakeExam';
import TeacherDashboard from './pages/TeacherDashboard';
import TeacherManagement from './pages/TeacherManagement';
import TermsManagement from './pages/TermsManagement';
import TimetableManagement from './pages/TimetableManagement';
import UserManagement from './pages/UserManagement';
import VendorDashboard from './pages/VendorDashboard';
import VendorManagement from './pages/VendorManagement';
import VendorProfile from './pages/VendorProfile';
import TimetableCalendar from './pages/TimetableCalendar';
import AIGradingAssistant from './pages/AIGradingAssistant';
import StudentProgressTracking from './pages/StudentProgressTracking';
import __Layout from './Layout.jsx';


export const PAGES = {
    "AcademicSessions": AcademicSessions,
    "Activities": Activities,
    "AdminDashboard": AdminDashboard,
    "AttendanceManagement": AttendanceManagement,
    "BehaviorManagement": BehaviorManagement,
    "BiometricAttendance": BiometricAttendance,
    "BookshopManager": BookshopManager,
    "BookshopReports": BookshopReports,
    "ClassArms": ClassArms,
    "ClassManagement": ClassManagement,
    "Companies": Companies,
    "CompanyDetail": CompanyDetail,
    "Contacts": Contacts,
    "CourseManagement": CourseManagement,
    "Dashboard": Dashboard,
    "Deals": Deals,
    "EnrollmentManagement": EnrollmentManagement,
    "ExamAnalytics": ExamAnalytics,
    "ExamCreator": ExamCreator,
    "ExamManagement": ExamManagement,
    "ExamResults": ExamResults,
    "ExpenseTracking": ExpenseTracking,
    "FeesManagement": FeesManagement,
    "GeneralSettings": GeneralSettings,
    "GradeExam": GradeExam,
    "GradingScales": GradingScales,
    "MessagingCenter": MessagingCenter,
    "NotificationsSettings": NotificationsSettings,
    "ParentAttendance": ParentAttendance,
    "ParentBehavior": ParentBehavior,
    "ParentFees": ParentFees,
    "ParentPortal": ParentPortal,
    "ParentReports": ParentReports,
    "ParentStudentView": ParentStudentView,
    "ProctoringAnalytics": ProctoringAnalytics,
    "QuestionBank": QuestionBank,
    "ReportCardsManagement": ReportCardsManagement,
    "Reports": Reports,
    "SalaryManagement": SalaryManagement,
    "SchoolSettings": SchoolSettings,
    "SecuritySettings": SecuritySettings,
    "Settings": Settings,
    "StudentDashboard": StudentDashboard,
    "StudentManagement": StudentManagement,
    "StudentRecords": StudentRecords,
    "TakeExam": TakeExam,
    "TeacherDashboard": TeacherDashboard,
    "TeacherManagement": TeacherManagement,
    "TermsManagement": TermsManagement,
    "TimetableManagement": TimetableManagement,
    "UserManagement": UserManagement,
    "VendorDashboard": VendorDashboard,
    "VendorManagement": VendorManagement,
    "VendorProfile": VendorProfile,
    "TimetableCalendar": TimetableCalendar,
    "AIGradingAssistant": AIGradingAssistant,
    "StudentProgressTracking": StudentProgressTracking,
}

export const pagesConfig = {
    mainPage: "Dashboard",
    Pages: PAGES,
    Layout: __Layout,
};