import React from 'react';
import { Badge } from '@/components/ui/badge';

export default function ResourceVersionBadge({ version }) {
  return <Badge variant="outline">v{version || 1}</Badge>;
}