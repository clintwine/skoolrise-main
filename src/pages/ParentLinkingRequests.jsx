import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useSchoolContext } from '@/hooks/useSchoolContext';
import { withSchoolId } from '@/utils/schoolFilter';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { UserPlus, Clock, CheckCircle, XCircle } from 'lucide-react';
import { toast } from 'sonner';

export default function ParentLinkingRequests() {
  const [user, setUser] = useState(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const { school_tenant_id } = useSchoolContext();
  const [formData, setFormData] = useState({
    student_name: '',
    student_id_number: '',
    grade_level: '',
    relationship: 'Parent',
    notes: '',
  });
  const queryClient = useQueryClient();

  useEffect(() => {
    const fetchUser = async () => {
      const currentUser = await base44.auth.me();
      setUser(currentUser);
    };
    fetchUser();
  }, []);

  const { data: requests = [] } = useQuery({
    queryKey: ['linking-requests', user?.id],
    queryFn: () => base44.entities.StudentLinkingRequest.filter({ parent_user_id: user.id }),
    enabled: !!user,
  });

  const createRequestMutation = useMutation({
    mutationFn: (data) => base44.entities.StudentLinkingRequest.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries(['linking-requests']);
      toast.success('Linking request submitted successfully');
      setDialogOpen(false);
      setFormData({ student_name: '', student_id_number: '', grade_level: '', relationship: 'Parent', notes: '' });
    },
  });

  const handleSubmit = () => {
    if (!formData.student_name || !formData.student_id_number) {
      toast.error('Please fill in all required fields');
      return;
    }

    createRequestMutation.mutate(withSchoolId({
      parent_user_id: user.id,
      parent_name: user.full_name,
      parent_email: user.email,
      ...formData,
      status: 'Pending',
    }, school_tenant_id));
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'Pending':
        return <Clock className="w-5 h-5 text-yellow-600" />;
      case 'Approved':
        return <CheckCircle className="w-5 h-5 text-green-600" />;
      case 'Rejected':
        return <XCircle className="w-5 h-5 text-red-600" />;
      default:
        return null;
    }
  };

  if (!user) {
    return <div className="flex items-center justify-center min-h-screen"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div></div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Student Linking Requests</h1>
          <p className="text-gray-600 mt-1">Request to link your children to your account</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <UserPlus className="w-4 h-4 mr-2" />
              New Request
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Request to Link Student</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Student Full Name *</Label>
                <Input
                  value={formData.student_name}
                  onChange={(e) => setFormData({ ...formData, student_name: e.target.value })}
                  placeholder="John Doe"
                />
              </div>
              <div>
                <Label>Student ID Number *</Label>
                <Input
                  value={formData.student_id_number}
                  onChange={(e) => setFormData({ ...formData, student_id_number: e.target.value })}
                  placeholder="STU12345"
                />
              </div>
              <div>
                <Label>Grade Level</Label>
                <Input
                  value={formData.grade_level}
                  onChange={(e) => setFormData({ ...formData, grade_level: e.target.value })}
                  placeholder="Grade 5"
                />
              </div>
              <div>
                <Label>Relationship *</Label>
                <Select value={formData.relationship} onValueChange={(value) => setFormData({ ...formData, relationship: value })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Mother">Mother</SelectItem>
                    <SelectItem value="Father">Father</SelectItem>
                    <SelectItem value="Guardian">Guardian</SelectItem>
                    <SelectItem value="Parent">Parent</SelectItem>
                    <SelectItem value="Other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Additional Notes</Label>
                <Textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="Any additional information..."
                  rows={3}
                />
              </div>
              <Button onClick={handleSubmit} className="w-full" disabled={createRequestMutation.isPending}>
                {createRequestMutation.isPending ? 'Submitting...' : 'Submit Request'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>My Requests</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {requests.length === 0 ? (
              <div className="text-center py-12">
                <UserPlus className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">No Requests Yet</h3>
                <p className="text-gray-600">Click "New Request" above to link your children to your account</p>
              </div>
            ) : (
              requests.map((request) => (
                <div key={request.id} className="border rounded-lg p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3">
                      {getStatusIcon(request.status)}
                      <div>
                        <h3 className="font-medium text-gray-900">{request.student_name}</h3>
                        <p className="text-sm text-gray-600">Student ID: {request.student_id_number}</p>
                        {request.grade_level && <p className="text-sm text-gray-600">Grade: {request.grade_level}</p>}
                        <p className="text-sm text-gray-600">Relationship: {request.relationship}</p>
                        {request.notes && <p className="text-sm text-gray-500 mt-1">{request.notes}</p>}
                        {request.admin_notes && (
                          <p className="text-sm text-gray-700 mt-2 p-2 bg-gray-50 rounded">
                            <strong>Admin Note:</strong> {request.admin_notes}
                          </p>
                        )}
                      </div>
                    </div>
                    <Badge className={
                      request.status === 'Pending' ? 'bg-yellow-100 text-yellow-800' :
                      request.status === 'Approved' ? 'bg-green-100 text-green-800' :
                      'bg-red-100 text-red-800'
                    }>
                      {request.status}
                    </Badge>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}