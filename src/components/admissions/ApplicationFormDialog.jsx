import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export default function ApplicationFormDialog({ open, onOpenChange, application, onComplete }) {
  const [formData, setFormData] = useState({
    application_number: '',
    first_name: '',
    last_name: '',
    date_of_birth: '',
    gender: 'Male',
    email: '',
    phone: '',
    address: '',
    parent_name: '',
    parent_email: '',
    parent_phone: '',
    grade_applying_for: '',
    previous_school: '',
    admission_year: new Date().getFullYear().toString(),
    source: 'Website',
    upn: '',
    uln: '',
    notes: '',
  });

  useEffect(() => {
    if (application) {
      setFormData(application);
    } else {
      setFormData({
        application_number: `APP${Date.now()}`,
        first_name: '',
        last_name: '',
        date_of_birth: '',
        gender: 'Male',
        email: '',
        phone: '',
        address: '',
        parent_name: '',
        parent_email: '',
        parent_phone: '',
        grade_applying_for: '',
        previous_school: '',
        admission_year: new Date().getFullYear().toString(),
        source: 'Website',
        upn: '',
        uln: '',
        notes: '',
      });
    }
  }, [application]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (application) {
        await base44.entities.Application.update(application.id, formData);
      } else {
        await base44.entities.Application.create(formData);
      }
      onComplete();
    } catch (error) {
      alert('Error saving application: ' + error.message);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto bg-white">
        <DialogHeader>
          <DialogTitle>{application ? 'Edit Application' : 'New Application'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Application Number *</Label>
              <Input value={formData.application_number} onChange={(e) => setFormData({...formData, application_number: e.target.value})} required />
            </div>
            <div>
              <Label>Admission Year *</Label>
              <Input value={formData.admission_year} onChange={(e) => setFormData({...formData, admission_year: e.target.value})} required />
            </div>
          </div>

          <div className="border-t pt-4">
            <h3 className="font-semibold text-gray-900 mb-3">Applicant Information</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>First Name *</Label>
                <Input value={formData.first_name} onChange={(e) => setFormData({...formData, first_name: e.target.value})} required />
              </div>
              <div>
                <Label>Last Name *</Label>
                <Input value={formData.last_name} onChange={(e) => setFormData({...formData, last_name: e.target.value})} required />
              </div>
              <div>
                <Label>Date of Birth *</Label>
                <Input type="date" value={formData.date_of_birth} onChange={(e) => setFormData({...formData, date_of_birth: e.target.value})} required />
              </div>
              <div>
                <Label>Gender *</Label>
                <Select value={formData.gender} onValueChange={(value) => setFormData({...formData, gender: value})}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Male">Male</SelectItem>
                    <SelectItem value="Female">Female</SelectItem>
                    <SelectItem value="Other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Email</Label>
                <Input type="email" value={formData.email} onChange={(e) => setFormData({...formData, email: e.target.value})} />
              </div>
              <div>
                <Label>Phone</Label>
                <Input value={formData.phone} onChange={(e) => setFormData({...formData, phone: e.target.value})} />
              </div>
              <div className="col-span-2">
                <Label>Address</Label>
                <Input value={formData.address} onChange={(e) => setFormData({...formData, address: e.target.value})} />
              </div>
            </div>
          </div>

          <div className="border-t pt-4">
            <h3 className="font-semibold text-gray-900 mb-3">Parent/Guardian Information</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Parent Name *</Label>
                <Input value={formData.parent_name} onChange={(e) => setFormData({...formData, parent_name: e.target.value})} required />
              </div>
              <div>
                <Label>Parent Email *</Label>
                <Input type="email" value={formData.parent_email} onChange={(e) => setFormData({...formData, parent_email: e.target.value})} required />
              </div>
              <div>
                <Label>Parent Phone</Label>
                <Input value={formData.parent_phone} onChange={(e) => setFormData({...formData, parent_phone: e.target.value})} />
              </div>
            </div>
          </div>

          <div className="border-t pt-4">
            <h3 className="font-semibold text-gray-900 mb-3">Academic Information</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Grade Applying For *</Label>
                <Input value={formData.grade_applying_for} onChange={(e) => setFormData({...formData, grade_applying_for: e.target.value})} required />
              </div>
              <div>
                <Label>Previous School</Label>
                <Input value={formData.previous_school} onChange={(e) => setFormData({...formData, previous_school: e.target.value})} />
              </div>
              <div>
                <Label>UPN (Unique Pupil Number)</Label>
                <Input value={formData.upn} onChange={(e) => setFormData({...formData, upn: e.target.value})} />
              </div>
              <div>
                <Label>ULN (Unique Learner Number)</Label>
                <Input value={formData.uln} onChange={(e) => setFormData({...formData, uln: e.target.value})} />
              </div>
            </div>
          </div>

          <div className="border-t pt-4">
            <h3 className="font-semibold text-gray-900 mb-3">Additional Information</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Application Source</Label>
                <Select value={formData.source} onValueChange={(value) => setFormData({...formData, source: value})}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Website">Website</SelectItem>
                    <SelectItem value="Walk-in">Walk-in</SelectItem>
                    <SelectItem value="Referral">Referral</SelectItem>
                    <SelectItem value="Social Media">Social Media</SelectItem>
                    <SelectItem value="Advertisement">Advertisement</SelectItem>
                    <SelectItem value="Other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="mt-4">
              <Label>Notes</Label>
              <Textarea value={formData.notes} onChange={(e) => setFormData({...formData, notes: e.target.value})} rows={3} />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button type="submit" className="bg-blue-600 hover:bg-blue-700">
              {application ? 'Update' : 'Create'} Application
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}