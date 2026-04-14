import React from 'react';
import { Card, CardContent } from '@/components/ui/card';

export default function ReportDashboardCards({ metrics }) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {metrics.map((metric) => {
        const Icon = metric.icon;
        return (
          <Card key={metric.label} className="border-0 shadow-sm">
            <CardContent className="flex items-center justify-between p-5">
              <div>
                <p className="text-sm text-muted-foreground">{metric.label}</p>
                <p className="mt-2 text-2xl font-semibold text-foreground">{metric.value}</p>
              </div>
              <div className={`rounded-2xl p-3 ${metric.color}`}>
                <Icon className="h-5 w-5 text-white" />
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}