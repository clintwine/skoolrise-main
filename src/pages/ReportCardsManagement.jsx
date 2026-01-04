import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search, Plus, FileText, Download } from 'lucide-react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '../utils';

export default function ReportCardsManagement() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSession, setSelectedSession] = useState('');

  const { data: sessions = [] } = useQuery({
    queryKey: ['academic-sessions'],
    queryFn: () => base44.entities.AcademicSession.list('-created_date'),
  });

  // Auto-select most recent/current session
  useEffect(() => {
    if (sessions.length > 0 && !selectedSession) {
      const currentSession = sessions.find(s => s.is_current) || sessions[0];
      setSelectedSession(currentSession?.id || '');
    }
  }, [sessions, selectedSession]);

  const { data: reportCards = [], isLoading } = useQuery({
    queryKey: ['report-cards', selectedSession],
    queryFn: async () => {
      if (selectedSession) {
        return await base44.entities.ReportCard.filter({ session_id: selectedSession }, '-created_date');
      }
      return await base44.entities.ReportCard.list('-created_date');
    },
  });

  const filteredReports = reportCards.filter((report) =>
    report.student_name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const statusColors = {
    Draft: 'bg-gray-100 text-gray-800',
    Published: 'bg-green-100 text-green-800',
    Sent: 'bg-blue-100 text-blue-800',
  };

  const currentSession = sessions.find(s => s.id === selectedSession);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Report Cards</h1>
          <p className="text-gray-600 mt-1">Manage student report cards and transcripts</p>
        </div>
        <Link to={createPageUrl('CreateReportCard')}>
          <Button className="bg-blue-600 hover:bg-blue-700">
            <Plus className="w-4 h-4 mr-2" />
            Create Report Card
          </Button>
        </Link>
      </div>

      <Card className="bg-white shadow-md">
        <CardContent className="p-4">
          <div className="flex flex-wrap gap-4 items-end">
            <div className="flex-1 min-w-[200px]">
              <Label className="text-xs text-gray-500">Search</Label>
              <div className="relative mt-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <Input
                  placeholder="Search by student name..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="w-64">
              <Label className="text-xs text-gray-500">Academic Session</Label>
              <Select value={selectedSession} onValueChange={setSelectedSession}>
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Select session" />
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
          {currentSession && (
            <div className="mt-3">
              <Badge className="bg-blue-100 text-blue-800">
                Showing: {currentSession.session_name}
              </Badge>
            </div>
          )}
        </CardContent>
      </Card>

      {isLoading ? (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
        </div>
      ) : (
        <Card className="bg-white shadow-md">
          <CardContent className="p-0">
            {filteredReports.length === 0 ? (
              <div className="text-center py-12">
                <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500">No report cards found for the selected criteria</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Student</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Class</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Average Score</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Grade</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Position</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {filteredReports.map((report) => (
                      <tr key={report.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 text-sm font-medium text-gray-900">{report.student_name}</td>
                        <td className="px-6 py-4 text-sm text-gray-600">Grade {report.class_id}</td>
                        <td className="px-6 py-4 text-sm text-gray-900">{report.average_score}%</td>
                        <td className="px-6 py-4 text-sm font-semibold text-blue-600">{report.grade}</td>
                        <td className="px-6 py-4 text-sm text-gray-900">{report.position}</td>
                        <td className="px-6 py-4">
                          <Badge className={statusColors[report.status]}>
                            {report.status}
                          </Badge>
                        </td>
                        <td className="px-6 py-4 flex gap-2">
                          <Link to={createPageUrl(`ReportCardView?id=${report.id}`)}>
                            <Button variant="outline" size="sm">
                              <FileText className="w-4 h-4 mr-1" />
                              View
                            </Button>
                          </Link>
                          <Button variant="outline" size="sm">
                            <Download className="w-4 h-4 mr-1" />
                            PDF
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}