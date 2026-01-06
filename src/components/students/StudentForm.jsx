import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
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

function GradeLevelSelect({ value, onChange }) {
  const { data: classArms = [] } = useQuery({
    queryKey: ['class-arms'],
    queryFn: () => base44.entities.ClassArm.list(),
  });

  const uniqueGradeLevels = [...new Set(classArms.map(c => c.grade_level))].sort();

  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger>
        <SelectValue placeholder="Select grade level" />
      </SelectTrigger>
      <SelectContent>
        {uniqueGradeLevels.map((grade) => (
          <SelectItem key={grade} value={grade}>
            {grade}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

export default function StudentForm({ student, onSubmit, onCancel }) {
  const [formData, setFormData] = useState(
    student || {
      first_name: '',
      last_name: '',
      student_id_number: '',
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

  const [photoFile, setPhotoFile] = useState(null);
  const [uploading, setUploading] = useState(false);

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setPhotoFile(e.target.files[0]);
    }
  };

  const handleChange = (field, value) => {
    setFormData({ ...formData, [field]: value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    let finalFormData = { ...formData };

    if (photoFile) {
      setUploading(true);
      try {
        const { file_url } = await base44.integrations.Core.UploadFile({ file: photoFile });
        finalFormData = { ...finalFormData, photo_url: file_url };
      } catch (error) {
        console.error("Error uploading photo:", error);
        alert("Failed to upload photo. Please try again.");
        setUploading(false);
        return;
      }
      setUploading(false);
    }
    
    onSubmit(finalFormData);
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
            <Label htmlFor="student_id_number">Student ID *</Label>
            <Input
              id="student_id_number"
              value={formData.student_id_number}
              onChange={(e) => handleChange('student_id_number', e.target.value)}
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
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="grade_level">Grade Level *</Label>
            <GradeLevelSelect
              value={formData.grade_level}
              onChange={(value) => handleChange('grade_level', value)}
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
          <Label htmlFor="photo_upload">Student Photo</Label>
          <Input
            id="photo_upload"
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            className="file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
          />
          {formData.photo_url && (
            <div className="mt-2 flex items-center gap-2">
              <img src={formData.photo_url} alt="Student Photo" className="w-20 h-20 rounded-full object-cover" />
              <a href={formData.photo_url} target="_blank" rel="noopener noreferrer" className="text-sm text-blue-600 hover:underline">
                View current photo
              </a>
            </div>
          )}
        </div>
      </div>

      {/* Actions */}
      <div className="flex justify-end gap-3 pt-4 border-t">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" className="bg-blue-600 hover:bg-blue-700" disabled={uploading}>
          {uploading ? 'Uploading...' : student ? 'Update Student' : 'Add Student'}
        </Button>
      </div>
    </form>
  );
}