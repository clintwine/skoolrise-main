import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Download, Share2, FileText, TrendingUp } from 'lucide-react';
import { createPageUrl } from '../utils';
import jsPDF from 'jspdf';
import { useParentStudents } from '@/components/hooks/useParentStudents';

export default function ParentReports() {
  const [user, setUser] = useState(null);
  const [selectedStudentId, setSelectedStudentId] = useState('');
  const [selectedSession, setSelectedSession] = useState('');

  useEffect(() => {
    const fetchUser = async () => {
      const currentUser = await base44.auth.me();
      setUser(currentUser);
    };
    fetchUser();
  }, []);

  const { students, isLoading } = useParentStudents(user);

  const { data: sessions = [] } = useQuery({
    queryKey: ['academic-sessions'],
    queryFn: () => base44.entities.AcademicSession.list('-created_date'),
  });

  useEffect(() => {
    if (students.length > 0 && !selectedStudentId) {
      setSelectedStudentId(students[0].id);
    }
  }, [students, selectedStudentId]);

  useEffect(() => {
    if (sessions.length > 0 && !selectedSession) {
      const currentSession = sessions.find(s => s.is_current) || sessions[0];
      setSelectedSession(currentSession?.id || '');
    }
  }, [sessions, selectedSession]);

  const { data: reportCards = [] } = useQuery({
    queryKey: ['report-cards', selectedStudentId, selectedSession],
    queryFn: async () => {
      if (!selectedStudentId) return [];
      const filter = { student_id: selectedStudentId };
      if (selectedSession) {
        filter.session_id = selectedSession;
      }
      return await base44.entities.ReportCard.filter(filter, '-created_date');
    },
    enabled: !!selectedStudentId,
  });

  const { data: examResults = [] } = useQuery({
    queryKey: ['exam-results', selectedStudentId],
    queryFn: async () => {
      if (!selectedStudentId) return [];
      return await base44.entities.ExamResult.filter({ student_id: selectedStudentId, published: true });
    },
    enabled: !!selectedStudentId,
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
    const message = `*Student Report Card*\n\nStudent: ${report.student_name}\nSession: ${report.session}\nTerm: ${report.term}\nAverage Score: ${report.average_score}%\nPosition: ${report.position}\nGrade: ${report.grade}\n\nTeacher's Remark: ${report.teacher_remark || 'N/A'}`;
    
    const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank');
  };

  if (!user || students.length === 0) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold text-gray-900">Academic Reports</h1>
        <Card>
          <CardContent className="p-12 text-center">
            <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">No students linked to your account</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const student = students.find(s => s.id === selectedStudentId);
  const currentSession = sessions.find(s => s.id === selectedSession);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Academic Reports</h1>
        <p className="text-gray-600 mt-1">View report cards and exam results</p>
      </div>

      <div className="flex flex-wrap gap-4">
        <div>
          <Label className="text-xs text-gray-500">Select Student</Label>
          <Select value={selectedStudentId} onValueChange={setSelectedStudentId}>
            <SelectTrigger className="w-64 mt-1">
              <SelectValue placeholder="Select student" />
            </SelectTrigger>
            <SelectContent>
              {students.map(s => (
                <SelectItem key={s.id} value={s.id}>
                  {s.first_name} {s.last_name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label className="text-xs text-gray-500">Academic Session</Label>
          <Select value={selectedSession} onValueChange={setSelectedSession}>
            <SelectTrigger className="w-64 mt-1">
              <SelectValue placeholder="All sessions" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={null}>All Sessions</SelectItem>
              {sessions.map(session => (
                <SelectItem key={session.id} value={session.id}>
                  {session.session_name} {session.is_current && '(Current)'}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {student && (
        <Card className="bg-gradient-to-r from-blue-50 to-purple-50 border-blue-200">
          <CardContent className="p-6">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-xl font-bold text-gray-900">{student.first_name} {student.last_name}</h3>
                <p className="text-gray-600">Grade {student.grade_level} • Student ID: {student.student_id_number}</p>
              </div>
              <Badge className="bg-green-100 text-green-800">{student.status}</Badge>
            </div>
          </CardContent>
        </Card>
      )}

      <Card className="bg-white shadow-md">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Report Cards</span>
            {currentSession && <Badge variant="outline">{currentSession.session_name}</Badge>}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {reportCards.length === 0 ? (
            <p className="text-center text-gray-500 py-8">No report cards available for the selected criteria</p>
          ) : (
            <div className="space-y-4">
              {reportCards.map((report, index) => (
                <div 
                  key={report.id} 
                  className={`p-4 border-2 rounded-lg transition-all ${
                    index === 0 ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-blue-300'
                  }`}
                >
                  {index === 0 && (
                    <Badge className="bg-blue-600 text-white mb-2">Most Recent</Badge>
                  )}
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
                        onClick={() => window.location.href = createPageUrl(`ReportCardView?id=${report.id}`)}
                      >
                        <FileText className="w-4 h-4 mr-2" />
                        View
                      </Button>
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