import React from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { addSchoolFilter } from '@/utils/schoolFilter';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';

export default function ParentMedicalInfoSection({ studentId, school_tenant_id }) {
  const { data: records = [] } = useQuery({
    queryKey: ['parent-medical-record', studentId, school_tenant_id],
    queryFn: () => base44.entities.MedicalRecord.filter(addSchoolFilter({ student_id: studentId }, school_tenant_id)),
    enabled: !!studentId && !!school_tenant_id,
  });

  const record = records[0];
  const Field = ({ label, value }) => (
    <div>
      <Label>{label}</Label>
      <p className="mt-1 text-sm text-gray-700">{value || '—'}</p>
    </div>
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle>Medical info</CardTitle>
      </CardHeader>
      <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Field label="Blood Group" value={record?.blood_group} />
        <Field label="Genotype" value={record?.genotype} />
        <Field label="Allergies" value={record?.allergies} />
        <Field label="Emergency Contact Name" value={record?.emergency_contact_name} />
        <Field label="Emergency Contact Phone" value={record?.emergency_contact_phone} />
        <Field label="Emergency Contact Relation" value={record?.emergency_contact_relation} />
      </CardContent>
    </Card>
  );
}