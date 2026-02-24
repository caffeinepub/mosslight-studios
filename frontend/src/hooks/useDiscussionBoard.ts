import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useActor } from './useActor';
import type { DiscussionPost } from '../backend';

export function useDiscussionPosts() {
  const { actor, isFetching } = useActor();

  return useQuery<DiscussionPost[]>({
    queryKey: ['discussionPosts'],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getAllDiscussionPosts();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useDiscussionThread(postId: string) {
  const { actor, isFetching } = useActor();

  return useQuery<DiscussionPost | undefined>({
    queryKey: ['discussionPost', postId],
    queryFn: async () => {
      if (!actor) return undefined;
      const posts = await actor.getAllDiscussionPosts();
      return posts.find(post => post.id === postId);
    },
    enabled: !!actor && !isFetching && !!postId,
  });
}

export function useCreateDiscussionPost() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (question: string) => {
      if (!actor) throw new Error('Actor not available');
      return actor.createDiscussionPost(question);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['discussionPosts'] });
    },
  });
}

export function useReplyToPost() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ postId, content }: { postId: string; content: string }) => {
      if (!actor) throw new Error('Actor not available');
      return actor.addReply(postId, content);
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['discussionPosts'] });
      queryClient.invalidateQueries({ queryKey: ['discussionPost', variables.postId] });
    },
  });
}
