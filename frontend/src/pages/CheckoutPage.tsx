import { useState } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { useInternetIdentity } from '../hooks/useInternetIdentity';
import { useGetCallerUserProfile } from '../hooks/useUserProfile';
import { useCheckout, useViewCart } from '../hooks/useCart';
import { useGetProducts } from '../hooks/useProducts';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Loader2, Tag, Truck } from 'lucide-react';
import { toast } from 'sonner';
import ProfileSetupModal from '../components/ProfileSetupModal';
import AccessDeniedScreen from '../components/AccessDeniedScreen';
import type { ProductVariant } from '../backend';

export default function CheckoutPage() {
  const navigate = useNavigate();
  const { identity } = useInternetIdentity();
  const { data: userProfile, isLoading: profileLoading, isFetched } = useGetCallerUserProfile();
  const checkout = useCheckout();
  const { data: cartItems = [], isLoading: cartLoading } = useViewCart();
  const { data: products = [], isLoading: productsLoading } = useGetProducts();
  const [paymentMethod, setPaymentMethod] = useState('');

  const isAuthenticated = !!identity;
  const showProfileSetup = isAuthenticated && !profileLoading && isFetched && userProfile === null;

  if (!isAuthenticated) {
    return <AccessDeniedScreen />;
  }

  if (profileLoading || !isFetched) {
    return (
      <div className="container py-20 flex justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // Build cart with product details for order summary
  const cartWithDetails = cartItems.map(item => {
    const product = products.find(p => p.id === item.productId);
    let variant: ProductVariant | undefined = undefined;
    if (product?.hasVariants && item.variantId && product.variants) {
      variant = product.variants.find(v => v.id === item.variantId);
    }
    return { ...item, product, variant };
  }).filter(item => item.product);

  // Calculate totals
  const totals = cartWithDetails.reduce((acc, item) => {
    const itemPrice = Number(item.price);
    const qty = Number(item.quantity);
    const taxRate = item.product?.taxRate ?? 8.5;
    const shippingPrice = item.product?.shippingPrice ?? 0;

    return {
      subtotal: acc.subtotal + itemPrice * qty,
      tax: acc.tax + itemPrice * (taxRate / 100) * qty,
      shipping: acc.shipping + shippingPrice * qty,
    };
  }, { subtotal: 0, tax: 0, shipping: 0 });

  const grandTotal = totals.subtotal + totals.tax + totals.shipping;

  const handleCheckout = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!paymentMethod.trim()) {
      toast.error('Please enter payment information');
      return;
    }

    try {
      const orderId = await checkout.mutateAsync();
      toast.success('Order placed successfully!');
      navigate({ to: '/order-success', search: { orderId } });
    } catch (error: any) {
      toast.error(error.message || 'Failed to place order');
    }
  };

  const isDataLoading = cartLoading || productsLoading;

  return (
    <>
      <ProfileSetupModal open={showProfileSetup} />
      
      <div className="container py-12">
        <div className="max-w-2xl mx-auto space-y-8">
          <h1 className="font-serif text-4xl font-bold">Checkout</h1>

          <Card>
            <CardHeader>
              <CardTitle className="font-serif">Shipping Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Name</Label>
                <Input value={userProfile?.name || ''} disabled />
              </div>
              <div className="space-y-2">
                <Label>Email</Label>
                <Input value={userProfile?.email || ''} disabled />
              </div>
              <div className="space-y-2">
                <Label>Shipping Address</Label>
                <Input value={userProfile?.shippingAddress || ''} disabled />
              </div>
            </CardContent>
          </Card>

          {/* Order Summary with Tax & Shipping */}
          <Card>
            <CardHeader>
              <CardTitle className="font-serif">Order Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {isDataLoading ? (
                <div className="flex justify-center py-4">
                  <Loader2 className="h-5 w-5 animate-spin text-primary" />
                </div>
              ) : (
                <>
                  {/* Item list */}
                  <div className="space-y-3">
                    {cartWithDetails.map((item, index) => {
                      const itemPrice = Number(item.price);
                      const qty = Number(item.quantity);
                      const taxRate = item.product?.taxRate ?? 8.5;
                      const shippingPrice = item.product?.shippingPrice ?? 0;
                      const taxAmount = itemPrice * (taxRate / 100) * qty;
                      const lineSubtotal = itemPrice * qty;
                      const lineShipping = shippingPrice * qty;

                      return (
                        <div key={`${item.productId}-${item.variantId || index}`} className="space-y-1.5">
                          <div className="flex justify-between text-sm font-medium">
                            <span>
                              {item.product?.name}
                              {item.variant && (
                                <span className="text-muted-foreground font-normal ml-1">
                                  ({item.variant.size} / {item.variant.color})
                                </span>
                              )}
                              {qty > 1 && <span className="text-muted-foreground font-normal ml-1">× {qty}</span>}
                            </span>
                            <span>${lineSubtotal.toFixed(2)}</span>
                          </div>
                          <div className="flex justify-between text-xs text-muted-foreground pl-2">
                            <span className="flex items-center gap-1">
                              <Tag className="w-3 h-3" />
                              Tax ({taxRate}%)
                            </span>
                            <span>+${taxAmount.toFixed(2)}</span>
                          </div>
                          <div className="flex justify-between text-xs text-muted-foreground pl-2">
                            <span className="flex items-center gap-1">
                              <Truck className="w-3 h-3" />
                              Shipping
                            </span>
                            <span>
                              {lineShipping > 0 ? `+$${lineShipping.toFixed(2)}` : 'Free'}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  <Separator />

                  {/* Totals breakdown */}
                  <div className="space-y-1.5 text-sm">
                    <div className="flex justify-between text-muted-foreground">
                      <span>Subtotal</span>
                      <span>${totals.subtotal.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-muted-foreground items-center">
                      <span className="flex items-center gap-1">
                        <Tag className="w-3.5 h-3.5" />
                        Tax (8.5%)
                      </span>
                      <span>+${totals.tax.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-muted-foreground items-center">
                      <span className="flex items-center gap-1">
                        <Truck className="w-3.5 h-3.5" />
                        Shipping
                      </span>
                      <span>
                        {totals.shipping > 0 ? `+$${totals.shipping.toFixed(2)}` : 'Free'}
                      </span>
                    </div>
                    <Separator className="my-1" />
                    <div className="flex justify-between text-lg font-bold text-primary">
                      <span>Total</span>
                      <span>${grandTotal.toFixed(2)}</span>
                    </div>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          <form onSubmit={handleCheckout}>
            <Card>
              <CardHeader>
                <CardTitle className="font-serif">Payment Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  This is a demo checkout. Enter any payment information to complete your order.
                </p>
                <div className="space-y-2">
                  <Label htmlFor="payment">Payment Method</Label>
                  <Input
                    id="payment"
                    value={paymentMethod}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                    placeholder="e.g. Credit Card ending in 4242"
                    required
                  />
                </div>
                <Button
                  type="submit"
                  size="lg"
                  className="w-full"
                  disabled={checkout.isPending}
                >
                  {checkout.isPending ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Placing Order...
                    </>
                  ) : (
                    `Place Order — $${grandTotal.toFixed(2)}`
                  )}
                </Button>
              </CardContent>
            </Card>
          </form>
        </div>
      </div>
    </>
  );
}
