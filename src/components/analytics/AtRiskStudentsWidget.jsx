import React from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertTriangle, TrendingDown, Calendar, BookOpen, ChevronRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '../../utils';
import { Badge } from '@/components/ui/badge';

export default function AtRiskStudentsWidget() {
  const { data: students = [] } = useQuery({
    queryKey: ['students-at-risk'],
    queryFn: () => base44.entities.Student.filter({ status: 'Active' }),
  });

  const { data: attendance = [] } = useQuery({
    queryKey: ['attendance-at-risk'],
    queryFn: () => base44.entities.Attendance.list('-date', 1000),
  });

  const { data: reportCards = [] } = useQuery({
    queryKey: ['reports-at-risk'],
    queryFn: () => base44.entities.ReportCard.list('-created_date', 500),
  });

  // Calculate at-risk students based on:
  // 1. Attendance rate < 80%
  // 2. Average score < 50%
  // 3. Recent grade drop > 15%
  const atRiskStudents = students.map(student => {
    const studentAttendance = attendance.filter(a => a.student_id === student.id);
    const presentCount = studentAttendance.filter(a => a.status === 'Present' || a.status === 'Late').length;
    const attendanceRate = studentAttendance.length > 0 
      ? (presentCount / studentAttendance.length) * 100 
      : 100;

    const studentReports = reportCards.filter(rc => rc.student_id === student.id);
    const avgScore = studentReports.length > 0
      ? studentReports.reduce((sum, rc) => sum + (rc.average_score || 0), 0) / studentReports.length
      : null;

    // Check for grade drop
    let gradeDrop = 0;
    if (studentReports.length >= 2) {
      const sorted = [...studentReports].sort((a, b) => new Date(b.created_date) - new Date(a.created_date));
      const latest = sorted[0]?.average_score || 0;
      const previous = sorted[1]?.average_score || 0;
      gradeDrop = previous - latest;
    }

    const risks = [];
    if (attendanceRate < 80) risks.push({ type: 'attendance', value: attendanceRate.toFixed(0) });
    if (avgScore !== null && avgScore < 50) risks.push({ type: 'grades', value: avgScore.toFixed(0) });
    if (gradeDrop > 15) risks.push({ type: 'dropping', value: gradeDrop.toFixed(0) });

    return {
      ...student,
      attendanceRate,
      avgScore,
      gradeDrop,
      risks,
      riskLevel: risks.length >= 2 ? 'high' : risks.length === 1 ? 'medium' : 'low',
    };
  }).filter(s => s.risks.length > 0).sort((a, b) => b.risks.length - a.risks.length).slice(0, 5);

  const riskColors = {
    high: 'bg-red-100 text-red-800 border-red-200',
    medium: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    low: 'bg-blue-100 text-blue-800 border-blue-200',
  };

  const riskIcons = {
    attendance: Calendar,
    grades: BookOpen,
    dropping: TrendingDown,
  };

  return (
    <Card className="border-red-200 bg-gradient-to-br from-red-50 to-orange-50">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-red-700">
          <AlertTriangle className="w-5 h-5" />
          Students at Risk
          {atRiskStudents.length > 0 && (
            <Badge className="bg-red-500 ml-2">{atRiskStudents.length}</Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {atRiskStudents.length === 0 ? (
          <div className="text-center py-6 text-gray-500">
            <AlertTriangle className="w-10 h-10 mx-auto mb-2 text-gray-300" />
            <p className="text-sm">No at-risk students detected</p>
            <p className="text-xs text-gray-400 mt-1">Great job! All students are on track</p>
          </div>
        ) : (
          <div className="space-y-3">
            {atRiskStudents.map((student) => (
              <Link
                key={student.id}
                to={createPageUrl(`StudentRecords?id=${student.id}`)}
                className="block"
              >
                <div className={`p-3 rounded-lg border ${riskColors[student.riskLevel]} hover:shadow-md transition-all`}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      {student.photo_url ? (
                        <img src={student.photo_url} alt="" className="w-10 h-10 rounded-full object-cover" />
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-white/50 flex items-center justify-center font-semibold">
                          {student.first_name?.[0]}{student.last_name?.[0]}
                        </div>
                      )}
                      <div>
                        <p className="font-semibold text-gray-900">
                          {student.first_name} {student.last_name}
                        </p>
                        <p className="text-xs text-gray-600">{student.grade_level}</p>
                      </div>
                    </div>
                    <ChevronRight className="w-5 h-5 text-gray-400" />
                  </div>
                  <div className="flex gap-2 mt-2">
                    {student.risks.map((risk, idx) => {
                      const Icon = riskIcons[risk.type];
                      return (
                        <span key={idx} className="inline-flex items-center gap-1 text-xs px-2 py-1 bg-white/60 rounded-full">
                          <Icon className="w-3 h-3" />
                          {risk.type === 'attendance' && `${risk.value}% attendance`}
                          {risk.type === 'grades' && `${risk.value}% avg`}
                          {risk.type === 'dropping' && `↓${risk.value}% drop`}
                        </span>
                      );
                    })}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}