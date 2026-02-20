import { useParams, useNavigate } from '@tanstack/react-router';
import { useGetProduct } from '../hooks/useProducts';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Loader2, ArrowLeft } from 'lucide-react';
import AddToCartButton from '../components/AddToCartButton';
import ProductReviews from '../components/ProductReviews';
import ReviewForm from '../components/ReviewForm';

export default function ProductDetailPage() {
  const { id } = useParams({ from: '/products/$id' });
  const navigate = useNavigate();
  const { data: product, isLoading } = useGetProduct(id);

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

  const isOutOfStock = Number(product.inventory) === 0;
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
                ${(Number(product.price) / 100).toFixed(2)}
              </p>
              {isOutOfStock ? (
                <Badge variant="destructive">Out of Stock</Badge>
              ) : (
                <Badge variant="secondary">
                  {Number(product.inventory)} in stock
                </Badge>
              )}
            </div>
          </div>

          <div className="prose prose-sm max-w-none">
            <p className="text-muted-foreground whitespace-pre-wrap">
              {product.description}
            </p>
          </div>

          <div className="pt-4">
            <AddToCartButton product={product} disabled={isOutOfStock} />
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
