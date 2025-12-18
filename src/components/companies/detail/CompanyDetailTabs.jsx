import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Users, Target, Activity as ActivityIcon } from "lucide-react";

import RelatedContactsList from "./RelatedContactsList";
import RelatedDealsList from "./RelatedDealsList";
import RelatedActivitiesTimeline from "./RelatedActivitiesTimeline";

export default function CompanyDetailTabs({ relatedData }) {
  const { contacts, deals, activities } = relatedData;

  const tabItems = [
    { value: "activities", label: "Activities", icon: ActivityIcon, count: activities.length, component: <RelatedActivitiesTimeline activities={activities} /> },
    { value: "contacts", label: "Contacts", icon: Users, count: contacts.length, component: <RelatedContactsList contacts={contacts} /> },
    { value: "deals", label: "Deals", icon: Target, count: deals.length, component: <RelatedDealsList deals={deals} /> },
  ];

  return (
    <Tabs defaultValue="activities">
      <TabsList className="grid w-full grid-cols-3">
        {tabItems.map(tab => (
          <TabsTrigger key={tab.value} value={tab.value} className="flex items-center gap-2">
            <tab.icon className="w-4 h-4" />
            {tab.label}
            <span className="ml-1 bg-slate-200 text-slate-700 text-xs font-semibold px-2 py-0.5 rounded-full">{tab.count}</span>
          </TabsTrigger>
        ))}
      </TabsList>
      {tabItems.map(tab => (
        <TabsContent key={tab.value} value={tab.value} className="mt-4">
          {tab.component}
        </TabsContent>
      ))}
    </Tabs>
  );
}