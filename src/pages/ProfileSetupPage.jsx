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
          navigate('/activation');
          return;
        }

        // If already completed, redirect to dashboard
        if (currentUser.profile_completed) {
          redirectToDashboard(currentUser);
          return;
        }

        // Initialize form data based on user type
        if (currentUser.user_type === 'teacher') {
          // Try to fetch existing teacher record if linked
          if (currentUser.linked_teacher_id) {
            const teacher = await base44.entities.Teacher.filter({ id: currentUser.linked_teacher_id });
            if (teacher.length > 0) {
              setFormData({
                first_name: teacher[0].first_name || '',
                last_name: teacher[0].last_name || '',
                staff_id: teacher[0].staff_id || '',
                email: currentUser.email || '',
                phone: teacher[0].phone || '',
                department: teacher[0].department || '',
                position: teacher[0].position || '',
                hire_date: teacher[0].hire_date || '',
              });
            }
          }
        } else if (currentUser.user_type === 'student') {
          if (currentUser.linked_student_id) {
            const student = await base44.entities.Student.filter({ id: currentUser.linked_student_id });
            if (student.length > 0) {
              setFormData({
                first_name: student[0].first_name || '',
                last_name: student[0].last_name || '',
                student_id: student[0].student_id || '',
                email: currentUser.email || '',
                phone: student[0].phone || '',
                address: student[0].address || '',
              });
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

  const redirectToDashboard = (user) => {
    if (user.role === 'admin' || user.user_type === 'admin') {
      navigate('/admin-dashboard');
    } else if (user.user_type === 'teacher') {
      navigate('/teacher-dashboard');
    } else if (user.user_type === 'student') {
      navigate('/student-dashboard');
    } else if (user.user_type === 'parent') {
      navigate('/parent-portal');
    } else {
      navigate('/dashboard');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await base44.functions.invoke('completeUserProfile', {
        user_type: user.user_type,
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
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="first_name">First Name *</Label>
          <Input
            id="first_name"
            value={formData.first_name || ''}
            onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
            required
          />
        </div>
        <div>
          <Label htmlFor="last_name">Last Name *</Label>
          <Input
            id="last_name"
            value={formData.last_name || ''}
            onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
            required
          />
        </div>
      </div>

      <div>
        <Label htmlFor="staff_id">Staff ID</Label>
        <Input
          id="staff_id"
          value={formData.staff_id || ''}
          disabled
          className="bg-gray-50"
        />
        <p className="text-xs text-gray-500 mt-1">This field cannot be edited</p>
      </div>

      <div>
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          type="email"
          value={formData.email || user?.email || ''}
          disabled
          className="bg-gray-50"
        />
        <p className="text-xs text-gray-500 mt-1">This field cannot be edited</p>
      </div>

      <div>
        <Label htmlFor="phone">Phone Number</Label>
        <Input
          id="phone"
          type="tel"
          value={formData.phone || ''}
          onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
        />
      </div>

      <div>
        <Label htmlFor="department">Department or Subject Area</Label>
        <Input
          id="department"
          value={formData.department || ''}
          onChange={(e) => setFormData({ ...formData, department: e.target.value })}
        />
      </div>

      <div>
        <Label htmlFor="position">Job Title/Position</Label>
        <Input
          id="position"
          value={formData.position || ''}
          onChange={(e) => setFormData({ ...formData, position: e.target.value })}
        />
      </div>

      <div>
        <Label htmlFor="hire_date">Date of Hire</Label>
        <Input
          id="hire_date"
          type="date"
          value={formData.hire_date || ''}
          onChange={(e) => setFormData({ ...formData, hire_date: e.target.value })}
        />
      </div>
    </>
  );

  const renderStudentForm = () => (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="first_name">First Name *</Label>
          <Input
            id="first_name"
            value={formData.first_name || ''}
            onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
            required
          />
        </div>
        <div>
          <Label htmlFor="last_name">Last Name *</Label>
          <Input
            id="last_name"
            value={formData.last_name || ''}
            onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
            required
          />
        </div>
      </div>

      <div>
        <Label htmlFor="student_id">Student ID</Label>
        <Input
          id="student_id"
          value={formData.student_id || ''}
          disabled
          className="bg-gray-50"
        />
        <p className="text-xs text-gray-500 mt-1">This field cannot be edited</p>
      </div>

      <div>
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          type="email"
          value={formData.email || user?.email || ''}
          disabled
          className="bg-gray-50"
        />
        <p className="text-xs text-gray-500 mt-1">This field cannot be edited</p>
      </div>

      <div>
        <Label htmlFor="phone">Phone Number</Label>
        <Input
          id="phone"
          type="tel"
          value={formData.phone || ''}
          onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
        />
      </div>

      <div>
        <Label htmlFor="address">Address</Label>
        <Textarea
          id="address"
          value={formData.address || ''}
          onChange={(e) => setFormData({ ...formData, address: e.target.value })}
        />
      </div>
    </>
  );

  const renderParentForm = () => (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="first_name">First Name *</Label>
          <Input
            id="first_name"
            value={formData.first_name || ''}
            onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
            required
          />
        </div>
        <div>
          <Label htmlFor="last_name">Last Name *</Label>
          <Input
            id="last_name"
            value={formData.last_name || ''}
            onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
            required
          />
        </div>
      </div>

      <div>
        <Label htmlFor="phone">Phone Number *</Label>
        <Input
          id="phone"
          type="tel"
          value={formData.phone || ''}
          onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
          required
        />
      </div>

      <div>
        <Label htmlFor="address">Address</Label>
        <Textarea
          id="address"
          value={formData.address || ''}
          onChange={(e) => setFormData({ ...formData, address: e.target.value })}
        />
      </div>
    </>
  );

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 flex items-center justify-center p-6">
      <Card className="max-w-2xl w-full">
        <CardHeader className="text-center">
          <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <UserCircle className="w-8 h-8 text-blue-600" />
          </div>
          <CardTitle className="text-2xl">Complete Your Profile</CardTitle>
          <CardDescription>
            Please review and update your information to complete your profile setup
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="mb-6 p-3 bg-gray-50 rounded-lg">
            <p className="text-sm text-gray-600">Account Type:</p>
            <p className="font-medium capitalize">{user.user_type}</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {user.user_type === 'teacher' && renderTeacherForm()}
            {user.user_type === 'student' && renderStudentForm()}
            {user.user_type === 'parent' && renderParentForm()}

            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? 'Saving...' : 'Complete Profile'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}