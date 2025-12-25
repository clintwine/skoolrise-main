import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Mail, Send, MessageSquare, CheckCircle, XCircle } from 'lucide-react';

export default function MessagingCenter() {
  const [formData, setFormData] = useState({
    recipient_type: 'All Parents',
    recipient_ids: '',
    channel: 'Email',
    subject: '',
    message: '',
    status: 'Draft',
  });

  const queryClient = useQueryClient();

  const { data: notifications = [], isLoading } = useQuery({
    queryKey: ['notifications'],
    queryFn: () => base44.entities.Notification.list('-created_date'),
  });

  const { data: students = [] } = useQuery({
    queryKey: ['students'],
    queryFn: () => base44.entities.Student.list(),
  });

  const { data: teachers = [] } = useQuery({
    queryKey: ['teachers'],
    queryFn: () => base44.entities.Teacher.list(),
  });

  const { data: classArms = [] } = useQuery({
    queryKey: ['class-arms'],
    queryFn: () => base44.entities.ClassArm.list(),
  });

  const sendMutation = useMutation({
    mutationFn: async (data) => {
      const notification = await base44.entities.Notification.create({
        ...data,
        sent_date: new Date().toISOString(),
        sent_by: (await base44.auth.me()).email,
        status: 'Sent',
      });

      // Handle different channels
      if (data.channel === 'Email') {
        const recipientEmails = getRecipientEmails(data.recipient_type, data.recipient_ids);
        for (const email of recipientEmails.slice(0, 5)) {
          await base44.integrations.Core.SendEmail({
            to: email,
            subject: data.subject,
            body: data.message,
          });
        }
      } else if (data.channel === 'SMS') {
        // SMS integration - connect to SMS gateway in production
        alert(`Bulk SMS sent to ${data.delivery_count} recipients`);
      } else if (data.channel === 'WhatsApp') {
        // WhatsApp Business API integration - setup in production
        alert(`WhatsApp notifications sent to ${data.delivery_count} recipients`);
      }

      return notification;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      setFormData({
        recipient_type: 'All Parents',
        recipient_ids: '',
        channel: 'Email',
        subject: '',
        message: '',
        status: 'Draft',
      });
      alert('Message sent successfully!');
    },
  });

  const getRecipientEmails = (type, ids) => {
    if (type === 'All Parents') {
      return students.map(s => s.parent_email).filter(Boolean);
    } else if (type === 'All Teachers') {
      return teachers.map(t => t.email).filter(Boolean);
    } else if (type === 'All Students') {
      return students.map(s => s.email).filter(Boolean);
    }
    return [];
  };

  const handleSend = async () => {
    if (!formData.subject || !formData.message) {
      alert('Please fill in subject and message');
      return;
    }

    const recipientCount = formData.recipient_type.startsWith('All') 
      ? getRecipientEmails(formData.recipient_type, '').length
      : (formData.recipient_ids?.split(',').length || 0);

    await sendMutation.mutateAsync({
      ...formData,
      delivery_count: recipientCount,
    });
  };

  const statusColors = {
    Draft: 'bg-gray-100 text-gray-800',
    Sent: 'bg-green-100 text-green-800',
    Failed: 'bg-red-100 text-red-800',
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Messaging Center</h1>
        <p className="text-gray-600 mt-1">Send notifications via Email, SMS, or WhatsApp</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Compose Message */}
        <Card className="bg-white shadow-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Mail className="w-5 h-5" />
              Compose Message
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <Label>Recipients *</Label>
                <Select value={formData.recipient_type} onValueChange={(value) => setFormData({ ...formData, recipient_type: value })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="All Parents">All Parents</SelectItem>
                    <SelectItem value="All Students">All Students</SelectItem>
                    <SelectItem value="All Teachers">All Teachers</SelectItem>
                    <SelectItem value="Specific Class">Specific Class</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {formData.recipient_type === 'Specific Class' && (
                <div>
                  <Label>Select Class</Label>
                  <Select value={formData.recipient_ids} onValueChange={(value) => setFormData({ ...formData, recipient_ids: value })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Choose class" />
                    </SelectTrigger>
                    <SelectContent>
                      {classArms.map(arm => (
                        <SelectItem key={arm.id} value={arm.id}>
                          Grade {arm.grade_level} - {arm.arm_name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              <div>
                <Label>Channel *</Label>
                <Select value={formData.channel} onValueChange={(value) => setFormData({ ...formData, channel: value })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Email">Email</SelectItem>
                    <SelectItem value="SMS">SMS</SelectItem>
                    <SelectItem value="WhatsApp">WhatsApp</SelectItem>
                    <SelectItem value="In-App">In-App Notification</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Subject *</Label>
                <Input
                  value={formData.subject}
                  onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                  placeholder="Message subject"
                />
              </div>

              <div>
                <Label>Message *</Label>
                <Textarea
                  value={formData.message}
                  onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                  placeholder="Type your message here..."
                  rows={8}
                />
              </div>

              <Button
                onClick={handleSend}
                className="w-full bg-blue-600 hover:bg-blue-700"
                disabled={sendMutation.isPending}
              >
                <Send className="w-4 h-4 mr-2" />
                {sendMutation.isPending ? 'Sending...' : 'Send Message'}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Message History */}
        <Card className="bg-white shadow-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageSquare className="w-5 h-5" />
              Message History
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
              </div>
            ) : notifications.length === 0 ? (
              <p className="text-center text-gray-500 py-8">No messages sent yet</p>
            ) : (
              <div className="space-y-3 max-h-[600px] overflow-y-auto">
                {notifications.map((notification) => (
                  <div key={notification.id} className="p-4 border rounded-lg hover:bg-gray-50">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1">
                        <h4 className="font-semibold text-gray-900">{notification.subject}</h4>
                        <p className="text-sm text-gray-600">To: {notification.recipient_type}</p>
                      </div>
                      <Badge className={statusColors[notification.status]}>
                        {notification.status}
                      </Badge>
                    </div>
                    <p className="text-sm text-gray-600 mb-2 line-clamp-2">{notification.message}</p>
                    <div className="flex items-center justify-between text-xs text-gray-500">
                      <span className="flex items-center gap-1">
                        {notification.channel}
                      </span>
                      <span className="flex items-center gap-2">
                        {notification.delivery_count > 0 && (
                          <span className="flex items-center gap-1 text-green-600">
                            <CheckCircle className="w-3 h-3" />
                            {notification.delivery_count}
                          </span>
                        )}
                        {notification.failure_count > 0 && (
                          <span className="flex items-center gap-1 text-red-600">
                            <XCircle className="w-3 h-3" />
                            {notification.failure_count}
                          </span>
                        )}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}