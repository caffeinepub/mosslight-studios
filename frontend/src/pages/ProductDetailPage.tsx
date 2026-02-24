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
    const sizes = [...new Set(variants.map(v => v.size))];
    return sizes;
  }, [product, variants]);

  const availableColors = useMemo(() => {
    if (!product?.hasVariants || variants.length === 0) return [];
    const colors = [...new Set(variants.map(v => v.color))];
    return colors;
  }, [product, variants]);

  const selectedVariant = useMemo(() => {
    if (!product?.hasVariants || !selectedSize || !selectedColor) return null;
    return variants.find(v => v.size === selectedSize && v.color === selectedColor) || null;
  }, [product, variants, selectedSize, selectedColor]);

  const displayPrice = useMemo(() => {
    if (product?.hasVariants && selectedVariant) {
      return Number(selectedVariant.price);
    }
    return product ? Number(product.price) : 0;
  }, [product, selectedVariant]);

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
              <p className="text-3xl font-semibold text-primary">
                ${(displayPrice / 100).toFixed(2)}
              </p>
              {!product.hasVariants && (
                <>
                  {isOutOfStock ? (
                    <Badge variant="destructive">Out of Stock</Badge>
                  ) : (
                    <Badge variant="secondary">
                      {Number(product.inventory)} in stock
                    </Badge>
                  )}
                </>
              )}
            </div>
          </div>

          <div className="prose prose-sm max-w-none">
            <p className="text-muted-foreground whitespace-pre-wrap">
              {product.description}
            </p>
          </div>

          {product.hasVariants && (
            <div className="space-y-4 pt-4">
              <div className="space-y-2">
                <Label htmlFor="size-select">Select Size</Label>
                <Select value={selectedSize || ''} onValueChange={setSelectedSize}>
                  <SelectTrigger id="size-select">
                    <SelectValue placeholder="Select size" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableSizes.map(size => (
                      <SelectItem key={size} value={size}>
                        {size}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="color-select">Select Color</Label>
                <Select value={selectedColor || ''} onValueChange={setSelectedColor}>
                  <SelectTrigger id="color-select">
                    <SelectValue placeholder="Select color" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableColors.map(color => (
                      <SelectItem key={color} value={color}>
                        {color}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {selectedSize && selectedColor && selectedVariant && (
                <div className="pt-2">
                  {Number(selectedVariant.inventory) === 0 ? (
                    <Badge variant="destructive">Out of Stock</Badge>
                  ) : Number(selectedVariant.inventory) < 5 ? (
                    <Badge variant="secondary" className="bg-amber-100 text-amber-900 dark:bg-amber-900 dark:text-amber-100">
                      Only {Number(selectedVariant.inventory)} left in stock
                    </Badge>
                  ) : (
                    <Badge variant="secondary">In Stock</Badge>
                  )}
                </div>
              )}
            </div>
          )}

          <div className="pt-4">
            <AddToCartButton 
              product={product} 
              disabled={isOutOfStock}
              hasVariants={product.hasVariants}
              selectedSize={selectedSize}
              selectedColor={selectedColor}
              variants={variants}
            />
          </div>
        </div>
      </div>

      <Separator className="my-12" />

      <div className="max-w-4xl mx-auto space-y-12">
        <div className="space-y-6">
          <h2 className="font-serif text-3xl font-bold">Write a Review</h2>
          <ReviewForm productId={id} />
        </div>

        <Separator />

        <div className="space-y-6">
          <h2 className="font-serif text-3xl font-bold">Customer Reviews</h2>
          <ProductReviews productId={id} />
        </div>
      </div>
    </div>
  );
}
