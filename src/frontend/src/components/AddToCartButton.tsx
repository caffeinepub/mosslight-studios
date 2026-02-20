import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ShoppingCart, Loader2 } from 'lucide-react';
import { useAddItemToCart } from '../hooks/useCart';
import { toast } from 'sonner';
import type { Product } from '../backend';

interface AddToCartButtonProps {
  product: Product;
  disabled?: boolean;
}

export default function AddToCartButton({ product, disabled }: AddToCartButtonProps) {
  const [quantity, setQuantity] = useState(1);
  const addToCart = useAddItemToCart();

  const handleAddToCart = async () => {
    if (quantity < 1) {
      toast.error('Quantity must be at least 1');
      return;
    }

    if (quantity > Number(product.inventory)) {
      toast.error('Not enough inventory available');
      return;
    }

    try {
      await addToCart.mutateAsync({
        productId: product.id,
        quantity: BigInt(quantity),
      });
      toast.success('Added to cart!');
      setQuantity(1);
    } catch (error) {
      toast.error('Failed to add to cart');
    }
  };

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="quantity">Quantity</Label>
        <Input
          id="quantity"
          type="number"
          min="1"
          max={Number(product.inventory)}
          value={quantity}
          onChange={(e) => setQuantity(parseInt(e.target.value) || 1)}
          className="w-32"
          disabled={disabled}
        />
      </div>
      <Button
        onClick={handleAddToCart}
        disabled={disabled || addToCart.isPending}
        size="lg"
        className="w-full gap-2"
      >
        {addToCart.isPending ? (
          <>
            <Loader2 className="h-5 w-5 animate-spin" />
            Adding...
          </>
        ) : (
          <>
            <ShoppingCart className="h-5 w-5" />
            Add to Cart
          </>
        )}
      </Button>
    </div>
  );
}

