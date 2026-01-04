import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { format } from 'date-fns';
import { Package } from 'lucide-react';
import { useCurrency } from '@/components/CurrencyProvider';

export default function PurchaseOrdersView() {
  const [selectedPO, setSelectedPO] = useState(null);
  const queryClient = useQueryClient();
  const { formatAmount } = useCurrency();

  const { data: purchaseOrders = [] } = useQuery({
    queryKey: ['purchase-orders'],
    queryFn: () => base44.entities.PurchaseOrder.list('-order_date'),
  });

  const receiveStockMutation = useMutation({
    mutationFn: async ({ poId, po }) => {
      const items = JSON.parse(po.items || '[]');
      
      // Update or create inventory items
      for (const item of items) {
        const existingInventory = await base44.entities.BookInventory.list();
        const inventoryItem = existingInventory.find(inv => inv.catalog_id === item.catalog_id);
        
        if (inventoryItem) {
          // Update existing inventory with weighted average cost
          const currentValue = inventoryItem.current_stock * inventoryItem.cost_price;
          const newValue = item.quantity * item.unit_price;
          const totalQuantity = inventoryItem.current_stock + item.quantity;
          const weightedAvgCost = (currentValue + newValue) / totalQuantity;
          
          await base44.entities.BookInventory.update(inventoryItem.id, {
            current_stock: totalQuantity,
            cost_price: weightedAvgCost,
            status: totalQuantity > inventoryItem.reorder_level ? 'In Stock' : 'Low Stock',
          });
        } else {
          // Create new inventory item
          await base44.entities.BookInventory.create({
            item_name: item.title,
            sku: `SKU-${item.isbn || Date.now()}`,
            catalog_id: item.catalog_id,
            catalog_title: item.title,
            current_stock: item.quantity,
            reorder_level: 10,
            cost_price: item.unit_price,
            retail_price: item.unit_price * 1.3, // 30% markup
            status: 'In Stock',
          });
        }
      }
      
      // Update PO status
      await base44.entities.PurchaseOrder.update(poId, {
        status: 'Received',
        received_date: new Date().toISOString().split('T')[0],
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['purchase-orders'] });
      queryClient.invalidateQueries({ queryKey: ['book-inventory'] });
      alert('Stock received and inventory updated successfully!');
      setSelectedPO(null);
    },
  });

  const updateStatusMutation = useMutation({
    mutationFn: async ({ poId, status, po }) => {
      if (status === 'Received') {
        await receiveStockMutation.mutateAsync({ poId, po });
      } else {
        await base44.entities.PurchaseOrder.update(poId, { status });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['purchase-orders'] });
    },
  });

  const handleStatusChange = (poId, newStatus, po) => {
    if (newStatus === 'Received') {
      if (!confirm('This will update inventory with received stock. Continue?')) return;
    }
    updateStatusMutation.mutate({ poId, status: newStatus, po });
  };

  const statusColors = {
    Draft: 'bg-gray-100 text-gray-800',
    'Pending Approval': 'bg-yellow-100 text-yellow-800',
    Approved: 'bg-blue-100 text-blue-800',
    Shipped: 'bg-purple-100 text-purple-800',
    Received: 'bg-green-100 text-green-800',
    Cancelled: 'bg-red-100 text-red-800',
  };

  return (
    <Card className="bg-white shadow-md">
      <CardHeader>
        <CardTitle>Purchase Orders</CardTitle>
      </CardHeader>
      <CardContent>
        {purchaseOrders.length === 0 ? (
          <p className="text-center py-8 text-gray-500">No purchase orders</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">PO Number</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Vendor</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Order Date</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Total Cost</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {purchaseOrders.map((po) => (
                  <tr key={po.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 text-sm font-medium text-gray-900">{po.po_number}</td>
                    <td className="px-6 py-4 text-sm text-gray-600">{po.vendor_name}</td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {po.order_date ? format(new Date(po.order_date), 'MMM d, yyyy') : '-'}
                    </td>
                    <td className="px-6 py-4 text-sm font-semibold text-gray-900">{formatAmount(po.total_cost)}</td>
                    <td className="px-6 py-4">
                      <Badge className={statusColors[po.status]}>{po.status}</Badge>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setSelectedPO(po)}
                        >
                          View
                        </Button>
                        {po.status !== 'Received' && po.status !== 'Cancelled' && (
                          <Select 
                            value={po.status} 
                            onValueChange={(value) => handleStatusChange(po.id, value, po)}
                          >
                            <SelectTrigger className="w-32 h-8">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="Draft">Draft</SelectItem>
                              <SelectItem value="Pending Approval">Pending Approval</SelectItem>
                              <SelectItem value="Approved">Approved</SelectItem>
                              <SelectItem value="Shipped">Shipped</SelectItem>
                              <SelectItem value="Received">Received</SelectItem>
                              <SelectItem value="Cancelled">Cancelled</SelectItem>
                            </SelectContent>
                          </Select>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {selectedPO && (
          <Dialog open={!!selectedPO} onOpenChange={() => setSelectedPO(null)}>
            <DialogContent className="max-w-3xl bg-white">
              <DialogHeader>
                <DialogTitle className="text-gray-900">Purchase Order Details</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-600">PO Number</p>
                    <p className="font-semibold">{selectedPO.po_number}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Vendor</p>
                    <p className="font-semibold">{selectedPO.vendor_name}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Order Date</p>
                    <p className="font-semibold">
                      {selectedPO.order_date ? format(new Date(selectedPO.order_date), 'MMM d, yyyy') : '-'}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Status</p>
                    <Badge className={statusColors[selectedPO.status]}>{selectedPO.status}</Badge>
                  </div>
                </div>

                <div>
                  <h3 className="font-semibold mb-2">Items</h3>
                  <div className="border rounded-lg overflow-hidden">
                    <table className="w-full">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Title</th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Quantity</th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Unit Price</th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Total</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y">
                        {JSON.parse(selectedPO.items || '[]').map((item, idx) => (
                          <tr key={idx}>
                            <td className="px-4 py-2 text-sm">{item.title}</td>
                            <td className="px-4 py-2 text-sm">{item.quantity}</td>
                            <td className="px-4 py-2 text-sm">{formatAmount(item.unit_price)}</td>
                            <td className="px-4 py-2 text-sm font-semibold">{formatAmount(item.total)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                <div className="pt-4 border-t">
                  <div className="flex justify-between items-center">
                    <span className="font-semibold">Total Cost:</span>
                    <span className="text-xl font-bold text-green-600">{formatAmount(selectedPO.total_cost)}</span>
                  </div>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </CardContent>
    </Card>
  );
}