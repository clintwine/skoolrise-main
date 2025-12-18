import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Target, ArrowRight, Calendar } from "lucide-react";
import { format } from "date-fns";

const stageColors = {
  prospecting: "bg-blue-100 text-blue-700",
  qualification: "bg-purple-100 text-purple-700",
  proposal: "bg-orange-100 text-orange-700",
  negotiation: "bg-red-100 text-red-700",
  closing: "bg-green-100 text-green-700"
};

export default function TopDeals({ deals, isLoading }) {
  if (isLoading) {
    return (
      <Card className="border-0 shadow-lg">
        <CardHeader className="border-b border-slate-100">
          <CardTitle>Top Deals</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="p-4 border-b border-slate-50 last:border-0">
              <div className="flex justify-between items-start mb-2">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-5 w-16 rounded-full" />
              </div>
              <Skeleton className="h-6 w-20 mb-2" />
              <Skeleton className="h-3 w-28" />
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
          <span>Top Deals</span>
          <Link to={createPageUrl("Deals")}>
            <Button variant="ghost" size="sm">
              View All <ArrowRight className="w-4 h-4 ml-1" />
            </Button>
          </Link>
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        {deals.length === 0 ? (
          <div className="p-8 text-center">
            <Target className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <p className="text-slate-500 mb-2">No active deals</p>
            <p className="text-sm text-slate-400 mb-4">Start by creating your first deal</p>
            <Link to={createPageUrl("Deals")}>
              <Button size="sm" className="bg-orange-600 hover:bg-orange-700">
                Create Deal
              </Button>
            </Link>
          </div>
        ) : (
          deals.map((deal, index) => (
            <div key={deal.id} className="p-4 border-b border-slate-50 last:border-0 hover:bg-slate-25 transition-colors">
              <div className="flex justify-between items-start mb-2">
                <h4 className="font-medium text-slate-900 truncate">{deal.deal_name}</h4>
                <Badge variant="secondary" className={`${stageColors[deal.stage]} border-0`}>
                  {deal.stage}
                </Badge>
              </div>
              <p className="text-lg font-semibold text-emerald-600 mb-1">
                ${(deal.deal_value || 0).toLocaleString()}
              </p>
              {deal.expected_close_date && (
                <div className="flex items-center text-sm text-slate-500">
                  <Calendar className="w-3 h-3 mr-1" />
                  Expected: {format(new Date(deal.expected_close_date), "MMM d, yyyy")}
                </div>
              )}
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
}