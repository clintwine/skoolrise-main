import React, { useMemo, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import ResourceFilters from '../components/resources/ResourceFilters';
import ResourceVersionBadge from '../components/resources/ResourceVersionBadge';
import { Plus, FileText, Link as LinkIcon, Download, Trash2, Share2, Users, GraduationCap, ExternalLink } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from 'sonner';

export default function ClassroomResources() {
  const [isResourceFormOpen, setIsResourceFormOpen] = useState(false);
  const [isShareDialogOpen, setIsShareDialogOpen] = useState(false);
  const [selectedResource, setSelectedResource] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [resourceData, setResourceData] = useState({
    title: '',
    description: '',
    resource_type: 'Document',
    resource_url: '',
    subject: '',
    grade_level: ''
  });
  const queryClient = useQueryClient();

  const { data: user } = useQuery({
    queryKey: ['current-user'],
    queryFn: () => base44.auth.me(),
  });

  const { data: teachers = [] } = useQuery({
    queryKey: ['teachers', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      return await base44.entities.Teacher.filter({ user_id: user.id });
    },
    enabled: !!user?.id,
  });

  const teacherProfile = teachers[0];

  const { data: allocations = [] } = useQuery({
    queryKey: ['teacher-allocations', teacherProfile?.id],
    queryFn: async () => {
      if (!teacherProfile?.id) return [];
      return await base44.entities.SubjectAllocation.filter({ teacher_id: teacherProfile.id });
    },
    enabled: !!teacherProfile?.id,
  });

  const { data: classes = [] } = useQuery({
    queryKey: ['teacher-classes', allocations],
    queryFn: async () => {
      if (allocations.length === 0) return [];
      const classArmIds = [...new Set(allocations.map(a => a.class_arm_id))];
      const allClassArms = await base44.entities.ClassArm.list();
      return allClassArms.filter(ca => classArmIds.includes(ca.id));
    },
    enabled: allocations.length > 0,
  });

  const { data: resources = [] } = useQuery({
    queryKey: ['teacher-resources', teacherProfile?.id],
    queryFn: async () => {
      if (!teacherProfile?.id) return [];
      // Get resources created by this teacher OR shared with teachers
      const allResources = await base44.entities.TeacherResource.list();
      return allResources.filter(r => 
        r.teacher_id === teacherProfile.id || r.shared_with_teachers === true
      );
    },
    enabled: !!teacherProfile?.id,
  });

  const myResources = resources.filter(r => r.teacher_id === teacherProfile?.id);
  const sharedWithMe = resources.filter(r => r.teacher_id !== teacherProfile?.id && r.shared_with_teachers);

  const createResourceMutation = useMutation({
    mutationFn: (data) => base44.entities.TeacherResource.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries(['teacher-resources']);
      toast.success('Resource saved successfully');
      setIsResourceFormOpen(false);
      setResourceData({
        title: '',
        description: '',
        resource_type: 'Document',
        resource_url: '',
        subject: '',
        grade_level: ''
      });
    },
    onError: (error) => {
      toast.error('Failed to save resource: ' + error.message);
    }
  });

  const updateResourceMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.TeacherResource.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['teacher-resources']);
      toast.success('Resource updated');
      setIsShareDialogOpen(false);
      setSelectedResource(null);
    }
  });

  const deleteResourceMutation = useMutation({
    mutationFn: (id) => base44.entities.TeacherResource.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries(['teacher-resources']);
      toast.success('Resource deleted');
    }
  });

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploading(true);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      setResourceData({ ...resourceData, resource_url: file_url });
      toast.success('File uploaded successfully!');
    } catch (error) {
      toast.error('Error uploading file: ' + error.message);
    } finally {
      setUploading(false);
    }
  };

  const handleSaveResource = () => {
    if (!resourceData.title || !resourceData.resource_url) {
      toast.error('Please provide a title and upload a file or enter a URL');
      return;
    }

    createResourceMutation.mutate({
      ...resourceData,
      teacher_id: teacherProfile?.id || '',
      shared_with_teachers: false,
      shared_with_students: false,
      shared_class_ids: '',
      version_number: 1,
    });
  };

  const handleOpenShareDialog = (resource) => {
    setSelectedResource(resource);
    setIsShareDialogOpen(true);
  };

  const handleShare = (shareType) => {
    if (!selectedResource) return;

    const updates = {};
    if (shareType === 'teachers') {
      updates.shared_with_teachers = !selectedResource.shared_with_teachers;
    } else if (shareType === 'students') {
      updates.shared_with_students = !selectedResource.shared_with_students;
    }

    updateResourceMutation.mutate({ id: selectedResource.id, data: updates });
    setSelectedResource({ ...selectedResource, ...updates });
  };

  const getTypeIcon = (type) => {
    switch (type) {
      case 'Link': return <LinkIcon className="w-4 h-4" />;
      default: return <FileText className="w-4 h-4" />;
    }
  };

  const getTypeColor = (type) => {
    switch (type) {
      case 'Document': return 'bg-blue-100 text-blue-800';
      case 'Presentation': return 'bg-purple-100 text-purple-800';
      case 'Video': return 'bg-red-100 text-red-800';
      case 'Link': return 'bg-green-100 text-green-800';
      case 'Worksheet': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const filteredMyResources = useMemo(() => {
    return myResources.filter((resource) => {
      const matchesSearch = !search || [resource.title, resource.description, resource.subject, resource.grade_level]
        .filter(Boolean)
        .some((value) => value.toLowerCase().includes(search.toLowerCase()));
      const matchesType = typeFilter === 'all' || resource.resource_type === typeFilter;
      return matchesSearch && matchesType;
    });
  }, [myResources, search, typeFilter]);

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
          <CardTitle>My Resources</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <ResourceFilters
            search={search}
            onSearchChange={setSearch}
            type={typeFilter}
            onTypeChange={setTypeFilter}
          />
          {filteredMyResources.length === 0 ? (
            <p className="text-gray-500 text-center py-8">No resources yet. Click "Add Resource" to upload teaching materials.</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredMyResources.map((resource) => (
                <div key={resource.id} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                  <div className="flex items-start justify-between mb-2 gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      {getTypeIcon(resource.resource_type)}
                      <h3 className="font-semibold truncate">{resource.title}</h3>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <ResourceVersionBadge version={resource.version_number} />
                      <Badge className={getTypeColor(resource.resource_type)}>{resource.resource_type}</Badge>
                    </div>
                  </div>
                  {resource.description && (
                    <p className="text-sm text-gray-600 mb-2 line-clamp-2">{resource.description}</p>
                  )}
                  <div className="flex items-center gap-2 text-xs text-gray-500 mb-3">
                    {resource.subject && <span>{resource.subject}</span>}
                    {resource.grade_level && <span>• Grade {resource.grade_level}</span>}
                  </div>
                  <div className="flex items-center gap-1 mb-3">
                    {resource.shared_with_teachers && (
                      <Badge variant="outline" className="text-xs"><Users className="w-3 h-3 mr-1" />Teachers</Badge>
                    )}
                    {resource.shared_with_students && (
                      <Badge variant="outline" className="text-xs"><GraduationCap className="w-3 h-3 mr-1" />Students</Badge>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => window.open(resource.resource_url, '_blank')}
                    >
                      <ExternalLink className="w-3 h-3 mr-1" />
                      Open
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        updateResourceMutation.mutate({
                          id: resource.id,
                          data: { version_number: (resource.version_number || 1) + 1 }
                        });
                      }}
                    >
                      <Download className="w-3 h-3 mr-1" />
                      New Version
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleOpenShareDialog(resource)}
                    >
                      <Share2 className="w-3 h-3 mr-1" />
                      Share
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="text-red-600 hover:bg-red-50"
                      onClick={() => deleteResourceMutation.mutate(resource.id)}
                    >
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {sharedWithMe.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Shared With Me</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {sharedWithMe.map((resource) => (
                <div key={resource.id} className="border rounded-lg p-4 hover:shadow-md transition-shadow bg-blue-50">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      {getTypeIcon(resource.resource_type)}
                      <h3 className="font-semibold truncate">{resource.title}</h3>
                    </div>
                    <Badge className={getTypeColor(resource.resource_type)}>{resource.resource_type}</Badge>
                  </div>
                  {resource.description && (
                    <p className="text-sm text-gray-600 mb-2 line-clamp-2">{resource.description}</p>
                  )}
                  <div className="flex items-center gap-2 text-xs text-gray-500 mb-3">
                    {resource.subject && <span>{resource.subject}</span>}
                    {resource.grade_level && <span>• Grade {resource.grade_level}</span>}
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => window.open(resource.resource_url, '_blank')}
                  >
                    <ExternalLink className="w-3 h-3 mr-1" />
                    Open
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Add Resource Dialog */}
      <Dialog open={isResourceFormOpen} onOpenChange={setIsResourceFormOpen}>
        <DialogContent className="bg-white max-w-2xl">
          <DialogHeader>
            <DialogTitle>Add New Resource</DialogTitle>
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
              <Label>Grade Level</Label>
              <Input
                value={resourceData.grade_level}
                onChange={(e) => setResourceData({ ...resourceData, grade_level: e.target.value })}
                placeholder="e.g., Grade 5"
              />
            </div>
            <div>
              <Label>Upload File or Link *</Label>
              <div className="space-y-2">
                <input
                  type="file"
                  onChange={handleFileUpload}
                  disabled={uploading}
                  className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                />
                {uploading && <p className="text-sm text-blue-600">Uploading...</p>}
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
              <Button 
                onClick={handleSaveResource} 
                className="bg-blue-600 hover:bg-blue-700"
                disabled={createResourceMutation.isPending}
              >
                {createResourceMutation.isPending ? 'Saving...' : 'Save Resource'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Share Dialog */}
      <Dialog open={isShareDialogOpen} onOpenChange={setIsShareDialogOpen}>
        <DialogContent className="bg-white max-w-md">
          <DialogHeader>
            <DialogTitle>Share "{selectedResource?.title}"</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div className="flex items-center gap-3">
                <Users className="w-5 h-5 text-blue-600" />
                <div>
                  <p className="font-medium">Share with Teachers</p>
                  <p className="text-sm text-gray-500">Other teachers can view this resource</p>
                </div>
              </div>
              <Checkbox
                checked={selectedResource?.shared_with_teachers || false}
                onCheckedChange={() => handleShare('teachers')}
              />
            </div>
            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div className="flex items-center gap-3">
                <GraduationCap className="w-5 h-5 text-green-600" />
                <div>
                  <p className="font-medium">Share with Students</p>
                  <p className="text-sm text-gray-500">Students can access this resource</p>
                </div>
              </div>
              <Checkbox
                checked={selectedResource?.shared_with_students || false}
                onCheckedChange={() => handleShare('students')}
              />
            </div>
            <div className="flex justify-end pt-4 border-t">
              <Button variant="outline" onClick={() => setIsShareDialogOpen(false)}>Done</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}