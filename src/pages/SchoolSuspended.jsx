import React from 'react';
import { base44 } from '@/api/base44Client';
import { Lock, Mail } from 'lucide-react';

export default function SchoolSuspended({ schoolName = 'Your School' }) {
  const handleLogout = () => {
    base44.auth.logout();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-lg p-8 text-center">
        {/* Logo */}
        <div className="mb-6">
          <img 
            src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/69441b6bd765d833c80ac7ff/90d2daf9a_oie_b7JlP4U16so5.png" 
            alt="SkoolRise" 
            className="h-12 w-auto mx-auto"
          />
        </div>

        {/* Icon */}
        <div className="mb-6 flex justify-center">
          <div className="p-4 bg-red-100 rounded-full">
            <Lock className="w-8 h-8 text-red-600" />
          </div>
        </div>

        {/* School Name */}
        <h1 className="text-2xl font-bold text-slate-900 mb-2">
          {schoolName}
        </h1>

        {/* Status Message */}
        <div className="mb-6">
          <h2 className="text-lg font-semibold text-slate-700 mb-3">
            Account Suspended
          </h2>
          <p className="text-slate-600 text-sm leading-relaxed">
            Your school's account has been deactivated. This may be due to billing, compliance, or other administrative reasons.
          </p>
        </div>

        {/* Support Message */}
        <p className="text-slate-500 text-xs mb-6">
          Please contact SkoolRise support to reactivate your account.
        </p>

        {/* Actions */}
        <div className="space-y-3">
          <a
            href="mailto:support@skoolrise.com"
            className="w-full inline-flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors"
          >
            <Mail className="w-4 h-4" />
            Contact Support
          </a>
          
          <button
            onClick={handleLogout}
            className="w-full px-4 py-3 bg-slate-200 hover:bg-slate-300 text-slate-800 font-medium rounded-lg transition-colors"
          >
            Sign Out
          </button>
        </div>
      </div>
    </div>
  );
}