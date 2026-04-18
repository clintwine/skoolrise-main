import React, { useState, useEffect, useMemo } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useSchoolContext } from '@/hooks/useSchoolContext';
import { addSchoolFilter, withSchoolId } from '@/utils/schoolFilter';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { QrCode, UserCircle, X, Check, Clock, LogIn, LogOut, MapPin, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import Scanner from '../components/Scanner';

export default function StaffClocking() {
  const [activeTab, setActiveTab] = useState('clock_in');
  const [selectedStaff, setSelectedStaff] = useState(null);
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  const [scannerOpen, setScannerOpen] = useState(false);
  const [gpsLocation, setGpsLocation] = useState(null);
  const [gpsError, setGpsError] = useState(null);
  const [gettingLocation, setGettingLocation] = useState(false);
  const queryClient = useQueryClient();
  const { school_tenant_id, isReady, user } = useSchoolContext();

  const { data: teachers = [] } = useQuery({
    queryKey: ['all-teachers', school_tenant_id],
    queryFn: () => base44.entities.Teacher.filter(addSchoolFilter({}, school_tenant_id)),
    enabled: isReady,
  });

  const { data: todayRecords = [] } = useQuery({
    queryKey: ['staff-clock-records-today', school_tenant_id],
    queryFn: () => base44.entities.StaffClockRecord.filter(addSchoolFilter({ 
      date: format(new Date(), 'yyyy-MM-dd')
    }, school_tenant_id)),
    enabled: isReady,
  });

  // Get GPS location
  const getGPSLocation = () => {
    setGettingLocation(true);
    setGpsError(null);

    if (!navigator.geolocation) {
      setGpsError('Geolocation is not supported by your browser');
      setGettingLocation(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setGpsLocation({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy
        });
        setGettingLocation(false);
      },
      (error) => {
        setGpsError('Unable to get location: ' + error.message);
        setGettingLocation(false);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  };

  // Get location when scanner opens
  useEffect(() => {
    if (scannerOpen) {
      getGPSLocation();
    }
  }, [scannerOpen]);

  const clockedInToday = useMemo(() => {
    return todayRecords.filter(r => r.type === 'clock_in').map(r => r.staff_id);
  }, [todayRecords]);

  const clockedOutToday = useMemo(() => {
    return todayRecords.filter(r => r.type === 'clock_out').map(r => r.staff_id);
  }, [todayRecords]);

  const recordClockMutation = useMutation({
    mutationFn: async ({ staff, type }) => {
      const now = new Date();
      const date = format(now, 'yyyy-MM-dd');
      const time = format(now, 'HH:mm:ss');

      return await base44.entities.StaffClockRecord.create(withSchoolId({
        staff_id: staff.id,
        staff_name: `${staff.first_name} ${staff.last_name}`,
        staff_id_number: staff.staff_id,
        type: type,
        date: date,
        time: time,
        gps_latitude: gpsLocation?.latitude || null,
        gps_longitude: gpsLocation?.longitude || null,
        gps_accuracy: gpsLocation?.accuracy || null,
        location_valid: gpsLocation ? true : false,
        recorded_by_id: user?.id,
        recorded_by_name: user?.full_name || user?.email,
        photo_url: staff.photo_url
      }, school_tenant_id));
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries(['staff-clock-records-today']);
      const actionText = variables.type === 'clock_in' ? 'clocked in' : 'clocked out';
      toast.success(`${variables.staff.first_name} ${variables.staff.last_name} ${actionText} successfully`);
      setConfirmDialogOpen(false);
      setSelectedStaff(null);
    },
    onError: (error) => {
      toast.error(error.message);
    }
  });

  const handleScanSuccess = async (scannedData) => {
    setScannerOpen(false);

    // Find staff by scanned ID
    const staff = teachers.find(t => t.staff_id === scannedData);
    
    if (!staff) {
      toast.error('Staff not found with ID: ' + scannedData);
      return;
    }

    // Check if already clocked in/out today
    if (activeTab === 'clock_in' && clockedInToday.includes(staff.id)) {
      toast.error('This staff member has already clocked in today');
      return;
    }

    if (activeTab === 'clock_out') {
      if (!clockedInToday.includes(staff.id)) {
        toast.error('This staff member has not clocked in today');
        return;
      }
      if (clockedOutToday.includes(staff.id)) {
        toast.error('This staff member has already clocked out today');
        return;
      }
    }

    setSelectedStaff(staff);
    setConfirmDialogOpen(true);
  };

  const handleConfirmClock = () => {
    if (!selectedStaff) return;
    recordClockMutation.mutate({ staff: selectedStaff, type: activeTab });
  };

  const todayClockIns = todayRecords.filter(r => r.type === 'clock_in');
  const todayClockOuts = todayRecords.filter(r => r.type === 'clock_out');

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Staff Clock In/Out</h1>
        <p className="text-gray-600 mt-1">Scan staff ID cards to record attendance</p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2 lg:w-auto lg:inline-flex">
          <TabsTrigger value="clock_in" className="flex items-center gap-2">
            <LogIn className="w-4 h-4" />
            Clock In
          </TabsTrigger>
          <TabsTrigger value="clock_out" className="flex items-center gap-2">
            <LogOut className="w-4 h-4" />
            Clock Out
          </TabsTrigger>
        </TabsList>

        <TabsContent value="clock_in" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <LogIn className="w-5 h-5 text-green-600" />
                Staff Clock In - {format(new Date(), 'MMMM d, yyyy')}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex items-start gap-3">
                <MapPin className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm text-blue-800 font-medium">GPS Location Tracking</p>
                  <p className="text-sm text-blue-700">GPS coordinates will be recorded with each clock-in to verify location.</p>
                </div>
              </div>

              <Button 
                onClick={() => setScannerOpen(true)} 
                className="w-full h-16 text-lg bg-green-600 hover:bg-green-700 gap-3"
              >
                <QrCode className="w-6 h-6" />
                Scan Staff ID to Clock In
              </Button>

              <div className="text-sm text-gray-500 text-center">
                Total clock-ins today: <span className="font-semibold text-gray-900">{todayClockIns.length}</span>
              </div>
            </CardContent>
          </Card>

          {/* Today's Clock-Ins */}
          <Card className="mt-6">
            <CardHeader>
              <CardTitle>Today's Clock-Ins</CardTitle>
            </CardHeader>
            <CardContent>
              {todayClockIns.length === 0 ? (
                <p className="text-gray-500 text-center py-8">No clock-ins recorded today</p>
              ) : (
                <div className="space-y-2">
                  {todayClockIns.map((record) => (
                    <div key={record.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center gap-3">
                        {record.photo_url ? (
                          <img src={record.photo_url} alt="" className="w-10 h-10 rounded-full object-cover" />
                        ) : (
                          <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
                            <LogIn className="w-5 h-5 text-green-600" />
                          </div>
                        )}
                        <div>
                          <p className="font-medium">{record.staff_name}</p>
                          <p className="text-xs text-gray-500">
                            {record.time} • ID: {record.staff_id_number}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {record.gps_latitude && (
                          <Badge variant="outline" className="text-xs gap-1">
                            <MapPin className="w-3 h-3" />
                            GPS
                          </Badge>
                        )}
                        <Badge className="bg-green-100 text-green-800">Clocked In</Badge>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="clock_out" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <LogOut className="w-5 h-5 text-orange-600" />
                Staff Clock Out - {format(new Date(), 'MMMM d, yyyy')}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-orange-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm text-orange-800 font-medium">Clock Out</p>
                  <p className="text-sm text-orange-700">Only staff who have clocked in today can clock out.</p>
                </div>
              </div>

              <Button 
                onClick={() => setScannerOpen(true)} 
                className="w-full h-16 text-lg bg-orange-600 hover:bg-orange-700 gap-3"
              >
                <QrCode className="w-6 h-6" />
                Scan Staff ID to Clock Out
              </Button>

              <div className="text-sm text-gray-500 text-center">
                Total clock-outs today: <span className="font-semibold text-gray-900">{todayClockOuts.length}</span>
              </div>
            </CardContent>
          </Card>

          {/* Today's Clock-Outs */}
          <Card className="mt-6">
            <CardHeader>
              <CardTitle>Today's Clock-Outs</CardTitle>
            </CardHeader>
            <CardContent>
              {todayClockOuts.length === 0 ? (
                <p className="text-gray-500 text-center py-8">No clock-outs recorded today</p>
              ) : (
                <div className="space-y-2">
                  {todayClockOuts.map((record) => (
                    <div key={record.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center gap-3">
                        {record.photo_url ? (
                          <img src={record.photo_url} alt="" className="w-10 h-10 rounded-full object-cover" />
                        ) : (
                          <div className="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center">
                            <LogOut className="w-5 h-5 text-orange-600" />
                          </div>
                        )}
                        <div>
                          <p className="font-medium">{record.staff_name}</p>
                          <p className="text-xs text-gray-500">
                            {record.time} • ID: {record.staff_id_number}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {record.gps_latitude && (
                          <Badge variant="outline" className="text-xs gap-1">
                            <MapPin className="w-3 h-3" />
                            GPS
                          </Badge>
                        )}
                        <Badge className="bg-orange-100 text-orange-800">Clocked Out</Badge>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Scanner Dialog */}
      <Scanner
        isOpen={scannerOpen}
        onClose={() => setScannerOpen(false)}
        onScanSuccess={handleScanSuccess}
        title={activeTab === 'clock_in' ? 'Scan Staff ID to Clock In' : 'Scan Staff ID to Clock Out'}
        description="Position the staff ID card barcode within the frame"
      />

      {/* Confirmation Dialog */}
      <Dialog open={confirmDialogOpen} onOpenChange={setConfirmDialogOpen}>
        <DialogContent className="max-w-sm bg-white p-0 overflow-hidden">
          <div className="p-6 text-center">
            <button 
              onClick={() => setConfirmDialogOpen(false)}
              className="absolute top-3 right-3 text-gray-400 hover:text-gray-600"
            >
              <X className="w-5 h-5" />
            </button>
            
            {selectedStaff && (
              <>
                <div className="mb-4">
                  {selectedStaff.photo_url ? (
                    <img 
                      src={selectedStaff.photo_url} 
                      alt="" 
                      className="w-24 h-24 rounded-full object-cover mx-auto border-4 border-gray-100"
                    />
                  ) : (
                    <div className="w-24 h-24 rounded-full bg-gray-200 flex items-center justify-center mx-auto border-4 border-gray-100">
                      <UserCircle className="w-12 h-12 text-gray-400" />
                    </div>
                  )}
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-1">
                  {selectedStaff.first_name} {selectedStaff.last_name}
                </h3>
                <p className="text-gray-500 mb-2">
                  ID: #{selectedStaff.staff_id}
                </p>
                
                {gpsLocation && (
                  <div className="flex items-center justify-center gap-1 text-sm text-green-600 mb-2">
                    <MapPin className="w-4 h-4" />
                    Location captured
                  </div>
                )}
                {gpsError && (
                  <div className="flex items-center justify-center gap-1 text-sm text-amber-600 mb-2">
                    <AlertCircle className="w-4 h-4" />
                    {gpsError}
                  </div>
                )}
                
                <p className={`text-sm mb-6 ${activeTab === 'clock_in' ? 'text-green-600' : 'text-orange-600'}`}>
                  {activeTab === 'clock_in' ? 'Clocking in' : 'Clocking out'} at {format(new Date(), 'h:mm a')}
                </p>
                
                <div className="flex gap-3">
                  <Button
                    onClick={() => setConfirmDialogOpen(false)}
                    variant="outline"
                    className="flex-1 h-12 text-red-600 border-red-200 hover:bg-red-50"
                  >
                    <X className="w-5 h-5 mr-2" />
                    No
                  </Button>
                  <Button
                    onClick={handleConfirmClock}
                    disabled={recordClockMutation.isPending}
                    className={`flex-1 h-12 ${activeTab === 'clock_in' ? 'bg-green-600 hover:bg-green-700' : 'bg-orange-600 hover:bg-orange-700'}`}
                  >
                    <Check className="w-5 h-5 mr-2" />
                    {recordClockMutation.isPending ? 'Recording...' : 'Yes'}
                  </Button>
                </div>
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}