import React, { useState } from 'react';
import { useSchoolContext } from '@/hooks/useSchoolContext';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Building2, Check, ChevronDown, Loader2 } from 'lucide-react';

export default function SchoolSwitcher() {
  const { school_tenant_id, memberships, isMultiSchool, switchSchool } = useSchoolContext();
  const [switching, setSwitching] = useState(false);

  // Fetch school names for all memberships
  const schoolIds = memberships.map(m => m.school_tenant_id);
  const { data: schools = [] } = useQuery({
    queryKey: ['school-tenants-for-switcher', schoolIds.join(',')],
    queryFn: async () => {
      if (schoolIds.length === 0) return [];
      const results = await Promise.all(
        schoolIds.map(id => base44.entities.SchoolTenant.read(id).catch(() => null))
      );
      return results.filter(Boolean);
    },
    enabled: schoolIds.length > 0,
    staleTime: 60000,
  });

  if (!isMultiSchool) return null;

  const activeSchool = schools.find(s => s.id === school_tenant_id);

  const handleSwitch = async (id) => {
    if (id === school_tenant_id || switching) return;
    setSwitching(true);
    await switchSchool(id);
    // Reload page to ensure all data re-fetches for the new school
    window.location.reload();
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="hidden md:flex items-center gap-2 max-w-[200px] truncate"
          disabled={switching}
        >
          {switching ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Building2 className="w-4 h-4 text-blue-600 flex-shrink-0" />
          )}
          <span className="truncate text-sm font-medium">
            {activeSchool?.name || 'Select School'}
          </span>
          <ChevronDown className="w-3 h-3 flex-shrink-0 opacity-50" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-64 bg-white">
        <DropdownMenuLabel className="text-xs text-gray-500 font-normal">
          Switch School
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        {memberships.map((membership) => {
          const school = schools.find(s => s.id === membership.school_tenant_id);
          const isActive = membership.school_tenant_id === school_tenant_id;
          return (
            <DropdownMenuItem
              key={membership.school_tenant_id}
              onClick={() => handleSwitch(membership.school_tenant_id)}
              className="flex items-center justify-between cursor-pointer py-2.5"
            >
              <div className="flex items-center gap-2 min-w-0">
                <Building2 className={`w-4 h-4 flex-shrink-0 ${isActive ? 'text-blue-600' : 'text-gray-400'}`} />
                <div className="min-w-0">
                  <p className={`text-sm font-medium truncate ${isActive ? 'text-blue-700' : 'text-gray-900'}`}>
                    {school?.name || membership.school_tenant_id}
                  </p>
                  <p className="text-xs text-gray-500 capitalize">{membership.role}</p>
                </div>
              </div>
              {isActive && <Check className="w-4 h-4 text-blue-600 flex-shrink-0" />}
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}