import React from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Filter } from "lucide-react";

export default function ActivityFilters({ filters, onFiltersChange }) {
  const handleFilterChange = (key, value) => {
    onFiltersChange(prev => ({ ...prev, [key]: value }));
  };

  return (
    <div className="flex items-center gap-3">
      <Filter className="w-4 h-4 text-slate-500" />
      <Select value={filters.type} onValueChange={(value) => handleFilterChange("type", value)}>
        <SelectTrigger className="w-32"><SelectValue placeholder="Type" /></SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Types</SelectItem>
          <SelectItem value="call">Call</SelectItem>
          <SelectItem value="email">Email</SelectItem>
          <SelectItem value="meeting">Meeting</SelectItem>
          <SelectItem value="task">Task</SelectItem>
          <SelectItem value="note">Note</SelectItem>
        </SelectContent>
      </Select>
      <Select value={filters.priority} onValueChange={(value) => handleFilterChange("priority", value)}>
        <SelectTrigger className="w-32"><SelectValue placeholder="Priority" /></SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Priorities</SelectItem>
          <SelectItem value="low">Low</SelectItem>
          <SelectItem value="medium">Medium</SelectItem>
          <SelectItem value="high">High</SelectItem>
          <SelectItem value="urgent">Urgent</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
}