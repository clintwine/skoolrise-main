import Activities from './pages/Activities';
import Companies from './pages/Companies';
import CompanyDetail from './pages/CompanyDetail';
import Contacts from './pages/Contacts';
import Dashboard from './pages/Dashboard';
import Deals from './pages/Deals';
import AdminDashboard from './pages/AdminDashboard';
import StudentRecords from './pages/StudentRecords';
import TeacherDashboard from './pages/TeacherDashboard';
import StudentDashboard from './pages/StudentDashboard';
import AcademicSessions from './pages/AcademicSessions';
import TermsManagement from './pages/TermsManagement';
import FeesManagement from './pages/FeesManagement';
import ParentPortal from './pages/ParentPortal';
import ReportCardsManagement from './pages/ReportCardsManagement';
import GradingScales from './pages/GradingScales';
import ClassArms from './pages/ClassArms';
import TimetableManagement from './pages/TimetableManagement';
import MessagingCenter from './pages/MessagingCenter';
import BiometricAttendance from './pages/BiometricAttendance';
import __Layout from './Layout.jsx';


export const PAGES = {
    "Activities": Activities,
    "Companies": Companies,
    "CompanyDetail": CompanyDetail,
    "Contacts": Contacts,
    "Dashboard": Dashboard,
    "Deals": Deals,
    "AdminDashboard": AdminDashboard,
    "StudentRecords": StudentRecords,
    "TeacherDashboard": TeacherDashboard,
    "StudentDashboard": StudentDashboard,
    "AcademicSessions": AcademicSessions,
    "TermsManagement": TermsManagement,
    "FeesManagement": FeesManagement,
    "ParentPortal": ParentPortal,
    "ReportCardsManagement": ReportCardsManagement,
    "GradingScales": GradingScales,
    "ClassArms": ClassArms,
    "TimetableManagement": TimetableManagement,
    "MessagingCenter": MessagingCenter,
    "BiometricAttendance": BiometricAttendance,
}

export const pagesConfig = {
    mainPage: "Dashboard",
    Pages: PAGES,
    Layout: __Layout,
};