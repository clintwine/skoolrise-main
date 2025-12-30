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
import { UserCheck, Clock, CheckCircle, XCircle } from 'lucide-react';
import { toast } from 'sonner';

export default function AdminLinkingRequests() {
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [adminNotes, setAdminNotes] = useState('');
  const queryClient = useQueryClient();

  const { data: allRequests = [] } = useQuery({
    queryKey: ['all-linking-requests'],
    queryFn: () => base44.entities.StudentLinkingRequest.list(),
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

  const pendingRequests = allRequests.filter(r => r.status === 'Pending');
  const processedRequests = allRequests.filter(r => r.status !== 'Pending');

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Parent-Student Linking Requests</h1>
        <p className="text-gray-600 mt-1">Review and approve parent requests to link students</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
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
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Approved</p>
                <p className="text-3xl font-bold text-green-600">{allRequests.filter(r => r.status === 'Approved').length}</p>
              </div>
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Rejected</p>
                <p className="text-3xl font-bold text-red-600">{allRequests.filter(r => r.status === 'Rejected').length}</p>
              </div>
              <XCircle className="w-8 h-8 text-red-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="pending">
        <TabsList>
          <TabsTrigger value="pending">Pending ({pendingRequests.length})</TabsTrigger>
          <TabsTrigger value="processed">Processed ({processedRequests.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="pending" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Pending Requests</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {pendingRequests.length === 0 ? (
                  <div className="text-center py-12">
                    <UserCheck className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600">No pending requests</p>
                  </div>
                ) : (
                  pendingRequests.map((request) => (
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
                          <Button size="sm" onClick={() => handleApprove(request)} className="bg-green-600 hover:bg-green-700">
                            <CheckCircle className="w-4 h-4 mr-1" />
                            Approve
                          </Button>
                          <Button size="sm" variant="outline" onClick={() => handleReject(request)} className="text-red-600 border-red-200">
                            <XCircle className="w-4 h-4 mr-1" />
                            Reject
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="processed" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Processed Requests</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {processedRequests.map((request) => (
                  <div key={request.id} className="border rounded-lg p-4">
                    <div className="flex justify-between items-start">
                      <div>
                        <div className="flex items-center gap-2 mb-2">
                          <h3 className="font-semibold text-gray-900">{request.parent_name}</h3>
                          <Badge className={
                            request.status === 'Approved' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                          }>
                            {request.status}
                          </Badge>
                        </div>
                        <p className="text-sm text-gray-600">{request.parent_email}</p>
                        <div className="mt-2 space-y-1">
                          <p className="text-sm"><strong>Student:</strong> {request.student_name}</p>
                          <p className="text-sm"><strong>Student ID:</strong> {request.student_id_number}</p>
                          {request.admin_notes && (
                            <p className="text-sm text-gray-700 mt-2 p-2 bg-gray-50 rounded">
                              <strong>Admin Note:</strong> {request.admin_notes}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Approve Linking Request</DialogTitle>
          </DialogHeader>
          {selectedRequest && (
            <div className="space-y-4">
              <div className="p-4 bg-gray-50 rounded-lg">
                <p><strong>Parent:</strong> {selectedRequest.parent_name}</p>
                <p><strong>Student:</strong> {selectedRequest.student_name}</p>
                <p><strong>Student ID:</strong> {selectedRequest.student_id_number}</p>
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
              <Button onClick={confirmApproval} className="w-full" disabled={processRequestMutation.isPending}>
                {processRequestMutation.isPending ? 'Processing...' : 'Confirm Approval'}
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}