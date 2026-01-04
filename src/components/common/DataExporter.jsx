import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Download, FileSpreadsheet, FileText, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { useAuditLog } from '../analytics/useAuditLog';

export default function DataExporter({ 
  data, 
  columns, 
  entityName,
  onExport,
  trigger 
}) {
  const [open, setOpen] = useState(false);
  const [format, setFormat] = useState('csv');
  const [selectedColumns, setSelectedColumns] = useState(columns.map(c => c.key));
  const [exporting, setExporting] = useState(false);
  const { logExport } = useAuditLog();

  const toggleColumn = (key) => {
    setSelectedColumns(prev => 
      prev.includes(key) ? prev.filter(k => k !== key) : [...prev, key]
    );
  };

  const handleExport = async () => {
    if (selectedColumns.length === 0) {
      toast.error('Please select at least one column');
      return;
    }

    setExporting(true);
    try {
      const exportColumns = columns.filter(c => selectedColumns.includes(c.key));
      
      if (format === 'csv') {
        const headers = exportColumns.map(c => c.label).join(',');
        const rows = data.map(row => 
          exportColumns.map(c => {
            const value = row[c.key];
            // Escape commas and quotes in CSV
            if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
              return `"${value.replace(/"/g, '""')}"`;
            }
            return value ?? '';
          }).join(',')
        ).join('\n');
        
        const csv = `${headers}\n${rows}`;
        downloadFile(csv, `${entityName}_export_${Date.now()}.csv`, 'text/csv');
      } else if (format === 'json') {
        const exportData = data.map(row => {
          const obj = {};
          exportColumns.forEach(c => {
            obj[c.key] = row[c.key];
          });
          return obj;
        });
        downloadFile(JSON.stringify(exportData, null, 2), `${entityName}_export_${Date.now()}.json`, 'application/json');
      }

      logExport(entityName, data.length);
      toast.success(`Exported ${data.length} records`);
      setOpen(false);
    } catch (error) {
      toast.error('Export failed: ' + error.message);
    } finally {
      setExporting(false);
    }
  };

  const downloadFile = (content, filename, type) => {
    const blob = new Blob([content], { type });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <>
      {trigger ? (
        <div onClick={() => setOpen(true)}>{trigger}</div>
      ) : (
        <Button variant="outline" onClick={() => setOpen(true)}>
          <Download className="w-4 h-4 mr-2" />
          Export
        </Button>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-md bg-white">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Download className="w-5 h-5" />
              Export {entityName}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-6 py-4">
            <div>
              <Label className="mb-3 block">Export Format</Label>
              <div className="flex gap-3">
                <Button
                  variant={format === 'csv' ? 'default' : 'outline'}
                  onClick={() => setFormat('csv')}
                  className={format === 'csv' ? 'bg-blue-600' : ''}
                >
                  <FileSpreadsheet className="w-4 h-4 mr-2" />
                  CSV
                </Button>
                <Button
                  variant={format === 'json' ? 'default' : 'outline'}
                  onClick={() => setFormat('json')}
                  className={format === 'json' ? 'bg-blue-600' : ''}
                >
                  <FileText className="w-4 h-4 mr-2" />
                  JSON
                </Button>
              </div>
            </div>

            <div>
              <Label className="mb-3 block">Select Columns ({selectedColumns.length}/{columns.length})</Label>
              <div className="max-h-48 overflow-y-auto space-y-2 p-3 border rounded-lg">
                {columns.map(col => (
                  <div 
                    key={col.key} 
                    className="flex items-center gap-3 p-2 hover:bg-gray-50 rounded cursor-pointer"
                    onClick={() => toggleColumn(col.key)}
                  >
                    <Checkbox 
                      checked={selectedColumns.includes(col.key)} 
                      onCheckedChange={() => toggleColumn(col.key)}
                    />
                    <span className="text-sm">{col.label}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-blue-50 p-3 rounded-lg">
              <p className="text-sm text-blue-800">
                <strong>{data.length}</strong> records will be exported
              </p>
            </div>

            <div className="flex gap-3 justify-end">
              <Button variant="outline" onClick={() => setOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleExport} disabled={exporting} className="bg-blue-600 hover:bg-blue-700">
                {exporting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Exporting...
                  </>
                ) : (
                  <>
                    <Download className="w-4 h-4 mr-2" />
                    Export
                  </>
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}