import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle } from 'lucide-react';

export default function AcademicRiskBoard({ students = [] }) {
  return (
    <Card className="bg-white border-0 shadow-md">
      <CardHeader className="p-4 sm:p-6">
        <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
          <AlertTriangle className="w-5 h-5 text-orange-600" />
          Academic Risk Alerts
        </CardTitle>
      </CardHeader>
      <CardContent className="p-4 sm:p-6 pt-0 space-y-3">
        {students.length === 0 ? (
          <p className="text-sm text-gray-500">No at-risk students detected right now.</p>
        ) : (
          students.map((student) => (
            <div key={student.id} className="rounded-xl border border-gray-200 p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-semibold text-gray-900">{student.student_name}</p>
                  <p className="text-sm text-gray-600">{student.reason}</p>
                  <p className="text-xs text-gray-500 mt-1">Attendance: {student.attendanceRate}% · Average score: {student.averageScore}% · Outstanding: {student.outstandingBalance} · Signals: {student.riskSignals}</p>
                  {student.recommendedAction && (
                    <p className="text-xs font-medium text-blue-700 mt-2">Suggested next step: {student.recommendedAction}</p>
                  )}
                </div>
                <Badge className={student.riskLevel === 'High' ? 'bg-red-100 text-red-700' : 'bg-orange-100 text-orange-700'}>
                  {student.riskLevel} Risk
                </Badge>
              </div>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
}