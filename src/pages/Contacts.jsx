
import React, { useState, useEffect, useCallback } from "react";
import { Contact, Company } from "@/entities/all";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Search } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

import ContactForm from "../components/contacts/ContactForm";
import ContactList from "../components/contacts/ContactList";
import ContactFilters from "../components/contacts/ContactFilters";

export default function Contacts() {
  const [contacts, setContacts] = useState([]);
  const [companies, setCompanies] = useState([]);
  const [filteredContacts, setFilteredContacts] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editingContact, setEditingContact] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filters, setFilters] = useState({ status: "all", source: "all" });
  const [isLoading, setIsLoading] = useState(true);

  const loadData = async () => {
    setIsLoading(true);
    const [contactsData, companiesData] = await Promise.all([
      Contact.list('-created_date'),
      Company.list()
    ]);
    setContacts(contactsData);
    setCompanies(companiesData);
    setIsLoading(false);
  };

  const filterContacts = useCallback(() => {
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
  }, [contacts, searchTerm, filters]); // Dependencies for useCallback

  useEffect(() => {
    loadData();
  }, []); // Empty dependency array, loadData is stable for this effect

  useEffect(() => {
    filterContacts();
  }, [filterContacts]); // filterContacts is now a memoized function

  const handleSubmit = async (contactData) => {
    if (editingContact) {
      await Contact.update(editingContact.id, contactData);
    } else {
      await Contact.create(contactData);
    }
    setShowForm(false);
    setEditingContact(null);
    loadData();
  };

  const handleEdit = (contact) => {
    setEditingContact(contact);
    setShowForm(true);
  };

  const handleDelete = async (contactId) => {
    await Contact.delete(contactId);
    loadData();
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Contacts</h1>
          <p className="text-slate-600 mt-1">Manage your leads and customers</p>
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
            <ContactForm
              contact={editingContact}
              companies={companies}
              onSubmit={handleSubmit}
              onCancel={() => {
                setShowForm(false);
                setEditingContact(null);
              }}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Search and Filters */}
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
        <ContactFilters filters={filters} onFiltersChange={setFilters} />
      </div>

      <ContactList
        contacts={filteredContacts}
        onEdit={handleEdit}
        onDelete={handleDelete}
        isLoading={isLoading}
      />
    </div>
  );
}
