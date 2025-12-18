import React from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Filter } from "lucide-react";

export default function CompanyFilters({ filters, onFiltersChange }) {
  const handleFilterChange = (key, value) => {
    onFiltersChange(prev => ({ ...prev, [key]: value }));
  };

  return (
    <div className="flex items-center gap-3">
      <Filter className="w-4 h-4 text-slate-500" />
      <Select value={filters.status} onValueChange={(value) => handleFilterChange("status", value)}>
        <SelectTrigger className="w-32"><SelectValue placeholder="Status" /></SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Statuses</SelectItem>
          <SelectItem value="prospect">Prospect</SelectItem>
          <SelectItem value="qualified">Qualified</SelectItem>
          <SelectItem value="customer">Customer</SelectItem>
          <SelectItem value="partner">Partner</SelectItem>
          <SelectItem value="inactive">Inactive</SelectItem>
        </SelectContent>
      </Select>
      <Select value={filters.source} onValueChange={(value) => handleFilterChange("source", value)}>
        <SelectTrigger className="w-32"><SelectValue placeholder="Source" /></SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Sources</SelectItem>
          <SelectItem value="website">Website</SelectItem>
          <SelectItem value="social_media">Social Media</SelectItem>
          <SelectItem value="referral">Referral</SelectItem>
          <SelectItem value="cold_outreach">Cold Outreach</SelectItem>
          <SelectItem value="event">Event</SelectItem>
          <SelectItem value="advertisement">Advertisement</SelectItem>
          <SelectItem value="other">Other</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
}