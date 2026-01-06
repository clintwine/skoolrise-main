import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Users, Upload, Download } from 'lucide-react';
import { format } from 'date-fns';
import BulkImportDialog from '../components/admin/BulkImportDialog';
import { toast } from 'sonner';

export default function EnrollmentManagement() {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [bulkImportOpen, setBulkImportOpen] = useState(false);
  const queryClient = useQueryClient();

  const { data: enrollments = [] } = useQuery({
    queryKey: ['enrollments'],
    queryFn: () => base44.entities.Enrollment.list('-enrollment_date'),
  });

  const { data: students = [] } = useQuery({
    queryKey: ['students'],
    queryFn: () => base44.entities.Student.list(),
  });

  const { data: classes = [] } = useQuery({
    queryKey: ['classes'],
    queryFn: () => base44.entities.Class.list(),
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.Enrollment.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['enrollments'] });
      setIsFormOpen(false);
    },
  });

  const handleSubmit = (data) => {
    createMutation.mutate(data);
  };

  const statusColors = {
    Enrolled: 'bg-green-100 text-green-800',
    Completed: 'bg-blue-100 text-blue-800',
    Dropped: 'bg-red-100 text-red-800',
    Withdrawn: 'bg-gray-100 text-gray-800',
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Enrollment Management</h1>
          <p className="text-gray-600 mt-1">Manage student class enrollments</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => setBulkImportOpen(true)} variant="outline" className="border-blue-300 text-blue-700 hover:bg-blue-50">
            <Upload className="w-4 h-4 mr-2" />
            Bulk Import
          </Button>
          <Button onClick={() => setIsFormOpen(true)} className="bg-blue-600 hover:bg-blue-700">
            <Plus className="w-4 h-4 mr-2" />
            Enroll Student
          </Button>
        </div>
      </div>

      <Card className="bg-white shadow-md">
        <CardHeader>
          <CardTitle>Enrollments</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Student</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Class</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Enrollment Date</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Final Grade</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {enrollments.map((enrollment) => (
                  <tr key={enrollment.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 text-sm font-medium text-gray-900">{enrollment.student_name}</td>
                    <td className="px-6 py-4 text-sm text-gray-900">{enrollment.class_name}</td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {enrollment.enrollment_date ? format(new Date(enrollment.enrollment_date), 'MMM d, yyyy') : 'N/A'}
                    </td>
                    <td className="px-6 py-4">
                      <Badge className={statusColors[enrollment.status]}>{enrollment.status}</Badge>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">{enrollment.final_grade || '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <EnrollmentFormDialog
        open={isFormOpen}
        onOpenChange={setIsFormOpen}
        students={students}
        classArms={classArms}
        subjects={subjects}
        onSubmit={handleSubmit}
      />

      <BulkEnrollmentImportDialog
        open={bulkImportOpen}
        onOpenChange={setBulkImportOpen}
        onImportComplete={() => {
          queryClient.invalidateQueries({ queryKey: ['enrollments'] });
          queryClient.invalidateQueries({ queryKey: ['students'] });
        }}
      />
    </div>
  );
}

function BulkEnrollmentImportDialog({ open, onOpenChange, onImportComplete }) {
  const [file, setFile] = useState(null);
  const [previewData, setPreviewData] = useState(null);
  const [importing, setImporting] = useState(false);
  const [importResults, setImportResults] = useState(null);
  const queryClient = useQueryClient();

  const { data: classes = [] } = useQuery({
    queryKey: ['classes'],
    queryFn: () => base44.entities.Class.list(),
  });

  const { data: students = [] } = useQuery({
    queryKey: ['students'],
    queryFn: () => base44.entities.Student.list(),
  });

  const handleFileChange = async (e) => {
    const selectedFile = e.target.files[0];
    if (!selectedFile) return;

    setFile(selectedFile);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file: selectedFile });
      
      const result = await base44.integrations.Core.ExtractDataFromUploadedFile({
        file_url: file_url,
        json_schema: {
          type: "object",
          properties: {
            student_id: { type: "string" },
            student_first_name: { type: "string" },
            student_last_name: { type: "string" },
            class_name: { type: "string" },
            enrollment_date: { type: "string" },
          }
        }
      });

      if (result.status === 'success') {
        const data = Array.isArray(result.output) ? result.output : [result.output];
        setPreviewData(data);
      } else {
        toast.error('Error extracting data: ' + result.details);
      }
    } catch (error) {
      toast.error('Error processing file: ' + error.message);
    }
  };

  const handleImport = async () => {
    if (!previewData) return;

    setImporting(true);
    toast.info('Import started. Creating students and enrollments...');
    
    const results = { success: 0, failed: 0, errors: [] };

    try {
      for (const row of previewData) {
        try {
          let student = null;
          
          // Find or create student
          if (row.student_id) {
            student = students.find(s => s.student_id_number === row.student_id);
          }
          
          if (!student && row.student_first_name && row.student_last_name) {
            // Create new student
            student = await base44.entities.Student.create({
              first_name: row.student_first_name,
              last_name: row.student_last_name,
              student_id_number: row.student_id || `STU-${Date.now()}`,
              grade_level: 'Unassigned',
              status: 'Active',
            });
          }

          if (!student) {
            results.failed++;
            results.errors.push(`Row ${previewData.indexOf(row) + 1}: Student not found and insufficient data to create`);
            continue;
          }

          // Find class
          const cls = classes.find(c => c.class_name === row.class_name);
          if (!cls) {
            results.failed++;
            results.errors.push(`Row ${previewData.indexOf(row) + 1}: Class "${row.class_name}" not found`);
            continue;
          }

          // Create enrollment
          await base44.entities.Enrollment.create({
            student_id: student.id,
            student_name: `${student.first_name} ${student.last_name}`,
            class_id: cls.id,
            class_name: cls.class_name,
            enrollment_date: row.enrollment_date || new Date().toISOString().split('T')[0],
            status: 'Enrolled',
          });

          results.success++;
        } catch (error) {
          results.failed++;
          results.errors.push(`Row ${previewData.indexOf(row) + 1}: ${error.message}`);
        }
      }

      setImportResults(results);
      toast.success(`Import complete: ${results.success} successful, ${results.failed} failed`);
      onImportComplete?.();
    } catch (error) {
      toast.error('Import failed: ' + error.message);
    } finally {
      setImporting(false);
    }
  };

  const downloadTemplate = () => {
    const csvContent = `student_id,student_first_name,student_last_name,class_name,enrollment_date\nSTU-001,John,Doe,Grade 7 - A,2024-01-01\n`;
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'enrollment_template.csv';
    a.click();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto bg-white">
        <DialogHeader>
          <DialogTitle>Bulk Import Enrollments</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-gray-900">Download Template</h3>
                  <p className="text-sm text-gray-600">CSV with columns: student_id (optional), student_first_name, student_last_name, class_name, enrollment_date</p>
                </div>
                <Button onClick={downloadTemplate} variant="outline">
                  <Download className="w-4 h-4 mr-2" />
                  Download
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="space-y-3">
                <h3 className="font-semibold text-gray-900">Upload File</h3>
                <input
                  type="file"
                  accept=".csv"
                  onChange={handleFileChange}
                  className="w-full p-2 border rounded"
                />
                {file && <p className="text-sm text-gray-600">{file.name}</p>}
              </div>
            </CardContent>
          </Card>

          {previewData && (
            <Card>
              <CardContent className="p-4">
                <h3 className="font-semibold text-gray-900 mb-3">Preview ({previewData.length} rows)</h3>
                <div className="max-h-64 overflow-auto border rounded">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50 sticky top-0">
                      <tr>
                        <th className="px-3 py-2 text-left">#</th>
                        <th className="px-3 py-2 text-left">Student ID</th>
                        <th className="px-3 py-2 text-left">Student Name</th>
                        <th className="px-3 py-2 text-left">Class</th>
                        <th className="px-3 py-2 text-left">Date</th>
                      </tr>
                    </thead>
                    <tbody>
                      {previewData.map((row, idx) => (
                        <tr key={idx}>
                          <td className="px-3 py-2 border-t">{idx + 1}</td>
                          <td className="px-3 py-2 border-t">{row.student_id || 'Auto-generate'}</td>
                          <td className="px-3 py-2 border-t">{row.student_first_name} {row.student_last_name}</td>
                          <td className="px-3 py-2 border-t">{row.class_name}</td>
                          <td className="px-3 py-2 border-t">{row.enrollment_date}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          )}

          {importResults && (
            <Card className={importResults.failed > 0 ? 'border-orange-200' : 'border-green-200'}>
              <CardContent className="p-4">
                <h3 className="font-semibold text-gray-900 mb-3">Import Results</h3>
                <div className="space-y-2 text-sm">
                  <p><span className="font-semibold text-green-600">{importResults.success}</span> enrollments created</p>
                  <p><span className="font-semibold text-red-600">{importResults.failed}</span> failed</p>
                  {importResults.errors.length > 0 && (
                    <div className="mt-3 p-3 bg-red-50 rounded-lg max-h-40 overflow-y-auto">
                      <p className="font-semibold text-red-800 mb-2">Errors:</p>
                      {importResults.errors.map((err, idx) => (
                        <p key={idx} className="text-red-700 text-xs">{err}</p>
                      ))}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              {importResults ? 'Close' : 'Cancel'}
            </Button>
            {previewData && !importResults && (
              <Button 
                onClick={handleImport} 
                disabled={importing}
                className="bg-blue-600 hover:bg-blue-700"
              >
                {importing ? 'Importing...' : `Import ${previewData.length} Enrollments`}
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function EnrollmentFormDialog({ open, onOpenChange, students, classArms, subjects, onSubmit }) {
  const [formData, setFormData] = React.useState({
    student_id: '',
    student_name: '',
    class_id: '',
    class_name: '',
    subject_id: '',
    subject_name: '',
    enrollment_date: new Date().toISOString().split('T')[0],
    status: 'Enrolled',
  });

  const handleStudentChange = (studentId) => {
    const student = students.find(s => s.id === studentId);
    setFormData({ ...formData, student_id: studentId, student_name: student ? `${student.first_name} ${student.last_name}` : '' });
  };

  const handleClassChange = (classArmId) => {
    const arm = classArms.find(c => c.id === classArmId);
    setFormData({ ...formData, class_id: classArmId, class_name: arm ? `${arm.grade_level} - ${arm.arm_name}` : '' });
  };

  const handleSubjectChange = (subjectId) => {
    const subject = subjects.find(s => s.id === subjectId);
    setFormData({ ...formData, subject_id: subjectId, subject_name: subject ? subject.subject_name : '' });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(formData);
  };

  const uniqueGradeLevels = [...new Set(classArms.map(c => c.grade_level))].sort();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md bg-white">
        <DialogHeader>
          <DialogTitle className="text-gray-900">Enroll Student</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-sm font-medium">Student *</label>
            <Select value={formData.student_id} onValueChange={handleStudentChange} required>
              <SelectTrigger>
                <SelectValue placeholder="Select student" />
              </SelectTrigger>
              <SelectContent>
                {students.map(s => <SelectItem key={s.id} value={s.id}>{s.first_name} {s.last_name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div>
            <label className="text-sm font-medium">Class (Grade Level) *</label>
            <Select value={formData.class_id} onValueChange={handleClassChange} required>
              <SelectTrigger>
                <SelectValue placeholder="Select class" />
              </SelectTrigger>
              <SelectContent>
                {classArms.map(c => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.grade_level} - {c.arm_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <label className="text-sm font-medium">Subject (Optional - for special subjects)</label>
            <Select value={formData.subject_id} onValueChange={handleSubjectChange}>
              <SelectTrigger>
                <SelectValue placeholder="Select subject (optional)" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={null}>None</SelectItem>
                {subjects.map(s => (
                  <SelectItem key={s.id} value={s.id}>
                    {s.subject_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button type="submit" className="bg-blue-600 hover:bg-blue-700">Enroll</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}