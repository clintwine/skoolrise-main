import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

const statusClasses = {
  matched: 'bg-green-100 text-green-800 border-green-200',
  partial: 'bg-blue-100 text-blue-800 border-blue-200',
  pending: 'bg-amber-100 text-amber-800 border-amber-200',
  overdue: 'bg-red-100 text-red-800 border-red-200',
};

export default function InvoiceReconciliationTable({ invoices, formatAmount, activeProviderName }) {
  return (
    <Card className="border-0 shadow-sm bg-white">
      <CardHeader>
        <CardTitle>Invoice Reconciliation</CardTitle>
        <p className="text-sm text-gray-500">Current payment source: {activeProviderName || 'No active gateway selected'}</p>
      </CardHeader>
      <CardContent className="overflow-x-auto">
        <table className="w-full min-w-[720px]">
          <thead className="border-b bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700">Invoice</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700">Student</th>
              <th className="px-4 py-3 text-right text-xs font-semibold text-gray-700">Total</th>
              <th className="px-4 py-3 text-right text-xs font-semibold text-gray-700">Paid</th>
              <th className="px-4 py-3 text-right text-xs font-semibold text-gray-700">Balance</th>
              <th className="px-4 py-3 text-center text-xs font-semibold text-gray-700">Reconciliation</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {invoices.map((invoice) => (
              <tr key={invoice.id} className="hover:bg-gray-50">
                <td className="px-4 py-3 text-sm font-medium text-gray-900">{invoice.invoice_number}</td>
                <td className="px-4 py-3 text-sm text-gray-700">{invoice.student_name}</td>
                <td className="px-4 py-3 text-sm text-right text-gray-700">{formatAmount(invoice.total_amount || 0)}</td>
                <td className="px-4 py-3 text-sm text-right text-green-700">{formatAmount(invoice.amount_paid || 0)}</td>
                <td className="px-4 py-3 text-sm text-right text-orange-700">{formatAmount(invoice.balance || 0)}</td>
                <td className="px-4 py-3 text-center">
                  <Badge className={`border ${statusClasses[invoice.reconciliation_status] || statusClasses.pending}`}>
                    {invoice.reconciliation_label}
                  </Badge>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </CardContent>
    </Card>
  );
}