
import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Edit, Trash2, Globe, MapPin, Building as BuildingIcon } from "lucide-react";
import { format } from "date-fns";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";

const statusColors = {
  prospect: "bg-blue-100 text-blue-700",
  qualified: "bg-purple-100 text-purple-700",
  customer: "bg-green-100 text-green-700",
  partner: "bg-orange-100 text-orange-700",
  inactive: "bg-gray-100 text-gray-700",
};

export default function CompanyList({ companies, onEdit, onDelete, isLoading }) {
  if (isLoading) {
    return (
      <Card className="border-0 shadow-lg"><CardContent className="p-0">
        <Table><TableHeader><TableRow className="bg-slate-50">
          <TableHead>Company</TableHead><TableHead>Industry</TableHead><TableHead>Status</TableHead>
          <TableHead>Location</TableHead><TableHead>Created</TableHead><TableHead>Actions</TableHead>
        </TableRow></TableHeader><TableBody>
        {[...Array(5)].map((_, i) => (
          <TableRow key={i}>
            <TableCell><Skeleton className="h-4 w-32" /></TableCell><TableCell><Skeleton className="h-4 w-24" /></TableCell>
            <TableCell><Skeleton className="h-6 w-16 rounded-full" /></TableCell><TableCell><Skeleton className="h-4 w-28" /></TableCell>
            <TableCell><Skeleton className="h-4 w-20" /></TableCell><TableCell><Skeleton className="h-8 w-16" /></TableCell>
          </TableRow>
        ))}</TableBody></Table>
      </CardContent></Card>
    );
  }

  if (companies.length === 0) {
    return (
      <Card className="border-0 shadow-lg"><CardContent className="p-12 text-center">
        <BuildingIcon className="w-16 h-16 text-slate-300 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-slate-900 mb-2">No companies found</h3>
        <p className="text-slate-500">Add your first company to get started</p>
      </CardContent></Card>
    );
  }

  return (
    <Card className="border-0 shadow-lg"><CardContent className="p-0">
      <div className="overflow-x-auto">
      <Table><TableHeader><TableRow className="bg-slate-50">
        <TableHead className="font-semibold">Company</TableHead><TableHead className="font-semibold">Industry</TableHead>
        <TableHead className="font-semibold">Status</TableHead><TableHead className="font-semibold">Location</TableHead>
        <TableHead className="font-semibold">Created</TableHead><TableHead className="font-semibold">Actions</TableHead>
      </TableRow></TableHeader><TableBody>
      {companies.map((company) => (
        <TableRow key={company.id} className="hover:bg-slate-25 transition-colors">
          <TableCell>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-slate-100 rounded-lg flex items-center justify-center">
                <BuildingIcon className="w-5 h-5 text-slate-500" />
              </div>
              <div>
                <Link to={createPageUrl(`CompanyDetail?id=${company.id}`)} className="font-medium text-slate-900 hover:text-orange-600 hover:underline">
                  {company.company_name}
                </Link>
                {company.website && (
                  <a href={company.website} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-sm text-blue-600 hover:underline">
                    <Globe className="w-3 h-3" />{company.website.replace(/https?:\/\//, '')}
                  </a>
                )}
              </div>
            </div>
          </TableCell>
          <TableCell><span className="text-slate-600">{company.industry}</span></TableCell>
          <TableCell><Badge className={`${statusColors[company.status]} border-0`}>{company.status?.replace("_", " ")}</Badge></TableCell>
          <TableCell>
            {company.location && <div className="flex items-center gap-2 text-slate-600"><MapPin className="w-4 h-4 text-slate-400" /><span>{company.location}</span></div>}
          </TableCell>
          <TableCell><span className="text-sm text-slate-500">{format(new Date(company.created_date), "MMM d, yyyy")}</span></TableCell>
          <TableCell><div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" onClick={() => onEdit(company)} className="hover:bg-orange-100 hover:text-orange-700"><Edit className="w-4 h-4" /></Button>
            <Button variant="ghost" size="icon" onClick={() => onDelete(company.id)} className="hover:bg-red-100 hover:text-red-700"><Trash2 className="w-4 h-4" /></Button>
          </div></TableCell>
        </TableRow>
      ))}</TableBody></Table>
      </div>
    </CardContent></Card>
  );
}
