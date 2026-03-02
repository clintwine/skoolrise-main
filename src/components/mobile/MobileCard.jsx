import React from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { ChevronRight } from 'lucide-react';

export function MobileListCard({ 
  title, 
  subtitle, 
  badge, 
  icon: Icon, 
  onClick,
  rightContent,
  className = ""
}) {
  return (
    <Card 
      className={`mb-2 active:bg-gray-50 transition-colors ${onClick ? 'cursor-pointer' : ''} ${className}`}
      onClick={onClick}
    >
      <CardContent className="p-3 flex items-center gap-3">
        {Icon && (
          <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center flex-shrink-0">
            <Icon className="w-5 h-5 text-blue-600" />
          </div>
        )}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <p className="font-medium text-sm text-gray-900 truncate">{title}</p>
            {badge}
          </div>
          {subtitle && (
            <p className="text-xs text-gray-500 truncate">{subtitle}</p>
          )}
        </div>
        {rightContent || (onClick && <ChevronRight className="w-4 h-4 text-gray-400 flex-shrink-0" />)}
      </CardContent>
    </Card>
  );
}

export function MobileStatCard({ title, value, icon: Icon, color = "blue", subtitle }) {
  const colorClasses = {
    blue: "bg-blue-50 text-blue-600",
    green: "bg-green-50 text-green-600",
    red: "bg-red-50 text-red-600",
    yellow: "bg-yellow-50 text-yellow-600",
    purple: "bg-purple-50 text-purple-600",
    orange: "bg-orange-50 text-orange-600",
  };

  return (
    <Card className="flex-1">
      <CardContent className="p-3">
        <div className="flex items-center gap-2 mb-1">
          {Icon && (
            <div className={`w-6 h-6 rounded-full ${colorClasses[color]} flex items-center justify-center`}>
              <Icon className="w-3 h-3" />
            </div>
          )}
          <span className="text-xs text-gray-500">{title}</span>
        </div>
        <p className="text-xl font-bold text-gray-900">{value}</p>
        {subtitle && <p className="text-xs text-gray-500">{subtitle}</p>}
      </CardContent>
    </Card>
  );
}

export function MobileDataCard({ 
  items, // array of { label, value, color? }
  title,
  action
}) {
  return (
    <Card className="mb-3">
      <CardContent className="p-3">
        {(title || action) && (
          <div className="flex items-center justify-between mb-3">
            {title && <h3 className="font-semibold text-sm text-gray-900">{title}</h3>}
            {action}
          </div>
        )}
        <div className="space-y-2">
          {items.map((item, index) => (
            <div key={index} className="flex justify-between items-center">
              <span className="text-xs text-gray-500">{item.label}</span>
              <span className={`text-sm font-medium ${item.color || 'text-gray-900'}`}>
                {item.value}
              </span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}