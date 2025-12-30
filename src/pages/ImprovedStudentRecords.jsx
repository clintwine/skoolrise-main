import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Checkbox } from '@/components/ui/checkbox';
import { Plus, Search, UserCircle, Mail, Phone, Calendar, GraduationCap, Users, Award, ClipboardList, AlertCircle } from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';
import StudentForm from '../components/students/StudentForm';

export default function ImprovedStudentRecords() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [gradeFilter, setGradeFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedIds, setSelectedIds] = useState([]);
  const [bulkAction, setBulkAction] = useState('');
  const queryClient = useQueryClient();

  const { data: students = [] } = useQuery({
    queryKey: ['students'],
    queryFn: () => base44.entities.Student.list('-created_date'),
  });

  const { data: enrollments = [] } = useQuery({
    queryKey: ['enrollments'],
    queryFn: () => base44.entities.Enrollment.list(),
  });

  const { data: attendance = [] } = useQuery({
    queryKey: ['attendance'],
    queryFn: () => base44.entities.Attendance.list(),
  });

  const { data: behavior = [] } = useQuery({
    queryKey: ['behavior'],
    queryFn: () => base44.entities.Behavior.list(),
  });

  const { data: reportCards = [] } = useQuery({
    queryKey: ['report-cards'],
    queryFn: () => base44.entities.ReportCard.list(),
  });

  const { data: parents = [] } = useQuery({
    queryKey: ['parents'],
    queryFn: () => base44.entities.Parent.list(),
  });

  const bulkUpdateMutation = useMutation({
    mutationFn: async ({ action, value }) => {
      const promises = selectedIds.map(id => {
        if (action === 'status') {
          return base44.entities.Student.update(id, { status: value });
        }
        return Promise.resolve();
      });
      await Promise.all(promises);
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['students']);
      setSelectedIds([]);
      setBulkAction('');
      toast.success('Bulk update completed');
    },
  });

  const handleBulkAction = () => {
    if (bulkAction === 'update-status-active') {
      bulkUpdateMutation.mutate({ action: 'status', value: 'Active' });
    } else if (bulkAction === 'update-status-inactive') {
      bulkUpdateMutation.mutate({ action: 'status', value: 'Inactive' });
    }
  };

  const filteredStudents = students.filter((student) => {
    const search = searchTerm.toLowerCase();
    const matchesSearch =
      student.first_name?.toLowerCase().includes(search) ||
      student.last_name?.toLowerCase().includes(search) ||
      student.student_id_number?.toLowerCase().includes(search);
    
    const matchesGrade = gradeFilter === 'all' || student.grade_level === gradeFilter;
    const matchesStatus = statusFilter === 'all' || student.status === statusFilter;

    return matchesSearch && matchesGrade && matchesStatus;
  });

  const getStudentStats = (studentId) => {
    const studentEnrollments = enrollments.filter(e => e.student_id === studentId);
    const studentAttendance = attendance.filter(a => a.student_id === studentId);
    const studentBehavior = behavior.filter(b => b.student_id === studentId);
    const studentReports = reportCards.filter(r => r.student_id === studentId);

    const presentCount = studentAttendance.filter(a => a.status === 'Present').length;
    const attendanceRate = studentAttendance.length > 0 
      ? ((presentCount / studentAttendance.length) * 100).toFixed(0) 
      : 0;

    const behaviorPoints = studentBehavior.reduce((sum, b) => sum + (b.points || 0), 0);

    const avgGrade = studentReports.length > 0
      ? (studentReports.reduce((sum, r) => sum + (r.average_score || 0), 0) / studentReports.length).toFixed(1)
      : 0;

    return {
      classes: studentEnrollments.length,
      attendanceRate,
      behaviorPoints,
      avgGrade,
    };
  };

  const getParentInfo = (studentId) => {
    const student = students.find(s => s.id === studentId);
    if (!student?.parent_id) return null;
    return parents.find(p => p.id === student.parent_id);
  };

  const toggleSelectAll = () => {
    if (selectedIds.length === filteredStudents.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filteredStudents.map(s => s.id));
    }
  };

  const toggleSelect = (id) => {
    setSelectedIds(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const statusColors = {
    Active: 'bg-green-100 text-green-800',
    Inactive: 'bg-gray-100 text-gray-800',
    Suspended: 'bg-red-100 text-red-800',
    Graduated: 'bg-blue-100 text-blue-800',
    Withdrawn: 'bg-orange-100 text-orange-800',
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Student Management</h1>
          <p className="text-gray-600 mt-1">Manage student information and perform bulk actions</p>
        </div>
        <Button onClick={() => setIsFormOpen(true)} className="bg-blue-600 hover:bg-blue-700">
          <Plus className="w-4 h-4 mr-2" />
          Add Student
        </Button>
      </div>

      {/* Filters and Search */}
      <Card>
        <CardContent className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="md:col-span-2 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <Input
                placeholder="Search by name or ID..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={gradeFilter} onValueChange={setGradeFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Grade Level" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Grades</SelectItem>
                {[...Array(12)].map((_, i) => (
                  <SelectItem key={i + 1} value={String(i + 1)}>Grade {i + 1}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="Active">Active</SelectItem>
                <SelectItem value="Inactive">Inactive</SelectItem>
                <SelectItem value="Suspended">Suspended</SelectItem>
                <SelectItem value="Graduated">Graduated</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Bulk Actions */}
      {selectedIds.length > 0 && (
        <Card className="border-blue-200 bg-blue-50">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium">{selectedIds.length} student(s) selected</p>
              <div className="flex gap-2">
                <Select value={bulkAction} onValueChange={setBulkAction}>
                  <SelectTrigger className="w-48">
                    <SelectValue placeholder="Select action" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="update-status-active">Set Status: Active</SelectItem>
                    <SelectItem value="update-status-inactive">Set Status: Inactive</SelectItem>
                  </SelectContent>
                </Select>
                <Button onClick={handleBulkAction} disabled={!bulkAction}>
                  Apply
                </Button>
                <Button variant="outline" onClick={() => setSelectedIds([])}>
                  Clear
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Students Table */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="px-6 py-3 text-left">
                    <Checkbox
                      checked={selectedIds.length === filteredStudents.length && filteredStudents.length > 0}
                      onCheckedChange={toggleSelectAll}
                    />
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Student</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Grade</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Attendance</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Avg Grade</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredStudents.map((student) => {
                  const stats = getStudentStats(student.id);
                  return (
                    <tr key={student.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <Checkbox
                          checked={selectedIds.includes(student.id)}
                          onCheckedChange={() => toggleSelect(student.id)}
                        />
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          {student.photo_url ? (
                            <img src={student.photo_url} alt="" className="w-10 h-10 rounded-full object-cover" />
                          ) : (
                            <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                              <UserCircle className="w-6 h-6 text-blue-600" />
                            </div>
                          )}
                          <div>
                            <p className="font-medium text-gray-900">{student.first_name} {student.last_name}</p>
                            <p className="text-sm text-gray-600">{student.student_id_number}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900">Grade {student.grade_level}</td>
                      <td className="px-6 py-4">
                        <Badge className={statusColors[student.status]}>{student.status}</Badge>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900">{stats.attendanceRate}%</td>
                      <td className="px-6 py-4 text-sm text-gray-900">{stats.avgGrade}%</td>
                      <td className="px-6 py-4">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setSelectedStudent(student);
                            setIsDetailsOpen(true);
                          }}
                        >
                          View Details
                        </Button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Detailed Student View Dialog */}
      <Dialog open={isDetailsOpen} onOpenChange={setIsDetailsOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto bg-white">
          <DialogHeader>
            <DialogTitle>Student Profile</DialogTitle>
          </DialogHeader>
          {selectedStudent && (
            <div className="space-y-6">
              {/* Header */}
              <div className="flex items-start gap-4 p-4 bg-gray-50 rounded-lg">
                {selectedStudent.photo_url ? (
                  <img src={selectedStudent.photo_url} alt="" className="w-20 h-20 rounded-full object-cover" />
                ) : (
                  <div className="w-20 h-20 rounded-full bg-blue-100 flex items-center justify-center">
                    <UserCircle className="w-12 h-12 text-blue-600" />
                  </div>
                )}
                <div className="flex-1">
                  <h2 className="text-2xl font-bold text-gray-900">{selectedStudent.first_name} {selectedStudent.last_name}</h2>
                  <p className="text-gray-600">ID: {selectedStudent.student_id_number}</p>
                  <div className="flex gap-2 mt-2">
                    <Badge className={statusColors[selectedStudent.status]}>{selectedStudent.status}</Badge>
                    <Badge variant="outline">Grade {selectedStudent.grade_level}</Badge>
                  </div>
                </div>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-4 gap-4">
                {(() => {
                  const stats = getStudentStats(selectedStudent.id);
                  return (
                    <>
                      <Card>
                        <CardContent className="p-4 text-center">
                          <GraduationCap className="w-8 h-8 text-blue-600 mx-auto mb-2" />
                          <p className="text-2xl font-bold">{stats.classes}</p>
                          <p className="text-sm text-gray-600">Classes</p>
                        </CardContent>
                      </Card>
                      <Card>
                        <CardContent className="p-4 text-center">
                          <Calendar className="w-8 h-8 text-green-600 mx-auto mb-2" />
                          <p className="text-2xl font-bold">{stats.attendanceRate}%</p>
                          <p className="text-sm text-gray-600">Attendance</p>
                        </CardContent>
                      </Card>
                      <Card>
                        <CardContent className="p-4 text-center">
                          <Award className="w-8 h-8 text-purple-600 mx-auto mb-2" />
                          <p className="text-2xl font-bold">{stats.behaviorPoints}</p>
                          <p className="text-sm text-gray-600">Behavior Pts</p>
                        </CardContent>
                      </Card>
                      <Card>
                        <CardContent className="p-4 text-center">
                          <ClipboardList className="w-8 h-8 text-orange-600 mx-auto mb-2" />
                          <p className="text-2xl font-bold">{stats.avgGrade}%</p>
                          <p className="text-sm text-gray-600">Avg Grade</p>
                        </CardContent>
                      </Card>
                    </>
                  );
                })()}
              </div>

              {/* Parent Info */}
              {(() => {
                const parent = getParentInfo(selectedStudent.id);
                return parent ? (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Parent/Guardian</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <p className="text-sm text-gray-600">Name</p>
                          <p className="font-medium">{parent.first_name} {parent.last_name}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600">Phone</p>
                          <p className="font-medium">{parent.phone || 'N/A'}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ) : null;
              })()}

              {/* Classes */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Enrolled Classes</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {enrollments.filter(e => e.student_id === selectedStudent.id).map(enrollment => (
                      <div key={enrollment.id} className="p-3 bg-gray-50 rounded-lg">
                        <p className="font-medium">{enrollment.class_name}</p>
                        <Badge variant="outline" className="mt-1">{enrollment.status}</Badge>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Recent Behavior */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Recent Behavior</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {behavior.filter(b => b.student_id === selectedStudent.id).slice(0, 5).map(b => (
                      <div key={b.id} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                        <div>
                          <p className="font-medium">{b.type}</p>
                          <p className="text-sm text-gray-600">{b.description}</p>
                        </div>
                        <Badge className={b.type === 'Positive' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}>
                          {b.points > 0 ? '+' : ''}{b.points} pts
                        </Badge>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setIsDetailsOpen(false)}>Close</Button>
                <Button onClick={() => {
                  setIsDetailsOpen(false);
                  setIsFormOpen(true);
                }} className="bg-blue-600 hover:bg-blue-700">
                  Edit Student
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Add/Edit Form Dialog */}
      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto bg-white">
          <DialogHeader>
            <DialogTitle>{selectedStudent ? 'Edit Student' : 'Add Student'}</DialogTitle>
          </DialogHeader>
          <StudentForm
            student={selectedStudent}
            onSubmit={async (data) => {
              if (selectedStudent) {
                await base44.entities.Student.update(selectedStudent.id, data);
              } else {
                await base44.entities.Student.create(data);
              }
              queryClient.invalidateQueries(['students']);
              setIsFormOpen(false);
              setSelectedStudent(null);
            }}
            onCancel={() => {
              setIsFormOpen(false);
              setSelectedStudent(null);
            }}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}