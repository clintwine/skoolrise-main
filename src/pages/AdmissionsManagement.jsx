import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useSchoolContext } from '@/hooks/useSchoolContext';
import { addSchoolFilter, withSchoolId } from '@/utils/schoolFilter';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Search, Upload, Download, UserPlus, Mail, Calendar } from 'lucide-react';
import ApplicationFormDialog from '../components/admissions/ApplicationFormDialog';
import ApplicationDetailsDialog from '../components/admissions/ApplicationDetailsDialog';
import BulkImportDialog from '../components/admin/BulkImportDialog';

export default function AdmissionsManagement() {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [isImportOpen, setIsImportOpen] = useState(false);
  const [selectedApplication, setSelectedApplication] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [stageFilter, setStageFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const queryClient = useQueryClient();
  const { school_tenant_id, isReady } = useSchoolContext();

  const { data: applications = [], isLoading } = useQuery({
    queryKey: ['applications', school_tenant_id],
    queryFn: () => base44.entities.Application.filter(addSchoolFilter({}, school_tenant_id), '-created_date'),
    enabled: isReady,
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Application.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['applications'] });
    },
  });

  const { data: schools = [] } = useQuery({
    queryKey: ['schools', school_tenant_id],
    queryFn: () => base44.entities.School.filter(addSchoolFilter({}, school_tenant_id)),
    enabled: isReady,
  });

  const { data: existingStudents = [] } = useQuery({
    queryKey: ['students-for-id', school_tenant_id],
    queryFn: () => base44.entities.Student.filter(addSchoolFilter({}, school_tenant_id)),
    enabled: isReady,
  });

  const generateStudentId = () => {
    const school = schools[0];
    const pattern = school?.student_id_pattern || 'STU-{YEAR}-{SEQ}';
    const year = new Date().getFullYear();
    const seqNum = existingStudents.length + 1;
    const paddedSeq = String(seqNum).padStart(3, '0');
    
    return pattern
      .replace('{YEAR}', year)
      .replace('{SEQ}', paddedSeq);
  };

  const [enrollingAppId, setEnrollingAppId] = useState(null);
  
  const convertToStudentMutation = useMutation({
    mutationFn: async (application) => {
      const studentId = generateStudentId();
      
      // Create a user account first
      try {
        await base44.users.inviteUser(application.email || application.parent_email, 'user');
      } catch (error) {
        console.log('User may already exist:', error);
      }
      
      // Get the user ID
      const allUsers = await base44.entities.User.list();
      const userRecord = allUsers.find(u => u.email === (application.email || application.parent_email));
      
      await base44.entities.Student.create(withSchoolId({
        user_id: userRecord?.id || '',
        first_name: application.first_name,
        last_name: application.last_name,
        student_id_number: studentId,
        date_of_birth: application.date_of_birth,
        gender: application.gender,
        grade_level: application.grade_applying_for,
        status: 'Active',
        phone: application.phone,
        address: application.address,
        parent_email: application.parent_email,
        parent_phone: application.parent_phone,
        admission_date: new Date().toISOString().split('T')[0],
        notes: `Converted from application ${application.application_number}`,
      }, school_tenant_id));
      await base44.entities.Application.update(application.id, {
        student_id: studentId,
        application_stage: 'Enrolled',
        status: 'Approved',
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['applications'] });
      queryClient.invalidateQueries({ queryKey: ['students'] });
      queryClient.invalidateQueries({ queryKey: ['students-for-id'] });
      setEnrollingAppId(null);
      alert('Application converted to student successfully!');
    },
    onError: (error) => {
      setEnrollingAppId(null);
      alert('Failed to enroll student: ' + error.message);
    },
  });

  const sendOfferLetterMutation = useMutation({
    mutationFn: async (application) => {
      await base44.integrations.Core.SendEmail({
        to: application.parent_email,
        subject: `Admission Offer - ${application.first_name} ${application.last_name}`,
        body: `Dear ${application.parent_name},\n\nWe are pleased to offer admission to ${application.first_name} ${application.last_name} for Grade ${application.grade_applying_for}.\n\nPlease confirm acceptance by ${application.enrollment_deadline || 'the deadline specified'}.\n\nBest regards,\nAdmissions Office`,
      });
      await base44.entities.Application.update(application.id, {
        offer_letter_sent: true,
        offer_letter_date: new Date().toISOString().split('T')[0],
        application_stage: 'Offered',
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['applications'] });
      alert('Offer letter sent successfully!');
    },
  });

  const exportToCSV = () => {
    const headers = ['Application Number', 'Name', 'Email', 'Grade', 'Stage', 'Status', 'Applied Date', 'Parent Email', 'UPN', 'ULN'];
    const rows = filteredApplications.map(app => [
      app.application_number,
      `${app.first_name} ${app.last_name}`,
      app.email || '',
      app.grade_applying_for,
      app.application_stage,
      app.status,
      new Date(app.created_date).toLocaleDateString(),
      app.parent_email || '',
      app.upn || '',
      app.uln || '',
    ]);

    const csvContent = [headers, ...rows].map(row => row.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `admissions_export_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  const filteredApplications = applications.filter(app => {
    const matchesSearch = 
      `${app.first_name} ${app.last_name}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
      app.application_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      app.email?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStage = stageFilter === 'all' || app.application_stage === stageFilter;
    const matchesStatus = statusFilter === 'all' || app.status === statusFilter;
    return matchesSearch && matchesStage && matchesStatus;
  });

  const stageColors = {
    'Submitted': 'bg-blue-100 text-blue-800',
    'Under Review': 'bg-yellow-100 text-yellow-800',
    'Interview Scheduled': 'bg-purple-100 text-purple-800',
    'Interviewed': 'bg-indigo-100 text-indigo-800',
    'Offered': 'bg-green-100 text-green-800',
    'Accepted': 'bg-teal-100 text-teal-800',
    'Declined': 'bg-orange-100 text-orange-800',
    'Rejected': 'bg-red-100 text-red-800',
    'Enrolled': 'bg-emerald-100 text-emerald-800',
  };

  const statusColors = {
    'Pending': 'bg-gray-100 text-gray-800',
    'In Progress': 'bg-blue-100 text-blue-800',
    'Approved': 'bg-green-100 text-green-800',
    'Rejected': 'bg-red-100 text-red-800',
    'Withdrawn': 'bg-orange-100 text-orange-800',
  };

  const stageCounts = {
    total: applications.length,
    submitted: applications.filter(a => a.application_stage === 'Submitted').length,
    underReview: applications.filter(a => a.application_stage === 'Under Review').length,
    interviewed: applications.filter(a => a.application_stage === 'Interviewed').length,
    offered: applications.filter(a => a.application_stage === 'Offered').length,
    enrolled: applications.filter(a => a.application_stage === 'Enrolled').length,
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Admissions Management</h1>
          <p className="text-gray-600 mt-1">Manage applications and track admission process</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => setIsImportOpen(true)} variant="outline">
            <Upload className="w-4 h-4 mr-2" />
            Bulk Import
          </Button>
          <Button onClick={exportToCSV} variant="outline">
            <Download className="w-4 h-4 mr-2" />
            Export Data
          </Button>
          <Button onClick={() => { setSelectedApplication(null); setIsFormOpen(true); }} className="bg-blue-600 hover:bg-blue-700">
            <Plus className="w-4 h-4 mr-2" />
            New Application
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-gray-600">Total Applications</p>
            <p className="text-2xl font-bold text-gray-900">{stageCounts.total}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-gray-600">Submitted</p>
            <p className="text-2xl font-bold text-blue-600">{stageCounts.submitted}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-gray-600">Under Review</p>
            <p className="text-2xl font-bold text-yellow-600">{stageCounts.underReview}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-gray-600">Offered</p>
            <p className="text-2xl font-bold text-green-600">{stageCounts.offered}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-gray-600">Enrolled</p>
            <p className="text-2xl font-bold text-emerald-600">{stageCounts.enrolled}</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardContent className="p-4">
          <div className="flex flex-wrap gap-4">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <Input placeholder="Search applications..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-10" />
            </div>
            <Select value={stageFilter} onValueChange={setStageFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filter by stage" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Stages</SelectItem>
                <SelectItem value="Submitted">Submitted</SelectItem>
                <SelectItem value="Under Review">Under Review</SelectItem>
                <SelectItem value="Interview Scheduled">Interview Scheduled</SelectItem>
                <SelectItem value="Interviewed">Interviewed</SelectItem>
                <SelectItem value="Offered">Offered</SelectItem>
                <SelectItem value="Accepted">Accepted</SelectItem>
                <SelectItem value="Enrolled">Enrolled</SelectItem>
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="Pending">Pending</SelectItem>
                <SelectItem value="In Progress">In Progress</SelectItem>
                <SelectItem value="Approved">Approved</SelectItem>
                <SelectItem value="Rejected">Rejected</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {isLoading ? (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
        </div>
      ) : (
        <Card>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Application #</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Applicant</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Grade</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Stage</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Applied</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y">
                {filteredApplications.map((app) => (
                  <tr key={app.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 text-sm font-medium text-gray-900">{app.application_number}</td>
                    <td className="px-6 py-4">
                      <div className="text-sm font-medium text-gray-900">{app.first_name} {app.last_name}</div>
                      <div className="text-sm text-gray-500">{app.email}</div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">Grade {app.grade_applying_for}</td>
                    <td className="px-6 py-4">
                      <Badge className={stageColors[app.application_stage]}>{app.application_stage}</Badge>
                    </td>
                    <td className="px-6 py-4">
                      <Badge className={statusColors[app.status]}>{app.status}</Badge>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {new Date(app.created_date).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex gap-2">
                        <Button size="sm" variant="outline" onClick={() => { setSelectedApplication(app); setIsDetailsOpen(true); }}>
                          View
                        </Button>
                        {app.application_stage === 'Interviewed' && !app.offer_letter_sent && (
                          <Button size="sm" variant="outline" onClick={() => sendOfferLetterMutation.mutate(app)}>
                            <Mail className="w-3 h-3 mr-1" />
                            Send Offer
                          </Button>
                        )}
                        {(app.application_stage === 'Accepted' || app.application_stage === 'Offered') && !app.student_id && (
                          <Button 
                            size="sm" 
                            className="bg-green-600 hover:bg-green-700" 
                            onClick={(e) => {
                              e.stopPropagation();
                              setEnrollingAppId(app.id);
                              convertToStudentMutation.mutate(app);
                            }}
                            disabled={enrollingAppId === app.id}
                          >
                            <UserPlus className="w-3 h-3 mr-1" />
                            {enrollingAppId === app.id ? 'Enrolling...' : 'Enroll'}
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      <ApplicationFormDialog
        open={isFormOpen}
        onOpenChange={setIsFormOpen}
        application={selectedApplication}
        onComplete={() => {
          queryClient.invalidateQueries({ queryKey: ['applications'] });
          setIsFormOpen(false);
        }}
      />

      <ApplicationDetailsDialog
        open={isDetailsOpen}
        onOpenChange={setIsDetailsOpen}
        application={selectedApplication}
        onUpdate={(id, data) => updateMutation.mutate({ id, data })}
        onEdit={() => {
          setIsDetailsOpen(false);
          setIsFormOpen(true);
        }}
      />

      <BulkImportDialog
        open={isImportOpen}
        onOpenChange={setIsImportOpen}
        entityName="Application"
        entitySchema={{
          type: "object",
          properties: {
            application_number: { type: "string" },
            first_name: { type: "string" },
            last_name: { type: "string" },
            date_of_birth: { type: "string" },
            gender: { type: "string" },
            email: { type: "string" },
            phone: { type: "string" },
            parent_name: { type: "string" },
            parent_email: { type: "string" },
            parent_phone: { type: "string" },
            grade_applying_for: { type: "string" },
            previous_school: { type: "string" },
            upn: { type: "string" },
            uln: { type: "string" }
          },
          required: ["first_name", "last_name", "date_of_birth", "grade_applying_for", "parent_email"]
        }}
        templateData={[{
          application_number: "APP2025001",
          first_name: "John",
          last_name: "Doe",
          date_of_birth: "2010-05-15",
          gender: "Male",
          email: "john.doe@email.com",
          parent_email: "parent@email.com",
          grade_applying_for: "9"
        }]}
        onImportComplete={() => {
          queryClient.invalidateQueries({ queryKey: ['applications'] });
          setIsImportOpen(false);
        }}
      />
    </div>
  );
}