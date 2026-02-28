import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useActor } from './useActor';
import type { Comment } from '../backend';
import { CommentParentType } from '../backend';

export function useGetCommentsByParent(parentId: string, parentType: CommentParentType) {
  const { actor, isFetching } = useActor();

  return useQuery<Comment[]>({
    queryKey: ['comments', parentId, parentType],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getCommentsByParent(parentId, parentType);
    },
    enabled: !!actor && !isFetching && !!parentId,
  });
}

export function useAddComment() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      parentId,
      parentType,
      name,
      text,
    }: {
      parentId: string;
      parentType: CommentParentType;
      name: string;
      text: string;
    }) => {
      if (!actor) throw new Error('Actor not available');
      return actor.addComment(parentId, parentType, name, text);
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: ['comments', variables.parentId, variables.parentType],
      });
    },
  });
}
