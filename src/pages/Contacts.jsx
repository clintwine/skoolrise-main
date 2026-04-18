import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Search } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useSchoolContext } from "@/hooks/useSchoolContext";

export default function Contacts() {
  const { school_tenant_id } = useSchoolContext();
  const [contacts, setContacts] = useState([]);
  const [filteredContacts, setFilteredContacts] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editingContact, setEditingContact] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filters, setFilters] = useState({ status: "all", source: "all" });
  const [isLoading, setIsLoading] = useState(true);

  const loadData = async () => {
    if (!school_tenant_id) return;
    setIsLoading(true);
    try {
      const contactsData = await base44.entities.Contact.filter({
        school_tenant_id: school_tenant_id,
      }, '-created_date');
      setContacts(contactsData);
    } catch (error) {
      console.error("Failed to load contacts:", error);
    }
    setIsLoading(false);
  };

  const filterContacts = () => {
    let filtered = contacts;

    if (searchTerm) {
      filtered = filtered.filter(contact =>
        contact.first_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        contact.last_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        contact.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        contact.company_name?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (filters.status !== "all") {
      filtered = filtered.filter(contact => contact.lead_status === filters.status);
    }

    if (filters.source !== "all") {
      filtered = filtered.filter(contact => contact.lead_source === filters.source);
    }

    setFilteredContacts(filtered);
  };

  useEffect(() => {
    loadData();
  }, [school_tenant_id]);

  useEffect(() => {
    filterContacts();
  }, [contacts, searchTerm, filters]);

  const handleSubmit = async (contactData) => {
    try {
      const dataWithSchool = { ...contactData, school_tenant_id };
      if (editingContact) {
        await base44.entities.Contact.update(editingContact.id, dataWithSchool);
      } else {
        await base44.entities.Contact.create(dataWithSchool);
      }
      setShowForm(false);
      setEditingContact(null);
      loadData();
    } catch (error) {
      console.error("Failed to save contact:", error);
    }
  };

  const handleEdit = (contact) => {
    setEditingContact(contact);
    setShowForm(true);
  };

  const handleDelete = async (contactId) => {
    try {
      await base44.entities.Contact.delete(contactId);
      loadData();
    } catch (error) {
      console.error("Failed to delete contact:", error);
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Contacts</h1>
          <p className="text-slate-600 mt-1">Manage your school contacts</p>
        </div>
        <Button 
          onClick={() => setShowForm(!showForm)}
          className="bg-orange-600 hover:bg-orange-700 flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Add Contact
        </Button>
      </div>

      <AnimatePresence>
        {showForm && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="mb-8"
          >
            {/* ContactForm would be imported and used here */}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Search */}
      <div className="flex flex-col md:flex-row gap-4 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
          <Input
            placeholder="Search contacts..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {isLoading ? (
        <div className="text-center text-slate-500">Loading contacts...</div>
      ) : filteredContacts.length === 0 ? (
        <div className="text-center text-slate-500">No contacts found.</div>
      ) : (
        <div className="grid gap-4">
          {filteredContacts.map((contact) => (
            <div key={contact.id} className="p-4 border rounded-lg hover:bg-slate-50">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-semibold">{contact.first_name} {contact.last_name}</h3>
                  <p className="text-sm text-slate-500">{contact.email}</p>
                </div>
                <div className="flex gap-2">
                  <Button variant="ghost" size="sm" onClick={() => handleEdit(contact)}>Edit</Button>
                  <Button variant="ghost" size="sm" onClick={() => handleDelete(contact.id)}>Delete</Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}