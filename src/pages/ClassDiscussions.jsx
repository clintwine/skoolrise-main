import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { MessageCircle, Plus, Lock, Flag, Send, Shield } from 'lucide-react';
import { format } from 'date-fns';

export default function ClassDiscussions() {
  const [user, setUser] = useState(null);
  const [selectedDiscussion, setSelectedDiscussion] = useState(null);
  const [newMessage, setNewMessage] = useState('');
  const [isNewDiscussionOpen, setIsNewDiscussionOpen] = useState(false);
  const queryClient = useQueryClient();

  useEffect(() => {
    const fetchUser = async () => {
      const currentUser = await base44.auth.me();
      setUser(currentUser);
    };
    fetchUser();
  }, []);

  const { data: discussions = [] } = useQuery({
    queryKey: ['class-discussions'],
    queryFn: async () => {
      const allThreads = await base44.entities.MessageThread.list('-last_message_date');
      return allThreads.filter(thread => thread.thread_type === 'Class-Discussion');
    },
  });

  const { data: messages = [] } = useQuery({
    queryKey: ['discussion-messages', selectedDiscussion?.id],
    queryFn: async () => {
      if (!selectedDiscussion) return [];
      const allMessages = await base44.entities.Message.list('created_date');
      return allMessages.filter(m => m.thread_id === selectedDiscussion.id && !m.is_deleted);
    },
    enabled: !!selectedDiscussion,
  });

  const { data: classes = [] } = useQuery({
    queryKey: ['classes'],
    queryFn: () => base44.entities.Class.list(),
  });

  const sendMessageMutation = useMutation({
    mutationFn: async (data) => {
      const message = await base44.entities.Message.create(data);
      
      await base44.entities.MessageThread.update(selectedDiscussion.id, {
        last_message: data.message_content.substring(0, 100),
        last_message_date: new Date().toISOString(),
        last_message_by: user.email,
        message_count: (selectedDiscussion.message_count || 0) + 1,
      });

      return message;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['discussion-messages'] });
      queryClient.invalidateQueries({ queryKey: ['class-discussions'] });
      setNewMessage('');
    },
  });

  const createDiscussionMutation = useMutation({
    mutationFn: (data) => base44.entities.MessageThread.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['class-discussions'] });
      setIsNewDiscussionOpen(false);
    },
  });

  const handleSendMessage = () => {
    if (!newMessage.trim() || !selectedDiscussion) return;

    sendMessageMutation.mutate({
      thread_id: selectedDiscussion.id,
      sender_id: user.email,
      sender_name: user.full_name || user.email,
      sender_type: user.role === 'admin' ? 'Admin' : user.role === 'teacher' ? 'Teacher' : 'Student',
      message_content: newMessage,
    });
  };

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
          <h1 className="text-3xl font-bold text-gray-900">Class Discussions</h1>
          <p className="text-gray-600 mt-1">Collaborative learning space</p>
        </div>
        {(user.role === 'admin' || user.role === 'teacher') && (
          <Button onClick={() => setIsNewDiscussionOpen(true)} className="bg-blue-600 hover:bg-blue-700">
            <Plus className="w-4 h-4 mr-2" />
            New Discussion
          </Button>
        )}
      </div>

      <Card className="bg-blue-50 border-blue-200">
        <CardContent className="p-4">
          <div className="flex items-center gap-2 text-blue-800">
            <Shield className="w-5 h-5" />
            <span className="text-sm">All discussions are monitored for student safety and appropriate content</span>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="bg-white shadow-md lg:col-span-1">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageCircle className="w-5 h-5" />
              Discussions
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="max-h-[600px] overflow-y-auto">
              {discussions.map((discussion) => (
                <div
                  key={discussion.id}
                  onClick={() => setSelectedDiscussion(discussion)}
                  className={`p-4 border-b cursor-pointer hover:bg-gray-50 ${
                    selectedDiscussion?.id === discussion.id ? 'bg-blue-50' : ''
                  }`}
                >
                  <div className="flex items-start justify-between mb-1">
                    <div className="flex-1">
                      <h4 className="font-semibold text-sm">{discussion.subject}</h4>
                      <p className="text-xs text-gray-600">{discussion.class_name}</p>
                    </div>
                    <div className="flex gap-1">
                      {discussion.is_locked && <Lock className="w-4 h-4 text-gray-600" />}
                      {discussion.is_flagged && <Flag className="w-4 h-4 text-red-600" />}
                    </div>
                  </div>
                  <p className="text-xs text-gray-600 line-clamp-1">{discussion.last_message}</p>
                  <div className="flex items-center justify-between mt-2">
                    <span className="text-xs text-gray-500">
                      {discussion.last_message_date ? format(new Date(discussion.last_message_date), 'MMM d, HH:mm') : ''}
                    </span>
                    <Badge className="bg-purple-100 text-purple-800 text-xs">{discussion.message_count || 0}</Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white shadow-md lg:col-span-2">
          {selectedDiscussion ? (
            <>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>{selectedDiscussion.subject}</CardTitle>
                    <p className="text-sm text-gray-600 mt-1">{selectedDiscussion.class_name}</p>
                  </div>
                  <div className="flex gap-2">
                    {selectedDiscussion.is_locked && (
                      <Badge className="bg-gray-100 text-gray-800">
                        <Lock className="w-3 h-3 mr-1" />
                        Locked
                      </Badge>
                    )}
                    <Badge className="bg-purple-100 text-purple-800">
                      {selectedDiscussion.message_count || 0} messages
                    </Badge>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4 max-h-[400px] overflow-y-auto mb-4">
                  {messages.map((message) => {
                    const isOwnMessage = message.sender_id === user.email;
                    return (
                      <div key={message.id} className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-[70%] ${isOwnMessage ? 'bg-purple-600 text-white' : 'bg-gray-100'} rounded-lg p-3`}>
                          <div className="flex items-center gap-2 mb-1">
                            <span className={`text-xs font-semibold ${isOwnMessage ? 'text-purple-100' : 'text-gray-600'}`}>
                              {message.sender_name} • {message.sender_type}
                            </span>
                            {message.is_flagged && <Flag className="w-3 h-3 text-red-500" />}
                          </div>
                          <p className="text-sm whitespace-pre-wrap">{message.message_content}</p>
                          <span className={`text-xs ${isOwnMessage ? 'text-purple-100' : 'text-gray-500'} block mt-1`}>
                            {format(new Date(message.created_date), 'MMM d, HH:mm')}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {!selectedDiscussion.is_locked && (
                  <div className="flex gap-2">
                    <Textarea
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      placeholder="Add to the discussion..."
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
                  <Shield className="w-3 h-3" />
                  Monitored for appropriate content
                </p>
              </CardContent>
            </>
          ) : (
            <CardContent className="p-12 text-center">
              <MessageCircle className="w-12 h-12 text-gray-400 mx-auto mb-3" />
              <p className="text-gray-600">Select a discussion to participate</p>
            </CardContent>
          )}
        </Card>
      </div>

      <Dialog open={isNewDiscussionOpen} onOpenChange={setIsNewDiscussionOpen}>
        <DialogContent className="bg-white">
          <DialogHeader>
            <DialogTitle className="text-gray-900">Create Class Discussion</DialogTitle>
          </DialogHeader>
          <form onSubmit={(e) => {
            e.preventDefault();
            const formData = new FormData(e.target);
            const classObj = classes.find(c => c.id === formData.get('class_id'));
            
            createDiscussionMutation.mutate({
              thread_type: 'Class-Discussion',
              subject: formData.get('subject'),
              class_id: formData.get('class_id'),
              class_name: classObj?.class_name,
              message_count: 0,
              status: 'Active',
            });
          }} className="space-y-4">
            <div>
              <label className="text-sm font-medium">Discussion Topic</label>
              <Input name="subject" required placeholder="e.g., Chapter 5 Review Discussion" />
            </div>

            <div>
              <label className="text-sm font-medium">Class</label>
              <select name="class_id" required className="w-full px-3 py-2 border rounded-lg">
                <option value="">Select class</option>
                {classes.map((cls) => (
                  <option key={cls.id} value={cls.id}>{cls.class_name}</option>
                ))}
              </select>
            </div>

            <div className="flex justify-end gap-3">
              <Button type="button" variant="outline" onClick={() => setIsNewDiscussionOpen(false)}>Cancel</Button>
              <Button type="submit" className="bg-blue-600 hover:bg-blue-700">Create</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}