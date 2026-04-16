import React, { useMemo, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Search, Mail, Phone, Building2, CalendarDays } from 'lucide-react';

export default function SchoolEnquiry() {
  const [searchTerm, setSearchTerm] = useState('');

  const { data: enquiries = [], isLoading } = useQuery({
    queryKey: ['school-enquiries'],
    queryFn: () => base44.entities.SchoolInquiry.list('-created_date'),
  });

  const filteredEnquiries = useMemo(() => {
    const term = searchTerm.toLowerCase();
    return enquiries.filter((item) =>
      [
        item.contact_name,
        item.school_name,
        item.email,
        item.phone,
        item.primary_goal,
      ].some((value) => value?.toLowerCase().includes(term))
    );
  }, [enquiries, searchTerm]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">School Enquiry</h1>
          <p className="text-gray-600 mt-1">View all enquiries submitted from the landing page CTA form.</p>
        </div>
        <Badge className="bg-purple-100 text-purple-700 border-0 px-3 py-1">
          {filteredEnquiries.length} enquiries
        </Badge>
      </div>

      <Card>
        <CardContent className="p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by name, school, email or goal"
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      {isLoading ? (
        <div className="text-center py-12">
          <div className="w-10 h-10 border-4 border-gray-200 border-t-gray-900 rounded-full animate-spin mx-auto" />
        </div>
      ) : filteredEnquiries.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <p className="text-lg font-medium text-gray-900">No enquiries found</p>
            <p className="text-gray-600 mt-2">New CTA submissions will appear here.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
          {filteredEnquiries.map((item) => (
            <Card key={item.id} className="border border-gray-200 shadow-sm">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <CardTitle className="text-xl text-gray-900">{item.school_name}</CardTitle>
                    <p className="text-sm text-gray-500 mt-1">Submitted {new Date(item.created_date).toLocaleString()}</p>
                  </div>
                  <Badge className="bg-orange-100 text-orange-700 border-0">{item.primary_goal}</Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid sm:grid-cols-2 gap-3 text-sm text-gray-700">
                  <div className="flex items-center gap-2"><Building2 className="w-4 h-4 text-gray-400" />{item.contact_name}</div>
                  <div className="flex items-center gap-2"><CalendarDays className="w-4 h-4 text-gray-400" />{item.go_live_timeline || 'No timeline'}</div>
                  <div className="flex items-center gap-2"><Mail className="w-4 h-4 text-gray-400" />{item.email}</div>
                  <div className="flex items-center gap-2"><Phone className="w-4 h-4 text-gray-400" />{item.phone}</div>
                </div>

                <div className="flex flex-wrap gap-2">
                  {item.role && <Badge variant="outline">{item.role}</Badge>}
                  {item.school_type && <Badge variant="outline">{item.school_type}</Badge>}
                  {item.student_count_range && <Badge variant="outline">{item.student_count_range} students</Badge>}
                </div>

                {item.current_tools && (
                  <div>
                    <p className="text-sm font-semibold text-gray-900 mb-1">Current tools</p>
                    <p className="text-sm text-gray-600">{item.current_tools}</p>
                  </div>
                )}

                {item.notes && (
                  <div>
                    <p className="text-sm font-semibold text-gray-900 mb-1">Notes</p>
                    <p className="text-sm text-gray-600 whitespace-pre-wrap">{item.notes}</p>
                  </div>
                )}

                <div className="flex flex-wrap gap-2 pt-2">
                  <Button asChild size="sm" className="bg-black hover:bg-gray-800 text-white">
                    <a href={`mailto:${item.email}`}>Email</a>
                  </Button>
                  <Button asChild size="sm" variant="outline">
                    <a href={`tel:${item.phone}`}>Call</a>
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}