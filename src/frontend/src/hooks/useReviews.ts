import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { Review } from "../backendTypes";
import { useFullActor } from "./useFullActor";

export function useGetProductReviews(productId: string) {
  const { actor, isFetching } = useFullActor();

  return useQuery<{ reviews: Review[]; averageRating: number }>({
    queryKey: ["productReviews", productId],
    queryFn: async () => {
      if (!actor) return { reviews: [], averageRating: 0 };
      const [reviews, averageRating] = await actor.getProductReviews(productId);
      return { reviews, averageRating };
    },
    enabled: !!actor && !isFetching && !!productId,
  });
}

export function useSubmitReview() {
  const { actor } = useFullActor();
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
      if (!actor) throw new Error("Actor not available");
      return actor.submitReview(
        productId,
        BigInt(rating),
        reviewText,
        variantId || null,
      );
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["productReviews", variables.productId],
      });
    },
  });
}
