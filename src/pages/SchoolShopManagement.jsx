import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Package, Plus, Edit, Trash2, ShoppingCart } from 'lucide-react';
import { useCurrency } from '@/components/CurrencyProvider';
import { toast } from 'sonner';

export default function SchoolShopManagement() {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    category: 'Other',
    price: 0,
    stock_quantity: 0,
    image_url: '',
    is_required: false,
    grade_levels: '',
    status: 'Active',
  });
  const queryClient = useQueryClient();
  const { formatAmount } = useCurrency();

  const { data: products = [], isLoading } = useQuery({
    queryKey: ['school-products'],
    queryFn: () => base44.entities.SchoolProduct.list('-created_date'),
  });

  const { data: orders = [] } = useQuery({
    queryKey: ['product-orders'],
    queryFn: () => base44.entities.ProductOrder.list('-created_date'),
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.SchoolProduct.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['school-products'] });
      setIsFormOpen(false);
      resetForm();
      toast.success('Product created successfully');
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.SchoolProduct.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['school-products'] });
      setIsFormOpen(false);
      resetForm();
      toast.success('Product updated successfully');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.SchoolProduct.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['school-products'] });
      toast.success('Product deleted');
    },
  });

  const updateOrderMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.ProductOrder.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['product-orders'] });
      toast.success('Order updated');
    },
  });

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      category: 'Other',
      price: 0,
      stock_quantity: 0,
      image_url: '',
      is_required: false,
      grade_levels: '',
      status: 'Active',
    });
    setEditingProduct(null);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (editingProduct) {
      updateMutation.mutate({ id: editingProduct.id, data: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  const handleEdit = (product) => {
    setEditingProduct(product);
    setFormData(product);
    setIsFormOpen(true);
  };

  const statusColors = {
    Active: 'bg-green-100 text-green-700',
    'Out of Stock': 'bg-red-100 text-red-700',
    Discontinued: 'bg-gray-100 text-gray-700',
  };

  const orderStatusColors = {
    Pending: 'bg-yellow-100 text-yellow-700',
    Paid: 'bg-blue-100 text-blue-700',
    Processing: 'bg-purple-100 text-purple-700',
    'Ready for Pickup': 'bg-orange-100 text-orange-700',
    Delivered: 'bg-green-100 text-green-700',
    Cancelled: 'bg-red-100 text-red-700',
  };

  const pendingOrders = orders.filter(o => o.status !== 'Delivered' && o.status !== 'Cancelled');

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">School Shop Management</h1>
          <p className="text-gray-600 mt-1">Manage products and orders</p>
        </div>
        <Button onClick={() => { resetForm(); setIsFormOpen(true); }} className="bg-blue-600 hover:bg-blue-700">
          <Plus className="w-4 h-4 mr-2" />
          Add Product
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-white shadow-md">
          <CardContent className="p-6">
            <p className="text-sm text-gray-600">Total Products</p>
            <p className="text-2xl font-bold text-gray-900">{products.length}</p>
          </CardContent>
        </Card>
        <Card className="bg-white shadow-md">
          <CardContent className="p-6">
            <p className="text-sm text-gray-600">Active Products</p>
            <p className="text-2xl font-bold text-green-600">{products.filter(p => p.status === 'Active').length}</p>
          </CardContent>
        </Card>
        <Card className="bg-white shadow-md">
          <CardContent className="p-6">
            <p className="text-sm text-gray-600">Pending Orders</p>
            <p className="text-2xl font-bold text-yellow-600">{pendingOrders.length}</p>
          </CardContent>
        </Card>
        <Card className="bg-white shadow-md">
          <CardContent className="p-6">
            <p className="text-sm text-gray-600">Total Revenue</p>
            <p className="text-2xl font-bold text-blue-600">
              {formatAmount(orders.filter(o => o.payment_status === 'Paid').reduce((sum, o) => sum + o.total_amount, 0))}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Products Table */}
      <Card className="bg-white shadow-md">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="w-5 h-5" />
            Products
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Product</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Category</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Price</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Stock</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {products.map(product => (
                  <tr key={product.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        {product.image_url ? (
                          <img src={product.image_url} alt="" className="w-10 h-10 rounded object-cover" />
                        ) : (
                          <div className="w-10 h-10 rounded bg-gray-100 flex items-center justify-center">
                            <Package className="w-5 h-5 text-gray-400" />
                          </div>
                        )}
                        <div>
                          <p className="font-medium text-gray-900">{product.name}</p>
                          {product.is_required && <Badge className="bg-red-100 text-red-700 text-xs">Required</Badge>}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">{product.category}</td>
                    <td className="px-4 py-3 text-sm font-medium text-gray-900">{formatAmount(product.price)}</td>
                    <td className="px-4 py-3 text-sm text-gray-600">{product.stock_quantity}</td>
                    <td className="px-4 py-3">
                      <Badge className={statusColors[product.status]}>{product.status}</Badge>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex gap-2 justify-end">
                        <Button variant="ghost" size="sm" onClick={() => handleEdit(product)}>
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => deleteMutation.mutate(product.id)}>
                          <Trash2 className="w-4 h-4 text-red-600" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Recent Orders */}
      <Card className="bg-white shadow-md">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ShoppingCart className="w-5 h-5" />
            Recent Orders
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {orders.slice(0, 10).map(order => (
              <div key={order.id} className="flex items-center justify-between p-4 border rounded-lg">
                <div>
                  <p className="font-medium text-gray-900">{order.order_number}</p>
                  <p className="text-sm text-gray-600">{order.student_name}</p>
                </div>
                <div className="flex items-center gap-4">
                  <span className="font-bold text-gray-900">{formatAmount(order.total_amount)}</span>
                  <Select 
                    value={order.status} 
                    onValueChange={(value) => updateOrderMutation.mutate({ id: order.id, data: { status: value } })}
                  >
                    <SelectTrigger className="w-40">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Pending">Pending</SelectItem>
                      <SelectItem value="Paid">Paid</SelectItem>
                      <SelectItem value="Processing">Processing</SelectItem>
                      <SelectItem value="Ready for Pickup">Ready for Pickup</SelectItem>
                      <SelectItem value="Delivered">Delivered</SelectItem>
                      <SelectItem value="Cancelled">Cancelled</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Product Form Dialog */}
      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent className="max-w-lg bg-white">
          <DialogHeader>
            <DialogTitle>{editingProduct ? 'Edit Product' : 'Add Product'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label>Product Name *</Label>
              <Input value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} required />
            </div>
            <div>
              <Label>Description</Label>
              <Textarea value={formData.description} onChange={(e) => setFormData({...formData, description: e.target.value})} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Category *</Label>
                <Select value={formData.category} onValueChange={(v) => setFormData({...formData, category: v})}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Uniform">Uniform</SelectItem>
                    <SelectItem value="Books">Books</SelectItem>
                    <SelectItem value="Stationery">Stationery</SelectItem>
                    <SelectItem value="Sports Equipment">Sports Equipment</SelectItem>
                    <SelectItem value="Technology">Technology</SelectItem>
                    <SelectItem value="Other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Status</Label>
                <Select value={formData.status} onValueChange={(v) => setFormData({...formData, status: v})}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Active">Active</SelectItem>
                    <SelectItem value="Out of Stock">Out of Stock</SelectItem>
                    <SelectItem value="Discontinued">Discontinued</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Price *</Label>
                <Input type="number" step="0.01" value={formData.price} onChange={(e) => setFormData({...formData, price: parseFloat(e.target.value)})} required />
              </div>
              <div>
                <Label>Stock Quantity</Label>
                <Input type="number" value={formData.stock_quantity} onChange={(e) => setFormData({...formData, stock_quantity: parseInt(e.target.value)})} />
              </div>
            </div>
            <div>
              <Label>Image URL</Label>
              <Input value={formData.image_url} onChange={(e) => setFormData({...formData, image_url: e.target.value})} placeholder="https://..." />
            </div>
            <div>
              <Label>Grade Levels (comma-separated)</Label>
              <Input value={formData.grade_levels} onChange={(e) => setFormData({...formData, grade_levels: e.target.value})} placeholder="e.g., JSS1, JSS2, SS1" />
            </div>
            <div className="flex items-center gap-2">
              <Switch checked={formData.is_required} onCheckedChange={(v) => setFormData({...formData, is_required: v})} />
              <Label>Required item for students</Label>
            </div>
            <div className="flex justify-end gap-3 pt-4 border-t">
              <Button type="button" variant="outline" onClick={() => setIsFormOpen(false)}>Cancel</Button>
              <Button type="submit" className="bg-blue-600 hover:bg-blue-700">
                {editingProduct ? 'Update' : 'Create'} Product
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}