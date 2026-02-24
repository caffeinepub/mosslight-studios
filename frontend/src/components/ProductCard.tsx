import { Link } from '@tanstack/react-router';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Star } from 'lucide-react';
import { useGetProductReviews } from '../hooks/useReviews';
import { useRecordAnalyticsEvent } from '../hooks/useAnalytics';
import type { Product } from '../backend';

interface ProductCardProps {
  product: Product;
}

export default function ProductCard({ product }: ProductCardProps) {
  const isOutOfStock = Number(product.inventory) === 0;
  const imageUrl = product.images[0]?.getDirectURL();
  const { data } = useGetProductReviews(product.id);
  const recordEvent = useRecordAnalyticsEvent();

  const { averageRating = 0, reviews = [] } = data || {};
  const reviewCount = reviews.length;

  const handleClick = () => {
    try {
      recordEvent.mutate({
        __kind__: 'productClick',
        productClick: product.id,
      });
    } catch (error) {
      // Silently handle analytics errors
    }
  };

  const renderStars = (rating: number) => {
    return (
      <div className="flex gap-0.5">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`h-3 w-3 ${
              star <= Math.round(rating)
                ? 'fill-amber-400 text-amber-400'
                : 'text-gray-300'
            }`}
          />
        ))}
      </div>
    );
  };

  return (
    <Link to="/products/$id" params={{ id: product.id }} onClick={handleClick}>
      <Card className="h-full hover:shadow-elegant transition-shadow cursor-pointer">
        <CardContent className="p-0">
          {imageUrl ? (
            <img
              src={imageUrl}
              alt={product.name}
              className="w-full h-64 object-cover rounded-t-lg"
            />
          ) : (
            <div className="w-full h-64 bg-muted rounded-t-lg flex items-center justify-center">
              <span className="text-muted-foreground">No image</span>
            </div>
          )}
        </CardContent>
        <CardFooter className="flex flex-col items-start gap-2 p-4">
          <div className="w-full flex items-start justify-between gap-2">
            <h3 className="font-serif text-lg font-semibold line-clamp-1">
              {product.name}
            </h3>
            {isOutOfStock && (
              <Badge variant="destructive" className="shrink-0">Out of Stock</Badge>
            )}
          </div>
          
          {reviewCount > 0 && (
            <div className="flex items-center gap-2">
              {renderStars(averageRating)}
              <span className="text-xs text-muted-foreground">
                ({reviewCount})
              </span>
            </div>
          )}
          
          <p className="text-sm text-muted-foreground line-clamp-2">
            {product.description}
          </p>
          <p className="text-xl font-semibold text-primary">
            ${(Number(product.price) / 100).toFixed(2)}
          </p>
        </CardFooter>
      </Card>
    </Link>
  );
}
