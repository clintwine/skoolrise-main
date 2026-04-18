import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { RefreshCw } from 'lucide-react';

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

function ClassArmSelect({ value, onChange }) {
  const { data: classArms = [] } = useQuery({
    queryKey: ['class-arms'],
    queryFn: () => base44.entities.ClassArm.list(),
  });

  return (
    <Select 
      value={value} 
      onValueChange={(v) => {
        const arm = classArms.find(a => a.id === v);
        onChange(v, arm?.grade_level || '');
      }}
    >
      <SelectTrigger>
        <SelectValue placeholder="Select class arm" />
      </SelectTrigger>
      <SelectContent>
        {classArms.map((arm) => (
          <SelectItem key={arm.id} value={arm.id}>
            Grade {arm.grade_level} - {arm.arm_name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

// Helper to safely format date for input fields
const formatDateForInput = (dateValue) => {
  if (!dateValue) return '';
  try {
    // Handle string type
    if (typeof dateValue === 'string') {
      // If it's already in YYYY-MM-DD format, return as is
      if (/^\d{4}-\d{2}-\d{2}$/.test(dateValue)) {
        return dateValue;
      }
      // Check for empty or invalid strings
      const trimmed = dateValue.trim();
      if (!trimmed || trimmed === 'null' || trimmed === 'undefined' || trimmed === 'Invalid Date') {
        return '';
      }
      const date = new Date(trimmed);
      if (isNaN(date.getTime())) return '';
      return date.toISOString().split('T')[0];
    }
    // Handle Date object
    if (dateValue instanceof Date) {
      if (isNaN(dateValue.getTime())) return '';
      return dateValue.toISOString().split('T')[0];
    }
    return '';
  } catch {
    return '';
  }
};

export default function StudentForm({ student, onSubmit, onCancel }) {
  const [formData, setFormData] = useState(() => {
    if (student) {
      return {
        ...student,
        date_of_birth: formatDateForInput(student.date_of_birth),
        admission_date: formatDateForInput(student.admission_date),
      };
    }
    return {
      first_name: '',
      last_name: '',
      student_id_number: '',
      date_of_birth: '',
      gender: 'Male',
      admission_date: formatDateForInput(new Date()),
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
    };
  });

  const [photoFile, setPhotoFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [autoGenerateId, setAutoGenerateId] = useState(!student);

  const { data: school } = useQuery({
    queryKey: ['school-settings'],
    queryFn: async () => {
      const schools = await base44.entities.School.list();
      return schools[0];
    },
  });

  const { data: existingStudents = [] } = useQuery({
    queryKey: ['students-count'],
    queryFn: () => base44.entities.Student.list(),
    enabled: autoGenerateId && !student,
  });

  const generateStudentId = () => {
    const prefix = school?.student_id_prefix || 'STU';
    const year = new Date().getFullYear();
    const count = existingStudents.length + 1;
    const padded = String(count).padStart(4, '0');
    return `${prefix}${year}${padded}`;
  };

  const handleGenerateId = () => {
    const newId = generateStudentId();
    handleChange('student_id_number', newId);
  };

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
    setErrorMsg('');

    if (!formData.first_name.trim() || !formData.last_name.trim()) {
      setErrorMsg('First name and last name are required.');
      return;
    }
    if (!formData.student_id_number.trim()) {
      setErrorMsg('Student ID is required. Please enter one or click "Generate".');
      return;
    }
    if (!formData.grade_level) {
      setErrorMsg('Please select a class arm.');
      return;
    }

    let finalFormData = { ...formData };
    setSubmitting(true);

    if (photoFile) {
      setUploading(true);
      try {
        const { file_url } = await base44.integrations.Core.UploadFile({ file: photoFile });
        finalFormData = { ...finalFormData, photo_url: file_url };
      } catch (error) {
        setErrorMsg('Failed to upload photo. Please try again or skip the photo.');
        setUploading(false);
        setSubmitting(false);
        return;
      }
      setUploading(false);
    }

    try {
      await onSubmit(finalFormData);
    } catch (error) {
      setErrorMsg(error?.message || 'Failed to save student. Please check all fields and try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {errorMsg && (
        <Alert className="bg-red-50 border-red-200">
          <AlertDescription className="text-red-800">{errorMsg}</AlertDescription>
        </Alert>
      )}
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
            <div className="flex gap-2 mt-1">
              <Input
                id="student_id_number"
                value={formData.student_id_number}
                onChange={(e) => { setAutoGenerateId(false); handleChange('student_id_number', e.target.value); }}
                placeholder="e.g., STU2024001"
                className="flex-1"
              />
              {!student && (
                <Button type="button" variant="outline" size="sm" onClick={handleGenerateId} title="Auto-generate ID">
                  <RefreshCw className="w-4 h-4" />
                </Button>
              )}
            </div>
            {!student && (
              <p className="text-xs text-gray-500 mt-1">Enter manually or click <RefreshCw className="inline w-3 h-3" /> to auto-generate</p>
            )}
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
            <Label htmlFor="class_arm">Class Arm *</Label>
            <ClassArmSelect
              value={formData.class_arm_id}
              onChange={(value, gradeLevel) => {
                handleChange('class_arm_id', value);
                handleChange('grade_level', gradeLevel);
              }}
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
        <Button type="submit" className="bg-blue-600 hover:bg-blue-700" disabled={uploading || submitting}>
          {uploading ? 'Uploading photo...' : submitting ? 'Saving...' : student ? 'Update Student' : 'Add Student'}
        </Button>
      </div>
    </form>
  );
}