import React, { useState } from 'react';
import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { useSchoolContext } from '@/hooks/useSchoolContext';
import { addSchoolFilter } from '@/utils/schoolFilter';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Trophy, Medal, Award, Star, TrendingUp } from 'lucide-react';

const levelColors = {
  1: 'from-gray-400 to-gray-500',
  2: 'from-green-400 to-green-600',
  3: 'from-blue-400 to-blue-600',
  4: 'from-purple-400 to-purple-600',
  5: 'from-yellow-400 to-yellow-600',
};

const levelNames = {
  1: 'Beginner',
  2: 'Explorer',
  3: 'Achiever',
  4: 'Champion',
  5: 'Legend',
};

export default function Leaderboard({ classId, limit = 10 }) {
  const [timeFrame, setTimeFrame] = useState('all');
  const { school_tenant_id, isReady } = useSchoolContext();

  const { data: studentPoints = [], isLoading } = useQuery({
    queryKey: ['student-points-leaderboard', school_tenant_id],
    queryFn: () => base44.entities.StudentPoints.filter(addSchoolFilter({}, school_tenant_id), '-lifetime_points', 100),
    enabled: isReady,
  });

  const { data: students = [] } = useQuery({
    queryKey: ['students-leaderboard', school_tenant_id],
    queryFn: () => base44.entities.Student.filter(addSchoolFilter({}, school_tenant_id)),
    enabled: isReady,
  });

  const studentMap = {};
  students.forEach(s => { studentMap[s.id] = s; });

  // Filter by class if provided
  let filteredPoints = studentPoints;
  if (classId) {
    filteredPoints = studentPoints.filter(sp => {
      const student = studentMap[sp.student_id];
      return student?.class_id === classId;
    });
  }

  // Sort by lifetime points and take top N
  const leaderboard = filteredPoints
    .sort((a, b) => (b.lifetime_points || 0) - (a.lifetime_points || 0))
    .slice(0, limit);

  const getRankIcon = (rank) => {
    if (rank === 1) return <Trophy className="w-6 h-6 text-yellow-500" />;
    if (rank === 2) return <Medal className="w-6 h-6 text-gray-400" />;
    if (rank === 3) return <Medal className="w-6 h-6 text-amber-600" />;
    return <span className="w-6 h-6 flex items-center justify-center text-gray-500 font-bold">{rank}</span>;
  };

  const getRankBg = (rank) => {
    if (rank === 1) return 'bg-gradient-to-r from-yellow-50 to-yellow-100 border-yellow-200';
    if (rank === 2) return 'bg-gradient-to-r from-gray-50 to-gray-100 border-gray-200';
    if (rank === 3) return 'bg-gradient-to-r from-amber-50 to-amber-100 border-amber-200';
    return 'bg-white border-gray-100';
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Trophy className="w-5 h-5 text-yellow-500" />
            Leaderboard
          </CardTitle>
          <Select value={timeFrame} onValueChange={setTimeFrame}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Time</SelectItem>
              <SelectItem value="month">This Month</SelectItem>
              <SelectItem value="week">This Week</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        ) : leaderboard.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <Trophy className="w-12 h-12 mx-auto mb-3 text-gray-300" />
            <p>No points earned yet</p>
          </div>
        ) : (
          <div className="space-y-2">
            {leaderboard.map((entry, idx) => {
              const rank = idx + 1;
              const student = studentMap[entry.student_id];
              const level = entry.level || 1;

              return (
                <div
                  key={entry.id}
                  className={`flex items-center gap-3 p-3 rounded-xl border ${getRankBg(rank)} transition-all hover:shadow-md`}
                >
                  <div className="flex-shrink-0 w-8">
                    {getRankIcon(rank)}
                  </div>
                  
                  {student?.photo_url ? (
                    <img src={student.photo_url} alt="" className="w-10 h-10 rounded-full object-cover" />
                  ) : (
                    <div className={`w-10 h-10 rounded-full bg-gradient-to-br ${levelColors[level]} flex items-center justify-center text-white font-bold`}>
                      {entry.student_name?.charAt(0) || '?'}
                    </div>
                  )}
                  
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-gray-900 truncate">
                      {entry.student_name || 'Unknown Student'}
                    </p>
                    <div className="flex items-center gap-2">
                      <span className={`text-xs px-2 py-0.5 rounded-full bg-gradient-to-r ${levelColors[level]} text-white`}>
                        {levelNames[level]}
                      </span>
                      <span className="text-xs text-gray-500">
                        Level {level}
                      </span>
                    </div>
                  </div>
                  
                  <div className="text-right">
                    <div className="flex items-center gap-1 text-lg font-bold text-gray-900">
                      <Star className="w-4 h-4 text-yellow-500" />
                      {(entry.lifetime_points || 0).toLocaleString()}
                    </div>
                    <p className="text-xs text-gray-500">points</p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}