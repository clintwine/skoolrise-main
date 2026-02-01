import React, { useState, useMemo } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Search, QrCode, UserCircle, X, Check, Clock } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import Scanner from '../Scanner';

export default function SchoolAttendance() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  const [scannerOpen, setScannerOpen] = useState(false);
  const [processing, setProcessing] = useState(false);
  const queryClient = useQueryClient();

  const { data: user } = useQuery({
    queryKey: ['current-user'],
    queryFn: () => base44.auth.me(),
  });

  const { data: teachers = [] } = useQuery({
    queryKey: ['teachers', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      return await base44.entities.Teacher.filter({ user_id: user.id });
    },
    enabled: !!user?.id,
  });

  const teacherProfile = teachers[0];

  const { data: students = [] } = useQuery({
    queryKey: ['students'],
    queryFn: () => base44.entities.Student.list(),
  });

  const { data: todayAttendance = [] } = useQuery({
    queryKey: ['school-attendance-today'],
    queryFn: () => base44.entities.Attendance.filter({ 
      date: format(new Date(), 'yyyy-MM-dd'),
      type: 'arrival'
    }),
  });

  const filteredStudents = useMemo(() => {
    if (!searchTerm.trim()) return [];
    const search = searchTerm.toLowerCase();
    return students.filter(s => 
      `${s.first_name} ${s.last_name}`.toLowerCase().includes(search) ||
      s.student_id_number?.toLowerCase().includes(search)
    ).slice(0, 10);
  }, [students, searchTerm]);

  const recordArrivalMutation = useMutation({
    mutationFn: async ({ student, method }) => {
      const now = new Date();
      const date = format(now, 'yyyy-MM-dd');
      const time = format(now, 'HH:mm:ss');
      const isLate = now.getHours() > 8 || (now.getHours() === 8 && now.getMinutes() > 30);

      // Check if already recorded today
      const existing = todayAttendance.find(a => a.student_id === student.id);
      if (existing) {
        throw new Error('Attendance already recorded for today');
      }

      return await base44.entities.Attendance.create({
        student_id: student.id,
        student_name: `${student.first_name} ${student.last_name}`,
        date: date,
        time: time,
        status: isLate ? 'Late' : 'Present',
        type: 'arrival',
        recorded_by_id: user?.id,
        recorded_by_name: teacherProfile ? `${teacherProfile.first_name} ${teacherProfile.last_name}` : user?.full_name || user?.email,
        record_method: method
      });
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries(['school-attendance-today']);
      toast.success(`Arrival recorded for ${variables.student.first_name} ${variables.student.last_name}`);
      setConfirmDialogOpen(false);
      setSelectedStudent(null);
      setSearchTerm('');
    },
    onError: (error) => {
      toast.error(error.message);
    }
  });

  const handleSelectStudent = (student) => {
    setSelectedStudent(student);
    setConfirmDialogOpen(true);
    setSearchTerm('');
  };

  const handleConfirmArrival = () => {
    if (!selectedStudent) return;
    recordArrivalMutation.mutate({ student: selectedStudent, method: 'manual' });
  };

  const handleScanSuccess = async (scannedData) => {
    setScannerOpen(false);
    setProcessing(true);

    try {
      // Find student by scanned ID
      const student = students.find(s => s.student_id_number === scannedData);
      
      if (!student) {
        toast.error('Student not found with ID: ' + scannedData);
        setProcessing(false);
        return;
      }

      setSelectedStudent(student);
      setConfirmDialogOpen(true);
    } catch (error) {
      toast.error('Error processing scan: ' + error.message);
    } finally {
      setProcessing(false);
    }
  };

  const handleConfirmScannedArrival = () => {
    if (!selectedStudent) return;
    recordArrivalMutation.mutate({ student: selectedStudent, method: 'scan' });
  };

  const isAlreadyRecorded = (studentId) => {
    return todayAttendance.some(a => a.student_id === studentId);
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="w-5 h-5" />
            School Arrival - {format(new Date(), 'MMMM d, yyyy')}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-4 flex-col sm:flex-row">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search by student name or ID..."
                className="pl-10"
              />
              {filteredStudents.length > 0 && (
                <div className="absolute z-10 w-full mt-1 bg-white border rounded-lg shadow-lg max-h-64 overflow-y-auto">
                  {filteredStudents.map(student => {
                    const recorded = isAlreadyRecorded(student.id);
                    return (
                      <button
                        key={student.id}
                        onClick={() => !recorded && handleSelectStudent(student)}
                        disabled={recorded}
                        className={`w-full text-left px-4 py-3 flex items-center gap-3 hover:bg-gray-50 border-b last:border-b-0 ${recorded ? 'opacity-50 cursor-not-allowed' : ''}`}
                      >
                        {student.photo_url ? (
                          <img src={student.photo_url} alt="" className="w-10 h-10 rounded-full object-cover" />
                        ) : (
                          <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center">
                            <UserCircle className="w-6 h-6 text-gray-400" />
                          </div>
                        )}
                        <div className="flex-1">
                          <p className="font-medium">{student.first_name} {student.last_name}</p>
                          <p className="text-sm text-gray-500">ID: #{student.student_id_number}</p>
                        </div>
                        {recorded && (
                          <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">Recorded</span>
                        )}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
            <Button 
              onClick={() => setScannerOpen(true)} 
              className="bg-blue-600 hover:bg-blue-700 gap-2"
              disabled={processing}
            >
              <QrCode className="w-4 h-4" />
              Scan ID Card
            </Button>
          </div>

          <div className="text-sm text-gray-500">
            Total arrivals today: <span className="font-semibold text-gray-900">{todayAttendance.length}</span>
          </div>
        </CardContent>
      </Card>

      {/* Recent Arrivals */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Arrivals Today</CardTitle>
        </CardHeader>
        <CardContent>
          {todayAttendance.length === 0 ? (
            <p className="text-gray-500 text-center py-8">No arrivals recorded today</p>
          ) : (
            <div className="space-y-2">
              {todayAttendance.slice(0, 10).map((record) => (
                <div key={record.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center">
                      <Check className="w-4 h-4 text-green-600" />
                    </div>
                    <div>
                      <p className="font-medium">{record.student_name}</p>
                      <p className="text-xs text-gray-500">
                        {record.time} • {record.record_method === 'scan' ? 'Scanned' : 'Manual'} • by {record.recorded_by_name}
                      </p>
                    </div>
                  </div>
                  <span className={`text-xs px-2 py-1 rounded ${record.status === 'Late' ? 'bg-yellow-100 text-yellow-800' : 'bg-green-100 text-green-800'}`}>
                    {record.status}
                  </span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Scanner Dialog */}
      <Scanner
        isOpen={scannerOpen}
        onClose={() => setScannerOpen(false)}
        onScanSuccess={handleScanSuccess}
        title="Scan Student ID Card"
        description="Position the student's ID card barcode within the frame"
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
            
            {selectedStudent && (
              <>
                <div className="mb-4">
                  {selectedStudent.photo_url ? (
                    <img 
                      src={selectedStudent.photo_url} 
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
                  {selectedStudent.first_name} {selectedStudent.last_name}
                </h3>
                <p className="text-gray-500 mb-6">
                  ID: #{selectedStudent.student_id_number}
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
                    onClick={handleConfirmScannedArrival}
                    disabled={recordArrivalMutation.isPending}
                    className="flex-1 h-12 bg-green-600 hover:bg-green-700"
                  >
                    <Check className="w-5 h-5 mr-2" />
                    {recordArrivalMutation.isPending ? 'Recording...' : 'Yes'}
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