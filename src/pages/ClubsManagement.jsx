import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useSchoolContext } from '@/hooks/useSchoolContext';
import { addSchoolFilter, withSchoolId } from '@/utils/schoolFilter';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Users, Plus, Edit, Trash2, Clock, MapPin, DollarSign } from 'lucide-react';
import { useCurrency } from '@/components/CurrencyProvider';
import { toast } from 'sonner';

export default function ClubsManagement() {
  const [user, setUser] = useState(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingClub, setEditingClub] = useState(null);
  const [selectedClub, setSelectedClub] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    category: 'Other',
    meeting_schedule: '',
    location: '',
    teacher_id: '',
    teacher_name: '',
    max_members: 30,
    fee: 0,
    grade_levels: '',
    image_url: '',
    status: 'Active',
  });
  const queryClient = useQueryClient();
  const { formatAmount } = useCurrency();

  useEffect(() => {
    const fetchUser = async () => {
      const currentUser = await base44.auth.me();
      setUser(currentUser);
    };
    fetchUser();
  }, []);

  const { school_tenant_id, isReady } = useSchoolContext();

  const { data: clubs = [] } = useQuery({
    queryKey: ['clubs', school_tenant_id],
    queryFn: () => base44.entities.Club.filter(addSchoolFilter({}, school_tenant_id), '-created_date'),
    enabled: isReady,
  });

  const { data: teachers = [] } = useQuery({
    queryKey: ['teachers', school_tenant_id],
    queryFn: () => base44.entities.Teacher.filter(addSchoolFilter({}, school_tenant_id)),
    enabled: isReady,
  });

  const { data: memberships = [] } = useQuery({
    queryKey: ['club-memberships-all', school_tenant_id],
    queryFn: () => base44.entities.ClubMembership.filter(addSchoolFilter({}, school_tenant_id), '-created_date'),
    enabled: isReady,
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.Club.create(withSchoolId(data, school_tenant_id)),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clubs'] });
      setIsFormOpen(false);
      resetForm();
      toast.success('Club created successfully');
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Club.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clubs'] });
      setIsFormOpen(false);
      resetForm();
      toast.success('Club updated successfully');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.Club.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clubs'] });
      toast.success('Club deleted');
    },
  });

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      category: 'Other',
      meeting_schedule: '',
      location: '',
      teacher_id: '',
      teacher_name: '',
      max_members: 30,
      fee: 0,
      grade_levels: '',
      image_url: '',
      status: 'Active',
    });
    setEditingClub(null);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const teacher = teachers.find(t => t.id === formData.teacher_id);
    const submitData = {
      ...formData,
      teacher_name: teacher ? `${teacher.first_name} ${teacher.last_name}` : '',
    };
    
    if (editingClub) {
      updateMutation.mutate({ id: editingClub.id, data: submitData });
    } else {
      createMutation.mutate(submitData);
    }
  };

  const handleEdit = (club) => {
    setEditingClub(club);
    setFormData(club);
    setIsFormOpen(true);
  };

  const statusColors = {
    Active: 'bg-green-100 text-green-700',
    Inactive: 'bg-gray-100 text-gray-700',
    Full: 'bg-yellow-100 text-yellow-700',
  };

  const categoryColors = {
    Sports: 'bg-green-100 text-green-700',
    Arts: 'bg-pink-100 text-pink-700',
    Academic: 'bg-blue-100 text-blue-700',
    Music: 'bg-purple-100 text-purple-700',
    Drama: 'bg-orange-100 text-orange-700',
    Technology: 'bg-cyan-100 text-cyan-700',
    'Community Service': 'bg-teal-100 text-teal-700',
    Other: 'bg-gray-100 text-gray-700',
  };

  const getClubMemberships = (clubId) => memberships.filter(m => m.club_id === clubId);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Clubs Management</h1>
          <p className="text-gray-600 mt-1">Manage school clubs and memberships</p>
        </div>
        <Button onClick={() => { resetForm(); setIsFormOpen(true); }} className="bg-blue-600 hover:bg-blue-700">
          <Plus className="w-4 h-4 mr-2" />
          Create Club
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-white shadow-md">
          <CardContent className="p-6">
            <p className="text-sm text-gray-600">Total Clubs</p>
            <p className="text-2xl font-bold text-gray-900">{clubs.length}</p>
          </CardContent>
        </Card>
        <Card className="bg-white shadow-md">
          <CardContent className="p-6">
            <p className="text-sm text-gray-600">Active Clubs</p>
            <p className="text-2xl font-bold text-green-600">{clubs.filter(c => c.status === 'Active').length}</p>
          </CardContent>
        </Card>
        <Card className="bg-white shadow-md">
          <CardContent className="p-6">
            <p className="text-sm text-gray-600">Total Members</p>
            <p className="text-2xl font-bold text-blue-600">{memberships.filter(m => m.status === 'Active').length}</p>
          </CardContent>
        </Card>
        <Card className="bg-white shadow-md">
          <CardContent className="p-6">
            <p className="text-sm text-gray-600">Categories</p>
            <p className="text-2xl font-bold text-purple-600">{new Set(clubs.map(c => c.category)).size}</p>
          </CardContent>
        </Card>
      </div>

      {/* Clubs Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {clubs.map(club => {
          const clubMemberships = getClubMemberships(club.id);
          return (
            <Card key={club.id} className="bg-white shadow-md hover:shadow-lg transition-shadow">
              {club.image_url && (
                <img src={club.image_url} alt={club.name} className="w-full h-32 object-cover rounded-t-lg" />
              )}
              <CardContent className="p-4">
                <div className="flex justify-between items-start mb-2">
                  <h3 className="font-semibold text-gray-900">{club.name}</h3>
                  <Badge className={statusColors[club.status]}>{club.status}</Badge>
                </div>
                <Badge className={`${categoryColors[club.category]} mb-2`}>{club.category}</Badge>
                <p className="text-sm text-gray-600 mb-3 line-clamp-2">{club.description}</p>
                <div className="space-y-1 text-sm text-gray-600 mb-4">
                  <p className="flex items-center gap-2">
                    <Clock className="w-4 h-4" />
                    {club.meeting_schedule || 'Schedule TBA'}
                  </p>
                  <p className="flex items-center gap-2">
                    <MapPin className="w-4 h-4" />
                    {club.location || 'Location TBA'}
                  </p>
                  <p className="flex items-center gap-2">
                    <Users className="w-4 h-4" />
                    {clubMemberships.length} / {club.max_members} members
                  </p>
                  {club.fee > 0 && (
                    <p className="flex items-center gap-2">
                      <DollarSign className="w-4 h-4" />
                      {formatAmount(club.fee)} / term
                    </p>
                  )}
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={() => setSelectedClub(club)} className="flex-1">
                    <Users className="w-4 h-4 mr-1" />
                    View Members
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => handleEdit(club)}>
                    <Edit className="w-4 h-4" />
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => deleteMutation.mutate(club.id)}>
                    <Trash2 className="w-4 h-4 text-red-600" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Club Form Dialog */}
      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent className="max-w-lg bg-white max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingClub ? 'Edit Club' : 'Create Club'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label>Club Name *</Label>
              <Input value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} required />
            </div>
            <div>
              <Label>Description</Label>
              <Textarea value={formData.description} onChange={(e) => setFormData({...formData, description: e.target.value})} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Category *</Label>
                <Select value={formData.category} onValueChange={(v) => setFormData({...formData, category: v})}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Sports">Sports</SelectItem>
                    <SelectItem value="Arts">Arts</SelectItem>
                    <SelectItem value="Academic">Academic</SelectItem>
                    <SelectItem value="Music">Music</SelectItem>
                    <SelectItem value="Drama">Drama</SelectItem>
                    <SelectItem value="Technology">Technology</SelectItem>
                    <SelectItem value="Community Service">Community Service</SelectItem>
                    <SelectItem value="Other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Status</Label>
                <Select value={formData.status} onValueChange={(v) => setFormData({...formData, status: v})}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Active">Active</SelectItem>
                    <SelectItem value="Inactive">Inactive</SelectItem>
                    <SelectItem value="Full">Full</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <Label>Meeting Schedule</Label>
              <Input value={formData.meeting_schedule} onChange={(e) => setFormData({...formData, meeting_schedule: e.target.value})} placeholder="e.g., Every Tuesday 3pm" />
            </div>
            <div>
              <Label>Location</Label>
              <Input value={formData.location} onChange={(e) => setFormData({...formData, location: e.target.value})} placeholder="e.g., Room 101" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Club Advisor</Label>
                <Select value={formData.teacher_id} onValueChange={(v) => setFormData({...formData, teacher_id: v})}>
                  <SelectTrigger><SelectValue placeholder="Select teacher" /></SelectTrigger>
                  <SelectContent>
                    {teachers.map(t => (
                      <SelectItem key={t.id} value={t.id}>{t.first_name} {t.last_name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Max Members</Label>
                <Input type="number" value={formData.max_members} onChange={(e) => setFormData({...formData, max_members: parseInt(e.target.value)})} />
              </div>
            </div>
            <div>
              <Label>Membership Fee (per term)</Label>
              <Input type="number" step="0.01" value={formData.fee} onChange={(e) => setFormData({...formData, fee: parseFloat(e.target.value)})} />
            </div>
            <div>
              <Label>Grade Levels (comma-separated)</Label>
              <Input value={formData.grade_levels} onChange={(e) => setFormData({...formData, grade_levels: e.target.value})} placeholder="e.g., JSS1, JSS2, SS1" />
            </div>
            <div>
              <Label>Image URL</Label>
              <Input value={formData.image_url} onChange={(e) => setFormData({...formData, image_url: e.target.value})} placeholder="https://..." />
            </div>
            <div className="flex justify-end gap-3 pt-4 border-t">
              <Button type="button" variant="outline" onClick={() => setIsFormOpen(false)}>Cancel</Button>
              <Button type="submit" className="bg-blue-600 hover:bg-blue-700">
                {editingClub ? 'Update' : 'Create'} Club
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Members Dialog */}
      <Dialog open={!!selectedClub} onOpenChange={() => setSelectedClub(null)}>
        <DialogContent className="max-w-2xl bg-white max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Members of {selectedClub?.name}</DialogTitle>
          </DialogHeader>
          {selectedClub && (
            <div className="space-y-4">
              {getClubMemberships(selectedClub.id).length === 0 ? (
                <p className="text-center text-gray-500 py-8">No members yet</p>
              ) : (
                <div className="space-y-3">
                  {getClubMemberships(selectedClub.id).map(membership => (
                    <div key={membership.id} className="p-4 border rounded-lg flex justify-between items-center">
                      <div>
                        <p className="font-medium text-gray-900">{membership.student_name}</p>
                        <p className="text-sm text-gray-600">Joined: {membership.join_date}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline">{membership.role}</Badge>
                        <Badge className={membership.status === 'Active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'}>
                          {membership.status}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}