import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { CheckCircle, Upload } from 'lucide-react';

export default function PublicApplicationForm() {
  const [submitted, setSubmitted] = useState(false);
  const [applicationNumber, setApplicationNumber] = useState('');
  const [formData, setFormData] = useState({
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
    notes: '',
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const appNumber = `APP${Date.now()}`;
      await base44.entities.Application.create({
        ...formData,
        application_number: appNumber,
      });
      
      // Send confirmation email
      await base44.integrations.Core.SendEmail({
        to: formData.parent_email,
        subject: `Application Received - ${appNumber}`,
        body: `Dear ${formData.parent_name},\n\nThank you for submitting an application for ${formData.first_name} ${formData.last_name}.\n\nYour application number is: ${appNumber}\n\nWe will review your application and contact you soon.\n\nBest regards,\nAdmissions Office`,
      });

      setApplicationNumber(appNumber);
      setSubmitted(true);
    } catch (error) {
      alert('Error submitting application: ' + error.message);
    }
  };

  if (submitted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 flex items-center justify-center p-6">
        <Card className="max-w-md w-full bg-white shadow-xl">
          <CardContent className="p-8 text-center">
            <CheckCircle className="w-16 h-16 text-green-600 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Application Submitted!</h2>
            <p className="text-gray-600 mb-4">
              Thank you for your application. Your application number is:
            </p>
            <div className="bg-blue-50 p-4 rounded-lg mb-4">
              <p className="text-2xl font-bold text-blue-600">{applicationNumber}</p>
            </div>
            <p className="text-sm text-gray-500">
              A confirmation email has been sent to {formData.parent_email}. 
              We will contact you soon regarding the next steps.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 p-6">
      <div className="max-w-4xl mx-auto">
        <Card className="bg-white shadow-xl">
          <CardHeader className="border-b bg-gradient-to-r from-blue-600 to-indigo-600 text-white">
            <CardTitle className="text-3xl">School Admission Application</CardTitle>
            <p className="text-blue-100 mt-2">Please fill out all required fields to complete your application</p>
          </CardHeader>
          <CardContent className="p-8">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Student Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                  <div className="md:col-span-2">
                    <Label>Address</Label>
                    <Input value={formData.address} onChange={(e) => setFormData({...formData, address: e.target.value})} />
                  </div>
                </div>
              </div>

              <div className="border-t pt-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Parent/Guardian Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label>Parent/Guardian Name *</Label>
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

              <div className="border-t pt-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Academic Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label>Grade Applying For *</Label>
                    <Select value={formData.grade_applying_for} onValueChange={(value) => setFormData({...formData, grade_applying_for: value})} required>
                      <SelectTrigger>
                        <SelectValue placeholder="Select grade" />
                      </SelectTrigger>
                      <SelectContent>
                        {[1,2,3,4,5,6,7,8,9,10,11,12].map(grade => (
                          <SelectItem key={grade} value={grade.toString()}>Grade {grade}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Admission Year</Label>
                    <Input value={formData.admission_year} onChange={(e) => setFormData({...formData, admission_year: e.target.value})} />
                  </div>
                  <div className="md:col-span-2">
                    <Label>Previous School</Label>
                    <Input value={formData.previous_school} onChange={(e) => setFormData({...formData, previous_school: e.target.value})} />
                  </div>
                </div>
              </div>

              <div className="border-t pt-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Additional Information</h3>
                <div>
                  <Label>Additional Notes</Label>
                  <Textarea value={formData.notes} onChange={(e) => setFormData({...formData, notes: e.target.value})} rows={4} placeholder="Any additional information you'd like us to know..." />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-6 border-t">
                <Button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white px-8">
                  Submit Application
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}