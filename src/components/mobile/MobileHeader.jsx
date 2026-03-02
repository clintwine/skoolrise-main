import React from 'react';
import { Button } from "@/components/ui/button";
import { Plus, Filter, Search, X } from 'lucide-react';
import { Input } from "@/components/ui/input";

export default function MobileHeader({ 
  title, 
  subtitle,
  onAdd,
  addLabel = "Add",
  onFilter,
  showSearch = false,
  searchValue = "",
  onSearchChange,
  searchPlaceholder = "Search...",
  actions
}) {
  const [searchOpen, setSearchOpen] = React.useState(false);

  if (showSearch && searchOpen) {
    return (
      <div className="mb-4">
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              value={searchValue}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder={searchPlaceholder}
              className="pl-9 h-10"
              autoFocus
            />
          </div>
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => {
              setSearchOpen(false);
              onSearchChange?.("");
            }}
          >
            <X className="w-4 h-4" />
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="mb-4">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <h1 className="text-xl font-bold text-gray-900">{title}</h1>
          {subtitle && <p className="text-sm text-gray-500 mt-0.5">{subtitle}</p>}
        </div>
        <div className="flex items-center gap-2">
          {showSearch && (
            <Button variant="ghost" size="sm" onClick={() => setSearchOpen(true)}>
              <Search className="w-4 h-4" />
            </Button>
          )}
          {onFilter && (
            <Button variant="ghost" size="sm" onClick={onFilter}>
              <Filter className="w-4 h-4" />
            </Button>
          )}
          {onAdd && (
            <Button size="sm" className="bg-blue-600 hover:bg-blue-700" onClick={onAdd}>
              <Plus className="w-4 h-4 mr-1" />
              {addLabel}
            </Button>
          )}
          {actions}
        </div>
      </div>
    </div>
  );
}