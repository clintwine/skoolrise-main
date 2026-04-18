import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { useSchoolContext } from '@/hooks/useSchoolContext';
import { addSchoolFilter } from '@/utils/schoolFilter';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';
import { TrendingUp, DollarSign, Package, Repeat } from 'lucide-react';
import { useCurrency } from '@/components/CurrencyProvider';

export default function BookshopReports() {
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const { formatAmount } = useCurrency();
  const { school_tenant_id, isReady } = useSchoolContext();

  const { data: bookSales = [] } = useQuery({
    queryKey: ['book-sales', school_tenant_id],
    queryFn: () => base44.entities.BookSale.filter(addSchoolFilter({}, school_tenant_id), '-sale_date'),
    enabled: isReady,
  });

  const { data: purchaseOrders = [] } = useQuery({
    queryKey: ['purchase-orders', school_tenant_id],
    queryFn: () => base44.entities.PurchaseOrder.filter(addSchoolFilter({}, school_tenant_id)),
    enabled: isReady,
  });

  const { data: bookInventory = [] } = useQuery({
    queryKey: ['book-inventory', school_tenant_id],
    queryFn: () => base44.entities.BookInventory.filter(addSchoolFilter({}, school_tenant_id)),
    enabled: isReady,
  });

  const { data: vendors = [] } = useQuery({
    queryKey: ['vendors', school_tenant_id],
    queryFn: () => base44.entities.Vendor.filter(addSchoolFilter({}, school_tenant_id)),
    enabled: isReady,
  });

  const { data: bookCatalog = [] } = useQuery({
    queryKey: ['book-catalog', school_tenant_id],
    queryFn: () => base44.entities.BookCatalog.filter(addSchoolFilter({}, school_tenant_id)),
    enabled: isReady,
  });

  // Filter by date range
  const filteredSales = bookSales.filter(sale => {
    if (!startDate && !endDate) return true;
    const saleDate = new Date(sale.sale_date);
    const start = startDate ? new Date(startDate) : new Date('1900-01-01');
    const end = endDate ? new Date(endDate) : new Date('2100-12-31');
    return saleDate >= start && saleDate <= end;
  });

  const filteredPOs = purchaseOrders.filter(po => {
    if (!startDate && !endDate) return true;
    const poDate = new Date(po.order_date);
    const start = startDate ? new Date(startDate) : new Date('1900-01-01');
    const end = endDate ? new Date(endDate) : new Date('2100-12-31');
    return poDate >= start && poDate <= end;
  });

  // Best-selling books
  const salesByBook = filteredSales.reduce((acc, sale) => {
    if (!acc[sale.item_name]) {
      acc[sale.item_name] = { name: sale.item_name, quantity: 0, revenue: 0 };
    }
    acc[sale.item_name].quantity += sale.quantity_sold;
    acc[sale.item_name].revenue += sale.total_amount;
    return acc;
  }, {});

  const bestSellers = Object.values(salesByBook)
    .sort((a, b) => b.quantity - a.quantity)
    .slice(0, 10);

  // Vendor performance
  const vendorMetrics = vendors.map(vendor => {
    const vendorPOs = filteredPOs.filter(po => po.vendor_id === vendor.id);
    const totalPOs = vendorPOs.length;
    const receivedPOs = vendorPOs.filter(po => po.status === 'Received').length;
    const totalValue = vendorPOs.reduce((sum, po) => sum + (po.total_cost || 0), 0);
    const vendorBooks = bookCatalog.filter(book => book.vendor_id === vendor.id).length;
    
    return {
      name: vendor.business_name,
      totalPOs,
      receivedPOs,
      totalValue,
      booksInCatalog: vendorBooks,
      deliveryRate: totalPOs > 0 ? ((receivedPOs / totalPOs) * 100).toFixed(1) : 0,
    };
  }).sort((a, b) => b.totalValue - a.totalValue);

  // Inventory turnover
  const inventoryTurnover = bookInventory.map(item => {
    const itemSales = filteredSales.filter(sale => sale.item_id === item.id);
    const totalSold = itemSales.reduce((sum, sale) => sum + sale.quantity_sold, 0);
    const avgStock = item.current_stock + (totalSold / 2);
    const turnoverRate = avgStock > 0 ? (totalSold / avgStock).toFixed(2) : 0;
    
    return {
      name: item.item_name,
      sold: totalSold,
      current: item.current_stock,
      turnoverRate: parseFloat(turnoverRate),
      value: item.current_stock * item.retail_price,
    };
  }).sort((a, b) => b.turnoverRate - a.turnoverRate).slice(0, 15);

  // Stock value
  const totalStockValue = bookInventory.reduce((sum, item) => 
    sum + (item.current_stock * item.retail_price), 0
  );

  const totalCostValue = bookInventory.reduce((sum, item) => 
    sum + (item.current_stock * item.cost_price), 0
  );

  const totalRevenue = filteredSales.reduce((sum, sale) => sum + sale.total_amount, 0);
  const totalProfit = filteredSales.reduce((sum, sale) => sum + sale.total_profit, 0);

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D'];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Bookshop Reports & Analytics</h1>
        <p className="text-gray-600 mt-1">Advanced reporting dashboard</p>
      </div>

      {/* Date Range Filter */}
      <Card>
        <CardHeader>
          <CardTitle>Filter by Date Range</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            <div>
              <Label>Start Date</Label>
              <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
            </div>
            <div>
              <Label>End Date</Label>
              <Input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Revenue</p>
                <p className="text-2xl font-bold text-green-600">{formatAmount(totalRevenue)}</p>
              </div>
              <DollarSign className="w-8 h-8 text-green-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Profit</p>
                <p className="text-2xl font-bold text-blue-600">{formatAmount(totalProfit)}</p>
              </div>
              <TrendingUp className="w-8 h-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Stock Value (Retail)</p>
                <p className="text-2xl font-bold text-purple-600">{formatAmount(totalStockValue)}</p>
              </div>
              <Package className="w-8 h-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Stock Value (Cost)</p>
                <p className="text-2xl font-bold text-orange-600">{formatAmount(totalCostValue)}</p>
              </div>
              <Repeat className="w-8 h-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Best-Selling Books */}
      <Card>
        <CardHeader>
          <CardTitle>Best-Selling Books</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={bestSellers}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" angle={-45} textAnchor="end" height={100} />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="quantity" fill="#8884d8" name="Quantity Sold" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Vendor Performance */}
      <Card>
        <CardHeader>
          <CardTitle>Vendor Performance</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {vendorMetrics.map((vendor, idx) => (
              <div key={idx} className="p-4 bg-gray-50 rounded-lg">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <p className="font-semibold text-gray-900">{vendor.name}</p>
                    <p className="text-sm text-gray-600">Books in Catalog: {vendor.booksInCatalog}</p>
                  </div>
                  <Badge className="bg-blue-100 text-blue-800">
                    {vendor.deliveryRate}% Delivery Rate
                  </Badge>
                </div>
                <div className="grid grid-cols-3 gap-4 mt-3">
                  <div className="text-center p-2 bg-white rounded">
                    <p className="text-xs text-gray-600">Total POs</p>
                    <p className="text-lg font-bold text-blue-600">{vendor.totalPOs}</p>
                  </div>
                  <div className="text-center p-2 bg-white rounded">
                    <p className="text-xs text-gray-600">Received POs</p>
                    <p className="text-lg font-bold text-green-600">{vendor.receivedPOs}</p>
                  </div>
                  <div className="text-center p-2 bg-white rounded">
                    <p className="text-xs text-gray-600">Total Value</p>
                    <p className="text-lg font-bold text-purple-600">{formatAmount(vendor.totalValue)}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Inventory Turnover */}
      <Card>
        <CardHeader>
          <CardTitle>Inventory Turnover Rate (Top 15)</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {inventoryTurnover.map((item, idx) => (
              <div key={idx} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                <div>
                  <p className="font-medium text-gray-900">{item.name}</p>
                  <p className="text-sm text-gray-600">Sold: {item.sold} | Current Stock: {item.current}</p>
                </div>
                <div className="text-right">
                  <Badge className="bg-green-100 text-green-800">
                    Turnover: {item.turnoverRate}x
                  </Badge>
                  <p className="text-sm text-gray-600 mt-1">Value: {formatAmount(item.value)}</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}