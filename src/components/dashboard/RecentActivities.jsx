import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Phone, Mail, Calendar, FileText, Users, Target, ArrowRight } from "lucide-react";
import { format } from "date-fns";

const activityIcons = {
  call: Phone,
  email: Mail,
  meeting: Calendar,
  note: FileText,
  demo: Users,
  task: Target,
  follow_up: ArrowRight
};

const activityColors = {
  call: "bg-blue-100 text-blue-700",
  email: "bg-purple-100 text-purple-700",
  meeting: "bg-green-100 text-green-700",
  note: "bg-gray-100 text-gray-700",
  demo: "bg-orange-100 text-orange-700",
  task: "bg-red-100 text-red-700",
  follow_up: "bg-yellow-100 text-yellow-700"
};

export default function RecentActivities({ activities, isLoading }) {
  if (isLoading) {
    return (
      <Card className="border-0 shadow-lg">
        <CardHeader className="border-b border-slate-100">
          <CardTitle className="flex items-center justify-between">
            Recent Activities
            <Skeleton className="h-6 w-16" />
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="flex items-center gap-4 p-4 border-b border-slate-50 last:border-0">
              <Skeleton className="w-10 h-10 rounded-full" />
              <div className="flex-1">
                <Skeleton className="h-4 w-48 mb-2" />
                <Skeleton className="h-3 w-32" />
              </div>
              <Skeleton className="h-6 w-16 rounded-full" />
            </div>
          ))}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-0 shadow-lg">
      <CardHeader className="border-b border-slate-100">
        <CardTitle className="flex items-center justify-between">
          <span>Recent Activities</span>
          <Link to={createPageUrl("Activities")}>
            <Button variant="ghost" size="sm">
              View All <ArrowRight className="w-4 h-4 ml-1" />
            </Button>
          </Link>
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        {activities.length === 0 ? (
          <div className="p-8 text-center">
            <FileText className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <p className="text-slate-500 mb-2">No recent activities</p>
            <p className="text-sm text-slate-400">Start logging your interactions with contacts</p>
          </div>
        ) : (
          activities.map((activity, index) => {
            const Icon = activityIcons[activity.activity_type] || FileText;
            const colorClass = activityColors[activity.activity_type] || activityColors.note;
            
            return (
              <div key={activity.id} className="flex items-center gap-4 p-4 border-b border-slate-50 last:border-0 hover:bg-slate-25 transition-colors">
                <div className={`p-2 rounded-full ${colorClass}`}>
                  <Icon className="w-5 h-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-slate-900 truncate">{activity.subject}</p>
                  <p className="text-sm text-slate-500">
                    {activity.activity_date ? format(new Date(activity.activity_date), "MMM d, h:mm a") : format(new Date(activity.created_date), "MMM d, h:mm a")}
                  </p>
                </div>
                <Badge variant="secondary" className={`${colorClass} border-0`}>
                  {activity.activity_type.replace('_', ' ')}
                </Badge>
              </div>
            );
          })
        )}
      </CardContent>
    </Card>
  );
}