import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { AlertTriangle, ShieldAlert, Users } from 'lucide-react';

const cards = [
  { key: 'high', label: 'High Risk', icon: ShieldAlert, color: 'text-red-700 bg-red-100' },
  { key: 'medium', label: 'Medium Risk', icon: AlertTriangle, color: 'text-orange-700 bg-orange-100' },
  { key: 'total', label: 'Students Flagged', icon: Users, color: 'text-slate-700 bg-slate-100' },
];

export default function RiskSummaryCards({ stats }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
      {cards.map((card) => {
        const Icon = card.icon;
        return (
          <Card key={card.key} className="bg-white border-0 shadow-sm">
            <CardContent className="p-5 flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">{card.label}</p>
                <p className="text-2xl font-bold text-gray-900">{stats[card.key] || 0}</p>
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