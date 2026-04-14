import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { BookOpen, Link as LinkIcon, FileText, Presentation, Video, FileSpreadsheet } from 'lucide-react';

const icons = {
  Document: FileText,
  Presentation: Presentation,
  Video: Video,
  Worksheet: FileSpreadsheet,
  Link: LinkIcon,
};

export default function LessonPlannerResourcePanel({ resources, onAddResource }) {
  if (resources.length === 0) return null;

  return (
    <Card className="border-0 shadow-sm bg-white">
      <CardHeader>
        <CardTitle className="text-lg">Suggested Teacher Resources</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {resources.slice(0, 5).map((resource) => {
          const Icon = icons[resource.resource_type] || BookOpen;
          return (
            <button
              key={resource.id}
              type="button"
              onClick={() => onAddResource(resource)}
              className="w-full rounded-xl border p-3 text-left hover:bg-gray-50"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex gap-3">
                  <div className="w-10 h-10 rounded-lg bg-indigo-100 text-indigo-700 flex items-center justify-center">
                    <Icon className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900">{resource.title}</p>
                    <p className="text-sm text-gray-600">{resource.description || 'Teacher resource'}</p>
                  </div>
                </div>
                <Badge variant="outline">{resource.resource_type}</Badge>
              </div>
            </button>
          );
        })}
      </CardContent>
    </Card>
  );
}