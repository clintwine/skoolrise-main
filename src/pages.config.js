import AcademicSessions from './pages/AcademicSessions';
import Activities from './pages/Activities';
import AdminDashboard from './pages/AdminDashboard';
import BiometricAttendance from './pages/BiometricAttendance';
import ClassArms from './pages/ClassArms';
import Companies from './pages/Companies';
import CompanyDetail from './pages/CompanyDetail';
import Contacts from './pages/Contacts';
import Dashboard from './pages/Dashboard';
import Deals from './pages/Deals';
import ExamCreator from './pages/ExamCreator';
import FeesManagement from './pages/FeesManagement';
import GradingScales from './pages/GradingScales';
import MessagingCenter from './pages/MessagingCenter';
import ParentPortal from './pages/ParentPortal';
import QuestionBank from './pages/QuestionBank';
import ReportCardsManagement from './pages/ReportCardsManagement';
import StudentDashboard from './pages/StudentDashboard';
import StudentRecords from './pages/StudentRecords';
import TeacherDashboard from './pages/TeacherDashboard';
import TermsManagement from './pages/TermsManagement';
import TimetableManagement from './pages/TimetableManagement';
import TakeExam from './pages/TakeExam';
import ExamManagement from './pages/ExamManagement';
import GradeExam from './pages/GradeExam';
import ExamResults from './pages/ExamResults';
import ExamAnalytics from './pages/ExamAnalytics';
import __Layout from './Layout.jsx';


export const PAGES = {
    "AcademicSessions": AcademicSessions,
    "Activities": Activities,
    "AdminDashboard": AdminDashboard,
    "BiometricAttendance": BiometricAttendance,
    "ClassArms": ClassArms,
    "Companies": Companies,
    "CompanyDetail": CompanyDetail,
    "Contacts": Contacts,
    "Dashboard": Dashboard,
    "Deals": Deals,
    "ExamCreator": ExamCreator,
    "FeesManagement": FeesManagement,
    "GradingScales": GradingScales,
    "MessagingCenter": MessagingCenter,
    "ParentPortal": ParentPortal,
    "QuestionBank": QuestionBank,
    "ReportCardsManagement": ReportCardsManagement,
    "StudentDashboard": StudentDashboard,
    "StudentRecords": StudentRecords,
    "TeacherDashboard": TeacherDashboard,
    "TermsManagement": TermsManagement,
    "TimetableManagement": TimetableManagement,
    "TakeExam": TakeExam,
    "ExamManagement": ExamManagement,
    "GradeExam": GradeExam,
    "ExamResults": ExamResults,
    "ExamAnalytics": ExamAnalytics,
}

export const pagesConfig = {
    mainPage: "Dashboard",
    Pages: PAGES,
    Layout: __Layout,
};