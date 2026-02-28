import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useActor } from './useActor';
import type { BlogPost, ExternalBlob } from '../backend';

export function useGetBlogPosts() {
  const { actor, isFetching } = useActor();

  return useQuery<BlogPost[]>({
    queryKey: ['blogPosts'],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getBlogPosts();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useAddBlogPost() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      title,
      bodyText,
      image,
    }: {
      title: string;
      bodyText: string;
      image: ExternalBlob | null;
    }) => {
      if (!actor) throw new Error('Actor not available');
      return actor.addBlogPost(title, bodyText, image);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['blogPosts'] });
    },
  });
}

export function useDeleteBlogPost() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (_id: string) => {
      // Backend does not expose deleteBlogPost yet
      throw new Error('Delete blog post not yet implemented in backend');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['blogPosts'] });
    },
  });
}
