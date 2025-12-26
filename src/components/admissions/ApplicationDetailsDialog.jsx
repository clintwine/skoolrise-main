import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Calendar, Mail, Phone, MapPin, School, Edit, CheckCircle } from 'lucide-react';

export default function ApplicationDetailsDialog({ open, onOpenChange, application, onUpdate, onEdit }) {
  const [isEditingStage, setIsEditingStage] = useState(false);
  const [stage, setStage] = useState('');
  const [status, setStatus] = useState('');
  const [interviewDate, setInterviewDate] = useState('');
  const [interviewNotes, setInterviewNotes] = useState('');
  const [enrollmentDeadline, setEnrollmentDeadline] = useState('');
  const [destinationData, setDestinationData] = useState('');

  React.useEffect(() => {
    if (application) {
      setStage(application.application_stage || '');
      setStatus(application.status || '');
      setInterviewDate(application.interview_date || '');
      setInterviewNotes(application.interview_notes || '');
      setEnrollmentDeadline(application.enrollment_deadline || '');
      setDestinationData(application.destination_data || '');
    }
  }, [application]);

  if (!application) return null;

  const handleUpdateStage = () => {
    onUpdate(application.id, {
      application_stage: stage,
      status: status,
      interview_date: interviewDate,
      interview_notes: interviewNotes,
      enrollment_deadline: enrollmentDeadline,
      destination_data: destinationData,
    });
    setIsEditingStage(false);
  };

  const stageColors = {
    'Submitted': 'bg-blue-100 text-blue-800',
    'Under Review': 'bg-yellow-100 text-yellow-800',
    'Interview Scheduled': 'bg-purple-100 text-purple-800',
    'Interviewed': 'bg-indigo-100 text-indigo-800',
    'Offered': 'bg-green-100 text-green-800',
    'Accepted': 'bg-teal-100 text-teal-800',
    'Declined': 'bg-orange-100 text-orange-800',
    'Rejected': 'bg-red-100 text-red-800',
    'Enrolled': 'bg-emerald-100 text-emerald-800',
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto bg-white">
        <DialogHeader>
          <DialogTitle>Application Details</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          <div className="flex justify-between items-start">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">{application.first_name} {application.last_name}</h2>
              <p className="text-gray-600">{application.application_number}</p>
            </div>
            <div className="flex gap-2">
              <Badge className={stageColors[application.application_stage]}>{application.application_stage}</Badge>
              <Button size="sm" variant="outline" onClick={onEdit}>
                <Edit className="w-4 h-4 mr-1" />
                Edit
              </Button>
            </div>
          </div>

          <div className="border rounded-lg p-4 space-y-3">
            <h3 className="font-semibold text-gray-900">Applicant Information</h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-gray-500" />
                <span>DOB: {application.date_of_birth}</span>
              </div>
              <div className="flex items-center gap-2">
                <span>Gender: {application.gender}</span>
              </div>
              {application.email && (
                <div className="flex items-center gap-2">
                  <Mail className="w-4 h-4 text-gray-500" />
                  <span>{application.email}</span>
                </div>
              )}
              {application.phone && (
                <div className="flex items-center gap-2">
                  <Phone className="w-4 h-4 text-gray-500" />
                  <span>{application.phone}</span>
                </div>
              )}
              {application.address && (
                <div className="flex items-center gap-2 col-span-2">
                  <MapPin className="w-4 h-4 text-gray-500" />
                  <span>{application.address}</span>
                </div>
              )}
            </div>
          </div>

          <div className="border rounded-lg p-4 space-y-3">
            <h3 className="font-semibold text-gray-900">Parent/Guardian</h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-gray-500">Name</p>
                <p className="font-medium">{application.parent_name}</p>
              </div>
              <div>
                <p className="text-gray-500">Email</p>
                <p className="font-medium">{application.parent_email}</p>
              </div>
              {application.parent_phone && (
                <div>
                  <p className="text-gray-500">Phone</p>
                  <p className="font-medium">{application.parent_phone}</p>
                </div>
              )}
            </div>
          </div>

          <div className="border rounded-lg p-4 space-y-3">
            <h3 className="font-semibold text-gray-900">Academic Information</h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-gray-500">Grade Applying For</p>
                <p className="font-medium">Grade {application.grade_applying_for}</p>
              </div>
              <div>
                <p className="text-gray-500">Admission Year</p>
                <p className="font-medium">{application.admission_year}</p>
              </div>
              {application.previous_school && (
                <div className="col-span-2">
                  <p className="text-gray-500">Previous School</p>
                  <p className="font-medium">{application.previous_school}</p>
                </div>
              )}
              {application.upn && (
                <div>
                  <p className="text-gray-500">UPN</p>
                  <p className="font-medium">{application.upn}</p>
                </div>
              )}
              {application.uln && (
                <div>
                  <p className="text-gray-500">ULN</p>
                  <p className="font-medium">{application.uln}</p>
                </div>
              )}
            </div>
          </div>

          <div className="border rounded-lg p-4 space-y-3">
            <div className="flex justify-between items-center">
              <h3 className="font-semibold text-gray-900">Application Progress</h3>
              <Button size="sm" variant="outline" onClick={() => setIsEditingStage(!isEditingStage)}>
                {isEditingStage ? 'Cancel' : 'Update Stage'}
              </Button>
            </div>
            {isEditingStage ? (
              <div className="space-y-3">
                <div>
                  <Label>Application Stage</Label>
                  <Select value={stage} onValueChange={setStage}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Submitted">Submitted</SelectItem>
                      <SelectItem value="Under Review">Under Review</SelectItem>
                      <SelectItem value="Interview Scheduled">Interview Scheduled</SelectItem>
                      <SelectItem value="Interviewed">Interviewed</SelectItem>
                      <SelectItem value="Offered">Offered</SelectItem>
                      <SelectItem value="Accepted">Accepted</SelectItem>
                      <SelectItem value="Declined">Declined</SelectItem>
                      <SelectItem value="Rejected">Rejected</SelectItem>
                      <SelectItem value="Enrolled">Enrolled</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Status</Label>
                  <Select value={status} onValueChange={setStatus}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Pending">Pending</SelectItem>
                      <SelectItem value="In Progress">In Progress</SelectItem>
                      <SelectItem value="Approved">Approved</SelectItem>
                      <SelectItem value="Rejected">Rejected</SelectItem>
                      <SelectItem value="Withdrawn">Withdrawn</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Interview Date</Label>
                  <Input type="datetime-local" value={interviewDate} onChange={(e) => setInterviewDate(e.target.value)} />
                </div>
                <div>
                  <Label>Interview Notes</Label>
                  <Textarea value={interviewNotes} onChange={(e) => setInterviewNotes(e.target.value)} rows={3} />
                </div>
                <div>
                  <Label>Enrollment Deadline</Label>
                  <Input type="date" value={enrollmentDeadline} onChange={(e) => setEnrollmentDeadline(e.target.value)} />
                </div>
                <div>
                  <Label>Destination Data</Label>
                  <Textarea value={destinationData} onChange={(e) => setDestinationData(e.target.value)} rows={2} placeholder="Post-school destination information..." />
                </div>
                <Button onClick={handleUpdateStage} className="bg-blue-600 hover:bg-blue-700">
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Save Changes
                </Button>
              </div>
            ) : (
              <div className="space-y-2 text-sm">
                <p><span className="text-gray-500">Status:</span> <Badge>{application.status}</Badge></p>
                {application.interview_date && (
                  <p><span className="text-gray-500">Interview Date:</span> {new Date(application.interview_date).toLocaleString()}</p>
                )}
                {application.interview_notes && (
                  <p><span className="text-gray-500">Interview Notes:</span> {application.interview_notes}</p>
                )}
                {application.offer_letter_sent && (
                  <p><span className="text-gray-500">Offer Letter Sent:</span> {application.offer_letter_date}</p>
                )}
                {application.enrollment_deadline && (
                  <p><span className="text-gray-500">Enrollment Deadline:</span> {application.enrollment_deadline}</p>
                )}
                {application.destination_data && (
                  <p><span className="text-gray-500">Destination:</span> {application.destination_data}</p>
                )}
              </div>
            )}
          </div>

          {application.notes && (
            <div className="border rounded-lg p-4">
              <h3 className="font-semibold text-gray-900 mb-2">Notes</h3>
              <p className="text-sm text-gray-600">{application.notes}</p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}