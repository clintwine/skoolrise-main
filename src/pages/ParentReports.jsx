import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Download, Share2, FileText, TrendingUp } from 'lucide-react';
import jsPDF from 'jspdf';

export default function ParentReports() {
  const [user, setUser] = useState(null);
  const [studentIds, setStudentIds] = useState([]);
  const [selectedStudent, setSelectedStudent] = useState('');

  useEffect(() => {
    const fetchUser = async () => {
      const currentUser = await base44.auth.me();
      setUser(currentUser);
      if (currentUser.parent_of_student_ids) {
        const ids = currentUser.parent_of_student_ids.split(',').map(id => id.trim());
        setStudentIds(ids);
        if (ids.length > 0) setSelectedStudent(ids[0]);
      }
    };
    fetchUser();
  }, []);

  const { data: students = [] } = useQuery({
    queryKey: ['parent-students', studentIds],
    queryFn: async () => {
      if (studentIds.length === 0) return [];
      const allStudents = await base44.entities.Student.list();
      return allStudents.filter(s => studentIds.includes(s.id));
    },
    enabled: studentIds.length > 0,
  });

  const { data: reportCards = [] } = useQuery({
    queryKey: ['report-cards', selectedStudent],
    queryFn: async () => {
      if (!selectedStudent) return [];
      const allReports = await base44.entities.ReportCard.list('-created_date');
      return allReports.filter(r => r.student_id === selectedStudent);
    },
    enabled: !!selectedStudent,
  });

  const { data: examResults = [] } = useQuery({
    queryKey: ['exam-results', selectedStudent],
    queryFn: async () => {
      if (!selectedStudent) return [];
      const allResults = await base44.entities.ExamResult.filter({ student_id: selectedStudent, published: true });
      return allResults;
    },
    enabled: !!selectedStudent,
  });

  const generatePDF = (report) => {
    const doc = new jsPDF();
    
    doc.setFontSize(20);
    doc.text('STUDENT REPORT CARD', 105, 20, { align: 'center' });
    
    doc.setFontSize(12);
    doc.text(`${report.session} - ${report.term}`, 105, 30, { align: 'center' });
    
    doc.setFontSize(14);
    doc.text('Student Information', 20, 50);
    doc.setFontSize(11);
    doc.text(`Name: ${report.student_name}`, 20, 60);
    doc.text(`Class: ${report.class_name}`, 20, 68);
    
    doc.setFontSize(14);
    doc.text('Performance Summary', 20, 85);
    doc.setFontSize(11);
    doc.text(`Average Score: ${report.average_score}%`, 20, 95);
    doc.text(`Position: ${report.position}`, 20, 103);
    doc.text(`Grade: ${report.grade}`, 20, 111);
    
    doc.text(`Teacher's Remark: ${report.teacher_remark || 'N/A'}`, 20, 130);
    doc.text(`Principal's Remark: ${report.principal_remark || 'N/A'}`, 20, 145);
    
    doc.setFontSize(10);
    doc.text(`Generated on: ${new Date().toLocaleDateString()}`, 105, 280, { align: 'center' });
    
    doc.save(`${report.student_name}_Report_Card.pdf`);
  };

  const shareViaWhatsApp = (report) => {
    const message = `*Student Report Card*\n\n` +
                   `Student: ${report.student_name}\n` +
                   `Session: ${report.session}\n` +
                   `Term: ${report.term}\n` +
                   `Average Score: ${report.average_score}%\n` +
                   `Position: ${report.position}\n` +
                   `Grade: ${report.grade}\n\n` +
                   `Teacher's Remark: ${report.teacher_remark || 'N/A'}`;
    
    const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank');
  };

  if (!user) {
    return (
      <div className="text-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
      </div>
    );
  }

  const student = students.find(s => s.id === selectedStudent);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Academic Reports</h1>
        <p className="text-gray-600 mt-1">View report cards and exam results</p>
      </div>

      <Select value={selectedStudent} onValueChange={setSelectedStudent}>
        <SelectTrigger className="w-64">
          <SelectValue placeholder="Select student" />
        </SelectTrigger>
        <SelectContent>
          {students.map(student => (
            <SelectItem key={student.id} value={student.id}>
              {student.first_name} {student.last_name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {student && (
        <Card className="bg-gradient-to-r from-blue-50 to-purple-50 border-blue-200">
          <CardContent className="p-6">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-xl font-bold text-gray-900">{student.first_name} {student.last_name}</h3>
                <p className="text-gray-600">Grade {student.grade_level} • Student ID: {student.student_id}</p>
              </div>
              <Badge className="bg-green-100 text-green-800">{student.status}</Badge>
            </div>
          </CardContent>
        </Card>
      )}

      <Card className="bg-white shadow-md">
        <CardHeader>
          <CardTitle>Report Cards</CardTitle>
        </CardHeader>
        <CardContent>
          {reportCards.length === 0 ? (
            <p className="text-center text-gray-500 py-8">No report cards available</p>
          ) : (
            <div className="space-y-4">
              {reportCards.map((report) => (
                <div key={report.id} className="p-4 border-2 border-gray-200 rounded-lg hover:border-blue-300 transition-all">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-lg font-bold text-gray-900">{report.session} - {report.term}</h3>
                        <Badge className="bg-blue-100 text-blue-800">{report.class_name}</Badge>
                      </div>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-3">
                        <div>
                          <p className="text-sm text-gray-600">Average Score</p>
                          <p className="text-xl font-bold text-blue-600">{report.average_score}%</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600">Position</p>
                          <p className="text-xl font-bold text-purple-600">{report.position}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600">Grade</p>
                          <p className="text-xl font-bold text-green-600">{report.grade}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600">Total Subjects</p>
                          <p className="text-xl font-bold text-orange-600">{report.total_subjects || '-'}</p>
                        </div>
                      </div>
                      {report.teacher_remark && (
                        <div className="mt-3 p-3 bg-yellow-50 rounded-lg">
                          <p className="text-sm font-semibold text-gray-700">Teacher's Remark:</p>
                          <p className="text-sm text-gray-900">{report.teacher_remark}</p>
                        </div>
                      )}
                    </div>
                    <div className="flex flex-col gap-2 ml-4">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => generatePDF(report)}
                      >
                        <Download className="w-4 h-4 mr-2" />
                        PDF
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => shareViaWhatsApp(report)}
                        className="text-green-600 border-green-300"
                      >
                        <Share2 className="w-4 h-4 mr-2" />
                        WhatsApp
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="bg-white shadow-md">
        <CardHeader>
          <CardTitle>Exam Results</CardTitle>
        </CardHeader>
        <CardContent>
          {examResults.length === 0 ? (
            <p className="text-center text-gray-500 py-8">No published exam results</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Subject</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Exam Type</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Score</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Grade</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Position</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Remark</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {examResults.map((result) => (
                    <tr key={result.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 text-sm font-medium text-gray-900">{result.subject}</td>
                      <td className="px-6 py-4 text-sm text-gray-600">{result.exam_type}</td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-bold text-blue-600">{result.percentage?.toFixed(1)}%</span>
                          <TrendingUp className="w-4 h-4 text-green-600" />
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <Badge className="bg-purple-100 text-purple-800">{result.grade || '-'}</Badge>
                      </td>
                      <td className="px-6 py-4 text-sm font-semibold text-gray-900">{result.position || '-'}</td>
                      <td className="px-6 py-4 text-sm text-gray-600">{result.remark || '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}