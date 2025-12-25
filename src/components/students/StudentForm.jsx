import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

export default function StudentForm({ student, onSubmit, onCancel }) {
  const [formData, setFormData] = useState(
    student || {
      first_name: '',
      last_name: '',
      student_id: '',
      date_of_birth: '',
      gender: 'Male',
      admission_date: new Date().toISOString().split('T')[0],
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
      photo_url: '',
      notes: '',
    }
  );

  const handleChange = (field, value) => {
    setFormData({ ...formData, [field]: value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Personal Information */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-gray-900">Personal Information</h3>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="first_name">First Name *</Label>
            <Input
              id="first_name"
              value={formData.first_name}
              onChange={(e) => handleChange('first_name', e.target.value)}
              required
              placeholder="Enter first name"
            />
          </div>
          <div>
            <Label htmlFor="last_name">Last Name *</Label>
            <Input
              id="last_name"
              value={formData.last_name}
              onChange={(e) => handleChange('last_name', e.target.value)}
              required
              placeholder="Enter last name"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="student_id">Student ID *</Label>
            <Input
              id="student_id"
              value={formData.student_id}
              onChange={(e) => handleChange('student_id', e.target.value)}
              required
              placeholder="e.g., STU2024001"
            />
          </div>
          <div>
            <Label htmlFor="date_of_birth">Date of Birth</Label>
            <Input
              id="date_of_birth"
              type="date"
              value={formData.date_of_birth}
              onChange={(e) => handleChange('date_of_birth', e.target.value)}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="gender">Gender</Label>
            <Select value={formData.gender} onValueChange={(value) => handleChange('gender', value)}>
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
            <Label htmlFor="grade_level">Grade Level *</Label>
            <Input
              id="grade_level"
              value={formData.grade_level}
              onChange={(e) => handleChange('grade_level', e.target.value)}
              required
              placeholder="e.g., 10, Grade 10"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="admission_date">Admission Date</Label>
            <Input
              id="admission_date"
              type="date"
              value={formData.admission_date}
              onChange={(e) => handleChange('admission_date', e.target.value)}
            />
          </div>
          <div>
            <Label htmlFor="status">Status</Label>
            <Select value={formData.status} onValueChange={(value) => handleChange('status', value)}>
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
        </div>
      </div>

      {/* Contact Information */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-gray-900">Contact Information</h3>
        
        <div>
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            value={formData.email}
            onChange={(e) => handleChange('email', e.target.value)}
            placeholder="student@example.com"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="phone">Phone</Label>
            <Input
              id="phone"
              value={formData.phone}
              onChange={(e) => handleChange('phone', e.target.value)}
              placeholder="+1234567890"
            />
          </div>
          <div>
            <Label htmlFor="address">Address</Label>
            <Input
              id="address"
              value={formData.address}
              onChange={(e) => handleChange('address', e.target.value)}
              placeholder="Full address"
            />
          </div>
        </div>
      </div>

      {/* Parent/Guardian Information */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-gray-900">Parent/Guardian Information</h3>
        
        <div>
          <Label htmlFor="parent_name">Parent/Guardian Name</Label>
          <Input
            id="parent_name"
            value={formData.parent_name}
            onChange={(e) => handleChange('parent_name', e.target.value)}
            placeholder="Full name"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="parent_email">Parent Email</Label>
            <Input
              id="parent_email"
              type="email"
              value={formData.parent_email}
              onChange={(e) => handleChange('parent_email', e.target.value)}
              placeholder="parent@example.com"
            />
          </div>
          <div>
            <Label htmlFor="parent_phone">Parent Phone</Label>
            <Input
              id="parent_phone"
              value={formData.parent_phone}
              onChange={(e) => handleChange('parent_phone', e.target.value)}
              placeholder="+1234567890"
            />
          </div>
        </div>
      </div>

      {/* Additional Information */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-gray-900">Additional Information</h3>
        
        <div>
          <Label htmlFor="medical_conditions">Medical Conditions / Allergies</Label>
          <Textarea
            id="medical_conditions"
            value={formData.medical_conditions}
            onChange={(e) => handleChange('medical_conditions', e.target.value)}
            placeholder="List any medical conditions or allergies"
            rows={3}
          />
        </div>

        <div>
          <Label htmlFor="send_status">SEND Status</Label>
          <Input
            id="send_status"
            value={formData.send_status}
            onChange={(e) => handleChange('send_status', e.target.value)}
            placeholder="Special Educational Needs and Disabilities"
          />
        </div>

        <div>
          <Label htmlFor="notes">Notes</Label>
          <Textarea
            id="notes"
            value={formData.notes}
            onChange={(e) => handleChange('notes', e.target.value)}
            placeholder="Additional notes"
            rows={3}
          />
        </div>

        <div>
          <Label htmlFor="photo_url">Photo URL</Label>
          <Input
            id="photo_url"
            value={formData.photo_url}
            onChange={(e) => handleChange('photo_url', e.target.value)}
            placeholder="https://example.com/photo.jpg"
          />
        </div>
      </div>

      {/* Actions */}
      <div className="flex justify-end gap-3 pt-4 border-t">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" className="bg-blue-600 hover:bg-blue-700">
          {student ? 'Update Student' : 'Add Student'}
        </Button>
      </div>
    </form>
  );
}