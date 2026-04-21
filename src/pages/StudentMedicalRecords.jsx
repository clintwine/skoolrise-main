import React, { useMemo, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useSchoolContext } from '@/hooks/useSchoolContext';
import { addSchoolFilter, withSchoolId } from '@/utils/schoolFilter';
import { usePlanAccess } from '@/hooks/usePlanAccess';
import UpgradePrompt from '@/components/UpgradePrompt';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Search, Heart, Pencil } from 'lucide-react';

const BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];
const GENOTYPES = ['AA', 'AS', 'SS', 'AC', 'SC'];

export default function StudentMedicalRecords() {
  const { school_tenant_id, isReady } = useSchoolContext();
  const { hasAccess, planLabel, minimumPlanLabel, loading: planLoading } = usePlanAccess('studentMedicalRecords');
  const [search, setSearch] = useState('');
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({});
  const queryClient = useQueryClient();

  const { data: students = [] } = useQuery({
    queryKey: ['medical-students', school_tenant_id],
    queryFn: () => base44.entities.Student.filter(addSchoolFilter({}, school_tenant_id)),
    enabled: isReady,
  });

  const { data: records = [] } = useQuery({
    queryKey: ['medical-records', school_tenant_id],
    queryFn: () => base44.entities.MedicalRecord.filter(addSchoolFilter({}, school_tenant_id)),
    enabled: isReady,
  });

  const saveMutation = useMutation({
    mutationFn: async (data) => {
      const existing = records.find(r => r.student_id === selectedStudent.id);
      const payload = {
        ...data,
        student_id: selectedStudent.id,
        last_updated: new Date().toISOString(),
      };
      if (existing) {
        return base44.entities.MedicalRecord.update(existing.id, payload);
      }
      return base44.entities.MedicalRecord.create(withSchoolId(payload, school_tenant_id));
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['medical-records'] });
      setEditing(false);
    },
  });

  const rows = useMemo(() => {
    return students
      .filter((student) => {
        const fullName = `${student.first_name || ''} ${student.last_name || ''}`.toLowerCase();
        return fullName.includes(search.toLowerCase()) || (student.grade_level || '').toLowerCase().includes(search.toLowerCase());
      })
      .map((student) => {
        const record = records.find(r => r.student_id === student.id);
        return { student, record };
      });
  }, [students, records, search]);

  if (planLoading) return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600" />
    </div>
  );
  if (!hasAccess) return (
    <UpgradePrompt
      feature="Student Medical Records"
      currentPlan={planLabel}
      minimumPlan={minimumPlanLabel}
    />
  );

  const openStudent = (student) => {
    const record = records.find(r => r.student_id === student.id);
    setSelectedStudent(student);
    setForm(record || {
      blood_group: '', genotype: '', allergies: '', chronic_conditions: '', disabilities: '',
      current_medications: '', doctor_name: '', doctor_phone: '', emergency_contact_name: '',
      emergency_contact_phone: '', emergency_contact_relation: '', last_updated: '', notes: ''
    });
    setEditing(!record);
    setOpen(true);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Student Medical Records</h1>
        <p className="text-gray-600 mt-1">Manage student health and emergency information</p>
      </div>

      <Card>
        <CardContent className="p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search students by name or class" className="pl-10" />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Medical Records</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="px-6 py-3 text-left">Student</th>
                  <th className="px-6 py-3 text-left">Class</th>
                  <th className="px-6 py-3 text-left">Blood Group</th>
                  <th className="px-6 py-3 text-left">Genotype</th>
                  <th className="px-6 py-3 text-left">Allergies</th>
                  <th className="px-6 py-3 text-left">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {rows.map(({ student, record }) => (
                  <tr key={student.id} className="hover:bg-gray-50 cursor-pointer" onClick={() => openStudent(student)}>
                    <td className="px-6 py-4 font-medium">{student.first_name} {student.last_name}</td>
                    <td className="px-6 py-4">{student.grade_level || '—'}</td>
                    <td className="px-6 py-4">{record?.blood_group || '—'}</td>
                    <td className="px-6 py-4">{record?.genotype || '—'}</td>
                    <td className="px-6 py-4">{record?.allergies ? record.allergies.slice(0, 40) : '—'}</td>
                    <td className="px-6 py-4">
                      {record ? (
                        <Badge className="bg-green-100 text-green-800">Has record</Badge>
                      ) : (
                        <Badge className="bg-orange-100 text-orange-800">No record</Badge>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-3xl bg-white max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Heart className="w-5 h-5 text-red-500" />
              {selectedStudent ? `${selectedStudent.first_name} ${selectedStudent.last_name}` : 'Medical Record'}
            </DialogTitle>
          </DialogHeader>
          {selectedStudent && (
            <div className="space-y-4">
              <div className="flex justify-end">
                <Button variant="outline" onClick={() => setEditing(prev => !prev)}>
                  <Pencil className="w-4 h-4 mr-2" />
                  {editing ? 'Cancel Edit' : 'Edit'}
                </Button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div><Label>Blood Group</Label>{editing ? <select className="w-full border rounded-md h-9 px-3" value={form.blood_group || ''} onChange={(e) => setForm({ ...form, blood_group: e.target.value })}><option value="">Select</option>{BLOOD_GROUPS.map(v => <option key={v} value={v}>{v}</option>)}</select> : <p className="mt-2 text-sm">{form.blood_group || '—'}</p>}</div>
                <div><Label>Genotype</Label>{editing ? <select className="w-full border rounded-md h-9 px-3" value={form.genotype || ''} onChange={(e) => setForm({ ...form, genotype: e.target.value })}><option value="">Select</option>{GENOTYPES.map(v => <option key={v} value={v}>{v}</option>)}</select> : <p className="mt-2 text-sm">{form.genotype || '—'}</p>}</div>
                <div><Label>Allergies</Label>{editing ? <Input value={form.allergies || ''} onChange={(e) => setForm({ ...form, allergies: e.target.value })} /> : <p className="mt-2 text-sm">{form.allergies || '—'}</p>}</div>
                <div><Label>Chronic Conditions</Label>{editing ? <Input value={form.chronic_conditions || ''} onChange={(e) => setForm({ ...form, chronic_conditions: e.target.value })} /> : <p className="mt-2 text-sm">{form.chronic_conditions || '—'}</p>}</div>
                <div><Label>Disabilities</Label>{editing ? <Input value={form.disabilities || ''} onChange={(e) => setForm({ ...form, disabilities: e.target.value })} /> : <p className="mt-2 text-sm">{form.disabilities || '—'}</p>}</div>
                <div><Label>Current Medications</Label>{editing ? <Input value={form.current_medications || ''} onChange={(e) => setForm({ ...form, current_medications: e.target.value })} /> : <p className="mt-2 text-sm">{form.current_medications || '—'}</p>}</div>
                <div><Label>Doctor Name</Label>{editing ? <Input value={form.doctor_name || ''} onChange={(e) => setForm({ ...form, doctor_name: e.target.value })} /> : <p className="mt-2 text-sm">{form.doctor_name || '—'}</p>}</div>
                <div><Label>Doctor Phone</Label>{editing ? <Input value={form.doctor_phone || ''} onChange={(e) => setForm({ ...form, doctor_phone: e.target.value })} /> : <p className="mt-2 text-sm">{form.doctor_phone || '—'}</p>}</div>
                <div><Label>Emergency Contact Name</Label>{editing ? <Input value={form.emergency_contact_name || ''} onChange={(e) => setForm({ ...form, emergency_contact_name: e.target.value })} /> : <p className="mt-2 text-sm">{form.emergency_contact_name || '—'}</p>}</div>
                <div><Label>Emergency Contact Phone</Label>{editing ? <Input value={form.emergency_contact_phone || ''} onChange={(e) => setForm({ ...form, emergency_contact_phone: e.target.value })} /> : <p className="mt-2 text-sm">{form.emergency_contact_phone || '—'}</p>}</div>
                <div><Label>Emergency Contact Relation</Label>{editing ? <Input value={form.emergency_contact_relation || ''} onChange={(e) => setForm({ ...form, emergency_contact_relation: e.target.value })} /> : <p className="mt-2 text-sm">{form.emergency_contact_relation || '—'}</p>}</div>
                <div><Label>Last Updated</Label><p className="mt-2 text-sm">{form.last_updated ? new Date(form.last_updated).toLocaleString() : '—'}</p></div>
              </div>

              <div>
                <Label>Notes</Label>
                {editing ? <Textarea value={form.notes || ''} onChange={(e) => setForm({ ...form, notes: e.target.value })} rows={4} /> : <p className="mt-2 text-sm whitespace-pre-wrap">{form.notes || '—'}</p>}
              </div>

              {editing && (
                <div className="flex justify-end gap-3">
                  <Button variant="outline" onClick={() => setEditing(false)}>Cancel</Button>
                  <Button onClick={() => saveMutation.mutate(form)} className="bg-blue-600 hover:bg-blue-700">Save Record</Button>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}