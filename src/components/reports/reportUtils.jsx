import { format } from 'date-fns';

export function downloadCsv(data, columns, filename) {
  const headers = columns.map((column) => column.label);
  const rows = data.map((row) =>
    columns.map((column) => {
      const value = row[column.key];
      if (value === null || value === undefined) return '';
      const stringValue = String(value).replace(/"/g, '""');
      return /[",\n]/.test(stringValue) ? `"${stringValue}"` : stringValue;
    })
  );

  const csv = [headers.join(','), ...rows.map((row) => row.join(','))].join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `${filename}_${format(new Date(), 'yyyy-MM-dd')}.csv`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export function getStudentPerformanceRows(students, reportCards) {
  return students.map((student) => {
    const studentReports = reportCards.filter((report) => report.student_id === student.id);
    const latestReport = studentReports[0];
    const averageScore = studentReports.length
      ? Number((studentReports.reduce((sum, report) => sum + (report.average_score || 0), 0) / studentReports.length).toFixed(1))
      : 0;

    return {
      id: student.id,
      student_name: `${student.first_name || ''} ${student.last_name || ''}`.trim(),
      student_id_number: student.student_id_number || '—',
      grade_level: student.grade_level || '—',
      status: student.status || '—',
      average_score: averageScore,
      latest_grade: latestReport?.grade || '—',
      report_count: studentReports.length,
      last_updated: latestReport?.updated_date || latestReport?.created_date || student.updated_date || student.created_date || ''
    };
  });
}

export function sortRows(rows, sortBy, sortOrder) {
  return [...rows].sort((a, b) => {
    const aValue = a[sortBy];
    const bValue = b[sortBy];

    if (typeof aValue === 'number' && typeof bValue === 'number') {
      return sortOrder === 'asc' ? aValue - bValue : bValue - aValue;
    }

    return sortOrder === 'asc'
      ? String(aValue ?? '').localeCompare(String(bValue ?? ''))
      : String(bValue ?? '').localeCompare(String(aValue ?? ''));
  });
}