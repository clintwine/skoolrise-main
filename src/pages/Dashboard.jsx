import React, { useState, useEffect } from "react";
import { Contact, Company, Deal, Activity } from "@/entities/all";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { 
  Users, 
  Building, 
  Target, 
  DollarSign, 
  TrendingUp,
  Plus,
  ArrowRight
} from "lucide-react";

import MetricCard from "../components/dashboard/MetricCard";
import RecentActivities from "../components/dashboard/RecentActivities";
import PipelineChart from "../components/dashboard/PipelineChart";
import TopDeals from "../components/dashboard/TopDeals";

export default function Dashboard() {
  const [metrics, setMetrics] = useState({
    totalContacts: 0,
    totalCompanies: 0,
    activeDeals: 0,
    pipelineValue: 0,
    wonDealsThisMonth: 0
  });
  const [recentActivities, setRecentActivities] = useState([]);
  const [topDeals, setTopDeals] = useState([]);
  const [pipelineData, setPipelineData] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    setIsLoading(true);
    try {
      const [contacts, companies, deals, activities] = await Promise.all([
        Contact.list(),
        Company.list(),
        Deal.list(),
        Activity.list('-activity_date', 5)
      ]);

      const activeDeals = deals.filter(deal => !['won', 'lost'].includes(deal.stage));
      const pipelineValue = activeDeals.reduce((sum, deal) => sum + (deal.deal_value || 0), 0);
      
      // Calculate won deals this month
      const thisMonth = new Date();
      thisMonth.setDate(1);
      const wonDealsThisMonth = deals.filter(deal => 
        deal.stage === 'won' && new Date(deal.updated_date) >= thisMonth
      ).length;

      setMetrics({
        totalContacts: contacts.length,
        totalCompanies: companies.length,
        activeDeals: activeDeals.length,
        pipelineValue,
        wonDealsThisMonth
      });

      setRecentActivities(activities);
      setTopDeals(activeDeals.sort((a, b) => (b.deal_value || 0) - (a.deal_value || 0)).slice(0, 5));

      // Pipeline data by stage
      const stageGroups = {};
      deals.forEach(deal => {
        if (!['won', 'lost'].includes(deal.stage)) {
          stageGroups[deal.stage] = (stageGroups[deal.stage] || 0) + (deal.deal_value || 0);
        }
      });
      
      setPipelineData(Object.entries(stageGroups).map(([stage, value]) => ({
        stage: stage.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase()),
        value
      })));

    } catch (error) {
      console.error("Error loading dashboard data:", error);
    }
    setIsLoading(false);
  };

  return (
    <div className="p-6 space-y-8 max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Dashboard</h1>
          <p className="text-slate-600 mt-1">Welcome back! Here's what's happening with your sales.</p>
        </div>
        <div className="flex gap-3">
          <Link to={createPageUrl("Activities")}>
            <Button variant="outline" className="flex items-center gap-2">
              <Plus className="w-4 h-4" />
              Log Activity
            </Button>
          </Link>
          <Link to={createPageUrl("Contacts")}>
            <Button className="bg-orange-600 hover:bg-orange-700 flex items-center gap-2">
              <Plus className="w-4 h-4" />
              Add Contact
            </Button>
          </Link>
        </div>
      </div>

      {/* Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
        <MetricCard
          title="Total Contacts"
          value={metrics.totalContacts}
          icon={Users}
          color="blue"
          trend="+12% from last month"
          isLoading={isLoading}
        />
        <MetricCard
          title="Active Deals"
          value={metrics.activeDeals}
          icon={Target}
          color="orange"
          trend="+8% from last month"
          isLoading={isLoading}
        />
        <MetricCard
          title="Pipeline Value"
          value={`$${(metrics.pipelineValue || 0).toLocaleString()}`}
          icon={DollarSign}
          color="emerald"
          trend="+23% from last month"
          isLoading={isLoading}
        />
        <MetricCard
          title="Companies"
          value={metrics.totalCompanies}
          icon={Building}
          color="purple"
          trend="+5% from last month"
          isLoading={isLoading}
        />
        <MetricCard
          title="Won This Month"
          value={metrics.wonDealsThisMonth}
          icon={TrendingUp}
          color="green"
          trend="Great work!"
          isLoading={isLoading}
        />
      </div>

      {/* Main Content Grid */}
      <div className="grid lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          <PipelineChart data={pipelineData} isLoading={isLoading} />
          <RecentActivities activities={recentActivities} isLoading={isLoading} />
        </div>
        <div className="space-y-8">
          <TopDeals deals={topDeals} isLoading={isLoading} />
          
          {/* Quick Actions */}
          <Card className="border-0 shadow-lg bg-gradient-to-br from-orange-50 to-orange-100">
            <CardHeader>
              <CardTitle className="text-lg font-semibold text-orange-900">Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Link to={createPageUrl("Contacts")}>
                <Button variant="ghost" className="w-full justify-start text-orange-700 hover:bg-orange-200">
                  <Users className="w-4 h-4 mr-2" />
                  Add New Contact
                  <ArrowRight className="w-4 h-4 ml-auto" />
                </Button>
              </Link>
              <Link to={createPageUrl("Deals")}>
                <Button variant="ghost" className="w-full justify-start text-orange-700 hover:bg-orange-200">
                  <Target className="w-4 h-4 mr-2" />
                  Create Deal
                  <ArrowRight className="w-4 h-4 ml-auto" />
                </Button>
              </Link>
              <Link to={createPageUrl("Companies")}>
                <Button variant="ghost" className="w-full justify-start text-orange-700 hover:bg-orange-200">
                  <Building className="w-4 h-4 mr-2" />
                  Add Company
                  <ArrowRight className="w-4 h-4 ml-auto" />
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}