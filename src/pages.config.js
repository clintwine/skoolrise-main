import Dashboard from './pages/Dashboard';
import Contacts from './pages/Contacts';
import Deals from './pages/Deals';
import Companies from './pages/Companies';
import Activities from './pages/Activities';
import CompanyDetail from './pages/CompanyDetail';
import __Layout from './Layout.jsx';


export const PAGES = {
    "Dashboard": Dashboard,
    "Contacts": Contacts,
    "Deals": Deals,
    "Companies": Companies,
    "Activities": Activities,
    "CompanyDetail": CompanyDetail,
}

export const pagesConfig = {
    mainPage: "Dashboard",
    Pages: PAGES,
    Layout: __Layout,
};