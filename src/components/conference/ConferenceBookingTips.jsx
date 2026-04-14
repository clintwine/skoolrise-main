import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CalendarClock, Bell, CheckCircle2 } from 'lucide-react';

export default function ConferenceBookingTips() {
  return (
    <Card className="border-0 shadow-sm bg-gradient-to-r from-blue-50 to-indigo-50">
      <CardContent className="p-5">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <CalendarClock className="w-5 h-5 text-blue-700" />
              <h3 className="font-semibold text-gray-900">Booking workflow upgrades</h3>
            </div>
            <p className="text-sm text-gray-600">Availability, parent booking, and confirmation tracking are now organized for faster scheduling.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Badge className="bg-white text-blue-700 border border-blue-200"><CheckCircle2 className="w-3 h-3 mr-1" />Structured slots</Badge>
            <Badge className="bg-white text-blue-700 border border-blue-200"><Bell className="w-3 h-3 mr-1" />Reminder-ready</Badge>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}