import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, ShoppingCart } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import type { Product, ProductVariant } from "../backendTypes";
import { useAddItemToCart } from "../hooks/useCart";

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
  variants = [],
}: AddToCartButtonProps) {
  const [quantity, setQuantity] = useState(1);
  const addToCart = useAddItemToCart();

  // Find selected variant by size only (new model)
  const selectedVariant =
    hasVariants && selectedSize
      ? (variants.find((v) => v.size === selectedSize) ?? null)
      : null;

  // Determine if variant has color options
  const variantHasColors = !!(
    hasVariants &&
    selectedVariant &&
    selectedVariant.colors.length > 0
  );

  // Determine max inventory based on selected color within variant, or product inventory
  const maxInventory = (() => {
    if (hasVariants && selectedVariant) {
      if (selectedColor) {
        const colorEntry = selectedVariant.colors.find(
          (c) => c.name === selectedColor,
        );
        return colorEntry ? Number(colorEntry.inventory) : 0;
      }
      // No color selected yet — use total variant stock as a rough max
      return selectedVariant.colors.reduce(
        (sum, c) => sum + Number(c.inventory),
        0,
      );
    }
    return Number(product.inventory);
  })();

  const isVariantSelectionIncomplete: boolean = hasVariants && !selectedSize;
  const isColorSelectionRequired: boolean = variantHasColors && !selectedColor;
  const isDisabled: boolean =
    !!disabled || isVariantSelectionIncomplete || isColorSelectionRequired;

  const handleAddToCart = async () => {
    if (quantity < 1) {
      toast.error("Quantity must be at least 1");
      return;
    }

    if (hasVariants && !selectedVariant) {
      toast.error("Please select a size");
      return;
    }

    if (variantHasColors && !selectedColor) {
      toast.error("Please select a color");
      return;
    }

    if (hasVariants && selectedVariant && selectedColor) {
      const colorEntry = selectedVariant.colors.find(
        (c) => c.name === selectedColor,
      );
      if (!colorEntry || Number(colorEntry.inventory) === 0) {
        toast.error("This color is out of stock");
        return;
      }
      if (quantity > Number(colorEntry.inventory)) {
        toast.error("Not enough inventory available for this color");
        return;
      }
    } else if (quantity > maxInventory) {
      toast.error("Not enough inventory available");
      return;
    }

    // Use variant price if a variant is selected, otherwise use the product base price
    const itemPrice = selectedVariant ? selectedVariant.price : product.price;
    // Color to send: selected color, or empty string if no color options
    const colorToSend = selectedColor || "";

    try {
      await addToCart.mutateAsync({
        productId: product.id,
        quantity: BigInt(quantity),
        variantId: selectedVariant?.id ?? null,
        color: colorToSend,
        price: itemPrice,
      });
      toast.success("Added to cart!");
      setQuantity(1);
    } catch (error: any) {
      if (error.message?.includes("Insufficient inventory")) {
        toast.error("Not enough inventory available");
      } else if (error.message?.includes("Variant required")) {
        toast.error("Please select a size");
      } else if (error.message?.includes("color")) {
        toast.error("Please select a color");
      } else {
        toast.error("Failed to add to cart");
      }
    }
  };

  const buttonText = isVariantSelectionIncomplete
    ? "Select a size"
    : isColorSelectionRequired
      ? "Select a color"
      : addToCart.isPending
        ? "Adding..."
        : "Add to Cart";

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="quantity">Quantity</Label>
        <Input
          id="quantity"
          type="number"
          min="1"
          max={maxInventory > 0 ? maxInventory : undefined}
          value={quantity}
          onChange={(e) => setQuantity(Number.parseInt(e.target.value) || 1)}
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
