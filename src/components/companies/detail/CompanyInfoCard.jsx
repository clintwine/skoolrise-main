import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Building, Globe, MapPin, Users, DollarSign, Briefcase } from "lucide-react";

export default function CompanyInfoCard({ company }) {
  const infoItems = [
    { icon: Briefcase, label: "Industry", value: company.industry },
    { icon: Globe, label: "Website", value: company.website, isLink: true },
    { icon: MapPin, label: "Location", value: company.location },
    { icon: Users, label: "Company Size", value: company.company_size ? `${company.company_size} employees` : null },
    { icon: DollarSign, label: "Annual Revenue", value: company.annual_revenue ? `$${company.annual_revenue.toLocaleString()}` : null },
  ];

  return (
    <Card className="border-0 shadow-lg">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <Building className="w-5 h-5 text-orange-600" />
          About {company.company_name}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {company.description && <p className="text-sm text-slate-600">{company.description}</p>}
        <div className="border-t border-slate-100 pt-4 space-y-3">
          {infoItems.map((item, index) => item.value && (
            <div key={index} className="flex items-start text-sm">
              <item.icon className="w-4 h-4 text-slate-400 mt-0.5 mr-3 flex-shrink-0" />
              <div>
                <p className="text-slate-500">{item.label}</p>
                {item.isLink ? (
                  <a href={item.value} target="_blank" rel="noopener noreferrer" className="font-medium text-blue-600 hover:underline break-all">
                    {item.value.replace(/https?:\/\//, '')}
                  </a>
                ) : (
                  <p className="font-medium text-slate-800">{item.value}</p>
                )}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}