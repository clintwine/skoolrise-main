import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { BookOpen, Link2, Target, Layers3 } from 'lucide-react';

const config = [
  { key: 'standards', label: 'Total Standards', icon: BookOpen, color: 'bg-blue-100 text-blue-700' },
  { key: 'mappings', label: 'Mapped Items', icon: Link2, color: 'bg-emerald-100 text-emerald-700' },
  { key: 'subjects', label: 'Subjects', icon: Target, color: 'bg-violet-100 text-violet-700' },
  { key: 'grades', label: 'Grade Levels', icon: Layers3, color: 'bg-orange-100 text-orange-700' },
];

export default function CurriculumStats({ stats }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
      {config.map((item) => {
        const Icon = item.icon;
        return (
          <Card key={item.key} className="border-0 shadow-sm bg-white">
            <CardContent className="p-5 flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">{item.label}</p>
                <p className="text-2xl font-bold text-gray-900">{stats[item.key]}</p>
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