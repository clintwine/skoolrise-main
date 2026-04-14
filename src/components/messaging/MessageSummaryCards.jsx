import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Mail, Clock3, CheckCircle2, AlertCircle } from 'lucide-react';

const cards = [
  { key: 'total', label: 'Total Messages', icon: Mail, color: 'text-slate-700 bg-slate-100' },
  { key: 'scheduled', label: 'Scheduled', icon: Clock3, color: 'text-blue-700 bg-blue-100' },
  { key: 'sent', label: 'Sent', icon: CheckCircle2, color: 'text-green-700 bg-green-100' },
  { key: 'failed', label: 'Failed', icon: AlertCircle, color: 'text-red-700 bg-red-100' },
];

export default function MessageSummaryCards({ stats }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
      {cards.map((card) => {
        const Icon = card.icon;
        return (
          <Card key={card.key} className="bg-white shadow-sm border-0">
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