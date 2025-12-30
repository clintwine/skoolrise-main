import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Award, AlertTriangle, Plus } from 'lucide-react';
import { toast } from 'sonner';

export default function BehaviorTracking() {
  const [user, setUser] = useState(null);
  const [teacherId, setTeacherId] = useState(null);
  const [selectedClass, setSelectedClass] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    student_id: '',
    type: 'Positive',
    points: 0,
    description: '',
  });
  const queryClient = useQueryClient();

  useEffect(() => {
    const fetchUser = async () => {
      const currentUser = await base44.auth.me();
      setUser(currentUser);
      setTeacherId(currentUser.linked_teacher_id);
    };
    fetchUser();
  }, []);

  const { data: classes = [] } = useQuery({
    queryKey: ['teacher-classes', teacherId],
    queryFn: () => base44.entities.Class.filter({ teacher_id: teacherId }),
    enabled: !!teacherId,
  });

  const { data: enrollments = [] } = useQuery({
    queryKey: ['class-enrollments', selectedClass],
    queryFn: () => base44.entities.Enrollment.filter({ class_id: selectedClass, status: 'Enrolled' }),
    enabled: !!selectedClass,
  });

  const { data: behaviors = [] } = useQuery({
    queryKey: ['behaviors', selectedClass],
    queryFn: () => base44.entities.Behavior.filter({ class_id: selectedClass }),
    enabled: !!selectedClass,
  });

  const createBehaviorMutation = useMutation({
    mutationFn: (data) => base44.entities.Behavior.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries(['behaviors']);
      toast.success('Behavior record created');
      setDialogOpen(false);
      setFormData({ student_id: '', type: 'Positive', points: 0, description: '' });
    },
  });

  const handleSubmit = () => {
    const student = enrollments.find(e => e.student_id === formData.student_id);
    createBehaviorMutation.mutate({
      ...formData,
      student_name: student?.student_name,
      class_id: selectedClass,
      class_name: classes.find(c => c.id === selectedClass)?.class_name,
      date: new Date().toISOString().split('T')[0],
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-900">Behavior Tracking</h1>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Record Behavior
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Record Student Behavior</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Student</Label>
                <Select value={formData.student_id} onValueChange={(value) => setFormData({ ...formData, student_id: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select student" />
                  </SelectTrigger>
                  <SelectContent>
                    {enrollments.map(e => (
                      <SelectItem key={e.student_id} value={e.student_id}>{e.student_name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Type</Label>
                <Select value={formData.type} onValueChange={(value) => setFormData({ ...formData, type: value })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Positive">Positive</SelectItem>
                    <SelectItem value="Negative">Negative</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Points</Label>
                <Input
                  type="number"
                  value={formData.points}
                  onChange={(e) => setFormData({ ...formData, points: parseInt(e.target.value) })}
                />
              </div>
              <div>
                <Label>Description</Label>
                <Textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Describe the behavior..."
                />
              </div>
              <Button onClick={handleSubmit} className="w-full">Submit</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Select Class</CardTitle>
        </CardHeader>
        <CardContent>
          <Select value={selectedClass} onValueChange={setSelectedClass}>
            <SelectTrigger>
              <SelectValue placeholder="Select a class" />
            </SelectTrigger>
            <SelectContent>
              {classes.map(c => (
                <SelectItem key={c.id} value={c.id}>{c.class_name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {selectedClass && (
        <Card>
          <CardHeader>
            <CardTitle>Recent Behavior Records</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {behaviors.length === 0 ? (
                <p className="text-center text-gray-500 py-8">No behavior records yet</p>
              ) : (
                behaviors.map((behavior) => (
                  <div key={behavior.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center gap-3">
                      {behavior.type === 'Positive' ? (
                        <Award className="w-5 h-5 text-green-600" />
                      ) : (
                        <AlertTriangle className="w-5 h-5 text-red-600" />
                      )}
                      <div>
                        <p className="font-medium">{behavior.student_name}</p>
                        <p className="text-sm text-gray-600">{behavior.description}</p>
                        <p className="text-xs text-gray-500">{behavior.date}</p>
                      </div>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                      behavior.type === 'Positive' 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {behavior.points > 0 ? '+' : ''}{behavior.points} pts
                    </span>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}