import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query';
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
import { Plus, Search, UserCircle, Mail, Phone, Calendar, MapPin, GraduationCap, Link2, Upload, Eye } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import StudentForm from '../components/students/StudentForm';
import StudentDetails from '../components/students/StudentDetails';
import BulkImportDialog from '../components/admin/BulkImportDialog';

export default function StudentRecords() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [isLinkParentOpen, setIsLinkParentOpen] = useState(false);
  const [selectedParentId, setSelectedParentId] = useState('');
  const [bulkImportOpen, setBulkImportOpen] = useState(false);
  const queryClient = useQueryClient();

  const { data: students = [], isLoading } = useQuery({
    queryKey: ['students'],
    queryFn: () => base44.entities.Student.list('-created_date'),
  });

  const { data: parents = [] } = useQuery({
    queryKey: ['parents'],
    queryFn: () => base44.entities.Parent.list(),
  });

  const linkParentMutation = useMutation({
    mutationFn: async ({ studentId, parentId }) => {
      // Update student's parent_id
      await base44.entities.Student.update(studentId, { parent_id: parentId });
      
      // Also update parent's linked_student_ids to sync both sides
      const parent = parents.find(p => p.id === parentId);
      if (parent) {
        let linkedIds = [];
        try {
          linkedIds = parent.linked_student_ids ? JSON.parse(parent.linked_student_ids) : [];
        } catch (e) {
          linkedIds = [];
        }
        if (!linkedIds.includes(studentId)) {
          linkedIds.push(studentId);
          await base44.entities.Parent.update(parentId, { 
            linked_student_ids: JSON.stringify(linkedIds) 
          });
        }
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['students'] });
      queryClient.invalidateQueries({ queryKey: ['parents'] });
      setIsLinkParentOpen(false);
      setSelectedStudent(null);
      setSelectedParentId('');
      toast.success('Parent linked successfully');
    },
    onError: (error) => {
      toast.error('Failed to link parent: ' + error.message);
    },
  });

  const handleSubmit = async (data) => {
    if (selectedStudent) {
      const studentData = { ...data };
      delete studentData.id;
      delete studentData.created_date;
      delete studentData.updated_date;
      delete studentData.created_by;
      await base44.entities.Student.update(selectedStudent.id, studentData);
      queryClient.invalidateQueries({ queryKey: ['students'] });
      setIsFormOpen(false);
      setSelectedStudent(null);
      toast.success('Student updated successfully');
    } else {
      await base44.entities.Student.create(data);
      queryClient.invalidateQueries({ queryKey: ['students'] });
      setIsFormOpen(false);
      setSelectedStudent(null);
      toast.success('Student added successfully');
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
    <div className="space-y-4 sm:space-y-6 px-2 sm:px-0">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Student Records</h1>
          <p className="text-sm sm:text-base text-gray-600 mt-1">Manage student information and profiles</p>
        </div>
        <div className="flex gap-2 w-full sm:w-auto">
          <Button onClick={() => setBulkImportOpen(true)} variant="outline" className="border-blue-300 text-blue-700 hover:bg-blue-50 flex-1 sm:flex-none text-xs sm:text-sm" size="sm">
            <Upload className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
            Import
          </Button>
          <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
            <DialogTrigger asChild>
              <Button
                onClick={() => setSelectedStudent(null)}
                className="bg-blue-600 hover:bg-blue-700 flex-1 sm:flex-none text-xs sm:text-sm"
                size="sm"
              >
                <Plus className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
                Add<span className="hidden sm:inline"> Student</span>
              </Button>
            </DialogTrigger>
          <DialogContent className="w-[95vw] max-w-2xl max-h-[90vh] overflow-y-auto bg-white z-50 p-4 sm:p-6">
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
      </div>

      {/* Search */}
      <Card className="bg-white border-0 shadow-md">
        <CardContent className="p-3 sm:p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4 sm:w-5 sm:h-5" />
            <Input
              placeholder="Search students..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 sm:pl-10 text-sm"
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
        <div className="space-y-3">
          {filteredStudents.map((student) => (
            <Card key={student.id} className="bg-white rounded-xl shadow-md">
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  {student.photo_url ? (
                    <img
                      src={student.photo_url}
                      alt={student.first_name}
                      className="w-12 h-12 rounded-full object-cover flex-shrink-0"
                    />
                  ) : (
                    <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                      <UserCircle className="w-7 h-7 text-blue-600" />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2">
                      <div className="min-w-0">
                        <p className="font-semibold text-text break-words">{student.first_name} {student.last_name}</p>
                        <p className="text-sm text-text-secondary">{student.student_id_number}</p>
                        <p className="text-sm text-text-secondary">Class: {student.grade_level}</p>
                      </div>
                      <Badge className={`${statusColors[student.status] || statusColors.Active} w-fit`}>
                        {student.status}
                      </Badge>
                    </div>
                    <div className="text-sm text-text-secondary space-y-1 mt-3">
                      {student.phone && (
                        <div className="flex items-center gap-2">
                          <Phone className="w-3 h-3 flex-shrink-0" />
                          <span className="break-all">{student.phone}</span>
                        </div>
                      )}
                      {student.email && (
                        <div className="flex items-center gap-2">
                          <Mail className="w-3 h-3 flex-shrink-0" />
                          <span className="break-all">{student.email}</span>
                        </div>
                      )}
                    </div>
                    <div className="flex flex-wrap gap-2 mt-4">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-blue-600 hover:text-blue-800 hover:bg-blue-50"
                        onClick={() => {
                          setSelectedStudent(student);
                          setIsDetailsOpen(true);
                        }}
                      >
                        <Eye className="w-4 h-4 mr-1" />
                        View
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="border-blue-300 text-blue-700 hover:bg-blue-50"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedStudent(student);
                          setIsLinkParentOpen(true);
                        }}
                      >
                        <Link2 className="w-4 h-4 mr-1" />
                        Link Parent
                      </Button>
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
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Link Parent Dialog */}
      <Dialog open={isLinkParentOpen} onOpenChange={setIsLinkParentOpen}>
        <DialogContent className="w-[95vw] max-w-md bg-white p-4 sm:p-6">
          <DialogHeader>
            <DialogTitle>Link Parent to {selectedStudent?.first_name} {selectedStudent?.last_name}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Select Parent</Label>
              <Select value={selectedParentId} onValueChange={setSelectedParentId}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose a parent" />
                </SelectTrigger>
                <SelectContent>
                  {parents.map(parent => (
                    <SelectItem key={parent.id} value={parent.id}>
                      {parent.first_name} {parent.last_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {selectedStudent?.parent_id && (
              <p className="text-sm text-yellow-700 bg-yellow-50 p-2 rounded">
                This student already has a linked parent. Linking a new parent will replace the existing one.
              </p>
            )}
            <Button 
              onClick={() => linkParentMutation.mutate({ studentId: selectedStudent?.id, parentId: selectedParentId })}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white" 
              disabled={!selectedParentId || linkParentMutation.isPending}
            >
              {linkParentMutation.isPending ? 'Linking...' : 'Link Parent'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Student Details Dialog */}
      <Dialog open={isDetailsOpen} onOpenChange={setIsDetailsOpen}>
        <DialogContent className="w-[95vw] max-w-3xl max-h-[90vh] overflow-y-auto bg-white z-50 p-4 sm:p-6">
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

      <BulkImportDialog
        open={bulkImportOpen}
        onOpenChange={setBulkImportOpen}
        entityName="Student"
        entitySchema={{
          type: "object",
          properties: {
            first_name: { type: "string" },
            last_name: { type: "string" },
            student_id_number: { type: "string" },
            grade_level: { type: "string" },
            date_of_birth: { type: "string", format: "date" },
            gender: { type: "string" },
            admission_date: { type: "string", format: "date" },
            address: { type: "string" },
            phone: { type: "string" },
            parent_email: { type: "string", format: "email" },
            parent_phone: { type: "string" },
          },
          required: ["first_name", "last_name", "student_id_number", "grade_level"]
        }}
        onImportComplete={() => {
          queryClient.invalidateQueries({ queryKey: ['students'] });
        }}
      />
    </div>
  );
}