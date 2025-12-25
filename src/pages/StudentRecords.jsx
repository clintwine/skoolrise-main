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
    mutationFn: ({ id, data }) => base44.entities.Student.update(id, data),
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
      student.student_id?.toLowerCase().includes(search) ||
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
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-6">
          {filteredStudents.map((student) => (
            <Card
              key={student.id}
              className="bg-white border-0 shadow-md hover:shadow-lg transition-all duration-200 cursor-pointer"
              onClick={() => {
                setSelectedStudent(student);
                setIsDetailsOpen(true);
              }}
            >
              <CardContent className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    {student.photo_url ? (
                      <img
                        src={student.photo_url}
                        alt={`${student.first_name} ${student.last_name}`}
                        className="w-12 h-12 rounded-full object-cover"
                      />
                    ) : (
                      <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center">
                        <UserCircle className="w-8 h-8 text-blue-600" />
                      </div>
                    )}
                    <div>
                      <h3 className="font-semibold text-gray-900">
                        {student.first_name} {student.last_name}
                      </h3>
                      <p className="text-sm text-gray-600">{student.student_id}</p>
                    </div>
                  </div>
                  <Badge className={statusColors[student.status] || statusColors.Active}>
                    {student.status}
                  </Badge>
                </div>

                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2 text-gray-600">
                    <GraduationCap className="w-4 h-4" />
                    <span>Grade {student.grade_level}</span>
                  </div>
                  {student.email && (
                    <div className="flex items-center gap-2 text-gray-600">
                      <Mail className="w-4 h-4" />
                      <span className="truncate">{student.email}</span>
                    </div>
                  )}
                  {student.phone && (
                    <div className="flex items-center gap-2 text-gray-600">
                      <Phone className="w-4 h-4" />
                      <span>{student.phone}</span>
                    </div>
                  )}
                </div>

                <div className="mt-4 pt-4 border-t border-gray-200">
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full"
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedStudent(student);
                      setIsFormOpen(true);
                    }}
                  >
                    Edit Details
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Student Details Dialog */}
      <Dialog open={isDetailsOpen} onOpenChange={setIsDetailsOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
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