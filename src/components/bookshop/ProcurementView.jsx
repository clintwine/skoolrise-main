import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ShoppingCart, Camera, CheckCircle, BookOpen } from 'lucide-react';
import { toast } from 'sonner';
import Scanner from '../Scanner';
import { useCurrency } from '@/components/CurrencyProvider';

export default function ProcurementView({ scannerEnabled }) {
  const [selectedItems, setSelectedItems] = useState([]);
  const [scannerOpen, setScannerOpen] = useState(false);
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  const [scannedBook, setScannedBook] = useState(null);
  const queryClient = useQueryClient();
  const { formatAmount } = useCurrency();

  const { data: catalogItems = [] } = useQuery({
    queryKey: ['book-catalog'],
    queryFn: () => base44.entities.BookCatalog.list(),
  });

  const createPOMutation = useMutation({
    mutationFn: async (items) => {
      const groupedByVendor = items.reduce((acc, item) => {
        if (!acc[item.vendor_id]) {
          acc[item.vendor_id] = {
            vendor_id: item.vendor_id,
            vendor_name: item.vendor_name,
            items: []
          };
        }
        acc[item.vendor_id].items.push(item);
        return acc;
      }, {});

      const pos = [];
      for (const vendorGroup of Object.values(groupedByVendor)) {
        const totalCost = vendorGroup.items.reduce((sum, item) => 
          sum + (item.wholesale_price * (item.quantity || 10)), 0
        );

        const po = await base44.entities.PurchaseOrder.create({
          po_number: `PO-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
          vendor_id: vendorGroup.vendor_id,
          vendor_name: vendorGroup.vendor_name,
          order_date: new Date().toISOString().split('T')[0],
          items: JSON.stringify(vendorGroup.items.map(item => ({
            catalog_id: item.id,
            title: item.title,
            isbn: item.isbn,
            quantity: item.quantity || 10,
            unit_price: item.wholesale_price,
            total: (item.quantity || 10) * item.wholesale_price
          }))),
          total_cost: totalCost,
          status: 'Draft',
        });
        pos.push(po);
      }
      return pos;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['purchase-orders'] });
      alert('Purchase orders created successfully!');
      setSelectedItems([]);
    },
  });

  const handleToggleItem = (item) => {
    setSelectedItems(prev => {
      const exists = prev.find(i => i.id === item.id);
      if (exists) {
        return prev.filter(i => i.id !== item.id);
      } else {
        return [...prev, { ...item, quantity: 10 }];
      }
    });
  };

  const handleCreatePO = () => {
    if (selectedItems.length === 0) {
      alert('Please select at least one item');
      return;
    }
    createPOMutation.mutate(selectedItems);
  };

  const handleScanSuccess = async (isbn) => {
    setScannerOpen(false);

    try {
      const response = await base44.functions.invoke('scanBookISBN', { isbn });

      if (response.data.success) {
        setScannedBook(response.data.book);
        setConfirmDialogOpen(true);
      } else {
        toast.error(response.data.error || 'Book not found');
      }
    } catch (error) {
      toast.error('Error processing scan: ' + error.message);
    }
  };

  const handleConfirmAddBook = async () => {
    if (!scannedBook) return;

    try {
      const response = await base44.functions.invoke('scanBookISBN', {
        isbn: scannedBook.isbn,
        action: 'confirm'
      });

      if (response.data.success) {
        toast.success('Book added to catalog successfully');
        queryClient.invalidateQueries({ queryKey: ['book-catalog'] });
        setConfirmDialogOpen(false);
        setScannedBook(null);
      } else {
        toast.error(response.data.error);
      }
    } catch (error) {
      toast.error('Error adding book: ' + error.message);
    }
  };

  return (
    <Card className="bg-white shadow-md">
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle>Recommended Books from Vendors</CardTitle>
          <div className="flex gap-2">
            {scannerEnabled && (
              <Button
                onClick={() => setScannerOpen(true)}
                variant="outline"
                className="border-blue-600 text-blue-600 hover:bg-blue-50"
              >
                <Camera className="w-4 h-4 mr-2" />
                Scan ISBN
              </Button>
            )}
            <Button 
              onClick={handleCreatePO}
              disabled={selectedItems.length === 0 || createPOMutation.isPending}
              className="bg-blue-600 hover:bg-blue-700"
            >
              <ShoppingCart className="w-4 h-4 mr-2" />
              Create Purchase Request ({selectedItems.length})
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {catalogItems.length === 0 ? (
          <p className="text-center py-8 text-gray-500">No recommended books available</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Select</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Title</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">ISBN</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Author</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Grade Level</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Vendor</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Wholesale Price</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {catalogItems.map((item) => (
                  <tr key={item.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <Checkbox
                        checked={selectedItems.some(i => i.id === item.id)}
                        onCheckedChange={() => handleToggleItem(item)}
                      />
                    </td>
                    <td className="px-6 py-4 text-sm font-medium text-gray-900">{item.title}</td>
                    <td className="px-6 py-4 text-sm text-gray-600">{item.isbn}</td>
                    <td className="px-6 py-4 text-sm text-gray-600">{item.author || '-'}</td>
                    <td className="px-6 py-4 text-sm text-gray-600">{item.grade_level || '-'}</td>
                    <td className="px-6 py-4 text-sm text-gray-600">{item.vendor_name}</td>
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

      {/* Scanner Dialog */}
      <Scanner
        isOpen={scannerOpen}
        onClose={() => setScannerOpen(false)}
        onScanSuccess={handleScanSuccess}
        title="Scan Book ISBN"
        description="Scan the ISBN barcode on the book"
      />

      {/* Confirmation Dialog */}
      <Dialog open={confirmDialogOpen} onOpenChange={setConfirmDialogOpen}>
        <DialogContent className="max-w-md bg-white">
          <DialogHeader>
            <DialogTitle>Confirm Add Book to Catalog</DialogTitle>
          </DialogHeader>
          {scannedBook && (
            <div className="space-y-4">
              <div className="bg-blue-50 rounded-lg p-4 border-2 border-blue-200">
                <div className="flex gap-3">
                  {scannedBook.cover_image_url ? (
                    <img 
                      src={scannedBook.cover_image_url} 
                      alt={scannedBook.title}
                      className="w-20 h-28 object-cover rounded"
                    />
                  ) : (
                    <div className="w-20 h-28 bg-gray-200 rounded flex items-center justify-center">
                      <BookOpen className="w-8 h-8 text-gray-400" />
                    </div>
                  )}
                  <div className="flex-1">
                    <p className="font-semibold text-blue-900 mb-1">{scannedBook.title}</p>
                    <p className="text-sm text-gray-600 mb-1">by {scannedBook.author}</p>
                    <Badge variant="outline" className="text-xs">{scannedBook.category}</Badge>
                  </div>
                </div>
                <div className="mt-3 space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">ISBN:</span>
                    <span className="font-medium">{scannedBook.isbn}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Publisher:</span>
                    <span className="font-medium">{scannedBook.publisher}</span>
                  </div>
                  {scannedBook.publication_year && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Year:</span>
                      <span className="font-medium">{scannedBook.publication_year}</span>
                    </div>
                  )}
                </div>
              </div>
              <div className="flex gap-3">
                <Button variant="outline" onClick={() => setConfirmDialogOpen(false)} className="flex-1">
                  Cancel
                </Button>
                <Button onClick={handleConfirmAddBook} className="flex-1 bg-blue-600 hover:bg-blue-700">
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Add to Catalog
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </Card>
  );
}