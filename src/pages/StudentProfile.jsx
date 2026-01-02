import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '../utils';

export default function StudentProfile() {
  const navigate = useNavigate();

  useEffect(() => {
    navigate(createPageUrl('UserProfile'));
  }, [navigate]);

  return (
    <div className="text-center py-12">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-accent mx-auto"></div>
      <p className="mt-4 text-text-secondary">Redirecting to profile...</p>
    </div>
  );
}