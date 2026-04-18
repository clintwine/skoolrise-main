import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useSchoolContext } from '@/hooks/useSchoolContext';
import { addSchoolFilter } from '@/utils/schoolFilter';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Download, Send } from 'lucide-react';
import jsPDF from 'jspdf';

export default function ExamResults() {
  const urlParams = new URLSearchParams(window.location.search);
  const examId = urlParams.get('id');
  const queryClient = useQueryClient();

  const { school_tenant_id, isReady } = useSchoolContext();

  const { data: exam } = useQuery({
    queryKey: ['exam', examId, school_tenant_id],
    queryFn: async () => {
      const exams = await base44.entities.Exam.filter(addSchoolFilter({ id: examId }, school_tenant_id));
      return exams[0] || null;
    },
    enabled: !!examId && isReady,
  });

  const { data: results = [] } = useQuery({
    queryKey: ['exam-results', examId, school_tenant_id],
    queryFn: async () => {
      const allResults = await base44.entities.ExamResult.filter(addSchoolFilter({ exam_id: examId }, school_tenant_id));
      return allResults.sort((a, b) => b.percentage - a.percentage);
    },
    enabled: !!examId && isReady,
  });

  const publishMutation = useMutation({
    mutationFn: async () => {
      for (const result of results) {
        await base44.entities.ExamResult.update(result.id, {
          published: true,
          published_date: new Date().toISOString(),
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['exam-results'] });
      alert('Results published successfully!');
    },
  });

  const generatePDF = (result) => {
    const doc = new jsPDF();
    
    // Header
    doc.setFontSize(20);
    doc.text('EXAM RESULT', 105, 20, { align: 'center' });
    
    doc.setFontSize(12);
    doc.text(`${exam.title}`, 105, 30, { align: 'center' });
    doc.text(`${exam.subject}`, 105, 38, { align: 'center' });
    
    // Student Info
    doc.setFontSize(14);
    doc.text('Student Information', 20, 55);
    doc.setFontSize(11);
    doc.text(`Name: ${result.student_name}`, 20, 65);
    doc.text(`Subject: ${result.subject}`, 20, 73);
    doc.text(`Exam Type: ${result.exam_type}`, 20, 81);
    
    // Scores
    doc.setFontSize(14);
    doc.text('Score Details', 20, 100);
    doc.setFontSize(11);
    doc.text(`Score: ${result.score} / ${exam.total_points}`, 20, 110);
    doc.text(`Percentage: ${result.percentage?.toFixed(2)}%`, 20, 118);
    doc.text(`Grade: ${result.grade || 'N/A'}`, 20, 126);
    doc.text(`Position: ${result.position || 'N/A'}`, 20, 134);
    doc.text(`Class Average: ${result.class_average?.toFixed(2)}%`, 20, 142);
    
    // Status
    doc.setFontSize(14);
    const status = result.percentage >= (exam.passing_score || 40) ? 'PASSED' : 'FAILED';
    const statusColor = status === 'PASSED' ? [0, 150, 0] : [200, 0, 0];
    doc.setTextColor(...statusColor);
    doc.text(status, 105, 170, { align: 'center' });
    
    // Footer
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(10);
    doc.text(`Generated on: ${new Date().toLocaleDateString()}`, 105, 280, { align: 'center' });
    
    doc.save(`${result.student_name}_${exam.title}_Result.pdf`);
  };

  const calculateStats = () => {
    if (results.length === 0) return { average: 0, highest: 0, lowest: 0, passRate: 0 };
    
    const scores = results.map(r => r.percentage);
    const average = scores.reduce((sum, s) => sum + s, 0) / scores.length;
    const highest = Math.max(...scores);
    const lowest = Math.min(...scores);
    const passed = results.filter(r => r.percentage >= (exam?.passing_score || 40)).length;
    const passRate = (passed / results.length) * 100;
    
    return { average, highest, lowest, passRate };
  };

  const stats = calculateStats();
  const publishedCount = results.filter(r => r.published).length;

  if (!examId) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Exam Results</h1>
          <p className="text-gray-600 mt-1">View and manage exam results</p>
        </div>
        <Card className="bg-white rounded-xl shadow-md">
          <CardContent className="p-16 text-center">
            <Download className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No Exam Selected</h3>
            <p className="text-gray-600">Please select an exam from the Exam Management or Exam Command Center page to view results.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!exam) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Exam Results</h1>
          <p className="text-gray-600 mt-1">{exam.title}</p>
        </div>
        <div className="flex gap-3">
          <Button
            onClick={() => {
              const csv = [
                ['Student Name', 'Score', 'Percentage', 'Grade', 'Position'],
                ...results.map(r => [r.student_name, r.score, r.percentage, r.grade || '', r.position || ''])
              ].map(row => row.join(',')).join('\n');
              
              const blob = new Blob([csv], { type: 'text/csv' });
              const url = URL.createObjectURL(blob);
              const a = document.createElement('a');
              a.href = url;
              a.download = `${exam.title}_Results.csv`;
              a.click();
            }}
            variant="outline"
          >
            <Download className="w-4 h-4 mr-2" />
            Export CSV
          </Button>
          <Button
            onClick={() => publishMutation.mutate()}
            disabled={publishedCount === results.length || publishMutation.isPending}
            className="bg-green-600 hover:bg-green-700"
          >
            <Send className="w-4 h-4 mr-2" />
            {publishedCount === results.length ? 'All Published' : `Publish Results (${results.length - publishedCount})`}
          </Button>
        </div>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-white shadow-md">
          <CardContent className="p-6">
            <p className="text-sm text-gray-600">Class Average</p>
            <p className="text-3xl font-bold text-blue-600">{stats.average.toFixed(2)}%</p>
          </CardContent>
        </Card>
        <Card className="bg-white shadow-md">
          <CardContent className="p-6">
            <p className="text-sm text-gray-600">Highest Score</p>
            <p className="text-3xl font-bold text-green-600">{stats.highest.toFixed(2)}%</p>
          </CardContent>
        </Card>
        <Card className="bg-white shadow-md">
          <CardContent className="p-6">
            <p className="text-sm text-gray-600">Lowest Score</p>
            <p className="text-3xl font-bold text-red-600">{stats.lowest.toFixed(2)}%</p>
          </CardContent>
        </Card>
        <Card className="bg-white shadow-md">
          <CardContent className="p-6">
            <p className="text-sm text-gray-600">Pass Rate</p>
            <p className="text-3xl font-bold text-purple-600">{stats.passRate.toFixed(2)}%</p>
          </CardContent>
        </Card>
      </div>

      {/* Results Table */}
      <Card className="bg-white shadow-md">
        <CardHeader>
          <CardTitle>Student Results ({results.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Position</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Student Name</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Score</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Percentage</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Grade</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {results.map((result, idx) => {
                  const passed = result.percentage >= (exam.passing_score || 40);
                  return (
                    <tr key={result.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 text-sm font-medium text-gray-900">{idx + 1}</td>
                      <td className="px-6 py-4 text-sm font-medium text-gray-900">{result.student_name}</td>
                      <td className="px-6 py-4 text-sm text-gray-900">{result.score} / {exam.total_points}</td>
                      <td className="px-6 py-4 text-sm font-semibold text-gray-900">{result.percentage?.toFixed(2)}%</td>
                      <td className="px-6 py-4 text-sm text-gray-900">{result.grade || '-'}</td>
                      <td className="px-6 py-4">
                        <div className="flex gap-2">
                          <Badge className={passed ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}>
                            {passed ? 'Passed' : 'Failed'}
                          </Badge>
                          {result.published && (
                            <Badge className="bg-blue-100 text-blue-800">Published</Badge>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => generatePDF(result)}
                        >
                          <Download className="w-4 h-4 mr-2" />
                          PDF
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
    </div>
  );
}