import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { MessageSquare, Plus, AlertTriangle, Lock, Send, Flag } from 'lucide-react';
import { format } from 'date-fns';

const SAFEGUARDING_KEYWORDS = [
  'hurt', 'harm', 'violence', 'abuse', 'bully', 'threat', 'unsafe', 'scared',
  'fear', 'pain', 'secret', 'don\'t tell', 'inappropriate', 'uncomfortable'
];

export default function SecureMessaging() {
  const [user, setUser] = useState(null);
  const [selectedThread, setSelectedThread] = useState(null);
  const [newMessage, setNewMessage] = useState('');
  const [isNewThreadOpen, setIsNewThreadOpen] = useState(false);
  const queryClient = useQueryClient();

  useEffect(() => {
    const fetchUser = async () => {
      const currentUser = await base44.auth.me();
      setUser(currentUser);
    };
    fetchUser();
  }, []);

  const { data: threads = [] } = useQuery({
    queryKey: ['message-threads'],
    queryFn: async () => {
      const allThreads = await base44.entities.MessageThread.list('-last_message_date');
      if (!user) return [];
      
      return allThreads.filter(thread => {
        const participants = thread.participants ? JSON.parse(thread.participants) : [];
        return participants.some(p => p.id === user.email || p.email === user.email);
      });
    },
    enabled: !!user,
  });

  const { data: messages = [] } = useQuery({
    queryKey: ['messages', selectedThread?.id],
    queryFn: async () => {
      if (!selectedThread) return [];
      const allMessages = await base44.entities.Message.list('-created_date');
      return allMessages.filter(m => m.thread_id === selectedThread.id && !m.is_deleted);
    },
    enabled: !!selectedThread,
  });

  const checkSafeguarding = (text) => {
    const lowerText = text.toLowerCase();
    const flaggedKeywords = SAFEGUARDING_KEYWORDS.filter(keyword => lowerText.includes(keyword));
    return { isFlagged: flaggedKeywords.length > 0, keywords: flaggedKeywords };
  };

  const sendMessageMutation = useMutation({
    mutationFn: async (data) => {
      const safeguarding = checkSafeguarding(data.message_content);
      
      const message = await base44.entities.Message.create({
        ...data,
        is_flagged: safeguarding.isFlagged,
        flag_keywords: safeguarding.isFlagged ? safeguarding.keywords.join(', ') : '',
        read_by: JSON.stringify([user.email]),
      });

      await base44.entities.MessageThread.update(selectedThread.id, {
        last_message: data.message_content.substring(0, 100),
        last_message_date: new Date().toISOString(),
        last_message_by: user.email,
        message_count: (selectedThread.message_count || 0) + 1,
        is_flagged: safeguarding.isFlagged || selectedThread.is_flagged,
        flag_reason: safeguarding.isFlagged ? 'Contains safeguarding keywords' : selectedThread.flag_reason,
      });

      return message;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['messages'] });
      queryClient.invalidateQueries({ queryKey: ['message-threads'] });
      setNewMessage('');
    },
  });

  const handleSendMessage = () => {
    if (!newMessage.trim() || !selectedThread) return;

    sendMessageMutation.mutate({
      thread_id: selectedThread.id,
      sender_id: user.email,
      sender_name: user.full_name || user.email,
      sender_type: user.role === 'admin' ? 'Admin' : user.role === 'teacher' ? 'Teacher' : 'Student',
      message_content: newMessage,
    });
  };

  const flaggedThreads = threads.filter(t => t.is_flagged);

  if (!user) {
    return (
      <div className="text-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Secure Messaging</h1>
          <p className="text-gray-600 mt-1">Protected student-teacher communication</p>
        </div>
        {user.role !== 'student' && (
          <Button onClick={() => setIsNewThreadOpen(true)} className="bg-blue-600 hover:bg-blue-700">
            <Plus className="w-4 h-4 mr-2" />
            New Conversation
          </Button>
        )}
      </div>

      {flaggedThreads.length > 0 && user.role === 'admin' && (
        <Card className="bg-red-50 border-red-200">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-red-800">
              <AlertTriangle className="w-5 h-5" />
              <span className="font-semibold">{flaggedThreads.length} conversation(s) flagged for safeguarding review</span>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="bg-white shadow-md lg:col-span-1">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageSquare className="w-5 h-5" />
              Conversations
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="max-h-[600px] overflow-y-auto">
              {threads.map((thread) => (
                <div
                  key={thread.id}
                  onClick={() => setSelectedThread(thread)}
                  className={`p-4 border-b cursor-pointer hover:bg-gray-50 ${
                    selectedThread?.id === thread.id ? 'bg-blue-50' : ''
                  }`}
                >
                  <div className="flex items-start justify-between mb-1">
                    <h4 className="font-semibold text-sm">{thread.subject}</h4>
                    {thread.is_flagged && <Flag className="w-4 h-4 text-red-600" />}
                  </div>
                  <p className="text-xs text-gray-600 line-clamp-2">{thread.last_message}</p>
                  <div className="flex items-center justify-between mt-2">
                    <span className="text-xs text-gray-500">
                      {thread.last_message_date ? format(new Date(thread.last_message_date), 'MMM d, HH:mm') : ''}
                    </span>
                    <Badge className="bg-blue-100 text-blue-800 text-xs">{thread.message_count || 0}</Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white shadow-md lg:col-span-2">
          {selectedThread ? (
            <>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>{selectedThread.subject}</CardTitle>
                    <p className="text-sm text-gray-600 mt-1">
                      {selectedThread.thread_type}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    {selectedThread.is_locked && (
                      <Badge className="bg-gray-100 text-gray-800">
                        <Lock className="w-3 h-3 mr-1" />
                        Locked
                      </Badge>
                    )}
                    {selectedThread.is_flagged && (
                      <Badge className="bg-red-100 text-red-800">
                        <Flag className="w-3 h-3 mr-1" />
                        Flagged
                      </Badge>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4 max-h-[400px] overflow-y-auto mb-4">
                  {messages.map((message) => {
                    const isOwnMessage = message.sender_id === user.email;
                    return (
                      <div key={message.id} className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-[70%] ${isOwnMessage ? 'bg-blue-600 text-white' : 'bg-gray-100'} rounded-lg p-3`}>
                          <div className="flex items-center gap-2 mb-1">
                            <span className={`text-xs font-semibold ${isOwnMessage ? 'text-blue-100' : 'text-gray-600'}`}>
                              {message.sender_name}
                            </span>
                            {message.is_flagged && <Flag className="w-3 h-3 text-red-500" />}
                          </div>
                          <p className="text-sm whitespace-pre-wrap">{message.message_content}</p>
                          <span className={`text-xs ${isOwnMessage ? 'text-blue-100' : 'text-gray-500'} block mt-1`}>
                            {format(new Date(message.created_date), 'HH:mm')}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {!selectedThread.is_locked && (
                  <div className="flex gap-2">
                    <Textarea
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      placeholder="Type your message..."
                      rows={2}
                      onKeyPress={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault();
                          handleSendMessage();
                        }
                      }}
                    />
                    <Button onClick={handleSendMessage} disabled={!newMessage.trim() || sendMessageMutation.isPending}>
                      <Send className="w-4 h-4" />
                    </Button>
                  </div>
                )}

                <p className="text-xs text-gray-500 mt-2 flex items-center gap-1">
                  <Lock className="w-3 h-3" />
                  Messages are monitored for safeguarding
                </p>
              </CardContent>
            </>
          ) : (
            <CardContent className="p-12 text-center">
              <MessageSquare className="w-12 h-12 text-gray-400 mx-auto mb-3" />
              <p className="text-gray-600">Select a conversation to view messages</p>
            </CardContent>
          )}
        </Card>
      </div>

      <NewThreadDialog
        open={isNewThreadOpen}
        onOpenChange={setIsNewThreadOpen}
        user={user}
        onThreadCreated={() => {
          queryClient.invalidateQueries({ queryKey: ['message-threads'] });
          setIsNewThreadOpen(false);
        }}
      />
    </div>
  );
}

function NewThreadDialog({ open, onOpenChange, user, onThreadCreated }) {
  const [formData, setFormData] = useState({
    thread_type: 'Student-Teacher',
    subject: '',
    recipient_id: '',
  });

  const { data: students = [] } = useQuery({
    queryKey: ['students'],
    queryFn: () => base44.entities.Student.list(),
  });

  const { data: teachers = [] } = useQuery({
    queryKey: ['teachers'],
    queryFn: () => base44.entities.Teacher.list(),
  });

  const createThreadMutation = useMutation({
    mutationFn: async (data) => {
      const recipient = data.thread_type === 'Student-Teacher' 
        ? students.find(s => s.id === data.recipient_id)
        : teachers.find(t => t.id === data.recipient_id);

      const participants = [
        { id: user.email, name: user.full_name || user.email, type: user.role },
        { id: data.recipient_id, name: `${recipient?.first_name} ${recipient?.last_name}`, type: data.thread_type === 'Student-Teacher' ? 'Student' : 'Teacher' }
      ];

      return base44.entities.MessageThread.create({
        thread_type: data.thread_type,
        subject: data.subject,
        participants: JSON.stringify(participants),
        message_count: 0,
        status: 'Active',
      });
    },
    onSuccess: () => {
      onThreadCreated();
    },
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    createThreadMutation.mutate(formData);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-white">
        <DialogHeader>
          <DialogTitle className="text-gray-900">Start New Conversation</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-sm font-medium">Type</label>
            <Select value={formData.thread_type} onValueChange={(value) => setFormData({ ...formData, thread_type: value })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="Student-Teacher">Student-Teacher</SelectItem>
                <SelectItem value="Parent-Teacher">Parent-Teacher</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="text-sm font-medium">Subject</label>
            <Input value={formData.subject} onChange={(e) => setFormData({ ...formData, subject: e.target.value })} required />
          </div>

          <div>
            <label className="text-sm font-medium">Recipient</label>
            <Select value={formData.recipient_id} onValueChange={(value) => setFormData({ ...formData, recipient_id: value })}>
              <SelectTrigger><SelectValue placeholder="Select recipient" /></SelectTrigger>
              <SelectContent>
                {(formData.thread_type === 'Student-Teacher' ? students : teachers).map((person) => (
                  <SelectItem key={person.id} value={person.id}>
                    {person.first_name} {person.last_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex justify-end gap-3">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button type="submit" className="bg-blue-600 hover:bg-blue-700">Create</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}