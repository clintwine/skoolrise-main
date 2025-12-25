import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Search, Plus, DollarSign, Receipt, AlertCircle, Upload, FileText } from 'lucide-react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '../utils';
import { format } from 'date-fns';
import BulkPaymentImport from '../components/fees/BulkPaymentImport';

export default function FeesManagement() {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [isImportOpen, setIsImportOpen] = useState(false);
  const queryClient = useQueryClient();

  const { data: invoices = [], isLoading } = useQuery({
    queryKey: ['invoices'],
    queryFn: () => base44.entities.FeeInvoice.list('-created_date'),
  });

  const filteredInvoices = invoices.filter((invoice) => {
    const matchesSearch = invoice.student_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          invoice.invoice_number?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === 'all' || invoice.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  const statusColors = {
    Pending: 'bg-yellow-100 text-yellow-800',
    'Partially Paid': 'bg-blue-100 text-blue-800',
    Paid: 'bg-green-100 text-green-800',
    Overdue: 'bg-red-100 text-red-800',
  };

  const totalAmount = invoices.reduce((sum, inv) => sum + (inv.total_amount || 0), 0);
  const totalPaid = invoices.reduce((sum, inv) => sum + (inv.amount_paid || 0), 0);
  const totalOutstanding = totalAmount - totalPaid;
  const overdueCount = invoices.filter(inv => inv.status === 'Overdue').length;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Fees Management</h1>
          <p className="text-gray-600 mt-1">Track invoices, payments, and debtors</p>
        </div>
        <div className="flex gap-2">
          <Link to={createPageUrl('FeePolicies')}>
            <Button variant="outline">
              <FileText className="w-4 h-4 mr-2" />
              Fee Policies
            </Button>
          </Link>
          <Link to={createPageUrl('InstalmentPlans')}>
            <Button variant="outline">
              <DollarSign className="w-4 h-4 mr-2" />
              Instalment Plans
            </Button>
          </Link>
          <Button onClick={() => setIsImportOpen(true)} variant="outline">
            <Upload className="w-4 h-4 mr-2" />
            Bulk Import
          </Button>
          <Link to={createPageUrl('CreateInvoice')}>
            <Button className="bg-blue-600 hover:bg-blue-700">
              <Plus className="w-4 h-4 mr-2" />
              Create Invoice
            </Button>
          </Link>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-white shadow-md">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Invoiced</p>
                <p className="text-2xl font-bold text-gray-900">${totalAmount.toLocaleString()}</p>
              </div>
              <DollarSign className="w-8 h-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>
        <Card className="bg-white shadow-md">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Paid</p>
                <p className="text-2xl font-bold text-green-600">${totalPaid.toLocaleString()}</p>
              </div>
              <Receipt className="w-8 h-8 text-green-600" />
            </div>
          </CardContent>
        </Card>
        <Card className="bg-white shadow-md">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Outstanding</p>
                <p className="text-2xl font-bold text-orange-600">${totalOutstanding.toLocaleString()}</p>
              </div>
              <AlertCircle className="w-8 h-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>
        <Card className="bg-white shadow-md">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Overdue</p>
                <p className="text-2xl font-bold text-red-600">{overdueCount}</p>
              </div>
              <AlertCircle className="w-8 h-8 text-red-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card className="bg-white shadow-md">
        <CardContent className="p-4">
          <div className="flex gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <Input
                placeholder="Search by student name or invoice number..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-4 py-2 border rounded-lg"
            >
              <option value="all">All Status</option>
              <option value="Pending">Pending</option>
              <option value="Partially Paid">Partially Paid</option>
              <option value="Paid">Paid</option>
              <option value="Overdue">Overdue</option>
            </select>
          </div>
        </CardContent>
      </Card>

      {/* Invoices Table */}
      {isLoading ? (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
        </div>
      ) : (
        <Card className="bg-white shadow-md">
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Invoice #</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Student</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Invoice Date</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Due Date</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Amount</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Paid</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Balance</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {filteredInvoices.map((invoice) => (
                    <tr key={invoice.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 text-sm font-medium text-gray-900">{invoice.invoice_number}</td>
                      <td className="px-6 py-4 text-sm text-gray-900">{invoice.student_name}</td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {invoice.invoice_date ? format(new Date(invoice.invoice_date), 'MMM d, yyyy') : '-'}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {invoice.due_date ? format(new Date(invoice.due_date), 'MMM d, yyyy') : '-'}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900">${invoice.total_amount?.toLocaleString()}</td>
                      <td className="px-6 py-4 text-sm text-green-600">${invoice.amount_paid?.toLocaleString()}</td>
                      <td className="px-6 py-4 text-sm text-orange-600">${invoice.balance?.toLocaleString()}</td>
                      <td className="px-6 py-4">
                        <Badge className={statusColors[invoice.status]}>
                          {invoice.status}
                        </Badge>
                      </td>
                      <td className="px-6 py-4">
                        <Link to={createPageUrl(`InvoiceDetail?id=${invoice.id}`)}>
                          <Button variant="outline" size="sm">View</Button>
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      <BulkPaymentImport
        open={isImportOpen}
        onOpenChange={setIsImportOpen}
        onImportComplete={() => {
          queryClient.invalidateQueries({ queryKey: ['invoices'] });
          setIsImportOpen(false);
        }}
      />
    </div>
  );
}