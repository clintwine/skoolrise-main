import React from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AlertTriangle, Clock, Percent, Ban } from 'lucide-react';

const POLICY_TYPES = [
  { value: 'none', label: 'No Policy', icon: Clock, description: 'Accept late submissions without penalty' },
  { value: 'flag', label: 'Flag Only', icon: AlertTriangle, description: 'Mark as late but no point deduction' },
  { value: 'deduct', label: 'Point Deduction', icon: Percent, description: 'Deduct percentage per day late' },
  { value: 'strict', label: 'Strict Deadline', icon: Ban, description: 'No submissions after deadline' },
];

export default function LatePolicyConfig({ value, onChange }) {
  const config = value ? (typeof value === 'string' ? JSON.parse(value) : value) : {
    type: 'none',
    deduction_percent: 10,
    grace_period_hours: 0,
    max_deduction: 50,
  };

  const handleChange = (field, val) => {
    const newConfig = { ...config, [field]: val };
    onChange(JSON.stringify(newConfig));
  };

  const selectedPolicy = POLICY_TYPES.find(p => p.value === config.type);

  return (
    <div className="space-y-4">
      <div>
        <Label>Late Submission Policy</Label>
        <Select value={config.type} onValueChange={(v) => handleChange('type', v)}>
          <SelectTrigger className="mt-1">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {POLICY_TYPES.map(policy => {
              const Icon = policy.icon;
              return (
                <SelectItem key={policy.value} value={policy.value}>
                  <div className="flex items-center gap-2">
                    <Icon className="w-4 h-4" />
                    <span>{policy.label}</span>
                  </div>
                </SelectItem>
              );
            })}
          </SelectContent>
        </Select>
        {selectedPolicy && (
          <p className="text-xs text-gray-500 mt-1">{selectedPolicy.description}</p>
        )}
      </div>

      {config.type === 'deduct' && (
        <div className="grid grid-cols-3 gap-4 p-4 bg-orange-50 rounded-lg border border-orange-200">
          <div>
            <Label className="text-sm">Deduction per Day (%)</Label>
            <Input
              type="number"
              value={config.deduction_percent}
              onChange={(e) => handleChange('deduction_percent', parseInt(e.target.value) || 0)}
              min="0"
              max="100"
              className="mt-1"
            />
          </div>
          <div>
            <Label className="text-sm">Grace Period (hours)</Label>
            <Input
              type="number"
              value={config.grace_period_hours}
              onChange={(e) => handleChange('grace_period_hours', parseInt(e.target.value) || 0)}
              min="0"
              className="mt-1"
            />
          </div>
          <div>
            <Label className="text-sm">Max Deduction (%)</Label>
            <Input
              type="number"
              value={config.max_deduction}
              onChange={(e) => handleChange('max_deduction', parseInt(e.target.value) || 0)}
              min="0"
              max="100"
              className="mt-1"
            />
          </div>
        </div>
      )}

      {config.type === 'flag' && (
        <div className="p-4 bg-yellow-50 rounded-lg border border-yellow-200">
          <div className="flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 text-yellow-600 mt-0.5" />
            <div>
              <p className="text-sm text-yellow-800 font-medium">Late submissions will be flagged</p>
              <p className="text-xs text-yellow-700">Teachers will see which submissions were late, but no automatic penalty is applied.</p>
            </div>
          </div>
          <div className="mt-3">
            <Label className="text-sm">Grace Period (hours)</Label>
            <Input
              type="number"
              value={config.grace_period_hours}
              onChange={(e) => handleChange('grace_period_hours', parseInt(e.target.value) || 0)}
              min="0"
              className="mt-1 max-w-32"
            />
          </div>
        </div>
      )}

      {config.type === 'strict' && (
        <div className="p-4 bg-red-50 rounded-lg border border-red-200">
          <div className="flex items-start gap-2">
            <Ban className="w-4 h-4 text-red-600 mt-0.5" />
            <div>
              <p className="text-sm text-red-800 font-medium">No late submissions allowed</p>
              <p className="text-xs text-red-700">Students will not be able to submit after the deadline.</p>
            </div>
          </div>
          <div className="mt-3">
            <Label className="text-sm">Grace Period (hours)</Label>
            <Input
              type="number"
              value={config.grace_period_hours}
              onChange={(e) => handleChange('grace_period_hours', parseInt(e.target.value) || 0)}
              min="0"
              className="mt-1 max-w-32"
            />
            <p className="text-xs text-gray-500 mt-1">Allow submissions within this time after deadline</p>
          </div>
        </div>
      )}
    </div>
  );
}

// Helper function to calculate late penalty
export function calculateLatePenalty(dueDate, submittedDate, maxPoints, policyConfig) {
  if (!policyConfig) return { penalty: 0, isLate: false, message: '' };
  
  const config = typeof policyConfig === 'string' ? JSON.parse(policyConfig) : policyConfig;
  const due = new Date(dueDate);
  const submitted = new Date(submittedDate);
  
  // Add grace period
  due.setHours(due.getHours() + (config.grace_period_hours || 0));
  
  const isLate = submitted > due;
  
  if (!isLate) return { penalty: 0, isLate: false, message: '' };
  
  switch (config.type) {
    case 'none':
      return { penalty: 0, isLate: true, message: 'Late submission accepted' };
    
    case 'flag':
      return { penalty: 0, isLate: true, message: 'Submission flagged as late' };
    
    case 'deduct': {
      const msPerDay = 24 * 60 * 60 * 1000;
      const daysLate = Math.ceil((submitted - due) / msPerDay);
      const deductionPercent = Math.min(
        daysLate * (config.deduction_percent || 10),
        config.max_deduction || 100
      );
      const penalty = Math.round((maxPoints * deductionPercent) / 100);
      return { 
        penalty, 
        isLate: true, 
        message: `${daysLate} day(s) late: -${deductionPercent}% (${penalty} points)` 
      };
    }
    
    case 'strict':
      return { penalty: maxPoints, isLate: true, message: 'Submission not accepted (past deadline)' };
    
    default:
      return { penalty: 0, isLate: false, message: '' };
  }
}