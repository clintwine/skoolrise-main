import { Toaster } from "@/components/ui/toaster"
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClientInstance } from '@/lib/query-client'
import VisualEditAgent from '@/lib/VisualEditAgent'
import NavigationTracker from '@/lib/NavigationTracker'
import { pagesConfig } from './pages.config'
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import PageNotFound from './lib/PageNotFound';
import { AuthProvider, useAuth } from '@/lib/AuthContext';
import UserNotRegisteredError from '@/components/UserNotRegisteredError';
import StudentPerformanceReports from '@/pages/StudentPerformanceReports';
import SchoolEnquiry from '@/pages/SchoolEnquiry';
import SuperadminDashboard from '@/pages/SuperadminDashboard';
import SuperadminSchoolCreate from '@/pages/SuperadminSchoolCreate';
import SuperadminSchoolEdit from '@/pages/SuperadminSchoolEdit';
import SuperadminSchoolView from '@/pages/SuperadminSchoolView';

const { Pages, Layout, mainPage } = pagesConfig;
const mainPageKey = mainPage ?? Object.keys(Pages)[0];
const MainPage = mainPageKey ? Pages[mainPageKey] : <></>;

const LayoutWrapper = ({ children, currentPageName }) => Layout ?
  <Layout currentPageName={currentPageName}>{children}</Layout>
  : <>{children}</>;

const AuthenticatedApp = () => {
  const { isLoadingAuth, isLoadingPublicSettings, authError, navigateToLogin } = useAuth();

  // Show loading spinner while checking app public settings or auth
  if (isLoadingPublicSettings || isLoadingAuth) {
    return (
      <div className="fixed inset-0 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-slate-200 border-t-slate-800 rounded-full animate-spin"></div>
      </div>
    );
  }

  // Handle authentication errors
  if (authError) {
    if (authError.type === 'user_not_registered') {
      return <UserNotRegisteredError />;
    } else if (authError.type === 'auth_required') {
      // Redirect to login automatically
      navigateToLogin();
      return null;
    }
  }

  const RootRedirect = () => {
    const { isAuthenticated, navigateToLogin: goToLogin } = useAuth();
    if (!isAuthenticated) {
      goToLogin();
      return null;
    }
    return (
      <LayoutWrapper currentPageName={mainPageKey}>
        <MainPage />
      </LayoutWrapper>
    );
  };

  // Render the main app
  return (
    <Routes>
      <Route path="/" element={<RootRedirect />} />
      {Object.entries(Pages).map(([path, Page]) => (
        <Route
          key={path}
          path={`/${path}`}
          element={
            <LayoutWrapper currentPageName={path}>
              <Page />
            </LayoutWrapper>
          }
        />
      ))}
      <Route
        path="/StudentPerformanceReports"
        element={
          <LayoutWrapper currentPageName="StudentPerformanceReports">
            <StudentPerformanceReports />
          </LayoutWrapper>
        }
      />
      <Route
        path="/SchoolEnquiry"
        element={
          <LayoutWrapper currentPageName="SchoolEnquiry">
            <SchoolEnquiry />
          </LayoutWrapper>
        }
      />
      <Route
        path="/SuperadminDashboard"
        element={
          <LayoutWrapper currentPageName="SuperadminDashboard">
            <SuperadminDashboard />
          </LayoutWrapper>
        }
      />
      <Route
        path="/SuperadminSchoolCreate"
        element={
          <LayoutWrapper currentPageName="SuperadminSchoolCreate">
            <SuperadminSchoolCreate />
          </LayoutWrapper>
        }
      />
      <Route
        path="/SuperadminSchoolEdit"
        element={
          <LayoutWrapper currentPageName="SuperadminSchoolEdit">
            <SuperadminSchoolEdit />
          </LayoutWrapper>
        }
      />
      <Route
        path="/SuperadminSchoolView"
        element={
          <LayoutWrapper currentPageName="SuperadminSchoolView">
            <SuperadminSchoolView />
          </LayoutWrapper>
        }
      />
      <Route path="*" element={<PageNotFound />} />
    </Routes>
  );
};


function App() {

  return (
    <AuthProvider>
      <QueryClientProvider client={queryClientInstance}>
        <Router>
          <NavigationTracker />
          <AuthenticatedApp />
        </Router>
        <Toaster />
        <VisualEditAgent />
      </QueryClientProvider>
    </AuthProvider>
  )
}

export default App