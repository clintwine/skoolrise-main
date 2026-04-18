import React, { useState, useEffect } from 'react';
import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AlertCircle, CheckCircle, UserCircle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

export default function ProfileSetupPage() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({});

  useEffect(() => {
    const checkUser = async () => {
      try {
        const currentUser = await base44.auth.me();
        setUser(currentUser);

        // If not activated, redirect to activation
        if (!currentUser.is_activated) {
          navigate('/ActivationPage', { replace: true });
          return;
        }

        // If already completed, redirect to dashboard
        if (currentUser.profile_completed) {
          redirectToDashboard(currentUser);
          return;
        }

        // Initialize form data based on user type
        const userType = currentUser.user_type || '';
        
        // Default form data
        const nameParts = (currentUser.full_name || '').split(' ');
        const initialFormData = {
          email: currentUser.email || '',
          first_name: nameParts[0] || '',
          last_name: nameParts.slice(1).join(' ') || '',
        };

        setFormData(initialFormData);

        if (userType === 'teacher') {
          if (currentUser.linked_teacher_id) {
            const teachers = await base44.entities.Teacher.filter({ id: currentUser.linked_teacher_id });
            if (teachers.length > 0) {
              setFormData(prev => ({
                ...prev,
                first_name: teachers[0].first_name || prev.first_name,
                last_name: teachers[0].last_name || prev.last_name,
                staff_id: teachers[0].staff_id || '',
                phone: teachers[0].phone || '',
                department: teachers[0].department || '',
                position: teachers[0].position || '',
                hire_date: teachers[0].hire_date || '',
              }));
            }
          }
        } else if (userType === 'student') {
          if (currentUser.linked_student_id) {
            const students = await base44.entities.Student.filter({ id: currentUser.linked_student_id });
            if (students.length > 0) {
              setFormData(prev => ({
                ...prev,
                first_name: students[0].first_name || prev.first_name,
                last_name: students[0].last_name || prev.last_name,
                student_id_number: students[0].student_id_number || '',
                phone: students[0].phone || '',
                address: students[0].address || '',
              }));
            }
          }
        } else if (userType === 'parent') {
          if (currentUser.linked_parent_id) {
            const parents = await base44.entities.Parent.filter({ id: currentUser.linked_parent_id });
            if (parents.length > 0) {
              setFormData(prev => ({
                ...prev,
                first_name: parents[0].first_name || prev.first_name,
                last_name: parents[0].last_name || prev.last_name,
                phone: parents[0].phone || '',
                address: parents[0].address || '',
              }));
            }
          }
        } else if (userType === 'vendor') {
          if (currentUser.linked_vendor_id) {
            const vendors = await base44.entities.Vendor.filter({ id: currentUser.linked_vendor_id });
            if (vendors.length > 0) {
              setFormData(prev => ({
                ...prev,
                business_name: vendors[0].business_name || '',
                contact_person: vendors[0].contact_person || '',
                phone: vendors[0].phone || '',
                category: vendors[0].category || '',
                address: vendors[0].address || '',
              }));
            }
          }
        }
      } catch (err) {
        console.error('Error fetching user:', err);
        setError('Failed to load user information');
      }
    };
    checkUser();
  }, [navigate]);

  const redirectToDashboard = (u) => {
    const userType = u.user_type || '';
    const isAdmin = u.role === 'admin' || userType === 'admin';

    if (isAdmin) {
      navigate('/AdminDashboard', { replace: true });
    } else if (userType === 'teacher') {
      navigate('/TeacherDashboard', { replace: true });
    } else if (userType === 'student') {
      navigate('/StudentDashboard', { replace: true });
    } else if (userType === 'parent') {
      navigate('/ParentPortal', { replace: true });
    } else if (userType === 'vendor') {
      navigate('/VendorDashboard', { replace: true });
    } else {
      navigate('/AdminDashboard', { replace: true });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const primaryType = user.user_type || 'teacher';

      const response = await base44.functions.invoke('completeUserProfile', {
        user_type: primaryType,
        profile_data: formData
      });

      if (response.data.success) {
        // Refresh user data
        const updatedUser = await base44.auth.me();
        redirectToDashboard(updatedUser);
      } else {
        setError(response.data.message || 'Failed to save profile');
      }
    } catch (err) {
      setError('Failed to save profile. Please try again.');
      console.error('Profile save error:', err);
    } finally {
      setLoading(false);
    }
  };

  const renderTeacherForm = () => (
    <>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
        <div>
          <Label htmlFor="first_name" className="text-sm">First Name *</Label>
          <Input
            id="first_name"
            value={formData.first_name || ''}
            onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
            required
            className="py-2 text-sm"
          />
        </div>
        <div>
          <Label htmlFor="last_name" className="text-sm">Last Name *</Label>
          <Input
            id="last_name"
            value={formData.last_name || ''}
            onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
            required
            className="py-2 text-sm"
          />
        </div>
      </div>

      <div>
        <Label htmlFor="staff_id" className="text-sm">Staff ID</Label>
        <Input
          id="staff_id"
          value={formData.staff_id || ''}
          disabled
          className="bg-gray-50 py-2 text-sm"
        />
        <p className="text-xs text-gray-500 mt-1">This field cannot be edited</p>
      </div>

      <div>
        <Label htmlFor="email" className="text-sm">Email</Label>
        <Input
          id="email"
          type="email"
          value={formData.email || user?.email || ''}
          disabled
          className="bg-gray-50 py-2 text-sm"
        />
        <p className="text-xs text-gray-500 mt-1">This field cannot be edited</p>
      </div>

      <div>
        <Label htmlFor="phone" className="text-sm">Phone Number</Label>
        <Input
          id="phone"
          type="tel"
          value={formData.phone || ''}
          onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
          className="py-2 text-sm"
        />
      </div>

      <div>
        <Label htmlFor="department" className="text-sm">Department or Subject Area</Label>
        <Input
          id="department"
          value={formData.department || ''}
          onChange={(e) => setFormData({ ...formData, department: e.target.value })}
          className="py-2 text-sm"
        />
      </div>

      <div>
        <Label htmlFor="position" className="text-sm">Job Title/Position</Label>
        <Input
          id="position"
          value={formData.position || ''}
          onChange={(e) => setFormData({ ...formData, position: e.target.value })}
          className="py-2 text-sm"
        />
      </div>

      <div>
        <Label htmlFor="hire_date" className="text-sm">Date of Hire</Label>
        <Input
          id="hire_date"
          type="date"
          value={formData.hire_date || ''}
          onChange={(e) => setFormData({ ...formData, hire_date: e.target.value })}
          className="py-2 text-sm"
        />
      </div>
    </>
  );

  const renderStudentForm = () => (
    <>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
        <div>
          <Label htmlFor="first_name" className="text-sm">First Name *</Label>
          <Input
            id="first_name"
            value={formData.first_name || ''}
            onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
            required
            className="py-2 text-sm"
          />
        </div>
        <div>
          <Label htmlFor="last_name" className="text-sm">Last Name *</Label>
          <Input
            id="last_name"
            value={formData.last_name || ''}
            onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
            required
            className="py-2 text-sm"
          />
        </div>
      </div>

      <div>
        <Label htmlFor="student_id_number" className="text-sm">Student ID</Label>
        <Input
          id="student_id_number"
          value={formData.student_id_number || ''}
          disabled
          className="bg-gray-50 py-2 text-sm"
        />
        <p className="text-xs text-gray-500 mt-1">This field cannot be edited</p>
      </div>

      <div>
        <Label htmlFor="email" className="text-sm">Email</Label>
        <Input
          id="email"
          type="email"
          value={formData.email || user?.email || ''}
          disabled
          className="bg-gray-50 py-2 text-sm"
        />
        <p className="text-xs text-gray-500 mt-1">This field cannot be edited</p>
      </div>

      <div>
        <Label htmlFor="phone" className="text-sm">Phone Number</Label>
        <Input
          id="phone"
          type="tel"
          value={formData.phone || ''}
          onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
          className="py-2 text-sm"
        />
      </div>

      <div>
        <Label htmlFor="address" className="text-sm">Address</Label>
        <Textarea
          id="address"
          value={formData.address || ''}
          onChange={(e) => setFormData({ ...formData, address: e.target.value })}
          className="py-2 text-sm"
        />
      </div>
    </>
  );

  const renderParentForm = () => (
    <>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
        <div>
          <Label htmlFor="first_name" className="text-sm">First Name *</Label>
          <Input
            id="first_name"
            value={formData.first_name || ''}
            onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
            required
            className="py-2 text-sm"
          />
        </div>
        <div>
          <Label htmlFor="last_name" className="text-sm">Last Name *</Label>
          <Input
            id="last_name"
            value={formData.last_name || ''}
            onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
            required
            className="py-2 text-sm"
          />
        </div>
      </div>

      <div>
        <Label htmlFor="phone" className="text-sm">Phone Number *</Label>
        <Input
          id="phone"
          type="tel"
          value={formData.phone || ''}
          onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
          required
          className="py-2 text-sm"
        />
      </div>

      <div>
        <Label htmlFor="address" className="text-sm">Address</Label>
        <Textarea
          id="address"
          value={formData.address || ''}
          onChange={(e) => setFormData({ ...formData, address: e.target.value })}
          className="py-2 text-sm"
        />
      </div>
    </>
  );

  const renderVendorForm = () => (
    <>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
        <div>
          <Label htmlFor="business_name" className="text-sm">Business Name *</Label>
          <Input
            id="business_name"
            value={formData.business_name || ''}
            onChange={(e) => setFormData({ ...formData, business_name: e.target.value })}
            required
            className="py-2 text-sm"
          />
        </div>
        <div>
          <Label htmlFor="contact_person" className="text-sm">Contact Person *</Label>
          <Input
            id="contact_person"
            value={formData.contact_person || ''}
            onChange={(e) => setFormData({ ...formData, contact_person: e.target.value })}
            required
            className="py-2 text-sm"
          />
        </div>
      </div>

      <div>
        <Label htmlFor="phone" className="text-sm">Phone Number</Label>
        <Input
          id="phone"
          type="tel"
          value={formData.phone || ''}
          onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
          className="py-2 text-sm"
        />
      </div>

      <div>
        <Label htmlFor="category" className="text-sm">Category *</Label>
        <Select
          value={formData.category || ''}
          onValueChange={(value) => setFormData({ ...formData, category: value })}
        >
          <SelectTrigger className="py-2 text-sm">
            <SelectValue placeholder="Select a category" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="Publisher">Publisher</SelectItem>
            <SelectItem value="Marketer">Marketer</SelectItem>
            <SelectItem value="Distributor">Distributor</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div>
        <Label htmlFor="address" className="text-sm">Address</Label>
        <Textarea
          id="address"
          value={formData.address || ''}
          onChange={(e) => setFormData({ ...formData, address: e.target.value })}
          className="py-2 text-sm"
        />
      </div>
    </>
  );

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 sm:h-12 sm:w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 flex items-center justify-center p-4 sm:p-6">
      <Card className="max-w-2xl w-full">
        <CardHeader className="text-center p-4 sm:p-6">
          <div className="w-12 h-12 sm:w-16 sm:h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4">
            <UserCircle className="w-6 h-6 sm:w-8 sm:h-8 text-blue-600" />
          </div>
          <CardTitle className="text-xl sm:text-2xl">Complete Your Profile</CardTitle>
          <CardDescription className="text-sm sm:text-base">
            Please review and update your information to complete your profile setup
          </CardDescription>
        </CardHeader>
        <CardContent className="p-4 sm:p-6 pt-0 sm:pt-0">
          <div className="mb-4 sm:mb-6 p-3 bg-gray-50 rounded-lg">
            <p className="text-sm text-gray-600">Account Type:</p>
            <p className="font-medium capitalize">{user.user_type || 'User'}</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-3 sm:space-y-4">
            {user.user_type === 'teacher' && renderTeacherForm()}
            {user.user_type === 'student' && renderStudentForm()}
            {user.user_type === 'parent' && renderParentForm()}
            {user.user_type === 'vendor' && renderVendorForm()}

            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <Button type="submit" className="w-full text-sm sm:text-base py-2.5 sm:py-3" disabled={loading}>
              {loading ? 'Saving...' : 'Complete Profile'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}