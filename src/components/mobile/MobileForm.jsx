import React from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";

export function MobileFormField({ label, required, children, error }) {
  return (
    <div className="space-y-1.5">
      <Label className="text-sm font-medium text-gray-700">
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </Label>
      {children}
      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  );
}

export function MobileInput({ label, required, error, ...props }) {
  return (
    <MobileFormField label={label} required={required} error={error}>
      <Input 
        className="h-11 text-base" 
        {...props} 
      />
    </MobileFormField>
  );
}

export function MobileTextarea({ label, required, error, ...props }) {
  return (
    <MobileFormField label={label} required={required} error={error}>
      <Textarea 
        className="text-base min-h-[100px]" 
        {...props} 
      />
    </MobileFormField>
  );
}

export function MobileSelect({ label, required, error, options = [], placeholder, value, onValueChange }) {
  return (
    <MobileFormField label={label} required={required} error={error}>
      <Select value={value} onValueChange={onValueChange}>
        <SelectTrigger className="h-11 text-base">
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent>
          {options.map((option) => (
            <SelectItem key={option.value} value={option.value} className="text-base py-3">
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </MobileFormField>
  );
}

export function MobileSwitchField({ label, description, checked, onCheckedChange }) {
  return (
    <div className="flex items-center justify-between py-3 border-b border-gray-100">
      <div className="flex-1">
        <p className="text-sm font-medium text-gray-900">{label}</p>
        {description && <p className="text-xs text-gray-500">{description}</p>}
      </div>
      <Switch checked={checked} onCheckedChange={onCheckedChange} />
    </div>
  );
}

export function MobileFormActions({ 
  onCancel, 
  onSubmit, 
  submitLabel = "Save", 
  cancelLabel = "Cancel",
  loading = false,
  disabled = false
}) {
  return (
    <div className="flex gap-3 pt-4 border-t border-gray-100 mt-4">
      {onCancel && (
        <Button 
          type="button" 
          variant="outline" 
          className="flex-1 h-11" 
          onClick={onCancel}
          disabled={loading}
        >
          {cancelLabel}
        </Button>
      )}
      <Button 
        type="submit" 
        className="flex-1 h-11 bg-blue-600 hover:bg-blue-700" 
        onClick={onSubmit}
        disabled={loading || disabled}
      >
        {loading ? "Saving..." : submitLabel}
      </Button>
    </div>
  );
}