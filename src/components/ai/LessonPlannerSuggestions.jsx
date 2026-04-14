import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function LessonPlannerSuggestions({ suggestedStandards, suggestedTemplates, onPickStandard, onPickTemplate }) {
  if (suggestedStandards.length === 0 && suggestedTemplates.length === 0) return null;

  return (
    <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
      <Card className="border-0 shadow-sm bg-white">
        <CardHeader>
          <CardTitle className="text-lg">Suggested Standards</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {suggestedStandards.slice(0, 4).map((standard) => (
            <button
              key={standard.id}
              type="button"
              onClick={() => onPickStandard(standard)}
              className="w-full text-left rounded-xl border p-3 hover:bg-gray-50"
            >
              <p className="font-semibold text-gray-900">{standard.code}</p>
              <p className="text-sm text-gray-600">{standard.title}</p>
            </button>
          ))}
        </CardContent>
      </Card>
      <Card className="border-0 shadow-sm bg-white">
        <CardHeader>
          <CardTitle className="text-lg">Suggested Templates</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {suggestedTemplates.map((template) => (
            <button
              key={template.id}
              type="button"
              onClick={() => onPickTemplate(template)}
              className="w-full text-left rounded-xl border p-3 hover:bg-gray-50"
            >
              <p className="font-semibold text-gray-900">{template.title}</p>
              <p className="text-sm text-gray-600">{template.type} · {template.difficulty || 'General'}</p>
            </button>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}