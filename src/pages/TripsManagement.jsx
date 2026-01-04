import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Bus, Plus, Edit, Trash2, Users, MapPin, Calendar, DollarSign } from 'lucide-react';
import { format } from 'date-fns';
import { useCurrency } from '@/components/CurrencyProvider';
import { toast } from 'sonner';

export default function TripsManagement() {
  const [user, setUser] = useState(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingTrip, setEditingTrip] = useState(null);
  const [selectedTrip, setSelectedTrip] = useState(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    destination: '',
    departure_date: '',
    return_date: '',
    cost: 0,
    max_participants: 50,
    grade_levels: '',
    requires_payment: false,
    requires_consent: true,
    consent_deadline: '',
    teacher_id: '',
    teacher_name: '',
    status: 'Planned',
    image_url: '',
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

  const { data: trips = [] } = useQuery({
    queryKey: ['school-trips'],
    queryFn: () => base44.entities.SchoolTrip.list('-departure_date'),
  });

  const { data: teachers = [] } = useQuery({
    queryKey: ['teachers'],
    queryFn: () => base44.entities.Teacher.list(),
  });

  const { data: enrollments = [] } = useQuery({
    queryKey: ['trip-enrollments-all'],
    queryFn: () => base44.entities.TripEnrollment.list('-created_date'),
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.SchoolTrip.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['school-trips'] });
      setIsFormOpen(false);
      resetForm();
      toast.success('Trip created successfully');
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.SchoolTrip.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['school-trips'] });
      setIsFormOpen(false);
      resetForm();
      toast.success('Trip updated successfully');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.SchoolTrip.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['school-trips'] });
      toast.success('Trip deleted');
    },
  });

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      destination: '',
      departure_date: '',
      return_date: '',
      cost: 0,
      max_participants: 50,
      grade_levels: '',
      requires_payment: false,
      requires_consent: true,
      consent_deadline: '',
      teacher_id: '',
      teacher_name: '',
      status: 'Planned',
      image_url: '',
    });
    setEditingTrip(null);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const teacher = teachers.find(t => t.id === formData.teacher_id);
    const submitData = {
      ...formData,
      teacher_name: teacher ? `${teacher.first_name} ${teacher.last_name}` : '',
    };
    
    if (editingTrip) {
      updateMutation.mutate({ id: editingTrip.id, data: submitData });
    } else {
      createMutation.mutate(submitData);
    }
  };

  const handleEdit = (trip) => {
    setEditingTrip(trip);
    setFormData(trip);
    setIsFormOpen(true);
  };

  const statusColors = {
    Planned: 'bg-gray-100 text-gray-700',
    'Open for Registration': 'bg-green-100 text-green-700',
    'Registration Closed': 'bg-yellow-100 text-yellow-700',
    'In Progress': 'bg-blue-100 text-blue-700',
    Completed: 'bg-purple-100 text-purple-700',
    Cancelled: 'bg-red-100 text-red-700',
  };

  const getTripEnrollments = (tripId) => enrollments.filter(e => e.trip_id === tripId);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Trips Management</h1>
          <p className="text-gray-600 mt-1">Manage school trips and excursions</p>
        </div>
        <Button onClick={() => { resetForm(); setIsFormOpen(true); }} className="bg-blue-600 hover:bg-blue-700">
          <Plus className="w-4 h-4 mr-2" />
          Create Trip
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-white shadow-md">
          <CardContent className="p-6">
            <p className="text-sm text-gray-600">Total Trips</p>
            <p className="text-2xl font-bold text-gray-900">{trips.length}</p>
          </CardContent>
        </Card>
        <Card className="bg-white shadow-md">
          <CardContent className="p-6">
            <p className="text-sm text-gray-600">Open for Registration</p>
            <p className="text-2xl font-bold text-green-600">{trips.filter(t => t.status === 'Open for Registration').length}</p>
          </CardContent>
        </Card>
        <Card className="bg-white shadow-md">
          <CardContent className="p-6">
            <p className="text-sm text-gray-600">Total Enrollments</p>
            <p className="text-2xl font-bold text-blue-600">{enrollments.length}</p>
          </CardContent>
        </Card>
        <Card className="bg-white shadow-md">
          <CardContent className="p-6">
            <p className="text-sm text-gray-600">Upcoming Trips</p>
            <p className="text-2xl font-bold text-purple-600">{trips.filter(t => new Date(t.departure_date) > new Date()).length}</p>
          </CardContent>
        </Card>
      </div>

      {/* Trips Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {trips.map(trip => {
          const tripEnrollments = getTripEnrollments(trip.id);
          return (
            <Card key={trip.id} className="bg-white shadow-md hover:shadow-lg transition-shadow">
              {trip.image_url && (
                <img src={trip.image_url} alt={trip.title} className="w-full h-40 object-cover rounded-t-lg" />
              )}
              <CardContent className="p-4">
                <div className="flex justify-between items-start mb-2">
                  <h3 className="font-semibold text-gray-900">{trip.title}</h3>
                  <Badge className={statusColors[trip.status]}>{trip.status}</Badge>
                </div>
                <p className="text-sm text-gray-600 mb-3 line-clamp-2">{trip.description}</p>
                <div className="space-y-1 text-sm text-gray-600 mb-4">
                  <p className="flex items-center gap-2">
                    <MapPin className="w-4 h-4" />
                    {trip.destination}
                  </p>
                  <p className="flex items-center gap-2">
                    <Calendar className="w-4 h-4" />
                    {format(new Date(trip.departure_date), 'MMM d, yyyy')}
                  </p>
                  <p className="flex items-center gap-2">
                    <Users className="w-4 h-4" />
                    {tripEnrollments.length} / {trip.max_participants} enrolled
                  </p>
                  {trip.cost > 0 && (
                    <p className="flex items-center gap-2">
                      <DollarSign className="w-4 h-4" />
                      {formatAmount(trip.cost)}
                    </p>
                  )}
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={() => setSelectedTrip(trip)} className="flex-1">
                    <Users className="w-4 h-4 mr-1" />
                    View Enrollments
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => handleEdit(trip)}>
                    <Edit className="w-4 h-4" />
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => deleteMutation.mutate(trip.id)}>
                    <Trash2 className="w-4 h-4 text-red-600" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Trip Form Dialog */}
      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent className="max-w-2xl bg-white max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingTrip ? 'Edit Trip' : 'Create Trip'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label>Trip Title *</Label>
              <Input value={formData.title} onChange={(e) => setFormData({...formData, title: e.target.value})} required />
            </div>
            <div>
              <Label>Description</Label>
              <Textarea value={formData.description} onChange={(e) => setFormData({...formData, description: e.target.value})} />
            </div>
            <div>
              <Label>Destination *</Label>
              <Input value={formData.destination} onChange={(e) => setFormData({...formData, destination: e.target.value})} required />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Departure Date *</Label>
                <Input type="datetime-local" value={formData.departure_date} onChange={(e) => setFormData({...formData, departure_date: e.target.value})} required />
              </div>
              <div>
                <Label>Return Date *</Label>
                <Input type="datetime-local" value={formData.return_date} onChange={(e) => setFormData({...formData, return_date: e.target.value})} required />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Cost per Student</Label>
                <Input type="number" step="0.01" value={formData.cost} onChange={(e) => setFormData({...formData, cost: parseFloat(e.target.value)})} />
              </div>
              <div>
                <Label>Max Participants</Label>
                <Input type="number" value={formData.max_participants} onChange={(e) => setFormData({...formData, max_participants: parseInt(e.target.value)})} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Lead Teacher</Label>
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
                <Label>Status</Label>
                <Select value={formData.status} onValueChange={(v) => setFormData({...formData, status: v})}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Planned">Planned</SelectItem>
                    <SelectItem value="Open for Registration">Open for Registration</SelectItem>
                    <SelectItem value="Registration Closed">Registration Closed</SelectItem>
                    <SelectItem value="In Progress">In Progress</SelectItem>
                    <SelectItem value="Completed">Completed</SelectItem>
                    <SelectItem value="Cancelled">Cancelled</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <Label>Grade Levels (comma-separated)</Label>
              <Input value={formData.grade_levels} onChange={(e) => setFormData({...formData, grade_levels: e.target.value})} placeholder="e.g., JSS1, JSS2, SS1" />
            </div>
            <div>
              <Label>Consent Deadline</Label>
              <Input type="date" value={formData.consent_deadline} onChange={(e) => setFormData({...formData, consent_deadline: e.target.value})} />
            </div>
            <div>
              <Label>Image URL</Label>
              <Input value={formData.image_url} onChange={(e) => setFormData({...formData, image_url: e.target.value})} placeholder="https://..." />
            </div>
            <div className="flex gap-6">
              <label className="flex items-center gap-2">
                <Switch checked={formData.requires_payment} onCheckedChange={(v) => setFormData({...formData, requires_payment: v})} />
                <span className="text-sm">Requires Payment</span>
              </label>
              <label className="flex items-center gap-2">
                <Switch checked={formData.requires_consent} onCheckedChange={(v) => setFormData({...formData, requires_consent: v})} />
                <span className="text-sm">Requires Parental Consent</span>
              </label>
            </div>
            <div className="flex justify-end gap-3 pt-4 border-t">
              <Button type="button" variant="outline" onClick={() => setIsFormOpen(false)}>Cancel</Button>
              <Button type="submit" className="bg-blue-600 hover:bg-blue-700">
                {editingTrip ? 'Update' : 'Create'} Trip
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Enrollments Dialog */}
      <Dialog open={!!selectedTrip} onOpenChange={() => setSelectedTrip(null)}>
        <DialogContent className="max-w-2xl bg-white max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Enrollments for {selectedTrip?.title}</DialogTitle>
          </DialogHeader>
          {selectedTrip && (
            <div className="space-y-4">
              {getTripEnrollments(selectedTrip.id).length === 0 ? (
                <p className="text-center text-gray-500 py-8">No enrollments yet</p>
              ) : (
                <div className="space-y-3">
                  {getTripEnrollments(selectedTrip.id).map(enrollment => (
                    <div key={enrollment.id} className="p-4 border rounded-lg">
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="font-medium text-gray-900">{enrollment.student_name}</p>
                          <p className="text-sm text-gray-600">Consent: {enrollment.consent_given ? 'Yes' : 'Pending'}</p>
                        </div>
                        <div className="text-right">
                          <Badge className={enrollment.status === 'Approved' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}>
                            {enrollment.status}
                          </Badge>
                          {selectedTrip.requires_payment && (
                            <Badge className={enrollment.payment_status === 'Paid' ? 'bg-green-100 text-green-700 ml-2' : 'bg-yellow-100 text-yellow-700 ml-2'}>
                              {enrollment.payment_status}
                            </Badge>
                          )}
                        </div>
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