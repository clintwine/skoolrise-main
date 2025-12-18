import React from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Building, DollarSign, Target } from "lucide-react";

export default function CompanyDetailHeader({ company, relatedDeals }) {
  const totalDealValue = relatedDeals.reduce((sum, deal) => sum + (deal.deal_value || 0), 0);
  const activeDeals = relatedDeals.filter(deal => !['won', 'lost'].includes(deal.stage));

  return (
    <Card className="border-0 shadow-lg">
      <CardContent className="p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 bg-slate-100 rounded-xl flex items-center justify-center">
            <Building className="w-8 h-8 text-slate-500" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-slate-900">{company.company_name}</h1>
            <a href={company.website} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
              {company.website}
            </a>
          </div>
        </div>
        <div className="flex flex-wrap gap-4 text-sm">
           <div className="flex items-center gap-2 text-slate-600">
            <Target className="w-4 h-4 text-orange-500" />
            <div>
              <span className="font-semibold">{activeDeals.length}</span> Active Deals
            </div>
          </div>
          <div className="flex items-center gap-2 text-slate-600">
            <DollarSign className="w-4 h-4 text-emerald-500" />
            <div>
              <span className="font-semibold">${totalDealValue.toLocaleString()}</span> Total Value
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}