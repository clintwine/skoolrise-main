import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { CheckCircle2, GraduationCap, Link2, Sparkles } from 'lucide-react';

export default function LmsIntegrationPanel({ integrations, pathways }) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl sm:text-2xl font-bold text-text">LMS Integrations + AI Paths</h2>
        <p className="text-sm text-text-secondary mt-1">Track integration readiness and define recommended learning pathways for each class.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="bg-white shadow-sm border">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Link2 className="w-5 h-5" />
              Integration Readiness
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {integrations.map((item) => (
              <div key={item.name} className="flex items-start justify-between rounded-xl border p-4 gap-4">
                <div>
                  <p className="font-semibold text-gray-900">{item.name}</p>
                  <p className="text-sm text-gray-600 mt-1">{item.description}</p>
                </div>
                <Badge className={item.active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'}>
                  {item.active ? 'Ready' : 'Planned'}
                </Badge>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card className="bg-white shadow-sm border">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="w-5 h-5" />
              AI Pathway Rules
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {pathways.map((item) => (
              <div key={item.title} className="rounded-xl border p-4">
                <div className="flex items-center justify-between gap-3">
                  <p className="font-semibold text-gray-900">{item.title}</p>
                  <Badge variant="outline">{item.level}</Badge>
                </div>
                <p className="text-sm text-gray-600 mt-2">{item.description}</p>
              </div>
            ))}
            <Button variant="outline" className="w-full" disabled>
              <CheckCircle2 className="w-4 h-4 mr-2" />
              Planning mode active
            </Button>
          </CardContent>
        </Card>
      </div>

      <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-100 shadow-sm">
        <CardContent className="p-5 flex items-start gap-3">
          <GraduationCap className="w-5 h-5 text-blue-700 mt-0.5" />
          <div>
            <p className="font-semibold text-blue-900">What this unlocks</p>
            <p className="text-sm text-blue-800 mt-1">Schools can align class structures, standards, and assignments before connecting deeper LMS workflows and automated student support paths.</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}