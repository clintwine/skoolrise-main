import React, { useState, useEffect } from 'react';
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
import { Mail, Send, MessageSquare, CheckCircle, XCircle, Paperclip, X, Clock, Users, Plus } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import useIsMobile from '../components/hooks/useIsMobile';
import MobileHeader from '../components/mobile/MobileHeader';
import MobileTabs from '../components/mobile/MobileTabs';
import MobileTable, { MobileTableRow } from '../components/mobile/MobileTable';
import MobileDialog from '../components/mobile/MobileDialog';
import { MobileSelect, MobileInput, MobileTextarea, MobileFormActions } from '../components/mobile/MobileForm';

export default function MessagingCenter() {
  const [formData, setFormData] = useState({
    recipient_type: 'All Parents',
    recipient_ids: '',
    contact_list_id: '',
    specific_emails: '',
    channel: 'Email',
    priority: 'Normal',
    template_type: 'General Announcement',
    subject: '',
    message: '',
    scheduled_date: '',
  });

  const [attachments, setAttachments] = useState([]);
  const [uploading, setUploading] = useState(false);
  const queryClient = useQueryClient();

  const { data: notifications = [], isLoading } = useQuery({
    queryKey: ['notifications'],
    queryFn: () => base44.entities.Notification.list('-created_date', 50),
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

  const { data: contactLists = [] } = useQuery({
    queryKey: ['contact-lists'],
    queryFn: () => base44.entities.ContactList.list(),
  });

  const { data: school } = useQuery({
    queryKey: ['school-for-email'],
    queryFn: async () => {
      const schools = await base44.entities.School.list();
      return schools[0];
    },
  });

  const { data: currentUser } = useQuery({
    queryKey: ['current-user-messaging'],
    queryFn: () => base44.auth.me(),
  });

  const getRecipientEmails = (type, classId, contactListId, specificEmails) => {
    const emails = [];
    
    if (type === 'Specific Emails') {
      return specificEmails.split(',').map(e => e.trim()).filter(Boolean);
    } else if (type === 'All Parents') {
      students.forEach(s => {
        if (s.parent_email) emails.push(s.parent_email);
      });
    } else if (type === 'All Teachers') {
      teachers.forEach(t => {
        if (t.email) emails.push(t.email);
      });
    } else if (type === 'All Students') {
      students.forEach(s => {
        if (s.email) emails.push(s.email);
      });
    } else if (type === 'Specific Class' && classId) {
      const arm = classArms.find(a => a.id === classId);
      if (arm) {
        students.filter(s => s.grade_level === arm.grade_level).forEach(s => {
          if (s.parent_email) emails.push(s.parent_email);
        });
      }
    } else if (type === 'Custom List' && contactListId) {
      const list = contactLists.find(cl => cl.id === contactListId);
      if (list?.contacts) {
        try {
          const contacts = JSON.parse(list.contacts);
          contacts.forEach(c => {
            if (c.email) emails.push(c.email);
          });
        } catch {}
      }
    }
    
    return [...new Set(emails)];
  };

  const sendMutation = useMutation({
    mutationFn: async (data) => {
      const isScheduled = data.scheduled_date && new Date(data.scheduled_date) > new Date();
      const recipientEmails = getRecipientEmails(
        data.recipient_type, 
        data.recipient_ids, 
        data.contact_list_id, 
        data.specific_emails
      );

      if (recipientEmails.length === 0) {
        throw new Error('No recipients found for the selected criteria');
      }

      const notification = await base44.entities.Notification.create({
        subject: data.subject,
        message: data.message,
        recipient_type: data.recipient_type,
        recipient_ids: data.recipient_ids,
        contact_list_id: data.contact_list_id,
        channel: data.channel,
        priority: data.priority,
        template_type: data.template_type,
        scheduled_date: isScheduled ? data.scheduled_date : null,
        sent_date: isScheduled ? null : new Date().toISOString(),
        sent_by: currentUser?.email,
        status: isScheduled ? 'Scheduled' : 'Sending',
        delivery_count: 0,
        failure_count: 0,
      });

      if (isScheduled) {
        return { notification, scheduled: true, count: recipientEmails.length };
      }

      // Send emails
      let successCount = 0;
      let failureCount = 0;
      const deliveryDetails = [];

      for (const email of recipientEmails) {
        try {
          await base44.integrations.Core.SendEmail({
            to: email,
            subject: data.subject,
            body: data.message,
            from_name: school?.school_name || 'SkoolRise',
          });
          successCount++;
          deliveryDetails.push({ email, status: 'sent', timestamp: new Date().toISOString() });
        } catch (error) {
          failureCount++;
          deliveryDetails.push({ email, status: 'failed', error: error.message, timestamp: new Date().toISOString() });
        }
      }

      // Update notification with delivery results
      await base44.entities.Notification.update(notification.id, {
        status: failureCount === recipientEmails.length ? 'Failed' : 'Sent',
        delivery_count: successCount,
        failure_count: failureCount,
        delivery_details: JSON.stringify(deliveryDetails),
      });

      return { notification, successCount, failureCount, total: recipientEmails.length };
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      setFormData({
        recipient_type: 'All Parents',
        recipient_ids: '',
        contact_list_id: '',
        specific_emails: '',
        channel: 'Email',
        priority: 'Normal',
        template_type: 'General Announcement',
        subject: '',
        message: '',
        scheduled_date: '',
      });
      setAttachments([]);
      
      if (result.scheduled) {
        toast.success(`Message scheduled for ${result.count} recipients`);
      } else if (result.failureCount > 0) {
        toast.warning(`Sent to ${result.successCount}/${result.total} recipients. ${result.failureCount} failed.`);
      } else {
        toast.success(`Message sent successfully to ${result.successCount} recipients!`);
      }
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to send message');
    },
  });

  const handleFileChange = async (e) => {
    const files = Array.from(e.target.files);
    
    if (files.length + attachments.length > 5) {
      toast.error('Maximum 5 files allowed');
      return;
    }
    
    const maxSize = 5 * 1024 * 1024;
    const oversizedFiles = files.filter(f => f.size > maxSize);
    if (oversizedFiles.length > 0) {
      toast.error('Each file must be less than 5MB');
      return;
    }
    
    setAttachments([...attachments, ...files]);
  };

  const removeAttachment = (index) => {
    setAttachments(attachments.filter((_, i) => i !== index));
  };

  const handleSend = async () => {
    if (!formData.subject || !formData.message) {
      toast.error('Please fill in subject and message');
      return;
    }

    if (formData.recipient_type === 'Specific Emails' && !formData.specific_emails.trim()) {
      toast.error('Please enter at least one email address');
      return;
    }

    sendMutation.mutate(formData);
  };

  const getRecipientCount = () => {
    const emails = getRecipientEmails(
      formData.recipient_type,
      formData.recipient_ids,
      formData.contact_list_id,
      formData.specific_emails
    );
    return emails.length;
  };

  const statusColors = {
    Draft: 'bg-gray-100 text-gray-800',
    Scheduled: 'bg-blue-100 text-blue-800',
    Sending: 'bg-yellow-100 text-yellow-800',
    Sent: 'bg-green-100 text-green-800',
    Failed: 'bg-red-100 text-red-800',
  };

  const isMobile = useIsMobile();
  const [mobileTab, setMobileTab] = useState('compose');
  const [composeDialogOpen, setComposeDialogOpen] = useState(false);

  const mobileTabs = [
    { id: 'compose', label: 'Compose', icon: Send },
    { id: 'history', label: 'History', icon: MessageSquare, count: notifications.length },
  ];

  // Mobile View
  if (isMobile) {
    return (
      <div className="p-4 pb-24">
        <MobileHeader
          title="Messaging"
          subtitle="Send notifications"
          onAdd={() => setComposeDialogOpen(true)}
          addLabel="New"
        />

        <MobileTabs tabs={mobileTabs} activeTab={mobileTab} onTabChange={setMobileTab} />

        {mobileTab === 'compose' && (
          <Card>
            <CardContent className="p-4 space-y-4">
              <MobileSelect
                label="Recipients"
                value={formData.recipient_type}
                onValueChange={(value) => setFormData({ ...formData, recipient_type: value })}
                options={[
                  { value: 'All Parents', label: 'All Parents' },
                  { value: 'All Students', label: 'All Students' },
                  { value: 'All Teachers', label: 'All Teachers' },
                  { value: 'Specific Emails', label: 'Specific Emails' },
                ]}
              />
              <p className="text-xs text-gray-500">{getRecipientCount()} recipient(s)</p>
              
              {formData.recipient_type === 'Specific Emails' && (
                <MobileTextarea
                  label="Email Addresses"
                  placeholder="Separate by commas"
                  value={formData.specific_emails}
                  onChange={(e) => setFormData({ ...formData, specific_emails: e.target.value })}
                />
              )}

              <MobileSelect
                label="Channel"
                value={formData.channel}
                onValueChange={(value) => setFormData({ ...formData, channel: value })}
                options={[
                  { value: 'Email', label: 'Email' },
                  { value: 'SMS', label: 'SMS' },
                  { value: 'WhatsApp', label: 'WhatsApp' },
                ]}
              />

              <MobileInput
                label="Subject"
                value={formData.subject}
                onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                placeholder="Message subject"
              />

              <MobileTextarea
                label="Message"
                value={formData.message}
                onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                placeholder="Type your message..."
              />

              <MobileInput
                label="Schedule Send"
                type="datetime-local"
                value={formData.scheduled_date}
                onChange={(e) => setFormData({ ...formData, scheduled_date: e.target.value })}
              />

              <Button
                onClick={handleSend}
                className="w-full bg-blue-600 hover:bg-blue-700 h-12"
                disabled={sendMutation.isPending}
              >
                <Send className="w-4 h-4 mr-2" />
                {sendMutation.isPending ? 'Sending...' : (formData.scheduled_date ? `Schedule for ${getRecipientCount()}` : `Send to ${getRecipientCount()}`)}
              </Button>
            </CardContent>
          </Card>
        )}

        {mobileTab === 'history' && (
          <MobileTable
            data={notifications}
            loading={isLoading}
            emptyMessage="No messages sent yet"
            renderItem={(notification) => (
              <MobileTableRow
                key={notification.id}
                primary={notification.subject}
                secondary={`To: ${notification.recipient_type}`}
                tertiary={notification.sent_date ? format(new Date(notification.sent_date), 'MMM d, HH:mm') : 'Scheduled'}
                badge={notification.status}
                badgeVariant={notification.status === 'Sent' ? 'default' : notification.status === 'Failed' ? 'destructive' : 'secondary'}
                icon={Mail}
              />
            )}
          />
        )}
      </div>
    );
  }

  // Desktop View
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
                <Select value={formData.recipient_type} onValueChange={(value) => setFormData({ ...formData, recipient_type: value, recipient_ids: '', contact_list_id: '' })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="All Parents">All Parents</SelectItem>
                    <SelectItem value="All Students">All Students</SelectItem>
                    <SelectItem value="All Teachers">All Teachers</SelectItem>
                    <SelectItem value="Specific Class">Specific Class</SelectItem>
                    <SelectItem value="Custom List">Custom List</SelectItem>
                    <SelectItem value="Specific Emails">Specific Emails</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-gray-500 mt-1">
                  {getRecipientCount()} recipient(s) selected
                </p>
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

              {formData.recipient_type === 'Custom List' && (
                <div>
                  <Label>Select Contact List</Label>
                  <Select value={formData.contact_list_id} onValueChange={(value) => setFormData({ ...formData, contact_list_id: value })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Choose contact list" />
                    </SelectTrigger>
                    <SelectContent>
                      {contactLists.map(list => (
                        <SelectItem key={list.id} value={list.id}>
                          {list.list_name} ({list.contact_count || 0} contacts)
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {formData.recipient_type === 'Specific Emails' && (
                <div>
                  <Label>Email Addresses *</Label>
                  <Textarea
                    placeholder="Enter email addresses separated by commas"
                    value={formData.specific_emails}
                    onChange={(e) => setFormData({ ...formData, specific_emails: e.target.value })}
                    rows={2}
                  />
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
                  <Label>Priority</Label>
                  <Select value={formData.priority} onValueChange={(value) => setFormData({ ...formData, priority: value })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Critical">Critical</SelectItem>
                      <SelectItem value="High">High</SelectItem>
                      <SelectItem value="Normal">Normal</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Template</Label>
                  <Select value={formData.template_type} onValueChange={(value) => setFormData({ ...formData, template_type: value })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="General Announcement">General Announcement</SelectItem>
                      <SelectItem value="Emergency Alert">Emergency Alert</SelectItem>
                      <SelectItem value="Fee Reminder">Fee Reminder</SelectItem>
                      <SelectItem value="Attendance Notice">Attendance Notice</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
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
                  rows={6}
                />
              </div>

              <div>
                <Label>Attachments (Optional)</Label>
                <div className="space-y-2">
                  <Input
                    type="file"
                    multiple
                    onChange={handleFileChange}
                    disabled={attachments.length >= 5}
                    className="cursor-pointer"
                  />
                  <p className="text-xs text-gray-500">
                    Max 5 files, each up to 5MB ({attachments.length}/5)
                  </p>
                  {attachments.length > 0 && (
                    <div className="space-y-1">
                      {attachments.map((file, index) => (
                        <div key={index} className="flex items-center justify-between bg-gray-50 p-2 rounded">
                          <div className="flex items-center gap-2">
                            <Paperclip className="w-4 h-4 text-gray-500" />
                            <span className="text-sm text-gray-700">{file.name}</span>
                          </div>
                          <Button variant="ghost" size="sm" onClick={() => removeAttachment(index)}>
                            <X className="w-4 h-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <div>
                <Label>Schedule Send (Optional)</Label>
                <Input
                  type="datetime-local"
                  value={formData.scheduled_date}
                  onChange={(e) => setFormData({ ...formData, scheduled_date: e.target.value })}
                />
                <p className="text-xs text-gray-500 mt-1">Leave empty to send immediately</p>
              </div>

              <Button
                onClick={handleSend}
                className="w-full bg-blue-600 hover:bg-blue-700"
                disabled={sendMutation.isPending}
              >
                <Send className="w-4 h-4 mr-2" />
                {sendMutation.isPending 
                  ? 'Sending...' 
                  : formData.scheduled_date 
                    ? 'Schedule Message' 
                    : `Send to ${getRecipientCount()} Recipients`}
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
                    <div className="flex items-start justify-between mb-2 gap-3">
                      <div className="flex-1">
                        <h4 className="font-semibold text-gray-900">{notification.subject}</h4>
                        <p className="text-sm text-gray-600">To: {notification.recipient_type}</p>
                        <div className="flex flex-wrap gap-2 mt-2">
                          {notification.template_type && <Badge variant="outline">{notification.template_type}</Badge>}
                          {notification.priority && <Badge className={notification.priority === 'Critical' ? 'bg-red-100 text-red-700' : notification.priority === 'High' ? 'bg-orange-100 text-orange-700' : 'bg-gray-100 text-gray-700'}>{notification.priority}</Badge>}
                        </div>
                      </div>
                      <Badge className={statusColors[notification.status]}>
                        {notification.status}
                      </Badge>
                    </div>
                    <p className="text-sm text-gray-600 mb-2 line-clamp-2">{notification.message}</p>
                    <div className="flex items-center justify-between text-xs text-gray-500">
                      <span className="flex items-center gap-1">
                        {notification.channel}
                        {notification.sent_date && (
                          <span className="ml-2">
                            {format(new Date(notification.sent_date), 'MMM d, HH:mm')}
                          </span>
                        )}
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