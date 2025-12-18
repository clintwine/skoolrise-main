import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Phone, Mail, Calendar, FileText, Users, Target, ArrowRight } from "lucide-react";
import { format } from "date-fns";

const activityConfig = {
  call: { icon: Phone, color: "bg-blue-100 text-blue-700", ring: "ring-blue-200" },
  email: { icon: Mail, color: "bg-purple-100 text-purple-700", ring: "ring-purple-200" },
  meeting: { icon: Calendar, color: "bg-green-100 text-green-700", ring: "ring-green-200" },
  note: { icon: FileText, color: "bg-gray-100 text-gray-700", ring: "ring-gray-200" },
  demo: { icon: Users, color: "bg-orange-100 text-orange-700", ring: "ring-orange-200" },
  task: { icon: Target, color: "bg-red-100 text-red-700", ring: "ring-red-200" },
  follow_up: { icon: ArrowRight, color: "bg-yellow-100 text-yellow-700", ring: "ring-yellow-200" },
};

export default function RelatedActivitiesTimeline({ activities }) {
  return (
    <Card className="border-0 shadow-lg">
      <CardHeader><CardTitle>Activity Timeline</CardTitle></CardHeader>
      <CardContent>
        {activities.length === 0 ? (
          <div className="text-center py-8"><FileText className="w-12 h-12 text-slate-300 mx-auto mb-3" /><p className="text-slate-500">No activities to display.</p></div>
        ) : (
          <div className="relative pl-6">
            <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-slate-200" />
            <div className="space-y-8">
              {activities.map(activity => {
                const config = activityConfig[activity.activity_type] || activityConfig.note;
                const Icon = config.icon;
                return (
                  <div key={activity.id} className="relative">
                    <div className={`absolute -left-[30px] top-1 w-8 h-8 rounded-full flex items-center justify-center ring-4 ring-white ${config.color} ${config.ring}`}>
                      <Icon className="w-4 h-4" />
                    </div>
                    <div className="ml-8">
                      <p className="font-semibold text-slate-800">{activity.subject}</p>
                      <p className="text-sm text-slate-500">{format(new Date(activity.activity_date || activity.created_date), "MMMM d, yyyy 'at' h:mm a")}</p>
                      {activity.description && <p className="mt-1 text-sm text-slate-600">{activity.description}</p>}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}