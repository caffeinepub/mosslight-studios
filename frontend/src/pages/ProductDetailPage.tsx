import { useState, useMemo } from 'react';
import { useParams, useNavigate } from '@tanstack/react-router';
import { useGetProduct } from '../hooks/useProducts';
import { useGetProductVariants } from '../hooks/useProductVariants';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Loader2, ArrowLeft } from 'lucide-react';
import AddToCartButton from '../components/AddToCartButton';
import ProductReviews from '../components/ProductReviews';
import ReviewForm from '../components/ReviewForm';

export default function ProductDetailPage() {
  const { id } = useParams({ from: '/products/$id' });
  const navigate = useNavigate();
  const { data: product, isLoading: productLoading } = useGetProduct(id);
  const { data: variants = [], isLoading: variantsLoading } = useGetProductVariants(id);
  const [selectedSize, setSelectedSize] = useState<string | null>(null);
  const [selectedColor, setSelectedColor] = useState<string | null>(null);

  const isLoading = productLoading || variantsLoading;

  const availableSizes = useMemo(() => {
    if (!product?.hasVariants || variants.length === 0) return [];
    return [...new Set(variants.map(v => v.size))];
  }, [product, variants]);

  const availableColors = useMemo(() => {
    if (!product?.hasVariants || variants.length === 0) return [];
    return [...new Set(variants.map(v => v.color))];
  }, [product, variants]);

  const selectedVariant = useMemo(() => {
    if (!product?.hasVariants || !selectedSize || !selectedColor) return null;
    return variants.find(v => v.size === selectedSize && v.color === selectedColor) || null;
  }, [product, variants, selectedSize, selectedColor]);

  // Lowest variant price for "From $X" display
  const lowestVariantPrice = useMemo(() => {
    if (!product?.hasVariants || variants.length === 0) return null;
    return Math.min(...variants.map(v => Number(v.price)));
  }, [product, variants]);

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
        <h1 className="font-serif text-3xl font-bold mb-4">Product Not Found</h1>
        <Button onClick={() => navigate({ to: '/products' })}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Products
        </Button>
      </div>
    );
  }

  const isOutOfStock = product.hasVariants
    ? (selectedVariant ? Number(selectedVariant.inventory) === 0 : false)
    : Number(product.inventory) === 0;

  const imageUrl = product.images[0]?.getDirectURL();

  // Price display logic:
  // - hasVariants + variant selected → show variant price
  // - hasVariants + no variant selected → show "From $X" or prompt
  // - no variants → show base price
  // Prices are stored in USD dollars (no cents conversion needed)
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

  return (
    <div className="container py-12">
      <Button
        variant="ghost"
        onClick={() => navigate({ to: '/products' })}
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
          </div>

          <Separator />

          <p className="text-muted-foreground leading-relaxed">{product.description}</p>

          {product.hasVariants && variants.length > 0 && (
            <div className="space-y-4">
              {availableSizes.length > 0 && (
                <div className="space-y-2">
                  <Label>Size</Label>
                  <Select onValueChange={setSelectedSize}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a size" />
                    </SelectTrigger>
                    <SelectContent>
                      {availableSizes.map(size => (
                        <SelectItem key={size} value={size}>{size}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {availableColors.length > 0 && (
                <div className="space-y-2">
                  <Label>Color</Label>
                  <Select onValueChange={setSelectedColor}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a color" />
                    </SelectTrigger>
                    <SelectContent>
                      {availableColors.map(color => (
                        <SelectItem key={color} value={color}>{color}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {selectedSize && selectedColor && !selectedVariant && (
                <p className="text-sm text-destructive">
                  This combination is not available
                </p>
              )}
            </div>
          )}

          <div className="space-y-3">
            {!product.hasVariants && (
              <p className="text-sm text-muted-foreground">
                {Number(product.inventory) > 0
                  ? `${Number(product.inventory)} in stock`
                  : 'Out of stock'}
              </p>
            )}
            {product.hasVariants && selectedVariant && (
              <p className="text-sm text-muted-foreground">
                {Number(selectedVariant.inventory) > 0
                  ? `${Number(selectedVariant.inventory)} in stock`
                  : 'Out of stock for this variant'}
              </p>
            )}

            <AddToCartButton
              product={product}
              hasVariants={product.hasVariants}
              selectedSize={selectedSize}
              selectedColor={selectedColor}
              variants={variants}
              disabled={isOutOfStock || (product.hasVariants && !selectedVariant)}
            />
          </div>

          {product.categories.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {product.categories.map(cat => (
                <Badge key={cat} variant="secondary">{cat}</Badge>
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
