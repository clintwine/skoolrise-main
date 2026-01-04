import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  AlertTriangle, TrendingDown, DollarSign, UserX, 
  Clock, ChevronRight, Bell, CheckCircle
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '../../utils';

export default function PredictiveAlerts() {
  const [dismissedAlerts, setDismissedAlerts] = useState([]);

  const { data: students = [] } = useQuery({
    queryKey: ['students-alerts'],
    queryFn: () => base44.entities.Student.list(),
  });

  const { data: reportCards = [] } = useQuery({
    queryKey: ['report-cards-alerts'],
    queryFn: () => base44.entities.ReportCard.list(),
  });

  const { data: attendance = [] } = useQuery({
    queryKey: ['attendance-alerts'],
    queryFn: () => base44.entities.Attendance.list(),
  });

  const { data: invoices = [] } = useQuery({
    queryKey: ['invoices-alerts'],
    queryFn: () => base44.entities.FeeInvoice.list(),
  });

  // Generate predictive alerts
  const alerts = [];

  // 1. Students with declining performance
  const studentPerformance = {};
  reportCards.forEach(rc => {
    if (!studentPerformance[rc.student_id]) {
      studentPerformance[rc.student_id] = [];
    }
    studentPerformance[rc.student_id].push({
      score: rc.average_score,
      date: rc.created_date,
      name: rc.student_name
    });
  });

  Object.entries(studentPerformance).forEach(([studentId, reports]) => {
    if (reports.length >= 2) {
      const sorted = reports.sort((a, b) => new Date(b.date) - new Date(a.date));
      const decline = sorted[1].score - sorted[0].score;
      if (decline > 10) {
        alerts.push({
          id: `decline-${studentId}`,
          type: 'performance',
          severity: decline > 20 ? 'high' : 'medium',
          icon: TrendingDown,
          title: `${sorted[0].name} showing performance decline`,
          description: `Score dropped ${decline.toFixed(1)}% from previous term`,
          action: 'View Student',
          link: `StudentRecords?id=${studentId}`,
        });
      }
    }
  });

  // 2. Students with low attendance
  const studentAttendance = {};
  attendance.forEach(a => {
    if (!studentAttendance[a.student_id]) {
      studentAttendance[a.student_id] = { present: 0, total: 0, name: a.student_name };
    }
    studentAttendance[a.student_id].total++;
    if (a.status === 'Present') studentAttendance[a.student_id].present++;
  });

  Object.entries(studentAttendance).forEach(([studentId, data]) => {
    if (data.total >= 10) {
      const rate = (data.present / data.total) * 100;
      if (rate < 75) {
        alerts.push({
          id: `attendance-${studentId}`,
          type: 'attendance',
          severity: rate < 60 ? 'high' : 'medium',
          icon: UserX,
          title: `Low attendance for ${data.name}`,
          description: `Attendance rate is ${rate.toFixed(1)}% (below 75% threshold)`,
          action: 'View Attendance',
          link: 'UnifiedAttendance',
        });
      }
    }
  });

  // 3. Overdue invoices
  const overdueInvoices = invoices.filter(i => i.status === 'Overdue');
  if (overdueInvoices.length > 0) {
    const totalOverdue = overdueInvoices.reduce((sum, i) => sum + (i.balance || 0), 0);
    alerts.push({
      id: 'overdue-fees',
      type: 'financial',
      severity: overdueInvoices.length > 10 ? 'high' : 'medium',
      icon: DollarSign,
      title: `${overdueInvoices.length} overdue fee invoices`,
      description: `Total outstanding: $${totalOverdue.toLocaleString()}`,
      action: 'View Invoices',
      link: 'FeesManagement',
    });
  }

  // 4. Invoices due soon
  const dueSoon = invoices.filter(i => {
    if (i.status === 'Paid' || i.status === 'Overdue') return false;
    const dueDate = new Date(i.due_date);
    const daysUntilDue = (dueDate - new Date()) / (1000 * 60 * 60 * 24);
    return daysUntilDue >= 0 && daysUntilDue <= 7;
  });

  if (dueSoon.length > 0) {
    alerts.push({
      id: 'due-soon',
      type: 'financial',
      severity: 'low',
      icon: Clock,
      title: `${dueSoon.length} invoices due within 7 days`,
      description: 'Send payment reminders to avoid overdue status',
      action: 'Send Reminders',
      link: 'FeeReminderSystem',
    });
  }

  const visibleAlerts = alerts.filter(a => !dismissedAlerts.includes(a.id));

  const getSeverityColor = (severity) => {
    switch (severity) {
      case 'high': return 'border-red-300 bg-red-50';
      case 'medium': return 'border-yellow-300 bg-yellow-50';
      case 'low': return 'border-blue-300 bg-blue-50';
      default: return 'border-gray-300 bg-gray-50';
    }
  };

  const getSeverityBadge = (severity) => {
    switch (severity) {
      case 'high': return 'bg-red-100 text-red-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'low': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (visibleAlerts.length === 0) {
    return (
      <Card className="bg-green-50 border-green-200">
        <CardContent className="p-6 text-center">
          <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-3" />
          <h3 className="font-semibold text-green-800">All Clear!</h3>
          <p className="text-sm text-green-600">No critical alerts at this time</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2">
          <Bell className="w-5 h-5 text-orange-500" />
          Predictive Alerts
          <Badge className="bg-orange-100 text-orange-800 ml-2">{visibleAlerts.length}</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {visibleAlerts.slice(0, 5).map((alert) => {
          const Icon = alert.icon;
          return (
            <div 
              key={alert.id} 
              className={`p-3 rounded-lg border ${getSeverityColor(alert.severity)}`}
            >
              <div className="flex items-start gap-3">
                <Icon className="w-5 h-5 text-gray-600 mt-0.5" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <p className="font-medium text-gray-900 text-sm">{alert.title}</p>
                    <Badge className={`text-xs ${getSeverityBadge(alert.severity)}`}>
                      {alert.severity}
                    </Badge>
                  </div>
                  <p className="text-xs text-gray-600">{alert.description}</p>
                </div>
                <div className="flex items-center gap-1">
                  <Link to={createPageUrl(alert.link)}>
                    <Button size="sm" variant="ghost" className="h-8 text-xs">
                      {alert.action}
                      <ChevronRight className="w-3 h-3 ml-1" />
                    </Button>
                  </Link>
                  <Button 
                    size="sm" 
                    variant="ghost" 
                    className="h-8 w-8 p-0 text-gray-400 hover:text-gray-600"
                    onClick={() => setDismissedAlerts([...dismissedAlerts, alert.id])}
                  >
                    ×
                  </Button>
                </div>
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}