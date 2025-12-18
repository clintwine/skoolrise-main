import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Save, X, Target } from "lucide-react";

const DEAL_STAGES = [
  "prospecting", "qualification", "proposal", "negotiation", "closing", "won", "lost"
];

const DEAL_SOURCES = [
  "inbound", "outbound", "referral", "partner", "event", "other"
];

export default function DealForm({ deal, contacts, companies, onSubmit, onCancel }) {
  const [formData, setFormData] = useState(deal || {
    deal_name: "",
    contact_id: "",
    company_id: "",
    stage: "prospecting",
    deal_value: "",
    probability: 50,
    expected_close_date: "",
    deal_source: "",
    description: ""
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(formData);
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <Card className="border-0 shadow-lg">
      <CardHeader className="border-b border-slate-100">
        <CardTitle className="flex items-center gap-2">
          <Target className="w-5 h-5 text-orange-600" />
          {deal ? "Edit Deal" : "Add New Deal"}
        </CardTitle>
      </CardHeader>
      <CardContent className="p-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="deal_name">Deal Name *</Label>
              <Input
                id="deal_name"
                value={formData.deal_name}
                onChange={(e) => handleInputChange("deal_name", e.target.value)}
                placeholder="New Website Project"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="deal_value">Deal Value ($) *</Label>
              <Input
                id="deal_value"
                type="number"
                value={formData.deal_value}
                onChange={(e) => handleInputChange("deal_value", parseFloat(e.target.value))}
                placeholder="50000"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="contact_id">Contact</Label>
              <Select
                value={formData.contact_id}
                onValueChange={(value) => handleInputChange("contact_id", value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select contact" />
                </SelectTrigger>
                <SelectContent>
                  {contacts.map((contact) => (
                    <SelectItem key={contact.id} value={contact.id}>
                      {contact.first_name} {contact.last_name} - {contact.email}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="company_id">Company</Label>
              <Select
                value={formData.company_id}
                onValueChange={(value) => handleInputChange("company_id", value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select company" />
                </SelectTrigger>
                <SelectContent>
                  {companies.map((company) => (
                    <SelectItem key={company.id} value={company.id}>
                      {company.company_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="stage">Stage</Label>
              <Select
                value={formData.stage}
                onValueChange={(value) => handleInputChange("stage", value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select stage" />
                </SelectTrigger>
                <SelectContent>
                  {DEAL_STAGES.map((stage) => (
                    <SelectItem key={stage} value={stage}>
                      {stage.replace(/\b\w/g, l => l.toUpperCase())}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="probability">Probability (%) </Label>
              <Input
                id="probability"
                type="number"
                min="0"
                max="100"
                value={formData.probability}
                onChange={(e) => handleInputChange("probability", parseInt(e.target.value))}
                placeholder="50"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="expected_close_date">Expected Close Date</Label>
              <Input
                id="expected_close_date"
                type="date"
                value={formData.expected_close_date}
                onChange={(e) => handleInputChange("expected_close_date", e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="deal_source">Deal Source</Label>
              <Select
                value={formData.deal_source}
                onValueChange={(value) => handleInputChange("deal_source", value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select source" />
                </SelectTrigger>
                <SelectContent>
                  {DEAL_SOURCES.map((source) => (
                    <SelectItem key={source} value={source}>
                      {source.replace(/\b\w/g, l => l.toUpperCase())}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => handleInputChange("description", e.target.value)}
              placeholder="Deal details and notes..."
              rows={3}
            />
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="outline" onClick={onCancel}>
              <X className="w-4 h-4 mr-2" />
              Cancel
            </Button>
            <Button type="submit" className="bg-orange-600 hover:bg-orange-700">
              <Save className="w-4 h-4 mr-2" />
              {deal ? "Update Deal" : "Save Deal"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}