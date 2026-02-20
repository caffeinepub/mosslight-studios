import { useViewCart, useClearCart } from '../hooks/useCart';
import { useGetProducts } from '../hooks/useProducts';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, ShoppingBag, Trash2 } from 'lucide-react';
import { useNavigate } from '@tanstack/react-router';
import { toast } from 'sonner';

export default function CartPage() {
  const navigate = useNavigate();
  const { data: cartItems = [], isLoading: cartLoading } = useViewCart();
  const { data: products = [], isLoading: productsLoading } = useGetProducts();
  const clearCart = useClearCart();

  const isLoading = cartLoading || productsLoading;

  const cartWithDetails = cartItems.map(item => {
    const product = products.find(p => p.id === item.productId);
    return { ...item, product };
  }).filter(item => item.product);

  const total = cartWithDetails.reduce((sum, item) => {
    return sum + (Number(item.product!.price) * Number(item.quantity));
  }, 0);

  const handleClearCart = async () => {
    try {
      await clearCart.mutateAsync();
      toast.success('Cart cleared');
    } catch (error) {
      toast.error('Failed to clear cart');
    }
  };

  if (isLoading) {
    return (
      <div className="container py-20 flex justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (cartItems.length === 0) {
    return (
      <div className="container py-20">
        <Card className="max-w-md mx-auto text-center">
          <CardContent className="pt-12 pb-8 space-y-4">
            <div className="flex justify-center">
              <div className="rounded-full bg-muted p-6">
                <ShoppingBag className="h-12 w-12 text-muted-foreground" />
              </div>
            </div>
            <h2 className="font-serif text-2xl font-semibold">Your cart is empty</h2>
            <p className="text-muted-foreground">
              Add some beautiful items to your cart to get started
            </p>
            <Button onClick={() => navigate({ to: '/products' })} className="mt-4">
              Browse Products
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container py-12">
      <div className="max-w-4xl mx-auto space-y-8">
        <div className="flex items-center justify-between">
          <h1 className="font-serif text-4xl font-bold">Shopping Cart</h1>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleClearCart}
            disabled={clearCart.isPending}
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Clear Cart
          </Button>
        </div>

        <div className="space-y-4">
          {cartWithDetails.map((item) => {
            const imageUrl = item.product!.images[0]?.getDirectURL();
            return (
              <Card key={item.productId}>
                <CardContent className="p-6">
                  <div className="flex gap-6">
                    {imageUrl ? (
                      <img
                        src={imageUrl}
                        alt={item.product!.name}
                        className="w-24 h-24 object-cover rounded-md"
                      />
                    ) : (
                      <div className="w-24 h-24 bg-muted rounded-md" />
                    )}
                    <div className="flex-1 space-y-2">
                      <h3 className="font-serif text-xl font-semibold">
                        {item.product!.name}
                      </h3>
                      <p className="text-muted-foreground">
                        Quantity: {Number(item.quantity)}
                      </p>
                      <p className="text-lg font-semibold text-primary">
                        ${((Number(item.product!.price) * Number(item.quantity)) / 100).toFixed(2)}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="font-serif">Order Summary</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex justify-between text-lg">
              <span>Subtotal</span>
              <span>${(total / 100).toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-2xl font-bold text-primary pt-2 border-t">
              <span>Total</span>
              <span>${(total / 100).toFixed(2)}</span>
            </div>
          </CardContent>
          <CardFooter>
            <Button 
              className="w-full" 
              size="lg"
              onClick={() => navigate({ to: '/checkout' })}
            >
              Proceed to Checkout
            </Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}

