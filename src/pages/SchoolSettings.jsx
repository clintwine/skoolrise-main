import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Building2, Upload, Save } from 'lucide-react';

export default function SchoolSettings() {
  const queryClient = useQueryClient();
  const [uploading, setUploading] = useState(false);

  const { data: schools = [] } = useQuery({
    queryKey: ['schools'],
    queryFn: () => base44.entities.School.list(),
  });

  const school = schools[0];

  const [formData, setFormData] = useState(school || {
    school_name: '',
    school_code: '',
    logo_url: '',
    address: '',
    phone: '',
    email: '',
    website: '',
    motto: '',
    principal_name: '',
    principal_signature_url: '',
    report_card_header: '',
    report_card_footer: '',
    student_id_pattern: 'STU-{YEAR}-{SEQ}',
    teacher_id_pattern: 'TCH-{YEAR}-{SEQ}',
    parent_id_pattern: 'PAR-{YEAR}-{SEQ}',
    staff_id_pattern: 'STF-{YEAR}-{SEQ}',
    vendor_id_pattern: 'VND-{YEAR}-{SEQ}',
  });

  React.useEffect(() => {
    if (school) setFormData(school);
  }, [school]);

  const saveMutation = useMutation({
    mutationFn: async (data) => {
      if (school) {
        return base44.entities.School.update(school.id, data);
      } else {
        return base44.entities.School.create(data);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['schools'] });
      alert('School settings saved successfully!');
    },
  });

  const handleFileUpload = async (e, field) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploading(true);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      setFormData({ ...formData, [field]: file_url });
    } catch (error) {
      alert('File upload failed');
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    saveMutation.mutate(formData);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">School Settings</h1>
        <p className="text-gray-600 mt-1">Configure school branding and information</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card className="bg-white shadow-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="w-5 h-5" />
              Basic Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label>School Name *</Label>
                <Input
                  value={formData.school_name}
                  onChange={(e) => setFormData({ ...formData, school_name: e.target.value })}
                  required
                />
              </div>
              <div>
                <Label>School Code</Label>
                <Input
                  value={formData.school_code}
                  onChange={(e) => setFormData({ ...formData, school_code: e.target.value })}
                />
              </div>
              <div>
                <Label>Email</Label>
                <Input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                />
              </div>
              <div>
                <Label>Phone</Label>
                <Input
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                />
              </div>
              <div>
                <Label>Website</Label>
                <Input
                  value={formData.website}
                  onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                />
              </div>
              <div>
                <Label>Motto</Label>
                <Input
                  value={formData.motto}
                  onChange={(e) => setFormData({ ...formData, motto: e.target.value })}
                />
              </div>
            </div>
            <div>
              <Label>Address</Label>
              <Textarea
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                rows={3}
              />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white shadow-md">
          <CardHeader>
            <CardTitle>Branding Assets</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>School Logo</Label>
              <div className="flex items-center gap-4 mt-2">
                {formData.logo_url && (
                  <img src={formData.logo_url} alt="Logo" className="w-20 h-20 object-contain border rounded" />
                )}
                <Button type="button" variant="outline" onClick={() => document.getElementById('logo-upload').click()} disabled={uploading}>
                  <Upload className="w-4 h-4 mr-2" />
                  {uploading ? 'Uploading...' : 'Upload Logo'}
                </Button>
                <input
                  id="logo-upload"
                  type="file"
                  accept="image/*"
                  onChange={(e) => handleFileUpload(e, 'logo_url')}
                  className="hidden"
                />
              </div>
            </div>
            <div>
              <Label>Principal's Signature</Label>
              <div className="flex items-center gap-4 mt-2">
                {formData.principal_signature_url && (
                  <img src={formData.principal_signature_url} alt="Signature" className="w-32 h-16 object-contain border rounded" />
                )}
                <Button type="button" variant="outline" onClick={() => document.getElementById('signature-upload').click()} disabled={uploading}>
                  <Upload className="w-4 h-4 mr-2" />
                  {uploading ? 'Uploading...' : 'Upload Signature'}
                </Button>
                <input
                  id="signature-upload"
                  type="file"
                  accept="image/*"
                  onChange={(e) => handleFileUpload(e, 'principal_signature_url')}
                  className="hidden"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white shadow-md">
          <CardHeader>
            <CardTitle>Principal Information</CardTitle>
          </CardHeader>
          <CardContent>
            <div>
              <Label>Principal's Name</Label>
              <Input
                value={formData.principal_name}
                onChange={(e) => setFormData({ ...formData, principal_name: e.target.value })}
              />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white shadow-md">
          <CardHeader>
            <CardTitle>Report Card Customization</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>Report Card Header</Label>
              <Textarea
                value={formData.report_card_header}
                onChange={(e) => setFormData({ ...formData, report_card_header: e.target.value })}
                rows={2}
                placeholder="Custom header text for report cards"
              />
            </div>
            <div>
              <Label>Report Card Footer</Label>
              <Textarea
                value={formData.report_card_footer}
                onChange={(e) => setFormData({ ...formData, report_card_footer: e.target.value })}
                rows={2}
                placeholder="Custom footer text for report cards"
              />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white shadow-md">
          <CardHeader>
            <CardTitle>ID Number Patterns</CardTitle>
            <p className="text-sm text-gray-600 mt-1">
              Configure the pattern for auto-generated IDs. Use {'{YEAR}'} for year and {'{SEQ}'} for sequence number.
            </p>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label>Student ID Pattern</Label>
                <Input
                  value={formData.student_id_pattern || 'STU-{YEAR}-{SEQ}'}
                  onChange={(e) => setFormData({ ...formData, student_id_pattern: e.target.value })}
                  placeholder="STU-{YEAR}-{SEQ}"
                />
                <p className="text-xs text-gray-500 mt-1">Example: STU-2025-001</p>
              </div>
              <div>
                <Label>Teacher ID Pattern</Label>
                <Input
                  value={formData.teacher_id_pattern || 'TCH-{YEAR}-{SEQ}'}
                  onChange={(e) => setFormData({ ...formData, teacher_id_pattern: e.target.value })}
                  placeholder="TCH-{YEAR}-{SEQ}"
                />
                <p className="text-xs text-gray-500 mt-1">Example: TCH-2025-001</p>
              </div>
              <div>
                <Label>Parent ID Pattern</Label>
                <Input
                  value={formData.parent_id_pattern || 'PAR-{YEAR}-{SEQ}'}
                  onChange={(e) => setFormData({ ...formData, parent_id_pattern: e.target.value })}
                  placeholder="PAR-{YEAR}-{SEQ}"
                />
                <p className="text-xs text-gray-500 mt-1">Example: PAR-2025-001</p>
              </div>
              <div>
                <Label>Staff ID Pattern</Label>
                <Input
                  value={formData.staff_id_pattern || 'STF-{YEAR}-{SEQ}'}
                  onChange={(e) => setFormData({ ...formData, staff_id_pattern: e.target.value })}
                  placeholder="STF-{YEAR}-{SEQ}"
                />
                <p className="text-xs text-gray-500 mt-1">Example: STF-2025-001</p>
              </div>
              <div>
                <Label>Vendor ID Pattern</Label>
                <Input
                  value={formData.vendor_id_pattern || 'VND-{YEAR}-{SEQ}'}
                  onChange={(e) => setFormData({ ...formData, vendor_id_pattern: e.target.value })}
                  placeholder="VND-{YEAR}-{SEQ}"
                />
                <p className="text-xs text-gray-500 mt-1">Example: VND-2025-001</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end">
          <Button type="submit" className="bg-blue-600 hover:bg-blue-700" disabled={saveMutation.isPending}>
            <Save className="w-4 h-4 mr-2" />
            {saveMutation.isPending ? 'Saving...' : 'Save Settings'}
          </Button>
        </div>
      </form>
    </div>
  );
}