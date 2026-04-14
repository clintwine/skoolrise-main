import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Search, Plus, Eye, Edit, Users, FileText, Clock, BookOpen } from 'lucide-react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '../utils';
import { format } from 'date-fns';
import useIsMobile from '../components/hooks/useIsMobile';
import MobileHeader from '../components/mobile/MobileHeader';
import MobileTable, { MobileTableRow } from '../components/mobile/MobileTable';
import MobileTabs from '../components/mobile/MobileTabs';

export default function ExamManagement() {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');

  const { data: user } = useQuery({
    queryKey: ['current-user'],
    queryFn: () => base44.auth.me(),
  });

  const { data: teachers = [] } = useQuery({
    queryKey: ['teachers', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      return await base44.entities.Teacher.filter({ user_id: user.id });
    },
    enabled: !!user?.id,
  });

  const teacherProfile = teachers[0];
  const isAdmin = user?.role === 'admin' || user?.user_type === 'admin';

  const { data: allExams = [], isLoading } = useQuery({
    queryKey: ['exams'],
    queryFn: () => base44.entities.Exam.list('-created_date'),
  });

  // Filter exams: admins see all, teachers see only their own
  const exams = isAdmin ? allExams : allExams.filter(e => e.created_by === user?.email || e.teacher_id === teacherProfile?.id);

  const { data: attempts = [] } = useQuery({
    queryKey: ['exam-attempts'],
    queryFn: () => base44.entities.ExamAttempt.list(),
  });

  const filteredExams = exams.filter(exam => {
    const matchesSearch = exam.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         exam.subject?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === 'all' || exam.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  const statusColors = {
    Draft: 'bg-gray-100 text-gray-800',
    Published: 'bg-blue-100 text-blue-800',
    Active: 'bg-green-100 text-green-800',
    Completed: 'bg-purple-100 text-purple-800',
    Closed: 'bg-red-100 text-red-800',
  };

  const getExamStats = (examId) => {
    const examAttempts = attempts.filter(a => a.exam_id === examId);
    const completed = examAttempts.filter(a => a.status === 'Submitted' || a.status === 'Graded').length;
    const inProgress = examAttempts.filter(a => a.status === 'In Progress').length;
    return { total: examAttempts.length, completed, inProgress };
  };

  const isMobile = useIsMobile();

  const statusTabs = [
    { id: 'all', label: 'All', count: exams.length },
    { id: 'Draft', label: 'Draft', count: exams.filter(e => e.status === 'Draft').length },
    { id: 'Published', label: 'Published', count: exams.filter(e => e.status === 'Published').length },
    { id: 'Active', label: 'Active', count: exams.filter(e => e.status === 'Active').length },
    { id: 'Completed', label: 'Done', count: exams.filter(e => e.status === 'Completed').length },
  ];

  // Mobile View
  if (isMobile) {
    return (
      <div className="p-4 pb-24 space-y-4">
        <MobileHeader
          title="Exams"
          subtitle="Manage exams & grades"
          showSearch
          searchValue={searchTerm}
          onSearchChange={setSearchTerm}
          actions={
            <Link to={createPageUrl('ExamCreator')}>
              <Button size="sm" className="bg-blue-600 hover:bg-blue-700">
                <Plus className="w-4 h-4" />
              </Button>
            </Link>
          }
        />

        <MobileTabs tabs={statusTabs} activeTab={filterStatus} onTabChange={setFilterStatus} />

        <div className="grid grid-cols-2 gap-3">
          <Card><CardContent className="p-4 text-center"><p className="text-2xl font-bold text-blue-600">{filteredExams.length}</p><p className="text-xs text-gray-600">Visible Exams</p></CardContent></Card>
          <Card><CardContent className="p-4 text-center"><p className="text-2xl font-bold text-green-600">{exams.filter(e => e.status === 'Active').length}</p><p className="text-xs text-gray-600">Active</p></CardContent></Card>
        </div>

        <MobileTable
          data={filteredExams}
          loading={isLoading}
          emptyMessage="No exams found"
          renderItem={(exam) => {
            const stats = getExamStats(exam.id);
            return (
              <MobileTableRow
                key={exam.id}
                primary={exam.title}
                secondary={`${exam.subject} • ${exam.class_name}`}
                tertiary={`${exam.duration_minutes} min • ${stats.total} attempts`}
                badge={exam.status}
                badgeVariant={exam.status === 'Active' ? 'default' : 'secondary'}
                icon={BookOpen}
                onClick={() => window.location.href = createPageUrl(`GradeExam?id=${exam.id}`)}
                actions={[
                  { label: 'Grade', icon: Eye, onClick: () => window.location.href = createPageUrl(`GradeExam?id=${exam.id}`) },
                  { label: 'Results', icon: FileText, onClick: () => window.location.href = createPageUrl(`ExamResults?id=${exam.id}`) },
                ]}
              />
            );
          }}
        />
      </div>
    );
  }

  // Desktop View
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Exam Management</h1>
          <p className="text-gray-600 mt-1">Manage exams, view attempts, and grade submissions</p>
        </div>
        <Link to={createPageUrl('ExamCreator')}>
          <Button className="bg-blue-600 hover:bg-blue-700">
            <Plus className="w-4 h-4 mr-2" />
            Create Exam
          </Button>
        </Link>
      </div>

      <Card className="bg-white shadow-md">
        <CardContent className="p-4">
          <div className="flex gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <Input
                placeholder="Search exams..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-4 py-2 border rounded-lg"
            >
              <option value="all">All Status</option>
              <option value="Draft">Draft</option>
              <option value="Published">Published</option>
              <option value="Active">Active</option>
              <option value="Completed">Completed</option>
              <option value="Closed">Closed</option>
            </select>
          </div>
        </CardContent>
      </Card>

      {isLoading ? (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {filteredExams.map((exam) => {
            const stats = getExamStats(exam.id);
            return (
              <Card key={exam.id} className="bg-white shadow-md hover:shadow-lg transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-xl font-bold text-gray-900">{exam.title}</h3>
                        <Badge className={statusColors[exam.status]}>{exam.status}</Badge>
                        <Badge variant="outline">{exam.exam_type}</Badge>
                      </div>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
                        <div>
                          <p className="text-sm text-gray-600">Subject</p>
                          <p className="font-semibold">{exam.subject}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600">Class</p>
                          <p className="font-semibold">{exam.class_name}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600">Duration</p>
                          <p className="font-semibold">{exam.duration_minutes} min</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600">Total Points</p>
                          <p className="font-semibold">{exam.total_points}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-6 mt-4 text-sm">
                        <div className="flex items-center gap-2">
                          <Users className="w-4 h-4 text-blue-600" />
                          <span>{stats.total} attempts</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <FileText className="w-4 h-4 text-green-600" />
                          <span>{stats.completed} completed</span>
                        </div>
                        {stats.inProgress > 0 && (
                          <div className="flex items-center gap-2">
                            <FileText className="w-4 h-4 text-orange-600" />
                            <span>{stats.inProgress} in progress</span>
                          </div>
                        )}
                      </div>
                      {exam.start_date && (
                        <p className="text-sm text-gray-600 mt-2">
                          Start: {format(new Date(exam.start_date), 'MMM d, yyyy HH:mm')}
                        </p>
                      )}
                    </div>
                    <div className="flex flex-col gap-2 ml-4">
                      <Link to={createPageUrl(`GradeExam?id=${exam.id}`)}>
                        <Button variant="outline" size="sm" className="w-full">
                          <Eye className="w-4 h-4 mr-2" />
                          Grade
                        </Button>
                      </Link>
                      <Link to={createPageUrl(`ExamResults?id=${exam.id}`)}>
                        <Button variant="outline" size="sm" className="w-full">
                          <FileText className="w-4 h-4 mr-2" />
                          Results
                        </Button>
                      </Link>
                      <Link to={createPageUrl(`ExamAnalytics?id=${exam.id}`)}>
                        <Button variant="outline" size="sm" className="w-full">
                          Analytics
                        </Button>
                      </Link>
                      <Link to={createPageUrl(`ProctoringAnalytics?id=${exam.id}`)}>
                        <Button variant="outline" size="sm" className="w-full text-orange-600 border-orange-300">
                          Proctoring
                        </Button>
                      </Link>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}