import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useActor } from './useActor';
import type { SocialMediaContent, ExternalBlob } from '../backend';

export function useGetSocialMediaContent() {
  const { actor, isFetching } = useActor();

  return useQuery<SocialMediaContent[]>({
    queryKey: ['socialMediaContent'],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getSocialMediaContent();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useAddSocialMediaContent() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ content, media }: { content: string; media: ExternalBlob[] }) => {
      if (!actor) throw new Error('Actor not available');
      // Note: Backend doesn't have addSocialMediaContent method yet
      throw new Error('Social media content upload not yet implemented in backend');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['socialMediaContent'] });
    },
  });
}

