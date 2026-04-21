import React, { useEffect, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { addSchoolFilter } from '@/utils/schoolFilter';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

export default function StudentMedicalTab({ student, school_tenant_id, isAdmin = false }) {
  const queryClient = useQueryClient();
  const [editing, setEditing] = React.useState(false);
  const { data: records = [] } = useQuery({
    queryKey: ['student-medical-record', student?.id, school_tenant_id],
    queryFn: () => base44.entities.MedicalRecord.filter(addSchoolFilter({ student_id: student.id }, school_tenant_id)),
    enabled: !!student?.id && !!school_tenant_id,
  });

  const record = records[0];
  const [form, setForm] = React.useState(record || {});
  React.useEffect(() => { setForm(record || {}); }, [record?.id]);

  const saveMutation = useMutation({
    mutationFn: () => record
      ? base44.entities.MedicalRecord.update(record.id, { ...form, last_updated: new Date().toISOString() })
      : base44.entities.MedicalRecord.create({ ...form, student_id: student.id, school_tenant_id, last_updated: new Date().toISOString() }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['student-medical-record'] });
      setEditing(false);
    },
  });

  const Field = ({ label, value }) => (
    <div>
      <Label>{label}</Label>
      <p className="mt-2 text-sm">{value || '—'}</p>
    </div>
  );

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Medical</CardTitle>
        {isAdmin && <Button variant="outline" onClick={() => setEditing(prev => !prev)}>{editing ? 'Cancel' : 'Edit'}</Button>}
      </CardHeader>
      <CardContent className="space-y-4">
        {editing ? (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div><Label>Blood Group</Label><Input value={form.blood_group || ''} onChange={(e) => setForm({ ...form, blood_group: e.target.value })} /></div>
              <div><Label>Genotype</Label><Input value={form.genotype || ''} onChange={(e) => setForm({ ...form, genotype: e.target.value })} /></div>
              <div><Label>Allergies</Label><Input value={form.allergies || ''} onChange={(e) => setForm({ ...form, allergies: e.target.value })} /></div>
              <div><Label>Chronic Conditions</Label><Input value={form.chronic_conditions || ''} onChange={(e) => setForm({ ...form, chronic_conditions: e.target.value })} /></div>
              <div><Label>Disabilities</Label><Input value={form.disabilities || ''} onChange={(e) => setForm({ ...form, disabilities: e.target.value })} /></div>
              <div><Label>Current Medications</Label><Input value={form.current_medications || ''} onChange={(e) => setForm({ ...form, current_medications: e.target.value })} /></div>
              <div><Label>Doctor Name</Label><Input value={form.doctor_name || ''} onChange={(e) => setForm({ ...form, doctor_name: e.target.value })} /></div>
              <div><Label>Doctor Phone</Label><Input value={form.doctor_phone || ''} onChange={(e) => setForm({ ...form, doctor_phone: e.target.value })} /></div>
              <div><Label>Emergency Contact Name</Label><Input value={form.emergency_contact_name || ''} onChange={(e) => setForm({ ...form, emergency_contact_name: e.target.value })} /></div>
              <div><Label>Emergency Contact Phone</Label><Input value={form.emergency_contact_phone || ''} onChange={(e) => setForm({ ...form, emergency_contact_phone: e.target.value })} /></div>
              <div><Label>Emergency Contact Relation</Label><Input value={form.emergency_contact_relation || ''} onChange={(e) => setForm({ ...form, emergency_contact_relation: e.target.value })} /></div>
            </div>
            <div><Label>Notes</Label><Textarea value={form.notes || ''} onChange={(e) => setForm({ ...form, notes: e.target.value })} rows={4} /></div>
            <div className="flex justify-end"><Button onClick={() => saveMutation.mutate()} className="bg-blue-600 hover:bg-blue-700">Save</Button></div>
          </>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Field label="Blood Group" value={record?.blood_group} />
            <Field label="Genotype" value={record?.genotype} />
            <Field label="Allergies" value={record?.allergies} />
            <Field label="Chronic Conditions" value={record?.chronic_conditions} />
            <Field label="Disabilities" value={record?.disabilities} />
            <Field label="Current Medications" value={record?.current_medications} />
            <Field label="Doctor Name" value={record?.doctor_name} />
            <Field label="Doctor Phone" value={record?.doctor_phone} />
            <Field label="Emergency Contact Name" value={record?.emergency_contact_name} />
            <Field label="Emergency Contact Phone" value={record?.emergency_contact_phone} />
            <Field label="Emergency Contact Relation" value={record?.emergency_contact_relation} />
            <Field label="Last Updated" value={record?.last_updated ? new Date(record.last_updated).toLocaleString() : ''} />
            <div className="md:col-span-2"><Field label="Notes" value={record?.notes} /></div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}