import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Calendar, Plus, Edit } from 'lucide-react';
import { format } from 'date-fns';

export default function TermsManagement() {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingTerm, setEditingTerm] = useState(null);
  const queryClient = useQueryClient();

  const { data: terms = [], isLoading } = useQuery({
    queryKey: ['terms'],
    queryFn: () => base44.entities.Term.list('-created_date'),
  });

  const { data: sessions = [] } = useQuery({
    queryKey: ['sessions'],
    queryFn: () => base44.entities.AcademicSession.list(),
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.Term.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['terms'] });
      setIsFormOpen(false);
      setEditingTerm(null);
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Term.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['terms'] });
      setIsFormOpen(false);
      setEditingTerm(null);
    },
  });

  const handleSubmit = (data) => {
    if (editingTerm) {
      updateMutation.mutate({ id: editingTerm.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const statusColors = {
    Active: 'bg-green-100 text-green-800',
    Completed: 'bg-gray-100 text-gray-800',
    Upcoming: 'bg-blue-100 text-blue-800',
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Terms Management</h1>
          <p className="text-gray-600 mt-1">Configure academic terms and semesters</p>
        </div>
        <Button
          onClick={() => {
            setEditingTerm(null);
            setIsFormOpen(true);
          }}
          className="bg-blue-600 hover:bg-blue-700"
        >
          <Plus className="w-4 h-4 mr-2" />
          Add Term
        </Button>
      </div>

      {isLoading ? (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {terms.map((term) => {
            const session = sessions.find(s => s.id === term.session_id);
            return (
              <Card key={term.id} className="bg-white shadow-md">
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-lg">{term.term_name}</CardTitle>
                      <p className="text-sm text-gray-600">{session?.session_name}</p>
                    </div>
                    <Badge className={statusColors[term.status]}>
                      {term.status}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Calendar className="w-4 h-4" />
                      <span>
                        {format(new Date(term.start_date), 'MMM d, yyyy')} - {format(new Date(term.end_date), 'MMM d, yyyy')}
                      </span>
                    </div>
                    {term.is_current && (
                      <Badge className="bg-green-600 text-white">Active Term</Badge>
                    )}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setEditingTerm(term);
                        setIsFormOpen(true);
                      }}
                      className="w-full mt-2"
                    >
                      <Edit className="w-4 h-4 mr-2" />
                      Edit
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      <TermFormDialog
        open={isFormOpen}
        onOpenChange={setIsFormOpen}
        term={editingTerm}
        sessions={sessions}
        onSubmit={handleSubmit}
      />
    </div>
  );
}

function TermFormDialog({ open, onOpenChange, term, sessions, onSubmit }) {
  const [formData, setFormData] = useState(
    term || {
      session_id: '',
      term_name: '',
      term_number: 1,
      start_date: '',
      end_date: '',
      status: 'Active',
      is_current: false,
    }
  );

  React.useEffect(() => {
    if (term) {
      setFormData(term);
    } else {
      setFormData({
        session_id: '',
        term_name: '',
        term_number: 1,
        start_date: '',
        end_date: '',
        status: 'Active',
        is_current: false,
      });
    }
  }, [term, open]);

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md bg-white">
        <DialogHeader>
          <DialogTitle className="text-gray-900">{term ? 'Edit Term' : 'Add New Term'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label>Academic Session *</Label>
            <Select value={formData.session_id} onValueChange={(value) => setFormData({ ...formData, session_id: value })}>
              <SelectTrigger>
                <SelectValue placeholder="Select session" />
              </SelectTrigger>
              <SelectContent>
                {sessions.map(session => (
                  <SelectItem key={session.id} value={session.id}>
                    {session.session_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Term Name *</Label>
            <Input
              value={formData.term_name}
              onChange={(e) => setFormData({ ...formData, term_name: e.target.value })}
              placeholder="e.g., First Term, Fall Semester"
              required
            />
          </div>
          <div>
            <Label>Term Number *</Label>
            <Input
              type="number"
              value={formData.term_number}
              onChange={(e) => setFormData({ ...formData, term_number: parseInt(e.target.value) })}
              min="1"
              required
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Start Date *</Label>
              <Input
                type="date"
                value={formData.start_date}
                onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                required
              />
            </div>
            <div>
              <Label>End Date *</Label>
              <Input
                type="date"
                value={formData.end_date}
                onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                required
              />
            </div>
          </div>
          <div>
            <Label>Status</Label>
            <Select value={formData.status} onValueChange={(value) => setFormData({ ...formData, status: value })}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Active">Active</SelectItem>
                <SelectItem value="Upcoming">Upcoming</SelectItem>
                <SelectItem value="Completed">Completed</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="is_current"
              checked={formData.is_current}
              onChange={(e) => setFormData({ ...formData, is_current: e.target.checked })}
              className="w-4 h-4"
            />
            <Label htmlFor="is_current">Set as current term</Label>
          </div>
          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" className="bg-blue-600 hover:bg-blue-700">
              {term ? 'Update' : 'Create'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}