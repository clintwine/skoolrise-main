import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  User, Mail, Phone, MapPin, GraduationCap, Calendar,
  Shield, Users, FileText, Lock
} from 'lucide-react';
import { format } from 'date-fns';
import ProfileEditDialog from '../components/profile/ProfileEditDialog';

export default function UserProfile() {
  const [currentUser, setCurrentUser] = useState(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);

  const urlParams = new URLSearchParams(window.location.search);
  const targetUserId = urlParams.get('id');
  const targetRole = urlParams.get('role');

  useEffect(() => {
    const fetchUser = async () => {
      const user = await base44.auth.me();
      setCurrentUser(user);
    };
    fetchUser();
  }, []);

  // Single query to get all profile data at once
  const { data: profileData, isLoading } = useQuery({
    queryKey: ['profile-data', targetUserId, currentUser?.id],
    queryFn: async () => {
      const userId = targetUserId || currentUser?.id;
      if (!userId) return null;

      // Get user record
      let userRecord = currentUser;
      if (targetUserId && targetUserId !== currentUser?.id) {
        const users = await base44.entities.User.list();
        userRecord = users.find(u => u.id === targetUserId);
      }

      // Determine role
      const role = targetRole || userRecord?.user_type || 'user';
      const baseRole = role === 'parent_teacher' ? 'teacher' : 
                       role === 'parent_admin' ? 'admin' : role;

      // Fetch profile based on role
      let profile = null;
      let linkedParent = null;

      if (baseRole === 'student' || baseRole === 'user') {
        const students = await base44.entities.Student.filter({ user_id: userId });
        profile = students[0];
        if (profile?.parent_id) {
          const parents = await base44.entities.Parent.filter({ id: profile.parent_id });
          linkedParent = parents[0];
        }
      } else if (baseRole === 'teacher' || baseRole === 'admin') {
        const teachers = await base44.entities.Teacher.filter({ user_id: userId });
        profile = teachers[0];
      } else if (baseRole === 'parent') {
        const parents = await base44.entities.Parent.filter({ user_id: userId });
        profile = parents[0];
      }

      return { userRecord, profile, role: baseRole, linkedParent };
    },
    enabled: !!currentUser,
    staleTime: 30000,
  });

  // Separate queries for student-specific data (only when needed)
  const isStudent = profileData?.role === 'student';
  
  const { data: attendance = [] } = useQuery({
    queryKey: ['attendance', profileData?.profile?.id],
    queryFn: () => base44.entities.Attendance.filter({ student_id: profileData.profile.id }),
    enabled: isStudent && !!profileData?.profile?.id,
  });

  const { data: grades = [] } = useQuery({
    queryKey: ['grades', profileData?.profile?.id],
    queryFn: async () => {
      const submissions = await base44.entities.Submission.filter({ student_id: profileData.profile.id });
      return submissions.filter(s => s.grade !== null);
    },
    enabled: isStudent && !!profileData?.profile?.id,
  });

  if (!currentUser || isLoading) {
    return (
      <div className="max-w-5xl mx-auto">
        <div className="animate-pulse">
          <div className="h-32 bg-gradient-to-r from-blue-400 to-purple-500 rounded-t-2xl" />
          <div className="bg-white rounded-b-2xl p-6 -mt-12">
            <div className="flex items-end gap-4">
              <div className="w-24 h-24 rounded-full bg-gray-200 border-4 border-white" />
              <div className="space-y-2 pb-2">
                <div className="h-6 w-48 bg-gray-200 rounded" />
                <div className="h-4 w-32 bg-gray-200 rounded" />
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const { userRecord, profile, role, linkedParent } = profileData || {};
  const isOwnProfile = !targetUserId || targetUserId === currentUser?.id;
  const canEdit = isOwnProfile || currentUser?.role === 'admin';

  const getInitials = () => {
    if (profile?.first_name && profile?.last_name) {
      return `${profile.first_name.charAt(0)}${profile.last_name.charAt(0)}`.toUpperCase();
    }
    return userRecord?.full_name?.split(' ').map(n => n.charAt(0)).join('').toUpperCase() || 'U';
  };

  const getRoleBadge = () => {
    const roleColors = {
      student: 'bg-green-500 text-white',
      teacher: 'bg-blue-500 text-white',
      parent: 'bg-purple-500 text-white',
      admin: 'bg-red-500 text-white',
      vendor: 'bg-orange-500 text-white',
    };
    return roleColors[role] || 'bg-gray-500 text-white';
  };

  const getTabs = () => {
    const baseTabs = ['Overview', 'Family & Medical', 'Security'];
    if (role === 'student') {
      return ['Overview', 'Family & Medical', 'Grades', 'Attendance', 'Security'];
    }
    return baseTabs;
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Header Card */}
      <Card className="overflow-hidden rounded-2xl shadow-lg">
        <div className="h-32 bg-gradient-to-r from-blue-500 to-purple-600" />
        <CardContent className="relative pt-0 pb-6 px-6">
          <div className="flex items-end justify-between -mt-12">
            <div className="flex items-end gap-4">
              <div className="w-24 h-24 rounded-full bg-gray-100 border-4 border-white shadow-lg flex items-center justify-center">
                {profile?.photo_url ? (
                  <img src={profile.photo_url} alt="" className="w-full h-full rounded-full object-cover" />
                ) : (
                  <span className="text-3xl font-bold text-gray-600">{getInitials()}</span>
                )}
              </div>
              <div className="pb-2">
                <h1 className="text-2xl font-bold text-gray-900">
                  {profile?.first_name} {profile?.last_name}
                </h1>
                <div className="flex items-center gap-2 mt-1">
                  <Badge className={getRoleBadge()}>{role?.toUpperCase()}</Badge>
                  <span className="text-sm text-gray-500 flex items-center gap-1">
                    <MapPin className="w-3 h-3" />
                    {profile?.address || 'No location set'}
                  </span>
                </div>
              </div>
            </div>
            {canEdit && (
              <Button 
                onClick={() => setEditDialogOpen(true)}
                className="bg-gray-900 hover:bg-gray-800 text-white"
              >
                Edit Profile
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Main Content */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Left Sidebar - Contact Info */}
        <Card className="bg-white rounded-2xl shadow-md h-fit">
          <CardContent className="p-6">
            <div className="flex items-center gap-2 mb-4">
              <User className="w-5 h-5 text-gray-500" />
              <h3 className="font-semibold text-gray-900">Contact Information</h3>
            </div>
            
            <div className="space-y-4">
              <div>
                <p className="text-xs font-medium text-gray-500 uppercase mb-1">EMAIL</p>
                <div className="flex items-center gap-2 text-gray-700">
                  <Mail className="w-4 h-4 text-gray-400" />
                  <span className="text-sm">{userRecord?.email || 'Not provided'}</span>
                </div>
              </div>
              
              <div>
                <p className="text-xs font-medium text-gray-500 uppercase mb-1">PHONE</p>
                <div className="flex items-center gap-2 text-gray-700">
                  <Phone className="w-4 h-4 text-gray-400" />
                  <span className="text-sm">{profile?.phone || 'Not provided'}</span>
                </div>
              </div>
              
              <div>
                <p className="text-xs font-medium text-gray-500 uppercase mb-1">ADDRESS</p>
                <div className="flex items-center gap-2 text-gray-700">
                  <MapPin className="w-4 h-4 text-gray-400" />
                  <span className="text-sm">{profile?.address || 'Not provided'}</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Right Content - Tabs */}
        <div className="md:col-span-2">
          <Tabs defaultValue="overview" className="w-full">
            <TabsList className="bg-white rounded-xl p-1 shadow-sm border mb-4">
              {getTabs().map(tab => (
                <TabsTrigger 
                  key={tab} 
                  value={tab.toLowerCase().replace(/ & /g, '-').replace(/ /g, '-')}
                  className="data-[state=active]:bg-gray-100 data-[state=active]:text-gray-900"
                >
                  {tab}
                </TabsTrigger>
              ))}
            </TabsList>

            {/* Overview Tab */}
            <TabsContent value="overview" className="space-y-4">
              <Card className="bg-white rounded-2xl shadow-md">
                <CardContent className="p-6">
                  <div className="flex items-center gap-2 mb-4">
                    <GraduationCap className="w-5 h-5 text-green-600" />
                    <h3 className="font-semibold text-gray-900">
                      {role === 'student' ? 'Academic Profile' : 
                       role === 'teacher' ? 'Professional Profile' : 
                       role === 'parent' ? 'Parent Profile' : 'Profile'}
                    </h3>
                  </div>
                  
                  {role === 'student' && (
                    <div className="grid grid-cols-2 gap-6">
                      <div>
                        <p className="text-xs text-gray-500 mb-1">Grade Level</p>
                        <p className="font-medium text-gray-900">{profile?.grade_level || 'N/A'}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 mb-1">Admission No</p>
                        <p className="font-medium text-gray-900">{profile?.student_id_number || 'N/A'}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 mb-1">DOB</p>
                        <p className="font-medium text-gray-900">
                          {profile?.date_of_birth ? format(new Date(profile.date_of_birth), 'MMM d, yyyy') : 'N/A'}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 mb-1">Gender</p>
                        <p className="font-medium text-gray-900">{profile?.gender || 'N/A'}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 mb-1">Admission Date</p>
                        <p className="font-medium text-gray-900">
                          {profile?.admission_date ? format(new Date(profile.admission_date), 'MMM d, yyyy') : 'N/A'}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 mb-1">Status</p>
                        <Badge className={profile?.status === 'Active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'}>
                          {profile?.status || 'N/A'}
                        </Badge>
                      </div>
                    </div>
                  )}

                  {role === 'teacher' && (
                    <div className="grid grid-cols-2 gap-6">
                      <div>
                        <p className="text-xs text-gray-500 mb-1">Staff ID</p>
                        <p className="font-medium text-gray-900">{profile?.staff_id || 'N/A'}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 mb-1">Department</p>
                        <p className="font-medium text-gray-900">{profile?.department || 'N/A'}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 mb-1">Position</p>
                        <p className="font-medium text-gray-900">{profile?.position || 'N/A'}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 mb-1">Hire Date</p>
                        <p className="font-medium text-gray-900">
                          {profile?.hire_date ? format(new Date(profile.hire_date), 'MMM d, yyyy') : 'N/A'}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 mb-1">Status</p>
                        <Badge className={profile?.status === 'Active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'}>
                          {profile?.status || 'N/A'}
                        </Badge>
                      </div>
                    </div>
                  )}

                  {role === 'parent' && (
                    <div className="grid grid-cols-2 gap-6">
                      <div>
                        <p className="text-xs text-gray-500 mb-1">Full Name</p>
                        <p className="font-medium text-gray-900">{profile?.first_name} {profile?.last_name}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 mb-1">Phone</p>
                        <p className="font-medium text-gray-900">{profile?.phone || 'N/A'}</p>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* About Section */}
              <Card className="bg-white rounded-2xl shadow-md">
                <CardContent className="p-6">
                  <h3 className="font-semibold text-gray-900 mb-3">About</h3>
                  <p className="text-gray-600 text-sm">
                    {profile?.notes || (role === 'teacher' ? profile?.qualifications : null) || 'No notes available.'}
                  </p>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Family & Medical Tab */}
            <TabsContent value="family-medical" className="space-y-4">
              {role === 'student' && (
                <>
                  <Card className="bg-white rounded-2xl shadow-md">
                    <CardContent className="p-6">
                      <div className="flex items-center gap-2 mb-4">
                        <Users className="w-5 h-5 text-blue-600" />
                        <h3 className="font-semibold text-gray-900">Parent/Guardian</h3>
                      </div>
                      <div className="grid grid-cols-2 gap-6">
                        <div>
                          <p className="text-xs text-gray-500 mb-1">Name</p>
                          <p className="font-medium text-gray-900">
                            {linkedParent ? `${linkedParent.first_name} ${linkedParent.last_name}` : 'N/A'}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500 mb-1">Phone</p>
                          <p className="font-medium text-gray-900">{linkedParent?.phone || profile?.parent_phone || 'N/A'}</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500 mb-1">Email</p>
                          <p className="font-medium text-gray-900">{profile?.parent_email || 'N/A'}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="bg-white rounded-2xl shadow-md">
                    <CardContent className="p-6">
                      <div className="flex items-center gap-2 mb-4">
                        <FileText className="w-5 h-5 text-red-600" />
                        <h3 className="font-semibold text-gray-900">Medical & Additional</h3>
                      </div>
                      <div className="space-y-4">
                        <div>
                          <p className="text-xs text-gray-500 mb-1">Medical Conditions</p>
                          <p className="font-medium text-gray-900">{profile?.medical_conditions || 'None'}</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500 mb-1">SEND Status</p>
                          <p className="font-medium text-gray-900">{profile?.send_status || 'None'}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </>
              )}

              {role === 'teacher' && (
                <Card className="bg-white rounded-2xl shadow-md">
                  <CardContent className="p-6">
                    <div className="flex items-center gap-2 mb-4">
                      <FileText className="w-5 h-5 text-blue-600" />
                      <h3 className="font-semibold text-gray-900">Emergency Contact</h3>
                    </div>
                    <p className="text-gray-600">{profile?.emergency_contact || 'No emergency contact provided'}</p>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            {/* Grades Tab (Student only) */}
            {role === 'student' && (
              <TabsContent value="grades" className="space-y-4">
                <Card className="bg-white rounded-2xl shadow-md">
                  <CardContent className="p-6">
                    <h3 className="font-semibold text-gray-900 mb-4">Recent Grades</h3>
                    {grades.length === 0 ? (
                      <p className="text-gray-500 text-center py-8">No grades available yet</p>
                    ) : (
                      <div className="space-y-3">
                        {grades.slice(0, 10).map((submission) => (
                          <div key={submission.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                            <div>
                              <p className="font-medium text-gray-900">{submission.assignment_id}</p>
                              <p className="text-sm text-gray-500">
                                {submission.submitted_date && format(new Date(submission.submitted_date), 'MMM d, yyyy')}
                              </p>
                            </div>
                            <Badge className="bg-blue-100 text-blue-800 text-lg px-3">{submission.grade}</Badge>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
            )}

            {/* Attendance Tab (Student only) */}
            {role === 'student' && (
              <TabsContent value="attendance" className="space-y-4">
                <Card className="bg-white rounded-2xl shadow-md">
                  <CardContent className="p-6">
                    <h3 className="font-semibold text-gray-900 mb-4">Attendance Summary</h3>
                    <div className="grid grid-cols-4 gap-4">
                      <div className="text-center p-4 bg-green-50 rounded-xl">
                        <p className="text-2xl font-bold text-green-600">{attendance.filter(a => a.status === 'Present').length}</p>
                        <p className="text-sm text-gray-600">Present</p>
                      </div>
                      <div className="text-center p-4 bg-red-50 rounded-xl">
                        <p className="text-2xl font-bold text-red-600">{attendance.filter(a => a.status === 'Absent').length}</p>
                        <p className="text-sm text-gray-600">Absent</p>
                      </div>
                      <div className="text-center p-4 bg-yellow-50 rounded-xl">
                        <p className="text-2xl font-bold text-yellow-600">{attendance.filter(a => a.status === 'Late').length}</p>
                        <p className="text-sm text-gray-600">Late</p>
                      </div>
                      <div className="text-center p-4 bg-blue-50 rounded-xl">
                        <p className="text-2xl font-bold text-blue-600">
                          {attendance.length > 0 ? ((attendance.filter(a => a.status === 'Present').length / attendance.length) * 100).toFixed(0) : 0}%
                        </p>
                        <p className="text-sm text-gray-600">Rate</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            )}

            {/* Security Tab */}
            <TabsContent value="security" className="space-y-4">
              <Card className="bg-white rounded-2xl shadow-md">
                <CardContent className="p-6">
                  <h3 className="font-semibold text-gray-900 mb-4">Account Security</h3>
                  <Button variant="outline" className="flex items-center gap-2">
                    <Lock className="w-4 h-4" />
                    Change Password
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>

      {/* Edit Dialog */}
      <ProfileEditDialog 
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
        profile={profile}
        role={role}
      />
    </div>
  );
}