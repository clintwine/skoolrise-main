import React, { useState, useEffect, useRef } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Send, MessageCircle, User } from 'lucide-react';
import { format } from 'date-fns';

export default function ParentTeacherChat({ 
  parentId, 
  parentName,
  parentUserId,
  teacherId, 
  teacherName,
  teacherUserId,
  studentId,
  studentName,
  currentUserType, // 'parent' or 'teacher'
}) {
  const [newMessage, setNewMessage] = useState('');
  const scrollRef = useRef(null);
  const queryClient = useQueryClient();

  // Generate consistent thread ID
  const threadId = [parentId, teacherId, studentId].sort().join('-');

  const { data: messages = [], isLoading } = useQuery({
    queryKey: ['parent-teacher-messages', threadId],
    queryFn: async () => {
      return await base44.entities.ParentTeacherMessage.filter({ 
        thread_id: threadId 
      }, 'created_date', 100);
    },
    refetchInterval: 5000, // Poll every 5 seconds
  });

  const sendMessageMutation = useMutation({
    mutationFn: async (messageText) => {
      return await base44.entities.ParentTeacherMessage.create({
        thread_id: threadId,
        parent_id: parentId,
        parent_name: parentName,
        parent_user_id: parentUserId,
        teacher_id: teacherId,
        teacher_name: teacherName,
        teacher_user_id: teacherUserId,
        student_id: studentId,
        student_name: studentName,
        sender_type: currentUserType,
        message: messageText,
        is_read: false,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['parent-teacher-messages', threadId]);
      setNewMessage('');
    },
  });

  // Mark messages as read
  useEffect(() => {
    const unreadMessages = messages.filter(m => 
      !m.is_read && m.sender_type !== currentUserType
    );
    
    unreadMessages.forEach(async (msg) => {
      await base44.entities.ParentTeacherMessage.update(msg.id, { is_read: true });
    });
  }, [messages, currentUserType]);

  // Scroll to bottom on new messages
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = () => {
    if (!newMessage.trim()) return;
    sendMessageMutation.mutate(newMessage.trim());
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <Card className="flex flex-col h-[500px]">
      <CardHeader className="pb-3 border-b">
        <CardTitle className="flex items-center gap-2 text-lg">
          <MessageCircle className="w-5 h-5 text-blue-500" />
          Chat with {currentUserType === 'parent' ? teacherName : parentName}
        </CardTitle>
        <p className="text-sm text-gray-500">
          Regarding: {studentName}
        </p>
      </CardHeader>
      <CardContent className="flex-1 flex flex-col p-0">
        <ScrollArea className="flex-1 p-4" ref={scrollRef}>
          {isLoading ? (
            <div className="flex items-center justify-center h-full">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
            </div>
          ) : messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-gray-500">
              <MessageCircle className="w-12 h-12 mb-3 text-gray-300" />
              <p className="text-sm">No messages yet</p>
              <p className="text-xs">Start the conversation!</p>
            </div>
          ) : (
            <div className="space-y-4">
              {messages.map((msg) => {
                const isOwnMessage = msg.sender_type === currentUserType;
                
                return (
                  <div
                    key={msg.id}
                    className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'}`}
                  >
                    <div className={`max-w-[75%] ${isOwnMessage ? 'order-2' : ''}`}>
                      <div
                        className={`p-3 rounded-2xl ${
                          isOwnMessage
                            ? 'bg-blue-600 text-white rounded-br-md'
                            : 'bg-gray-100 text-gray-900 rounded-bl-md'
                        }`}
                      >
                        <p className="text-sm whitespace-pre-wrap">{msg.message}</p>
                      </div>
                      <div className={`flex items-center gap-1 mt-1 ${isOwnMessage ? 'justify-end' : ''}`}>
                        <span className="text-xs text-gray-400">
                          {format(new Date(msg.created_date), 'h:mm a')}
                        </span>
                        {isOwnMessage && msg.is_read && (
                          <span className="text-xs text-blue-500">✓✓</span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </ScrollArea>
        
        <div className="p-4 border-t bg-gray-50">
          <div className="flex gap-2">
            <Input
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Type a message..."
              className="flex-1"
            />
            <Button 
              onClick={handleSend}
              disabled={!newMessage.trim() || sendMessageMutation.isPending}
              size="icon"
              className="bg-blue-600 hover:bg-blue-700"
            >
              <Send className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}