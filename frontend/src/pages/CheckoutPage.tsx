import { useState } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { useInternetIdentity } from '../hooks/useInternetIdentity';
import { useGetCallerUserProfile } from '../hooks/useUserProfile';
import { useCheckout } from '../hooks/useCart';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import ProfileSetupModal from '../components/ProfileSetupModal';
import AccessDeniedScreen from '../components/AccessDeniedScreen';

export default function CheckoutPage() {
  const navigate = useNavigate();
  const { identity } = useInternetIdentity();
  const { data: userProfile, isLoading: profileLoading, isFetched } = useGetCallerUserProfile();
  const checkout = useCheckout();
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
                    placeholder="Enter payment details"
                    required
                  />
                </div>
                <Button 
                  type="submit" 
                  className="w-full" 
                  size="lg"
                  disabled={checkout.isPending}
                >
                  {checkout.isPending ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    'Place Order'
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
