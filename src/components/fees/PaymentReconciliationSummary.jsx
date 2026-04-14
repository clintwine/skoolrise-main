import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { CheckCircle2, AlertTriangle, Clock3, Wallet } from 'lucide-react';

const items = [
  { key: 'configured', label: 'Configured Gateways', icon: Wallet, color: 'bg-blue-100 text-blue-700' },
  { key: 'paid', label: 'Paid Invoices', icon: CheckCircle2, color: 'bg-green-100 text-green-700' },
  { key: 'partial', label: 'Partially Paid', icon: Clock3, color: 'bg-amber-100 text-amber-700' },
  { key: 'attention', label: 'Need Attention', icon: AlertTriangle, color: 'bg-red-100 text-red-700' },
];

export default function PaymentReconciliationSummary({ stats }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
      {items.map((item) => {
        const Icon = item.icon;
        return (
          <Card key={item.key} className="border-0 shadow-sm bg-white">
            <CardContent className="p-5 flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">{item.label}</p>
                <p className="text-2xl font-bold text-gray-900">{stats[item.key]}</p>
              </div>
              <div className={`w-11 h-11 rounded-xl flex items-center justify-center ${item.color}`}>
                <Icon className="w-5 h-5" />
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}