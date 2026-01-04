import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { motion } from 'framer-motion';
import { UserCircle, LogOut as LogOutIcon, Send, CheckCircle, Clock } from 'lucide-react';
import { toast } from 'sonner';

export default function NoRoleScreen({ user, onLogout }) {
  const [requestedRole, setRequestedRole] = useState('');
  const [message, setMessage] = useState('');
  const [showForm, setShowForm] = useState(false);

  const { data: existingRequest, refetch } = useQuery({
    queryKey: ['role-request', user?.id],
    queryFn: async () => {
      const requests = await base44.entities.RoleAssignmentRequest.filter({ 
        user_id: user.id,
        status: 'Pending'
      });
      return requests[0];
    },
    enabled: !!user?.id,
  });

  const submitRequestMutation = useMutation({
    mutationFn: async (data) => {
      await base44.entities.RoleAssignmentRequest.create({
        user_id: user.id,
        user_email: user.email,
        user_name: user.full_name,
        requested_role: data.role,
        message: data.message,
        status: 'Pending',
      });

      // Create notification for admins
      await base44.entities.Notification.create({
        subject: 'New Role Assignment Request',
        message: `${user.full_name} (${user.email}) has requested to be assigned the role of "${data.role}".${data.message ? `\n\nMessage: ${data.message}` : ''}`,
        recipient_type: 'All Teachers',
        channel: 'In-App',
        status: 'Sent',
        sent_date: new Date().toISOString(),
      });
    },
    onSuccess: () => {
      toast.success('Request submitted successfully! An administrator will review your request.');
      refetch();
      setShowForm(false);
    },
    onError: (error) => {
      toast.error('Failed to submit request: ' + error.message);
    },
  });

  const handleSubmit = () => {
    if (!requestedRole) {
      toast.error('Please select a role');
      return;
    }
    submitRequestMutation.mutate({ role: requestedRole, message });
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm sticky top-0 z-50">
        <div className="flex items-center justify-between px-4 py-3 lg:px-6">
          <div className="flex items-center">
            <img 
              src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/69441b6bd765d833c80ac7ff/90d2daf9a_oie_b7JlP4U16so5.png" 
              alt="SkoolRise Logo" 
              className="h-15 w-40"
            />
          </div>
          <button
            onClick={onLogout}
            className="p-2 rounded-xl hover:bg-gray-100 transition-all duration-200"
            title="Logout"
          >
            <LogOutIcon className="w-5 h-5 text-gray-500" />
          </button>
        </div>
      </header>
      
      <div className="flex items-center justify-center min-h-[80vh] px-4">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-md w-full p-8 bg-white rounded-2xl shadow-lg"
        >
          {existingRequest ? (
            <div className="text-center">
              <div className="w-20 h-20 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Clock className="w-10 h-10 text-yellow-600" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Request Pending</h2>
              <p className="text-gray-600 mb-4">
                Your role assignment request has been submitted and is awaiting review by an administrator.
              </p>
              <div className="p-4 bg-yellow-50 rounded-xl text-sm text-yellow-800 mb-4">
                <p><strong>Requested Role:</strong> {existingRequest.requested_role}</p>
                <p className="mt-1"><strong>Status:</strong> Pending</p>
                {existingRequest.message && (
                  <p className="mt-1"><strong>Your Message:</strong> {existingRequest.message}</p>
                )}
              </div>
              <p className="text-sm text-gray-500">
                You will be notified once your request is processed.
              </p>
            </div>
          ) : showForm ? (
            <div>
              <div className="text-center mb-6">
                <UserCircle className="w-16 h-16 text-blue-500 mx-auto mb-3" />
                <h2 className="text-xl font-bold text-gray-900">Request Role Assignment</h2>
                <p className="text-sm text-gray-500">Select the role that best describes you</p>
              </div>
              
              <div className="space-y-4">
                <div>
                  <Label>Select Your Role *</Label>
                  <Select value={requestedRole} onValueChange={setRequestedRole}>
                    <SelectTrigger className="mt-1">
                      <SelectValue placeholder="Choose a role..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="student">Student</SelectItem>
                      <SelectItem value="teacher">Teacher</SelectItem>
                      <SelectItem value="parent">Parent/Guardian</SelectItem>
                      <SelectItem value="vendor">Vendor</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <Label>Additional Information (Optional)</Label>
                  <Textarea
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="Provide any additional information that might help the administrator..."
                    rows={3}
                    className="mt-1"
                  />
                </div>
                
                <div className="flex gap-3 pt-2">
                  <Button variant="outline" onClick={() => setShowForm(false)} className="flex-1">
                    Cancel
                  </Button>
                  <Button 
                    onClick={handleSubmit} 
                    disabled={submitRequestMutation.isPending}
                    className="flex-1 bg-blue-600 hover:bg-blue-700"
                  >
                    <Send className="w-4 h-4 mr-2" />
                    {submitRequestMutation.isPending ? 'Submitting...' : 'Submit Request'}
                  </Button>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center">
              <UserCircle className="w-20 h-20 text-gray-400 mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-gray-900 mb-2">No Role Assigned</h2>
              <p className="text-gray-600 mb-6">
                Your account has been created but no role has been assigned yet. 
                Request a role assignment so you can access the system.
              </p>
              
              <div className="p-4 bg-blue-50 rounded-xl text-sm text-blue-800 mb-6">
                <p><strong>Email:</strong> {user?.email}</p>
                <p><strong>Name:</strong> {user?.full_name || 'Not set'}</p>
              </div>
              
              <Button 
                onClick={() => setShowForm(true)}
                className="w-full bg-blue-600 hover:bg-blue-700"
              >
                <Send className="w-4 h-4 mr-2" />
                Request Role Assignment
              </Button>
              
              <p className="text-xs text-gray-500 mt-4">
                Or contact your school administrator directly
              </p>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}