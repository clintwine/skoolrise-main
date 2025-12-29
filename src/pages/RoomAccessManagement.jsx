import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { DoorOpen, Camera, CheckCircle, AlertCircle, User } from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';
import Scanner from '../components/Scanner';

export default function RoomAccessManagement() {
  const [scannerOpen, setScannerOpen] = useState(false);
  const [selectedRoom, setSelectedRoom] = useState('');
  const [roomName, setRoomName] = useState('');
  const [accessType, setAccessType] = useState('Entry');
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  const [scannedPerson, setScannedPerson] = useState(null);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);

  const queryClient = useQueryClient();

  const { data: accessLogs = [], isLoading } = useQuery({
    queryKey: ['room-access-logs', selectedDate],
    queryFn: async () => {
      const all = await base44.entities.RoomAccessLog.list('-timestamp');
      return all.filter(log => log.timestamp?.startsWith(selectedDate));
    },
  });

  const { data: scannerSettings = [] } = useQuery({
    queryKey: ['scanner-settings'],
    queryFn: () => base44.entities.ScannerSettings.list(),
  });

  const roomAccessEnabled = scannerSettings.find(
    s => s.feature_name === 'room_access' && s.enabled
  );

  const handleScanSuccess = async (data) => {
    setScannerOpen(false);

    if (!selectedRoom) {
      toast.error('Please select a room first');
      return;
    }

    try {
      // Fetch person details
      const response = await base44.functions.invoke('scanRoomAccess', {
        user_or_student_id: data,
        room_id: selectedRoom,
        room_name: roomName || `Room ${selectedRoom}`,
        access_type: accessType
      });

      if (response.data.success) {
        setScannedPerson(response.data.person);
        setConfirmDialogOpen(true);
      } else {
        toast.error(response.data.error || 'Failed to identify person');
      }
    } catch (error) {
      toast.error('Error processing scan: ' + error.message);
    }
  };

  const handleConfirmAccess = async () => {
    if (!scannedPerson) return;

    try {
      const response = await base44.functions.invoke('scanRoomAccess', {
        user_or_student_id: scannedPerson.id,
        room_id: selectedRoom,
        room_name: roomName || `Room ${selectedRoom}`,
        access_type: accessType,
        action: 'confirm'
      });

      if (response.data.success) {
        toast.success(response.data.message);
        queryClient.invalidateQueries({ queryKey: ['room-access-logs'] });
        setConfirmDialogOpen(false);
        setScannedPerson(null);
      } else {
        toast.error(response.data.error);
      }
    } catch (error) {
      toast.error('Error recording access: ' + error.message);
    }
  };

  const entriesCount = accessLogs.filter(log => log.access_type === 'Entry').length;
  const exitsCount = accessLogs.filter(log => log.access_type === 'Exit').length;

  if (!roomAccessEnabled) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Card className="max-w-md">
          <CardContent className="p-8 text-center">
            <AlertCircle className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">Room Access Scanner Disabled</h2>
            <p className="text-gray-600 mb-4">
              The room access scanner feature is currently disabled. Please enable it in Scanner Settings.
            </p>
            <Button onClick={() => window.location.href = '/scanner-settings'}>
              Go to Scanner Settings
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Room Access Management</h1>
        <p className="text-gray-600 mt-1">Track room entry and exit via QR scanner</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-white shadow-md">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Entries</p>
                <p className="text-2xl font-bold text-green-600">{entriesCount}</p>
              </div>
              <DoorOpen className="w-8 h-8 text-green-600" />
            </div>
          </CardContent>
        </Card>
        <Card className="bg-white shadow-md">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Exits</p>
                <p className="text-2xl font-bold text-orange-600">{exitsCount}</p>
              </div>
              <DoorOpen className="w-8 h-8 text-orange-600 rotate-180" />
            </div>
          </CardContent>
        </Card>
        <Card className="bg-white shadow-md">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Currently Inside</p>
                <p className="text-2xl font-bold text-blue-600">{entriesCount - exitsCount}</p>
              </div>
              <User className="w-8 h-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Scanner Controls */}
      <Card className="bg-white shadow-md">
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <Label>Room ID *</Label>
              <Input
                value={selectedRoom}
                onChange={(e) => setSelectedRoom(e.target.value)}
                placeholder="e.g., LAB-101"
              />
            </div>
            <div>
              <Label>Room Name</Label>
              <Input
                value={roomName}
                onChange={(e) => setRoomName(e.target.value)}
                placeholder="e.g., Computer Lab"
              />
            </div>
            <div>
              <Label>Access Type</Label>
              <Select value={accessType} onValueChange={setAccessType}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Entry">Entry</SelectItem>
                  <SelectItem value="Exit">Exit</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-end">
              <Button
                onClick={() => setScannerOpen(true)}
                disabled={!selectedRoom}
                className="w-full bg-blue-600 hover:bg-blue-700"
              >
                <Camera className="w-4 h-4 mr-2" />
                Scan Access
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Access Logs */}
      <Card className="bg-white shadow-md">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Access Logs - {format(new Date(selectedDate), 'MMMM d, yyyy')}</CardTitle>
            <Input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="w-48"
            />
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            </div>
          ) : accessLogs.length === 0 ? (
            <p className="text-center text-gray-500 py-8">No access logs for this date</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Person</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Room</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Access Type</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Time</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Scanned By</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {accessLogs.map((log) => (
                    <tr key={log.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 text-sm font-medium text-gray-900">{log.user_name}</td>
                      <td className="px-6 py-4 text-sm text-gray-600">{log.room_name || log.room_id}</td>
                      <td className="px-6 py-4">
                        <Badge className={log.access_type === 'Entry' ? 'bg-green-100 text-green-800' : 'bg-orange-100 text-orange-800'}>
                          {log.access_type}
                        </Badge>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900">
                        {format(new Date(log.timestamp), 'HH:mm:ss')}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">{log.scanned_by_name}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Scanner Dialog */}
      <Scanner
        isOpen={scannerOpen}
        onClose={() => setScannerOpen(false)}
        onScanSuccess={handleScanSuccess}
        title="Scan Access Card"
        description={`Scan person's card for ${accessType} to ${roomName || selectedRoom}`}
      />

      {/* Confirmation Dialog */}
      <Dialog open={confirmDialogOpen} onOpenChange={setConfirmDialogOpen}>
        <DialogContent className="max-w-md bg-white">
          <DialogHeader>
            <DialogTitle>Confirm Room Access</DialogTitle>
          </DialogHeader>
          {scannedPerson && (
            <div className="space-y-4">
              <div className="bg-blue-50 rounded-lg p-4 border-2 border-blue-200">
                <div className="flex items-center gap-2 mb-3">
                  <User className="w-5 h-5 text-blue-600" />
                  <span className="font-semibold text-blue-900">Person Details</span>
                </div>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Name:</span>
                    <span className="font-medium">{scannedPerson.name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Type:</span>
                    <Badge variant="outline">{scannedPerson.type}</Badge>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Room:</span>
                    <span className="font-medium">{roomName || selectedRoom}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Access:</span>
                    <Badge className={accessType === 'Entry' ? 'bg-green-100 text-green-800' : 'bg-orange-100 text-orange-800'}>
                      {accessType}
                    </Badge>
                  </div>
                </div>
              </div>
              <div className="flex gap-3">
                <Button variant="outline" onClick={() => setConfirmDialogOpen(false)} className="flex-1">
                  Cancel
                </Button>
                <Button onClick={handleConfirmAccess} className="flex-1 bg-blue-600 hover:bg-blue-700">
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Confirm
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}