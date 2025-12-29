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
      <div className="flex items-center justify-center min-h-[60vh] p-4">
        <Card className="max-w-md">
          <CardContent className="p-6 sm:p-8 text-center">
            <AlertCircle className="w-12 h-12 sm:w-16 sm:h-16 text-gray-400 mx-auto mb-3 sm:mb-4" />
            <h2 className="text-lg sm:text-xl font-semibold mb-2">Room Access Scanner Disabled</h2>
            <p className="text-sm sm:text-base text-gray-600 mb-4">
              The room access scanner feature is currently disabled. Please enable it in Scanner Settings.
            </p>
            <Button onClick={() => window.location.href = '/scanner-settings'} className="text-sm sm:text-base">
              Go to Scanner Settings
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6 p-4 sm:p-0">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Room Access Management</h1>
        <p className="text-sm sm:text-base text-gray-600 mt-1">Track room entry and exit via QR scanner</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
        <Card className="bg-white shadow-md">
          <CardContent className="p-4 sm:p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs sm:text-sm text-gray-600">Total Entries</p>
                <p className="text-xl sm:text-2xl font-bold text-green-600">{entriesCount}</p>
              </div>
              <DoorOpen className="w-6 h-6 sm:w-8 sm:h-8 text-green-600" />
            </div>
          </CardContent>
        </Card>
        <Card className="bg-white shadow-md">
          <CardContent className="p-4 sm:p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs sm:text-sm text-gray-600">Total Exits</p>
                <p className="text-xl sm:text-2xl font-bold text-orange-600">{exitsCount}</p>
              </div>
              <DoorOpen className="w-6 h-6 sm:w-8 sm:h-8 text-orange-600 rotate-180" />
            </div>
          </CardContent>
        </Card>
        <Card className="bg-white shadow-md">
          <CardContent className="p-4 sm:p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs sm:text-sm text-gray-600">Currently Inside</p>
                <p className="text-xl sm:text-2xl font-bold text-blue-600">{entriesCount - exitsCount}</p>
              </div>
              <User className="w-6 h-6 sm:w-8 sm:h-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Scanner Controls */}
      <Card className="bg-white shadow-md">
        <CardContent className="p-4 sm:p-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
            <div>
              <Label className="text-sm">Room ID *</Label>
              <Input
                value={selectedRoom}
                onChange={(e) => setSelectedRoom(e.target.value)}
                placeholder="e.g., LAB-101"
                className="py-2 text-sm"
              />
            </div>
            <div>
              <Label className="text-sm">Room Name</Label>
              <Input
                value={roomName}
                onChange={(e) => setRoomName(e.target.value)}
                placeholder="e.g., Computer Lab"
                className="py-2 text-sm"
              />
            </div>
            <div>
              <Label className="text-sm">Access Type</Label>
              <Select value={accessType} onValueChange={setAccessType}>
                <SelectTrigger className="py-2 text-sm">
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
                className="w-full bg-blue-600 hover:bg-blue-700 text-sm py-2"
              >
                <Camera className="w-3 h-3 sm:w-4 sm:h-4 mr-2" />
                Scan Access
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Access Logs */}
      <Card className="bg-white shadow-md">
        <CardHeader className="p-4 sm:p-6">
          <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:justify-between">
            <CardTitle className="text-base sm:text-lg">Access Logs - {format(new Date(selectedDate), 'MMMM d, yyyy')}</CardTitle>
            <Input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="w-full sm:w-48 text-sm"
            />
          </div>
        </CardHeader>
        <CardContent className="p-0 sm:p-6 sm:pt-0">
          {isLoading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            </div>
          ) : accessLogs.length === 0 ? (
            <p className="text-center text-gray-500 py-8">No access logs for this date</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="px-3 sm:px-6 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase">Person</th>
                    <th className="px-3 sm:px-6 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase hidden sm:table-cell">Room</th>
                    <th className="px-3 sm:px-6 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase">Access Type</th>
                    <th className="px-3 sm:px-6 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase">Time</th>
                    <th className="px-3 sm:px-6 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase hidden lg:table-cell">Scanned By</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {accessLogs.map((log) => (
                    <tr key={log.id} className="hover:bg-gray-50">
                      <td className="px-3 sm:px-6 py-3 sm:py-4 text-xs sm:text-sm font-medium text-gray-900">{log.user_name}</td>
                      <td className="px-3 sm:px-6 py-3 sm:py-4 text-xs sm:text-sm text-gray-600 hidden sm:table-cell">{log.room_name || log.room_id}</td>
                      <td className="px-3 sm:px-6 py-3 sm:py-4">
                        <Badge className={`${log.access_type === 'Entry' ? 'bg-green-100 text-green-800' : 'bg-orange-100 text-orange-800'} text-xs`}>
                          {log.access_type}
                        </Badge>
                      </td>
                      <td className="px-3 sm:px-6 py-3 sm:py-4 text-xs sm:text-sm text-gray-900">
                        {format(new Date(log.timestamp), 'HH:mm:ss')}
                      </td>
                      <td className="px-3 sm:px-6 py-3 sm:py-4 text-xs sm:text-sm text-gray-600 hidden lg:table-cell">{log.scanned_by_name}</td>
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
        <DialogContent className="max-w-xs sm:max-w-md bg-white p-4">
          <DialogHeader>
            <DialogTitle className="text-base sm:text-lg">Confirm Room Access</DialogTitle>
          </DialogHeader>
          {scannedPerson && (
            <div className="space-y-4">
              <div className="bg-blue-50 rounded-lg p-3 sm:p-4 border-2 border-blue-200">
                <div className="flex items-center gap-2 mb-3">
                  <User className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600" />
                  <span className="font-semibold text-sm sm:text-base text-blue-900">Person Details</span>
                </div>
                <div className="space-y-2 text-xs sm:text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Name:</span>
                    <span className="font-medium">{scannedPerson.name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Type:</span>
                    <Badge variant="outline" className="text-xs">{scannedPerson.type}</Badge>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Room:</span>
                    <span className="font-medium">{roomName || selectedRoom}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Access:</span>
                    <Badge className={`${accessType === 'Entry' ? 'bg-green-100 text-green-800' : 'bg-orange-100 text-orange-800'} text-xs`}>
                      {accessType}
                    </Badge>
                  </div>
                </div>
              </div>
              <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
                <Button variant="outline" onClick={() => setConfirmDialogOpen(false)} className="flex-1 text-sm">
                  Cancel
                </Button>
                <Button onClick={handleConfirmAccess} className="flex-1 bg-blue-600 hover:bg-blue-700 text-sm">
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