import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useActor } from './useActor';
import type { Review } from '../backend';

export function useGetProductReviews(productId: string) {
  const { actor, isFetching } = useActor();

  return useQuery<{ reviews: Review[]; averageRating: number }>({
    queryKey: ['productReviews', productId],
    queryFn: async () => {
      if (!actor) return { reviews: [], averageRating: 0 };
      const [reviews, averageRating] = await actor.getProductReviews(productId);
      return { reviews, averageRating };
    },
    enabled: !!actor && !isFetching && !!productId,
  });
}

export function useSubmitReview() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      productId,
      rating,
      reviewText,
      variantId,
    }: {
      productId: string;
      rating: number;
      reviewText: string;
      variantId?: string | null;
    }) => {
      if (!actor) throw new Error('Actor not available');
      return actor.submitReview(productId, BigInt(rating), reviewText, variantId || null);
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['productReviews', variables.productId] });
    },
  });
}
