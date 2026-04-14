import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import MobileTable, { MobileTableRow } from '@/components/mobile/MobileTable';
import useIsMobile from '@/components/hooks/useIsMobile';

export const studentPerformanceColumns = [
  { key: 'student_name', label: 'Student' },
  { key: 'student_id_number', label: 'Student ID' },
  { key: 'grade_level', label: 'Grade' },
  { key: 'status', label: 'Status' },
  { key: 'average_score', label: 'Average Score' },
  { key: 'latest_grade', label: 'Latest Grade' },
  { key: 'report_count', label: 'Reports' }
];

export default function StudentPerformanceTable({ rows, loading }) {
  const isMobile = useIsMobile();

  if (isMobile) {
    return (
      <MobileTable
        data={rows}
        loading={loading}
        emptyMessage="No students found"
        renderItem={(row) => (
          <MobileTableRow
            key={row.id}
            primary={row.student_name}
            secondary={`Grade ${row.grade_level} • Avg ${row.average_score}%`}
            tertiary={`Reports: ${row.report_count} • Latest: ${row.latest_grade}`}
            badge={row.status}
          />
        )}
      />
    );
  }

  return (
    <Card className="border-0 shadow-sm">
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px]">
            <thead className="bg-muted/40">
              <tr>
                {studentPerformanceColumns.map((column) => (
                  <th key={column.key} className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    {column.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y">
              {rows.map((row) => (
                <tr key={row.id} className="hover:bg-muted/20">
                  <td className="px-4 py-3 font-medium">{row.student_name}</td>
                  <td className="px-4 py-3 text-sm text-muted-foreground">{row.student_id_number}</td>
                  <td className="px-4 py-3 text-sm">{row.grade_level}</td>
                  <td className="px-4 py-3"><Badge variant="secondary">{row.status}</Badge></td>
                  <td className="px-4 py-3 text-sm">{row.average_score}%</td>
                  <td className="px-4 py-3 text-sm">{row.latest_grade}</td>
                  <td className="px-4 py-3 text-sm">{row.report_count}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}