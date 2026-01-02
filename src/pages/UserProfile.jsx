import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { 
  User, Mail, Phone, MapPin, GraduationCap, Calendar,
  Shield, Users, FileText, Lock, Camera, Link2, Search
} from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';

export default function UserProfile() {
  const queryClient = useQueryClient();
  const [currentUser, setCurrentUser] = useState(null);
  const [editMode, setEditMode] = useState(false);
  const [linkParentOpen, setLinkParentOpen] = useState(false);
  const [parentSearch, setParentSearch] = useState('');
  const [selectedParentId, setSelectedParentId] = useState('');

  const urlParams = new URLSearchParams(window.location.search);
  const targetUserId = urlParams.get('id');
  const targetRole = urlParams.get('role');
  const isEditMode = urlParams.get('edit') === 'true';

  useEffect(() => {
    const fetchUser = async () => {
      const user = await base44.auth.me();
      setCurrentUser(user);
    };
    fetchUser();
  }, []);

  useEffect(() => {
    if (isEditMode) {
      setEditMode(true);
    }
  }, [isEditMode]);

  // Single query for all data
  const { data: profileData, isLoading } = useQuery({
    queryKey: ['profile-data', targetUserId, currentUser?.id],
    queryFn: async () => {
      const userId = targetUserId || currentUser?.id;
      if (!userId) return null;

      let userRecord = currentUser;
      if (targetUserId && targetUserId !== currentUser?.id) {
        const users = await base44.entities.User.list();
        userRecord = users.find(u => u.id === targetUserId);
      }

      const role = targetRole || userRecord?.user_type || 'user';
      const baseRole = role === 'parent_teacher' ? 'teacher' : 
                       role === 'parent_admin' ? 'admin' : role;

      let profile = null;
      let linkedParent = null;
      let attendance = [];
      let grades = [];

      if (baseRole === 'student' || baseRole === 'user') {
        const students = await base44.entities.Student.filter({ user_id: userId });
        profile = students[0];
        if (profile?.parent_id) {
          const parents = await base44.entities.Parent.filter({ id: profile.parent_id });
          linkedParent = parents[0];
        }
        if (profile) {
          attendance = await base44.entities.Attendance.filter({ student_id: profile.id });
          const submissions = await base44.entities.Submission.filter({ student_id: profile.id });
          grades = submissions.filter(s => s.grade !== null);
        }
      } else if (baseRole === 'teacher' || baseRole === 'admin') {
        const teachers = await base44.entities.Teacher.filter({ user_id: userId });
        profile = teachers[0];
      } else if (baseRole === 'parent') {
        const parents = await base44.entities.Parent.filter({ user_id: userId });
        profile = parents[0];
      }

      return { userRecord, profile, role: baseRole, linkedParent, attendance, grades };
    },
    enabled: !!currentUser,
    staleTime: 30000,
  });

  const { data: allParents = [] } = useQuery({
    queryKey: ['all-parents'],
    queryFn: () => base44.entities.Parent.list(),
    enabled: editMode && profileData?.role === 'student' && currentUser?.role === 'admin',
  });

  const [formData, setFormData] = useState({});

  useEffect(() => {
    if (profileData?.profile) {
      setFormData({ ...profileData.profile });
    }
  }, [profileData]);

  const updateMutation = useMutation({
    mutationFn: async (data) => {
      const cleanData = { ...data };
      delete cleanData.id;
      delete cleanData.created_date;
      delete cleanData.updated_date;
      delete cleanData.created_by;
      delete cleanData.user_id;

      if (profileData.role === 'student') {
        await base44.entities.Student.update(profileData.profile.id, cleanData);
      } else if (profileData.role === 'teacher' || profileData.role === 'admin') {
        await base44.entities.Teacher.update(profileData.profile.id, cleanData);
      } else if (profileData.role === 'parent') {
        await base44.entities.Parent.update(profileData.profile.id, cleanData);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profile-data'] });
      setEditMode(false);
      toast.success('Profile updated successfully');
      window.history.replaceState({}, '', window.location.pathname + window.location.search.replace('&edit=true', '').replace('?edit=true', ''));
    },
    onError: (error) => {
      toast.error('Failed to update: ' + error.message);
    },
  });

  const linkParentMutation = useMutation({
    mutationFn: async (parentId) => {
      await base44.entities.Student.update(profileData.profile.id, { parent_id: parentId });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profile-data'] });
      setLinkParentOpen(false);
      setSelectedParentId('');
      toast.success('Parent linked successfully');
    },
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

  const { userRecord, profile, role, linkedParent, attendance = [], grades = [] } = profileData || {};
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

  const handleSave = () => {
    updateMutation.mutate(formData);
  };

  const handleCancel = () => {
    setFormData({ ...profileData.profile });
    setEditMode(false);
    window.history.replaceState({}, '', window.location.pathname + window.location.search.replace('&edit=true', '').replace('?edit=true', ''));
  };

  const filteredParents = allParents.filter(p => 
    parentSearch ? 
      `${p.first_name} ${p.last_name}`.toLowerCase().includes(parentSearch.toLowerCase()) ||
      p.phone?.includes(parentSearch) : true
  );

  const getTabs = () => {
    if (role === 'student') {
      return ['Overview', 'Family & Medical', 'Grades', 'Attendance', 'Security'];
    }
    return ['Overview', 'Family & Medical', 'Security'];
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Header Card */}
      <Card className="overflow-hidden rounded-2xl shadow-lg">
        <div className="h-32 bg-gradient-to-r from-blue-500 to-purple-600" />
        <CardContent className="relative pt-0 pb-6 px-6">
          <div className="flex items-end justify-between -mt-12">
            <div className="flex items-end gap-4">
              <div className="relative w-24 h-24 rounded-full bg-gray-100 border-4 border-white shadow-lg flex items-center justify-center group">
                {profile?.photo_url ? (
                  <img src={profile.photo_url} alt="" className="w-full h-full rounded-full object-cover" />
                ) : (
                  <span className="text-3xl font-bold text-gray-600">{getInitials()}</span>
                )}
                {editMode && (
                  <div className="absolute inset-0 rounded-full bg-black bg-opacity-50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center cursor-pointer">
                    <Camera className="w-6 h-6 text-white" />
                  </div>
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
            {canEdit && !editMode && (
              <Button 
                onClick={() => setEditMode(true)}
                className="bg-gray-900 hover:bg-gray-800 text-white"
              >
                Edit Profile
              </Button>
            )}
            {editMode && (
              <div className="flex gap-2">
                <Button 
                  onClick={handleCancel}
                  variant="outline"
                >
                  Cancel
                </Button>
                <Button 
                  onClick={handleSave}
                  className="bg-gray-900 hover:bg-gray-800 text-white"
                  disabled={updateMutation.isPending}
                >
                  {updateMutation.isPending ? 'Saving...' : 'Save Changes'}
                </Button>
              </div>
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
                {editMode ? (
                  <Input value={userRecord?.email || ''} disabled className="text-sm bg-gray-50" />
                ) : (
                  <div className="flex items-center gap-2 text-gray-700">
                    <Mail className="w-4 h-4 text-gray-400" />
                    <span className="text-sm">{userRecord?.email || 'Not provided'}</span>
                  </div>
                )}
              </div>
              
              <div>
                <p className="text-xs font-medium text-gray-500 uppercase mb-1">PHONE</p>
                {editMode ? (
                  <Input 
                    value={formData.phone || ''} 
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="text-sm"
                  />
                ) : (
                  <div className="flex items-center gap-2 text-gray-700">
                    <Phone className="w-4 h-4 text-gray-400" />
                    <span className="text-sm">{profile?.phone || 'Not provided'}</span>
                  </div>
                )}
              </div>
              
              <div>
                <p className="text-xs font-medium text-gray-500 uppercase mb-1">ADDRESS</p>
                {editMode ? (
                  <Textarea 
                    value={formData.address || ''} 
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    rows={2}
                    className="text-sm"
                  />
                ) : (
                  <div className="flex items-center gap-2 text-gray-700">
                    <MapPin className="w-4 h-4 text-gray-400" />
                    <span className="text-sm">{profile?.address || 'Not provided'}</span>
                  </div>
                )}
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
              {!editMode ? (
                <>
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

                  <Card className="bg-white rounded-2xl shadow-md">
                    <CardContent className="p-6">
                      <h3 className="font-semibold text-gray-900 mb-3">About</h3>
                      <p className="text-gray-600 text-sm">
                        {profile?.notes || (role === 'teacher' ? profile?.qualifications : null) || 'No notes available.'}
                      </p>
                    </CardContent>
                  </Card>
                </>
              ) : (
                <Card className="bg-white rounded-2xl shadow-md">
                  <CardContent className="p-6">
                    <h3 className="font-semibold text-gray-900 mb-4">Edit Details</h3>
                    
                    <div className="space-y-6">
                      <div>
                        <h4 className="font-semibold text-gray-900 mb-3">Personal Information</h4>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <Label>First Name</Label>
                            <Input
                              value={formData.first_name || ''}
                              onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                            />
                          </div>
                          <div>
                            <Label>Last Name</Label>
                            <Input
                              value={formData.last_name || ''}
                              onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                            />
                          </div>
                          {role === 'student' && (
                            <>
                              <div>
                                <Label>Student ID</Label>
                                <Input
                                  value={formData.student_id_number || ''}
                                  onChange={(e) => setFormData({ ...formData, student_id_number: e.target.value })}
                                />
                              </div>
                              <div>
                                <Label>Date of Birth</Label>
                                <Input
                                  type="date"
                                  value={formData.date_of_birth || ''}
                                  onChange={(e) => setFormData({ ...formData, date_of_birth: e.target.value })}
                                />
                              </div>
                              <div>
                                <Label>Gender</Label>
                                <Select value={formData.gender || ''} onValueChange={(v) => setFormData({ ...formData, gender: v })}>
                                  <SelectTrigger>
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="Male">Male</SelectItem>
                                    <SelectItem value="Female">Female</SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>
                              <div>
                                <Label>Grade Level</Label>
                                <Input
                                  value={formData.grade_level || ''}
                                  onChange={(e) => setFormData({ ...formData, grade_level: e.target.value })}
                                />
                              </div>
                              <div className="col-span-2">
                                <Label>Status</Label>
                                <Select value={formData.status || ''} onValueChange={(v) => setFormData({ ...formData, status: v })}>
                                  <SelectTrigger>
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="Active">Active</SelectItem>
                                    <SelectItem value="Inactive">Inactive</SelectItem>
                                    <SelectItem value="Suspended">Suspended</SelectItem>
                                    <SelectItem value="Graduated">Graduated</SelectItem>
                                    <SelectItem value="Withdrawn">Withdrawn</SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>
                            </>
                          )}
                        </div>
                      </div>

                      {role === 'student' && (
                        <div>
                          <h4 className="font-semibold text-gray-900 mb-3">Parent/Guardian Information</h4>
                          <div className="grid grid-cols-2 gap-4">
                            <div className="col-span-2">
                              <Label>Parent Name</Label>
                              <Input
                                value={formData.parent_name || ''}
                                onChange={(e) => setFormData({ ...formData, parent_name: e.target.value })}
                              />
                            </div>
                            <div>
                              <Label>Parent Email</Label>
                              <div className="relative">
                                <Input
                                  value={formData.parent_email || ''}
                                  onChange={(e) => setFormData({ ...formData, parent_email: e.target.value })}
                                  type="email"
                                />
                                <div className="absolute right-2 top-2">
                                  <Badge variant="destructive" className="text-xs">M</Badge>
                                </div>
                              </div>
                            </div>
                            <div>
                              <Label>Parent Phone</Label>
                              <Input
                                value={formData.parent_phone || ''}
                                onChange={(e) => setFormData({ ...formData, parent_phone: e.target.value })}
                              />
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            {/* Family & Medical Tab */}
            <TabsContent value="family-medical" className="space-y-4">
              {role === 'student' && (
                <>
                  <Card className="bg-white rounded-2xl shadow-md">
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-2">
                          <Users className="w-5 h-5 text-blue-600" />
                          <h3 className="font-semibold text-gray-900">Parent/Guardian</h3>
                        </div>
                        {!editMode && currentUser?.role === 'admin' && !linkedParent && (
                          <Button 
                            onClick={() => setLinkParentOpen(true)}
                            variant="outline"
                            size="sm"
                            className="text-blue-600 border-blue-300"
                          >
                            <Link2 className="w-4 h-4 mr-2" />
                            Link Parent
                          </Button>
                        )}
                      </div>
                      {editMode ? (
                        <div className="space-y-4">
                          <div className="grid grid-cols-2 gap-4">
                            <div className="col-span-2">
                              <Label>Parent Name</Label>
                              <Input
                                value={formData.parent_name || ''}
                                onChange={(e) => setFormData({ ...formData, parent_name: e.target.value })}
                              />
                            </div>
                            <div>
                              <Label>Parent Email</Label>
                              <Input
                                value={formData.parent_email || ''}
                                onChange={(e) => setFormData({ ...formData, parent_email: e.target.value })}
                                type="email"
                              />
                            </div>
                            <div>
                              <Label>Parent Phone</Label>
                              <Input
                                value={formData.parent_phone || ''}
                                onChange={(e) => setFormData({ ...formData, parent_phone: e.target.value })}
                              />
                            </div>
                          </div>
                        </div>
                      ) : (
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
                          <div className="col-span-2">
                            <p className="text-xs text-gray-500 mb-1">Email</p>
                            <p className="font-medium text-gray-900">{profile?.parent_email || 'N/A'}</p>
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  <Card className="bg-white rounded-2xl shadow-md">
                    <CardContent className="p-6">
                      <div className="flex items-center gap-2 mb-4">
                        <FileText className="w-5 h-5 text-red-600" />
                        <h3 className="font-semibold text-gray-900">Medical & Additional</h3>
                      </div>
                      {editMode ? (
                        <div className="space-y-4">
                          <div>
                            <Label>Medical Conditions</Label>
                            <Textarea
                              value={formData.medical_conditions || ''}
                              onChange={(e) => setFormData({ ...formData, medical_conditions: e.target.value })}
                              rows={2}
                            />
                          </div>
                          <div>
                            <Label>SEND Status</Label>
                            <Input
                              value={formData.send_status || ''}
                              onChange={(e) => setFormData({ ...formData, send_status: e.target.value })}
                            />
                          </div>
                        </div>
                      ) : (
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
                      )}
                    </CardContent>
                  </Card>
                </>
              )}

              {role === 'teacher' && !editMode && (
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

            {/* Grades Tab */}
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

            {/* Attendance Tab */}
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

      {/* Link Parent Dialog */}
      <Dialog open={linkParentOpen} onOpenChange={setLinkParentOpen}>
        <DialogContent className="max-w-lg bg-white">
          <DialogHeader>
            <DialogTitle>Link Parent/Guardian</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="relative">
              <Search className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
              <Input
                placeholder="Search parents by name or phone..."
                value={parentSearch}
                onChange={(e) => setParentSearch(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="max-h-64 overflow-y-auto space-y-2">
              {filteredParents.map((parent) => (
                <div
                  key={parent.id}
                  onClick={() => setSelectedParentId(parent.id)}
                  className={`p-3 border rounded-lg cursor-pointer transition-all ${
                    selectedParentId === parent.id ? 'border-blue-500 bg-blue-50' : 'hover:bg-gray-50'
                  }`}
                >
                  <p className="font-medium text-gray-900">{parent.first_name} {parent.last_name}</p>
                  <p className="text-sm text-gray-500">{parent.phone}</p>
                </div>
              ))}
            </div>
            <div className="flex justify-end gap-2 pt-4">
              <Button variant="outline" onClick={() => setLinkParentOpen(false)}>Cancel</Button>
              <Button 
                onClick={() => linkParentMutation.mutate(selectedParentId)}
                disabled={!selectedParentId || linkParentMutation.isPending}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                {linkParentMutation.isPending ? 'Linking...' : 'Link Parent'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}