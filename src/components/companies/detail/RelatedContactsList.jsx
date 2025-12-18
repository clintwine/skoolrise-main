import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { User, Mail, Phone, Briefcase } from "lucide-react";

export default function RelatedContactsList({ contacts }) {
  return (
    <Card className="border-0 shadow-lg">
      <CardHeader><CardTitle>Contacts</CardTitle></CardHeader>
      <CardContent>
        {contacts.length === 0 ? (
          <div className="text-center py-8"><User className="w-12 h-12 text-slate-300 mx-auto mb-3" /><p className="text-slate-500">No contacts associated with this company.</p></div>
        ) : (
          <div className="space-y-4">
            {contacts.map(contact => (
              <div key={contact.id} className="flex items-center gap-4 p-3 rounded-lg border border-slate-100 bg-white">
                <div className="w-10 h-10 bg-gradient-to-r from-orange-400 to-orange-500 rounded-full flex items-center justify-center text-white font-semibold">
                  {contact.first_name?.[0]}{contact.last_name?.[0]}
                </div>
                <div className="flex-1">
                  <p className="font-semibold text-slate-800">{contact.first_name} {contact.last_name}</p>
                  <p className="text-sm text-slate-500 flex items-center gap-1"><Briefcase className="w-3 h-3" /> {contact.job_title}</p>
                </div>
                <div className="text-sm text-slate-600 space-y-1 text-right">
                  <div className="flex items-center gap-2 justify-end"><Mail className="w-3 h-3 text-slate-400" />{contact.email}</div>
                  <div className="flex items-center gap-2 justify-end"><Phone className="w-3 h-3 text-slate-400" />{contact.phone}</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}