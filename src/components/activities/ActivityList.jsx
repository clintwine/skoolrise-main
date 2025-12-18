import React from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Edit, Trash2, User, Building, Target, Phone, Mail, Calendar, FileText, Users, ArrowRight } from "lucide-react";
import { format, formatDistanceToNow } from "date-fns";

const activityIcons = {
  call: Phone, email: Mail, meeting: Calendar, note: FileText, demo: Users, task: Target, follow_up: ArrowRight,
};

const activityColors = {
  call: "border-blue-300 bg-blue-50 text-blue-700",
  email: "border-purple-300 bg-purple-50 text-purple-700",
  meeting: "border-green-300 bg-green-50 text-green-700",
  note: "border-gray-300 bg-gray-50 text-gray-700",
  demo: "border-orange-300 bg-orange-50 text-orange-700",
  task: "border-red-300 bg-red-50 text-red-700",
  follow_up: "border-yellow-300 bg-yellow-50 text-yellow-700",
};

export default function ActivityList({ activities, relatedData, onEdit, onDelete, isLoading }) {
  if (isLoading) {
    return <div className="space-y-6">
      {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-28 w-full" />)}
    </div>;
  }

  if (activities.length === 0) {
    return <Card className="border-dashed"><CardContent className="p-12 text-center">
      <FileText className="w-16 h-16 text-slate-300 mx-auto mb-4" />
      <h3 className="text-lg font-semibold text-slate-900 mb-2">No activities found</h3>
      <p className="text-slate-500">Log your first activity to see it here</p>
    </CardContent></Card>;
  }

  const findName = (type, id) => {
    if (!id) return null;
    const item = relatedData[type]?.find(i => i.id === id);
    if (!item) return null;
    switch(type) {
      case 'contacts': return `${item.first_name} ${item.last_name}`;
      case 'companies': return item.company_name;
      case 'deals': return item.deal_name;
      default: return null;
    }
  };

  return <div className="space-y-6">
    {activities.map(activity => {
      const Icon = activityIcons[activity.activity_type] || FileText;
      const colorClass = activityColors[activity.activity_type] || activityColors.note;
      
      const relatedLinks = [
        { id: activity.contact_id, type: 'contacts', icon: User, name: findName('contacts', activity.contact_id) },
        { id: activity.company_id, type: 'companies', icon: Building, name: findName('companies', activity.company_id) },
        { id: activity.deal_id, type: 'deals', icon: Target, name: findName('deals', activity.deal_id) }
      ].filter(link => link.id && link.name);

      return <Card key={activity.id} className="border-0 shadow-lg hover:shadow-xl transition-all duration-300">
        <CardContent className="p-4 flex gap-4 items-start">
          <div className={`p-3 rounded-full border ${colorClass}`}><Icon className="w-5 h-5" /></div>
          <div className="flex-1">
            <div className="flex justify-between items-start">
              <div>
                <p className="font-semibold text-slate-800">{activity.subject}</p>
                <div className="text-sm text-slate-500 flex items-center gap-1">
                  <span>{format(new Date(activity.activity_date || activity.created_date), "MMM d, yyyy 'at' h:mm a")}</span>
                  <span className="text-slate-400">·</span>
                  <span>{formatDistanceToNow(new Date(activity.activity_date || activity.created_date), { addSuffix: true })}</span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="secondary">{activity.activity_type.replace('_',' ')}</Badge>
                <Button variant="ghost" size="icon" onClick={() => onEdit(activity)} className="h-8 w-8 hover:bg-orange-100 hover:text-orange-700"><Edit className="w-4 h-4" /></Button>
                <Button variant="ghost" size="icon" onClick={() => onDelete(activity.id)} className="h-8 w-8 hover:bg-red-100 hover:text-red-700"><Trash2 className="w-4 h-4" /></Button>
              </div>
            </div>
            {activity.description && <p className="text-slate-600 mt-2 text-sm">{activity.description}</p>}
            {relatedLinks.length > 0 && <div className="mt-3 flex flex-wrap gap-2">
              {relatedLinks.map(link => {
                const LinkIcon = link.icon;
                return <Badge key={link.id} variant="outline" className="flex items-center gap-1.5">
                  <LinkIcon className="w-3 h-3 text-slate-400" />
                  <span className="font-medium text-slate-700">{link.name}</span>
                </Badge>
              })}
            </div>}
          </div>
        </CardContent>
      </Card>;
    })}
  </div>;
}