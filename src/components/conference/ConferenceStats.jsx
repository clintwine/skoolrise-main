import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { CalendarDays, Clock3, CheckCircle2, Users } from 'lucide-react';

const statConfig = [
  { key: 'total', label: 'Total Scheduled', icon: CalendarDays, color: 'text-blue-700 bg-blue-100' },
  { key: 'upcoming', label: 'Upcoming', icon: Clock3, color: 'text-emerald-700 bg-emerald-100' },
  { key: 'month', label: 'This Month', icon: Users, color: 'text-violet-700 bg-violet-100' },
  { key: 'completed', label: 'Completed', icon: CheckCircle2, color: 'text-slate-700 bg-slate-100' },
];

export default function ConferenceStats({ stats }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
      {statConfig.map((item) => {
        const Icon = item.icon;
        return (
          <Card key={item.key} className="bg-white shadow-sm border-0">
            <CardContent className="p-5 flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">{item.label}</p>
                <p className="text-2xl font-bold text-gray-900">{stats[item.key] || 0}</p>
              </div>
              <div className={`w-11 h-11 rounded-xl flex items-center justify-center ${item.color}`}>
                <Icon className="w-5 h-5" />
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}