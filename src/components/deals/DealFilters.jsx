import React from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Filter } from "lucide-react";

export default function DealFilters({ filters, onFiltersChange }) {
  const handleFilterChange = (key, value) => {
    onFiltersChange(prev => ({ ...prev, [key]: value }));
  };

  return (
    <div className="flex items-center gap-3">
      <Filter className="w-4 h-4 text-slate-500" />
      <Select
        value={filters.stage}
        onValueChange={(value) => handleFilterChange("stage", value)}
      >
        <SelectTrigger className="w-32">
          <SelectValue placeholder="Stage" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Stages</SelectItem>
          <SelectItem value="prospecting">Prospecting</SelectItem>
          <SelectItem value="qualification">Qualification</SelectItem>
          <SelectItem value="proposal">Proposal</SelectItem>
          <SelectItem value="negotiation">Negotiation</SelectItem>
          <SelectItem value="closing">Closing</SelectItem>
          <SelectItem value="won">Won</SelectItem>
          <SelectItem value="lost">Lost</SelectItem>
        </SelectContent>
      </Select>
      <Select
        value={filters.source}
        onValueChange={(value) => handleFilterChange("source", value)}
      >
        <SelectTrigger className="w-32">
          <SelectValue placeholder="Source" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Sources</SelectItem>
          <SelectItem value="inbound">Inbound</SelectItem>
          <SelectItem value="outbound">Outbound</SelectItem>
          <SelectItem value="referral">Referral</SelectItem>
          <SelectItem value="partner">Partner</SelectItem>
          <SelectItem value="event">Event</SelectItem>
          <SelectItem value="other">Other</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
}