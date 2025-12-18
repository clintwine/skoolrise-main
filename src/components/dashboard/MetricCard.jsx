import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { TrendingUp } from "lucide-react";

const colorClasses = {
  blue: "from-blue-500 to-blue-600 bg-blue-50 text-blue-600",
  orange: "from-orange-500 to-orange-600 bg-orange-50 text-orange-600",
  emerald: "from-emerald-500 to-emerald-600 bg-emerald-50 text-emerald-600",
  purple: "from-purple-500 to-purple-600 bg-purple-50 text-purple-600",
  green: "from-green-500 to-green-600 bg-green-50 text-green-600"
};

export default function MetricCard({ title, value, icon: Icon, color, trend, isLoading }) {
  const colorClass = colorClasses[color] || colorClasses.blue;
  const [gradientClass, bgClass, textClass] = colorClass.split(' ');

  if (isLoading) {
    return (
      <Card className="border-0 shadow-lg">
        <CardContent className="p-6">
          <div className="flex justify-between items-start">
            <div className="flex-1">
              <Skeleton className="h-4 w-20 mb-3" />
              <Skeleton className="h-8 w-16 mb-2" />
              <Skeleton className="h-3 w-24" />
            </div>
            <Skeleton className="w-12 h-12 rounded-xl" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 relative overflow-hidden">
      <div className={`absolute top-0 right-0 w-32 h-32 opacity-5 bg-gradient-to-br ${gradientClass} transform rotate-12 translate-x-8 -translate-y-8`} />
      <CardContent className="p-6 relative">
        <div className="flex justify-between items-start">
          <div className="flex-1">
            <p className="text-sm font-medium text-slate-600 mb-2">{title}</p>
            <h3 className="text-2xl font-bold text-slate-900 mb-1">{value}</h3>
            {trend && (
              <div className="flex items-center text-xs text-emerald-600">
                <TrendingUp className="w-3 h-3 mr-1" />
                {trend}
              </div>
            )}
          </div>
          <div className={`p-3 rounded-xl ${bgClass}`}>
            <Icon className={`w-6 h-6 ${textClass}`} />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}