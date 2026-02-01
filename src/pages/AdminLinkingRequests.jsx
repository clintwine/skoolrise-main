import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { UserCheck, Clock, CheckCircle, XCircle, UserPlus } from 'lucide-react';
import { toast } from 'sonner';

export default function AdminLinkingRequests() {
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [adminNotes, setAdminNotes] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [activeTab, setActiveTab] = useState('parent-linking');
  const [roleDialogOpen, setRoleDialogOpen] = useState(false);
  const [selectedRoleRequest, setSelectedRoleRequest] = useState(null);
  const [assignedRole, setAssignedRole] = useState('');
  const [selectedStudentForLink, setSelectedStudentForLink] = useState('');
  const queryClient = useQueryClient();

  const { data: allRequests = [] } = useQuery({
    queryKey: ['all-linking-requests'],
    queryFn: () => base44.entities.StudentLinkingRequest.list(),
  });

  const { data: roleRequests = [] } = useQuery({
    queryKey: ['role-requests'],
    queryFn: () => base44.entities.RoleAssignmentRequest.list('-created_date'),
  });

  const { data: students = [] } = useQuery({
    queryKey: ['students'],
    queryFn: () => base44.entities.Student.list(),
  });

  const { data: parents = [] } = useQuery({
    queryKey: ['parents'],
    queryFn: () => base44.entities.Parent.list(),
  });

  const processRequestMutation = useMutation({
    mutationFn: async ({ requestId, status, adminNotes, studentId, parentId }) => {
      // Update request status
      await base44.entities.StudentLinkingRequest.update(requestId, {
        status,
        admin_notes: adminNotes,
        processed_date: new Date().toISOString(),
      });

      // If approved, link student to parent
      if (status === 'Approved' && studentId && parentId) {
        await base44.entities.Student.update(studentId, { parent_id: parentId });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['all-linking-requests']);
      queryClient.invalidateQueries(['students']);
      toast.success('Request processed successfully');
      setDialogOpen(false);
      setSelectedRequest(null);
      setAdminNotes('');
    },
  });

  const handleApprove = (request) => {
    setSelectedRequest(request);
    setAdminNotes('');
    // Pre-select the student if we can find a match
    const matchingStudent = students.find(s => 
      s.student_id_number === request.student_id_number ||
      `${s.first_name} ${s.last_name}`.toLowerCase() === request.student_name?.toLowerCase()
    );
    setSelectedStudentForLink(matchingStudent?.id || '');
    setDialogOpen(true);
  };

  const handleReject = (request) => {
    const notes = prompt('Reason for rejection:');
    if (notes !== null) {
      processRequestMutation.mutate({
        requestId: request.id,
        status: 'Rejected',
        adminNotes: notes,
      });
    }
  };

  const confirmApproval = () => {
    const student = students.find(s => s.student_id_number === selectedRequest.student_id_number);
    const parent = parents.find(p => p.user_id === selectedRequest.parent_user_id);

    if (!student) {
      toast.error('Student not found. Please verify the student ID.');
      return;
    }

    if (!parent) {
      toast.error('Parent profile not found. Please ensure parent has completed profile setup.');
      return;
    }

    processRequestMutation.mutate({
      requestId: selectedRequest.id,
      status: 'Approved',
      adminNotes,
      studentId: student.id,
      parentId: parent.id,
    });
  };

  const processRoleRequestMutation = useMutation({
    mutationFn: async ({ requestId, status, role, adminNotes, userId }) => {
      const currentUser = await base44.auth.me();
      
      await base44.entities.RoleAssignmentRequest.update(requestId, {
        status,
        admin_notes: adminNotes,
        processed_by: currentUser.email,
        processed_date: new Date().toISOString(),
      });

      if (status === 'Approved' && role && userId) {
        // Update user's user_type
        await base44.entities.User.update(userId, { user_type: role });
        
        // Create profile based on role
        if (role === 'student') {
          await base44.entities.Student.create({
            user_id: userId,
            first_name: selectedRoleRequest.user_name?.split(' ')[0] || '',
            last_name: selectedRoleRequest.user_name?.split(' ').slice(1).join(' ') || '',
            student_id_number: `STU-${Date.now()}`,
            grade_level: 'Unassigned',
            status: 'Active',
          });
        } else if (role === 'teacher') {
          await base44.entities.Teacher.create({
            user_id: userId,
            first_name: selectedRoleRequest.user_name?.split(' ')[0] || '',
            last_name: selectedRoleRequest.user_name?.split(' ').slice(1).join(' ') || '',
            staff_id: `TCH-${Date.now()}`,
            status: 'Active',
          });
        } else if (role === 'parent') {
          await base44.entities.Parent.create({
            user_id: userId,
            first_name: selectedRoleRequest.user_name?.split(' ')[0] || '',
            last_name: selectedRoleRequest.user_name?.split(' ').slice(1).join(' ') || '',
            phone: '',
          });
        } else if (role === 'vendor') {
          await base44.entities.Vendor.create({
            user_id: userId,
            business_name: selectedRoleRequest.user_name || 'New Vendor',
            contact_person: selectedRoleRequest.user_name || '',
            phone: '',
            category: 'Distributor',
            status: 'Active',
          });
        }
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['role-requests']);
      toast.success('Role request processed successfully');
      setRoleDialogOpen(false);
      setSelectedRoleRequest(null);
      setAssignedRole('');
      setAdminNotes('');
    },
  });

  const handleApproveRole = (request) => {
    setSelectedRoleRequest(request);
    setAssignedRole(request.requested_role);
    setRoleDialogOpen(true);
  };

  const handleRejectRole = (request) => {
    const notes = prompt('Reason for rejection:');
    if (notes !== null) {
      processRoleRequestMutation.mutate({
        requestId: request.id,
        status: 'Rejected',
        adminNotes: notes,
        userId: request.user_id,
      });
    }
  };

  const confirmRoleApproval = () => {
    if (!assignedRole) {
      toast.error('Please select a role');
      return;
    }
    processRoleRequestMutation.mutate({
      requestId: selectedRoleRequest.id,
      status: 'Approved',
      role: assignedRole,
      adminNotes,
      userId: selectedRoleRequest.user_id,
    });
  };

  const pendingRoleRequests = roleRequests.filter(r => r.status === 'Pending');
  const processedRoleRequests = roleRequests.filter(r => r.status !== 'Pending');

  const pendingRequests = allRequests.filter(r => r.status === 'Pending');
  const processedRequests = allRequests.filter(r => r.status !== 'Pending');
  const approvedRequests = allRequests.filter(r => r.status === 'Approved');
  const rejectedRequests = allRequests.filter(r => r.status === 'Rejected');
  
  const displayedRequests = filterStatus === 'all' ? allRequests :
    filterStatus === 'Pending' ? pendingRequests :
    filterStatus === 'Approved' ? approvedRequests : rejectedRequests;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">User & Linking Requests</h1>
        <p className="text-gray-600 mt-1">Review and approve role assignments and parent-student linking</p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="mb-4">
          <TabsTrigger value="role-assignments" className="flex items-center gap-2">
            <UserPlus className="w-4 h-4" />
            Role Assignments
            {pendingRoleRequests.length > 0 && (
              <Badge className="bg-red-500 text-white ml-1">{pendingRoleRequests.length}</Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="parent-linking" className="flex items-center gap-2">
            <UserCheck className="w-4 h-4" />
            Parent-Student Linking
            {pendingRequests.length > 0 && (
              <Badge className="bg-red-500 text-white ml-1">{pendingRequests.length}</Badge>
            )}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="role-assignments" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Pending Role Requests</p>
                    <p className="text-3xl font-bold text-yellow-600">{pendingRoleRequests.length}</p>
                  </div>
                  <Clock className="w-8 h-8 text-yellow-600" />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Total Role Requests</p>
                    <p className="text-3xl font-bold text-blue-600">{roleRequests.length}</p>
                  </div>
                  <UserPlus className="w-8 h-8 text-blue-600" />
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Role Assignment Requests</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {roleRequests.length === 0 ? (
                  <div className="text-center py-12">
                    <UserPlus className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600">No role assignment requests</p>
                  </div>
                ) : (
                  roleRequests.map((request) => (
                    <div key={request.id} className="border rounded-lg p-4">
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="font-semibold text-gray-900">{request.user_name || 'Unknown User'}</h3>
                          <p className="text-sm text-gray-600">{request.user_email}</p>
                          <div className="mt-3 space-y-1">
                            <p className="text-sm"><strong>Requested Role:</strong> {request.requested_role}</p>
                            {request.message && (
                              <p className="text-sm text-gray-600 mt-2 p-2 bg-gray-50 rounded">
                                <strong>Message:</strong> {request.message}
                              </p>
                            )}
                            {request.admin_notes && (
                              <p className="text-sm text-gray-600 mt-2">
                                <strong>Admin Notes:</strong> {request.admin_notes}
                              </p>
                            )}
                          </div>
                        </div>
                        <div className="flex gap-2">
                          {request.status === 'Pending' ? (
                            <>
                              <Button size="sm" onClick={() => handleApproveRole(request)} className="bg-green-600 hover:bg-green-700">
                                <CheckCircle className="w-4 h-4 mr-1" />
                                Approve
                              </Button>
                              <Button size="sm" variant="outline" onClick={() => handleRejectRole(request)} className="text-red-600 border-red-200">
                                <XCircle className="w-4 h-4 mr-1" />
                                Reject
                              </Button>
                            </>
                          ) : (
                            <Badge className={request.status === 'Approved' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}>
                              {request.status}
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="parent-linking" className="space-y-4">

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card 
          className="cursor-pointer hover:shadow-lg transition-shadow"
          onClick={() => setFilterStatus(filterStatus === 'Pending' ? 'all' : 'Pending')}
        >
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Pending</p>
                <p className="text-3xl font-bold text-yellow-600">{pendingRequests.length}</p>
              </div>
              <Clock className="w-8 h-8 text-yellow-600" />
            </div>
          </CardContent>
        </Card>
        <Card 
          className="cursor-pointer hover:shadow-lg transition-shadow"
          onClick={() => setFilterStatus(filterStatus === 'Approved' ? 'all' : 'Approved')}
        >
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Approved</p>
                <p className="text-3xl font-bold text-green-600">{approvedRequests.length}</p>
              </div>
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
          </CardContent>
        </Card>
        <Card 
          className="cursor-pointer hover:shadow-lg transition-shadow"
          onClick={() => setFilterStatus(filterStatus === 'Rejected' ? 'all' : 'Rejected')}
        >
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Rejected</p>
                <p className="text-3xl font-bold text-red-600">{rejectedRequests.length}</p>
              </div>
              <XCircle className="w-8 h-8 text-red-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>
              {filterStatus === 'all' ? 'All Requests' : 
               filterStatus === 'Pending' ? 'Pending Requests' :
               filterStatus === 'Approved' ? 'Approved Requests' : 'Rejected Requests'}
            </CardTitle>
            {filterStatus !== 'all' && (
              <Button variant="outline" size="sm" onClick={() => setFilterStatus('all')}>
                Show All
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {displayedRequests.length === 0 ? (
              <div className="text-center py-12">
                <UserCheck className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">No {filterStatus !== 'all' ? filterStatus.toLowerCase() : ''} requests</p>
              </div>
            ) : (
              displayedRequests.map((request) => (
                    <div key={request.id} className="border rounded-lg p-4">
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="font-semibold text-gray-900">{request.parent_name}</h3>
                          <p className="text-sm text-gray-600">{request.parent_email}</p>
                          <div className="mt-3 space-y-1">
                            <p className="text-sm"><strong>Student:</strong> {request.student_name}</p>
                            <p className="text-sm"><strong>Student ID:</strong> {request.student_id_number}</p>
                            {request.grade_level && <p className="text-sm"><strong>Grade:</strong> {request.grade_level}</p>}
                            <p className="text-sm"><strong>Relationship:</strong> {request.relationship}</p>
                            {request.notes && (
                              <p className="text-sm text-gray-600 mt-2 p-2 bg-gray-50 rounded">
                                <strong>Notes:</strong> {request.notes}
                              </p>
                            )}
                          </div>
                        </div>
                        <div className="flex gap-2">
                          {request.status === 'Pending' ? (
                            <>
                              <Button size="sm" onClick={() => handleApprove(request)} className="bg-green-600 hover:bg-green-700">
                                <CheckCircle className="w-4 h-4 mr-1" />
                                Approve
                              </Button>
                              <Button size="sm" variant="outline" onClick={() => handleReject(request)} className="text-red-600 border-red-200">
                                <XCircle className="w-4 h-4 mr-1" />
                                Reject
                              </Button>
                            </>
                          ) : (
                            <Badge className={request.status === 'Approved' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}>
                              {request.status}
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        </TabsContent>
      </Tabs>

      {/* Parent Linking Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="bg-white max-w-lg">
          <DialogHeader>
            <DialogTitle>Review & Approve Linking Request</DialogTitle>
          </DialogHeader>
          {selectedRequest && (
            <div className="space-y-4">
              <div className="p-4 bg-gray-50 rounded-lg">
                <p><strong>Parent:</strong> {selectedRequest.parent_name}</p>
                <p className="text-sm text-gray-600">{selectedRequest.parent_email}</p>
              </div>
              
              <div>
                <Label>Select Correct Student</Label>
                <p className="text-xs text-gray-500 mb-2">
                  Requested: {selectedRequest.student_name} (ID: {selectedRequest.student_id_number})
                </p>
                <Select 
                  value={selectedStudentForLink || ''} 
                  onValueChange={setSelectedStudentForLink}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select student to link" />
                  </SelectTrigger>
                  <SelectContent>
                    {students.map((student) => (
                      <SelectItem key={student.id} value={student.id}>
                        {student.first_name} {student.last_name} - ID: {student.student_id_number} (Grade {student.grade_level})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label>Admin Notes (Optional)</Label>
                <Textarea
                  value={adminNotes}
                  onChange={(e) => setAdminNotes(e.target.value)}
                  placeholder="Add any notes..."
                  rows={3}
                />
              </div>
              
              <div className="flex gap-3">
                <Button 
                  variant="outline" 
                  onClick={() => {
                    const notes = adminNotes || 'Request rejected by admin';
                    processRequestMutation.mutate({
                      requestId: selectedRequest.id,
                      status: 'Rejected',
                      adminNotes: notes,
                    });
                  }}
                  className="flex-1 text-red-600 border-red-200 hover:bg-red-50"
                  disabled={processRequestMutation.isPending}
                >
                  <XCircle className="w-4 h-4 mr-2" />
                  Reject
                </Button>
                <Button 
                  onClick={() => {
                    if (!selectedStudentForLink) {
                      toast.error('Please select a student to link');
                      return;
                    }
                    const parent = parents.find(p => p.user_id === selectedRequest.parent_user_id);
                    if (!parent) {
                      toast.error('Parent profile not found');
                      return;
                    }
                    processRequestMutation.mutate({
                      requestId: selectedRequest.id,
                      status: 'Approved',
                      adminNotes,
                      studentId: selectedStudentForLink,
                      parentId: parent.id,
                    });
                  }} 
                  className="flex-1 bg-green-600 hover:bg-green-700" 
                  disabled={processRequestMutation.isPending || !selectedStudentForLink}
                >
                  <CheckCircle className="w-4 h-4 mr-2" />
                  {processRequestMutation.isPending ? 'Processing...' : 'Approve & Link'}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Role Assignment Dialog */}
      <Dialog open={roleDialogOpen} onOpenChange={setRoleDialogOpen}>
        <DialogContent className="bg-white">
          <DialogHeader>
            <DialogTitle>Approve Role Assignment</DialogTitle>
          </DialogHeader>
          {selectedRoleRequest && (
            <div className="space-y-4">
              <div className="p-4 bg-gray-50 rounded-lg">
                <p><strong>User:</strong> {selectedRoleRequest.user_name}</p>
                <p><strong>Email:</strong> {selectedRoleRequest.user_email}</p>
                <p><strong>Requested Role:</strong> {selectedRoleRequest.requested_role}</p>
              </div>
              <div>
                <Label>Assign Role</Label>
                <Select value={assignedRole} onValueChange={setAssignedRole}>
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="student">Student</SelectItem>
                    <SelectItem value="teacher">Teacher</SelectItem>
                    <SelectItem value="parent">Parent</SelectItem>
                    <SelectItem value="vendor">Vendor</SelectItem>
                    <SelectItem value="admin">Admin</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Admin Notes (Optional)</Label>
                <Textarea
                  value={adminNotes}
                  onChange={(e) => setAdminNotes(e.target.value)}
                  placeholder="Add any notes..."
                  rows={3}
                />
              </div>
              <Button onClick={confirmRoleApproval} className="w-full" disabled={processRoleRequestMutation.isPending}>
                {processRoleRequestMutation.isPending ? 'Processing...' : 'Confirm & Create Profile'}
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}