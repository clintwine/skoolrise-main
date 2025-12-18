import React, { useState, useEffect, useCallback } from "react";
import { useLocation, Link } from "react-router-dom";
import { Company, Contact, Deal, Activity } from "@/entities/all";
import { createPageUrl } from "@/utils";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

import CompanyDetailHeader from "../components/companies/detail/CompanyDetailHeader";
import CompanyInfoCard from "../components/companies/detail/CompanyInfoCard";
import CompanyDetailTabs from "../components/companies/detail/CompanyDetailTabs";

export default function CompanyDetail() {
  const location = useLocation();
  const [company, setCompany] = useState(null);
  const [relatedData, setRelatedData] = useState({ contacts: [], deals: [], activities: [] });
  const [isLoading, setIsLoading] = useState(true);
  const [companyId, setCompanyId] = useState(null);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const id = params.get('id');
    if (id) {
      setCompanyId(id);
    }
  }, [location]);

  const loadData = useCallback(async () => {
    if (!companyId) return;
    setIsLoading(true);
    try {
      const companyData = await Company.get(companyId);
      setCompany(companyData);

      const [contacts, deals, activities] = await Promise.all([
        Contact.filter({ company_id: companyId }),
        Deal.filter({ company_id: companyId }),
        Activity.filter({ company_id: companyId }, '-activity_date')
      ]);
      
      setRelatedData({ contacts, deals, activities });

    } catch (error) {
      console.error("Error loading company details:", error);
      setCompany(null); // Reset on error
    }
    setIsLoading(false);
  }, [companyId]);

  useEffect(() => {
    loadData();
  }, [companyId, loadData]);
  
  const handleCompanyUpdate = async (updatedData) => {
    if (!company) return;
    await Company.update(company.id, updatedData);
    loadData(); // Reload data to show changes
  };

  if (isLoading) {
    return (
      <div className="p-6 max-w-7xl mx-auto space-y-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-20 w-full" />
        <div className="grid lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1"><Skeleton className="h-64 w-full" /></div>
          <div className="lg:col-span-2"><Skeleton className="h-96 w-full" /></div>
        </div>
      </div>
    );
  }

  if (!company) {
    return (
      <div className="p-6 max-w-7xl mx-auto text-center">
        <h2 className="text-xl font-semibold text-slate-700">Company not found</h2>
        <p className="text-slate-500">The requested company could not be loaded.</p>
        <Link to={createPageUrl("Companies")}>
          <Button variant="outline" className="mt-4"><ArrowLeft className="w-4 h-4 mr-2" />Back to Companies</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <Link to={createPageUrl("Companies")} className="inline-flex items-center text-sm font-medium text-slate-600 hover:text-orange-600 transition-colors">
        <ArrowLeft className="w-4 h-4 mr-2" />
        Back to Companies
      </Link>
      
      <CompanyDetailHeader company={company} relatedDeals={relatedData.deals} />

      <div className="grid lg:grid-cols-3 gap-6 items-start">
        <div className="lg:col-span-1 space-y-6">
          <CompanyInfoCard company={company} onUpdate={handleCompanyUpdate} />
        </div>
        <div className="lg:col-span-2">
          <CompanyDetailTabs relatedData={relatedData} />
        </div>
      </div>
    </div>
  );
}