import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { ExternalBlob } from "../backend";
import type { BlogPost } from "../backendTypes";
import { useFullActor } from "./useFullActor";

export function useGetBlogPosts() {
  const { actor, isFetching } = useFullActor();

  return useQuery<BlogPost[]>({
    queryKey: ["blogPosts"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getBlogPosts();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useAddBlogPost() {
  const { actor } = useFullActor();
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
      if (!actor) throw new Error("Actor not available");
      return actor.addBlogPost(title, bodyText, image);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["blogPosts"] });
    },
  });
}

export function useDeleteBlogPost() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (_id: string) => {
      // Backend does not expose deleteBlogPost yet
      throw new Error("Delete blog post not yet implemented in backend");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["blogPosts"] });
    },
  });
}
