import React, { useRef } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Download, Printer, GraduationCap } from 'lucide-react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '../utils';
import { format } from 'date-fns';
import { toast } from 'sonner';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';

export default function ReportCardView() {
  const reportRef = useRef(null);
  const urlParams = new URLSearchParams(window.location.search);
  const reportId = urlParams.get('id');

  const { data: report, isLoading } = useQuery({
    queryKey: ['report-card', reportId],
    queryFn: async () => {
      const reports = await base44.entities.ReportCard.filter({ id: reportId });
      return reports[0];
    },
    enabled: !!reportId,
  });

  const { data: student } = useQuery({
    queryKey: ['student', report?.student_id],
    queryFn: async () => {
      if (!report?.student_id) return null;
      const students = await base44.entities.Student.filter({ id: report.student_id });
      return students[0];
    },
    enabled: !!report?.student_id,
  });

  const { data: school } = useQuery({
    queryKey: ['school'],
    queryFn: async () => {
      const schools = await base44.entities.School.list();
      return schools[0];
    },
  });

  const { data: academicSession } = useQuery({
    queryKey: ['session', report?.session_id],
    queryFn: async () => {
      if (!report?.session_id) return null;
      const sessions = await base44.entities.AcademicSession.filter({ id: report.session_id });
      return sessions[0];
    },
    enabled: !!report?.session_id,
  });

  const { data: term } = useQuery({
    queryKey: ['term', report?.term_id],
    queryFn: async () => {
      if (!report?.term_id) return null;
      const terms = await base44.entities.Term.filter({ id: report.term_id });
      return terms[0];
    },
    enabled: !!report?.term_id,
  });

  const { data: classArm } = useQuery({
    queryKey: ['class-arm', report?.class_id],
    queryFn: async () => {
      if (!report?.class_id) return null;
      const arms = await base44.entities.ClassArm.filter({ id: report.class_id });
      return arms[0];
    },
    enabled: !!report?.class_id,
  });

  const handleDownloadPDF = async () => {
    if (!reportRef.current) return;

    toast.info('Generating PDF...');
    
    try {
      const canvas = await html2canvas(reportRef.current, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff',
      });
      
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
      });

      const imgWidth = 210;
      const pageHeight = 297;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      let heightLeft = imgHeight;
      let position = 0;

      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;

      while (heightLeft >= 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }

      pdf.save(`ReportCard_${report.student_name || 'Student'}_${term?.term_name || 'Term'}.pdf`);
      toast.success('PDF downloaded successfully');
    } catch (error) {
      console.error('PDF generation error:', error);
      toast.error('Failed to generate PDF');
    }
  };

  const handlePrint = () => {
    window.print();
  };

  if (isLoading) {
    return (
      <div className="text-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
      </div>
    );
  }

  if (!report) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-600">Report card not found</p>
        <Link to={createPageUrl('ReportCardsManagement')}>
          <Button className="mt-4">Back to Report Cards</Button>
        </Link>
      </div>
    );
  }

  const grades = report.grades ? JSON.parse(report.grades) : [];

  const getGradeColor = (grade) => {
    const gradeColors = {
      'A': 'bg-green-100 text-green-800',
      'B': 'bg-blue-100 text-blue-800',
      'C': 'bg-yellow-100 text-yellow-800',
      'D': 'bg-orange-100 text-orange-800',
      'E': 'bg-red-100 text-red-800',
      'F': 'bg-red-200 text-red-900',
    };
    return gradeColors[grade?.charAt(0)] || 'bg-gray-100 text-gray-800';
  };

  const className = classArm 
    ? `Grade ${classArm.grade_level} - ${classArm.arm_name}` 
    : report.class_id || 'N/A';

  const sessionName = academicSession?.session_name || report.session_id || 'N/A';
  const termName = term?.term_name || report.term_id || 'N/A';

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between print:hidden">
        <Link to={createPageUrl('ReportCardsManagement')}>
          <Button variant="outline">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
        </Link>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handlePrint}>
            <Printer className="w-4 h-4 mr-2" />
            Print
          </Button>
          <Button onClick={handleDownloadPDF} className="bg-blue-600 hover:bg-blue-700 text-white">
            <Download className="w-4 h-4 mr-2" />
            Download PDF
          </Button>
        </div>
      </div>

      {/* Report Card Content */}
      <div ref={reportRef}>
        <Card className="bg-white shadow-lg rounded-2xl overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                {school?.logo_url ? (
                  <img src={school.logo_url} alt="School Logo" className="w-16 h-16 rounded-full bg-white p-1" />
                ) : (
                  <div className="w-16 h-16 rounded-full bg-white/20 flex items-center justify-center">
                    <GraduationCap className="w-8 h-8" />
                  </div>
                )}
                <div>
                  <h1 className="text-2xl font-bold">{school?.school_name || 'School Name'}</h1>
                  <p className="text-sm opacity-90">{school?.address || 'School Address'}</p>
                  {school?.motto && <p className="text-xs opacity-75 italic mt-1">"{school.motto}"</p>}
                </div>
              </div>
              <div className="text-right">
                <h2 className="text-xl font-semibold">Student Report Card</h2>
                <p className="text-sm opacity-90">{sessionName}</p>
                <p className="text-sm opacity-90">{termName}</p>
              </div>
            </div>
          </div>

          <CardContent className="p-6">
            {/* Student Info */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6 p-4 bg-gray-50 rounded-xl">
              <div>
                <p className="text-xs text-gray-500">Student Name</p>
                <p className="font-semibold text-gray-900">{report.student_name}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Admission No</p>
                <p className="font-semibold text-gray-900">{student?.student_id_number || 'N/A'}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Class</p>
                <p className="font-semibold text-gray-900">{className}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Term</p>
                <p className="font-semibold text-gray-900">{termName}</p>
              </div>
            </div>

            {/* Grades Table */}
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Academic Performance</h3>
              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="bg-gray-100">
                      <th className="border p-3 text-left text-sm font-semibold text-gray-700">Subject</th>
                      <th className="border p-3 text-center text-sm font-semibold text-gray-700">CA Score</th>
                      <th className="border p-3 text-center text-sm font-semibold text-gray-700">Exam Score</th>
                      <th className="border p-3 text-center text-sm font-semibold text-gray-700">Total</th>
                      <th className="border p-3 text-center text-sm font-semibold text-gray-700">Grade</th>
                      <th className="border p-3 text-left text-sm font-semibold text-gray-700">Remark</th>
                    </tr>
                  </thead>
                  <tbody>
                    {grades.length > 0 ? grades.map((grade, idx) => (
                      <tr key={idx} className="hover:bg-gray-50">
                        <td className="border p-3 text-sm text-gray-900">{grade.subject}</td>
                        <td className="border p-3 text-center text-sm text-gray-900">{grade.ca_score || '-'}</td>
                        <td className="border p-3 text-center text-sm text-gray-900">{grade.exam_score || '-'}</td>
                        <td className="border p-3 text-center text-sm font-semibold text-gray-900">{grade.total || '-'}</td>
                        <td className="border p-3 text-center">
                          <Badge className={getGradeColor(grade.grade)}>{grade.grade}</Badge>
                        </td>
                        <td className="border p-3 text-sm text-gray-600">{grade.remark || '-'}</td>
                      </tr>
                    )) : (
                      <tr>
                        <td colSpan={6} className="border p-6 text-center text-gray-500">No grades recorded</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Summary */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              <div className="p-4 bg-blue-50 rounded-xl text-center">
                <p className="text-xs text-blue-600 mb-1">Total Score</p>
                <p className="text-2xl font-bold text-blue-700">{report.total_score || 0}</p>
              </div>
              <div className="p-4 bg-green-50 rounded-xl text-center">
                <p className="text-xs text-green-600 mb-1">Average Score</p>
                <p className="text-2xl font-bold text-green-700">{report.average_score || 0}%</p>
              </div>
              <div className="p-4 bg-purple-50 rounded-xl text-center">
                <p className="text-xs text-purple-600 mb-1">Overall Grade</p>
                <p className="text-2xl font-bold text-purple-700">{report.grade || 'N/A'}</p>
              </div>
              <div className="p-4 bg-orange-50 rounded-xl text-center">
                <p className="text-xs text-orange-600 mb-1">Position</p>
                <p className="text-2xl font-bold text-orange-700">{report.position || 'N/A'}</p>
              </div>
            </div>

            {/* Attendance Summary */}
            {report.attendance_summary && (
              <div className="mb-6 p-4 bg-gray-50 rounded-xl">
                <h4 className="font-semibold text-gray-900 mb-2">Attendance Summary</h4>
                <p className="text-sm text-gray-600">{report.attendance_summary}</p>
              </div>
            )}

            {/* Comments */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {report.teacher_comment && (
                <div className="p-4 border rounded-xl">
                  <h4 className="font-semibold text-gray-900 mb-2">Class Teacher's Comment</h4>
                  <p className="text-sm text-gray-600 italic">"{report.teacher_comment}"</p>
                </div>
              )}
              {report.principal_comment && (
                <div className="p-4 border rounded-xl">
                  <h4 className="font-semibold text-gray-900 mb-2">Principal's Comment</h4>
                  <p className="text-sm text-gray-600 italic">"{report.principal_comment}"</p>
                </div>
              )}
            </div>

            {/* Signatures */}
            <div className="mt-8 pt-6 border-t grid grid-cols-2 gap-8">
              <div className="text-center">
                <div className="h-16 flex items-end justify-center mb-2">
                  {school?.principal_signature_url && (
                    <img src={school.principal_signature_url} alt="Signature" className="h-12" />
                  )}
                </div>
                <div className="border-t border-gray-300 pt-2">
                  <p className="font-semibold text-gray-900">{school?.principal_name || 'Principal'}</p>
                  <p className="text-xs text-gray-500">Principal</p>
                </div>
              </div>
              <div className="text-center">
                <div className="h-16 flex items-end justify-center mb-2">
                  <p className="text-sm text-gray-400">Date: {format(new Date(), 'MMM d, yyyy')}</p>
                </div>
                <div className="border-t border-gray-300 pt-2">
                  <p className="font-semibold text-gray-900">Class Teacher</p>
                  <p className="text-xs text-gray-500">Signature</p>
                </div>
              </div>
            </div>

            {/* Status Badge */}
            <div className="mt-6 flex justify-end print:hidden">
              <Badge className={
                report.status === 'Published' ? 'bg-green-100 text-green-800' :
                report.status === 'Sent' ? 'bg-blue-100 text-blue-800' :
                'bg-gray-100 text-gray-800'
              }>
                Status: {report.status}
              </Badge>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}