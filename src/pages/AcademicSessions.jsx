import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
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
import { Calendar, Plus, Edit, CheckCircle } from 'lucide-react';
import { format } from 'date-fns';

export default function AcademicSessions() {
  const [isSessionFormOpen, setIsSessionFormOpen] = useState(false);
  const [isTermFormOpen, setIsTermFormOpen] = useState(false);
  const [editingSession, setEditingSession] = useState(null);
  const [editingTerm, setEditingTerm] = useState(null);
  const queryClient = useQueryClient();

  const { data: sessions = [], isLoading: sessionsLoading } = useQuery({
    queryKey: ['sessions'],
    queryFn: () => base44.entities.AcademicSession.list('-created_date'),
  });

  const { data: terms = [], isLoading: termsLoading } = useQuery({
    queryKey: ['terms'],
    queryFn: () => base44.entities.Term.list('-term_number'),
  });

  const createSessionMutation = useMutation({
    mutationFn: (data) => base44.entities.AcademicSession.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sessions'] });
      setIsSessionFormOpen(false);
      setEditingSession(null);
    },
  });

  const updateSessionMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.AcademicSession.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sessions'] });
      setIsSessionFormOpen(false);
      setEditingSession(null);
    },
  });

  const createTermMutation = useMutation({
    mutationFn: (data) => base44.entities.Term.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['terms'] });
      setIsTermFormOpen(false);
      setEditingTerm(null);
    },
  });

  const updateTermMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Term.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['terms'] });
      setIsTermFormOpen(false);
      setEditingTerm(null);
    },
  });

  const handleSessionSubmit = (data) => {
    if (editingSession) {
      updateSessionMutation.mutate({ id: editingSession.id, data });
    } else {
      createSessionMutation.mutate(data);
    }
  };

  const handleTermSubmit = (data) => {
    if (editingTerm) {
      updateTermMutation.mutate({ id: editingTerm.id, data });
    } else {
      createTermMutation.mutate(data);
    }
  };

  const statusColors = {
    Active: 'bg-green-100 text-green-800',
    Completed: 'bg-gray-100 text-gray-800',
    Upcoming: 'bg-blue-100 text-blue-800',
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Academic Sessions & Terms</h1>
        <p className="text-gray-600 mt-1">Manage academic years and terms</p>
      </div>

      <Tabs defaultValue="sessions" className="w-full">
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="sessions">Academic Sessions</TabsTrigger>
          <TabsTrigger value="terms">Terms</TabsTrigger>
        </TabsList>

        <TabsContent value="sessions" className="space-y-4 mt-6">
          <div className="flex justify-end">
            <Button
              onClick={() => {
                setEditingSession(null);
                setIsSessionFormOpen(true);
              }}
              className="bg-blue-600 hover:bg-blue-700"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Session
            </Button>
          </div>

          {sessionsLoading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {sessions.map((session) => {
                const sessionTerms = terms.filter(t => t.session_id === session.id);
                return (
                  <Card key={session.id} className="bg-white shadow-md">
                    <CardHeader>
                      <div className="flex justify-between items-start">
                        <div className="flex items-center gap-3">
                          <Calendar className="w-8 h-8 text-blue-600" />
                          <div>
                            <CardTitle className="text-xl">{session.session_name}</CardTitle>
                            <p className="text-sm text-gray-600">
                              {format(new Date(session.start_date), 'MMM d, yyyy')} - {format(new Date(session.end_date), 'MMM d, yyyy')}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {session.is_current && (
                            <Badge className="bg-green-600 text-white">
                              <CheckCircle className="w-3 h-3 mr-1" />
                              Current
                            </Badge>
                          )}
                          <Badge className={statusColors[session.status]}>
                            {session.status}
                          </Badge>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        <div>
                          <p className="text-sm font-medium text-gray-700 mb-2">Terms ({sessionTerms.length})</p>
                          {sessionTerms.length > 0 ? (
                            <div className="space-y-2">
                              {sessionTerms.map(term => (
                                <div key={term.id} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                                  <div>
                                    <p className="text-sm font-medium">{term.term_name}</p>
                                    <p className="text-xs text-gray-600">
                                      {format(new Date(term.start_date), 'MMM d')} - {format(new Date(term.end_date), 'MMM d, yyyy')}
                                    </p>
                                  </div>
                                  {term.is_current && (
                                    <Badge className="bg-green-100 text-green-800 text-xs">Active</Badge>
                                  )}
                                </div>
                              ))}
                            </div>
                          ) : (
                            <p className="text-sm text-gray-500">No terms configured</p>
                          )}
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setEditingSession(session);
                            setIsSessionFormOpen(true);
                          }}
                          className="w-full"
                        >
                          <Edit className="w-4 h-4 mr-2" />
                          Edit Session
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </TabsContent>

        <TabsContent value="terms" className="space-y-4 mt-6">
          <div className="flex justify-end">
            <Button
              onClick={() => {
                setEditingTerm(null);
                setIsTermFormOpen(true);
              }}
              className="bg-blue-600 hover:bg-blue-700"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Term
            </Button>
          </div>

          {termsLoading ? (
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
                            setIsTermFormOpen(true);
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
        </TabsContent>
      </Tabs>

      <SessionFormDialog
        open={isSessionFormOpen}
        onOpenChange={setIsSessionFormOpen}
        session={editingSession}
        onSubmit={handleSessionSubmit}
      />

      <TermFormDialog
        open={isTermFormOpen}
        onOpenChange={setIsTermFormOpen}
        term={editingTerm}
        sessions={sessions}
        onSubmit={handleTermSubmit}
      />
    </div>
  );
}

function SessionFormDialog({ open, onOpenChange, session, onSubmit }) {
  const [formData, setFormData] = useState(
    session || {
      session_name: '',
      start_date: '',
      end_date: '',
      status: 'Active',
      is_current: false,
    }
  );

  React.useEffect(() => {
    if (session) {
      setFormData(session);
    } else {
      setFormData({
        session_name: '',
        start_date: '',
        end_date: '',
        status: 'Active',
        is_current: false,
      });
    }
  }, [session, open]);

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md bg-white">
        <DialogHeader>
          <DialogTitle className="text-gray-900">{session ? 'Edit Session' : 'Add New Session'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label>Session Name *</Label>
            <Input
              value={formData.session_name}
              onChange={(e) => setFormData({ ...formData, session_name: e.target.value })}
              placeholder="e.g., 2024-2025"
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
            <Label htmlFor="is_current">Set as current session</Label>
          </div>
          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" className="bg-blue-600 hover:bg-blue-700">
              {session ? 'Update' : 'Create'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
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
              id="is_current_term"
              checked={formData.is_current}
              onChange={(e) => setFormData({ ...formData, is_current: e.target.checked })}
              className="w-4 h-4"
            />
            <Label htmlFor="is_current_term">Set as current term</Label>
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