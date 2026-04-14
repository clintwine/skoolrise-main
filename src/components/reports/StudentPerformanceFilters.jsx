import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export default function StudentPerformanceFilters({
  search,
  onSearchChange,
  status,
  onStatusChange,
  gradeLevel,
  onGradeLevelChange,
  sortBy,
  onSortByChange,
  sortOrder,
  onSortOrderChange,
  gradeOptions
}) {
  return (
    <Card className="border-0 shadow-sm">
      <CardContent className="grid gap-4 p-4 md:grid-cols-2 xl:grid-cols-5">
        <Input
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Search student"
        />

        <Select value={gradeLevel} onValueChange={onGradeLevelChange}>
          <SelectTrigger>
            <SelectValue placeholder="Grade level" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All grades</SelectItem>
            {gradeOptions.map((grade) => (
              <SelectItem key={grade} value={grade}>{grade}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={status} onValueChange={onStatusChange}>
          <SelectTrigger>
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            <SelectItem value="Active">Active</SelectItem>
            <SelectItem value="Inactive">Inactive</SelectItem>
            <SelectItem value="Suspended">Suspended</SelectItem>
            <SelectItem value="Graduated">Graduated</SelectItem>
            <SelectItem value="Withdrawn">Withdrawn</SelectItem>
          </SelectContent>
        </Select>

        <Select value={sortBy} onValueChange={onSortByChange}>
          <SelectTrigger>
            <SelectValue placeholder="Sort by" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="average_score">Average score</SelectItem>
            <SelectItem value="student_name">Student name</SelectItem>
            <SelectItem value="grade_level">Grade level</SelectItem>
            <SelectItem value="report_count">Report count</SelectItem>
          </SelectContent>
        </Select>

        <Select value={sortOrder} onValueChange={onSortOrderChange}>
          <SelectTrigger>
            <SelectValue placeholder="Order" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="desc">Descending</SelectItem>
            <SelectItem value="asc">Ascending</SelectItem>
          </SelectContent>
        </Select>
      </CardContent>
    </Card>
  );
}