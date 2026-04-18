import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useSchoolContext } from '@/hooks/useSchoolContext';
import { addSchoolFilter } from '@/utils/schoolFilter';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { UserCheck, Clock, CheckCircle, XCircle, UserPlus, ChevronsUpDown, Check, Unlink, Users } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';

export default function AdminLinkingRequests() {
  const { school_tenant_id, isReady } = useSchoolContext();
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [adminNotes, setAdminNotes] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [activeTab, setActiveTab] = useState('parent-linking');
  const [roleDialogOpen, setRoleDialogOpen] = useState(false);
  const [selectedRoleRequest, setSelectedRoleRequest] = useState(null);
  const [assignedRole, setAssignedRole] = useState('');
  const [selectedStudentForLink, setSelectedStudentForLink] = useState('');
  const [studentSearchOpen, setStudentSearchOpen] = useState(false);
  const [studentSearchQuery, setStudentSearchQuery] = useState('');
  const [unlinkDialogOpen, setUnlinkDialogOpen] = useState(false);
  const [unlinkTarget, setUnlinkTarget] = useState(null); // {parentId, studentId, parentName, studentName}
  const queryClient = useQueryClient();

  const { data: allRequests = [] } = useQuery({
    queryKey: ['all-linking-requests', school_tenant_id],
    queryFn: () => base44.entities.StudentLinkingRequest.filter(addSchoolFilter({}, school_tenant_id)),
    enabled: isReady,
  });

  const { data: roleRequests = [] } = useQuery({
    queryKey: ['role-requests', school_tenant_id],
    queryFn: () => base44.entities.RoleAssignmentRequest.filter(addSchoolFilter({}, school_tenant_id), '-created_date'),
    enabled: isReady,
  });

  const { data: students = [] } = useQuery({
    queryKey: ['students', school_tenant_id],
    queryFn: () => base44.entities.Student.filter(addSchoolFilter({}, school_tenant_id)),
    enabled: isReady,
  });

  const { data: parents = [] } = useQuery({
    queryKey: ['parents', school_tenant_id],
    queryFn: () => base44.entities.Parent.filter(addSchoolFilter({}, school_tenant_id)),
    enabled: isReady,
  });

  const processRequestMutation = useMutation({
    mutationFn: async ({ requestId, status, adminNotes, studentId, parentId }) => {
      // Update request status
      await base44.entities.StudentLinkingRequest.update(requestId, {
        status,
        admin_notes: adminNotes,
        processed_date: new Date().toISOString(),
      });

      // If approved, link student to parent bidirectionally
      if (status === 'Approved' && studentId && parentId) {
        // Get current student and parent
        const student = students.find(s => s.id === studentId);
        const parent = parents.find(p => p.id === parentId);

        // CROSS-SCHOOL SECURITY: Reject if student and parent belong to different schools
        if (student?.school_tenant_id && parent?.school_tenant_id &&
            student.school_tenant_id !== parent.school_tenant_id) {
          throw new Error('Student not found in your school.');
        }
        
        // Update student's linked_parent_ids (add parent if not already linked)
        let studentLinkedParents = [];
        if (student?.linked_parent_ids) {
          try { studentLinkedParents = JSON.parse(student.linked_parent_ids); } catch (e) {}
        }
        if (!studentLinkedParents.includes(parentId)) {
          studentLinkedParents.push(parentId);
        }
        await base44.entities.Student.update(studentId, { 
          linked_parent_ids: JSON.stringify(studentLinkedParents)
        });
        
        // Update parent's linked_student_ids (add student if not already linked)
        let parentLinkedStudents = [];
        if (parent?.linked_student_ids) {
          try { parentLinkedStudents = JSON.parse(parent.linked_student_ids); } catch (e) {}
        }
        if (!parentLinkedStudents.includes(studentId)) {
          parentLinkedStudents.push(studentId);
        }
        await base44.entities.Parent.update(parentId, { 
          linked_student_ids: JSON.stringify(parentLinkedStudents)
        });

        // Upsert UserSchoolMembership for the parent (multi-school support)
        if (parent?.user_id && student?.school_tenant_id) {
          const existingMemberships = await base44.entities.UserSchoolMembership.filter({
            user_id: parent.user_id,
            school_tenant_id: student.school_tenant_id,
          });
          if (existingMemberships.length === 0) {
            // Create new membership
            await base44.entities.UserSchoolMembership.create({
              user_id: parent.user_id,
              school_tenant_id: student.school_tenant_id,
              role: 'parent',
              is_active: true,
              linked_student_ids: JSON.stringify([studentId]),
              invited_at: new Date().toISOString(),
            });
          } else {
            // Update existing membership's linked_student_ids
            const membership = existingMemberships[0];
            let membershipStudents = [];
            try { membershipStudents = JSON.parse(membership.linked_student_ids || '[]'); } catch (e) {}
            if (!membershipStudents.includes(studentId)) {
              membershipStudents.push(studentId);
              await base44.entities.UserSchoolMembership.update(membership.id, {
                linked_student_ids: JSON.stringify(membershipStudents),
              });
            }
          }
        }
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['all-linking-requests']);
      queryClient.invalidateQueries(['students']);
      queryClient.invalidateQueries(['parents']);
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

  // Unlink mutation
  const unlinkMutation = useMutation({
    mutationFn: async ({ parentId, studentId }) => {
      const parent = parents.find(p => p.id === parentId);
      const student = students.find(s => s.id === studentId);
      
      // Remove student from parent's linked_student_ids
      if (parent?.linked_student_ids) {
        let linkedStudents = [];
        try { linkedStudents = JSON.parse(parent.linked_student_ids); } catch (e) {}
        linkedStudents = linkedStudents.filter(id => id !== studentId);
        await base44.entities.Parent.update(parentId, {
          linked_student_ids: JSON.stringify(linkedStudents)
        });
      }
      
      // Remove parent from student's linked_parent_ids
      if (student?.linked_parent_ids) {
        let linkedParents = [];
        try { linkedParents = JSON.parse(student.linked_parent_ids); } catch (e) {}
        linkedParents = linkedParents.filter(id => id !== parentId);
        await base44.entities.Student.update(studentId, {
          linked_parent_ids: JSON.stringify(linkedParents)
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['parents']);
      queryClient.invalidateQueries(['students']);
      toast.success('Successfully unlinked parent and student');
      setUnlinkDialogOpen(false);
      setUnlinkTarget(null);
    },
    onError: () => {
      toast.error('Failed to unlink');
    }
  });

  // Get linked relationships for display
  const linkedRelationships = parents.flatMap(parent => {
    let linkedIds = [];
    try { linkedIds = JSON.parse(parent.linked_student_ids || '[]'); } catch (e) {}
    return linkedIds.map(studentId => {
      const student = students.find(s => s.id === studentId);
      return student ? {
        parentId: parent.id,
        parentName: `${parent.first_name} ${parent.last_name}`,
        studentId: student.id,
        studentName: `${student.first_name} ${student.last_name}`,
        studentIdNumber: student.student_id_number,
        gradeLevel: student.grade_level
      } : null;
    }).filter(Boolean);
  });

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

      {/* Existing Linked Relationships */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="w-5 h-5" />
            Current Parent-Student Links ({linkedRelationships.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {linkedRelationships.length === 0 ? (
            <p className="text-center text-gray-500 py-4">No linked relationships</p>
          ) : (
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {linkedRelationships.map((rel, idx) => (
                <div key={idx} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex-1">
                    <p className="font-medium">{rel.parentName} → {rel.studentName}</p>
                    <p className="text-sm text-gray-500">Student ID: {rel.studentIdNumber} • Grade {rel.gradeLevel || 'N/A'}</p>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-red-600 border-red-200 hover:bg-red-50"
                    onClick={() => {
                      setUnlinkTarget(rel);
                      setUnlinkDialogOpen(true);
                    }}
                  >
                    <Unlink className="w-4 h-4 mr-1" />
                    Unlink
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

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
                <Popover open={studentSearchOpen} onOpenChange={setStudentSearchOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      role="combobox"
                      aria-expanded={studentSearchOpen}
                      className="w-full justify-between"
                    >
                      {selectedStudentForLink
                        ? (() => {
                            const student = students.find(s => s.id === selectedStudentForLink);
                            return student ? `${student.first_name} ${student.last_name} - ${student.student_id_number}` : 'Select student...';
                          })()
                        : 'Search by name or Student ID...'}
                      <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-full p-0" align="start">
                    <Command>
                      <CommandInput 
                        placeholder="Search by name or Student ID..." 
                        value={studentSearchQuery}
                        onValueChange={setStudentSearchQuery}
                      />
                      <CommandList>
                        <CommandEmpty>No student found.</CommandEmpty>
                        <CommandGroup className="max-h-64 overflow-auto">
                          {students
                            .filter(student => {
                              const searchLower = studentSearchQuery.toLowerCase();
                              const fullName = `${student.first_name} ${student.last_name}`.toLowerCase();
                              const idNumber = (student.student_id_number || '').toLowerCase();
                              return fullName.includes(searchLower) || idNumber.includes(searchLower);
                            })
                            .map((student) => (
                              <CommandItem
                                key={student.id}
                                value={`${student.first_name} ${student.last_name} ${student.student_id_number}`}
                                onSelect={() => {
                                  setSelectedStudentForLink(student.id);
                                  setStudentSearchOpen(false);
                                }}
                              >
                                <Check
                                  className={cn(
                                    "mr-2 h-4 w-4",
                                    selectedStudentForLink === student.id ? "opacity-100" : "opacity-0"
                                  )}
                                />
                                <div>
                                  <p className="font-medium">{student.first_name} {student.last_name}</p>
                                  <p className="text-xs text-gray-500">ID: {student.student_id_number} • Grade {student.grade_level || 'Unassigned'}</p>
                                </div>
                              </CommandItem>
                            ))}
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
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

      {/* Unlink Confirmation Dialog */}
      <AlertDialog open={unlinkDialogOpen} onOpenChange={setUnlinkDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Unlink Parent and Student?</AlertDialogTitle>
            <AlertDialogDescription>
              This will remove the link between <strong>{unlinkTarget?.parentName}</strong> and <strong>{unlinkTarget?.studentName}</strong>. 
              The parent will no longer be able to view this student's information in the Parent Portal.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-600 hover:bg-red-700"
              onClick={() => unlinkMutation.mutate({
                parentId: unlinkTarget?.parentId,
                studentId: unlinkTarget?.studentId
              })}
              disabled={unlinkMutation.isPending}
            >
              {unlinkMutation.isPending ? 'Unlinking...' : 'Unlink'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

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