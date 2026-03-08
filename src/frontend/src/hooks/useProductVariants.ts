import { useQuery } from "@tanstack/react-query";
import type { ProductVariant } from "../backendTypes";
import { useFullActor } from "./useFullActor";

export function useGetProductVariants(productId: string) {
  const { actor, isFetching } = useFullActor();

  return useQuery<ProductVariant[]>({
    queryKey: ["productVariants", productId],
    queryFn: async () => {
      if (!actor) return [];
      const result = await actor.getProductVariants(productId);
      return result || [];
    },
    enabled: !!actor && !isFetching && !!productId,
    staleTime: 30000,
  });
}
