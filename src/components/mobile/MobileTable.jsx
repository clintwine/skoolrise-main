import React from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ChevronRight, MoreVertical } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export default function MobileTable({ 
  data = [], 
  renderItem,
  emptyMessage = "No items found",
  loading = false
}) {
  if (loading) {
    return (
      <div className="space-y-2">
        {[1, 2, 3].map(i => (
          <Card key={i} className="animate-pulse">
            <CardContent className="p-4">
              <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
              <div className="h-3 bg-gray-100 rounded w-1/2"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <p className="text-gray-500 text-sm">{emptyMessage}</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-2">
      {data.map((item, index) => renderItem(item, index))}
    </div>
  );
}

export function MobileTableRow({
  primary,
  secondary,
  tertiary,
  badge,
  badgeVariant = "default",
  actions = [],
  onClick,
  icon: Icon
}) {
  return (
    <Card className={`${onClick ? 'cursor-pointer active:bg-gray-50' : ''}`}>
      <CardContent className="p-3" onClick={onClick}>
        <div className="flex items-start gap-3">
          {Icon && (
            <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center flex-shrink-0">
              <Icon className="w-5 h-5 text-gray-600" />
            </div>
          )}
          
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span className="font-medium text-sm text-gray-900 truncate">{primary}</span>
              {badge && (
                <Badge variant={badgeVariant} className="text-xs">
                  {badge}
                </Badge>
              )}
            </div>
            {secondary && (
              <p className="text-xs text-gray-600 truncate">{secondary}</p>
            )}
            {tertiary && (
              <p className="text-xs text-gray-400 mt-1">{tertiary}</p>
            )}
          </div>

          {actions.length > 0 ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {actions.map((action, idx) => (
                  <DropdownMenuItem 
                    key={idx} 
                    onClick={(e) => {
                      e.stopPropagation();
                      action.onClick();
                    }}
                    className={action.destructive ? 'text-red-600' : ''}
                  >
                    {action.icon && <action.icon className="w-4 h-4 mr-2" />}
                    {action.label}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          ) : onClick ? (
            <ChevronRight className="w-4 h-4 text-gray-400 flex-shrink-0 mt-2" />
          ) : null}
        </div>
      </CardContent>
    </Card>
  );
}