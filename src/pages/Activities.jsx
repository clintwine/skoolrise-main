import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useSchoolContext } from '@/hooks/useSchoolContext';
import { addSchoolFilter, withSchoolId } from '@/utils/schoolFilter';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Plus, CheckCircle, Clock, AlertCircle, User } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export default function Activities() {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    assigned_to: '',
    assigned_by: '',
    due_date: '',
    priority: 'Medium',
    status: 'Pending',
    category: 'Administrative'
  });
  const queryClient = useQueryClient();

  const { school_tenant_id, isReady } = useSchoolContext();

  const { data: teachers = [] } = useQuery({
    queryKey: ['teachers', school_tenant_id],
    queryFn: () => base44.entities.Teacher.filter(addSchoolFilter({}, school_tenant_id)),
    enabled: isReady,
  });

  const { data: activities = [] } = useQuery({
    queryKey: ['activities', school_tenant_id],
    queryFn: () => base44.entities.Activity.filter(addSchoolFilter({}, school_tenant_id), '-created_date'),
    enabled: isReady,
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.Activity.create(withSchoolId(data, school_tenant_id)),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['activities'] });
      setIsFormOpen(false);
      resetForm();
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Activity.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['activities'] });
    },
  });

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      assigned_to: '',
      assigned_by: '',
      due_date: '',
      priority: 'Medium',
      status: 'Pending',
      category: 'Administrative'
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const teacher = teachers.find(t => t.id === formData.assigned_to);
    const submitData = {
      ...formData,
      assigned_to_name: teacher ? `${teacher.first_name} ${teacher.last_name}` : ''
    };
    createMutation.mutate(submitData);
  };

  const handleStatusChange = (activity, newStatus) => {
    updateMutation.mutate({
      id: activity.id,
      data: { ...activity, status: newStatus }
    });
  };

  const statusColors = {
    Pending: 'bg-yellow-100 text-yellow-800',
    'In Progress': 'bg-blue-100 text-blue-800',
    Completed: 'bg-green-100 text-green-800',
  };

  const priorityColors = {
    Low: 'bg-gray-100 text-gray-800',
    Medium: 'bg-orange-100 text-orange-800',
    High: 'bg-red-100 text-red-800',
  };

  const groupedActivities = {
    Pending: activities.filter(a => a.status === 'Pending'),
    'In Progress': activities.filter(a => a.status === 'In Progress'),
    Completed: activities.filter(a => a.status === 'Completed'),
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Teacher Activities</h1>
          <p className="text-gray-600 mt-1">Assign and track tasks for teaching staff</p>
        </div>
        <Button onClick={() => setIsFormOpen(true)} className="bg-blue-600 hover:bg-blue-700">
          <Plus className="w-4 h-4 mr-2" />
          Assign Activity
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {Object.entries(groupedActivities).map(([status, items]) => (
          <Card key={status}>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>{status}</span>
                <Badge className={statusColors[status]}>{items.length}</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {items.map((activity) => (
                <Card key={activity.id} className="bg-gray-50">
                  <CardContent className="p-4">
                    <div className="space-y-2">
                      <div className="flex justify-between items-start">
                        <h3 className="font-semibold text-gray-900">{activity.title}</h3>
                        <Badge className={priorityColors[activity.priority]} size="sm">{activity.priority}</Badge>
                      </div>
                      <p className="text-sm text-gray-600">{activity.description}</p>
                      <div className="flex items-center gap-2 text-sm text-gray-500">
                        <User className="w-4 h-4" />
                        <span>{activity.assigned_to_name}</span>
                      </div>
                      {activity.due_date && (
                        <div className="flex items-center gap-2 text-sm text-gray-500">
                          <Clock className="w-4 h-4" />
                          <span>Due: {new Date(activity.due_date).toLocaleDateString()}</span>
                        </div>
                      )}
                      {status !== 'Completed' && (
                        <div className="flex gap-2 mt-3">
                          {status === 'Pending' && (
                            <Button size="sm" variant="outline" onClick={() => handleStatusChange(activity, 'In Progress')} className="flex-1">
                              Start
                            </Button>
                          )}
                          {status === 'In Progress' && (
                            <Button size="sm" variant="outline" onClick={() => handleStatusChange(activity, 'Completed')} className="flex-1">
                              <CheckCircle className="w-4 h-4 mr-1" />
                              Complete
                            </Button>
                          )}
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
              {items.length === 0 && (
                <p className="text-center text-gray-500 py-8 text-sm">No activities</p>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent className="max-w-2xl bg-white">
          <DialogHeader>
            <DialogTitle>Assign New Activity</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label>Activity Title *</Label>
              <Input value={formData.title} onChange={(e) => setFormData({...formData, title: e.target.value})} required />
            </div>
            <div>
              <Label>Description *</Label>
              <Textarea value={formData.description} onChange={(e) => setFormData({...formData, description: e.target.value})} rows={3} required />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Assign To *</Label>
                <Select value={formData.assigned_to} onValueChange={(value) => setFormData({...formData, assigned_to: value})} required>
                  <SelectTrigger>
                    <SelectValue placeholder="Select teacher" />
                  </SelectTrigger>
                  <SelectContent>
                    {teachers.map((teacher) => (
                      <SelectItem key={teacher.id} value={teacher.id}>
                        {teacher.first_name} {teacher.last_name} - {teacher.department}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Due Date</Label>
                <Input type="date" value={formData.due_date} onChange={(e) => setFormData({...formData, due_date: e.target.value})} />
              </div>
              <div>
                <Label>Priority</Label>
                <Select value={formData.priority} onValueChange={(value) => setFormData({...formData, priority: value})}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Low">Low</SelectItem>
                    <SelectItem value="Medium">Medium</SelectItem>
                    <SelectItem value="High">High</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Category</Label>
                <Select value={formData.category} onValueChange={(value) => setFormData({...formData, category: value})}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Administrative">Administrative</SelectItem>
                    <SelectItem value="Curriculum">Curriculum</SelectItem>
                    <SelectItem value="Student Support">Student Support</SelectItem>
                    <SelectItem value="Professional Development">Professional Development</SelectItem>
                    <SelectItem value="Other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="flex justify-end gap-3 pt-4 border-t">
              <Button type="button" variant="outline" onClick={() => setIsFormOpen(false)}>Cancel</Button>
              <Button type="submit" className="bg-blue-600 hover:bg-blue-700">Assign Activity</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}