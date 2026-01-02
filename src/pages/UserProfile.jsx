import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  User, Mail, Phone, Calendar, Award, BookOpen, 
  Users, Edit, Save, X, GraduationCap, Briefcase,
  MapPin, FileText, Clock
} from 'lucide-react';
import { format } from 'date-fns';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';

export default function UserProfile() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [currentUser, setCurrentUser] = useState(null);
  const [editMode, setEditMode] = useState(false);
  const [formData, setFormData] = useState({});

  // Parse URL parameters
  const urlParams = new URLSearchParams(window.location.search);
  const targetUserId = urlParams.get('id');
  const targetRole = urlParams.get('role');

  useEffect(() => {
    const fetchCurrentUser = async () => {
      const user = await base44.auth.me();
      setCurrentUser(user);
    };
    fetchCurrentUser();
  }, []);

  // Fetch target user or current user
  const { data: userRecord } = useQuery({
    queryKey: ['user-record', targetUserId],
    queryFn: async () => {
      if (targetUserId) {
        const users = await base44.entities.User.list();
        return users.find(u => u.id === targetUserId);
      }
      return currentUser;
    },
    enabled: !!currentUser,
  });

  // Determine role profile to fetch
  const profileRole = targetRole || (userRecord?.user_types && userRecord.user_types[0]) || 'user';

  // Fetch Student Profile
  const { data: studentProfile } = useQuery({
    queryKey: ['student-profile', userRecord?.id],
    queryFn: async () => {
      if (!userRecord?.id) return null;
      const students = await base44.entities.Student.filter({ user_id: userRecord.id });
      return students[0] || null;
    },
    enabled: !!userRecord && (profileRole === 'student' || profileRole === 'user'),
  });

  // Fetch Teacher Profile
  const { data: teacherProfile } = useQuery({
    queryKey: ['teacher-profile', userRecord?.id],
    queryFn: async () => {
      if (!userRecord?.id) return null;
      const teachers = await base44.entities.Teacher.filter({ user_id: userRecord.id });
      return teachers[0] || null;
    },
    enabled: !!userRecord && (profileRole === 'teacher' || profileRole === 'admin'),
  });

  // Fetch Parent Profile
  const { data: parentProfile } = useQuery({
    queryKey: ['parent-profile', userRecord?.id],
    queryFn: async () => {
      if (!userRecord?.id) return null;
      const parents = await base44.entities.Parent.filter({ user_id: userRecord.id });
      return parents[0] || null;
    },
    enabled: !!userRecord && profileRole === 'parent',
  });

  // Fetch related data based on role
  const { data: enrollments = [] } = useQuery({
    queryKey: ['enrollments', studentProfile?.id],
    queryFn: async () => {
      if (!studentProfile?.id) return [];
      return await base44.entities.Enrollment.filter({ student_id: studentProfile.id });
    },
    enabled: !!studentProfile,
  });

  const { data: grades = [] } = useQuery({
    queryKey: ['grades', studentProfile?.id],
    queryFn: async () => {
      if (!studentProfile?.id) return [];
      const submissions = await base44.entities.Submission.filter({ student_id: studentProfile.id });
      return submissions.filter(s => s.grade !== null);
    },
    enabled: !!studentProfile,
  });

  const { data: attendance = [] } = useQuery({
    queryKey: ['attendance', studentProfile?.id],
    queryFn: async () => {
      if (!studentProfile?.id) return [];
      return await base44.entities.Attendance.filter({ student_id: studentProfile.id });
    },
    enabled: !!studentProfile,
  });

  const { data: teacherClasses = [] } = useQuery({
    queryKey: ['teacher-classes', teacherProfile?.id],
    queryFn: async () => {
      if (!teacherProfile?.id) return [];
      return await base44.entities.Class.filter({ teacher_id: teacherProfile.id });
    },
    enabled: !!teacherProfile,
  });

  const { data: linkedChildren = [] } = useQuery({
    queryKey: ['linked-children', parentProfile?.id],
    queryFn: async () => {
      if (!parentProfile?.id) return [];
      return await base44.entities.Student.filter({ parent_id: parentProfile.id });
    },
    enabled: !!parentProfile,
  });

  // Update mutations
  const updateStudentMutation = useMutation({
    mutationFn: async (data) => {
      await base44.entities.Student.update(studentProfile.id, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['student-profile'] });
      toast.success('Profile updated successfully');
      setEditMode(false);
    },
  });

  const updateTeacherMutation = useMutation({
    mutationFn: async (data) => {
      await base44.entities.Teacher.update(teacherProfile.id, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['teacher-profile'] });
      toast.success('Profile updated successfully');
      setEditMode(false);
    },
  });

  const updateParentMutation = useMutation({
    mutationFn: async (data) => {
      await base44.entities.Parent.update(parentProfile.id, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['parent-profile'] });
      toast.success('Profile updated successfully');
      setEditMode(false);
    },
  });

  useEffect(() => {
    if (studentProfile) setFormData(studentProfile);
    else if (teacherProfile) setFormData(teacherProfile);
    else if (parentProfile) setFormData(parentProfile);
  }, [studentProfile, teacherProfile, parentProfile]);

  const handleSave = () => {
    if (studentProfile) updateStudentMutation.mutate(formData);
    else if (teacherProfile) updateTeacherMutation.mutate(formData);
    else if (parentProfile) updateParentMutation.mutate(formData);
  };

  const isOwnProfile = !targetUserId || targetUserId === currentUser?.id;
  const canEdit = isOwnProfile || currentUser?.role === 'admin';

  const profile = studentProfile || teacherProfile || parentProfile;

  if (!currentUser || !userRecord) {
    return <div className="text-center py-12"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-accent mx-auto"></div></div>;
  }

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold text-text">
            {isOwnProfile ? 'My Profile' : `${profile?.first_name} ${profile?.last_name}`}
          </h1>
          <p className="text-text-secondary mt-2">
            {profileRole === 'student' && 'Student Profile'}
            {profileRole === 'teacher' && 'Teacher Profile'}
            {profileRole === 'parent' && 'Parent Profile'}
          </p>
        </div>
        
        {canEdit && (
          <div className="flex gap-2">
            {editMode ? (
              <>
                <Button variant="outline" onClick={() => setEditMode(false)}>
                  <X className="w-4 h-4 mr-2" />
                  Cancel
                </Button>
                <Button onClick={handleSave} className="bg-accent hover:bg-accent-hover text-white">
                  <Save className="w-4 h-4 mr-2" />
                  Save Changes
                </Button>
              </>
            ) : (
              <Button onClick={() => setEditMode(true)} className="bg-accent hover:bg-accent-hover text-white">
                <Edit className="w-4 h-4 mr-2" />
                Edit Profile
              </Button>
            )}
          </div>
        )}
      </div>

      {/* Profile Header Card */}
      <Card className="bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-2xl shadow-lg">
        <CardContent className="p-8">
          <div className="flex items-center gap-6">
            <div className="w-24 h-24 rounded-full bg-white/20 flex items-center justify-center">
              <User className="w-12 h-12" />
            </div>
            <div className="flex-1">
              <h2 className="text-3xl font-bold mb-2">
                {profile?.first_name} {profile?.last_name}
              </h2>
              <div className="flex flex-wrap gap-3 text-sm">
                {userRecord?.email && (
                  <div className="flex items-center gap-2">
                    <Mail className="w-4 h-4" />
                    {userRecord.email}
                  </div>
                )}
                {profile?.phone && (
                  <div className="flex items-center gap-2">
                    <Phone className="w-4 h-4" />
                    {profile.phone}
                  </div>
                )}
                {studentProfile?.student_id_number && (
                  <Badge className="bg-white/20">ID: {studentProfile.student_id_number}</Badge>
                )}
                {teacherProfile?.staff_id && (
                  <Badge className="bg-white/20">Staff ID: {teacherProfile.staff_id}</Badge>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Role-Based Tabs */}
      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full" style={{ gridTemplateColumns: `repeat(${profileRole === 'student' ? 4 : profileRole === 'teacher' ? 3 : 2}, 1fr)` }}>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          {profileRole === 'student' && (
            <>
              <TabsTrigger value="grades">Grades</TabsTrigger>
              <TabsTrigger value="attendance">Attendance</TabsTrigger>
              <TabsTrigger value="family">Family Info</TabsTrigger>
            </>
          )}
          {profileRole === 'teacher' && (
            <>
              <TabsTrigger value="classes">My Classes</TabsTrigger>
              <TabsTrigger value="professional">Professional Info</TabsTrigger>
            </>
          )}
          {profileRole === 'parent' && (
            <TabsTrigger value="children">My Children</TabsTrigger>
          )}
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview">
          <Card className="bg-white rounded-2xl shadow-md">
            <CardHeader>
              <CardTitle>Personal Information</CardTitle>
            </CardHeader>
            <CardContent>
              {editMode ? (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>First Name *</Label>
                    <Input
                      value={formData.first_name || ''}
                      onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label>Last Name *</Label>
                    <Input
                      value={formData.last_name || ''}
                      onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label>Phone</Label>
                    <Input
                      value={formData.phone || ''}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      className="mt-1"
                    />
                  </div>
                  {studentProfile && (
                    <>
                      <div>
                        <Label>Date of Birth</Label>
                        <Input
                          type="date"
                          value={formData.date_of_birth || ''}
                          onChange={(e) => setFormData({ ...formData, date_of_birth: e.target.value })}
                          className="mt-1"
                        />
                      </div>
                      <div>
                        <Label>Gender</Label>
                        <Input
                          value={formData.gender || ''}
                          onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                          className="mt-1"
                        />
                      </div>
                      <div>
                        <Label>Grade Level</Label>
                        <Input
                          value={formData.grade_level || ''}
                          onChange={(e) => setFormData({ ...formData, grade_level: e.target.value })}
                          className="mt-1"
                        />
                      </div>
                      <div className="col-span-2">
                        <Label>Medical Conditions</Label>
                        <Textarea
                          value={formData.medical_conditions || ''}
                          onChange={(e) => setFormData({ ...formData, medical_conditions: e.target.value })}
                          rows={3}
                          className="mt-1"
                        />
                      </div>
                    </>
                  )}
                  {teacherProfile && (
                    <>
                      <div>
                        <Label>Department</Label>
                        <Input
                          value={formData.department || ''}
                          onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                          className="mt-1"
                        />
                      </div>
                      <div>
                        <Label>Position</Label>
                        <Input
                          value={formData.position || ''}
                          onChange={(e) => setFormData({ ...formData, position: e.target.value })}
                          className="mt-1"
                        />
                      </div>
                      <div className="col-span-2">
                        <Label>Qualifications</Label>
                        <Textarea
                          value={formData.qualifications || ''}
                          onChange={(e) => setFormData({ ...formData, qualifications: e.target.value })}
                          rows={3}
                          className="mt-1"
                        />
                      </div>
                    </>
                  )}
                  <div className="col-span-2">
                    <Label>Address</Label>
                    <Textarea
                      value={formData.address || ''}
                      onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                      rows={2}
                      className="mt-1"
                    />
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <p className="text-sm text-text-secondary mb-1">Full Name</p>
                    <p className="font-medium text-text">{profile?.first_name} {profile?.last_name}</p>
                  </div>
                  <div>
                    <p className="text-sm text-text-secondary mb-1">Email</p>
                    <p className="font-medium text-text">{userRecord?.email}</p>
                  </div>
                  {profile?.phone && (
                    <div>
                      <p className="text-sm text-text-secondary mb-1">Phone</p>
                      <p className="font-medium text-text">{profile.phone}</p>
                    </div>
                  )}
                  {studentProfile?.date_of_birth && (
                    <div>
                      <p className="text-sm text-text-secondary mb-1">Date of Birth</p>
                      <p className="font-medium text-text">{format(new Date(studentProfile.date_of_birth), 'MMM d, yyyy')}</p>
                    </div>
                  )}
                  {studentProfile?.gender && (
                    <div>
                      <p className="text-sm text-text-secondary mb-1">Gender</p>
                      <p className="font-medium text-text">{studentProfile.gender}</p>
                    </div>
                  )}
                  {studentProfile?.grade_level && (
                    <div>
                      <p className="text-sm text-text-secondary mb-1">Grade Level</p>
                      <p className="font-medium text-text">{studentProfile.grade_level}</p>
                    </div>
                  )}
                  {teacherProfile?.department && (
                    <div>
                      <p className="text-sm text-text-secondary mb-1">Department</p>
                      <p className="font-medium text-text">{teacherProfile.department}</p>
                    </div>
                  )}
                  {teacherProfile?.position && (
                    <div>
                      <p className="text-sm text-text-secondary mb-1">Position</p>
                      <p className="font-medium text-text">{teacherProfile.position}</p>
                    </div>
                  )}
                  {profile?.address && (
                    <div className="col-span-2">
                      <p className="text-sm text-text-secondary mb-1">Address</p>
                      <p className="font-medium text-text">{profile.address}</p>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Student Tabs */}
        {profileRole === 'student' && (
          <>
            <TabsContent value="grades">
              <Card className="bg-white rounded-2xl shadow-md">
                <CardHeader>
                  <CardTitle>Academic Performance</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {grades.length === 0 ? (
                      <p className="text-center text-text-secondary py-8">No grades available yet</p>
                    ) : (
                      grades.map((submission) => (
                        <div key={submission.id} className="flex items-center justify-between p-4 border rounded-lg">
                          <div>
                            <p className="font-medium text-text">{submission.assignment_id}</p>
                            <p className="text-sm text-text-secondary">{format(new Date(submission.submitted_date), 'MMM d, yyyy')}</p>
                          </div>
                          <div className="text-right">
                            <p className="text-2xl font-bold text-accent">{submission.grade}</p>
                            <p className="text-xs text-text-secondary">points</p>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="attendance">
              <Card className="bg-white rounded-2xl shadow-md">
                <CardHeader>
                  <CardTitle>Attendance Records</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-4 gap-4 mb-6">
                    <div className="text-center p-4 bg-green-50 rounded-lg">
                      <p className="text-3xl font-bold text-green-600">{attendance.filter(a => a.status === 'Present').length}</p>
                      <p className="text-sm text-text-secondary">Present</p>
                    </div>
                    <div className="text-center p-4 bg-red-50 rounded-lg">
                      <p className="text-3xl font-bold text-red-600">{attendance.filter(a => a.status === 'Absent').length}</p>
                      <p className="text-sm text-text-secondary">Absent</p>
                    </div>
                    <div className="text-center p-4 bg-yellow-50 rounded-lg">
                      <p className="text-3xl font-bold text-yellow-600">{attendance.filter(a => a.status === 'Late').length}</p>
                      <p className="text-sm text-text-secondary">Late</p>
                    </div>
                    <div className="text-center p-4 bg-blue-50 rounded-lg">
                      <p className="text-3xl font-bold text-blue-600">
                        {attendance.length > 0 ? ((attendance.filter(a => a.status === 'Present').length / attendance.length) * 100).toFixed(1) : 0}%
                      </p>
                      <p className="text-sm text-text-secondary">Rate</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="family">
              <Card className="bg-white rounded-2xl shadow-md">
                <CardHeader>
                  <CardTitle>Family Information</CardTitle>
                </CardHeader>
                <CardContent>
                  {studentProfile?.medical_conditions && (
                    <div className="mb-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                      <p className="text-sm font-semibold text-yellow-900 mb-1">Medical Conditions:</p>
                      <p className="text-sm text-yellow-800">{studentProfile.medical_conditions}</p>
                    </div>
                  )}
                  <div className="space-y-3">
                    <p className="text-text-secondary">Parent/Guardian information will be displayed here</p>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </>
        )}

        {/* Teacher Tabs */}
        {profileRole === 'teacher' && (
          <>
            <TabsContent value="classes">
              <Card className="bg-white rounded-2xl shadow-md">
                <CardHeader>
                  <CardTitle>Teaching Schedule</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {teacherClasses.length === 0 ? (
                      <p className="text-center text-text-secondary py-8">No classes assigned yet</p>
                    ) : (
                      teacherClasses.map((cls) => (
                        <div key={cls.id} className="p-4 border rounded-lg hover:bg-gray-50 transition-colors">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="font-medium text-text">{cls.class_name}</p>
                              <p className="text-sm text-text-secondary">{cls.schedule}</p>
                            </div>
                            <Badge variant="outline">{cls.room}</Badge>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="professional">
              <Card className="bg-white rounded-2xl shadow-md">
                <CardHeader>
                  <CardTitle>Professional Information</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <p className="text-sm text-text-secondary mb-1">Staff ID</p>
                      <p className="font-medium text-text">{teacherProfile?.staff_id}</p>
                    </div>
                    <div>
                      <p className="text-sm text-text-secondary mb-1">Department</p>
                      <p className="font-medium text-text">{teacherProfile?.department}</p>
                    </div>
                    <div>
                      <p className="text-sm text-text-secondary mb-1">Position</p>
                      <p className="font-medium text-text">{teacherProfile?.position}</p>
                    </div>
                    {teacherProfile?.hire_date && (
                      <div>
                        <p className="text-sm text-text-secondary mb-1">Hire Date</p>
                        <p className="font-medium text-text">{format(new Date(teacherProfile.hire_date), 'MMM d, yyyy')}</p>
                      </div>
                    )}
                    {teacherProfile?.qualifications && (
                      <div>
                        <p className="text-sm text-text-secondary mb-1">Qualifications</p>
                        <p className="font-medium text-text">{teacherProfile.qualifications}</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </>
        )}

        {/* Parent Tabs */}
        {profileRole === 'parent' && (
          <TabsContent value="children">
            <Card className="bg-white rounded-2xl shadow-md">
              <CardHeader>
                <CardTitle>Linked Children</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {linkedChildren.length === 0 ? (
                    <p className="text-center text-text-secondary py-8 col-span-2">No children linked yet</p>
                  ) : (
                    linkedChildren.map((child) => (
                      <div 
                        key={child.id} 
                        className="p-4 border rounded-lg hover:bg-gray-50 transition-colors cursor-pointer"
                        onClick={() => navigate(`/userprofile?id=${child.user_id}&role=student`)}
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center">
                            <GraduationCap className="w-6 h-6 text-blue-600" />
                          </div>
                          <div>
                            <p className="font-medium text-text">{child.first_name} {child.last_name}</p>
                            <p className="text-sm text-text-secondary">Grade {child.grade_level}</p>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
}