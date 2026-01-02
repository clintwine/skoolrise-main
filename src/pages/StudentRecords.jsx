import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Plus, Search, UserCircle, Mail, Phone, Calendar, MapPin, GraduationCap } from 'lucide-react';
import StudentForm from '../components/students/StudentForm';
import StudentDetails from '../components/students/StudentDetails';

export default function StudentRecords() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const queryClient = useQueryClient();

  const { data: students = [], isLoading } = useQuery({
    queryKey: ['students'],
    queryFn: () => base44.entities.Student.list('-created_date'),
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.Student.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['students'] });
      setIsFormOpen(false);
      setSelectedStudent(null);
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }) => {
      const studentData = { ...data };
      delete studentData.id;
      delete studentData.created_date;
      delete studentData.updated_date;
      delete studentData.created_by;
      return base44.entities.Student.update(id, studentData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['students'] });
      setIsFormOpen(false);
      setSelectedStudent(null);
    },
  });

  const handleSubmit = (data) => {
    if (selectedStudent) {
      updateMutation.mutate({ id: selectedStudent.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const filteredStudents = students.filter((student) => {
    const search = searchTerm.toLowerCase();
    return (
      student.first_name?.toLowerCase().includes(search) ||
      student.last_name?.toLowerCase().includes(search) ||
      student.student_id_number?.toLowerCase().includes(search) ||
      student.email?.toLowerCase().includes(search)
    );
  });

  const statusColors = {
    Active: 'bg-green-100 text-green-800',
    Inactive: 'bg-gray-100 text-gray-800',
    Suspended: 'bg-red-100 text-red-800',
    Graduated: 'bg-blue-100 text-blue-800',
    Withdrawn: 'bg-orange-100 text-orange-800',
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Student Records</h1>
          <p className="text-gray-600 mt-1">Manage student information and profiles</p>
        </div>
        <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
          <DialogTrigger asChild>
            <Button
              onClick={() => setSelectedStudent(null)}
              className="bg-blue-600 hover:bg-blue-700"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Student
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto bg-white z-50">
            <DialogHeader>
              <DialogTitle>
                {selectedStudent ? 'Edit Student' : 'Add New Student'}
              </DialogTitle>
            </DialogHeader>
            <StudentForm
              student={selectedStudent}
              onSubmit={handleSubmit}
              onCancel={() => {
                setIsFormOpen(false);
                setSelectedStudent(null);
              }}
            />
          </DialogContent>
        </Dialog>
      </div>

      {/* Search */}
      <Card className="bg-white border-0 shadow-md">
        <CardContent className="p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <Input
              placeholder="Search students by name, ID, or email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      {/* Students Grid */}
      {isLoading ? (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading students...</p>
        </div>
      ) : filteredStudents.length === 0 ? (
        <Card className="bg-white border-0 shadow-md">
          <CardContent className="p-12 text-center">
            <UserCircle className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No students found</h3>
            <p className="text-gray-600 mb-4">
              {searchTerm ? 'Try adjusting your search' : 'Get started by adding your first student'}
            </p>
            {!searchTerm && (
              <Button
                onClick={() => setIsFormOpen(true)}
                className="bg-blue-600 hover:bg-blue-700"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Student
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <Card className="bg-white rounded-xl shadow-md">
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Student</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Admission No</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Class</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Contact</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Status</th>
                    <th className="px-6 py-3 text-right text-xs font-semibold text-gray-700 uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {filteredStudents.map((student) => (
                    <tr 
                      key={student.id} 
                      className="hover:bg-gray-50 cursor-pointer"
                      onClick={() => window.location.href = `/userprofile?id=${student.user_id}&role=student`}
                    >
                      <td className="px-6 py-3">
                        <div className="flex items-center gap-3">
                          {student.photo_url ? (
                            <img
                              src={student.photo_url}
                              alt={student.first_name}
                              className="w-10 h-10 rounded-full object-cover"
                            />
                          ) : (
                            <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                              <UserCircle className="w-6 h-6 text-blue-600" />
                            </div>
                          )}
                          <div>
                            <p className="font-medium text-text">{student.first_name} {student.last_name}</p>
                            <p className="text-xs text-text-secondary">DOB: {student.date_of_birth || 'N/A'}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-3 text-sm font-medium text-text">{student.student_id_number}</td>
                      <td className="px-6 py-3 text-sm text-text">{student.grade_level}</td>
                      <td className="px-6 py-3">
                        <div className="text-sm text-text-secondary space-y-1">
                          {student.phone && (
                            <div className="flex items-center gap-1">
                              <Phone className="w-3 h-3" />
                              <span>{student.phone}</span>
                            </div>
                          )}
                          {student.email && (
                            <div className="flex items-center gap-1">
                              <Mail className="w-3 h-3" />
                              <span className="truncate max-w-[150px]">{student.email}</span>
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-3">
                        <Badge className={statusColors[student.status] || statusColors.Active}>
                          {student.status}
                        </Badge>
                      </td>
                      <td className="px-6 py-3 text-right">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedStudent(student);
                            setIsFormOpen(true);
                          }}
                        >
                          Edit
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Student Details Dialog */}
      <Dialog open={isDetailsOpen} onOpenChange={setIsDetailsOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto bg-white z-50">
          <DialogHeader>
            <DialogTitle>Student Details</DialogTitle>
          </DialogHeader>
          {selectedStudent && (
            <StudentDetails
              student={selectedStudent}
              onEdit={() => {
                setIsDetailsOpen(false);
                setIsFormOpen(true);
              }}
              onClose={() => {
                setIsDetailsOpen(false);
                setSelectedStudent(null);
              }}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}