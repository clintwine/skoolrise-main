import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CheckCircle2, Circle, Clock3 } from 'lucide-react';

const statusConfig = {
  planned: { icon: Circle, label: 'Planned', className: 'bg-gray-100 text-gray-700' },
  in_progress: { icon: Clock3, label: 'In Progress', className: 'bg-orange-100 text-orange-700' },
  implemented: { icon: CheckCircle2, label: 'Implemented', className: 'bg-green-100 text-green-700' },
};

export default function RoadmapPreview({ tasks = [] }) {
  const featureRows = tasks.filter(task => task.task_type === 'feature').slice(0, 6);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {featureRows.map((task) => {
        const config = statusConfig[task.status] || statusConfig.planned;
        const Icon = config.icon;
        return (
          <Card key={task.id} className="border-2 border-gray-200 hover:shadow-lg transition-all">
            <CardContent className="p-6 space-y-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h3 className="text-lg font-bold text-gray-900">{task.title}</h3>
                  <p className="text-sm text-gray-600 mt-2">{task.description}</p>
                </div>
                <Badge className={config.className}>
                  <Icon className="w-3 h-3 mr-1" />
                  {config.label}
                </Badge>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}