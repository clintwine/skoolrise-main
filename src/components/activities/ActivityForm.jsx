import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Save, X, Activity as ActivityIcon } from "lucide-react";

const ACTIVITY_TYPES = ["call", "email", "meeting", "task", "note", "demo", "follow_up"];
const ACTIVITY_PRIORITIES = ["low", "medium", "high", "urgent"];
const ACTIVITY_OUTCOMES = ["completed", "no_answer", "scheduled_follow_up", "not_interested", "interested"];

export default function ActivityForm({ activity, contacts, companies, deals, onSubmit, onCancel }) {
  const [formData, setFormData] = useState(activity ? {
      ...activity,
      activity_date: activity.activity_date ? new Date(activity.activity_date).toISOString().slice(0, 16) : ''
    } : {
    activity_type: "call", subject: "", description: "", contact_id: "", deal_id: "", company_id: "", 
    activity_date: new Date().toISOString().slice(0, 16), duration: "", outcome: "", priority: "medium",
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit({...formData, activity_date: new Date(formData.activity_date).toISOString()});
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <Card className="border-0 shadow-lg"><CardHeader className="border-b border-slate-100">
      <CardTitle className="flex items-center gap-2"><ActivityIcon className="w-5 h-5 text-orange-600" />
        {activity ? "Edit Activity" : "Log New Activity"}
      </CardTitle></CardHeader><CardContent className="p-6">
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2"><Label htmlFor="activity_type">Type *</Label>
            <Select value={formData.activity_type} onValueChange={v => handleInputChange("activity_type", v)}>
              <SelectTrigger><SelectValue/></SelectTrigger>
              <SelectContent>{ACTIVITY_TYPES.map(t => <SelectItem key={t} value={t}>{t.replace("_", " ").replace(/\b\w/g, l => l.toUpperCase())}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div className="space-y-2"><Label htmlFor="subject">Subject *</Label>
            <Input id="subject" value={formData.subject} onChange={e => handleInputChange("subject", e.target.value)} placeholder="Follow-up call" required/>
          </div>
          <div className="space-y-2"><Label htmlFor="activity_date">Date & Time</Label>
            <Input id="activity_date" type="datetime-local" value={formData.activity_date} onChange={e => handleInputChange("activity_date", e.target.value)}/>
          </div>
          <div className="space-y-2"><Label htmlFor="priority">Priority</Label>
            <Select value={formData.priority} onValueChange={v => handleInputChange("priority", v)}>
              <SelectTrigger><SelectValue/></SelectTrigger>
              <SelectContent>{ACTIVITY_PRIORITIES.map(p => <SelectItem key={p} value={p}>{p.charAt(0).toUpperCase() + p.slice(1)}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div className="space-y-2"><Label htmlFor="contact_id">Link to Contact</Label>
            <Select value={formData.contact_id} onValueChange={v => handleInputChange("contact_id", v)}>
              <SelectTrigger><SelectValue placeholder="Select a contact"/></SelectTrigger>
              <SelectContent>{contacts.map(c => <SelectItem key={c.id} value={c.id}>{c.first_name} {c.last_name}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div className="space-y-2"><Label htmlFor="company_id">Link to Company</Label>
            <Select value={formData.company_id} onValueChange={v => handleInputChange("company_id", v)}>
              <SelectTrigger><SelectValue placeholder="Select a company"/></SelectTrigger>
              <SelectContent>{companies.map(c => <SelectItem key={c.id} value={c.id}>{c.company_name}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div className="space-y-2"><Label htmlFor="deal_id">Link to Deal</Label>
            <Select value={formData.deal_id} onValueChange={v => handleInputChange("deal_id", v)}>
              <SelectTrigger><SelectValue placeholder="Select a deal"/></SelectTrigger>
              <SelectContent>{deals.map(d => <SelectItem key={d.id} value={d.id}>{d.deal_name}</SelectItem>)}</SelectContent>
            </Select>
          </div>
        </div>
        <div className="space-y-2"><Label htmlFor="description">Description / Notes</Label>
          <Textarea id="description" value={formData.description} onChange={e => handleInputChange("description", e.target.value)} placeholder="Details about the activity..." rows={4}/>
        </div>
        <div className="flex justify-end gap-3 pt-4">
          <Button type="button" variant="outline" onClick={onCancel}><X className="w-4 h-4 mr-2"/>Cancel</Button>
          <Button type="submit" className="bg-orange-600 hover:bg-orange-700"><Save className="w-4 h-4 mr-2"/>{activity ? "Update Activity" : "Save Activity"}</Button>
        </div>
      </form>
    </CardContent></Card>
  );
}