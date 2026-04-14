import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

export default function PersonalizedFeedCard({ title, items = [], emptyText = 'Nothing to show right now.' }) {
  return (
    <Card className="bg-white border-0 shadow-md">
      <CardHeader className="p-4 sm:p-6">
        <CardTitle className="text-lg sm:text-xl">{title}</CardTitle>
      </CardHeader>
      <CardContent className="p-4 sm:p-6 pt-0 space-y-3">
        {items.length === 0 ? (
          <p className="text-sm text-gray-500">{emptyText}</p>
        ) : (
          items.map((item, index) => (
            <div key={index} className="rounded-xl border border-gray-200 p-4 space-y-2">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-semibold text-gray-900">{item.title}</p>
                  {item.subtitle && <p className="text-sm text-gray-600">{item.subtitle}</p>}
                </div>
                {item.badge && <Badge className={item.badgeClassName || 'bg-blue-100 text-blue-700'}>{item.badge}</Badge>}
              </div>
              {item.description && <p className="text-sm text-gray-600">{item.description}</p>}
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
}