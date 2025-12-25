import React from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle } from 'lucide-react';

export default function InventoryView() {
  const { data: inventory = [] } = useQuery({
    queryKey: ['book-inventory'],
    queryFn: () => base44.entities.BookInventory.list(),
  });

  const isLowStock = (item) => item.current_stock < item.reorder_level;

  return (
    <Card className="bg-white shadow-md">
      <CardHeader>
        <CardTitle>Inventory Status</CardTitle>
      </CardHeader>
      <CardContent>
        {inventory.length === 0 ? (
          <p className="text-center py-8 text-gray-500">No inventory items</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Item Name</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">SKU</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Current Stock</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Reorder Level</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Cost Price</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Retail Price</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {inventory.map((item) => {
                  const lowStock = isLowStock(item);
                  return (
                    <tr key={item.id} className={`hover:bg-gray-50 ${lowStock ? 'bg-red-50' : ''}`}>
                      <td className="px-6 py-4 text-sm font-medium text-gray-900">
                        <div className="flex items-center gap-2">
                          {lowStock && <AlertTriangle className="w-4 h-4 text-red-600" />}
                          {item.item_name}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">{item.sku}</td>
                      <td className={`px-6 py-4 text-sm font-semibold ${lowStock ? 'text-red-600' : 'text-gray-900'}`}>
                        {item.current_stock}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">{item.reorder_level}</td>
                      <td className="px-6 py-4 text-sm text-gray-900">${item.cost_price?.toFixed(2)}</td>
                      <td className="px-6 py-4 text-sm font-semibold text-green-600">${item.retail_price?.toFixed(2)}</td>
                      <td className="px-6 py-4">
                        <Badge className={
                          item.status === 'In Stock' ? 'bg-green-100 text-green-800' :
                          item.status === 'Low Stock' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-red-100 text-red-800'
                        }>
                          {lowStock ? 'Low Stock' : item.status}
                        </Badge>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}