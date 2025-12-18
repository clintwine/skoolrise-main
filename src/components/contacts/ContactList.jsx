import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Edit, Trash2, Mail, Phone, Building, User } from "lucide-react";
import { format } from "date-fns";

const statusColors = {
  new: "bg-blue-100 text-blue-700",
  contacted: "bg-purple-100 text-purple-700",
  qualified: "bg-green-100 text-green-700",
  proposal: "bg-orange-100 text-orange-700",
  negotiation: "bg-red-100 text-red-700",
  closed_won: "bg-emerald-100 text-emerald-700",
  closed_lost: "bg-gray-100 text-gray-700"
};

const sourceColors = {
  website: "bg-blue-50 text-blue-600",
  social_media: "bg-purple-50 text-purple-600",
  referral: "bg-green-50 text-green-600",
  cold_outreach: "bg-orange-50 text-orange-600",
  event: "bg-pink-50 text-pink-600",
  advertisement: "bg-red-50 text-red-600",
  other: "bg-gray-50 text-gray-600"
};

export default function ContactList({ contacts, onEdit, onDelete, isLoading }) {
  if (isLoading) {
    return (
      <Card className="border-0 shadow-lg">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="bg-slate-50">
                <TableHead>Contact</TableHead>
                <TableHead>Company</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Source</TableHead>
                <TableHead>Created</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {[...Array(5)].map((_, i) => (
                <TableRow key={i}>
                  <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                  <TableCell><Skeleton className="h-6 w-16 rounded-full" /></TableCell>
                  <TableCell><Skeleton className="h-6 w-20 rounded-full" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                  <TableCell><Skeleton className="h-8 w-16" /></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    );
  }

  if (contacts.length === 0) {
    return (
      <Card className="border-0 shadow-lg">
        <CardContent className="p-12 text-center">
          <User className="w-16 h-16 text-slate-300 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-slate-900 mb-2">No contacts found</h3>
          <p className="text-slate-500">Start building your network by adding your first contact</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-0 shadow-lg">
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-slate-50">
                <TableHead className="font-semibold">Contact</TableHead>
                <TableHead className="font-semibold">Company</TableHead>
                <TableHead className="font-semibold">Status</TableHead>
                <TableHead className="font-semibold">Source</TableHead>
                <TableHead className="font-semibold">Value</TableHead>
                <TableHead className="font-semibold">Created</TableHead>
                <TableHead className="font-semibold">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {contacts.map((contact) => (
                <TableRow key={contact.id} className="hover:bg-slate-25 transition-colors">
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-gradient-to-r from-orange-400 to-orange-500 rounded-full flex items-center justify-center">
                        <span className="text-white font-semibold text-sm">
                          {contact.first_name?.[0]}{contact.last_name?.[0]}
                        </span>
                      </div>
                      <div>
                        <p className="font-medium text-slate-900">
                          {contact.first_name} {contact.last_name}
                        </p>
                        <div className="flex items-center gap-2 text-sm text-slate-500">
                          <Mail className="w-3 h-3" />
                          {contact.email}
                        </div>
                        {contact.phone && (
                          <div className="flex items-center gap-2 text-sm text-slate-500">
                            <Phone className="w-3 h-3" />
                            {contact.phone}
                          </div>
                        )}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    {contact.company_name && (
                      <div className="flex items-center gap-2">
                        <Building className="w-4 h-4 text-slate-400" />
                        <div>
                          <p className="font-medium text-slate-900">{contact.company_name}</p>
                          {contact.job_title && (
                            <p className="text-sm text-slate-500">{contact.job_title}</p>
                          )}
                        </div>
                      </div>
                    )}
                  </TableCell>
                  <TableCell>
                    <Badge className={`${statusColors[contact.lead_status]} border-0`}>
                      {contact.lead_status?.replace("_", " ")}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {contact.lead_source && (
                      <Badge variant="secondary" className={`${sourceColors[contact.lead_source]} border-0`}>
                        {contact.lead_source.replace("_", " ")}
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    {contact.estimated_value && (
                      <span className="font-medium text-emerald-600">
                        ${contact.estimated_value.toLocaleString()}
                      </span>
                    )}
                  </TableCell>
                  <TableCell>
                    <span className="text-sm text-slate-500">
                      {format(new Date(contact.created_date), "MMM d, yyyy")}
                    </span>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => onEdit(contact)}
                        className="hover:bg-orange-100 hover:text-orange-700"
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => onDelete(contact.id)}
                        className="hover:bg-red-100 hover:text-red-700"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}