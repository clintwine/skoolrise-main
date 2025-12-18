import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Target, DollarSign, Calendar } from "lucide-react";
import { format } from "date-fns";

const stageColors = {
  prospecting: "bg-blue-100 text-blue-700", qualification: "bg-purple-100 text-purple-700",
  proposal: "bg-orange-100 text-orange-700", negotiation: "bg-red-100 text-red-700",
  closing: "bg-green-100 text-green-700", won: "bg-emerald-100 text-emerald-700",
  lost: "bg-gray-100 text-gray-700"
};

export default function RelatedDealsList({ deals }) {
  return (
    <Card className="border-0 shadow-lg">
      <CardHeader><CardTitle>Deals</CardTitle></CardHeader>
      <CardContent>
        {deals.length === 0 ? (
          <div className="text-center py-8"><Target className="w-12 h-12 text-slate-300 mx-auto mb-3" /><p className="text-slate-500">No deals associated with this company.</p></div>
        ) : (
          <div className="space-y-4">
            {deals.map(deal => (
              <div key={deal.id} className="p-4 rounded-lg border border-slate-100 bg-white">
                <div className="flex justify-between items-start mb-2">
                  <h4 className="font-semibold text-slate-800">{deal.deal_name}</h4>
                  <Badge className={`${stageColors[deal.stage]} border-0`}>{deal.stage}</Badge>
                </div>
                <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-slate-600">
                  <div className="flex items-center gap-1.5 font-medium text-emerald-600"><DollarSign className="w-4 h-4" />${(deal.deal_value || 0).toLocaleString()}</div>
                  {deal.expected_close_date && <div className="flex items-center gap-1.5"><Calendar className="w-4 h-4" />{format(new Date(deal.expected_close_date), "MMM d, yyyy")}</div>}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}