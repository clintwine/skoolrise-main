import Activities from './pages/Activities';
import Companies from './pages/Companies';
import CompanyDetail from './pages/CompanyDetail';
import Contacts from './pages/Contacts';
import Dashboard from './pages/Dashboard';
import Deals from './pages/Deals';
import AdminDashboard from './pages/AdminDashboard';
import StudentRecords from './pages/StudentRecords';
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
}

export const pagesConfig = {
    mainPage: "Dashboard",
    Pages: PAGES,
    Layout: __Layout,
};