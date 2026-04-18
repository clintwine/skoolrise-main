import React, { useState } from 'react';
import { useSchoolContext } from '@/hooks/useSchoolContext';
import Leaderboard from '@/components/gamification/Leaderboard';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export default function StudentLeaderboard() {
  const { school_tenant_id } = useSchoolContext();
  const [filter, setFilter] = useState('all');

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Leaderboard</h1>
          <p className="text-gray-600 mt-1">See how you rank among your peers</p>
        </div>
        <Select value={filter} onValueChange={setFilter}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Filter by class" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Students</SelectItem>
            <SelectItem value="my-class">My Class</SelectItem>
            <SelectItem value="grade">My Grade</SelectItem>
          </SelectContent>
        </Select>
      </div>
      
      <Leaderboard limit={20} filter={filter} schoolId={school_tenant_id} />
    </div>
  );
}