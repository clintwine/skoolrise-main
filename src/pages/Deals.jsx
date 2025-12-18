import React, { useState, useEffect, useCallback } from "react";
import { Deal, Contact, Company } from "@/entities/all";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Search } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

import DealForm from "../components/deals/DealForm";
import DealKanbanBoard from "../components/deals/DealKanbanBoard"; // Replaced DealPipeline
import DealFilters from "../components/deals/DealFilters";

export default function Deals() {
  const [deals, setDeals] = useState([]);
  const [contacts, setContacts] = useState([]);
  const [companies, setCompanies] = useState([]);
  const [filteredDeals, setFilteredDeals] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editingDeal, setEditingDeal] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filters, setFilters] = useState({ stage: "all", source: "all" });
  const [isLoading, setIsLoading] = useState(true);

  const loadData = useCallback(async () => {
    setIsLoading(true);
    const [dealsData, contactsData, companiesData] = await Promise.all([
      Deal.list('-created_date'),
      Contact.list(),
      Company.list()
    ]);
    setDeals(dealsData);
    setContacts(contactsData);
    setCompanies(companiesData);
    setIsLoading(false);
  }, []);

  const filterDeals = useCallback(() => {
    let filtered = deals;

    if (searchTerm) {
      filtered = filtered.filter(deal =>
        deal.deal_name?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Kanban board handles its own stage filtering, so we exclude 'won' and 'lost' by default unless filtered
    if (filters.stage === "all") {
        filtered = filtered.filter(deal => !['won', 'lost'].includes(deal.stage));
    } else {
        filtered = filtered.filter(deal => deal.stage === filters.stage);
    }


    if (filters.source !== "all") {
      filtered = filtered.filter(deal => deal.deal_source === filters.source);
    }

    setFilteredDeals(filtered);
  }, [deals, searchTerm, filters]);


  useEffect(() => {
    loadData();
  }, [loadData]);

  useEffect(() => {
    filterDeals();
  }, [deals, searchTerm, filters, filterDeals]);


  const handleSubmit = async (dealData) => {
    if (editingDeal) {
      await Deal.update(editingDeal.id, dealData);
    } else {
      await Deal.create(dealData);
    }
    setShowForm(false);
    setEditingDeal(null);
    loadData();
  };

  const handleEdit = (deal) => {
    setEditingDeal(deal);
    setShowForm(true);
  };

  const handleDelete = async (dealId) => {
    await Deal.delete(dealId);
    loadData();
  };

  const handleStageChange = async (dealId, newStage) => {
    const deal = deals.find(d => d.id === dealId);
    if (deal) {
      await Deal.update(dealId, { ...deal, stage: newStage });
      loadData();
    }
  };

  return (
    <div className="p-6 h-full flex flex-col">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Sales Pipeline</h1>
          <p className="text-slate-600 mt-1">Track your deals through every stage</p>
        </div>
        <Button 
          onClick={() => { setEditingDeal(null); setShowForm(!showForm); }}
          className="bg-orange-600 hover:bg-orange-700 flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Add Deal
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
            <DealForm
              deal={editingDeal}
              contacts={contacts}
              companies={companies}
              onSubmit={handleSubmit}
              onCancel={() => {
                setShowForm(false);
                setEditingDeal(null);
              }}
            />
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex flex-col md:flex-row gap-4 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
          <Input
            placeholder="Search deals..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <DealFilters filters={filters} onFiltersChange={setFilters} />
      </div>

      <div className="flex-grow overflow-x-auto">
        <DealKanbanBoard
          deals={filteredDeals}
          onEdit={handleEdit}
          onDelete={handleDelete}
          onStageChange={handleStageChange}
          isLoading={isLoading}
          contacts={contacts}
          companies={companies}
        />
      </div>
    </div>
  );
}