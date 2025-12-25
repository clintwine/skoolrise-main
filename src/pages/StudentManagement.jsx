import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Plus, Edit, Search, Upload, UserRound, Trash2 } from 'lucide-react';
import BulkImportDialog from '../components/admin/BulkImportDialog';
import StudentFormDialog from '../components/students/StudentFormDialog';

export default function StudentManagement() {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingStudent, setEditingStudent] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [isImportOpen, setIsImportOpen] = useState(false);
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
      setEditingStudent(null);
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Student.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['students'] });
      setIsFormOpen(false);
      setEditingStudent(null);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.Student.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['students'] });
    },
  });

  const handleSubmit = (data) => {
    if (editingStudent) {
      updateMutation.mutate({ id: editingStudent.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const handleDelete = (student) => {
    if (confirm(`Are you sure you want to delete ${student.first_name} ${student.last_name}?`)) {
      deleteMutation.mutate(student.id);
    }
  };

  const filteredStudents = students.filter(s =>
    `${s.first_name} ${s.last_name}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.student_id?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.grade_level?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const statusColors = {
    Active: 'bg-green-100 text-green-800',
    Inactive: 'bg-gray-100 text-gray-800',
    Suspended: 'bg-red-100 text-red-800',
    Graduated: 'bg-blue-100 text-blue-800',
    Withdrawn: 'bg-yellow-100 text-yellow-800',
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Student Management</h1>
          <p className="text-gray-600 mt-1">Manage student records and information</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => setIsImportOpen(true)} variant="outline">
            <Upload className="w-4 h-4 mr-2" />
            Bulk Import
          </Button>
          <Button onClick={() => { setEditingStudent(null); setIsFormOpen(true); }} className="bg-blue-600 hover:bg-blue-700">
            <Plus className="w-4 h-4 mr-2" />
            Add Student
          </Button>
        </div>
      </div>

      <Card className="bg-white shadow-md">
        <CardContent className="p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <Input placeholder="Search students by name, ID, email, or grade..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-10" />
          </div>
        </CardContent>
      </Card>

      {isLoading ? (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredStudents.map((student) => (
            <Card key={student.id} className="bg-white shadow-md hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div className="flex items-center gap-3">
                    <UserRound className="w-8 h-8 text-blue-600" />
                    <div>
                      <CardTitle className="text-lg">{student.first_name} {student.last_name}</CardTitle>
                      <p className="text-sm text-gray-600">ID: {student.student_id}</p>
                    </div>
                  </div>
                  <Badge className={statusColors[student.status]}>{student.status}</Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm">
                  <p className="text-gray-600">Grade: {student.grade_level}</p>
                  <p className="text-gray-600">Email: {student.email || 'N/A'}</p>
                  <p className="text-gray-600">Phone: {student.phone || 'N/A'}</p>
                  {student.parent_name && (
                    <p className="text-gray-600">Parent: {student.parent_name}</p>
                  )}
                </div>
                <div className="flex gap-2 mt-4">
                  <Button variant="outline" size="sm" className="flex-1" onClick={() => { setEditingStudent(student); setIsFormOpen(true); }}>
                    <Edit className="w-4 h-4 mr-2" />
                    Edit
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => handleDelete(student)}>
                    <Trash2 className="w-4 h-4 text-red-600" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <StudentFormDialog
        open={isFormOpen}
        onOpenChange={setIsFormOpen}
        student={editingStudent}
        onSubmit={handleSubmit}
      />

      <BulkImportDialog
        open={isImportOpen}
        onOpenChange={setIsImportOpen}
        entityName="Student"
        entitySchema={{
          type: "object",
          properties: {
            first_name: { type: "string" },
            last_name: { type: "string" },
            student_id: { type: "string" },
            date_of_birth: { type: "string" },
            gender: { type: "string" },
            admission_date: { type: "string" },
            grade_level: { type: "string" },
            status: { type: "string" },
            address: { type: "string" },
            phone: { type: "string" },
            email: { type: "string" },
            parent_name: { type: "string" },
            parent_email: { type: "string" },
            parent_phone: { type: "string" },
            medical_conditions: { type: "string" },
            send_status: { type: "string" },
            notes: { type: "string" }
          },
          required: ["first_name", "last_name", "student_id", "grade_level"]
        }}
        templateData={[
          { 
            first_name: "Jane", 
            last_name: "Doe", 
            student_id: "S001", 
            date_of_birth: "2010-01-15", 
            gender: "Female", 
            admission_date: "2024-09-01", 
            grade_level: "9", 
            status: "Active", 
            email: "jane.doe@example.com",
            phone: "1234567890",
            parent_name: "John Doe",
            parent_email: "john.doe@example.com",
            parent_phone: "0987654321"
          }
        ]}
        onImportComplete={() => {
          queryClient.invalidateQueries({ queryKey: ['students'] });
          setIsImportOpen(false);
        }}
      />
    </div>
  );
}