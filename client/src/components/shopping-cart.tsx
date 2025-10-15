import { useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ShoppingCart as ShoppingCartIcon, Plus, Minus, Trash2, CreditCard, Truck } from 'lucide-react';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';

interface CartItem {
  id: number;
  productId: number;
  name: string;
  price: number;
  quantity: number;
  image?: string;
  sku?: string;
  maxQuantity?: number;
}

interface ShippingAddress {
  firstName: string;
  lastName: string;
  address1: string;
  address2?: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
  phone?: string;
}

interface CheckoutData {
  customerEmail: string;
  customerName: string;
  customerPhone?: string;
  billingAddress: ShippingAddress;
  shippingAddress: ShippingAddress;
  paymentMethod: string;
  specialInstructions?: string;
}

export default function ShoppingCart() {
  const { toast } = useToast();
  const [isOpen, setIsOpen] = useState(false);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [checkoutStep, setCheckoutStep] = useState(1); // 1: info, 2: shipping, 3: payment
  const [sameAsBilling, setSameAsBilling] = useState(true);
  
  // Get cart from localStorage
  const [cartItems, setCartItems] = useState<CartItem[]>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('ecommerce-cart');
      return saved ? JSON.parse(saved) : [];
    }
    return [];
  });

  // Save cart to localStorage whenever it changes
  const saveCart = (items: CartItem[]) => {
    setCartItems(items);
    localStorage.setItem('ecommerce-cart', JSON.stringify(items));
  };

  // Checkout form data
  const [checkoutData, setCheckoutData] = useState<Partial<CheckoutData>>({
    billingAddress: {
      firstName: '',
      lastName: '',
      address1: '',
      city: '',
      state: '',
      zipCode: '',
      country: 'US'
    },
    shippingAddress: {
      firstName: '',
      lastName: '',
      address1: '',
      city: '',
      state: '',
      zipCode: '',
      country: 'US'
    },
    paymentMethod: 'stripe'
  });

  // Calculate totals
  const subtotal = cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const taxRate = 0.08; // 8% tax
  const taxAmount = subtotal * taxRate;
  const shippingAmount = subtotal > 50 ? 0 : 9.99; // Free shipping over $50
  const total = subtotal + taxAmount + shippingAmount;

  // Add item to cart
  const addToCart = (product: any) => {
    const existingItem = cartItems.find(item => item.productId === product.id);
    
    if (existingItem) {
      const maxQty = product.inventoryQuantity || 999;
      if (existingItem.quantity >= maxQty) {
        toast({
          title: "Cannot Add More",
          description: `Maximum quantity available: ${maxQty}`,
          variant: "destructive",
        });
        return;
      }
      
      const updatedItems = cartItems.map(item =>
        item.productId === product.id
          ? { ...item, quantity: item.quantity + 1 }
          : item
      );
      saveCart(updatedItems);
    } else {
      const newItem: CartItem = {
        id: Date.now(),
        productId: product.id,
        name: product.name,
        price: parseFloat(product.price),
        quantity: 1,
        image: product.images?.[0],
        sku: product.sku,
        maxQuantity: product.inventoryQuantity || 999
      };
      saveCart([...cartItems, newItem]);
    }

    toast({
      title: "Added to Cart",
      description: `${product.name} added to your cart`,
    });
  };

  // Update quantity
  const updateQuantity = (itemId: number, newQuantity: number) => {
    if (newQuantity <= 0) {
      removeItem(itemId);
      return;
    }

    const updatedItems = cartItems.map(item => {
      if (item.id === itemId) {
        const maxQty = item.maxQuantity || 999;
        return { ...item, quantity: Math.min(newQuantity, maxQty) };
      }
      return item;
    });
    saveCart(updatedItems);
  };

  // Remove item
  const removeItem = (itemId: number) => {
    const updatedItems = cartItems.filter(item => item.id !== itemId);
    saveCart(updatedItems);
    toast({
      title: "Item Removed",
      description: "Item removed from your cart",
    });
  };

  // Create order mutation
  const createOrderMutation = useMutation({
    mutationFn: async (orderData: any) => {
      return await apiRequest('POST', '/api/ecommerce/orders', orderData, {
        'x-auth-email': 'abel@argilette.com',
        'authorization': 'Bearer demo-token'
      });
    },
    onSuccess: (data: any) => {
      toast({
        title: "Order Created",
        description: `Order #${data.orderNumber} created successfully!`,
      });
      // Clear cart
      saveCart([]);
      setIsCheckoutOpen(false);
      setCheckoutStep(1);
      // Redirect to order confirmation or payment
      if (data.paymentUrl) {
        window.location.href = data.paymentUrl;
      }
    },
    onError: (error: any) => {
      toast({
        title: "Order Failed",
        description: error.message || "Failed to create order",
        variant: "destructive",
      });
    }
  });

  // Handle checkout submission
  const handleCheckout = () => {
    if (!checkoutData.customerEmail || !checkoutData.billingAddress?.address1) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    const orderData = {
      storeId: 3, // Default store ID
      customerEmail: checkoutData.customerEmail,
      customerName: `${checkoutData.billingAddress?.firstName} ${checkoutData.billingAddress?.lastName}`,
      customerPhone: checkoutData.customerPhone,
      billingAddress: checkoutData.billingAddress,
      shippingAddress: sameAsBilling ? checkoutData.billingAddress : checkoutData.shippingAddress,
      items: cartItems.map(item => ({
        productId: item.productId,
        name: item.name,
        price: item.price,
        quantity: item.quantity,
        sku: item.sku
      })),
      subtotal: subtotal.toFixed(2),
      taxAmount: taxAmount.toFixed(2),
      shippingAmount: shippingAmount.toFixed(2),
      totalAmount: total.toFixed(2),
      paymentMethod: checkoutData.paymentMethod,
      notes: checkoutData.specialInstructions
    };

    createOrderMutation.mutate(orderData);
  };

  const CartIcon = () => (
    <Button
      variant="outline"
      size="sm"
      onClick={() => setIsOpen(true)}
      className="relative"
    >
      <ShoppingCartIcon className="h-4 w-4" />
      {cartItems.length > 0 && (
        <Badge className="absolute -top-2 -right-2 h-5 w-5 p-0 text-xs">
          {cartItems.reduce((sum, item) => sum + item.quantity, 0)}
        </Badge>
      )}
    </Button>
  );

  const AddToCartButton = ({ product }: { product: any }) => (
    <Button
      onClick={() => addToCart(product)}
      disabled={product.inventoryQuantity === 0}
      size="sm"
    >
      <Plus className="h-4 w-4 mr-1" />
      Add to Cart
    </Button>
  );

  return (
    <>
      {/* Cart Icon - Export this for use in product listings */}
      <CartIcon />

      {/* Cart Dialog */}
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ShoppingCartIcon className="h-5 w-5" />
              Shopping Cart ({cartItems.length} items)
            </DialogTitle>
            <DialogDescription>
              Review your items and proceed to checkout
            </DialogDescription>
          </DialogHeader>

          {cartItems.length === 0 ? (
            <div className="text-center py-8">
              <ShoppingCartIcon className="h-12 w-12 mx-auto text-gray-400 mb-4" />
              <p className="text-gray-500">Your cart is empty</p>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Cart Items */}
              {cartItems.map((item) => (
                <div key={item.id} className="flex items-center gap-4 p-4 border rounded-lg">
                  {item.image && (
                    <img src={item.image} alt={item.name} className="w-16 h-16 object-cover rounded" />
                  )}
                  <div className="flex-1">
                    <h3 className="font-medium">{item.name}</h3>
                    {item.sku && <p className="text-sm text-gray-500">SKU: {item.sku}</p>}
                    <p className="font-semibold">${item.price}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => updateQuantity(item.id, item.quantity - 1)}
                    >
                      <Minus className="h-3 w-3" />
                    </Button>
                    <span className="w-8 text-center">{item.quantity}</span>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => updateQuantity(item.id, item.quantity + 1)}
                      disabled={item.quantity >= (item.maxQuantity || 999)}
                    >
                      <Plus className="h-3 w-3" />
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => removeItem(item.id)}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold">${(item.price * item.quantity).toFixed(2)}</p>
                  </div>
                </div>
              ))}

              <Separator />

              {/* Order Summary */}
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span>Subtotal:</span>
                  <span>${subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Tax:</span>
                  <span>${taxAmount.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Shipping:</span>
                  <span>{shippingAmount === 0 ? 'Free' : `$${shippingAmount.toFixed(2)}`}</span>
                </div>
                <Separator />
                <div className="flex justify-between text-lg font-semibold">
                  <span>Total:</span>
                  <span>${total.toFixed(2)}</span>
                </div>
              </div>

              {/* Checkout Button */}
              <Button
                onClick={() => setIsCheckoutOpen(true)}
                className="w-full"
                size="lg"
              >
                <CreditCard className="h-4 w-4 mr-2" />
                Proceed to Checkout
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Checkout Dialog */}
      <Dialog open={isCheckoutOpen} onOpenChange={setIsCheckoutOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Checkout - Step {checkoutStep} of 3</DialogTitle>
            <DialogDescription>
              Complete your order information
            </DialogDescription>
          </DialogHeader>

          {checkoutStep === 1 && (
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Contact Information</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="email">Email Address *</Label>
                  <Input
                    id="email"
                    type="email"
                    value={checkoutData.customerEmail || ''}
                    onChange={(e) => setCheckoutData({
                      ...checkoutData,
                      customerEmail: e.target.value
                    })}
                    placeholder="your@email.com"
                  />
                </div>
                <div>
                  <Label htmlFor="phone">Phone Number</Label>
                  <Input
                    id="phone"
                    type="tel"
                    value={checkoutData.customerPhone || ''}
                    onChange={(e) => setCheckoutData({
                      ...checkoutData,
                      customerPhone: e.target.value
                    })}
                    placeholder="(555) 123-4567"
                  />
                </div>
              </div>

              <h3 className="text-lg font-medium mt-6">Billing Address</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="firstName">First Name *</Label>
                  <Input
                    id="firstName"
                    value={checkoutData.billingAddress?.firstName || ''}
                    onChange={(e) => setCheckoutData({
                      ...checkoutData,
                      billingAddress: {
                        ...checkoutData.billingAddress!,
                        firstName: e.target.value
                      }
                    })}
                  />
                </div>
                <div>
                  <Label htmlFor="lastName">Last Name *</Label>
                  <Input
                    id="lastName"
                    value={checkoutData.billingAddress?.lastName || ''}
                    onChange={(e) => setCheckoutData({
                      ...checkoutData,
                      billingAddress: {
                        ...checkoutData.billingAddress!,
                        lastName: e.target.value
                      }
                    })}
                  />
                </div>
                <div className="col-span-2">
                  <Label htmlFor="address1">Address *</Label>
                  <Input
                    id="address1"
                    value={checkoutData.billingAddress?.address1 || ''}
                    onChange={(e) => setCheckoutData({
                      ...checkoutData,
                      billingAddress: {
                        ...checkoutData.billingAddress!,
                        address1: e.target.value
                      }
                    })}
                    placeholder="123 Main Street"
                  />
                </div>
                <div>
                  <Label htmlFor="city">City *</Label>
                  <Input
                    id="city"
                    value={checkoutData.billingAddress?.city || ''}
                    onChange={(e) => setCheckoutData({
                      ...checkoutData,
                      billingAddress: {
                        ...checkoutData.billingAddress!,
                        city: e.target.value
                      }
                    })}
                  />
                </div>
                <div>
                  <Label htmlFor="state">State *</Label>
                  <Input
                    id="state"
                    value={checkoutData.billingAddress?.state || ''}
                    onChange={(e) => setCheckoutData({
                      ...checkoutData,
                      billingAddress: {
                        ...checkoutData.billingAddress!,
                        state: e.target.value
                      }
                    })}
                  />
                </div>
                <div>
                  <Label htmlFor="zipCode">ZIP Code *</Label>
                  <Input
                    id="zipCode"
                    value={checkoutData.billingAddress?.zipCode || ''}
                    onChange={(e) => setCheckoutData({
                      ...checkoutData,
                      billingAddress: {
                        ...checkoutData.billingAddress!,
                        zipCode: e.target.value
                      }
                    })}
                  />
                </div>
              </div>

              <Button onClick={() => setCheckoutStep(2)} className="w-full">
                Continue to Shipping
              </Button>
            </div>
          )}

          {checkoutStep === 2 && (
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="sameAsBilling"
                  checked={sameAsBilling}
                  onChange={(e) => setSameAsBilling(e.target.checked)}
                />
                <Label htmlFor="sameAsBilling">Shipping address same as billing</Label>
              </div>

              {!sameAsBilling && (
                <>
                  <h3 className="text-lg font-medium">Shipping Address</h3>
                  {/* Similar fields as billing address */}
                </>
              )}

              <div>
                <Label htmlFor="instructions">Special Instructions</Label>
                <Input
                  id="instructions"
                  value={checkoutData.specialInstructions || ''}
                  onChange={(e) => setCheckoutData({
                    ...checkoutData,
                    specialInstructions: e.target.value
                  })}
                  placeholder="Leave at door, call upon arrival, etc."
                />
              </div>

              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setCheckoutStep(1)}>
                  Back
                </Button>
                <Button onClick={() => setCheckoutStep(3)} className="flex-1">
                  Continue to Payment
                </Button>
              </div>
            </div>
          )}

          {checkoutStep === 3 && (
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Payment Method</h3>
              
              {/* Order Summary */}
              <Card>
                <CardHeader>
                  <CardTitle>Order Summary</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {cartItems.map((item) => (
                      <div key={item.id} className="flex justify-between">
                        <span>{item.name} × {item.quantity}</span>
                        <span>${(item.price * item.quantity).toFixed(2)}</span>
                      </div>
                    ))}
                    <Separator />
                    <div className="flex justify-between">
                      <span>Subtotal:</span>
                      <span>${subtotal.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Tax:</span>
                      <span>${taxAmount.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Shipping:</span>
                      <span>{shippingAmount === 0 ? 'Free' : `$${shippingAmount.toFixed(2)}`}</span>
                    </div>
                    <Separator />
                    <div className="flex justify-between text-lg font-semibold">
                      <span>Total:</span>
                      <span>${total.toFixed(2)}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setCheckoutStep(2)}>
                  Back
                </Button>
                <Button 
                  onClick={handleCheckout}
                  disabled={createOrderMutation.isPending}
                  className="flex-1"
                >
                  {createOrderMutation.isPending ? 'Processing...' : 'Complete Order'}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}

// Export components for use in other parts of the app
export const CartIcon = () => {
  const [cartItems] = useState<CartItem[]>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('ecommerce-cart');
      return saved ? JSON.parse(saved) : [];
    }
    return [];
  });

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="relative">
          <ShoppingCartIcon className="h-4 w-4" />
          {cartItems.length > 0 && (
            <Badge className="absolute -top-2 -right-2 h-5 w-5 p-0 text-xs">
              {cartItems.reduce((sum, item) => sum + item.quantity, 0)}
            </Badge>
          )}
        </Button>
      </DialogTrigger>
    </Dialog>
  );
};

export const AddToCartButton = ({ product }: { product: any }) => {
  const { toast } = useToast();
  
  const addToCart = (product: any) => {
    const saved = localStorage.getItem('ecommerce-cart');
    const cartItems = saved ? JSON.parse(saved) : [];
    
    const existingItem = cartItems.find((item: any) => item.productId === product.id);
    
    if (existingItem) {
      existingItem.quantity += 1;
    } else {
      cartItems.push({
        id: Date.now(),
        productId: product.id,
        name: product.name,
        price: parseFloat(product.price),
        quantity: 1,
        image: product.images?.[0],
        sku: product.sku,
        maxQuantity: product.inventoryQuantity || 999
      });
    }
    
    localStorage.setItem('ecommerce-cart', JSON.stringify(cartItems));
    
    toast({
      title: "Added to Cart",
      description: `${product.name} added to your cart`,
    });
  };

  return (
    <Button
      onClick={() => addToCart(product)}
      disabled={product.inventoryQuantity === 0}
      size="sm"
    >
      <Plus className="h-4 w-4 mr-1" />
      Add to Cart
    </Button>
  );
};