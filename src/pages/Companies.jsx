import React, { useState, useEffect, useCallback } from "react";
import { Company } from "@/entities/all";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Search } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

import CompanyForm from "../components/companies/CompanyForm";
import CompanyList from "../components/companies/CompanyList";
import CompanyFilters from "../components/companies/CompanyFilters";

export default function Companies() {
  const [companies, setCompanies] = useState([]);
  const [filteredCompanies, setFilteredCompanies] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editingCompany, setEditingCompany] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filters, setFilters] = useState({ status: "all", source: "all" });
  const [isLoading, setIsLoading] = useState(true);

  const loadData = useCallback(async () => {
    setIsLoading(true);
    const companiesData = await Company.list('-created_date');
    setCompanies(companiesData);
    setIsLoading(false);
  }, []);

  const filterCompanies = useCallback(() => {
    let filtered = companies;

    if (searchTerm) {
      filtered = filtered.filter(company =>
        company.company_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        company.industry?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        company.location?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (filters.status !== "all") {
      filtered = filtered.filter(company => company.status === filters.status);
    }

    if (filters.source !== "all") {
      filtered = filtered.filter(company => company.lead_source === filters.source);
    }

    setFilteredCompanies(filtered);
  }, [companies, searchTerm, filters]);
  
  useEffect(() => {
    loadData();
  }, [loadData]);

  useEffect(() => {
    filterCompanies();
  }, [companies, searchTerm, filters, filterCompanies]);

  const handleSubmit = async (companyData) => {
    if (editingCompany) {
      await Company.update(editingCompany.id, companyData);
    } else {
      await Company.create(companyData);
    }
    setShowForm(false);
    setEditingCompany(null);
    loadData();
  };

  const handleEdit = (company) => {
    setEditingCompany(company);
    setShowForm(true);
  };

  const handleDelete = async (companyId) => {
    await Company.delete(companyId);
    loadData();
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Companies</h1>
          <p className="text-slate-600 mt-1">Manage your company accounts</p>
        </div>
        <Button 
          onClick={() => { setEditingCompany(null); setShowForm(!showForm); }}
          className="bg-orange-600 hover:bg-orange-700 flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Add Company
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
            <CompanyForm
              company={editingCompany}
              onSubmit={handleSubmit}
              onCancel={() => {
                setShowForm(false);
                setEditingCompany(null);
              }}
            />
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex flex-col md:flex-row gap-4 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
          <Input
            placeholder="Search companies..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <CompanyFilters filters={filters} onFiltersChange={setFilters} />
      </div>

      <CompanyList
        companies={filteredCompanies}
        onEdit={handleEdit}
        onDelete={handleDelete}
        isLoading={isLoading}
      />
    </div>
  );
}