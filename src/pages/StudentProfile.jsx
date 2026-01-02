import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '../utils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { User, Mail, Phone, MapPin, Calendar, Hash } from 'lucide-react';
import { toast } from 'sonner';

export default function StudentProfile() {
  const [user, setUser] = useState(null);
  const [student, setStudent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [formData, setFormData] = useState({});

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const currentUser = await base44.auth.me();
      setUser(currentUser);

      const students = await base44.entities.Student.filter({ user_id: currentUser.id });
      if (students.length > 0) {
        setStudent(students[0]);
        setFormData({
          phone: students[0].phone || '',
          address: students[0].address || '',
        });
      }
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Failed to load profile');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdate = async () => {
    try {
      await base44.entities.Student.update(student.id, formData);
      toast.success('Profile updated successfully');
      setEditing(false);
      fetchData();
    } catch (error) {
      console.error('Error updating profile:', error);
      toast.error('Failed to update profile');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!student) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-600">No student profile found</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-900">My Profile</h1>
        {!editing && (
          <Button onClick={() => setEditing(true)}>Edit Profile</Button>
        )}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="w-5 h-5" />
            Personal Information
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label className="flex items-center gap-2 text-gray-600">
                <User className="w-4 h-4" />
                Full Name
              </Label>
              <p className="text-lg font-medium">{student.first_name} {student.last_name}</p>
            </div>
            <div>
              <Label className="flex items-center gap-2 text-gray-600">
                <Hash className="w-4 h-4" />
                Student ID
              </Label>
              <p className="text-lg font-medium">{student.student_id_number}</p>
            </div>
            <div>
              <Label className="flex items-center gap-2 text-gray-600">
                <Mail className="w-4 h-4" />
                Email
              </Label>
              <p className="text-lg font-medium">{user?.email}</p>
            </div>
            <div>
              <Label className="flex items-center gap-2 text-gray-600">
                <Calendar className="w-4 h-4" />
                Grade Level
              </Label>
              <p className="text-lg font-medium">{student.grade_level}</p>
            </div>
          </div>

          {editing ? (
            <div className="space-y-4 pt-4 border-t">
              <div>
                <Label htmlFor="phone">Phone Number</Label>
                <Input
                  id="phone"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="address">Address</Label>
                <Textarea
                  id="address"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                />
              </div>
              <div className="flex gap-2">
                <Button onClick={handleUpdate}>Save Changes</Button>
                <Button variant="outline" onClick={() => setEditing(false)}>Cancel</Button>
              </div>
            </div>
          ) : (
            <>
              <div>
                <Label className="flex items-center gap-2 text-gray-600">
                  <Phone className="w-4 h-4" />
                  Phone Number
                </Label>
                <p className="text-lg font-medium">{student.phone || 'Not provided'}</p>
              </div>
              <div>
                <Label className="flex items-center gap-2 text-gray-600">
                  <MapPin className="w-4 h-4" />
                  Address
                </Label>
                <p className="text-lg font-medium">{student.address || 'Not provided'}</p>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}