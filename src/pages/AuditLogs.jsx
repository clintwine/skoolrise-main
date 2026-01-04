import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { 
  History, Search, Filter, User, Clock, Eye,
  Plus, Edit, Trash2, LogIn, LogOut, Download, Upload
} from 'lucide-react';
import { format } from 'date-fns';

const ACTION_ICONS = {
  create: Plus,
  update: Edit,
  delete: Trash2,
  login: LogIn,
  logout: LogOut,
  export: Download,
  import: Upload,
  view: Eye,
  approve: Plus,
  reject: Trash2,
};

const ACTION_COLORS = {
  create: 'bg-green-100 text-green-700',
  update: 'bg-blue-100 text-blue-700',
  delete: 'bg-red-100 text-red-700',
  login: 'bg-purple-100 text-purple-700',
  logout: 'bg-gray-100 text-gray-700',
  export: 'bg-orange-100 text-orange-700',
  import: 'bg-teal-100 text-teal-700',
  view: 'bg-indigo-100 text-indigo-700',
  approve: 'bg-emerald-100 text-emerald-700',
  reject: 'bg-rose-100 text-rose-700',
};

export default function AuditLogs() {
  const [search, setSearch] = useState('');
  const [actionFilter, setActionFilter] = useState('all');
  const [entityFilter, setEntityFilter] = useState('all');
  const [selectedLog, setSelectedLog] = useState(null);

  const { data: logs = [], isLoading } = useQuery({
    queryKey: ['audit-logs'],
    queryFn: () => base44.entities.AuditLog.list('-created_date', 500),
  });

  const entityTypes = [...new Set(logs.map(l => l.entity_type))];

  const filteredLogs = logs.filter(log => {
    const matchesSearch = search === '' || 
      log.user_email?.toLowerCase().includes(search.toLowerCase()) ||
      log.entity_name?.toLowerCase().includes(search.toLowerCase()) ||
      log.entity_type?.toLowerCase().includes(search.toLowerCase());
    const matchesAction = actionFilter === 'all' || log.action === actionFilter;
    const matchesEntity = entityFilter === 'all' || log.entity_type === entityFilter;
    return matchesSearch && matchesAction && matchesEntity;
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
            <History className="w-8 h-8" />
            Audit Logs
          </h1>
          <p className="text-gray-600 mt-1">Track all system activities and changes</p>
        </div>
        <Badge variant="outline" className="text-sm">
          {filteredLogs.length} records
        </Badge>
      </div>

      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                placeholder="Search by user, entity..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={actionFilter} onValueChange={setActionFilter}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Action" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Actions</SelectItem>
                <SelectItem value="create">Create</SelectItem>
                <SelectItem value="update">Update</SelectItem>
                <SelectItem value="delete">Delete</SelectItem>
                <SelectItem value="view">View</SelectItem>
                <SelectItem value="export">Export</SelectItem>
                <SelectItem value="login">Login</SelectItem>
              </SelectContent>
            </Select>
            <Select value={entityFilter} onValueChange={setEntityFilter}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Entity" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Entities</SelectItem>
                {entityTypes.map(type => (
                  <SelectItem key={type} value={type}>{type}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Activity Timeline</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
            </div>
          ) : filteredLogs.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <History className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p>No audit logs found</p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredLogs.map((log) => {
                const ActionIcon = ACTION_ICONS[log.action] || Eye;
                return (
                  <div 
                    key={log.id} 
                    className="flex items-start gap-4 p-4 border rounded-lg hover:bg-gray-50 cursor-pointer transition-colors"
                    onClick={() => setSelectedLog(log)}
                  >
                    <div className={`p-2 rounded-lg ${ACTION_COLORS[log.action] || 'bg-gray-100 text-gray-700'}`}>
                      <ActionIcon className="w-4 h-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium text-gray-900">{log.user_email}</span>
                        <Badge variant="outline" className="capitalize text-xs">{log.action}</Badge>
                      </div>
                      <p className="text-sm text-gray-600">
                        {log.action === 'view' ? 'Viewed' : log.action === 'create' ? 'Created' : log.action === 'update' ? 'Updated' : log.action === 'delete' ? 'Deleted' : log.action} 
                        {' '}<span className="font-medium">{log.entity_type}</span>
                        {log.entity_name && `: ${log.entity_name}`}
                      </p>
                    </div>
                    <div className="text-right text-sm text-gray-500 flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {format(new Date(log.created_date), 'MMM d, HH:mm')}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={!!selectedLog} onOpenChange={() => setSelectedLog(null)}>
        <DialogContent className="max-w-lg bg-white">
          <DialogHeader>
            <DialogTitle>Audit Log Details</DialogTitle>
          </DialogHeader>
          {selectedLog && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-gray-500 uppercase">User</p>
                  <p className="font-medium">{selectedLog.user_email}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 uppercase">Action</p>
                  <Badge className={ACTION_COLORS[selectedLog.action]}>{selectedLog.action}</Badge>
                </div>
                <div>
                  <p className="text-xs text-gray-500 uppercase">Entity Type</p>
                  <p className="font-medium">{selectedLog.entity_type}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 uppercase">Entity</p>
                  <p className="font-medium">{selectedLog.entity_name || selectedLog.entity_id}</p>
                </div>
                <div className="col-span-2">
                  <p className="text-xs text-gray-500 uppercase">Timestamp</p>
                  <p className="font-medium">{format(new Date(selectedLog.created_date), 'PPpp')}</p>
                </div>
              </div>
              
              {selectedLog.changes && (
                <div>
                  <p className="text-xs text-gray-500 uppercase mb-2">Changes</p>
                  <pre className="bg-gray-50 p-3 rounded-lg text-xs overflow-auto max-h-48">
                    {JSON.stringify(JSON.parse(selectedLog.changes), null, 2)}
                  </pre>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}