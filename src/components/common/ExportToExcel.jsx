import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Download, FileSpreadsheet, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

export default function ExportToExcel({ data, filename = 'export', columns }) {
  const [exporting, setExporting] = useState(false);

  const exportToCSV = () => {
    if (!data || data.length === 0) {
      toast.error('No data to export');
      return;
    }

    setExporting(true);

    try {
      // Determine columns to export
      const exportColumns = columns || Object.keys(data[0]).filter(key => 
        !['id', 'created_by', 'updated_date'].includes(key)
      );

      // Create header row
      const headers = exportColumns.map(col => {
        // Convert camelCase/snake_case to Title Case
        return col
          .replace(/_/g, ' ')
          .replace(/([A-Z])/g, ' $1')
          .replace(/^./, str => str.toUpperCase())
          .trim();
      });

      // Create data rows
      const rows = data.map(item => {
        return exportColumns.map(col => {
          let value = item[col];
          
          // Handle different data types
          if (value === null || value === undefined) {
            return '';
          }
          if (typeof value === 'boolean') {
            return value ? 'Yes' : 'No';
          }
          if (typeof value === 'object') {
            return JSON.stringify(value);
          }
          // Escape quotes and wrap in quotes if contains comma
          value = String(value);
          if (value.includes(',') || value.includes('"') || value.includes('\n')) {
            value = `"${value.replace(/"/g, '""')}"`;
          }
          return value;
        });
      });

      // Combine headers and rows
      const csvContent = [
        headers.join(','),
        ...rows.map(row => row.join(','))
      ].join('\n');

      // Create blob and download
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${filename}_${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      toast.success(`Exported ${data.length} records`);
    } catch (error) {
      console.error('Export error:', error);
      toast.error('Failed to export data');
    } finally {
      setExporting(false);
    }
  };

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={exportToCSV}
      disabled={exporting || !data || data.length === 0}
      className="gap-2"
    >
      {exporting ? (
        <Loader2 className="w-4 h-4 animate-spin" />
      ) : (
        <FileSpreadsheet className="w-4 h-4" />
      )}
      Export
    </Button>
  );
}