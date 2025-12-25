import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';

export default function StudentFormDialog({ open, onOpenChange, student, onSubmit }) {
  const [formData, setFormData] = useState(
    student || {
      first_name: '',
      last_name: '',
      student_id: '',
      date_of_birth: '',
      gender: 'Male',
      admission_date: '',
      grade_level: '',
      status: 'Active',
      address: '',
      phone: '',
      email: '',
      parent_name: '',
      parent_email: '',
      parent_phone: '',
      medical_conditions: '',
      send_status: '',
      notes: '',
    }
  );

  useEffect(() => {
    if (student) {
      setFormData(student);
    } else {
      setFormData({
        first_name: '',
        last_name: '',
        student_id: '',
        date_of_birth: '',
        gender: 'Male',
        admission_date: '',
        grade_level: '',
        status: 'Active',
        address: '',
        phone: '',
        email: '',
        parent_name: '',
        parent_email: '',
        parent_phone: '',
        medical_conditions: '',
        send_status: '',
        notes: '',
      });
    }
  }, [student, open]);

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto bg-white">
        <DialogHeader>
          <DialogTitle className="text-gray-900">{student ? 'Edit Student' : 'Add New Student'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-gray-700 border-b pb-2">Personal Information</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>First Name *</Label>
                <Input value={formData.first_name} onChange={(e) => setFormData({ ...formData, first_name: e.target.value })} required />
              </div>
              <div>
                <Label>Last Name *</Label>
                <Input value={formData.last_name} onChange={(e) => setFormData({ ...formData, last_name: e.target.value })} required />
              </div>
              <div>
                <Label>Student ID *</Label>
                <Input value={formData.student_id} onChange={(e) => setFormData({ ...formData, student_id: e.target.value })} required />
              </div>
              <div>
                <Label>Grade Level *</Label>
                <Input value={formData.grade_level} onChange={(e) => setFormData({ ...formData, grade_level: e.target.value })} required />
              </div>
              <div>
                <Label>Date of Birth</Label>
                <Input type="date" value={formData.date_of_birth} onChange={(e) => setFormData({ ...formData, date_of_birth: e.target.value })} />
              </div>
              <div>
                <Label>Admission Date</Label>
                <Input type="date" value={formData.admission_date} onChange={(e) => setFormData({ ...formData, admission_date: e.target.value })} />
              </div>
              <div>
                <Label>Gender</Label>
                <Select value={formData.gender} onValueChange={(value) => setFormData({ ...formData, gender: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select gender" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Male">Male</SelectItem>
                    <SelectItem value="Female">Female</SelectItem>
                    <SelectItem value="Other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Status</Label>
                <Select value={formData.status} onValueChange={(value) => setFormData({ ...formData, status: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select status" />
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
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-gray-700 border-b pb-2">Contact Information</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <Label>Address</Label>
                <Input value={formData.address} onChange={(e) => setFormData({ ...formData, address: e.target.value })} />
              </div>
              <div>
                <Label>Phone</Label>
                <Input value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} />
              </div>
              <div>
                <Label>Email</Label>
                <Input type="email" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} />
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-gray-700 border-b pb-2">Parent/Guardian Information</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Parent/Guardian Name</Label>
                <Input value={formData.parent_name} onChange={(e) => setFormData({ ...formData, parent_name: e.target.value })} />
              </div>
              <div>
                <Label>Parent/Guardian Phone</Label>
                <Input value={formData.parent_phone} onChange={(e) => setFormData({ ...formData, parent_phone: e.target.value })} />
              </div>
              <div className="col-span-2">
                <Label>Parent/Guardian Email</Label>
                <Input type="email" value={formData.parent_email} onChange={(e) => setFormData({ ...formData, parent_email: e.target.value })} />
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-gray-700 border-b pb-2">Additional Information</h3>
            <div className="space-y-4">
              <div>
                <Label>Medical Conditions</Label>
                <Textarea value={formData.medical_conditions} onChange={(e) => setFormData({ ...formData, medical_conditions: e.target.value })} rows={2} />
              </div>
              <div>
                <Label>SEND Status</Label>
                <Input value={formData.send_status} onChange={(e) => setFormData({ ...formData, send_status: e.target.value })} placeholder="Special Educational Needs and Disabilities status" />
              </div>
              <div>
                <Label>Notes</Label>
                <Textarea value={formData.notes} onChange={(e) => setFormData({ ...formData, notes: e.target.value })} rows={2} />
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button type="submit" className="bg-blue-600 hover:bg-blue-700">{student ? 'Update Student' : 'Add Student'}</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}