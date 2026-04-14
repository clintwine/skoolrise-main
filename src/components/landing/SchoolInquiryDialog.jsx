import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { CheckCircle2, Loader2, School } from 'lucide-react';
import { toast } from 'sonner';

const initialForm = {
  contact_name: '',
  email: '',
  phone: '',
  school_name: '',
  school_type: '',
  student_count_range: '',
  role: '',
  primary_goal: '',
  current_tools: '',
  go_live_timeline: '',
  notes: '',
};

export default function SchoolInquiryDialog({ open, onOpenChange }) {
  const [form, setForm] = useState(initialForm);
  const [submitted, setSubmitted] = useState(false);
  const [saving, setSaving] = useState(false);

  const updateField = (key, value) => setForm(prev => ({ ...prev, [key]: value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    await base44.entities.SchoolInquiry.create(form);
    setSubmitted(true);
    setSaving(false);
    toast.success('Thanks — we will reach out shortly.');
  };

  const handleClose = (nextOpen) => {
    onOpenChange(nextOpen);
    if (!nextOpen) {
      setTimeout(() => {
        setSubmitted(false);
        setSaving(false);
        setForm(initialForm);
      }, 200);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="bg-white max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl">
        {submitted ? (
          <div className="py-10 text-center space-y-4">
            <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-8 h-8 text-green-600" />
            </div>
            <div>
              <h3 className="text-2xl font-bold text-gray-900">Inquiry received</h3>
              <p className="text-gray-600 mt-2">We’ll review your school details and contact you with the best next step.</p>
            </div>
            <Button onClick={() => handleClose(false)} className="bg-black hover:bg-gray-800 text-white">Done</Button>
          </div>
        ) : (
          <>
            <DialogHeader>
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-orange-100 to-purple-100 flex items-center justify-center mb-3">
                <School className="w-6 h-6 text-purple-600" />
              </div>
              <DialogTitle className="text-2xl">Start your school setup</DialogTitle>
              <DialogDescription>
                Tell us a bit about your school so we can tailor the right onboarding path for you.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Your Name</Label>
                  <Input value={form.contact_name} onChange={(e) => updateField('contact_name', e.target.value)} required />
                </div>
                <div className="space-y-2">
                  <Label>School Name</Label>
                  <Input value={form.school_name} onChange={(e) => updateField('school_name', e.target.value)} required />
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Email</Label>
                  <Input type="email" value={form.email} onChange={(e) => updateField('email', e.target.value)} required />
                </div>
                <div className="space-y-2">
                  <Label>Phone</Label>
                  <Input value={form.phone} onChange={(e) => updateField('phone', e.target.value)} required />
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Your Role</Label>
                  <Select value={form.role} onValueChange={(value) => updateField('role', value)}>
                    <SelectTrigger><SelectValue placeholder="Select role" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Owner">Owner</SelectItem>
                      <SelectItem value="Administrator">Administrator</SelectItem>
                      <SelectItem value="Principal">Principal</SelectItem>
                      <SelectItem value="Head Teacher">Head Teacher</SelectItem>
                      <SelectItem value="Bursar">Bursar</SelectItem>
                      <SelectItem value="ICT Lead">ICT Lead</SelectItem>
                      <SelectItem value="Other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>School Type</Label>
                  <Select value={form.school_type} onValueChange={(value) => updateField('school_type', value)}>
                    <SelectTrigger><SelectValue placeholder="Select type" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Primary">Primary</SelectItem>
                      <SelectItem value="Secondary">Secondary</SelectItem>
                      <SelectItem value="Mixed">Mixed</SelectItem>
                      <SelectItem value="Nursery">Nursery</SelectItem>
                      <SelectItem value="College">College</SelectItem>
                      <SelectItem value="Other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Number of Students</Label>
                  <Select value={form.student_count_range} onValueChange={(value) => updateField('student_count_range', value)}>
                    <SelectTrigger><SelectValue placeholder="Select size" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1-100">1-100</SelectItem>
                      <SelectItem value="101-300">101-300</SelectItem>
                      <SelectItem value="301-700">301-700</SelectItem>
                      <SelectItem value="701-1500">701-1500</SelectItem>
                      <SelectItem value="1500+">1500+</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Go-live Timeline</Label>
                  <Select value={form.go_live_timeline} onValueChange={(value) => updateField('go_live_timeline', value)}>
                    <SelectTrigger><SelectValue placeholder="Select timeline" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Immediately">Immediately</SelectItem>
                      <SelectItem value="Within 30 days">Within 30 days</SelectItem>
                      <SelectItem value="1-3 months">1-3 months</SelectItem>
                      <SelectItem value="Just exploring">Just exploring</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Main Goal</Label>
                <Select value={form.primary_goal} onValueChange={(value) => updateField('primary_goal', value)}>
                  <SelectTrigger><SelectValue placeholder="What are you trying to improve?" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Improve fee collection">Improve fee collection</SelectItem>
                    <SelectItem value="Automate report cards">Automate report cards</SelectItem>
                    <SelectItem value="Manage assignments and exams">Manage assignments and exams</SelectItem>
                    <SelectItem value="Parent communication">Parent communication</SelectItem>
                    <SelectItem value="Attendance and behavior tracking">Attendance and behavior tracking</SelectItem>
                    <SelectItem value="Full school digitization">Full school digitization</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Current Tools</Label>
                <Input value={form.current_tools} onChange={(e) => updateField('current_tools', e.target.value)} placeholder="Excel, paper records, another platform..." />
              </div>

              <div className="space-y-2">
                <Label>Anything else we should know?</Label>
                <Textarea value={form.notes} onChange={(e) => updateField('notes', e.target.value)} rows={4} placeholder="Tell us about your branch setup, reporting needs, fee workflows, or any priorities." />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <Button type="button" variant="outline" onClick={() => handleClose(false)}>Cancel</Button>
                <Button type="submit" disabled={saving} className="bg-black hover:bg-gray-800 text-white">
                  {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                  Submit Inquiry
                </Button>
              </div>
            </form>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}