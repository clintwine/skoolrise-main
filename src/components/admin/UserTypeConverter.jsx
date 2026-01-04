import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { RefreshCw, AlertTriangle, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';

export default function UserTypeConverter({ user, open, onClose }) {
  const [newUserType, setNewUserType] = useState('');
  const [converting, setConverting] = useState(false);
  const queryClient = useQueryClient();

  const convertMutation = useMutation({
    mutationFn: async () => {
      const oldType = user.user_type;
      
      // Step 1: Update user_type in User entity
      await base44.entities.User.update(user.id, { user_type: newUserType });

      // Step 2: Create new profile entity and update profile_id reference
      if (newUserType === 'student') {
        const student = await base44.entities.Student.create({
          user_id: user.id,
          first_name: user.full_name?.split(' ')[0] || '',
          last_name: user.full_name?.split(' ').slice(1).join(' ') || '',
          student_id_number: `STU${Date.now()}`,
          grade_level: 'Not Set',
          status: 'Active',
        });
        await base44.entities.User.update(user.id, { student_profile_id: student.id });
      } else if (newUserType === 'teacher') {
        const teacher = await base44.entities.Teacher.create({
          user_id: user.id,
          first_name: user.full_name?.split(' ')[0] || '',
          last_name: user.full_name?.split(' ').slice(1).join(' ') || '',
          staff_id: `STAFF${Date.now()}`,
          status: 'Active',
        });
        await base44.entities.User.update(user.id, { teacher_profile_id: teacher.id });
      } else if (newUserType === 'parent') {
        const parent = await base44.entities.Parent.create({
          user_id: user.id,
          first_name: user.full_name?.split(' ')[0] || '',
          last_name: user.full_name?.split(' ').slice(1).join(' ') || '',
          phone: 'Not Set',
          linked_student_ids: '[]',
        });
        await base44.entities.User.update(user.id, { parent_profile_id: parent.id });
      } else if (newUserType === 'vendor') {
        const vendor = await base44.entities.Vendor.create({
          user_id: user.id,
          business_name: user.full_name || 'Not Set',
          contact_person: user.full_name || '',
          category: 'Distributor',
        });
        await base44.entities.User.update(user.id, { vendor_profile_id: vendor.id });
      }

      // Step 3: Clear old profile_id reference
      const clearField = {};
      if (oldType === 'student') clearField.student_profile_id = null;
      else if (oldType === 'teacher') clearField.teacher_profile_id = null;
      else if (oldType === 'parent') clearField.parent_profile_id = null;
      else if (oldType === 'vendor') clearField.vendor_profile_id = null;
      
      if (Object.keys(clearField).length > 0) {
        await base44.entities.User.update(user.id, clearField);
      }

      return { oldType, newUserType };
    },
    onSuccess: ({ oldType, newUserType }) => {
      queryClient.invalidateQueries();
      toast.success(`User type changed from ${oldType} to ${newUserType}`);
      onClose();
    },
    onError: (error) => {
      toast.error('Failed to convert user type: ' + error.message);
    },
  });

  const handleConvert = async () => {
    if (!newUserType) return;
    setConverting(true);
    await convertMutation.mutateAsync();
    setConverting(false);
  };

  const getUserTypeLabel = (type) => {
    return type.charAt(0).toUpperCase() + type.slice(1);
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md bg-white">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <RefreshCw className="w-5 h-5 text-blue-600" />
            Convert User Type
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <Alert className="bg-yellow-50 border-yellow-200">
            <AlertTriangle className="w-4 h-4 text-yellow-600" />
            <AlertDescription className="text-sm text-yellow-800">
              Converting user type will create a new profile and may clear some existing data. This action cannot be easily undone.
            </AlertDescription>
          </Alert>

          <div>
            <label className="text-sm font-medium text-gray-700 mb-2 block">Current User Type</label>
            <div className="p-3 bg-gray-100 rounded-lg text-gray-900 font-medium">
              {getUserTypeLabel(user?.user_type || 'unknown')}
            </div>
          </div>

          <div>
            <label className="text-sm font-medium text-gray-700 mb-2 block">New User Type</label>
            <Select value={newUserType} onValueChange={setNewUserType}>
              <SelectTrigger>
                <SelectValue placeholder="Select new user type" />
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

          <div className="flex justify-end gap-2 pt-4">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button 
              onClick={handleConvert}
              disabled={!newUserType || converting || newUserType === user?.user_type}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              {converting ? (
                <>
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                  Converting...
                </>
              ) : (
                <>
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Convert User Type
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}