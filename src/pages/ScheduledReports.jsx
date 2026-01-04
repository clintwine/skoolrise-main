import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { 
  Calendar, Clock, FileText, Mail, Plus, Edit, Trash2, 
  Play, Pause, CheckCircle, AlertCircle
} from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';

export default function ScheduledReports() {
  const queryClient = useQueryClient();
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingReport, setEditingReport] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    report_type: 'attendance',
    schedule: 'weekly',
    recipients: '',
    format: 'pdf',
    is_active: true,
  });

  const { data: reports = [], isLoading } = useQuery({
    queryKey: ['scheduled-reports'],
    queryFn: () => base44.entities.ScheduledReport.list(),
  });

  const { data: user } = useQuery({
    queryKey: ['current-user'],
    queryFn: () => base44.auth.me(),
  });

  const createMutation = useMutation({
    mutationFn: async (data) => {
      const reportData = {
        ...data,
        recipients: JSON.stringify(data.recipients.split(',').map(e => e.trim())),
        created_by_name: user?.full_name || user?.email,
        next_run: calculateNextRun(data.schedule),
      };
      return await base44.entities.ScheduledReport.create(reportData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['scheduled-reports'] });
      setIsCreateOpen(false);
      resetForm();
      toast.success('Report scheduled successfully');
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }) => {
      const updateData = { ...data };
      if (typeof data.recipients === 'string') {
        updateData.recipients = JSON.stringify(data.recipients.split(',').map(e => e.trim()));
      }
      return await base44.entities.ScheduledReport.update(id, updateData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['scheduled-reports'] });
      setEditingReport(null);
      resetForm();
      toast.success('Report updated');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.ScheduledReport.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['scheduled-reports'] });
      toast.success('Report deleted');
    },
  });

  const calculateNextRun = (schedule) => {
    const now = new Date();
    switch (schedule) {
      case 'daily':
        now.setDate(now.getDate() + 1);
        now.setHours(6, 0, 0, 0);
        break;
      case 'weekly':
        now.setDate(now.getDate() + (7 - now.getDay() + 1) % 7 || 7);
        now.setHours(6, 0, 0, 0);
        break;
      case 'monthly':
        now.setMonth(now.getMonth() + 1);
        now.setDate(1);
        now.setHours(6, 0, 0, 0);
        break;
      default:
        now.setDate(now.getDate() + 7);
    }
    return now.toISOString();
  };

  const resetForm = () => {
    setFormData({
      name: '',
      report_type: 'attendance',
      schedule: 'weekly',
      recipients: '',
      format: 'pdf',
      is_active: true,
    });
  };

  const handleEdit = (report) => {
    setEditingReport(report);
    setFormData({
      name: report.name,
      report_type: report.report_type,
      schedule: report.schedule,
      recipients: JSON.parse(report.recipients || '[]').join(', '),
      format: report.format,
      is_active: report.is_active,
    });
  };

  const handleSubmit = () => {
    if (editingReport) {
      updateMutation.mutate({ id: editingReport.id, data: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  const toggleActive = (report) => {
    updateMutation.mutate({ 
      id: report.id, 
      data: { is_active: !report.is_active } 
    });
  };

  const getScheduleLabel = (schedule) => {
    const labels = {
      daily: 'Every Day',
      weekly: 'Every Week',
      monthly: 'Every Month',
      term_end: 'End of Term',
    };
    return labels[schedule] || schedule;
  };

  const getReportTypeLabel = (type) => {
    const labels = {
      attendance: 'Attendance Report',
      fees: 'Fee Collection Report',
      performance: 'Performance Report',
      behavior: 'Behavior Report',
      custom: 'Custom Report',
    };
    return labels[type] || type;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
            <Calendar className="w-8 h-8" />
            Scheduled Reports
          </h1>
          <p className="text-gray-600 mt-1">Automate report generation and delivery</p>
        </div>
        <Button onClick={() => setIsCreateOpen(true)} className="bg-blue-600 hover:bg-blue-700">
          <Plus className="w-4 h-4 mr-2" />
          Schedule Report
        </Button>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
        </div>
      ) : reports.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Calendar className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No Scheduled Reports</h3>
            <p className="text-gray-600 mb-4">Create automated reports to save time</p>
            <Button onClick={() => setIsCreateOpen(true)} className="bg-blue-600 hover:bg-blue-700">
              <Plus className="w-4 h-4 mr-2" />
              Create First Report
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {reports.map((report) => (
            <Card key={report.id} className={`${!report.is_active ? 'opacity-60' : ''}`}>
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-4">
                    <div className={`p-3 rounded-lg ${report.is_active ? 'bg-blue-100' : 'bg-gray-100'}`}>
                      <FileText className={`w-6 h-6 ${report.is_active ? 'text-blue-600' : 'text-gray-500'}`} />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                        {report.name}
                        {report.is_active ? (
                          <Badge className="bg-green-100 text-green-700">Active</Badge>
                        ) : (
                          <Badge className="bg-gray-100 text-gray-600">Paused</Badge>
                        )}
                      </h3>
                      <p className="text-sm text-gray-600 mt-1">{getReportTypeLabel(report.report_type)}</p>
                      <div className="flex items-center gap-4 mt-3 text-sm text-gray-500">
                        <span className="flex items-center gap-1">
                          <Clock className="w-4 h-4" />
                          {getScheduleLabel(report.schedule)}
                        </span>
                        <span className="flex items-center gap-1">
                          <Mail className="w-4 h-4" />
                          {JSON.parse(report.recipients || '[]').length} recipients
                        </span>
                        {report.next_run && (
                          <span className="flex items-center gap-1">
                            <Calendar className="w-4 h-4" />
                            Next: {format(new Date(report.next_run), 'MMM d, HH:mm')}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => toggleActive(report)}
                      title={report.is_active ? 'Pause' : 'Resume'}
                    >
                      {report.is_active ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => handleEdit(report)}>
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      onClick={() => deleteMutation.mutate(report.id)}
                      className="text-red-500 hover:text-red-700"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={isCreateOpen || !!editingReport} onOpenChange={() => { setIsCreateOpen(false); setEditingReport(null); resetForm(); }}>
        <DialogContent className="max-w-lg bg-white">
          <DialogHeader>
            <DialogTitle>{editingReport ? 'Edit Scheduled Report' : 'Schedule New Report'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label>Report Name</Label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g., Weekly Attendance Summary"
                className="mt-1"
              />
            </div>
            <div>
              <Label>Report Type</Label>
              <Select value={formData.report_type} onValueChange={(v) => setFormData({ ...formData, report_type: v })}>
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="attendance">Attendance Report</SelectItem>
                  <SelectItem value="fees">Fee Collection Report</SelectItem>
                  <SelectItem value="performance">Performance Report</SelectItem>
                  <SelectItem value="behavior">Behavior Report</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Schedule</Label>
              <Select value={formData.schedule} onValueChange={(v) => setFormData({ ...formData, schedule: v })}>
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="daily">Daily</SelectItem>
                  <SelectItem value="weekly">Weekly</SelectItem>
                  <SelectItem value="monthly">Monthly</SelectItem>
                  <SelectItem value="term_end">End of Term</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Recipients (comma-separated emails)</Label>
              <Input
                value={formData.recipients}
                onChange={(e) => setFormData({ ...formData, recipients: e.target.value })}
                placeholder="admin@school.com, principal@school.com"
                className="mt-1"
              />
            </div>
            <div>
              <Label>Format</Label>
              <Select value={formData.format} onValueChange={(v) => setFormData({ ...formData, format: v })}>
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pdf">PDF</SelectItem>
                  <SelectItem value="csv">CSV</SelectItem>
                  <SelectItem value="excel">Excel</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center justify-between">
              <Label>Active</Label>
              <Switch
                checked={formData.is_active}
                onCheckedChange={(v) => setFormData({ ...formData, is_active: v })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setIsCreateOpen(false); setEditingReport(null); resetForm(); }}>
              Cancel
            </Button>
            <Button 
              onClick={handleSubmit} 
              disabled={!formData.name || !formData.recipients}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {editingReport ? 'Update' : 'Schedule'} Report
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}