import React from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { X } from 'lucide-react';

export default function MobileFilterSheet({ 
  open, 
  onOpenChange, 
  title = "Filters",
  children,
  onApply,
  onReset,
  activeFiltersCount = 0
}) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="h-[80vh] rounded-t-xl">
        <SheetHeader className="text-left pb-4 border-b">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <SheetTitle>{title}</SheetTitle>
              {activeFiltersCount > 0 && (
                <Badge className="bg-blue-100 text-blue-700">{activeFiltersCount}</Badge>
              )}
            </div>
            {onReset && activeFiltersCount > 0 && (
              <Button variant="ghost" size="sm" onClick={onReset} className="text-red-600">
                Reset
              </Button>
            )}
          </div>
        </SheetHeader>
        
        <div className="py-4 overflow-y-auto flex-1">
          {children}
        </div>

        <div className="pt-4 border-t flex gap-3">
          <Button variant="outline" className="flex-1" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button className="flex-1 bg-blue-600 hover:bg-blue-700" onClick={() => {
            onApply?.();
            onOpenChange(false);
          }}>
            Apply Filters
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}

export function MobileFilterSection({ title, children }) {
  return (
    <div className="mb-6">
      <h4 className="text-sm font-medium text-gray-900 mb-3">{title}</h4>
      {children}
    </div>
  );
}

export function MobileFilterChips({ options, value, onChange, multiple = false }) {
  const handleClick = (optionValue) => {
    if (multiple) {
      const currentValues = Array.isArray(value) ? value : [];
      if (currentValues.includes(optionValue)) {
        onChange(currentValues.filter(v => v !== optionValue));
      } else {
        onChange([...currentValues, optionValue]);
      }
    } else {
      onChange(value === optionValue ? null : optionValue);
    }
  };

  const isSelected = (optionValue) => {
    if (multiple) {
      return Array.isArray(value) && value.includes(optionValue);
    }
    return value === optionValue;
  };

  return (
    <div className="flex flex-wrap gap-2">
      {options.map((option) => (
        <button
          key={option.value}
          onClick={() => handleClick(option.value)}
          className={`px-3 py-1.5 rounded-full text-sm transition-all ${
            isSelected(option.value)
              ? 'bg-blue-600 text-white'
              : 'bg-gray-100 text-gray-700 active:bg-gray-200'
          }`}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}