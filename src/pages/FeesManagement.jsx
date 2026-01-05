import React, { useState, useEffect } from 'react';
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

  // Redirect if user is not admin or vendor
  useEffect(() => {
    if (!isLoadingUser && user) {
      const userType = user.user_type || '';
      const isAdmin = user.role === 'admin' || userType === 'admin';
      const isVendor = userType === 'vendor';
      
      if (!isAdmin && !isVendor) {
        navigate(createPageUrl('TeacherDashboard'));
      }
    }
  }, [user, isLoadingUser, navigate]);

  const { data: invoices = [], isLoading } = useQuery({
    queryKey: ['invoices'],
    queryFn: () => base44.entities.FeeInvoice.list('-created_date'),
    enabled: !isLoadingUser && user && (user.role === 'admin' || user.user_type === 'admin' || user.user_type === 'vendor'),
  });

  const filteredInvoices = invoices.filter(invoice => {
    const matchesSearch = invoice.student_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         invoice.invoice_number?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === 'all' || invoice.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  const totalInvoiced = invoices.reduce((sum, inv) => sum + (inv.total_amount || 0), 0);
  const totalPaid = invoices.reduce((sum, inv) => sum + (inv.paid_amount || 0), 0);
  const totalOutstanding = invoices.reduce((sum, inv) => sum + (inv.balance || 0), 0);
  const overdueInvoices = invoices.filter(inv => 
    inv.status === 'Overdue' || 
    (inv.status === 'Partially Paid' && inv.due_date && new Date(inv.due_date) < new Date())
  ).length;

  if (isLoadingUser) {
    return <div className="text-center py-12"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-accent mx-auto"></div></div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-4xl font-bold text-text">Fees Management</h1>
          <p className="text-text-secondary mt-2">Manage student invoices and payments</p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" onClick={() => navigate(createPageUrl('FeePolicies'))}>
            <FileText className="w-4 h-4 mr-2" />
            Fee Policies
          </Button>
          <Button variant="outline" onClick={() => navigate(createPageUrl('InstalmentPlans'))}>
            <Calendar className="w-4 h-4 mr-2" />
            Instalment Plans
          </Button>
          <Button variant="outline" onClick={() => setIsImportOpen(true)}>
            <Upload className="w-4 h-4 mr-2" />
            Bulk Import
          </Button>
          <Button onClick={() => navigate(createPageUrl('CreateInvoice'))} className="bg-accent hover:bg-accent-hover">
            <Plus className="w-4 h-4 mr-2" />
            New Invoice
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="bg-gradient-to-br from-blue-50 to-blue-100">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-blue-700">Total Invoiced</p>
                <p className="text-3xl font-bold text-blue-900 mt-2">{formatAmount(totalInvoiced)}</p>
              </div>
              <DollarSign className="w-12 h-12 text-blue-600 opacity-50" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-50 to-green-100">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-green-700">Total Paid</p>
                <p className="text-3xl font-bold text-green-900 mt-2">{formatAmount(totalPaid)}</p>
              </div>
              <TrendingUp className="w-12 h-12 text-green-600 opacity-50" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-orange-50 to-orange-100">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-orange-700">Outstanding</p>
                <p className="text-3xl font-bold text-orange-900 mt-2">{formatAmount(totalOutstanding)}</p>
              </div>
              <Users className="w-12 h-12 text-orange-600 opacity-50" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-red-50 to-red-100">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-red-700">Overdue</p>
                <p className="text-3xl font-bold text-red-900 mt-2">{overdueInvoices}</p>
              </div>
              <AlertCircle className="w-12 h-12 text-red-600 opacity-50" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row gap-4">
            <Input
              placeholder="Search by student name or invoice number..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="flex-1"
            />
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-full md:w-48">
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

      {/* Invoices Table */}
      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-accent mx-auto"></div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Invoice #</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Student</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Date</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Due Date</th>
                    <th className="px-6 py-4 text-right text-sm font-semibold text-gray-900">Amount</th>
                    <th className="px-6 py-4 text-right text-sm font-semibold text-gray-900">Paid</th>
                    <th className="px-6 py-4 text-right text-sm font-semibold text-gray-900">Balance</th>
                    <th className="px-6 py-4 text-center text-sm font-semibold text-gray-900">Status</th>
                    <th className="px-6 py-4 text-center text-sm font-semibold text-gray-900">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {filteredInvoices.map((invoice) => (
                    <tr key={invoice.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 text-sm font-medium text-gray-900">{invoice.invoice_number}</td>
                      <td className="px-6 py-4 text-sm text-gray-900">{invoice.student_name}</td>
                      <td className="px-6 py-4 text-sm text-gray-600">{invoice.invoice_date}</td>
                      <td className="px-6 py-4 text-sm text-gray-600">{invoice.due_date}</td>
                      <td className="px-6 py-4 text-sm font-medium text-gray-900 text-right">{formatAmount(invoice.total_amount)}</td>
                      <td className="px-6 py-4 text-sm text-green-600 font-medium text-right">{formatAmount(invoice.paid_amount)}</td>
                      <td className="px-6 py-4 text-sm text-orange-600 font-medium text-right">{formatAmount(invoice.balance)}</td>
                      <td className="px-6 py-4 text-center">
                        <Badge className={`${
                          invoice.status === 'Paid' ? 'bg-green-100 text-green-800' :
                          invoice.status === 'Partially Paid' ? 'bg-blue-100 text-blue-800' :
                          invoice.status === 'Overdue' ? 'bg-red-100 text-red-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {invoice.status}
                        </Badge>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <Link to={createPageUrl(`InvoiceDetail?id=${invoice.id}`)}>
                          <Button variant="outline" size="sm">View</Button>
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
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