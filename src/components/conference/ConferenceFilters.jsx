import React from 'react';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export default function ConferenceFilters({ searchTerm, onSearchChange, statusFilter, onStatusChange }) {
  return (
    <div className="flex flex-col md:flex-row gap-3">
      <Input
        placeholder="Search by student, parent, or teacher"
        value={searchTerm}
        onChange={(e) => onSearchChange(e.target.value)}
        className="md:flex-1"
      />
      <Select value={statusFilter} onValueChange={onStatusChange}>
        <SelectTrigger className="w-full md:w-56">
          <SelectValue placeholder="Filter status" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All statuses</SelectItem>
          <SelectItem value="Scheduled">Scheduled</SelectItem>
          <SelectItem value="Confirmed">Confirmed</SelectItem>
          <SelectItem value="Completed">Completed</SelectItem>
          <SelectItem value="Cancelled">Cancelled</SelectItem>
          <SelectItem value="No Show">No Show</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
}