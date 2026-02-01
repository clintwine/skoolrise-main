import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { DashboardSkeleton } from '@/components/SkeletonLoader';
import { 
  Users, GraduationCap, DollarSign, FileText, 
  Calendar, Award, ChevronRight, TrendingUp,
  CheckCircle, Clock, AlertCircle
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import { createPageUrl } from '../utils';
import { useCurrency } from '@/components/CurrencyProvider';

export default function ParentPortal() {
  const [user, setUser] = useState(null);
  const [studentIds, setStudentIds] = useState([]);
  const [expandedCard, setExpandedCard] = useState(null);
  const { formatAmount } = useCurrency();

  useEffect(() => {
    const fetchUser = async () => {
      const currentUser = await base44.auth.me();
      setUser(currentUser);
    };
    fetchUser();
  }, []);

  const { data: parents = [], isLoading: parentsLoading } = useQuery({
    queryKey: ['parents', user?.id, user?.parent_profile_id, user?.email],
    queryFn: async () => {
      if (!user?.id) return [];
      
      // 1. Use profile_id from User first
      if (user.parent_profile_id) {
        try {
          const parent = await base44.entities.Parent.get(user.parent_profile_id);
          if (parent) {
            console.log('Found parent by profile_id:', parent);
            return [parent];
          }
        } catch (e) {
          console.log('Error fetching parent by profile_id:', e);
        }
      }
      
      // 2. Try by user_id on Parent entity
      const allParents = await base44.entities.Parent.list();
      const byUserId = allParents.filter(p => p.user_id === user.id);
      if (byUserId.length > 0) {
        console.log('Found parent by user_id:', byUserId[0]);
        return byUserId;
      }
      
      // 3. Fallback: find parent by matching email from student's parent_email
      const allStudents = await base44.entities.Student.list();
      
      // Find students where parent_email matches current user's email
      const matchedStudents = allStudents.filter(s => 
        s.parent_email?.toLowerCase() === user.email?.toLowerCase()
      );
      
      if (matchedStudents.length > 0 && matchedStudents[0].parent_id) {
        const parentById = allParents.find(p => p.id === matchedStudents[0].parent_id);
        if (parentById) {
          console.log('Found parent by student parent_email match:', parentById);
          return [parentById];
        }
      }
      
      console.log('No parent found for user:', user.id, user.email);
      return [];
    },
    enabled: !!user?.id,
  });

  const parentProfile = parents[0];

  const { data: students = [], isLoading: studentsLoading } = useQuery({
    queryKey: ['parent-students', parentProfile?.id, parentProfile?.linked_student_ids, user?.email, user?.id],
    queryFn: async () => {
      // With updated RLS, students should be filtered automatically by:
      // - parent_id matching user.linked_parent_id
      // - parent_email matching user.email
      const allStudents = await base44.entities.Student.list();
      
      // Additionally filter by linked_student_ids from parent profile
      const studentIdSet = new Set();
      
      // Add all students returned (RLS already filters)
      allStudents.forEach(s => studentIdSet.add(s.id));
      
      // Also include linked_student_ids from parent profile
      if (parentProfile?.linked_student_ids) {
        try {
          const linkedIds = JSON.parse(parentProfile.linked_student_ids);
          if (Array.isArray(linkedIds)) {
            linkedIds.forEach(id => {
              if (id) studentIdSet.add(id);
            });
          }
        } catch (e) {
          console.error('Error parsing linked_student_ids:', e);
        }
      }
      
      // Find students with parent_id matching this parent
      if (parentProfile?.id) {
        allStudents.forEach(s => {
          if (s.parent_id === parentProfile.id) {
            studentIdSet.add(s.id);
          }
        });
      }
      
      // Find students where parent_email matches current user's email
      if (user?.email) {
        allStudents.forEach(s => {
          if (s.parent_email?.toLowerCase() === user.email.toLowerCase()) {
            studentIdSet.add(s.id);
          }
        });
      }
      
      const foundStudents = allStudents.filter(s => studentIdSet.has(s.id));
      console.log('Found students for parent:', foundStudents.length, 'students returned by API:', allStudents.length);
      return foundStudents;
    },
    enabled: !!user?.id && !!parentProfile,
  });

  useEffect(() => {
    if (students.length > 0) {
      setStudentIds(students.map(s => s.id));
    }
  }, [students]);

  const { data: invoices = [] } = useQuery({
    queryKey: ['parent-invoices', studentIds],
    queryFn: async () => {
      if (studentIds.length === 0) return [];
      const allInvoices = await base44.entities.FeeInvoice.list();
      return allInvoices.filter(inv => studentIds.includes(inv.student_id));
    },
    enabled: studentIds.length > 0,
  });

  const { data: attendance = [] } = useQuery({
    queryKey: ['parent-attendance', studentIds],
    queryFn: async () => {
      if (studentIds.length === 0) return [];
      const allAttendance = await base44.entities.Attendance.list();
      return allAttendance.filter(att => studentIds.includes(att.student_id));
    },
    enabled: studentIds.length > 0,
  });

  const { data: reportCards = [] } = useQuery({
    queryKey: ['parent-reports', studentIds],
    queryFn: async () => {
      if (studentIds.length === 0) return [];
      const allReports = await base44.entities.ReportCard.list();
      return allReports.filter(rep => studentIds.includes(rep.student_id));
    },
    enabled: studentIds.length > 0,
  });

  const { data: behaviors = [] } = useQuery({
    queryKey: ['parent-behaviors', studentIds],
    queryFn: async () => {
      if (studentIds.length === 0) return [];
      const allBehaviors = await base44.entities.Behavior.list();
      return allBehaviors.filter(beh => studentIds.includes(beh.student_id));
    },
    enabled: studentIds.length > 0,
  });

  const totalOutstanding = invoices.reduce((sum, inv) => sum + (inv.balance || 0), 0);
  const overdueInvoices = invoices.filter(inv => inv.status === 'Overdue');
  const attendanceRate = attendance.length > 0 
    ? ((attendance.filter(a => a.status === 'Present').length / attendance.length) * 100).toFixed(1)
    : '0';
  const recentBehaviors = behaviors.slice(0, 5);

  if (parentsLoading || studentsLoading) {
    return <DashboardSkeleton />;
  }

  const dashboardCards = [
    {
      id: 'fees',
      title: 'Fees & Payments',
      icon: DollarSign,
      color: 'text-orange-600',
      bg: 'bg-orange-100',
      value: formatAmount(totalOutstanding),
      subtitle: `${overdueInvoices.length} overdue`,
      alert: overdueInvoices.length > 0,
    },
    {
      id: 'attendance',
      title: 'Attendance',
      icon: CheckCircle,
      color: 'text-green-600',
      bg: 'bg-green-100',
      value: `${attendanceRate}%`,
      subtitle: `${attendance.length} records`,
    },
    {
      id: 'reports',
      title: 'Report Cards',
      icon: FileText,
      color: 'text-blue-600',
      bg: 'bg-blue-100',
      value: reportCards.length,
      subtitle: 'Available reports',
    },
    {
      id: 'behavior',
      title: 'Behavior',
      icon: Award,
      color: 'text-purple-600',
      bg: 'bg-purple-100',
      value: behaviors.length,
      subtitle: 'Total records',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <h1 className="text-4xl font-bold text-text">Parent Portal</h1>
        <p className="text-text-secondary mt-2">Welcome, {user?.full_name}</p>
      </motion.div>

      {/* My Children Section */}
      <div>
        <h2 className="text-2xl font-semibold text-text mb-4">My Children</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {students.length === 0 ? (
            <Card className="col-span-full bg-white rounded-2xl shadow-md">
              <CardContent className="p-12 text-center">
                <Users className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-text mb-2">No Children Linked</h3>
                <p className="text-text-secondary mb-4">Link your children to view their information</p>
                <Link to={createPageUrl('ParentLinkingRequests')}>
                  <Button className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 text-base">
                    Link Student
                  </Button>
                </Link>
              </CardContent>
            </Card>
          ) : (
            students.map((student) => (
              <motion.div
                key={student.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <Link to={createPageUrl('ParentStudentView')}>
                  <Card className="bg-white shadow-md rounded-2xl hover:shadow-xl transition-all duration-300 hover:scale-105 cursor-pointer">
                    <CardHeader>
                      <div className="flex items-center gap-3">
                        <div className="w-14 h-14 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center">
                          <GraduationCap className="w-7 h-7 text-white" />
                        </div>
                        <div>
                          <CardTitle className="text-lg">
                            {student.first_name} {student.last_name}
                          </CardTitle>
                          <p className="text-sm text-text-secondary">Grade {student.grade_level}</p>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-text-secondary">Student ID:</span>
                          <span className="font-medium text-text">{student.student_id_number}</span>
                        </div>
                        <Badge className={
                          student.status === 'Active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                        }>
                          {student.status}
                        </Badge>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              </motion.div>
            ))
          )}
        </div>
      </div>

      {/* Dashboard Cards with Expandable Details */}
      <div>
        <h2 className="text-2xl font-semibold text-text mb-4">Overview</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {dashboardCards.map((card) => {
            const Icon = card.icon;
            return (
              <motion.div
                key={card.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <Card 
                  className="bg-white shadow-md rounded-2xl hover:shadow-xl transition-all duration-300 hover:scale-105 cursor-pointer"
                  onClick={() => setExpandedCard(card.id)}
                >
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className={`w-12 h-12 ${card.bg} rounded-xl flex items-center justify-center`}>
                        <Icon className={`w-6 h-6 ${card.color}`} />
                      </div>
                      <ChevronRight className="w-5 h-5 text-gray-400" />
                    </div>
                    <h3 className="text-sm font-medium text-text-secondary mb-1">{card.title}</h3>
                    <p className="text-3xl font-bold text-text mb-1">{card.value}</p>
                    <p className="text-sm text-text-secondary flex items-center gap-1">
                      {card.alert && <AlertCircle className="w-4 h-4 text-orange-600" />}
                      {card.subtitle}
                    </p>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* Expanded Card Dialogs */}
      {/* Expanded Card Dialogs - Render one at a time without AnimatePresence */}
        {/* Fees Dialog */}
        <Dialog open={expandedCard === 'fees'} onOpenChange={() => setExpandedCard(null)}>
          <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <DollarSign className="w-6 h-6 text-orange-600" />
                Fees & Payments
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4 mt-4">
              {invoices.length === 0 ? (
                <p className="text-center text-text-secondary py-8">No invoices found</p>
              ) : (
                invoices.map((invoice) => (
                  <div key={invoice.id} className="p-4 border rounded-xl hover:bg-gray-50 transition-colors">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <p className="font-semibold text-text">{invoice.student_name}</p>
                        <p className="text-sm text-text-secondary">Invoice #{invoice.invoice_number}</p>
                      </div>
                      <Badge className={
                        invoice.status === 'Paid' ? 'bg-green-100 text-green-800' :
                        invoice.status === 'Overdue' ? 'bg-red-100 text-red-800' :
                        'bg-yellow-100 text-yellow-800'
                      }>
                        {invoice.status}
                      </Badge>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-text-secondary">
                        Due: {new Date(invoice.due_date).toLocaleDateString()}
                      </span>
                      <span className="text-lg font-bold text-text">
                        {formatAmount(invoice.balance)}
                      </span>
                    </div>
                  </div>
                ))
              )}
              <Button 
                onClick={() => window.location.href = createPageUrl('ParentFees')}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white"
              >
                View All Invoices
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Attendance Dialog */}
        <Dialog open={expandedCard === 'attendance'} onOpenChange={() => setExpandedCard(null)}>
          <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <CheckCircle className="w-6 h-6 text-green-600" />
                Attendance Records
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4 mt-4">
              <div className="grid grid-cols-3 gap-4 mb-6">
                <div className="text-center p-4 bg-green-50 rounded-xl">
                  <p className="text-3xl font-bold text-green-600">
                    {attendance.filter(a => a.status === 'Present').length}
                  </p>
                  <p className="text-sm text-text-secondary">Present</p>
                </div>
                <div className="text-center p-4 bg-red-50 rounded-xl">
                  <p className="text-3xl font-bold text-red-600">
                    {attendance.filter(a => a.status === 'Absent').length}
                  </p>
                  <p className="text-sm text-text-secondary">Absent</p>
                </div>
                <div className="text-center p-4 bg-yellow-50 rounded-xl">
                  <p className="text-3xl font-bold text-yellow-600">
                    {attendance.filter(a => a.status === 'Late').length}
                  </p>
                  <p className="text-sm text-text-secondary">Late</p>
                </div>
              </div>
              <Button 
                onClick={() => window.location.href = createPageUrl('ParentAttendance')}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white"
              >
                View Full Attendance History
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Reports Dialog */}
        <Dialog open={expandedCard === 'reports'} onOpenChange={() => setExpandedCard(null)}>
          <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <FileText className="w-6 h-6 text-blue-600" />
                Report Cards
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4 mt-4">
              {reportCards.length === 0 ? (
                <p className="text-center text-text-secondary py-8">No report cards available</p>
              ) : (
                reportCards.slice(0, 5).map((report) => (
                  <div key={report.id} className="p-4 border rounded-xl hover:bg-gray-50 transition-colors">
                    <div className="flex justify-between items-center">
                      <div>
                        <p className="font-semibold text-text">{report.student_name}</p>
                        <p className="text-sm text-text-secondary">
                          Term {report.term_number} • Session {report.session_id}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-2xl font-bold text-text">{report.average_score}%</p>
                        <Button size="sm" variant="outline" className="mt-2">
                          View Report
                        </Button>
                      </div>
                    </div>
                  </div>
                ))
              )}
              <Button 
                onClick={() => window.location.href = createPageUrl('ParentReports')}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white"
              >
                View All Reports
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Behavior Dialog */}
        <Dialog open={expandedCard === 'behavior'} onOpenChange={() => setExpandedCard(null)}>
          <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Award className="w-6 h-6 text-purple-600" />
                Behavior Records
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4 mt-4">
              {recentBehaviors.length === 0 ? (
                <p className="text-center text-text-secondary py-8">No behavior records</p>
              ) : (
                recentBehaviors.map((behavior) => (
                  <div key={behavior.id} className="p-4 border rounded-xl hover:bg-gray-50 transition-colors">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <p className="font-semibold text-text">{behavior.student_name}</p>
                          <Badge className={
                            behavior.type === 'Merit' || behavior.type === 'Reward' 
                              ? 'bg-green-100 text-green-800' 
                              : 'bg-red-100 text-red-800'
                          }>
                            {behavior.type}
                          </Badge>
                        </div>
                        <p className="text-sm text-text-secondary mb-2">{behavior.category}</p>
                        <p className="text-sm text-text">{behavior.description}</p>
                      </div>
                      <span className="text-sm text-text-secondary">
                        {new Date(behavior.date).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                ))
              )}
              <Button 
                onClick={() => window.location.href = createPageUrl('ParentBehavior')}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white"
              >
                View All Behavior Records
              </Button>
            </div>
          </DialogContent>
        </Dialog>
    </div>
  );
}