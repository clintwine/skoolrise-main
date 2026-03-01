import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Bell, Check, CheckCheck, Trash2, Info, AlertTriangle, CheckCircle, XCircle, ClipboardList, Award, Calendar, DollarSign, Megaphone } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '../utils';
import { format } from 'date-fns';
import { toast } from 'sonner';

const typeIcons = {
  info: Info,
  success: CheckCircle,
  warning: AlertTriangle,
  error: XCircle,
  assignment: ClipboardList,
  grade: Award,
  attendance: Calendar,
  fee: DollarSign,
  behavior: Award,
  announcement: Megaphone,
};

const typeColors = {
  info: 'text-blue-500 bg-blue-100',
  success: 'text-green-500 bg-green-100',
  warning: 'text-yellow-500 bg-yellow-100',
  error: 'text-red-500 bg-red-100',
  assignment: 'text-purple-500 bg-purple-100',
  grade: 'text-indigo-500 bg-indigo-100',
  attendance: 'text-teal-500 bg-teal-100',
  fee: 'text-orange-500 bg-orange-100',
  behavior: 'text-pink-500 bg-pink-100',
  announcement: 'text-cyan-500 bg-cyan-100',
};

export default function NotificationsPage() {
  const [activeTab, setActiveTab] = useState('all');
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data: user } = useQuery({
    queryKey: ['current-user'],
    queryFn: () => base44.auth.me(),
  });

  const { data: notifications = [], isLoading } = useQuery({
    queryKey: ['all-notifications', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      return await base44.entities.InAppNotification.filter({ user_id: user.id }, '-created_date', 100);
    },
    enabled: !!user?.id,
  });

  const markAsReadMutation = useMutation({
    mutationFn: async (notificationId) => {
      await base44.entities.InAppNotification.update(notificationId, { is_read: true });
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['all-notifications']);
      queryClient.invalidateQueries(['in-app-notifications']);
    },
  });

  const markAllAsReadMutation = useMutation({
    mutationFn: async () => {
      const unread = notifications.filter(n => !n.is_read);
      await Promise.all(unread.map(n => base44.entities.InAppNotification.update(n.id, { is_read: true })));
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['all-notifications']);
      queryClient.invalidateQueries(['in-app-notifications']);
      toast.success('All notifications marked as read');
    },
  });

  const deleteNotificationMutation = useMutation({
    mutationFn: async (notificationId) => {
      await base44.entities.InAppNotification.delete(notificationId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['all-notifications']);
      queryClient.invalidateQueries(['in-app-notifications']);
      toast.success('Notification deleted');
    },
  });

  const filteredNotifications = notifications.filter(n => {
    if (activeTab === 'all') return true;
    if (activeTab === 'unread') return !n.is_read;
    return n.type === activeTab;
  });

  const unreadCount = notifications.filter(n => !n.is_read).length;

  const handleNotificationClick = (notification) => {
    if (!notification.is_read) {
      markAsReadMutation.mutate(notification.id);
    }
    if (notification.link) {
      const url = notification.link_params 
        ? `${notification.link}?${notification.link_params}`
        : notification.link;
      navigate(createPageUrl(url));
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Notifications</h1>
          <p className="text-gray-600 mt-1">
            {unreadCount > 0 ? `You have ${unreadCount} unread notification${unreadCount > 1 ? 's' : ''}` : 'All caught up!'}
          </p>
        </div>
        {unreadCount > 0 && (
          <Button 
            onClick={() => markAllAsReadMutation.mutate()}
            disabled={markAllAsReadMutation.isPending}
            className="gap-2"
          >
            <CheckCheck className="w-4 h-4" />
            Mark all as read
          </Button>
        )}
      </div>

      <Card>
        <CardContent className="p-0">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <div className="border-b px-4">
              <TabsList className="h-12 bg-transparent">
                <TabsTrigger value="all" className="data-[state=active]:bg-blue-50">
                  All
                  <Badge variant="secondary" className="ml-2">{notifications.length}</Badge>
                </TabsTrigger>
                <TabsTrigger value="unread" className="data-[state=active]:bg-blue-50">
                  Unread
                  {unreadCount > 0 && <Badge className="ml-2 bg-red-500">{unreadCount}</Badge>}
                </TabsTrigger>
                <TabsTrigger value="assignment" className="data-[state=active]:bg-blue-50">Assignments</TabsTrigger>
                <TabsTrigger value="grade" className="data-[state=active]:bg-blue-50">Grades</TabsTrigger>
                <TabsTrigger value="fee" className="data-[state=active]:bg-blue-50">Fees</TabsTrigger>
              </TabsList>
            </div>

            <TabsContent value={activeTab} className="mt-0">
              {isLoading ? (
                <div className="flex items-center justify-center py-12">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                </div>
              ) : filteredNotifications.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 text-gray-500">
                  <Bell className="w-16 h-16 mb-4 text-gray-300" />
                  <p className="text-lg font-medium">No notifications</p>
                  <p className="text-sm">You're all caught up!</p>
                </div>
              ) : (
                <div className="divide-y">
                  {filteredNotifications.map((notification) => {
                    const Icon = typeIcons[notification.type] || Info;
                    const colorClass = typeColors[notification.type] || typeColors.info;
                    
                    return (
                      <div
                        key={notification.id}
                        className={`p-4 hover:bg-gray-50 transition-colors ${
                          !notification.is_read ? 'bg-blue-50/30' : ''
                        }`}
                      >
                        <div className="flex gap-4">
                          <div className={`flex-shrink-0 w-12 h-12 rounded-full flex items-center justify-center ${colorClass}`}>
                            <Icon className="w-6 h-6" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-2">
                              <button 
                                onClick={() => handleNotificationClick(notification)}
                                className="text-left"
                              >
                                <p className={`text-sm font-medium text-gray-900 hover:text-blue-600 ${
                                  !notification.is_read ? 'font-semibold' : ''
                                }`}>
                                  {notification.title}
                                </p>
                              </button>
                              <div className="flex items-center gap-2 flex-shrink-0">
                                {!notification.is_read && (
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => markAsReadMutation.mutate(notification.id)}
                                    className="h-8 w-8 p-0"
                                    title="Mark as read"
                                  >
                                    <Check className="w-4 h-4" />
                                  </Button>
                                )}
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => deleteNotificationMutation.mutate(notification.id)}
                                  className="h-8 w-8 p-0 text-gray-400 hover:text-red-500"
                                  title="Delete"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              </div>
                            </div>
                            <p className="text-sm text-gray-600 mt-1">
                              {notification.message}
                            </p>
                            <p className="text-xs text-gray-400 mt-2">
                              {format(new Date(notification.created_date), 'MMM d, yyyy at h:mm a')}
                            </p>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}