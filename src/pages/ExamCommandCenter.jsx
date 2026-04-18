import React, { useState, useEffect } from 'react';
import { useSchoolContext } from '@/hooks/useSchoolContext';
import { addSchoolFilter } from '@/utils/schoolFilter';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { DashboardSkeleton, ListSkeleton } from '@/components/SkeletonLoader';
import { 
  Plus, FileText, BarChart3, Eye, Edit, Trash2, 
  TrendingUp, Users, CheckCircle, Clock, AlertCircle,
  ClipboardList, Award, Camera
} from 'lucide-react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '../utils';

export default function ExamCommandCenter() {
  const [activeTab, setActiveTab] = useState('manage');
  const [user, setUser] = useState(null);
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  useEffect(() => {
    const fetchUser = async () => {
      const currentUser = await base44.auth.me();
      setUser(currentUser);
    };
    fetchUser();
  }, []);

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
  const { school_tenant_id, isReady } = useSchoolContext();

  const { data: allExams = [], isLoading: examsLoading } = useQuery({
    queryKey: ['exams', school_tenant_id],
    queryFn: () => base44.entities.Exam.filter(addSchoolFilter({}, school_tenant_id), '-created_date'),
    enabled: isReady,
  });

  // Filter exams: admins see all, teachers see only their own
  const exams = isAdmin ? allExams : allExams.filter(e => e.created_by === user?.email || e.teacher_id === teacherProfile?.id);

  const { data: attempts = [], isLoading: attemptsLoading } = useQuery({
    queryKey: ['exam-attempts', school_tenant_id],
    queryFn: () => base44.entities.ExamAttempt.filter(addSchoolFilter({}, school_tenant_id), '-created_date'),
    enabled: isReady,
  });

  const { data: results = [], isLoading: resultsLoading } = useQuery({
    queryKey: ['exam-results', school_tenant_id],
    queryFn: () => base44.entities.ExamResult.filter(addSchoolFilter({}, school_tenant_id)),
    enabled: isReady,
  });

  const deleteExamMutation = useMutation({
    mutationFn: (id) => base44.entities.Exam.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['exams'] }),
  });

  const statsCards = [
    {
      title: 'Total Exams',
      value: exams.length,
      icon: FileText,
      color: 'text-blue-600',
      bg: 'bg-blue-100'
    },
    {
      title: 'Active Exams',
      value: exams.filter(e => e.status === 'Published').length,
      icon: CheckCircle,
      color: 'text-green-600',
      bg: 'bg-green-100'
    },
    {
      title: 'Total Attempts',
      value: attempts.length,
      icon: Users,
      color: 'text-purple-600',
      bg: 'bg-purple-100'
    },
    {
      title: 'Avg Pass Rate',
      value: results.length > 0 
        ? `${((results.filter(r => r.percentage >= 50).length / results.length) * 100).toFixed(0)}%`
        : '0%',
      icon: TrendingUp,
      color: 'text-orange-600',
      bg: 'bg-orange-100'
    },
  ];

  if (examsLoading) {
    return <DashboardSkeleton />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div 
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex justify-between items-start"
      >
        <div>
          <h1 className="text-4xl font-bold text-text">Exam Command Center</h1>
          <p className="text-text-secondary mt-2">Unified hub for creating, managing, and analyzing exams</p>
        </div>
        <Button 
          onClick={() => navigate(createPageUrl('ExamCreator'))}
          className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 rounded-xl shadow-md hover:shadow-lg transition-all duration-200 hover:scale-105 active:scale-95"
        >
          <Plus className="w-5 h-5 mr-2" />
          Create Exam
        </Button>
      </motion.div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {statsCards.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <motion.div
              key={stat.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <Card className="bg-white shadow-md rounded-xl hover:shadow-xl transition-all duration-300 hover:scale-105 cursor-pointer">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-text-secondary font-medium">{stat.title}</p>
                      <p className="text-3xl font-bold text-text mt-1">{stat.value}</p>
                    </div>
                    <div className={`w-14 h-14 ${stat.bg} rounded-xl flex items-center justify-center`}>
                      <Icon className={`w-7 h-7 ${stat.color}`} />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          );
        })}
      </div>

      {/* Tabbed Interface */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-4 bg-white rounded-xl shadow-md p-1">
          <TabsTrigger value="manage" className="rounded-xl data-[state=active]:bg-blue-600 data-[state=active]:text-white">
            <ClipboardList className="w-4 h-4 mr-2" />
            Manage
          </TabsTrigger>
          <TabsTrigger value="results" className="rounded-xl data-[state=active]:bg-blue-600 data-[state=active]:text-white">
            <Award className="w-4 h-4 mr-2" />
            Results
          </TabsTrigger>
          <TabsTrigger value="analytics" className="rounded-xl data-[state=active]:bg-blue-600 data-[state=active]:text-white">
            <BarChart3 className="w-4 h-4 mr-2" />
            Analytics
          </TabsTrigger>
          <TabsTrigger value="proctoring" className="rounded-xl data-[state=active]:bg-blue-600 data-[state=active]:text-white">
            <Camera className="w-4 h-4 mr-2" />
            Proctoring
          </TabsTrigger>
        </TabsList>

        {/* Manage Tab */}
        <TabsContent value="manage" className="space-y-4">
          {examsLoading ? (
            <ListSkeleton count={5} />
          ) : exams.length === 0 ? (
            <Card className="bg-white rounded-xl shadow-md">
              <CardContent className="p-16 text-center">
                <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <FileText className="w-12 h-12 text-gray-400" />
                </div>
                <h3 className="text-2xl font-semibold text-text mb-2">No exams yet</h3>
                <p className="text-text-secondary mb-6">Create your first exam to get started</p>
                <Button 
                  onClick={() => navigate(createPageUrl('ExamCreator'))}
                  className="bg-blue-600 hover:bg-blue-700 text-white"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Create First Exam
                </Button>
              </CardContent>
            </Card>
          ) : (
            exams.map((exam, index) => (
              <motion.div
                key={exam.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <Card className="bg-white shadow-md rounded-xl hover:shadow-xl transition-all duration-300 hover:scale-102">
                  <CardContent className="p-6">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="text-xl font-semibold text-text">{exam.title}</h3>
                          <Badge className={
                            exam.status === 'Published' ? 'bg-green-100 text-green-800' :
                            exam.status === 'Draft' ? 'bg-yellow-100 text-yellow-800' :
                            'bg-gray-100 text-gray-800'
                          }>
                            {exam.status}
                          </Badge>
                          {exam.enable_proctoring && (
                            <Badge className="bg-purple-100 text-purple-800">
                              <Camera className="w-3 h-3 mr-1" />
                              Proctored
                            </Badge>
                          )}
                        </div>
                        <p className="text-text-secondary mb-3">{exam.subject} • {exam.exam_type}</p>
                        <div className="flex items-center gap-6 text-sm text-text-secondary">
                          <span className="flex items-center gap-1">
                            <Clock className="w-4 h-4" />
                            {exam.duration_minutes} min
                          </span>
                          <span className="flex items-center gap-1">
                            <FileText className="w-4 h-4" />
                            {exam.total_points} points
                          </span>
                          <span className="flex items-center gap-1">
                            <Users className="w-4 h-4" />
                            {attempts.filter(a => a.exam_id === exam.id).length} attempts
                          </span>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => navigate(createPageUrl(`ExamCreator?id=${exam.id}`))}
                          className="rounded-xl hover:scale-105 transition-transform"
                          title="Edit Exam"
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => navigate(createPageUrl(`ExamCreator?id=${exam.id}&view=true`))}
                          className="rounded-xl hover:scale-105 transition-transform"
                          title="View Exam"
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => {
                            if (confirm('Delete this exam?')) deleteExamMutation.mutate(exam.id);
                          }}
                          className="rounded-xl hover:scale-105 transition-transform"
                        >
                          <Trash2 className="w-4 h-4 text-red-600" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))
          )}
        </TabsContent>

        {/* Results Tab */}
        <TabsContent value="results" className="space-y-4">
          {resultsLoading ? (
            <ListSkeleton count={5} />
          ) : results.length === 0 ? (
            <Card className="bg-white rounded-xl shadow-md">
              <CardContent className="p-16 text-center">
                <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Award className="w-12 h-12 text-gray-400" />
                </div>
                <h3 className="text-2xl font-semibold text-text mb-2">No results yet</h3>
                <p className="text-text-secondary">Results will appear here after students complete exams</p>
              </CardContent>
            </Card>
          ) : (
            <Card className="bg-white rounded-xl shadow-md">
              <CardHeader>
                <CardTitle>Recent Results</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {results.slice(0, 20).map((result) => (
                    <div key={result.id} className="flex justify-between items-center p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors">
                      <div>
                        <p className="font-semibold text-text">{result.student_name}</p>
                        <p className="text-sm text-text-secondary">{result.subject} • {result.exam_type}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-2xl font-bold text-text">{result.percentage.toFixed(1)}%</p>
                        <p className="text-sm text-text-secondary">{result.score} points</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Analytics Tab */}
        <TabsContent value="analytics">
          <Card className="bg-white rounded-xl shadow-md">
            <CardContent className="p-16 text-center">
              <BarChart3 className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-text mb-2">Analytics Coming Soon</h3>
              <p className="text-text-secondary">Detailed performance analytics and insights</p>
              <Button 
                onClick={() => navigate(createPageUrl('DetailedExamAnalytics'))}
                className="mt-4 bg-accent hover:bg-accent-hover text-white"
              >
                View Detailed Analytics
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Proctoring Tab */}
        <TabsContent value="proctoring">
          <Card className="bg-white rounded-xl shadow-md">
            <CardContent className="p-16 text-center">
              <Camera className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-text mb-2">Proctoring Monitor</h3>
              <p className="text-text-secondary">Review proctoring logs and flagged attempts</p>
              <Button 
                onClick={() => navigate(createPageUrl('ProctoringMonitor'))}
                className="mt-4 bg-accent hover:bg-accent-hover text-white"
              >
                Open Proctoring Monitor
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}