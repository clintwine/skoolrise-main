import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Clock3, Goal, ListChecks, LibraryBig } from 'lucide-react';

const items = [
  { key: 'duration', label: 'Duration', icon: Clock3 },
  { key: 'objectives', label: 'Objectives', icon: Goal },
  { key: 'materials', label: 'Materials', icon: LibraryBig },
  { key: 'sections', label: 'Lesson Parts', icon: ListChecks },
];

export default function LessonPlanSummaryCards({ lessonPlan, fallbackDuration }) {
  const stats = {
    duration: lessonPlan?.duration || fallbackDuration,
    objectives: lessonPlan?.learning_objectives?.length || 0,
    materials: lessonPlan?.materials?.length || 0,
    sections: ['warm_up', 'direct_instruction', 'guided_practice', 'independent_practice', 'closure'].filter((key) => lessonPlan?.[key]).length,
  };

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
      {items.map((item) => {
        const Icon = item.icon;
        return (
          <Card key={item.key} className="border-0 shadow-sm bg-white">
            <CardContent className="p-5 flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">{item.label}</p>
                <p className="text-2xl font-bold text-gray-900">{stats[item.key]}</p>
              </div>
              <div className="w-11 h-11 rounded-xl bg-indigo-100 text-indigo-700 flex items-center justify-center">
                <Icon className="w-5 h-5" />
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}