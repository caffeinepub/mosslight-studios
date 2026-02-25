import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ShoppingCart, Loader2 } from 'lucide-react';
import { useAddItemToCart } from '../hooks/useCart';
import { toast } from 'sonner';
import type { Product, ProductVariant } from '../backend';

interface AddToCartButtonProps {
  product: Product;
  disabled?: boolean;
  hasVariants?: boolean;
  selectedSize?: string | null;
  selectedColor?: string | null;
  variants?: ProductVariant[];
}

export default function AddToCartButton({ 
  product, 
  disabled,
  hasVariants = false,
  selectedSize = null,
  selectedColor = null,
  variants = []
}: AddToCartButtonProps) {
  const [quantity, setQuantity] = useState(1);
  const addToCart = useAddItemToCart();

  const selectedVariant = hasVariants && selectedSize && selectedColor
    ? variants.find(v => v.size === selectedSize && v.color === selectedColor)
    : null;

  const maxInventory = hasVariants && selectedVariant
    ? Number(selectedVariant.inventory)
    : Number(product.inventory);

  const isVariantSelectionIncomplete = hasVariants && (!selectedSize || !selectedColor);
  const isDisabled = disabled || isVariantSelectionIncomplete;

  const handleAddToCart = async () => {
    if (quantity < 1) {
      toast.error('Quantity must be at least 1');
      return;
    }

    if (hasVariants && !selectedVariant) {
      toast.error('Please select size and color');
      return;
    }

    if (quantity > maxInventory) {
      toast.error('Not enough inventory available');
      return;
    }

    if (hasVariants && selectedVariant && Number(selectedVariant.inventory) === 0) {
      toast.error('This variant is out of stock');
      return;
    }

    // Use variant price if a variant is selected, otherwise use the product base price
    const itemPrice = selectedVariant ? selectedVariant.price : product.price;

    try {
      await addToCart.mutateAsync({
        productId: product.id,
        quantity: BigInt(quantity),
        variantId: selectedVariant?.id || undefined,
        price: itemPrice,
      });
      toast.success('Added to cart!');
      setQuantity(1);
    } catch (error: any) {
      if (error.message?.includes('Insufficient inventory')) {
        toast.error('Not enough inventory available');
      } else if (error.message?.includes('Variant required')) {
        toast.error('Please select size and color');
      } else {
        toast.error('Failed to add to cart');
      }
    }
  };

  const buttonText = isVariantSelectionIncomplete
    ? 'Select size and color'
    : addToCart.isPending
    ? 'Adding...'
    : 'Add to Cart';

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="quantity">Quantity</Label>
        <Input
          id="quantity"
          type="number"
          min="1"
          max={maxInventory}
          value={quantity}
          onChange={(e) => setQuantity(parseInt(e.target.value) || 1)}
          className="w-32"
          disabled={isDisabled}
        />
      </div>
      <Button
        onClick={handleAddToCart}
        disabled={isDisabled || addToCart.isPending}
        size="lg"
        className="w-full gap-2"
      >
        {addToCart.isPending ? (
          <>
            <Loader2 className="h-5 w-5 animate-spin" />
            {buttonText}
          </>
        ) : (
          <>
            <ShoppingCart className="h-5 w-5" />
            {buttonText}
          </>
        )}
      </Button>
    </div>
  );
}
