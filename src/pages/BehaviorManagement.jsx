import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Plus, Award, AlertCircle, TrendingUp, TrendingDown } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export default function BehaviorManagement() {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [formData, setFormData] = useState({
    student_id: '',
    teacher_id: '',
    class_id: '',
    date: new Date().toISOString().split('T')[0],
    type: 'Positive',
    category: 'Good Conduct',
    description: '',
    action_taken: '',
    parent_notified: false,
  });
  const queryClient = useQueryClient();

  const { data: behaviors = [] } = useQuery({
    queryKey: ['behaviors'],
    queryFn: () => base44.entities.Behavior.list('-date'),
  });

  const { data: students = [] } = useQuery({
    queryKey: ['students'],
    queryFn: () => base44.entities.Student.list(),
  });

  const { data: teachers = [] } = useQuery({
    queryKey: ['teachers'],
    queryFn: () => base44.entities.Teacher.list(),
  });

  const { data: classes = [] } = useQuery({
    queryKey: ['classes'],
    queryFn: () => base44.entities.Class.list(),
  });

  const createMutation = useMutation({
    mutationFn: (data) => {
      const student = students.find(s => s.id === data.student_id);
      const teacher = teachers.find(t => t.id === data.teacher_id);
      return base44.entities.Behavior.create({
        ...data,
        student_name: `${student?.first_name} ${student?.last_name}`,
        teacher_name: `${teacher?.first_name} ${teacher?.last_name}`,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['behaviors'] });
      setIsFormOpen(false);
      resetForm();
    },
  });

  const resetForm = () => {
    setFormData({
      student_id: '',
      teacher_id: '',
      class_id: '',
      date: new Date().toISOString().split('T')[0],
      type: 'Positive',
      category: 'Good Conduct',
      description: '',
      action_taken: '',
      parent_notified: false,
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    createMutation.mutate(formData);
  };

  const filteredBehaviors = behaviors.filter(b =>
    b.student_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    b.teacher_name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const positiveCount = behaviors.filter(b => b.type === 'Positive').length;
  const negativeCount = behaviors.filter(b => b.type === 'Negative').length;
  const detentionCount = behaviors.filter(b => b.type === 'Detention').length;
  const warningCount = behaviors.filter(b => b.type === 'Warning').length;

  const typeColors = {
    Positive: 'bg-green-100 text-green-800',
    Negative: 'bg-red-100 text-red-800',
    Detention: 'bg-orange-100 text-orange-800',
    Warning: 'bg-yellow-100 text-yellow-800',
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Behavior Management</h1>
          <p className="text-gray-600 mt-1">Track and manage student behavior incidents</p>
        </div>
        <Button onClick={() => setIsFormOpen(true)} className="bg-blue-600 hover:bg-blue-700">
          <Plus className="w-4 h-4 mr-2" />
          Record Behavior
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Positive</p>
                <p className="text-2xl font-bold text-green-600">{positiveCount}</p>
              </div>
              <TrendingUp className="w-8 h-8 text-green-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Negative</p>
                <p className="text-2xl font-bold text-red-600">{negativeCount}</p>
              </div>
              <TrendingDown className="w-8 h-8 text-red-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Detentions</p>
                <p className="text-2xl font-bold text-orange-600">{detentionCount}</p>
              </div>
              <AlertCircle className="w-8 h-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Warnings</p>
                <p className="text-2xl font-bold text-yellow-600">{warningCount}</p>
              </div>
              <Award className="w-8 h-8 text-yellow-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Behavior Records</CardTitle>
        </CardHeader>
        <CardContent>
          <Input
            placeholder="Search by student or teacher..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="mb-4"
          />
          <div className="space-y-3">
            {filteredBehaviors.map((behavior) => (
              <div key={behavior.id} className="p-4 bg-gray-50 rounded-lg">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <p className="font-semibold text-gray-900">{behavior.student_name}</p>
                      <Badge className={typeColors[behavior.type]}>{behavior.type}</Badge>
                      <Badge variant="outline">{behavior.category}</Badge>
                    </div>
                    <p className="text-sm text-gray-600 mb-2">{behavior.description}</p>
                    <div className="flex items-center gap-4 text-sm text-gray-500">
                      <span>Teacher: {behavior.teacher_name}</span>
                      <span>Date: {new Date(behavior.date).toLocaleDateString()}</span>
                      {behavior.parent_notified && (
                        <span className="text-blue-600">Parent Notified</span>
                      )}
                    </div>
                    {behavior.action_taken && (
                      <p className="text-sm text-gray-700 mt-2">
                        <span className="font-semibold">Action:</span> {behavior.action_taken}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent className="max-w-2xl bg-white">
          <DialogHeader>
            <DialogTitle>Record Behavior Incident</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Student *</Label>
                <Select value={formData.student_id} onValueChange={(value) => setFormData({...formData, student_id: value})} required>
                  <SelectTrigger>
                    <SelectValue placeholder="Select student" />
                  </SelectTrigger>
                  <SelectContent>
                    {students.map((student) => (
                      <SelectItem key={student.id} value={student.id}>
                        {student.first_name} {student.last_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Teacher *</Label>
                <Select value={formData.teacher_id} onValueChange={(value) => setFormData({...formData, teacher_id: value})} required>
                  <SelectTrigger>
                    <SelectValue placeholder="Select teacher" />
                  </SelectTrigger>
                  <SelectContent>
                    {teachers.map((teacher) => (
                      <SelectItem key={teacher.id} value={teacher.id}>
                        {teacher.first_name} {teacher.last_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Date *</Label>
                <Input type="date" value={formData.date} onChange={(e) => setFormData({...formData, date: e.target.value})} required />
              </div>
              <div>
                <Label>Class</Label>
                <Select value={formData.class_id} onValueChange={(value) => setFormData({...formData, class_id: value})}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select class (optional)" />
                  </SelectTrigger>
                  <SelectContent>
                    {classes.map((cls) => (
                      <SelectItem key={cls.id} value={cls.id}>
                        {cls.class_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Type *</Label>
                <Select value={formData.type} onValueChange={(value) => setFormData({...formData, type: value})} required>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Positive">Positive</SelectItem>
                    <SelectItem value="Negative">Negative</SelectItem>
                    <SelectItem value="Detention">Detention</SelectItem>
                    <SelectItem value="Warning">Warning</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Category *</Label>
                <Select value={formData.category} onValueChange={(value) => setFormData({...formData, category: value})} required>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Academic Excellence">Academic Excellence</SelectItem>
                    <SelectItem value="Good Conduct">Good Conduct</SelectItem>
                    <SelectItem value="Disruption">Disruption</SelectItem>
                    <SelectItem value="Tardiness">Tardiness</SelectItem>
                    <SelectItem value="Incomplete Work">Incomplete Work</SelectItem>
                    <SelectItem value="Disrespect">Disrespect</SelectItem>
                    <SelectItem value="Other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="col-span-2">
                <Label>Description *</Label>
                <Textarea value={formData.description} onChange={(e) => setFormData({...formData, description: e.target.value})} rows={3} required />
              </div>
              <div className="col-span-2">
                <Label>Action Taken</Label>
                <Textarea value={formData.action_taken} onChange={(e) => setFormData({...formData, action_taken: e.target.value})} rows={2} />
              </div>
              <div className="col-span-2">
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={formData.parent_notified}
                    onChange={(e) => setFormData({...formData, parent_notified: e.target.checked})}
                    className="w-4 h-4"
                  />
                  <Label>Parent Notified</Label>
                </div>
              </div>
            </div>
            <div className="flex justify-end gap-3 pt-4 border-t">
              <Button type="button" variant="outline" onClick={() => setIsFormOpen(false)}>Cancel</Button>
              <Button type="submit" className="bg-blue-600 hover:bg-blue-700">Save Record</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}