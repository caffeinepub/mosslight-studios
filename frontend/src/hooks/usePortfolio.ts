import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useActor } from './useActor';
import type { PortfolioItem, ExternalBlob } from '../backend';

export function useGetPortfolioItems() {
  const { actor, isFetching } = useActor();

  return useQuery<PortfolioItem[]>({
    queryKey: ['portfolioItems'],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getPortfolioItems();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useAddPortfolioItem() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      title,
      description,
      image,
      category,
    }: {
      title: string;
      description: string;
      image: ExternalBlob;
      category: string;
    }) => {
      if (!actor) throw new Error('Actor not available');
      return actor.addPortfolioItem(title, description, image, category);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['portfolioItems'] });
    },
  });
}

export function useDeletePortfolioItem() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (_id: string) => {
      // Backend does not expose deletePortfolioItem yet
      throw new Error('Delete portfolio item not yet implemented in backend');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['portfolioItems'] });
    },
  });
}
