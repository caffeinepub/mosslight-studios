import { useState } from 'react';
import { useSubmitReview } from '../hooks/useReviews';
import { useInternetIdentity } from '../hooks/useInternetIdentity';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Star } from 'lucide-react';
import { toast } from 'sonner';

interface ReviewFormProps {
  productId: string;
}

export default function ReviewForm({ productId }: ReviewFormProps) {
  const [rating, setRating] = useState(0);
  const [hoveredRating, setHoveredRating] = useState(0);
  const [reviewText, setReviewText] = useState('');
  const { identity } = useInternetIdentity();
  const submitReview = useSubmitReview();

  const isAuthenticated = !!identity;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!isAuthenticated) {
      toast.error('Please log in to submit a review');
      return;
    }

    if (rating === 0) {
      toast.error('Please select a rating');
      return;
    }

    if (!reviewText.trim()) {
      toast.error('Please write a review');
      return;
    }

    try {
      await submitReview.mutateAsync({
        productId,
        rating,
        reviewText: reviewText.trim(),
      });
      toast.success('Review submitted successfully!');
      setRating(0);
      setReviewText('');
    } catch (error: any) {
      if (error.message?.includes('only review products')) {
        toast.error('You can only review products you have purchased');
      } else {
        toast.error('Failed to submit review. Please try again.');
      }
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="text-center py-6 bg-muted/30 rounded-lg">
        <p className="text-muted-foreground">
          Please log in to write a review
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label>Your Rating</Label>
        <div className="flex gap-1">
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              type="button"
              onClick={() => setRating(star)}
              onMouseEnter={() => setHoveredRating(star)}
              onMouseLeave={() => setHoveredRating(0)}
              className="transition-transform hover:scale-110"
            >
              <Star
                className={`h-8 w-8 ${
                  star <= (hoveredRating || rating)
                    ? 'fill-amber-400 text-amber-400'
                    : 'text-gray-300'
                }`}
              />
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="reviewText">Your Review</Label>
        <Textarea
          id="reviewText"
          value={reviewText}
          onChange={(e) => setReviewText(e.target.value)}
          placeholder="Share your experience with this product..."
          rows={4}
          className="resize-none"
        />
      </div>

      <Button
        type="submit"
        disabled={submitReview.isPending || rating === 0 || !reviewText.trim()}
        className="w-full"
      >
        {submitReview.isPending ? 'Submitting...' : 'Submit Review'}
      </Button>
    </form>
  );
}
