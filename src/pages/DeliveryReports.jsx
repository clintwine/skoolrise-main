import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { 
  BarChart3, CheckCircle, XCircle, Clock, Mail, 
  MessageSquare, Search, Eye, Download
} from 'lucide-react';
import { format } from 'date-fns';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

export default function DeliveryReports() {
  const [filterChannel, setFilterChannel] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedNotification, setSelectedNotification] = useState(null);
  const [detailsOpen, setDetailsOpen] = useState(false);

  const { data: notifications = [], isLoading } = useQuery({
    queryKey: ['notifications-reports'],
    queryFn: () => base44.entities.Notification.list('-created_date', 100),
  });

  const filteredNotifications = notifications.filter(n => {
    const channelMatch = filterChannel === 'all' || n.channel === filterChannel;
    const statusMatch = filterStatus === 'all' || n.status === filterStatus;
    const searchMatch = !searchTerm || 
      n.subject?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      n.recipient_type?.toLowerCase().includes(searchTerm.toLowerCase());
    return channelMatch && statusMatch && searchMatch;
  });

  // Calculate statistics
  const totalSent = notifications.filter(n => n.status === 'Sent').length;
  const totalDelivered = notifications.reduce((sum, n) => sum + (n.delivery_count || 0), 0);
  const totalFailed = notifications.reduce((sum, n) => sum + (n.failure_count || 0), 0);
  const totalScheduled = notifications.filter(n => n.status === 'Scheduled').length;

  const deliveryRate = totalDelivered + totalFailed > 0 
    ? ((totalDelivered / (totalDelivered + totalFailed)) * 100).toFixed(1) 
    : 0;

  // Channel breakdown
  const channelData = [
    { name: 'Email', count: notifications.filter(n => n.channel === 'Email').length },
    { name: 'SMS', count: notifications.filter(n => n.channel === 'SMS').length },
    { name: 'WhatsApp', count: notifications.filter(n => n.channel === 'WhatsApp').length },
    { name: 'In-App', count: notifications.filter(n => n.channel === 'In-App').length },
  ].filter(c => c.count > 0);

  const statusData = [
    { name: 'Sent', value: totalSent, color: '#22c55e' },
    { name: 'Scheduled', value: totalScheduled, color: '#3b82f6' },
    { name: 'Failed', value: notifications.filter(n => n.status === 'Failed').length, color: '#ef4444' },
  ].filter(s => s.value > 0);

  const statusColors = {
    Draft: 'bg-gray-100 text-gray-800',
    Scheduled: 'bg-blue-100 text-blue-800',
    Sending: 'bg-yellow-100 text-yellow-800',
    Sent: 'bg-green-100 text-green-800',
    Failed: 'bg-red-100 text-red-800',
  };

  const viewDetails = (notification) => {
    setSelectedNotification(notification);
    setDetailsOpen(true);
  };

  const getDeliveryDetails = (notification) => {
    if (!notification.delivery_details) return [];
    try {
      return JSON.parse(notification.delivery_details);
    } catch {
      return [];
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Delivery Reports</h1>
        <p className="text-gray-600 mt-1">Track message delivery status and analytics</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-white shadow-md">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Sent</p>
                <p className="text-3xl font-bold text-green-600">{totalSent}</p>
              </div>
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
          </CardContent>
        </Card>
        <Card className="bg-white shadow-md">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Delivered</p>
                <p className="text-3xl font-bold text-blue-600">{totalDelivered}</p>
              </div>
              <Mail className="w-8 h-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>
        <Card className="bg-white shadow-md">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Failed</p>
                <p className="text-3xl font-bold text-red-600">{totalFailed}</p>
              </div>
              <XCircle className="w-8 h-8 text-red-600" />
            </div>
          </CardContent>
        </Card>
        <Card className="bg-white shadow-md">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Delivery Rate</p>
                <p className="text-3xl font-bold text-purple-600">{deliveryRate}%</p>
              </div>
              <BarChart3 className="w-8 h-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="bg-white shadow-md">
          <CardHeader>
            <CardTitle>Messages by Channel</CardTitle>
          </CardHeader>
          <CardContent>
            {channelData.length > 0 ? (
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={channelData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="count" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-48 flex items-center justify-center text-gray-500">
                No data available
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="bg-white shadow-md">
          <CardHeader>
            <CardTitle>Status Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            {statusData.length > 0 ? (
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie
                    data={statusData}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                    label={({ name, value }) => `${name}: ${value}`}
                  >
                    {statusData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-48 flex items-center justify-center text-gray-500">
                No data available
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card className="bg-white shadow-md">
        <CardContent className="p-4">
          <div className="flex flex-wrap gap-4">
            <div className="flex-1 min-w-[200px]">
              <div className="relative">
                <Search className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                <Input
                  placeholder="Search messages..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={filterChannel} onValueChange={setFilterChannel}>
              <SelectTrigger className="w-36">
                <SelectValue placeholder="Channel" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Channels</SelectItem>
                <SelectItem value="Email">Email</SelectItem>
                <SelectItem value="SMS">SMS</SelectItem>
                <SelectItem value="WhatsApp">WhatsApp</SelectItem>
                <SelectItem value="In-App">In-App</SelectItem>
              </SelectContent>
            </Select>
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-36">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="Sent">Sent</SelectItem>
                <SelectItem value="Scheduled">Scheduled</SelectItem>
                <SelectItem value="Failed">Failed</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Message List */}
      <Card className="bg-white shadow-md">
        <CardHeader>
          <CardTitle>Message History</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            </div>
          ) : filteredNotifications.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              No messages found
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b bg-gray-50">
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Subject</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Recipients</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Channel</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Delivered</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Failed</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {filteredNotifications.map((notification) => (
                    <tr key={notification.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-sm font-medium text-gray-900">
                        {notification.subject}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600">
                        {notification.recipient_type}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600">
                        {notification.channel}
                      </td>
                      <td className="px-4 py-3 text-sm text-green-600 font-medium">
                        {notification.delivery_count || 0}
                      </td>
                      <td className="px-4 py-3 text-sm text-red-600 font-medium">
                        {notification.failure_count || 0}
                      </td>
                      <td className="px-4 py-3">
                        <Badge className={statusColors[notification.status]}>
                          {notification.status}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-500">
                        {notification.sent_date 
                          ? format(new Date(notification.sent_date), 'MMM d, yyyy HH:mm')
                          : notification.scheduled_date
                            ? format(new Date(notification.scheduled_date), 'MMM d, yyyy HH:mm')
                            : '-'
                        }
                      </td>
                      <td className="px-4 py-3">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => viewDetails(notification)}
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Details Dialog */}
      <Dialog open={detailsOpen} onOpenChange={setDetailsOpen}>
        <DialogContent className="bg-white max-w-2xl">
          <DialogHeader>
            <DialogTitle>Message Details</DialogTitle>
          </DialogHeader>
          {selectedNotification && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-gray-500">Subject</p>
                  <p className="font-medium">{selectedNotification.subject}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Status</p>
                  <Badge className={statusColors[selectedNotification.status]}>
                    {selectedNotification.status}
                  </Badge>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Channel</p>
                  <p className="font-medium">{selectedNotification.channel}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Recipients</p>
                  <p className="font-medium">{selectedNotification.recipient_type}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Delivered</p>
                  <p className="font-medium text-green-600">{selectedNotification.delivery_count || 0}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Failed</p>
                  <p className="font-medium text-red-600">{selectedNotification.failure_count || 0}</p>
                </div>
              </div>

              <div>
                <p className="text-xs text-gray-500 mb-1">Message</p>
                <p className="text-sm text-gray-700 p-3 bg-gray-50 rounded-lg">
                  {selectedNotification.message}
                </p>
              </div>

              {getDeliveryDetails(selectedNotification).length > 0 && (
                <div>
                  <p className="text-xs text-gray-500 mb-2">Delivery Details</p>
                  <div className="max-h-48 overflow-y-auto space-y-1">
                    {getDeliveryDetails(selectedNotification).map((detail, idx) => (
                      <div key={idx} className="flex items-center justify-between p-2 bg-gray-50 rounded text-sm">
                        <span className="text-gray-700">{detail.email}</span>
                        <Badge className={detail.status === 'sent' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}>
                          {detail.status}
                        </Badge>
                      </div>
                    ))}
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