import React from 'react';
import { format } from 'date-fns';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { CheckCircle, Clock, XCircle } from 'lucide-react';

const statusColors = {
  Draft: 'bg-gray-100 text-gray-800',
  Scheduled: 'bg-blue-100 text-blue-800',
  Sending: 'bg-yellow-100 text-yellow-800',
  Sent: 'bg-green-100 text-green-800',
  Failed: 'bg-red-100 text-red-800',
};

export default function MessageHistoryItem({ notification, onToggleDetails, showDetails }) {
  const deliveryDetails = notification.delivery_details ? JSON.parse(notification.delivery_details) : [];

  return (
    <div className="p-4 border rounded-lg hover:bg-gray-50">
      <div className="flex items-start justify-between mb-2 gap-3">
        <div className="flex-1">
          <h4 className="font-semibold text-gray-900">{notification.subject}</h4>
          <p className="text-sm text-gray-600">To: {notification.recipient_type}</p>
          <div className="flex flex-wrap gap-2 mt-2">
            {notification.template_type && <Badge variant="outline">{notification.template_type}</Badge>}
            {notification.priority && (
              <Badge className={notification.priority === 'Critical' ? 'bg-red-100 text-red-700' : notification.priority === 'High' ? 'bg-orange-100 text-orange-700' : 'bg-gray-100 text-gray-700'}>
                {notification.priority}
              </Badge>
            )}
          </div>
        </div>
        <Badge className={statusColors[notification.status] || statusColors.Draft}>{notification.status}</Badge>
      </div>

      <p className="text-sm text-gray-600 mb-3 line-clamp-2">{notification.message}</p>

      <div className="flex items-center justify-between text-xs text-gray-500 gap-3">
        <span className="flex items-center gap-1 flex-wrap">
          {notification.channel}
          {notification.sent_date && (
            <span className="ml-2">{format(new Date(notification.sent_date), 'MMM d, HH:mm')}</span>
          )}
          {!notification.sent_date && notification.scheduled_date && (
            <span className="ml-2">{format(new Date(notification.scheduled_date), 'MMM d, HH:mm')}</span>
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
          {!!deliveryDetails.length && (
            <Button variant="ghost" size="sm" className="h-7 px-2 text-xs" onClick={() => onToggleDetails(notification.id)}>
              {showDetails ? 'Hide details' : 'View details'}
            </Button>
          )}
        </span>
      </div>

      {showDetails && deliveryDetails.length > 0 && (
        <div className="mt-3 space-y-2 rounded-lg border bg-white p-3">
          {deliveryDetails.slice(0, 8).map((item, index) => (
            <div key={`${item.destination}-${index}`} className="flex items-center justify-between gap-3 text-xs">
              <div>
                <p className="font-medium text-gray-800">{item.name || item.destination}</p>
                <p className="text-gray-500">{item.destination}</p>
              </div>
              <span className={`inline-flex items-center gap-1 rounded-full px-2 py-1 ${item.status === 'failed' ? 'bg-red-50 text-red-700' : item.status === 'queued' ? 'bg-yellow-50 text-yellow-700' : 'bg-green-50 text-green-700'}`}>
                {item.status === 'failed' ? <XCircle className="w-3 h-3" /> : item.status === 'queued' ? <Clock className="w-3 h-3" /> : <CheckCircle className="w-3 h-3" />}
                {item.status}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}