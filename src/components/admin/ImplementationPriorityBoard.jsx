import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowUpRight, CheckCircle2, Clock3, Circle } from 'lucide-react';

const statusConfig = {
  planned: { icon: Circle, label: 'Planned', className: 'bg-gray-100 text-gray-700' },
  in_progress: { icon: Clock3, label: 'In Progress', className: 'bg-orange-100 text-orange-700' },
  implemented: { icon: CheckCircle2, label: 'Implemented', className: 'bg-green-100 text-green-700' },
};

export default function ImplementationPriorityBoard({ epics = [] }) {
  return (
    <Card className="bg-white border-0 shadow-md">
      <CardHeader className="p-4 sm:p-6">
        <CardTitle className="text-base sm:text-lg">Top 5% roadmap priority</CardTitle>
      </CardHeader>
      <CardContent className="p-4 sm:p-6 pt-0 space-y-3">
        {epics.map((epic) => {
          const config = statusConfig[epic.status] || statusConfig.planned;
          const Icon = config.icon;
          return (
            <div key={epic.id} className="flex flex-col gap-3 rounded-xl border border-gray-200 p-4 md:flex-row md:items-start md:justify-between">
              <div className="space-y-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <Badge variant="outline">{epic.code}</Badge>
                  <Badge className={config.className}><Icon className="w-3 h-3 mr-1" />{config.label}</Badge>
                  <Badge className="bg-blue-100 text-blue-700">Phase {epic.recommended_order}</Badge>
                </div>
                <h3 className="font-semibold text-gray-900">{epic.title}</h3>
                <p className="text-sm text-gray-600">{epic.description}</p>
                <p className="text-xs text-gray-500">Primary area: {epic.target_page}</p>
              </div>
              <div className="flex items-center text-xs text-blue-700 font-medium">
                <ArrowUpRight className="w-4 h-4 mr-1" />
                {epic.implementation_priority}
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}