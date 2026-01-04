import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { createPageUrl } from '../utils';
import { 
  Home, BookOpen, ClipboardList, User, DollarSign, 
  Calendar, Users, Award, Settings, BarChart3
} from 'lucide-react';

const navConfigs = {
  admin: [
    { name: 'Home', icon: Home, path: 'AdminDashboard' },
    { name: 'Students', icon: Users, path: 'StudentRecords' },
    { name: 'Academics', icon: BookOpen, path: 'AcademicsHub' },
    { name: 'Fees', icon: DollarSign, path: 'FeesManagement' },
    { name: 'More', icon: Settings, path: 'SettingsHub' },
  ],
  teacher: [
    { name: 'Home', icon: Home, path: 'TeacherDashboard' },
    { name: 'Classes', icon: BookOpen, path: 'MyClasses' },
    { name: 'Attendance', icon: Calendar, path: 'AttendanceTaking' },
    { name: 'Grades', icon: Award, path: 'Gradebook' },
    { name: 'Profile', icon: User, path: 'UserProfile' },
  ],
  student: [
    { name: 'Home', icon: Home, path: 'StudentDashboard' },
    { name: 'Classes', icon: BookOpen, path: 'StudentClasses' },
    { name: 'Tasks', icon: ClipboardList, path: 'StudentAssignments' },
    { name: 'Grades', icon: Award, path: 'StudentGrades' },
    { name: 'Profile', icon: User, path: 'UserProfile' },
  ],
  parent: [
    { name: 'Home', icon: Home, path: 'ParentPortal' },
    { name: 'Children', icon: Users, path: 'ParentStudentView' },
    { name: 'Fees', icon: DollarSign, path: 'ParentFees' },
    { name: 'Reports', icon: BarChart3, path: 'ParentReports' },
    { name: 'Profile', icon: User, path: 'UserProfile' },
  ],
  vendor: [
    { name: 'Home', icon: Home, path: 'VendorDashboard' },
    { name: 'Catalog', icon: BookOpen, path: 'VendorDashboard' },
    { name: 'Profile', icon: User, path: 'VendorProfile' },
  ],
};

export default function MobileBottomNav({ userRole, currentPageName }) {
  const location = useLocation();
  const navItems = navConfigs[userRole] || navConfigs.student;

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-gray-200 lg:hidden safe-area-bottom">
      <div className="flex items-center justify-around h-16 px-2">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentPageName === item.path;
          
          return (
            <Link
              key={item.path}
              to={createPageUrl(item.path)}
              className={`flex flex-col items-center justify-center flex-1 h-full min-w-0 px-1 transition-all duration-200 ${
                isActive 
                  ? 'text-blue-600' 
                  : 'text-gray-500 hover:text-gray-700 active:scale-95'
              }`}
            >
              <div className={`p-1.5 rounded-xl transition-all duration-200 ${
                isActive ? 'bg-blue-100' : ''
              }`}>
                <Icon className={`w-5 h-5 ${isActive ? 'stroke-[2.5]' : ''}`} />
              </div>
              <span className={`text-[10px] mt-0.5 truncate max-w-full ${
                isActive ? 'font-semibold' : 'font-medium'
              }`}>
                {item.name}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}