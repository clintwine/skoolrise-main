import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { CheckCircle, XCircle, Mail, MessageSquare, Eye, MousePointer, Search } from 'lucide-react';
import { format } from 'date-fns';

export default function DeliveryReports() {
  const [selectedNotification, setSelectedNotification] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');

  const { data: notifications = [], isLoading } = useQuery({
    queryKey: ['notifications'],
    queryFn: () => base44.entities.Notification.list('-created_date'),
  });

  const filteredNotifications = notifications.filter(n =>
    n.subject?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    n.recipient_type?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalSent = notifications.filter(n => n.status === 'Sent').length;
  const totalDelivered = notifications.reduce((sum, n) => sum + (n.delivery_count || 0), 0);
  const totalFailed = notifications.reduce((sum, n) => sum + (n.failure_count || 0), 0);
  const totalOpened = notifications.reduce((sum, n) => sum + (n.opened_count || 0), 0);
  const avgOpenRate = totalDelivered > 0 ? ((totalOpened / totalDelivered) * 100).toFixed(1) : 0;

  const statusColors = {
    Draft: 'bg-gray-100 text-gray-800',
    Scheduled: 'bg-blue-100 text-blue-800',
    Sending: 'bg-yellow-100 text-yellow-800',
    Sent: 'bg-green-100 text-green-800',
    Failed: 'bg-red-100 text-red-800',
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Delivery Reports</h1>
        <p className="text-gray-600 mt-1">Track message delivery and engagement</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-white shadow-md">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Messages Sent</p>
                <p className="text-2xl font-bold text-gray-900">{totalSent}</p>
              </div>
              <Mail className="w-8 h-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>
        <Card className="bg-white shadow-md">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Delivered</p>
                <p className="text-2xl font-bold text-green-600">{totalDelivered}</p>
              </div>
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
          </CardContent>
        </Card>
        <Card className="bg-white shadow-md">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Failed</p>
                <p className="text-2xl font-bold text-red-600">{totalFailed}</p>
              </div>
              <XCircle className="w-8 h-8 text-red-600" />
            </div>
          </CardContent>
        </Card>
        <Card className="bg-white shadow-md">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Avg Open Rate</p>
                <p className="text-2xl font-bold text-blue-600">{avgOpenRate}%</p>
              </div>
              <Eye className="w-8 h-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="bg-white shadow-sm">
        <CardContent className="p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <Input placeholder="Search messages..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-10" />
          </div>
        </CardContent>
      </Card>

      <Card className="bg-white shadow-md">
        <CardHeader>
          <CardTitle>Message History</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Subject</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Recipients</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Channel</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Sent Date</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Delivered</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Failed</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Opened</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {filteredNotifications.map((notification) => {
                    const openRate = notification.delivery_count > 0 
                      ? ((notification.opened_count || 0) / notification.delivery_count * 100).toFixed(1) 
                      : 0;
                    
                    return (
                      <tr key={notification.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 text-sm font-medium text-gray-900">{notification.subject}</td>
                        <td className="px-6 py-4 text-sm text-gray-600">{notification.recipient_type}</td>
                        <td className="px-6 py-4 text-sm text-gray-600">{notification.channel}</td>
                        <td className="px-6 py-4 text-sm text-gray-600">
                          {notification.sent_date ? format(new Date(notification.sent_date), 'MMM d, yyyy HH:mm') : '-'}
                        </td>
                        <td className="px-6 py-4 text-sm">
                          <span className="flex items-center gap-1 text-green-600">
                            <CheckCircle className="w-4 h-4" />
                            {notification.delivery_count || 0}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm">
                          <span className="flex items-center gap-1 text-red-600">
                            <XCircle className="w-4 h-4" />
                            {notification.failure_count || 0}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm">
                          <div>
                            <span className="flex items-center gap-1 text-blue-600">
                              <Eye className="w-4 h-4" />
                              {notification.opened_count || 0}
                            </span>
                            <span className="text-xs text-gray-500">{openRate}%</span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <Badge className={statusColors[notification.status]}>{notification.status}</Badge>
                        </td>
                        <td className="px-6 py-4">
                          <Button variant="outline" size="sm" onClick={() => setSelectedNotification(notification)}>
                            View Details
                          </Button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={!!selectedNotification} onOpenChange={() => setSelectedNotification(null)}>
        <DialogContent className="max-w-3xl bg-white max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-gray-900">Message Details</DialogTitle>
          </DialogHeader>
          {selectedNotification && (
            <div className="space-y-6">
              <div className="p-4 bg-gray-50 rounded-lg space-y-2">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-600">Subject</p>
                    <p className="font-semibold">{selectedNotification.subject}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Status</p>
                    <Badge className={statusColors[selectedNotification.status]}>{selectedNotification.status}</Badge>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Recipients</p>
                    <p className="font-semibold">{selectedNotification.recipient_type}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Channel</p>
                    <p className="font-semibold">{selectedNotification.channel}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Sent Date</p>
                    <p className="font-semibold">
                      {selectedNotification.sent_date ? format(new Date(selectedNotification.sent_date), 'MMM d, yyyy HH:mm') : '-'}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Sent By</p>
                    <p className="font-semibold">{selectedNotification.sent_by}</p>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="font-semibold mb-2">Message Content</h3>
                <div className="p-4 bg-gray-50 rounded-lg">
                  <p className="text-sm whitespace-pre-wrap">{selectedNotification.message}</p>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <Card>
                  <CardContent className="p-4 text-center">
                    <CheckCircle className="w-8 h-8 text-green-600 mx-auto mb-2" />
                    <p className="text-2xl font-bold text-green-600">{selectedNotification.delivery_count || 0}</p>
                    <p className="text-sm text-gray-600">Delivered</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4 text-center">
                    <Eye className="w-8 h-8 text-blue-600 mx-auto mb-2" />
                    <p className="text-2xl font-bold text-blue-600">{selectedNotification.opened_count || 0}</p>
                    <p className="text-sm text-gray-600">Opened</p>
                    <p className="text-xs text-gray-500">
                      {selectedNotification.delivery_count > 0 
                        ? ((selectedNotification.opened_count || 0) / selectedNotification.delivery_count * 100).toFixed(1) 
                        : 0}% rate
                    </p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4 text-center">
                    <MousePointer className="w-8 h-8 text-purple-600 mx-auto mb-2" />
                    <p className="text-2xl font-bold text-purple-600">{selectedNotification.clicked_count || 0}</p>
                    <p className="text-sm text-gray-600">Clicked</p>
                  </CardContent>
                </Card>
              </div>

              {selectedNotification.delivery_details && (
                <div>
                  <h3 className="font-semibold mb-3">Delivery Details</h3>
                  <div className="border rounded-lg max-h-60 overflow-y-auto">
                    <table className="w-full text-sm">
                      <thead className="bg-gray-50 sticky top-0">
                        <tr>
                          <th className="px-4 py-2 text-left">Recipient</th>
                          <th className="px-4 py-2 text-left">Status</th>
                          <th className="px-4 py-2 text-left">Timestamp</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y">
                        {JSON.parse(selectedNotification.delivery_details).map((detail, idx) => (
                          <tr key={idx}>
                            <td className="px-4 py-2">{detail.recipient}</td>
                            <td className="px-4 py-2">
                              <Badge className={detail.status === 'Delivered' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}>
                                {detail.status}
                              </Badge>
                            </td>
                            <td className="px-4 py-2 text-gray-600">{detail.timestamp}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}