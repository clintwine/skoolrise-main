import React, { useState, useEffect, useCallback } from "react";
import { Activity, Contact, Company, Deal } from "@/entities/all";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Search } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

import ActivityForm from "../components/activities/ActivityForm";
import ActivityList from "../components/activities/ActivityList";
import ActivityFilters from "../components/activities/ActivityFilters";

export default function Activities() {
  const [activities, setActivities] = useState([]);
  const [relatedData, setRelatedData] = useState({ contacts: [], companies: [], deals: [] });
  const [filteredActivities, setFilteredActivities] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editingActivity, setEditingActivity] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filters, setFilters] = useState({ type: "all", priority: "all" });
  const [isLoading, setIsLoading] = useState(true);

  const loadData = useCallback(async () => {
    setIsLoading(true);
    const [activitiesData, contactsData, companiesData, dealsData] = await Promise.all([
      Activity.list('-activity_date'),
      Contact.list(),
      Company.list(),
      Deal.list()
    ]);
    setActivities(activitiesData);
    setRelatedData({ contacts: contactsData, companies: companiesData, deals: dealsData });
    setIsLoading(false);
  }, []);
  
  const filterActivities = useCallback(() => {
    let filtered = activities.map(activity => {
      const contact = relatedData.contacts.find(c => c.id === activity.contact_id);
      return {...activity, contactName: contact ? `${contact.first_name} ${contact.last_name}` : ''};
    });

    if (searchTerm) {
      filtered = filtered.filter(activity =>
        activity.subject?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        activity.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        activity.contactName?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    if (filters.type !== "all") {
      filtered = filtered.filter(activity => activity.activity_type === filters.type);
    }
    if (filters.priority !== "all") {
      filtered = filtered.filter(activity => activity.priority === filters.priority);
    }
    setFilteredActivities(filtered);
  }, [activities, relatedData.contacts, searchTerm, filters]);
  
  useEffect(() => {
    loadData();
  }, [loadData]);

  useEffect(() => {
    filterActivities();
  }, [activities, relatedData.contacts, searchTerm, filters, filterActivities]);

  const handleSubmit = async (activityData) => {
    if (editingActivity) {
      await Activity.update(editingActivity.id, activityData);
    } else {
      await Activity.create(activityData);
    }
    setShowForm(false);
    setEditingActivity(null);
    loadData();
  };

  const handleEdit = (activity) => {
    setEditingActivity(activity);
    setShowForm(true);
  };

  const handleDelete = async (activityId) => {
    await Activity.delete(activityId);
    loadData();
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Activities</h1>
          <p className="text-slate-600 mt-1">Track every interaction with your network</p>
        </div>
        <Button 
          onClick={() => { setEditingActivity(null); setShowForm(!showForm); }}
          className="bg-orange-600 hover:bg-orange-700 flex items-center gap-2"
        >
          <Plus className="w-4 h-4" /> Log Activity
        </Button>
      </div>

      <AnimatePresence>
        {showForm && (
          <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="mb-8">
            <ActivityForm
              activity={editingActivity}
              contacts={relatedData.contacts}
              companies={relatedData.companies}
              deals={relatedData.deals}
              onSubmit={handleSubmit}
              onCancel={() => { setShowForm(false); setEditingActivity(null); }}
            />
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex flex-col md:flex-row gap-4 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
          <Input placeholder="Search activities..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-10" />
        </div>
        <ActivityFilters filters={filters} onFiltersChange={setFilters} />
      </div>

      <ActivityList
        activities={filteredActivities}
        relatedData={relatedData}
        onEdit={handleEdit}
        onDelete={handleDelete}
        isLoading={isLoading}
      />
    </div>
  );
}