import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Package, ShoppingCart, AlertCircle } from 'lucide-react';
import ProcurementView from '../components/bookshop/ProcurementView';
import InventoryView from '../components/bookshop/InventoryView';
import PurchaseOrdersView from '../components/bookshop/PurchaseOrdersView';

export default function BookshopManager() {
  const { data: inventory = [] } = useQuery({
    queryKey: ['book-inventory'],
    queryFn: () => base44.entities.BookInventory.list(),
  });

  const { data: purchaseOrders = [] } = useQuery({
    queryKey: ['purchase-orders'],
    queryFn: () => base44.entities.PurchaseOrder.list('-order_date'),
  });

  const lowStockItems = inventory.filter(item => item.current_stock < item.reorder_level);
  const pendingPOs = purchaseOrders.filter(po => po.status === 'Pending Approval' || po.status === 'Approved');

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Bookshop Management</h1>
        <p className="text-gray-600 mt-1">Manage procurement, inventory, and sales</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-white shadow-md">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Low Stock Items</p>
                <p className="text-3xl font-bold text-red-600">{lowStockItems.length}</p>
              </div>
              <AlertCircle className="w-10 h-10 text-red-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white shadow-md">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Inventory Items</p>
                <p className="text-3xl font-bold text-blue-600">{inventory.length}</p>
              </div>
              <Package className="w-10 h-10 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white shadow-md">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Pending Purchase Orders</p>
                <p className="text-3xl font-bold text-orange-600">{pendingPOs.length}</p>
              </div>
              <ShoppingCart className="w-10 h-10 text-orange-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="procurement" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="procurement">Procurement</TabsTrigger>
          <TabsTrigger value="inventory">Inventory</TabsTrigger>
          <TabsTrigger value="purchase-orders">Purchase Orders</TabsTrigger>
        </TabsList>

        <TabsContent value="procurement" className="mt-6">
          <ProcurementView />
        </TabsContent>

        <TabsContent value="inventory" className="mt-6">
          <InventoryView />
        </TabsContent>

        <TabsContent value="purchase-orders" className="mt-6">
          <PurchaseOrdersView />
        </TabsContent>
      </Tabs>
    </div>
  );
}