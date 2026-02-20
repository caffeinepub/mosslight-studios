import { useQuery } from '@tanstack/react-query';
import { useActor } from './useActor';
import type { ProductVariant } from '../backend';

export function useGetProductVariants(productId: string) {
  const { actor, isFetching } = useActor();

  return useQuery<ProductVariant[]>({
    queryKey: ['productVariants', productId],
    queryFn: async () => {
      if (!actor) return [];
      const result = await actor.getProductVariants(productId);
      return result || [];
    },
    enabled: !!actor && !isFetching && !!productId,
    staleTime: 30000,
  });
}
