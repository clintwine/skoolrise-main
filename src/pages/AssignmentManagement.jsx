import React, { useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '../utils';

export default function AssignmentManagement() {
  const navigate = useNavigate();

  const { data: user, isLoading } = useQuery({
    queryKey: ['current-user'],
    queryFn: () => base44.auth.me(),
  });

  useEffect(() => {
    if (user) {
      const userType = user.user_type || '';
      const isAdmin = user.role === 'admin' || userType === 'admin';

      if (isAdmin || userType === 'teacher') {
        navigate(createPageUrl('TeacherAssignmentManager'));
      } else if (userType === 'student') {
        navigate(createPageUrl('StudentAssignmentDashboard'));
      } else if (userType === 'parent') {
        navigate(createPageUrl('ParentAssignmentView'));
      } else {
        navigate(createPageUrl('TeacherAssignmentManager'));
      }
    }
  }, [user, navigate]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return null;
}