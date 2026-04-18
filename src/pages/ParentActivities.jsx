import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useSchoolContext } from '@/hooks/useSchoolContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { 
  Bus, Users, Calendar, MapPin, Clock, DollarSign, 
  CheckCircle, AlertCircle, FileText 
} from 'lucide-react';
import { format } from 'date-fns';
import { useCurrency } from '@/components/CurrencyProvider';
import { toast } from 'sonner';

export default function ParentActivities() {
  const [user, setUser] = useState(null);
  const [selectedStudent, setSelectedStudent] = useState('');
  const [selectedTrip, setSelectedTrip] = useState(null);
  const [selectedClub, setSelectedClub] = useState(null);
  const [consentNotes, setConsentNotes] = useState('');
  const queryClient = useQueryClient();
  const { formatAmount } = useCurrency();

  useEffect(() => {
    const fetchUser = async () => {
      const currentUser = await base44.auth.me();
      setUser(currentUser);
    };
    fetchUser();
  }, []);

  const { data: parents = [] } = useQuery({
    queryKey: ['parent-profile', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      if (user.parent_profile_id) {
        const parent = await base44.entities.Parent.get(user.parent_profile_id);
        return parent ? [parent] : [];
      }
      return await base44.entities.Parent.filter({ user_id: user.id });
    },
    enabled: !!user?.id,
  });

  const parentProfile = parents[0];

  const { data: students = [] } = useQuery({
    queryKey: ['parent-students-activities', parentProfile?.id, parentProfile?.linked_student_ids],
    queryFn: async () => {
      if (!parentProfile?.id) return [];
      if (parentProfile.linked_student_ids) {
        try {
          const studentIds = JSON.parse(parentProfile.linked_student_ids);
          if (Array.isArray(studentIds) && studentIds.length > 0) {
            const allStudents = await base44.entities.Student.list();
            return allStudents.filter(s => studentIds.includes(s.id));
          }
        } catch (e) {}
      }
      return await base44.entities.Student.filter({ parent_id: parentProfile.id });
    },
    enabled: !!parentProfile?.id,
  });

  const { school_tenant_id, isReady } = useSchoolContext();

  const { data: trips = [] } = useQuery({
    queryKey: ['school-trips', school_tenant_id],
    queryFn: () => base44.entities.SchoolTrip.filter({ school_tenant_id, status: 'Open for Registration' }, '-departure_date'),
    enabled: isReady,
  });

  const { data: clubs = [] } = useQuery({
    queryKey: ['school-clubs', school_tenant_id],
    queryFn: () => base44.entities.Club.filter({ school_tenant_id, status: 'Active' }),
    enabled: isReady,
  });

  const { data: tripEnrollments = [] } = useQuery({
    queryKey: ['trip-enrollments', selectedStudent],
    queryFn: () => base44.entities.TripEnrollment.filter({ student_id: selectedStudent }),
    enabled: !!selectedStudent,
  });

  const { data: clubMemberships = [] } = useQuery({
    queryKey: ['club-memberships', selectedStudent],
    queryFn: () => base44.entities.ClubMembership.filter({ student_id: selectedStudent }),
    enabled: !!selectedStudent,
  });

  useEffect(() => {
    if (students.length > 0 && !selectedStudent) {
      setSelectedStudent(students[0].id);
    }
  }, [students, selectedStudent]);

  const enrollTripMutation = useMutation({
    mutationFn: async ({ tripId, studentId }) => {
      const trip = trips.find(t => t.id === tripId);
      const student = students.find(s => s.id === studentId);
      return await base44.entities.TripEnrollment.create({
        trip_id: tripId,
        student_id: studentId,
        student_name: `${student?.first_name} ${student?.last_name}`,
        parent_id: parentProfile?.id,
        consent_given: true,
        consent_date: new Date().toISOString(),
        payment_status: trip?.requires_payment ? 'Pending' : 'Not Required',
        medical_notes: consentNotes,
        status: 'Approved',
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['trip-enrollments'] });
      setSelectedTrip(null);
      setConsentNotes('');
      toast.success('Consent given and enrollment confirmed!');
    },
    onError: (error) => {
      toast.error('Failed to enroll: ' + error.message);
    },
  });

  const joinClubMutation = useMutation({
    mutationFn: async ({ clubId, studentId }) => {
      const club = clubs.find(c => c.id === clubId);
      const student = students.find(s => s.id === studentId);
      return await base44.entities.ClubMembership.create({
        club_id: clubId,
        club_name: club?.name,
        student_id: studentId,
        student_name: `${student?.first_name} ${student?.last_name}`,
        parent_id: parentProfile?.id,
        join_date: new Date().toISOString().split('T')[0],
        payment_status: club?.fee > 0 ? 'Pending' : 'Not Required',
        status: 'Active',
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['club-memberships'] });
      setSelectedClub(null);
      toast.success('Successfully joined club!');
    },
    onError: (error) => {
      toast.error('Failed to join club: ' + error.message);
    },
  });

  const selectedStudentData = students.find(s => s.id === selectedStudent);
  const enrolledTripIds = tripEnrollments.map(e => e.trip_id);
  const memberClubIds = clubMemberships.map(m => m.club_id);

  const availableTrips = trips.filter(t => 
    t.status === 'Open for Registration' && !enrolledTripIds.includes(t.id)
  );

  const availableClubs = clubs.filter(c => 
    c.status === 'Active' && !memberClubIds.includes(c.id)
  );

  if (!user) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Activities</h1>
        <p className="text-gray-600 mt-1">Manage trips and clubs for your child</p>
      </div>

      {students.length > 0 && (
        <Card className="bg-white shadow-md">
          <CardContent className="p-4">
            <div className="flex items-center gap-4">
              <Label>Viewing activities for:</Label>
              <Select value={selectedStudent} onValueChange={setSelectedStudent}>
                <SelectTrigger className="w-64">
                  <SelectValue placeholder="Select student" />
                </SelectTrigger>
                <SelectContent>
                  {students.map(s => (
                    <SelectItem key={s.id} value={s.id}>
                      {s.first_name} {s.last_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>
      )}

      <Tabs defaultValue="trips" className="space-y-4">
        <TabsList className="bg-white shadow-sm p-1 rounded-lg">
          <TabsTrigger value="trips" className="data-[state=active]:bg-blue-100">
            <Bus className="w-4 h-4 mr-2" />
            School Trips
          </TabsTrigger>
          <TabsTrigger value="clubs" className="data-[state=active]:bg-blue-100">
            <Users className="w-4 h-4 mr-2" />
            Clubs
          </TabsTrigger>
        </TabsList>

        {/* Trips Tab */}
        <TabsContent value="trips" className="space-y-6">
          {/* Enrolled Trips */}
          {tripEnrollments.length > 0 && (
            <Card className="bg-white shadow-md">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                  Enrolled Trips
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {tripEnrollments.map(enrollment => {
                    const trip = trips.find(t => t.id === enrollment.trip_id);
                    if (!trip) return null;
                    return (
                      <div key={enrollment.id} className="p-4 bg-green-50 rounded-lg border border-green-200">
                        <div className="flex justify-between items-start">
                          <div>
                            <h3 className="font-semibold text-gray-900">{trip.title}</h3>
                            <p className="text-sm text-gray-600 flex items-center gap-1 mt-1">
                              <MapPin className="w-3 h-3" />
                              {trip.destination}
                            </p>
                            <p className="text-sm text-gray-600 flex items-center gap-1">
                              <Calendar className="w-3 h-3" />
                              {format(new Date(trip.departure_date), 'MMM d, yyyy')}
                            </p>
                          </div>
                          <div className="text-right">
                            <Badge className="bg-green-100 text-green-700">
                              {enrollment.status}
                            </Badge>
                            {enrollment.payment_status === 'Pending' && (
                              <Badge className="bg-yellow-100 text-yellow-700 ml-2">
                                Payment Pending
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Available Trips */}
          <Card className="bg-white shadow-md">
            <CardHeader>
              <CardTitle>Available Trips</CardTitle>
            </CardHeader>
            <CardContent>
              {availableTrips.length === 0 ? (
                <p className="text-center text-gray-500 py-8">No trips available for registration</p>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {availableTrips.map(trip => (
                    <Card key={trip.id} className="border-2 hover:border-blue-300 transition-colors">
                      {trip.image_url && (
                        <img src={trip.image_url} alt={trip.title} className="w-full h-40 object-cover rounded-t-lg" />
                      )}
                      <CardContent className="p-4">
                        <h3 className="font-semibold text-gray-900 mb-2">{trip.title}</h3>
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
                          {trip.cost > 0 && (
                            <p className="flex items-center gap-2">
                              <DollarSign className="w-4 h-4" />
                              {formatAmount(trip.cost)}
                            </p>
                          )}
                        </div>
                        <Button 
                          onClick={() => setSelectedTrip(trip)}
                          className="w-full bg-blue-600 hover:bg-blue-700"
                        >
                          <FileText className="w-4 h-4 mr-2" />
                          Give Consent & Enroll
                        </Button>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Clubs Tab */}
        <TabsContent value="clubs" className="space-y-6">
          {/* Current Memberships */}
          {clubMemberships.length > 0 && (
            <Card className="bg-white shadow-md">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                  {selectedStudentData?.first_name}'s Clubs
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {clubMemberships.map(membership => {
                    const club = clubs.find(c => c.id === membership.club_id);
                    return (
                      <div key={membership.id} className="p-4 bg-green-50 rounded-lg border border-green-200">
                        <h3 className="font-semibold text-gray-900">{membership.club_name}</h3>
                        <p className="text-sm text-gray-600">{club?.meeting_schedule}</p>
                        <div className="flex gap-2 mt-2">
                          <Badge className="bg-blue-100 text-blue-700">{membership.role}</Badge>
                          <Badge className="bg-green-100 text-green-700">{membership.status}</Badge>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Available Clubs */}
          <Card className="bg-white shadow-md">
            <CardHeader>
              <CardTitle>Available Clubs</CardTitle>
            </CardHeader>
            <CardContent>
              {availableClubs.length === 0 ? (
                <p className="text-center text-gray-500 py-8">No clubs available to join</p>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {availableClubs.map(club => (
                    <Card key={club.id} className="border-2 hover:border-blue-300 transition-colors">
                      {club.image_url && (
                        <img src={club.image_url} alt={club.name} className="w-full h-32 object-cover rounded-t-lg" />
                      )}
                      <CardContent className="p-4">
                        <div className="flex justify-between items-start mb-2">
                          <h3 className="font-semibold text-gray-900">{club.name}</h3>
                          <Badge variant="outline">{club.category}</Badge>
                        </div>
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
                          {club.fee > 0 && (
                            <p className="flex items-center gap-2">
                              <DollarSign className="w-4 h-4" />
                              {formatAmount(club.fee)} / term
                            </p>
                          )}
                        </div>
                        <Button 
                          onClick={() => setSelectedClub(club)}
                          className="w-full bg-blue-600 hover:bg-blue-700"
                          disabled={club.status === 'Full'}
                        >
                          <Users className="w-4 h-4 mr-2" />
                          {club.status === 'Full' ? 'Club Full' : 'Join Club'}
                        </Button>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Trip Consent Dialog */}
      <Dialog open={!!selectedTrip} onOpenChange={() => setSelectedTrip(null)}>
        <DialogContent className="max-w-lg bg-white">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Bus className="w-5 h-5 text-blue-600" />
              Consent for Trip
            </DialogTitle>
          </DialogHeader>
          {selectedTrip && (
            <div className="space-y-4">
              <div className="p-4 bg-blue-50 rounded-lg">
                <h3 className="font-semibold text-gray-900">{selectedTrip.title}</h3>
                <p className="text-sm text-gray-600 mt-1">{selectedTrip.description}</p>
                <div className="mt-3 space-y-1 text-sm">
                  <p><strong>Destination:</strong> {selectedTrip.destination}</p>
                  <p><strong>Date:</strong> {format(new Date(selectedTrip.departure_date), 'PPP')}</p>
                  {selectedTrip.cost > 0 && (
                    <p><strong>Cost:</strong> {formatAmount(selectedTrip.cost)}</p>
                  )}
                </div>
              </div>

              <div>
                <Label>Student</Label>
                <p className="font-medium text-gray-900 mt-1">
                  {selectedStudentData?.first_name} {selectedStudentData?.last_name}
                </p>
              </div>

              <div>
                <Label>Medical Notes / Special Requirements (Optional)</Label>
                <Textarea 
                  value={consentNotes}
                  onChange={(e) => setConsentNotes(e.target.value)}
                  placeholder="Any medical conditions or requirements..."
                  className="mt-1"
                />
              </div>

              <div className="p-4 bg-yellow-50 rounded-lg border border-yellow-200">
                <p className="text-sm text-yellow-800">
                  <AlertCircle className="w-4 h-4 inline mr-1" />
                  By clicking "Give Consent", you confirm that you give permission for your child to participate in this trip.
                </p>
              </div>

              <Button 
                onClick={() => enrollTripMutation.mutate({ tripId: selectedTrip.id, studentId: selectedStudent })}
                className="w-full bg-green-600 hover:bg-green-700"
                disabled={enrollTripMutation.isPending}
              >
                <CheckCircle className="w-4 h-4 mr-2" />
                {enrollTripMutation.isPending ? 'Processing...' : 'Give Consent & Enroll'}
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Join Club Dialog */}
      <Dialog open={!!selectedClub} onOpenChange={() => setSelectedClub(null)}>
        <DialogContent className="max-w-lg bg-white">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Users className="w-5 h-5 text-blue-600" />
              Join Club
            </DialogTitle>
          </DialogHeader>
          {selectedClub && (
            <div className="space-y-4">
              <div className="p-4 bg-blue-50 rounded-lg">
                <h3 className="font-semibold text-gray-900">{selectedClub.name}</h3>
                <Badge variant="outline" className="mt-1">{selectedClub.category}</Badge>
                <p className="text-sm text-gray-600 mt-2">{selectedClub.description}</p>
                <div className="mt-3 space-y-1 text-sm">
                  <p><strong>Schedule:</strong> {selectedClub.meeting_schedule}</p>
                  <p><strong>Location:</strong> {selectedClub.location}</p>
                  {selectedClub.fee > 0 && (
                    <p><strong>Fee:</strong> {formatAmount(selectedClub.fee)} / term</p>
                  )}
                </div>
              </div>

              <div>
                <Label>Student</Label>
                <p className="font-medium text-gray-900 mt-1">
                  {selectedStudentData?.first_name} {selectedStudentData?.last_name}
                </p>
              </div>

              <Button 
                onClick={() => joinClubMutation.mutate({ clubId: selectedClub.id, studentId: selectedStudent })}
                className="w-full bg-blue-600 hover:bg-blue-700"
                disabled={joinClubMutation.isPending}
              >
                <CheckCircle className="w-4 h-4 mr-2" />
                {joinClubMutation.isPending ? 'Processing...' : 'Confirm & Join'}
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}