import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { useSchoolContext } from '@/hooks/useSchoolContext';
import { addSchoolFilter } from '@/utils/schoolFilter';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Package, ShoppingCart, BookOpen, Plus } from 'lucide-react';
import { format } from 'date-fns';
import BookRecommendationForm from '../components/bookshop/BookRecommendationForm';
import { useCurrency } from '@/components/CurrencyProvider';

export default function VendorDashboard() {
  const { user, school_tenant_id, isReady } = useSchoolContext();
  const [vendorId, setVendorId] = useState(null);
  const [showRecommendationForm, setShowRecommendationForm] = useState(false);
  const { formatAmount } = useCurrency();

  useEffect(() => {
    if (!user?.id) return;
    const fetchVendorId = async () => {
      try {
        if (user?.vendor_profile_id) {
          setVendorId(user.vendor_profile_id);
        } else {
          const vendors = await base44.entities.Vendor.filter({ user_id: user.id });
          if (vendors.length > 0) {
            setVendorId(vendors[0].id);
          }
        }
      } catch (error) {
        console.error('Error fetching vendor:', error);
      }
    };
    fetchVendorId();
  }, [user?.id]);

  const { data: vendor } = useQuery({
    queryKey: ['vendor', vendorId],
    queryFn: () => base44.entities.Vendor.get(vendorId),
    enabled: !!vendorId,
  });

  const { data: purchaseOrders = [] } = useQuery({
    queryKey: ['vendor-purchase-orders', vendorId, school_tenant_id],
    queryFn: async () => {
      const allOrders = await base44.entities.PurchaseOrder.filter(
        addSchoolFilter({ vendor_id: vendorId }, school_tenant_id), '-order_date'
      );
      return allOrders;
    },
    enabled: !!vendorId && isReady,
  });

  const { data: catalogItems = [] } = useQuery({
    queryKey: ['vendor-catalog', vendorId],
    queryFn: () => base44.entities.BookCatalog.filter({ vendor_id: vendorId }),
    enabled: !!vendorId,
  });

  if (!isReady || !vendorId) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading vendor dashboard...</p>
        </div>
      </div>
    );
  }

  const statusColors = {
    Draft: 'bg-gray-100 text-gray-800',
    'Pending Approval': 'bg-yellow-100 text-yellow-800',
    Approved: 'bg-blue-100 text-blue-800',
    Shipped: 'bg-purple-100 text-purple-800',
    Received: 'bg-green-100 text-green-800',
    Cancelled: 'bg-red-100 text-red-800',
  };

  const activePOs = purchaseOrders.filter(po => 
    ['Pending Approval', 'Approved', 'Shipped'].includes(po.status)
  );
  const totalPOValue = activePOs.reduce((sum, po) => sum + (po.total_cost || 0), 0);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Vendor Dashboard</h1>
          <p className="text-gray-600 mt-1">Welcome, {vendor?.business_name || user.full_name}</p>
        </div>
        <Button onClick={() => setShowRecommendationForm(true)} className="bg-blue-600 hover:bg-blue-700">
          <Plus className="w-4 h-4 mr-2" />
          Submit Book Recommendation
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="bg-white shadow-md">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Active Purchase Orders</p>
                <p className="text-3xl font-bold text-blue-600">{activePOs.length}</p>
              </div>
              <ShoppingCart className="w-10 h-10 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white shadow-md">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total PO Value</p>
                <p className="text-3xl font-bold text-green-600">{formatAmount(totalPOValue)}</p>
              </div>
              <Package className="w-10 h-10 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white shadow-md">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Books in Catalog</p>
                <p className="text-3xl font-bold text-purple-600">{catalogItems.length}</p>
              </div>
              <BookOpen className="w-10 h-10 text-purple-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Purchase Orders */}
      <Card className="bg-white shadow-md">
        <CardHeader>
          <CardTitle>Active Purchase Orders</CardTitle>
        </CardHeader>
        <CardContent>
          {activePOs.length === 0 ? (
            <p className="text-center py-8 text-gray-500">No active purchase orders</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">PO Number</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Order Date</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Expected Delivery</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Total Cost</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {activePOs.map((po) => (
                    <tr key={po.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 text-sm font-medium text-gray-900">{po.po_number}</td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {po.order_date ? format(new Date(po.order_date), 'MMM d, yyyy') : '-'}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {po.expected_delivery_date ? format(new Date(po.expected_delivery_date), 'MMM d, yyyy') : '-'}
                      </td>
                      <td className="px-6 py-4 text-sm font-semibold text-gray-900">{formatAmount(po.total_cost)}</td>
                      <td className="px-6 py-4">
                        <Badge className={statusColors[po.status]}>{po.status}</Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Catalog Items */}
      <Card className="bg-white shadow-md">
        <CardHeader>
          <CardTitle>Your Books in Catalog</CardTitle>
        </CardHeader>
        <CardContent>
          {catalogItems.length === 0 ? (
            <p className="text-center py-8 text-gray-500">No books in catalog yet</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Title</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">ISBN</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Author</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Grade Level</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Wholesale Price</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {catalogItems.map((item) => (
                    <tr key={item.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 text-sm font-medium text-gray-900">{item.title}</td>
                      <td className="px-6 py-4 text-sm text-gray-600">{item.isbn}</td>
                      <td className="px-6 py-4 text-sm text-gray-600">{item.author || '-'}</td>
                      <td className="px-6 py-4 text-sm text-gray-600">{item.grade_level || '-'}</td>
                      <td className="px-6 py-4 text-sm font-semibold text-green-600">{formatAmount(item.wholesale_price)}</td>
                      <td className="px-6 py-4">
                        <Badge className={item.status === 'Active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}>
                          {item.status}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Book Recommendation Form Dialog */}
      <Dialog open={showRecommendationForm} onOpenChange={setShowRecommendationForm}>
        <DialogContent className="max-w-2xl bg-white">
          <DialogHeader>
            <DialogTitle className="text-gray-900">Submit Book Recommendation</DialogTitle>
          </DialogHeader>
          <BookRecommendationForm
            vendorId={vendorId}
            vendorName={vendor?.business_name}
            onSuccess={() => setShowRecommendationForm(false)}
            onCancel={() => setShowRecommendationForm(false)}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}