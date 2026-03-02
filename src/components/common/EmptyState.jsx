import React from 'react';
import { Button } from '@/components/ui/button';
import { FileQuestion, Search, Plus } from 'lucide-react';

export default function EmptyState({ 
  icon: Icon = FileQuestion,
  title = "No data found",
  description = "There's nothing here yet.",
  actionLabel,
  onAction,
  isFiltered = false,
  filteredTitle = "No results match your filters",
  filteredDescription = "Try adjusting your search or filter criteria.",
  onClearFilters
}) {
  const displayTitle = isFiltered ? filteredTitle : title;
  const displayDescription = isFiltered ? filteredDescription : description;
  const DisplayIcon = isFiltered ? Search : Icon;

  return (
    <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
      <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
        <DisplayIcon className="w-8 h-8 text-gray-400" />
      </div>
      <h3 className="text-lg font-semibold text-gray-900 mb-2">{displayTitle}</h3>
      <p className="text-gray-600 mb-6 max-w-sm">{displayDescription}</p>
      <div className="flex gap-3">
        {isFiltered && onClearFilters && (
          <Button variant="outline" onClick={onClearFilters}>
            Clear Filters
          </Button>
        )}
        {actionLabel && onAction && !isFiltered && (
          <Button onClick={onAction} className="gap-2">
            <Plus className="w-4 h-4" />
            {actionLabel}
          </Button>
        )}
      </div>
    </div>
  );
}