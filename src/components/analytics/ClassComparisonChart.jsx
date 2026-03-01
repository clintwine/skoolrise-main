import React from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar } from 'recharts';
import { TrendingUp } from 'lucide-react';

export default function ClassComparisonChart() {
  const { data: classArms = [] } = useQuery({
    queryKey: ['class-arms-comparison'],
    queryFn: () => base44.entities.ClassArm.list(),
  });

  const { data: attendance = [] } = useQuery({
    queryKey: ['attendance-comparison'],
    queryFn: () => base44.entities.Attendance.list('-date', 2000),
  });

  const { data: reportCards = [] } = useQuery({
    queryKey: ['reports-comparison'],
    queryFn: () => base44.entities.ReportCard.list(),
  });

  const { data: behaviors = [] } = useQuery({
    queryKey: ['behaviors-comparison'],
    queryFn: () => base44.entities.Behavior.list(),
  });

  // Calculate metrics per class
  const classMetrics = classArms.slice(0, 8).map(classArm => {
    const classAttendance = attendance.filter(a => a.class_arm_id === classArm.id);
    const presentCount = classAttendance.filter(a => a.status === 'Present').length;
    const attendanceRate = classAttendance.length > 0 
      ? Math.round((presentCount / classAttendance.length) * 100)
      : 0;

    const classReports = reportCards.filter(rc => rc.class_arm_id === classArm.id);
    const avgScore = classReports.length > 0
      ? Math.round(classReports.reduce((sum, rc) => sum + (rc.average_score || 0), 0) / classReports.length)
      : 0;

    const classBehaviors = behaviors.filter(b => b.class_arm_id === classArm.id);
    const merits = classBehaviors.filter(b => b.type === 'Merit').length;
    const demerits = classBehaviors.filter(b => b.type === 'Demerit').length;
    const behaviorScore = Math.max(0, Math.min(100, 70 + (merits * 2) - (demerits * 5)));

    return {
      name: `${classArm.grade_level}${classArm.arm_name}`,
      attendance: attendanceRate,
      performance: avgScore,
      behavior: behaviorScore,
    };
  });

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-blue-500" />
          Class Comparison
        </CardTitle>
      </CardHeader>
      <CardContent>
        {classMetrics.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <p>No class data available</p>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={classMetrics}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" fontSize={12} />
              <YAxis domain={[0, 100]} fontSize={12} />
              <Tooltip />
              <Legend />
              <Bar dataKey="attendance" fill="#10B981" name="Attendance %" />
              <Bar dataKey="performance" fill="#3B82F6" name="Performance %" />
              <Bar dataKey="behavior" fill="#8B5CF6" name="Behavior Score" />
            </BarChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
}