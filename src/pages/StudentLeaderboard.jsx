import React from 'react';
import Leaderboard from '@/components/gamification/Leaderboard';

export default function StudentLeaderboard() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Leaderboard</h1>
        <p className="text-gray-600 mt-1">See how you rank among your peers</p>
      </div>
      
      <Leaderboard limit={20} />
    </div>
  );
}