import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  History, Search, Filter, User, Clock, Eye,
  Plus, Edit, Trash2, LogIn, LogOut, Download, Upload,
  AlertTriangle, Info, Shield, RefreshCw, Calendar,
  FileText, Users, Database, Activity
} from 'lucide-react';
import { format, subDays, isWithinInterval, parseISO } from 'date-fns';

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
  bulk_create: Database,
  bulk_update: RefreshCw,
  bulk_delete: Trash2,
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
  bulk_create: 'bg-green-100 text-green-700',
  bulk_update: 'bg-blue-100 text-blue-700',
  bulk_delete: 'bg-red-100 text-red-700',
};

const SEVERITY_COLORS = {
  info: 'bg-blue-100 text-blue-700',
  warning: 'bg-yellow-100 text-yellow-700',
  critical: 'bg-red-100 text-red-700',
};

const SEVERITY_ICONS = {
  info: Info,
  warning: AlertTriangle,
  critical: Shield,
};

export default function AuditLogs() {
  const [search, setSearch] = useState('');
  const [actionFilter, setActionFilter] = useState('all');
  const [entityFilter, setEntityFilter] = useState('all');
  const [severityFilter, setSeverityFilter] = useState('all');
  const [dateRange, setDateRange] = useState('all');
  const [selectedLog, setSelectedLog] = useState(null);
  const [activeTab, setActiveTab] = useState('timeline');

  const { data: logs = [], isLoading, refetch } = useQuery({
    queryKey: ['audit-logs'],
    queryFn: () => base44.entities.AuditLog.list('-created_date', 1000),
  });

  const entityTypes = [...new Set(logs.map(l => l.entity_type).filter(Boolean))];
  const userEmails = [...new Set(logs.map(l => l.user_email).filter(Boolean))];

  const getDateRangeFilter = (log) => {
    if (dateRange === 'all') return true;
    const logDate = parseISO(log.created_date);
    const now = new Date();
    
    switch (dateRange) {
      case 'today':
        return format(logDate, 'yyyy-MM-dd') === format(now, 'yyyy-MM-dd');
      case '7days':
        return isWithinInterval(logDate, { start: subDays(now, 7), end: now });
      case '30days':
        return isWithinInterval(logDate, { start: subDays(now, 30), end: now });
      case '90days':
        return isWithinInterval(logDate, { start: subDays(now, 90), end: now });
      default:
        return true;
    }
  };

  const filteredLogs = logs.filter(log => {
    const matchesSearch = search === '' || 
      log.user_email?.toLowerCase().includes(search.toLowerCase()) ||
      log.entity_name?.toLowerCase().includes(search.toLowerCase()) ||
      log.entity_type?.toLowerCase().includes(search.toLowerCase()) ||
      log.user_name?.toLowerCase().includes(search.toLowerCase());
    const matchesAction = actionFilter === 'all' || log.action === actionFilter;
    const matchesEntity = entityFilter === 'all' || log.entity_type === entityFilter;
    const matchesSeverity = severityFilter === 'all' || log.severity === severityFilter;
    const matchesDate = getDateRangeFilter(log);
    return matchesSearch && matchesAction && matchesEntity && matchesSeverity && matchesDate;
  });

  // Statistics
  const stats = {
    total: filteredLogs.length,
    creates: filteredLogs.filter(l => l.action === 'create' || l.action === 'bulk_create').length,
    updates: filteredLogs.filter(l => l.action === 'update' || l.action === 'bulk_update').length,
    deletes: filteredLogs.filter(l => l.action === 'delete' || l.action === 'bulk_delete').length,
    critical: filteredLogs.filter(l => l.severity === 'critical').length,
    uniqueUsers: new Set(filteredLogs.map(l => l.user_email)).size,
  };

  // Group by date for timeline
  const groupedByDate = filteredLogs.reduce((acc, log) => {
    const date = format(new Date(log.created_date), 'yyyy-MM-dd');
    if (!acc[date]) acc[date] = [];
    acc[date].push(log);
    return acc;
  }, {});

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
            <Shield className="w-8 h-8" />
            Audit Logs
          </h1>
          <p className="text-gray-600 mt-1">Enterprise-grade activity tracking and compliance monitoring</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => refetch()}>
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
          <Badge variant="outline" className="text-sm px-3 py-2">
            {filteredLogs.length} records
          </Badge>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Activity className="w-5 h-5 text-blue-600" />
              <div>
                <p className="text-xs text-gray-500">Total Events</p>
                <p className="text-xl font-bold">{stats.total}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Plus className="w-5 h-5 text-green-600" />
              <div>
                <p className="text-xs text-gray-500">Creates</p>
                <p className="text-xl font-bold text-green-600">{stats.creates}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Edit className="w-5 h-5 text-blue-600" />
              <div>
                <p className="text-xs text-gray-500">Updates</p>
                <p className="text-xl font-bold text-blue-600">{stats.updates}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Trash2 className="w-5 h-5 text-red-600" />
              <div>
                <p className="text-xs text-gray-500">Deletes</p>
                <p className="text-xl font-bold text-red-600">{stats.deletes}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-yellow-600" />
              <div>
                <p className="text-xs text-gray-500">Critical</p>
                <p className="text-xl font-bold text-yellow-600">{stats.critical}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Users className="w-5 h-5 text-purple-600" />
              <div>
                <p className="text-xs text-gray-500">Active Users</p>
                <p className="text-xl font-bold text-purple-600">{stats.uniqueUsers}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-wrap gap-4">
            <div className="flex-1 min-w-[200px] relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                placeholder="Search by user, entity, name..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={dateRange} onValueChange={setDateRange}>
              <SelectTrigger className="w-40">
                <Calendar className="w-4 h-4 mr-2" />
                <SelectValue placeholder="Time Range" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Time</SelectItem>
                <SelectItem value="today">Today</SelectItem>
                <SelectItem value="7days">Last 7 Days</SelectItem>
                <SelectItem value="30days">Last 30 Days</SelectItem>
                <SelectItem value="90days">Last 90 Days</SelectItem>
              </SelectContent>
            </Select>
            <Select value={actionFilter} onValueChange={setActionFilter}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Action" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Actions</SelectItem>
                <SelectItem value="create">Create</SelectItem>
                <SelectItem value="update">Update</SelectItem>
                <SelectItem value="delete">Delete</SelectItem>
                <SelectItem value="bulk_create">Bulk Create</SelectItem>
                <SelectItem value="bulk_update">Bulk Update</SelectItem>
                <SelectItem value="bulk_delete">Bulk Delete</SelectItem>
                <SelectItem value="view">View</SelectItem>
                <SelectItem value="export">Export</SelectItem>
                <SelectItem value="import">Import</SelectItem>
                <SelectItem value="login">Login</SelectItem>
                <SelectItem value="logout">Logout</SelectItem>
              </SelectContent>
            </Select>
            <Select value={entityFilter} onValueChange={setEntityFilter}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Entity" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Entities</SelectItem>
                {entityTypes.map(type => (
                  <SelectItem key={type} value={type}>{type}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={severityFilter} onValueChange={setSeverityFilter}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Severity" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Severity</SelectItem>
                <SelectItem value="info">Info</SelectItem>
                <SelectItem value="warning">Warning</SelectItem>
                <SelectItem value="critical">Critical</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Activity Timeline</CardTitle>
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList>
                <TabsTrigger value="timeline">Timeline</TabsTrigger>
                <TabsTrigger value="grouped">By Date</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
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
              <p className="text-sm mt-2">Activity will appear here when users interact with the system</p>
            </div>
          ) : activeTab === 'timeline' ? (
            <div className="space-y-3">
              {filteredLogs.slice(0, 100).map((log) => {
                const ActionIcon = ACTION_ICONS[log.action] || Eye;
                const SeverityIcon = SEVERITY_ICONS[log.severity] || Info;
                return (
                  <div 
                    key={log.id} 
                    className={`flex items-start gap-4 p-4 border rounded-lg hover:bg-gray-50 cursor-pointer transition-colors ${
                      log.severity === 'critical' ? 'border-red-200 bg-red-50/50' :
                      log.severity === 'warning' ? 'border-yellow-200 bg-yellow-50/50' : ''
                    }`}
                    onClick={() => setSelectedLog(log)}
                  >
                    <div className={`p-2 rounded-lg ${ACTION_COLORS[log.action] || 'bg-gray-100 text-gray-700'}`}>
                      <ActionIcon className="w-4 h-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <span className="font-medium text-gray-900">{log.user_name || log.user_email}</span>
                        <Badge variant="outline" className="capitalize text-xs">{log.action.replace('_', ' ')}</Badge>
                        {log.severity && log.severity !== 'info' && (
                          <Badge className={`${SEVERITY_COLORS[log.severity]} text-xs`}>
                            <SeverityIcon className="w-3 h-3 mr-1" />
                            {log.severity}
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-gray-600">
                        {log.action === 'view' ? 'Viewed' : 
                         log.action === 'create' ? 'Created' : 
                         log.action === 'update' ? 'Updated' : 
                         log.action === 'delete' ? 'Deleted' :
                         log.action === 'bulk_create' ? 'Bulk created' :
                         log.action === 'bulk_update' ? 'Bulk updated' :
                         log.action === 'bulk_delete' ? 'Bulk deleted' :
                         log.action} 
                        {' '}<span className="font-medium">{log.entity_type}</span>
                        {log.entity_name && `: ${log.entity_name}`}
                      </p>
                      {log.ip_address && log.ip_address !== 'unknown' && (
                        <p className="text-xs text-gray-400 mt-1">IP: {log.ip_address}</p>
                      )}
                    </div>
                    <div className="text-right text-sm text-gray-500">
                      <div className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {format(new Date(log.created_date), 'HH:mm:ss')}
                      </div>
                      <p className="text-xs text-gray-400">{format(new Date(log.created_date), 'MMM d, yyyy')}</p>
                    </div>
                  </div>
                );
              })}
              {filteredLogs.length > 100 && (
                <p className="text-center text-gray-500 py-4">
                  Showing 100 of {filteredLogs.length} records. Use filters to narrow down results.
                </p>
              )}
            </div>
          ) : (
            <div className="space-y-6">
              {Object.entries(groupedByDate).slice(0, 30).map(([date, dateLogs]) => (
                <div key={date}>
                  <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                    <Calendar className="w-4 h-4" />
                    {format(new Date(date), 'EEEE, MMMM d, yyyy')}
                    <Badge variant="outline">{dateLogs.length} events</Badge>
                  </h3>
                  <div className="space-y-2 pl-6 border-l-2 border-gray-200">
                    {dateLogs.map((log) => {
                      const ActionIcon = ACTION_ICONS[log.action] || Eye;
                      return (
                        <div 
                          key={log.id}
                          className="flex items-center gap-3 p-2 hover:bg-gray-50 rounded cursor-pointer"
                          onClick={() => setSelectedLog(log)}
                        >
                          <div className={`p-1.5 rounded ${ACTION_COLORS[log.action] || 'bg-gray-100 text-gray-700'}`}>
                            <ActionIcon className="w-3 h-3" />
                          </div>
                          <span className="text-sm text-gray-500 w-16">{format(new Date(log.created_date), 'HH:mm')}</span>
                          <span className="text-sm font-medium text-gray-700">{log.user_name || log.user_email}</span>
                          <Badge variant="outline" className="text-xs capitalize">{log.action.replace('_', ' ')}</Badge>
                          <span className="text-sm text-gray-600">{log.entity_type}</span>
                          {log.entity_name && <span className="text-sm text-gray-400 truncate max-w-[200px]">: {log.entity_name}</span>}
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={!!selectedLog} onOpenChange={() => setSelectedLog(null)}>
        <DialogContent className="max-w-2xl bg-white">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Shield className="w-5 h-5" />
              Audit Log Details
            </DialogTitle>
          </DialogHeader>
          {selectedLog && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-xs text-gray-500 uppercase">User</Label>
                  <p className="font-medium">{selectedLog.user_name || selectedLog.user_email}</p>
                  {selectedLog.user_name && <p className="text-sm text-gray-500">{selectedLog.user_email}</p>}
                </div>
                <div>
                  <Label className="text-xs text-gray-500 uppercase">Action</Label>
                  <div className="flex gap-2">
                    <Badge className={ACTION_COLORS[selectedLog.action]}>{selectedLog.action.replace('_', ' ')}</Badge>
                    {selectedLog.severity && selectedLog.severity !== 'info' && (
                      <Badge className={SEVERITY_COLORS[selectedLog.severity]}>{selectedLog.severity}</Badge>
                    )}
                  </div>
                </div>
                <div>
                  <Label className="text-xs text-gray-500 uppercase">Entity Type</Label>
                  <p className="font-medium">{selectedLog.entity_type}</p>
                </div>
                <div>
                  <Label className="text-xs text-gray-500 uppercase">Entity</Label>
                  <p className="font-medium">{selectedLog.entity_name || selectedLog.entity_id || '-'}</p>
                </div>
                <div>
                  <Label className="text-xs text-gray-500 uppercase">Timestamp</Label>
                  <p className="font-medium">{format(new Date(selectedLog.created_date), 'PPpp')}</p>
                </div>
                <div>
                  <Label className="text-xs text-gray-500 uppercase">IP Address</Label>
                  <p className="font-medium">{selectedLog.ip_address || 'Not recorded'}</p>
                </div>
              </div>
              
              {selectedLog.user_agent && selectedLog.user_agent !== 'unknown' && (
                <div>
                  <Label className="text-xs text-gray-500 uppercase">Browser / Device</Label>
                  <p className="text-sm text-gray-600 truncate">{selectedLog.user_agent}</p>
                </div>
              )}
              
              {selectedLog.changes && (
                <div>
                  <Label className="text-xs text-gray-500 uppercase mb-2">Changes Made</Label>
                  <div className="bg-gray-50 rounded-lg p-4 space-y-2 max-h-64 overflow-auto">
                    {(() => {
                      try {
                        const changes = JSON.parse(selectedLog.changes);
                        return Object.entries(changes).map(([field, value]) => (
                          <div key={field} className="border-b border-gray-200 pb-2 last:border-0">
                            <p className="font-medium text-gray-700 capitalize">{field.replace(/_/g, ' ')}</p>
                            <div className="grid grid-cols-2 gap-2 mt-1">
                              <div>
                                <p className="text-xs text-gray-500">Previous</p>
                                <p className="text-sm text-red-600 bg-red-50 p-1 rounded">
                                  {value.old !== undefined && value.old !== null ? String(value.old) : '(empty)'}
                                </p>
                              </div>
                              <div>
                                <p className="text-xs text-gray-500">New</p>
                                <p className="text-sm text-green-600 bg-green-50 p-1 rounded">
                                  {value.new !== undefined && value.new !== null ? String(value.new) : '(empty)'}
                                </p>
                              </div>
                            </div>
                          </div>
                        ));
                      } catch {
                        return <pre className="text-xs">{selectedLog.changes}</pre>;
                      }
                    })()}
                  </div>
                </div>
              )}

              {selectedLog.metadata && (
                <div>
                  <Label className="text-xs text-gray-500 uppercase mb-2">Additional Info</Label>
                  <pre className="bg-gray-50 p-3 rounded-lg text-xs overflow-auto max-h-32">
                    {JSON.stringify(JSON.parse(selectedLog.metadata), null, 2)}
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