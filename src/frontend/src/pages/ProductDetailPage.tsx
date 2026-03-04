import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { useNavigate, useParams } from "@tanstack/react-router";
import { ArrowLeft, Loader2, Tag, Truck } from "lucide-react";
import { useMemo, useState } from "react";
import type { ProductColor } from "../backend";
import AddToCartButton from "../components/AddToCartButton";
import ProductReviews from "../components/ProductReviews";
import ReviewForm from "../components/ReviewForm";
import { useGetProductVariants } from "../hooks/useProductVariants";
import { useGetProduct } from "../hooks/useProducts";

export default function ProductDetailPage() {
  const { id } = useParams({ from: "/products/$id" });
  const navigate = useNavigate();
  const { data: product, isLoading: productLoading } = useGetProduct(id);
  const { data: variants = [], isLoading: variantsLoading } =
    useGetProductVariants(id);
  const [selectedSize, setSelectedSize] = useState<string | null>(null);
  const [selectedColor, setSelectedColor] = useState<string | null>(null);

  const isLoading = productLoading || variantsLoading;

  // Available sizes from variants
  const availableSizes = useMemo(() => {
    if (!product?.hasVariants || variants.length === 0) return [];
    return [...new Set(variants.map((v) => v.size))];
  }, [product, variants]);

  // Selected variant based on size only (new model: color is per-variant colors array)
  const selectedVariant = useMemo(() => {
    if (!product?.hasVariants || !selectedSize) return null;
    return variants.find((v) => v.size === selectedSize) || null;
  }, [product, variants, selectedSize]);

  // Colors available for the selected variant (or product-level colors for unsized products)
  const availableColors = useMemo((): ProductColor[] => {
    if (product?.hasVariants) {
      if (!selectedVariant) return [];
      return selectedVariant.colors || [];
    }
    // For unsized products, we don't have ProductColor objects from the product directly
    // The product.colors is string[], but we need inventory info
    // We'll show colors from the product.colors array (no per-color inventory for unsized in this view)
    return [];
  }, [product, selectedVariant]);

  // Lowest variant price for "From $X" display
  const lowestVariantPrice = useMemo(() => {
    if (!product?.hasVariants || variants.length === 0) return null;
    return Math.min(...variants.map((v) => Number(v.price)));
  }, [product, variants]);

  // Reset color when size changes
  const handleSizeChange = (size: string) => {
    setSelectedSize(size);
    setSelectedColor(null);
  };

  if (isLoading) {
    return (
      <div className="container py-20 flex justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!product) {
    return (
      <div className="container py-20 text-center">
        <h1 className="font-serif text-3xl font-bold mb-4">
          Product Not Found
        </h1>
        <Button onClick={() => navigate({ to: "/products" })}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Products
        </Button>
      </div>
    );
  }

  const isOutOfStock = product.hasVariants
    ? selectedVariant
      ? selectedColor
        ? (selectedVariant.colors.find((c) => c.name === selectedColor)
            ?.inventory ?? BigInt(0)) === BigInt(0)
        : false
      : false
    : Number(product.inventory) === 0;

  const imageUrl = product.images[0]?.getDirectURL();

  // Determine the active base price for tax calculation
  const activeBasePrice =
    product.hasVariants && selectedVariant
      ? Number(selectedVariant.price)
      : product.hasVariants && lowestVariantPrice !== null
        ? lowestVariantPrice
        : Number(product.price);

  const taxRate = product.taxRate ?? 8.5;
  const taxAmount = activeBasePrice * (taxRate / 100);
  const shippingPrice = product.shippingPrice ?? 0;

  // Price display logic
  const renderPrice = () => {
    if (product.hasVariants) {
      if (selectedVariant) {
        return (
          <p className="text-3xl font-semibold text-primary">
            ${Number(selectedVariant.price).toFixed(2)}
          </p>
        );
      }
      if (lowestVariantPrice !== null) {
        return (
          <p className="text-3xl font-semibold text-primary">
            From ${lowestVariantPrice.toFixed(2)}
          </p>
        );
      }
      return (
        <p className="text-base text-muted-foreground italic">
          Select options to see price
        </p>
      );
    }
    return (
      <p className="text-3xl font-semibold text-primary">
        ${Number(product.price).toFixed(2)}
      </p>
    );
  };

  const showPricingBreakdown = !product.hasVariants || selectedVariant !== null;

  // Determine if color selection is needed and whether it's complete
  const hasColorOptions = availableColors.length > 0;
  const colorSelectionRequired =
    product.hasVariants && selectedVariant !== null && hasColorOptions;
  const isAddToCartDisabled =
    isOutOfStock ||
    (product.hasVariants && !selectedVariant) ||
    (colorSelectionRequired && !selectedColor);

  return (
    <div className="container py-12">
      <Button
        variant="ghost"
        onClick={() => navigate({ to: "/products" })}
        className="mb-6"
      >
        <ArrowLeft className="h-4 w-4 mr-2" />
        Back to Products
      </Button>

      <div className="grid md:grid-cols-2 gap-12">
        <div className="space-y-4">
          {imageUrl ? (
            <img
              src={imageUrl}
              alt={product.name}
              className="w-full aspect-square object-cover rounded-lg shadow-elegant"
            />
          ) : (
            <div className="w-full aspect-square bg-muted rounded-lg flex items-center justify-center">
              <span className="text-muted-foreground">No image available</span>
            </div>
          )}
        </div>

        <div className="space-y-6">
          <div className="space-y-2">
            <h1 className="font-serif text-4xl font-bold">{product.name}</h1>
            <div className="flex items-center gap-3">
              {renderPrice()}
              {!product.hasVariants && isOutOfStock && (
                <Badge variant="destructive">Out of Stock</Badge>
              )}
            </div>

            {/* Pricing Breakdown */}
            {showPricingBreakdown && (
              <div className="mt-3 p-3 bg-muted/50 rounded-lg space-y-1.5 text-sm">
                <div className="flex justify-between text-muted-foreground">
                  <span>Base Price</span>
                  <span>${activeBasePrice.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-muted-foreground items-center">
                  <span className="flex items-center gap-1">
                    <Tag className="w-3.5 h-3.5" />
                    Tax ({taxRate}%)
                  </span>
                  <span>+${taxAmount.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-muted-foreground items-center">
                  <span className="flex items-center gap-1">
                    <Truck className="w-3.5 h-3.5" />
                    Shipping
                  </span>
                  <span>
                    {shippingPrice > 0
                      ? `+$${shippingPrice.toFixed(2)}`
                      : "Free"}
                  </span>
                </div>
                <Separator className="my-1" />
                <div className="flex justify-between font-semibold text-foreground">
                  <span>Estimated Total</span>
                  <span>
                    ${(activeBasePrice + taxAmount + shippingPrice).toFixed(2)}
                  </span>
                </div>
              </div>
            )}
          </div>

          <Separator />

          <p className="text-muted-foreground leading-relaxed">
            {product.description}
          </p>

          {/* Size Selection */}
          {product.hasVariants &&
            variants.length > 0 &&
            availableSizes.length > 0 && (
              <div className="space-y-2">
                <Label>Size</Label>
                <Select onValueChange={handleSizeChange}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a size" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableSizes.map((size) => (
                      <SelectItem key={size} value={size}>
                        {size}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

          {/* Color Selection — shown when selected variant has color options */}
          {hasColorOptions && (
            <div className="space-y-2">
              <Label>
                Color
                {selectedColor && (
                  <span className="ml-2 font-normal text-muted-foreground">
                    — {selectedColor}
                  </span>
                )}
              </Label>
              <div className="flex flex-wrap gap-2">
                {availableColors.map((color) => {
                  const outOfStock = Number(color.inventory) === 0;
                  const isSelected = selectedColor === color.name;
                  return (
                    <button
                      key={color.name}
                      type="button"
                      onClick={() =>
                        !outOfStock && setSelectedColor(color.name)
                      }
                      disabled={outOfStock}
                      className={[
                        "px-3 py-1.5 rounded-full text-sm border transition-all",
                        isSelected
                          ? "border-primary bg-primary text-primary-foreground font-medium"
                          : outOfStock
                            ? "border-muted text-muted-foreground bg-muted/30 cursor-not-allowed line-through opacity-60"
                            : "border-border hover:border-primary hover:bg-primary/5 cursor-pointer",
                      ].join(" ")}
                    >
                      {color.name}
                      {outOfStock && (
                        <span className="ml-1 text-xs">(Out of stock)</span>
                      )}
                    </button>
                  );
                })}
              </div>
              {colorSelectionRequired && !selectedColor && (
                <p className="text-xs text-muted-foreground">
                  Please select a color to continue
                </p>
              )}
            </div>
          )}

          <div className="space-y-3">
            {/* Stock info */}
            {!product.hasVariants && (
              <p className="text-sm text-muted-foreground">
                {Number(product.inventory) > 0
                  ? `${Number(product.inventory)} in stock`
                  : "Out of stock"}
              </p>
            )}
            {product.hasVariants && selectedVariant && !hasColorOptions && (
              <p className="text-sm text-muted-foreground">
                {Number(
                  selectedVariant.colors.reduce(
                    (sum, c) => sum + Number(c.inventory),
                    0,
                  ),
                ) > 0
                  ? `${selectedVariant.colors.reduce((sum, c) => sum + Number(c.inventory), 0)} in stock`
                  : "Out of stock for this size"}
              </p>
            )}
            {product.hasVariants && selectedVariant && selectedColor && (
              <p className="text-sm text-muted-foreground">
                {(() => {
                  const colorEntry = selectedVariant.colors.find(
                    (c) => c.name === selectedColor,
                  );
                  const stock = colorEntry ? Number(colorEntry.inventory) : 0;
                  return stock > 0 ? `${stock} in stock` : "Out of stock";
                })()}
              </p>
            )}

            <AddToCartButton
              product={product}
              hasVariants={product.hasVariants}
              selectedSize={selectedSize}
              selectedColor={selectedColor}
              variants={variants}
              disabled={isAddToCartDisabled}
            />
          </div>

          {product.categories.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {product.categories.map((cat) => (
                <Badge key={cat} variant="secondary">
                  {cat}
                </Badge>
              ))}
            </div>
          )}
        </div>
      </div>

      <Separator className="my-12" />

      <div className="max-w-2xl space-y-8">
        <ProductReviews productId={product.id} />
        <ReviewForm productId={product.id} />
      </div>
    </div>
  );
}
