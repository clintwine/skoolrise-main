import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { AlertTriangle, BarChart3, TrendingUp, FileCheck } from 'lucide-react';

const cards = [
  { key: 'average', label: 'Overall Average', icon: BarChart3, color: 'bg-blue-100 text-blue-700' },
  { key: 'recent', label: 'Recent Average', icon: TrendingUp, color: 'bg-emerald-100 text-emerald-700' },
  { key: 'submissions', label: 'Submissions', icon: FileCheck, color: 'bg-violet-100 text-violet-700' },
  { key: 'status', label: 'Support Status', icon: AlertTriangle, color: 'bg-amber-100 text-amber-700' },
];

export default function StudentInsightCards({ avgGrade, recentAvg, submissionsCount, needsSupport, trend }) {
  const values = {
    average: `${avgGrade}%`,
    recent: `${recentAvg}%`,
    submissions: submissionsCount,
    status: needsSupport ? 'Needs Support' : `On Track · ${trend}`,
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
      {cards.map((card) => {
        const Icon = card.icon;
        return (
          <Card key={card.key} className="border-0 shadow-sm bg-white">
            <CardContent className="p-5 flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">{card.label}</p>
                <p className="text-2xl font-bold text-gray-900">{values[card.key]}</p>
              </div>
              <div className={`w-11 h-11 rounded-xl flex items-center justify-center ${card.color}`}>
                <Icon className="w-5 h-5" />
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}