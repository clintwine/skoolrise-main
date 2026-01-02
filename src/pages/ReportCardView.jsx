import React from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Download, Printer, GraduationCap, User, Calendar, Award } from 'lucide-react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '../utils';
import { format } from 'date-fns';

export default function ReportCardView() {
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

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between">
        <Link to={createPageUrl('ReportCardsManagement')}>
          <Button variant="outline">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
        </Link>
        <div className="flex gap-2">
          <Button variant="outline">
            <Printer className="w-4 h-4 mr-2" />
            Print
          </Button>
          <Button className="bg-blue-600 hover:bg-blue-700 text-white">
            <Download className="w-4 h-4 mr-2" />
            Download PDF
          </Button>
        </div>
      </div>

      {/* Report Card */}
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
              </div>
            </div>
            <div className="text-right">
              <h2 className="text-xl font-semibold">Student Report Card</h2>
              <p className="text-sm opacity-90">Academic Year {report.session_id}</p>
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
              <p className="font-semibold text-gray-900">{report.class_id}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500">Term</p>
              <p className="font-semibold text-gray-900">{report.term_id}</p>
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

          {/* Status Badge */}
          <div className="mt-6 flex justify-end">
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
  );
}