import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useSchoolContext } from '@/hooks/useSchoolContext';
import { addSchoolFilter, withSchoolId } from '@/utils/schoolFilter';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Bell, Send, Clock, CheckCircle, AlertCircle } from 'lucide-react';
import { format, differenceInDays } from 'date-fns';
import { useCurrency } from '@/components/CurrencyProvider';

export default function FeeReminderSystem() {
  const queryClient = useQueryClient();
  const { formatAmount } = useCurrency();
  const { school_tenant_id, isReady } = useSchoolContext();

  const { data: invoices = [] } = useQuery({
    queryKey: ['invoices', school_tenant_id],
    queryFn: () => base44.entities.FeeInvoice.filter(addSchoolFilter({}, school_tenant_id), '-due_date'),
    enabled: isReady,
  });

  const { data: students = [] } = useQuery({
    queryKey: ['students', school_tenant_id],
    queryFn: () => base44.entities.Student.filter(addSchoolFilter({}, school_tenant_id)),
    enabled: isReady,
  });

  const { data: reminders = [] } = useQuery({
    queryKey: ['fee-reminders', school_tenant_id],
    queryFn: () => base44.entities.FeeReminder.filter(addSchoolFilter({}, school_tenant_id), '-sent_date'),
    enabled: isReady,
  });

  const sendReminderMutation = useMutation({
    mutationFn: async ({ invoice, student, reminderType }) => {
      const message = getReminderMessage(invoice, student, reminderType);
      
      await base44.integrations.Core.SendEmail({
        to: student.parent_email,
        subject: `Fee Payment Reminder - ${invoice.invoice_number}`,
        body: message,
      });

      await base44.entities.FeeReminder.create(withSchoolId({
        invoice_id: invoice.id,
        student_id: student.id,
        parent_email: student.parent_email,
        reminder_type: reminderType,
        sent_date: new Date().toISOString(),
        delivery_method: 'Email',
        status: 'Sent',
        message_content: message,
      }, school_tenant_id));

      await base44.entities.FeeInvoice.update(invoice.id, {
        payment_reminder_sent: true,
        last_reminder_date: new Date().toISOString().split('T')[0],
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['fee-reminders'] });
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      alert('Reminder sent successfully!');
    },
  });

  const autoFlagOverdueMutation = useMutation({
    mutationFn: async () => {
      const today = new Date();
      const overdueInvoices = invoices.filter(inv => {
        const dueDate = new Date(inv.due_date);
        return dueDate < today && inv.status !== 'Paid' && inv.status !== 'Overdue';
      });

      for (const invoice of overdueInvoices) {
        await base44.entities.FeeInvoice.update(invoice.id, { status: 'Overdue' });
      }
      
      return overdueInvoices.length;
    },
    onSuccess: (count) => {
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      alert(`${count} invoices flagged as overdue`);
    },
  });

  const sendBulkRemindersMutation = useMutation({
    mutationFn: async (reminderType) => {
      const today = new Date();
      let targetInvoices = [];

      if (reminderType === 'Upcoming Due') {
        targetInvoices = invoices.filter(inv => {
          const daysUntilDue = differenceInDays(new Date(inv.due_date), today);
          return daysUntilDue <= 3 && daysUntilDue >= 0 && inv.status === 'Pending';
        });
      } else if (reminderType === 'Overdue') {
        targetInvoices = invoices.filter(inv => inv.status === 'Overdue');
      }

      for (const invoice of targetInvoices) {
        const student = students.find(s => s.id === invoice.student_id);
        if (student && student.parent_email) {
          await sendReminderMutation.mutateAsync({ invoice, student, reminderType });
        }
      }

      return targetInvoices.length;
    },
    onSuccess: (count) => {
      alert(`Sent ${count} reminders successfully!`);
    },
  });

  const getReminderMessage = (invoice, student, reminderType) => {
    const messages = {
      'Upcoming Due': `Dear ${student.parent_name},\n\nThis is a reminder that the fee payment for ${student.first_name} ${student.last_name} is due on ${format(new Date(invoice.due_date), 'PPP')}.\n\nInvoice Number: ${invoice.invoice_number}\nAmount Due: ${formatAmount(invoice.balance)}\n\nPlease make the payment before the due date to avoid late fees.\n\nThank you.`,
      'Due Today': `Dear ${student.parent_name},\n\nThe fee payment for ${student.first_name} ${student.last_name} is due TODAY.\n\nInvoice Number: ${invoice.invoice_number}\nAmount Due: ${formatAmount(invoice.balance)}\n\nPlease make the payment today to avoid late fees.\n\nThank you.`,
      'Overdue': `Dear ${student.parent_name},\n\nYour fee payment for ${student.first_name} ${student.last_name} is now OVERDUE.\n\nInvoice Number: ${invoice.invoice_number}\nDue Date: ${format(new Date(invoice.due_date), 'PPP')}\nAmount Due: ${formatAmount(invoice.balance)}\n\nPlease make the payment immediately to avoid additional penalties.\n\nThank you.`,
      'Final Notice': `Dear ${student.parent_name},\n\nFINAL NOTICE: The fee payment for ${student.first_name} ${student.last_name} is significantly overdue.\n\nInvoice Number: ${invoice.invoice_number}\nDue Date: ${format(new Date(invoice.due_date), 'PPP')}\nAmount Due: ${formatAmount(invoice.balance)}\n\nImmediate payment is required. Please contact the finance office.\n\nThank you.`,
    };
    return messages[reminderType] || messages['Upcoming Due'];
  };

  const upcomingDueInvoices = invoices.filter(inv => {
    const daysUntilDue = differenceInDays(new Date(inv.due_date), new Date());
    return daysUntilDue <= 3 && daysUntilDue >= 0 && inv.status === 'Pending';
  });

  const overdueInvoices = invoices.filter(inv => inv.status === 'Overdue');

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Fee Reminder System</h1>
          <p className="text-gray-600 mt-1">Automated fee payment reminders and tracking</p>
        </div>
        <Button onClick={() => autoFlagOverdueMutation.mutate()} className="bg-orange-600 hover:bg-orange-700">
          <AlertCircle className="w-4 h-4 mr-2" />
          Flag Overdue Invoices
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-gray-600">Total Reminders Sent</p>
            <p className="text-2xl font-bold text-gray-900">{reminders.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-gray-600">Due Soon (3 days)</p>
            <p className="text-2xl font-bold text-yellow-600">{upcomingDueInvoices.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-gray-600">Overdue Invoices</p>
            <p className="text-2xl font-bold text-red-600">{overdueInvoices.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-gray-600">Sent This Week</p>
            <p className="text-2xl font-bold text-blue-600">
              {reminders.filter(r => differenceInDays(new Date(), new Date(r.sent_date)) <= 7).length}
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle>Bulk Actions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button 
              className="w-full bg-yellow-600 hover:bg-yellow-700" 
              onClick={() => sendBulkRemindersMutation.mutate('Upcoming Due')}
            >
              <Clock className="w-4 h-4 mr-2" />
              Send Reminders for Upcoming Dues ({upcomingDueInvoices.length})
            </Button>
            <Button 
              className="w-full bg-red-600 hover:bg-red-700" 
              onClick={() => sendBulkRemindersMutation.mutate('Overdue')}
            >
              <AlertCircle className="w-4 h-4 mr-2" />
              Send Overdue Reminders ({overdueInvoices.length})
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recent Reminders</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 max-h-[200px] overflow-y-auto">
              {reminders.slice(0, 10).map(reminder => (
                <div key={reminder.id} className="p-2 border rounded text-sm">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-medium">{reminder.parent_email}</p>
                      <p className="text-gray-500">{reminder.reminder_type}</p>
                    </div>
                    <Badge className={reminder.status === 'Sent' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}>
                      {reminder.status}
                    </Badge>
                  </div>
                  <p className="text-gray-400 text-xs mt-1">{format(new Date(reminder.sent_date), 'PPp')}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Invoices Requiring Attention</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[...upcomingDueInvoices, ...overdueInvoices].slice(0, 20).map(invoice => {
              const student = students.find(s => s.id === invoice.student_id);
              const daysUntilDue = differenceInDays(new Date(invoice.due_date), new Date());
              const reminderType = daysUntilDue < 0 ? 'Overdue' : 'Upcoming Due';
              
              return (
                <div key={invoice.id} className="p-4 border rounded-lg flex justify-between items-center">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="font-semibold">{invoice.invoice_number}</p>
                      <Badge className={invoice.status === 'Overdue' ? 'bg-red-100 text-red-800' : 'bg-yellow-100 text-yellow-800'}>
                        {invoice.status}
                      </Badge>
                    </div>
                    <p className="text-sm text-gray-600">{student?.first_name} {student?.last_name}</p>
                    <p className="text-sm text-gray-500">
                      Due: {format(new Date(invoice.due_date), 'PPP')} | Balance: {formatAmount(invoice.balance)}
                    </p>
                    {invoice.payment_reminder_sent && (
                      <p className="text-xs text-green-600 mt-1">
                        <CheckCircle className="w-3 h-3 inline" /> Last reminder: {invoice.last_reminder_date}
                      </p>
                    )}
                  </div>
                  <Button
                    size="sm"
                    onClick={() => sendReminderMutation.mutate({ invoice, student, reminderType })}
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    <Send className="w-4 h-4 mr-1" />
                    Send Reminder
                  </Button>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}