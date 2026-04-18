import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { useSchoolTenant } from '@/hooks/useSchoolTenant';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search, Plus, FileText, Download, Sparkles } from 'lucide-react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '../utils';
import BulkReportCardGenerator from '../components/reports/BulkReportCardGenerator';
import useIsMobile from '../components/hooks/useIsMobile';
import MobileHeader from '../components/mobile/MobileHeader';
import MobileTable, { MobileTableRow } from '../components/mobile/MobileTable';
import MobileFilterSheet, { MobileFilterSection, MobileFilterChips } from '../components/mobile/MobileFilterSheet';

export default function ReportCardsManagement() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSession, setSelectedSession] = useState('');
  const [bulkGeneratorOpen, setBulkGeneratorOpen] = useState(false);
  const { schoolTenantId, isLoading: tenantLoading } = useSchoolTenant();
  const tenantFilter = schoolTenantId ? { school_tenant_id: schoolTenantId } : {};

  const { data: sessions = [] } = useQuery({
    queryKey: ['academic-sessions', schoolTenantId],
    queryFn: () => schoolTenantId ? base44.entities.AcademicSession.filter(tenantFilter, '-created_date') : base44.entities.AcademicSession.list('-created_date'),
    enabled: !tenantLoading,
  });

  // Auto-select most recent/current session
  useEffect(() => {
    if (sessions.length > 0 && !selectedSession) {
      const currentSession = sessions.find(s => s.is_current) || sessions[0];
      setSelectedSession(currentSession?.id || '');
    }
  }, [sessions, selectedSession]);

  const { data: reportCards = [], isLoading } = useQuery({
    queryKey: ['report-cards', selectedSession, schoolTenantId],
    queryFn: async () => {
      const filter = { ...tenantFilter };
      if (selectedSession) filter.session_id = selectedSession;
      if (Object.keys(filter).length > 0) {
        return await base44.entities.ReportCard.filter(filter, '-created_date');
      }
      return await base44.entities.ReportCard.list('-created_date');
    },
    enabled: !tenantLoading,
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

  const isMobile = useIsMobile();
  const [filterSheetOpen, setFilterSheetOpen] = useState(false);

  // Mobile View
  if (isMobile) {
    return (
      <div className="p-4 pb-24">
        <MobileHeader
          title="Report Cards"
          subtitle="Student transcripts"
          showSearch
          searchValue={searchTerm}
          onSearchChange={setSearchTerm}
          onFilter={() => setFilterSheetOpen(true)}
          actions={
            <div className="flex gap-2">
              <Button size="sm" variant="outline" onClick={() => setBulkGeneratorOpen(true)}>
                <Sparkles className="w-4 h-4" />
              </Button>
              <Link to={createPageUrl('CreateReportCard')}>
                <Button size="sm" className="bg-blue-600 hover:bg-blue-700">
                  <Plus className="w-4 h-4" />
                </Button>
              </Link>
            </div>
          }
        />

        <MobileTable
          data={filteredReports}
          loading={isLoading}
          emptyMessage="No report cards found"
          renderItem={(report) => (
            <MobileTableRow
              key={report.id}
              primary={report.student_name}
              secondary={`Average: ${report.average_score}% • Grade: ${report.grade}`}
              tertiary={`Position: ${report.position || 'N/A'}`}
              badge={report.status}
              badgeVariant={report.status === 'Published' ? 'default' : 'secondary'}
              icon={FileText}
              onClick={() => window.location.href = createPageUrl(`ReportCardView?id=${report.id}`)}
            />
          )}
        />

        <MobileFilterSheet
          open={filterSheetOpen}
          onOpenChange={setFilterSheetOpen}
          activeFiltersCount={selectedSession ? 1 : 0}
          onReset={() => setSelectedSession('')}
        >
          <MobileFilterSection title="Academic Session">
            <MobileFilterChips
              options={[{ value: '', label: 'All' }, ...sessions.map(s => ({ value: s.id, label: s.session_name }))]}
              value={selectedSession}
              onChange={setSelectedSession}
            />
          </MobileFilterSection>
        </MobileFilterSheet>

        <BulkReportCardGenerator 
          open={bulkGeneratorOpen} 
          onOpenChange={setBulkGeneratorOpen} 
        />
      </div>
    );
  }

  // Desktop View
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Report Cards</h1>
          <p className="text-gray-600 mt-1">Manage student report cards and transcripts</p>
        </div>
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            onClick={() => setBulkGeneratorOpen(true)}
            className="border-blue-300 text-blue-700 hover:bg-blue-50"
          >
            <Sparkles className="w-4 h-4 mr-2" />
            Bulk Generate
          </Button>
          <Link to={createPageUrl('CreateReportCard')}>
            <Button className="bg-blue-600 hover:bg-blue-700">
              <Plus className="w-4 h-4 mr-2" />
              Create Report Card
            </Button>
          </Link>
        </div>
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

      <BulkReportCardGenerator 
        open={bulkGeneratorOpen} 
        onOpenChange={setBulkGeneratorOpen} 
      />
    </div>
  );
}