import React from 'react';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

export default function ResourceFilters({ search, onSearchChange, type, onTypeChange }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <Input
        value={search}
        onChange={(e) => onSearchChange(e.target.value)}
        placeholder="Search resources"
      />
      <Select value={type} onValueChange={onTypeChange}>
        <SelectTrigger>
          <SelectValue placeholder="All types" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All types</SelectItem>
          <SelectItem value="Document">Document</SelectItem>
          <SelectItem value="Presentation">Presentation</SelectItem>
          <SelectItem value="Video">Video</SelectItem>
          <SelectItem value="Link">External Link</SelectItem>
          <SelectItem value="Worksheet">Worksheet</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
}