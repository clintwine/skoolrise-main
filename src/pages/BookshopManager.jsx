import React from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { useSchoolContext } from '@/hooks/useSchoolContext';
import { addSchoolFilter } from '@/utils/schoolFilter';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Package, ShoppingCart, AlertCircle, Camera } from 'lucide-react';
import { Button } from '@/components/ui/button';
import ProcurementView from '../components/bookshop/ProcurementView';
import InventoryView from '../components/bookshop/InventoryView';
import PurchaseOrdersView from '../components/bookshop/PurchaseOrdersView';

export default function BookshopManager() {
  const { school_tenant_id, isReady } = useSchoolContext();

  const { data: inventory = [] } = useQuery({
    queryKey: ['book-inventory', school_tenant_id],
    queryFn: () => base44.entities.BookInventory.filter(addSchoolFilter({}, school_tenant_id)),
    enabled: isReady,
  });

  const { data: purchaseOrders = [] } = useQuery({
    queryKey: ['purchase-orders', school_tenant_id],
    queryFn: () => base44.entities.PurchaseOrder.filter(addSchoolFilter({}, school_tenant_id), '-order_date'),
    enabled: isReady,
  });

  const { data: scannerSettings = [] } = useQuery({
    queryKey: ['scanner-settings'],
    queryFn: () => base44.entities.ScannerSettings.list(),
  });

  const isbnScannerEnabled = scannerSettings.find(
    s => s.feature_name === 'bookshop_isbn' && s.enabled
  );

  const lowStockItems = inventory.filter(item => item.current_stock < item.reorder_level);
  const pendingPOs = purchaseOrders.filter(po => po.status === 'Pending Approval' || po.status === 'Approved');

  return (
    <div className="space-y-4 sm:space-y-6 p-4 sm:p-0">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Bookshop Management</h1>
        <p className="text-sm sm:text-base text-gray-600 mt-1">Manage procurement, inventory, and sales</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
        <Card className="bg-white shadow-md">
          <CardContent className="p-4 sm:p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs sm:text-sm text-gray-600">Low Stock Items</p>
                <p className="text-2xl sm:text-3xl font-bold text-red-600">{lowStockItems.length}</p>
              </div>
              <AlertCircle className="w-8 h-8 sm:w-10 sm:h-10 text-red-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white shadow-md">
          <CardContent className="p-4 sm:p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs sm:text-sm text-gray-600">Total Inventory Items</p>
                <p className="text-2xl sm:text-3xl font-bold text-blue-600">{inventory.length}</p>
              </div>
              <Package className="w-8 h-8 sm:w-10 sm:h-10 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white shadow-md">
          <CardContent className="p-4 sm:p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs sm:text-sm text-gray-600">Pending Purchase Orders</p>
                <p className="text-2xl sm:text-3xl font-bold text-orange-600">{pendingPOs.length}</p>
              </div>
              <ShoppingCart className="w-8 h-8 sm:w-10 sm:h-10 text-orange-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="procurement" className="w-full">
        <TabsList className="grid w-full grid-cols-3 h-10 sm:h-auto p-1">
          <TabsTrigger value="procurement" className="text-xs sm:text-base py-2">Procurement</TabsTrigger>
          <TabsTrigger value="inventory" className="text-xs sm:text-base py-2">Inventory</TabsTrigger>
          <TabsTrigger value="purchase-orders" className="text-xs sm:text-base py-2">Purchase Orders</TabsTrigger>
        </TabsList>

        <TabsContent value="procurement" className="mt-4 sm:mt-6">
          <ProcurementView scannerEnabled={isbnScannerEnabled} />
        </TabsContent>

        <TabsContent value="inventory" className="mt-4 sm:mt-6">
          <InventoryView />
        </TabsContent>

        <TabsContent value="purchase-orders" className="mt-4 sm:mt-6">
          <PurchaseOrdersView />
        </TabsContent>
      </Tabs>
    </div>
  );
}