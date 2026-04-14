import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Plus, Trash2 } from 'lucide-react';

export default function WorkflowRulesPanel({ rules, onAddRule, onUpdateRule, onDeleteRule, onSave, saving }) {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Workflow Rules</h1>
        <p className="text-sm sm:text-base text-gray-600 mt-1">Create simple approval and notification rules for school operations.</p>
      </div>

      <Card className="bg-white shadow-md">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Reusable Rule Model</CardTitle>
          <Button onClick={onAddRule} variant="outline">
            <Plus className="w-4 h-4 mr-2" />
            Add Rule
          </Button>
        </CardHeader>
        <CardContent className="space-y-4">
          {rules.length === 0 ? (
            <div className="rounded-xl border border-dashed border-gray-300 p-6 text-sm text-gray-500 text-center">
              No workflow rules added yet.
            </div>
          ) : (
            rules.map((rule, index) => (
              <div key={index} className="rounded-xl border p-4 space-y-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 flex-1">
                    <div>
                      <Label>Rule Name</Label>
                      <Input
                        value={rule.name}
                        onChange={(e) => onUpdateRule(index, 'name', e.target.value)}
                        placeholder="e.g. Fee approval alert"
                      />
                    </div>
                    <div>
                      <Label>Area</Label>
                      <Select value={rule.area} onValueChange={(value) => onUpdateRule(index, 'area', value)}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select area" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="fees">Fees</SelectItem>
                          <SelectItem value="attendance">Attendance</SelectItem>
                          <SelectItem value="academics">Academics</SelectItem>
                          <SelectItem value="communication">Communication</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label>Trigger</Label>
                      <Select value={rule.trigger} onValueChange={(value) => onUpdateRule(index, 'trigger', value)}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select trigger" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="record_created">Record created</SelectItem>
                          <SelectItem value="record_updated">Record updated</SelectItem>
                          <SelectItem value="needs_approval">Needs approval</SelectItem>
                          <SelectItem value="overdue">Overdue</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label>Action</Label>
                      <Select value={rule.action} onValueChange={(value) => onUpdateRule(index, 'action', value)}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select action" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="notify_admin">Notify admin</SelectItem>
                          <SelectItem value="notify_staff">Notify staff</SelectItem>
                          <SelectItem value="require_approval">Require approval</SelectItem>
                          <SelectItem value="flag_record">Flag record</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <Button variant="ghost" size="icon" onClick={() => onDeleteRule(index)}>
                    <Trash2 className="w-4 h-4 text-red-500" />
                  </Button>
                </div>
              </div>
            ))
          )}

          <div className="flex justify-end">
            <Button onClick={onSave} disabled={saving} className="bg-blue-600 hover:bg-blue-700">
              {saving ? 'Saving...' : 'Save Workflow Rules'}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}