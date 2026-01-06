import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Edit, Trash2, Users, Search } from 'lucide-react';

export default function ContactLists() {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingList, setEditingList] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const queryClient = useQueryClient();

  const { data: lists = [] } = useQuery({
    queryKey: ['contact-lists'],
    queryFn: () => base44.entities.ContactList.list('-created_date'),
  });

  const { data: students = [] } = useQuery({
    queryKey: ['students'],
    queryFn: () => base44.entities.Student.list(),
  });

  const { data: teachers = [] } = useQuery({
    queryKey: ['teachers'],
    queryFn: () => base44.entities.Teacher.list(),
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.ContactList.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contact-lists'] });
      setIsFormOpen(false);
      setEditingList(null);
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.ContactList.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contact-lists'] });
      setIsFormOpen(false);
      setEditingList(null);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.ContactList.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contact-lists'] });
    },
  });

  const handleSubmit = async (data) => {
    const user = await base44.auth.me();
    const submitData = { ...data, created_by: user.email };
    
    if (editingList) {
      updateMutation.mutate({ id: editingList.id, data: submitData });
    } else {
      createMutation.mutate(submitData);
    }
  };

  const filteredLists = lists.filter(list =>
    list.list_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    list.description?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const typeColors = {
    Parents: 'bg-blue-100 text-blue-800',
    Students: 'bg-green-100 text-green-800',
    Teachers: 'bg-purple-100 text-purple-800',
    Mixed: 'bg-orange-100 text-orange-800',
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Contact Lists</h1>
          <p className="text-gray-600 mt-1">Create and manage custom contact groups</p>
        </div>
        <Button onClick={() => { setEditingList(null); setIsFormOpen(true); }} className="bg-blue-600 hover:bg-blue-700">
          <Plus className="w-4 h-4 mr-2" />
          Create List
        </Button>
      </div>

      <Card className="bg-white shadow-sm">
        <CardContent className="p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <Input placeholder="Search lists..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-10" />
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredLists.map((list) => (
          <Card key={list.id} className="bg-white shadow-md hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="flex justify-between items-start">
                <div className="flex items-center gap-2">
                  <Users className="w-5 h-5 text-blue-600" />
                  <div>
                    <CardTitle className="text-lg">{list.list_name}</CardTitle>
                    <Badge className={typeColors[list.contact_type]}>{list.contact_type}</Badge>
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <p className="text-sm text-gray-600">{list.description || 'No description'}</p>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Contacts:</span>
                  <span className="font-bold">{list.contact_count || 0}</span>
                </div>
                <div className="flex gap-2 mt-4">
                  <Button variant="outline" size="sm" onClick={() => { setEditingList(list); setIsFormOpen(true); }} className="flex-1">
                    <Edit className="w-4 h-4 mr-1" />
                    Edit
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => {
                    if (confirm('Delete this list?')) deleteMutation.mutate(list.id);
                  }}>
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <ContactListFormDialog
        open={isFormOpen}
        onOpenChange={setIsFormOpen}
        list={editingList}
        students={students}
        teachers={teachers}
        onSubmit={handleSubmit}
      />
    </div>
  );
}

function ContactListFormDialog({ open, onOpenChange, list, students, teachers, onSubmit }) {
  const [formData, setFormData] = useState(list || {
    list_name: '',
    description: '',
    contact_type: 'Parents',
    contact_ids: '',
    contact_count: 0,
    is_active: true,
  });

  const [selectedContacts, setSelectedContacts] = useState([]);
  const [contactSearchTerm, setContactSearchTerm] = useState('');

  React.useEffect(() => {
    if (list) {
      setFormData(list);
      setSelectedContacts(list.contact_ids ? list.contact_ids.split(',') : []);
    } else {
      setFormData({
        list_name: '',
        description: '',
        contact_type: 'Parents',
        contact_ids: '',
        contact_count: 0,
        is_active: true,
      });
      setSelectedContacts([]);
    }
    setContactSearchTerm('');
  }, [list, open]);

  const getAvailableContacts = () => {
    let contacts = [];
    if (formData.contact_type === 'Students') {
      contacts = students.map(s => ({ ...s, name: `${s.first_name} ${s.last_name}` }));
    } else if (formData.contact_type === 'Teachers') {
      contacts = teachers.map(t => ({ ...t, name: `${t.first_name} ${t.last_name}` }));
    } else if (formData.contact_type === 'Parents') {
      contacts = students.filter(s => s.parent_email).map(s => ({
        id: s.id,
        name: `${s.parent_name || `Parent of ${s.first_name} ${s.last_name}`} (Parent of ${s.first_name} ${s.last_name})`,
        email: s.parent_email
      }));
    } else if (formData.contact_type === 'Mixed') {
      contacts = [
        ...students.map(s => ({ ...s, name: `${s.first_name} ${s.last_name}` })),
        ...teachers.map(t => ({ ...t, name: `${t.first_name} ${t.last_name}` })),
      ];
    }
    return contacts.filter(contact => 
      contact.name?.toLowerCase().includes(contactSearchTerm.toLowerCase()) ||
      contact.email?.toLowerCase().includes(contactSearchTerm.toLowerCase())
    );
  };

  const toggleContact = (contactId) => {
    if (selectedContacts.includes(contactId)) {
      setSelectedContacts(selectedContacts.filter(id => id !== contactId));
    } else {
      setSelectedContacts([...selectedContacts, contactId]);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit({
      ...formData,
      contact_ids: selectedContacts.join(','),
      contact_count: selectedContacts.length,
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto bg-white">
        <DialogHeader>
          <DialogTitle className="text-gray-900">{list ? 'Edit Contact List' : 'Create Contact List'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label>List Name *</Label>
            <Input value={formData.list_name} onChange={(e) => setFormData({ ...formData, list_name: e.target.value })} required />
          </div>

          <div>
            <Label>Description</Label>
            <Textarea value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} />
          </div>

          <div>
            <Label>Contact Type *</Label>
            <Select value={formData.contact_type} onValueChange={(value) => { setFormData({ ...formData, contact_type: value }); setSelectedContacts([]); }}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="Parents">Parents</SelectItem>
                <SelectItem value="Students">Students</SelectItem>
                <SelectItem value="Teachers">Teachers</SelectItem>
                <SelectItem value="Mixed">Mixed</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label>Select Contacts ({selectedContacts.length} selected)</Label>
            <Input 
              placeholder="Search contacts by name or email..."
              value={contactSearchTerm}
              onChange={(e) => setContactSearchTerm(e.target.value)}
              className="mb-3"
            />
            <div className="border rounded-lg p-4 max-h-60 overflow-y-auto space-y-2">
              {getAvailableContacts().map((contact) => (
                <label key={contact.id} className="flex items-center gap-2 p-2 hover:bg-gray-50 rounded cursor-pointer">
                  <input
                    type="checkbox"
                    checked={selectedContacts.includes(contact.id)}
                    onChange={() => toggleContact(contact.id)}
                  />
                  <span className="text-sm">
                    {contact.name || `${contact.first_name} ${contact.last_name}`}
                    {contact.email && <span className="text-gray-500 ml-2">({contact.email})</span>}
                  </span>
                </label>
              ))}
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button type="submit" className="bg-blue-600 hover:bg-blue-700">{list ? 'Update' : 'Create'}</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}