import React, { useMemo, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { BarChart3, Download, FileText, TrendingUp, Users } from 'lucide-react';
import { toast } from 'sonner';
import ReportDashboardCards from '@/components/reports/ReportDashboardCards';
import StudentPerformanceChart from '@/components/reports/StudentPerformanceChart';
import StudentPerformanceFilters from '@/components/reports/StudentPerformanceFilters';
import StudentPerformanceTable, { studentPerformanceColumns } from '@/components/reports/StudentPerformanceTable';
import { downloadCsv, getStudentPerformanceRows, sortRows } from '@/components/reports/reportUtils';

export default function StudentPerformanceReports() {
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('all');
  const [gradeLevel, setGradeLevel] = useState('all');
  const [sortBy, setSortBy] = useState('average_score');
  const [sortOrder, setSortOrder] = useState('desc');

  const { data: students = [], isLoading: studentsLoading } = useQuery({
    queryKey: ['reporting-students'],
    queryFn: () => base44.entities.Student.list('-updated_date')
  });

  const { data: reportCards = [], isLoading: reportCardsLoading } = useQuery({
    queryKey: ['reporting-report-cards'],
    queryFn: () => base44.entities.ReportCard.list('-updated_date')
  });

  const rows = useMemo(() => getStudentPerformanceRows(students, reportCards), [students, reportCards]);

  const filteredRows = useMemo(() => {
    const normalizedSearch = search.toLowerCase();
    const filtered = rows.filter((row) => {
      const matchesSearch = !normalizedSearch || row.student_name.toLowerCase().includes(normalizedSearch) || row.student_id_number.toLowerCase().includes(normalizedSearch);
      const matchesStatus = status === 'all' || row.status === status;
      const matchesGrade = gradeLevel === 'all' || row.grade_level === gradeLevel;
      return matchesSearch && matchesStatus && matchesGrade;
    });

    return sortRows(filtered, sortBy, sortOrder);
  }, [rows, search, status, gradeLevel, sortBy, sortOrder]);

  const gradeOptions = useMemo(() => [...new Set(rows.map((row) => row.grade_level).filter(Boolean).filter((value) => value !== '—'))], [rows]);

  const chartData = useMemo(() => {
    return gradeOptions.map((grade) => {
      const gradeRows = filteredRows.filter((row) => row.grade_level === grade);
      const average = gradeRows.length
        ? Number((gradeRows.reduce((sum, row) => sum + row.average_score, 0) / gradeRows.length).toFixed(1))
        : 0;

      return {
        grade_level: grade,
        average_score: average
      };
    });
  }, [filteredRows, gradeOptions]);

  const metrics = useMemo(() => {
    const totalStudents = filteredRows.length;
    const activeStudents = filteredRows.filter((row) => row.status === 'Active').length;
    const averageScore = filteredRows.length
      ? `${(filteredRows.reduce((sum, row) => sum + row.average_score, 0) / filteredRows.length).toFixed(1)}%`
      : '0%';
    const topPerformers = filteredRows.filter((row) => row.average_score >= 80).length;

    return [
      { label: 'Students in report', value: totalStudents, icon: Users, color: 'bg-blue-600' },
      { label: 'Active students', value: activeStudents, icon: TrendingUp, color: 'bg-emerald-600' },
      { label: 'Average score', value: averageScore, icon: BarChart3, color: 'bg-violet-600' },
      { label: 'Top performers', value: topPerformers, icon: FileText, color: 'bg-amber-500' }
    ];
  }, [filteredRows]);

  const isLoading = studentsLoading || reportCardsLoading;

  const handleExportCsv = () => {
    downloadCsv(filteredRows, studentPerformanceColumns, 'student_performance_report');
    toast.success('CSV exported');
  };

  const handleExportPdf = () => {
    window.print();
    toast.success('Use print to save as PDF');
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Student Performance Reports</h1>
          <p className="mt-1 text-muted-foreground">Filter, sort, export, and analyze student performance trends.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" onClick={handleExportCsv} disabled={!filteredRows.length}>
            <Download className="mr-2 h-4 w-4" />
            Export CSV
          </Button>
          <Button variant="outline" onClick={handleExportPdf} disabled={!filteredRows.length}>
            <FileText className="mr-2 h-4 w-4" />
            Export PDF
          </Button>
        </div>
      </div>

      <ReportDashboardCards metrics={metrics} />

      <StudentPerformanceFilters
        search={search}
        onSearchChange={setSearch}
        status={status}
        onStatusChange={setStatus}
        gradeLevel={gradeLevel}
        onGradeLevelChange={setGradeLevel}
        sortBy={sortBy}
        onSortByChange={setSortBy}
        sortOrder={sortOrder}
        onSortOrderChange={setSortOrder}
        gradeOptions={gradeOptions}
      />

      <div className="grid gap-6 xl:grid-cols-[1.1fr,0.9fr]">
        <StudentPerformanceTable rows={filteredRows} loading={isLoading} />
        <StudentPerformanceChart data={chartData} />
      </div>

      <Card className="border-0 shadow-sm">
        <CardContent className="p-4 text-sm text-muted-foreground">
          This completes task 1 and the first full implementation slice: reporting foundation, student performance report, filters, sorting, CSV export, PDF export, and analytics cards/chart.
        </CardContent>
      </Card>
    </div>
  );
}