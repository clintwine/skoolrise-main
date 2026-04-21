import React from 'react';
import { Lock } from 'lucide-react';

export default function UpgradePrompt({ feature, currentPlan, minimumPlan }) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-lg p-8">
        <div className="flex justify-center mb-6">
          <div className="p-4 bg-blue-100 rounded-full">
            <Lock className="w-8 h-8 text-blue-600" />
          </div>
        </div>

        <h1 className="text-2xl font-bold text-center text-slate-900 mb-3">
          Premium Feature
        </h1>

        <p className="text-center text-slate-600 mb-6">
          This feature is not available on your current <span className="font-semibold">{currentPlan}</span> plan.
        </p>

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <p className="text-sm text-slate-700">
            Upgrade to <span className="font-semibold">{minimumPlan}</span> plan to unlock this feature.
          </p>
        </div>

        <a
          href="mailto:sales@skoolrise.com?subject=Plan%20Upgrade%20Request"
          className="w-full inline-block text-center px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors"
        >
          Contact SkoolRise
        </a>
      </div>
    </div>
  );
}