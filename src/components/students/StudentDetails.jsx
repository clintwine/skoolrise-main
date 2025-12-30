import React from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  UserCircle,
  Mail,
  Phone,
  MapPin,
  Calendar,
  Users,
  AlertCircle,
  FileText,
  Edit,
} from 'lucide-react';
import { format } from 'date-fns';

export default function StudentDetails({ student, onEdit, onClose }) {
  const statusColors = {
    Active: 'bg-green-100 text-green-800',
    Inactive: 'bg-gray-100 text-gray-800',
    Suspended: 'bg-red-100 text-red-800',
    Graduated: 'bg-blue-100 text-blue-800',
    Withdrawn: 'bg-orange-100 text-orange-800',
  };

  const InfoRow = ({ icon: Icon, label, value }) => {
    if (!value) return null;
    return (
      <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
        <Icon className="w-5 h-5 text-gray-600 mt-0.5" />
        <div className="flex-1">
          <p className="text-sm font-medium text-gray-600">{label}</p>
          <p className="text-gray-900">{value}</p>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start gap-4">
        {student.photo_url ? (
          <img
            src={student.photo_url}
            alt={`${student.first_name} ${student.last_name}`}
            className="w-20 h-20 rounded-full object-cover"
          />
        ) : (
          <div className="w-20 h-20 rounded-full bg-blue-100 flex items-center justify-center">
            <UserCircle className="w-12 h-12 text-blue-600" />
          </div>
        )}
        <div className="flex-1">
          <div className="flex items-start justify-between">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">
                {student.first_name} {student.last_name}
              </h2>
              <p className="text-gray-600">Student ID: {student.student_id_number || student.student_id}</p>
              <div className="flex items-center gap-2 mt-2">
                <Badge className={statusColors[student.status]}>
                  {student.status}
                </Badge>
                <Badge variant="outline">Grade {student.grade_level}</Badge>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Personal Information */}
      <div className="space-y-3">
        <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
          <UserCircle className="w-5 h-5" />
          Personal Information
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <InfoRow
            icon={Calendar}
            label="Date of Birth"
            value={student.date_of_birth ? format(new Date(student.date_of_birth), 'PPP') : null}
          />
          <InfoRow icon={Users} label="Gender" value={student.gender} />
          <InfoRow
            icon={Calendar}
            label="Admission Date"
            value={student.admission_date ? format(new Date(student.admission_date), 'PPP') : null}
          />
        </div>
      </div>

      {/* Contact Information */}
      <div className="space-y-3">
        <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
          <Mail className="w-5 h-5" />
          Contact Information
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <InfoRow icon={Mail} label="Email" value={student.email} />
          <InfoRow icon={Phone} label="Phone" value={student.phone} />
          <div className="sm:col-span-2">
            <InfoRow icon={MapPin} label="Address" value={student.address} />
          </div>
        </div>
      </div>

      {/* Parent/Guardian Information */}
      {(student.parent_name || student.parent_email || student.parent_phone) && (
        <div className="space-y-3">
          <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <Users className="w-5 h-5" />
            Parent/Guardian Information
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <InfoRow icon={UserCircle} label="Name" value={student.parent_name} />
            <InfoRow icon={Mail} label="Email" value={student.parent_email} />
            <InfoRow icon={Phone} label="Phone" value={student.parent_phone} />
          </div>
        </div>
      )}

      {/* Additional Information */}
      {(student.medical_conditions || student.send_status || student.notes) && (
        <div className="space-y-3">
          <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <AlertCircle className="w-5 h-5" />
            Additional Information
          </h3>
          <div className="space-y-3">
            {student.medical_conditions && (
              <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-sm font-medium text-red-900 mb-1">Medical Conditions</p>
                <p className="text-red-800">{student.medical_conditions}</p>
              </div>
            )}
            {student.send_status && (
              <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-sm font-medium text-blue-900 mb-1">SEND Status</p>
                <p className="text-blue-800">{student.send_status}</p>
              </div>
            )}
            {student.notes && (
              <InfoRow icon={FileText} label="Notes" value={student.notes} />
            )}
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="flex justify-end gap-3 pt-4 border-t">
        <Button variant="outline" onClick={onClose}>
          Close
        </Button>
        <Button onClick={onEdit} className="bg-blue-600 hover:bg-blue-700">
          <Edit className="w-4 h-4 mr-2" />
          Edit Student
        </Button>
      </div>
    </div>
  );
}