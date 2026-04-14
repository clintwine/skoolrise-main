import React, { useState, useMemo } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { DollarSign, TrendingUp, Users, AlertCircle, Plus, FileText, Calendar, Upload } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { createPageUrl } from '../utils';
import BulkPaymentImport from '../components/fees/BulkPaymentImport';
import { useCurrency } from '../components/CurrencyProvider';
import EmptyState from '../components/common/EmptyState';

export default function FeesManagement() {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [isImportOpen, setIsImportOpen] = useState(false);
  const queryClient = useQueryClient();
  const { formatAmount } = useCurrency();

  const { data: user, isLoading: isLoadingUser } = useQuery({
    queryKey: ['current-user'],
    queryFn: () => base44.auth.me(),
  });

  // Check authorization
  const userType = user?.user_type || '';
  const isAdmin = user?.role === 'admin' || userType === 'admin';
  const isVendor = userType === 'vendor';
  const isAuthorized = isAdmin || isVendor;

  const { data: invoices = [], isLoading } = useQuery({
    queryKey: ['invoices'],
    queryFn: () => base44.entities.FeeInvoice.list('-created_date'),
    enabled: !isLoadingUser && isAuthorized,
  });

  // Redirect unauthorized users
  if (!isLoadingUser && user && !isAuthorized) {
    navigate(createPageUrl('TeacherDashboard'));
    return null;
  }

  // Memoized filtered invoices
  const filteredInvoices = useMemo(() => invoices.filter(invoice => {
    const matchesSearch = invoice.student_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         invoice.invoice_number?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === 'all' || invoice.status === filterStatus;
    return matchesSearch && matchesStatus;
  }), [invoices, searchTerm, filterStatus]);

  // Memoized financial metrics
  const financialMetrics = useMemo(() => ({
    totalInvoiced: invoices.reduce((sum, inv) => sum + (inv.total_amount || 0), 0),
    totalPaid: invoices.reduce((sum, inv) => sum + (inv.amount_paid || 0), 0),
    totalOutstanding: invoices.reduce((sum, inv) => sum + (inv.balance || 0), 0),
    overdueInvoices: invoices.filter(inv => 
      inv.status === 'Overdue' || 
      (inv.status === 'Partially Paid' && inv.due_date && new Date(inv.due_date) < new Date())
    ).length
  }), [invoices]);

  const { totalInvoiced, totalPaid, totalOutstanding, overdueInvoices } = financialMetrics;
  const isFiltered = searchTerm || filterStatus !== 'all';
  const clearFilters = () => { setSearchTerm(''); setFilterStatus('all'); };

  if (isLoadingUser) {
    return <div className="text-center py-12"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-accent mx-auto"></div></div>;
  }

  return (
    <div className="space-y-4 sm:space-y-6 px-2 sm:px-0">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
        <div>
          <h1 className="text-2xl sm:text-4xl font-bold text-text">Fees Management</h1>
          <p className="text-sm sm:text-base text-text-secondary mt-1 sm:mt-2">Manage student invoices and payments</p>
        </div>
        <div className="flex flex-wrap gap-2 sm:gap-3">
          <Button variant="outline" onClick={() => navigate(createPageUrl('FeePolicies'))} size="sm" className="text-xs sm:text-sm">
            <FileText className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
            <span className="hidden sm:inline">Fee </span>Policies
          </Button>
          <Button variant="outline" onClick={() => navigate(createPageUrl('InstalmentPlans'))} size="sm" className="text-xs sm:text-sm">
            <Calendar className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
            <span className="hidden sm:inline">Instalment </span>Plans
          </Button>
          <Button variant="outline" onClick={() => setIsImportOpen(true)} size="sm" className="text-xs sm:text-sm">
            <Upload className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
            Import
          </Button>
          <Button onClick={() => navigate(createPageUrl('CreateInvoice'))} className="bg-accent hover:bg-accent-hover" size="sm">
            <Plus className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
            <span className="hidden sm:inline">New </span>Invoice
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6">
        <Card className="bg-gradient-to-br from-blue-50 to-blue-100">
          <CardContent className="p-4 sm:p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs sm:text-sm font-medium text-blue-700">Total Invoiced</p>
                <p className="text-lg sm:text-3xl font-bold text-blue-900 mt-1 sm:mt-2">{formatAmount(totalInvoiced)}</p>
              </div>
              <DollarSign className="w-8 h-8 sm:w-12 sm:h-12 text-blue-600 opacity-50" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-50 to-green-100">
          <CardContent className="p-4 sm:p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs sm:text-sm font-medium text-green-700">Total Paid</p>
                <p className="text-lg sm:text-3xl font-bold text-green-900 mt-1 sm:mt-2">{formatAmount(totalPaid)}</p>
              </div>
              <TrendingUp className="w-8 h-8 sm:w-12 sm:h-12 text-green-600 opacity-50" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-orange-50 to-orange-100">
          <CardContent className="p-4 sm:p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs sm:text-sm font-medium text-orange-700">Outstanding</p>
                <p className="text-lg sm:text-3xl font-bold text-orange-900 mt-1 sm:mt-2">{formatAmount(totalOutstanding)}</p>
              </div>
              <Users className="w-8 h-8 sm:w-12 sm:h-12 text-orange-600 opacity-50" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-red-50 to-red-100">
          <CardContent className="p-4 sm:p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs sm:text-sm font-medium text-red-700">Overdue</p>
                <p className="text-lg sm:text-3xl font-bold text-red-900 mt-1 sm:mt-2">{overdueInvoices}</p>
              </div>
              <AlertCircle className="w-8 h-8 sm:w-12 sm:h-12 text-red-600 opacity-50" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-3 sm:p-6">
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
            <Input
              placeholder="Search invoices..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="flex-1 text-sm"
            />
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="Unpaid">Unpaid</SelectItem>
                <SelectItem value="Partially Paid">Partially Paid</SelectItem>
                <SelectItem value="Paid">Paid</SelectItem>
                <SelectItem value="Overdue">Overdue</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Invoices - Cards on mobile, Table on desktop */}
      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-accent mx-auto"></div>
            </div>
          ) : (
            <>
              {filteredInvoices.length === 0 ? (
                <EmptyState
                  icon={DollarSign}
                  title="No invoices yet"
                  description="Create your first invoice to get started."
                  actionLabel="Create Invoice"
                  onAction={() => navigate(createPageUrl('CreateInvoice'))}
                  isFiltered={isFiltered}
                  onClearFilters={clearFilters}
                />
              ) : (
              <>
              {/* Mobile view - Cards */}
              <div className="sm:hidden divide-y">
                {filteredInvoices.map((invoice) => (
                  <div key={invoice.id} className="p-4">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <p className="font-medium text-gray-900 text-sm">{invoice.student_name}</p>
                        <p className="text-xs text-gray-500">#{invoice.invoice_number}</p>
                      </div>
                      <Badge className={`text-xs ${
                        invoice.status === 'Paid' ? 'bg-green-100 text-green-900 border border-green-200' :
                        invoice.status === 'Partially Paid' ? 'bg-blue-100 text-blue-900 border border-blue-200' :
                        invoice.status === 'Overdue' ? 'bg-red-100 text-red-900 border border-red-200' :
                        'bg-gray-100 text-gray-900 border border-gray-200'
                      }`}>
                        {invoice.status}
                      </Badge>
                    </div>
                    <div className="flex justify-between items-center text-xs text-gray-600 mb-2">
                      <span>Due: {invoice.due_date}</span>
                      <span className="font-medium text-orange-600">{formatAmount(invoice.balance)} due</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-semibold">{formatAmount(invoice.total_amount)}</span>
                      <Link to={createPageUrl(`InvoiceDetail?id=${invoice.id}`)}>
                        <Button variant="outline" size="sm" className="text-xs">View</Button>
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
              
              {/* Desktop view - Table */}
              <div className="hidden sm:block overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b">
                    <tr>
                      <th className="px-4 lg:px-6 py-3 text-left text-xs font-semibold text-gray-900">Invoice #</th>
                      <th className="px-4 lg:px-6 py-3 text-left text-xs font-semibold text-gray-900">Student</th>
                      <th className="px-4 lg:px-6 py-3 text-left text-xs font-semibold text-gray-900 hidden lg:table-cell">Date</th>
                      <th className="px-4 lg:px-6 py-3 text-left text-xs font-semibold text-gray-900">Due Date</th>
                      <th className="px-4 lg:px-6 py-3 text-right text-xs font-semibold text-gray-900">Amount</th>
                      <th className="px-4 lg:px-6 py-3 text-right text-xs font-semibold text-gray-900 hidden lg:table-cell">Paid</th>
                      <th className="px-4 lg:px-6 py-3 text-right text-xs font-semibold text-gray-900">Balance</th>
                      <th className="px-4 lg:px-6 py-3 text-center text-xs font-semibold text-gray-900">Status</th>
                      <th className="px-4 lg:px-6 py-3 text-center text-xs font-semibold text-gray-900">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {filteredInvoices.map((invoice) => (
                      <tr key={invoice.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-4 lg:px-6 py-3 text-xs font-medium text-gray-900">{invoice.invoice_number}</td>
                        <td className="px-4 lg:px-6 py-3 text-xs text-gray-900">{invoice.student_name}</td>
                        <td className="px-4 lg:px-6 py-3 text-xs text-gray-600 hidden lg:table-cell">{invoice.invoice_date}</td>
                        <td className="px-4 lg:px-6 py-3 text-xs text-gray-600">{invoice.due_date}</td>
                        <td className="px-4 lg:px-6 py-3 text-xs font-medium text-gray-900 text-right">{formatAmount(invoice.total_amount)}</td>
                        <td className="px-4 lg:px-6 py-3 text-xs text-green-600 font-medium text-right hidden lg:table-cell">{formatAmount(invoice.amount_paid)}</td>
                        <td className="px-4 lg:px-6 py-3 text-xs text-orange-600 font-medium text-right">{formatAmount(invoice.balance)}</td>
                        <td className="px-4 lg:px-6 py-3 text-center">
                          <Badge className={`text-xs ${
                            invoice.status === 'Paid' ? 'bg-green-100 text-green-800' :
                            invoice.status === 'Partially Paid' ? 'bg-blue-100 text-blue-800' :
                            invoice.status === 'Overdue' ? 'bg-red-100 text-red-800' :
                            'bg-gray-100 text-gray-800'
                          }`}>
                            {invoice.status}
                          </Badge>
                        </td>
                        <td className="px-4 lg:px-6 py-3 text-center">
                          <Link to={createPageUrl(`InvoiceDetail?id=${invoice.id}`)}>
                            <Button variant="outline" size="sm" className="text-xs">View</Button>
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              </>
              )}
            </>
          )}
        </CardContent>
      </Card>

      <BulkPaymentImport
        open={isImportOpen}
        onClose={() => setIsImportOpen(false)}
        onSuccess={() => {
          queryClient.invalidateQueries(['invoices']);
        }}
      />
    </div>
  );
}