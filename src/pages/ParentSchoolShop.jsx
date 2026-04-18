import React, { useState, useEffect } from 'react';
import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useSchoolContext } from '@/hooks/useSchoolContext';
import { addSchoolFilter } from '@/utils/schoolFilter';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ShoppingCart, Package, Plus, Minus, Trash2, CheckCircle } from 'lucide-react';
import { useCurrency } from '@/components/CurrencyProvider';
import { toast } from 'sonner';

export default function ParentSchoolShop() {
  const [user, setUser] = useState(null);
  const [cart, setCart] = useState([]);
  const [selectedStudent, setSelectedStudent] = useState('');
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const queryClient = useQueryClient();
  const { formatAmount } = useCurrency();
  const { school_tenant_id, isReady } = useSchoolContext();

  useEffect(() => {
    const fetchUser = async () => {
      const currentUser = await base44.auth.me();
      setUser(currentUser);
    };
    fetchUser();
  }, []);

  const { data: parents = [] } = useQuery({
    queryKey: ['parent-profile', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      if (user.parent_profile_id) {
        const parent = await base44.entities.Parent.get(user.parent_profile_id);
        return parent ? [parent] : [];
      }
      return await base44.entities.Parent.filter({ user_id: user.id });
    },
    enabled: !!user?.id,
  });

  const parentProfile = parents[0];

  const { data: students = [] } = useQuery({
    queryKey: ['parent-students-shop', parentProfile?.id, parentProfile?.linked_student_ids],
    queryFn: async () => {
      if (!parentProfile?.id) return [];
      if (parentProfile.linked_student_ids) {
        try {
          const studentIds = JSON.parse(parentProfile.linked_student_ids);
          if (Array.isArray(studentIds) && studentIds.length > 0) {
            const allStudents = await base44.entities.Student.list();
            return allStudents.filter(s => studentIds.includes(s.id));
          }
        } catch (e) {}
      }
      return await base44.entities.Student.filter({ parent_id: parentProfile.id });
    },
    enabled: !!parentProfile?.id,
  });

  const { data: products = [] } = useQuery({
    queryKey: ['school-products', school_tenant_id],
    queryFn: () => base44.entities.SchoolProduct.filter(addSchoolFilter({ status: 'Active' }, school_tenant_id)),
    enabled: isReady,
  });

  const { data: orders = [] } = useQuery({
    queryKey: ['parent-orders', parentProfile?.id],
    queryFn: () => base44.entities.ProductOrder.filter({ parent_id: parentProfile?.id }),
    enabled: !!parentProfile?.id,
  });

  useEffect(() => {
    if (students.length > 0 && !selectedStudent) {
      setSelectedStudent(students[0].id);
    }
  }, [students, selectedStudent]);

  const createOrderMutation = useMutation({
    mutationFn: async (orderData) => {
      return await base44.entities.ProductOrder.create(orderData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['parent-orders'] });
      setCart([]);
      setCheckoutOpen(false);
      toast.success('Order placed successfully!');
    },
    onError: (error) => {
      toast.error('Failed to place order: ' + error.message);
    },
  });

  const addToCart = (product) => {
    setCart(prev => {
      const existing = prev.find(item => item.product_id === product.id);
      if (existing) {
        return prev.map(item => 
          item.product_id === product.id 
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }
      return [...prev, { product_id: product.id, name: product.name, price: product.price, quantity: 1 }];
    });
    toast.success(`${product.name} added to cart`);
  };

  const updateQuantity = (productId, delta) => {
    setCart(prev => prev.map(item => {
      if (item.product_id === productId) {
        const newQty = item.quantity + delta;
        return newQty > 0 ? { ...item, quantity: newQty } : item;
      }
      return item;
    }).filter(item => item.quantity > 0));
  };

  const removeFromCart = (productId) => {
    setCart(prev => prev.filter(item => item.product_id !== productId));
  };

  const cartTotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);

  const handleCheckout = () => {
    if (!selectedStudent) {
      toast.error('Please select a student');
      return;
    }
    const student = students.find(s => s.id === selectedStudent);
    createOrderMutation.mutate({
      order_number: `ORD-${Date.now()}`,
      parent_id: parentProfile?.id,
      student_id: selectedStudent,
      student_name: `${student?.first_name} ${student?.last_name}`,
      items: JSON.stringify(cart),
      total_amount: cartTotal,
      status: 'Pending',
      payment_status: 'Unpaid',
    });
  };

  const categoryIcons = {
    Uniform: '👕',
    Books: '📚',
    Stationery: '✏️',
    'Sports Equipment': '⚽',
    Technology: '💻',
    Other: '📦',
  };

  if (!user) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">School Shop</h1>
          <p className="text-gray-600 mt-1">Purchase school items for your child</p>
        </div>
        <Button 
          onClick={() => setCheckoutOpen(true)} 
          disabled={cart.length === 0}
          className="bg-blue-600 hover:bg-blue-700 relative"
        >
          <ShoppingCart className="w-4 h-4 mr-2" />
          Cart ({cart.length})
          {cart.length > 0 && (
            <span className="ml-2 bg-white text-blue-600 px-2 py-0.5 rounded-full text-xs font-bold">
              {formatAmount(cartTotal)}
            </span>
          )}
        </Button>
      </div>

      {students.length > 1 && (
        <Card className="bg-white shadow-md">
          <CardContent className="p-4">
            <div className="flex items-center gap-4">
              <Label>Shopping for:</Label>
              <Select value={selectedStudent} onValueChange={setSelectedStudent}>
                <SelectTrigger className="w-64">
                  <SelectValue placeholder="Select student" />
                </SelectTrigger>
                <SelectContent>
                  {students.map(s => (
                    <SelectItem key={s.id} value={s.id}>
                      {s.first_name} {s.last_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Products Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {products.map(product => (
          <Card key={product.id} className="bg-white shadow-md hover:shadow-lg transition-shadow overflow-hidden">
            {product.image_url ? (
              <img src={product.image_url} alt={product.name} className="w-full h-48 object-cover" />
            ) : (
              <div className="w-full h-48 bg-gray-100 flex items-center justify-center">
                <span className="text-6xl">{categoryIcons[product.category] || '📦'}</span>
              </div>
            )}
            <CardContent className="p-4">
              <div className="flex justify-between items-start mb-2">
                <div>
                  <h3 className="font-semibold text-gray-900">{product.name}</h3>
                  <Badge variant="outline" className="mt-1">{product.category}</Badge>
                </div>
                {product.is_required && (
                  <Badge className="bg-red-100 text-red-700">Required</Badge>
                )}
              </div>
              <p className="text-sm text-gray-600 mb-3 line-clamp-2">{product.description}</p>
              <div className="flex justify-between items-center">
                <span className="text-xl font-bold text-blue-600">{formatAmount(product.price)}</span>
                <Button 
                  onClick={() => addToCart(product)}
                  size="sm"
                  className="bg-blue-600 hover:bg-blue-700"
                  disabled={product.stock_quantity === 0}
                >
                  <Plus className="w-4 h-4 mr-1" />
                  Add
                </Button>
              </div>
              {product.stock_quantity === 0 && (
                <p className="text-sm text-red-600 mt-2">Out of stock</p>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {products.length === 0 && (
        <Card className="bg-white shadow-md">
          <CardContent className="p-12 text-center">
            <Package className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No Products Available</h3>
            <p className="text-gray-600">The school shop is currently empty.</p>
          </CardContent>
        </Card>
      )}

      {/* My Orders Section */}
      {orders.length > 0 && (
        <Card className="bg-white shadow-md">
          <CardHeader>
            <CardTitle>My Orders</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {orders.slice(0, 5).map(order => (
                <div key={order.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div>
                    <p className="font-medium text-gray-900">{order.order_number}</p>
                    <p className="text-sm text-gray-600">{order.student_name}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-gray-900">{formatAmount(order.total_amount)}</p>
                    <Badge className={
                      order.status === 'Delivered' ? 'bg-green-100 text-green-700' :
                      order.status === 'Cancelled' ? 'bg-red-100 text-red-700' :
                      'bg-yellow-100 text-yellow-700'
                    }>{order.status}</Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Checkout Dialog */}
      <Dialog open={checkoutOpen} onOpenChange={setCheckoutOpen}>
        <DialogContent className="max-w-lg bg-white">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ShoppingCart className="w-5 h-5" />
              Your Cart
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {cart.length === 0 ? (
              <p className="text-center text-gray-500 py-8">Your cart is empty</p>
            ) : (
              <>
                <div className="space-y-3 max-h-64 overflow-y-auto">
                  {cart.map(item => (
                    <div key={item.product_id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex-1">
                        <p className="font-medium text-gray-900">{item.name}</p>
                        <p className="text-sm text-gray-600">{formatAmount(item.price)} each</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button size="icon" variant="outline" onClick={() => updateQuantity(item.product_id, -1)}>
                          <Minus className="w-4 h-4" />
                        </Button>
                        <span className="w-8 text-center font-medium">{item.quantity}</span>
                        <Button size="icon" variant="outline" onClick={() => updateQuantity(item.product_id, 1)}>
                          <Plus className="w-4 h-4" />
                        </Button>
                        <Button size="icon" variant="ghost" onClick={() => removeFromCart(item.product_id)}>
                          <Trash2 className="w-4 h-4 text-red-600" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
                
                <div className="border-t pt-4">
                  <div className="flex justify-between items-center mb-4">
                    <span className="text-lg font-semibold">Total:</span>
                    <span className="text-2xl font-bold text-blue-600">{formatAmount(cartTotal)}</span>
                  </div>
                  
                  <div className="mb-4">
                    <Label>Order for Student:</Label>
                    <Select value={selectedStudent} onValueChange={setSelectedStudent}>
                      <SelectTrigger className="mt-1">
                        <SelectValue placeholder="Select student" />
                      </SelectTrigger>
                      <SelectContent>
                        {students.map(s => (
                          <SelectItem key={s.id} value={s.id}>
                            {s.first_name} {s.last_name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <Button 
                    onClick={handleCheckout} 
                    className="w-full bg-blue-600 hover:bg-blue-700"
                    disabled={createOrderMutation.isPending}
                  >
                    <CheckCircle className="w-4 h-4 mr-2" />
                    {createOrderMutation.isPending ? 'Processing...' : 'Place Order'}
                  </Button>
                </div>
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}