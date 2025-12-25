import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Plus, FileText, Link as LinkIcon, Upload, Download, Trash2 } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export default function ClassroomResources() {
  const [isResourceFormOpen, setIsResourceFormOpen] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [resourceData, setResourceData] = useState({
    title: '',
    description: '',
    resource_type: 'Document',
    resource_url: '',
    subject: '',
    grade_level: ''
  });
  const queryClient = useQueryClient();

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploading(true);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      setResourceData({ ...resourceData, resource_url: file_url });
      alert('File uploaded successfully!');
    } catch (error) {
      alert('Error uploading file: ' + error.message);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Classroom Resources</h1>
          <p className="text-gray-600 mt-1">Manage teaching materials and resources</p>
        </div>
        <Button onClick={() => setIsResourceFormOpen(true)} className="bg-blue-600 hover:bg-blue-700">
          <Plus className="w-4 h-4 mr-2" />
          Add Resource
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Your Resources</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-500 text-center py-8">Resource management feature - upload and organize teaching materials</p>
        </CardContent>
      </Card>

      <Dialog open={isResourceFormOpen} onOpenChange={setIsResourceFormOpen}>
        <DialogContent className="bg-white max-w-2xl">
          <DialogHeader>
            <CardTitle>Add New Resource</CardTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Title *</Label>
              <Input
                value={resourceData.title}
                onChange={(e) => setResourceData({ ...resourceData, title: e.target.value })}
                placeholder="Resource title"
              />
            </div>
            <div>
              <Label>Description</Label>
              <Textarea
                value={resourceData.description}
                onChange={(e) => setResourceData({ ...resourceData, description: e.target.value })}
                rows={3}
                placeholder="Brief description"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Type</Label>
                <Select value={resourceData.resource_type} onValueChange={(value) => setResourceData({ ...resourceData, resource_type: value })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Document">Document</SelectItem>
                    <SelectItem value="Presentation">Presentation</SelectItem>
                    <SelectItem value="Video">Video</SelectItem>
                    <SelectItem value="Link">External Link</SelectItem>
                    <SelectItem value="Worksheet">Worksheet</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Subject</Label>
                <Input
                  value={resourceData.subject}
                  onChange={(e) => setResourceData({ ...resourceData, subject: e.target.value })}
                  placeholder="e.g., Mathematics"
                />
              </div>
            </div>
            <div>
              <Label>Upload File or Link</Label>
              <div className="space-y-2">
                <input
                  type="file"
                  onChange={handleFileUpload}
                  className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                />
                <p className="text-xs text-gray-500">Or enter a URL:</p>
                <Input
                  value={resourceData.resource_url}
                  onChange={(e) => setResourceData({ ...resourceData, resource_url: e.target.value })}
                  placeholder="https://..."
                />
              </div>
            </div>
            <div className="flex justify-end gap-3 pt-4 border-t">
              <Button variant="outline" onClick={() => setIsResourceFormOpen(false)}>Cancel</Button>
              <Button className="bg-blue-600 hover:bg-blue-700">Save Resource</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}