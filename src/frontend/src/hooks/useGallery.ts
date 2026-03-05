import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { ExternalBlob, GalleryItem, SocialMediaContent } from "../backend";
import { useActor } from "./useActor";

export function useGetSocialMediaContent() {
  const { actor, isFetching } = useActor();

  return useQuery<SocialMediaContent[]>({
    queryKey: ["socialMediaContent"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getSocialMediaContent();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useAddSocialMediaContent() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (_: { content: string; media: ExternalBlob[] }) => {
      throw new Error(
        "Social media content upload not yet implemented in backend",
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["socialMediaContent"] });
    },
  });
}

export function useGetGalleryItems() {
  const { actor, isFetching } = useActor();

  return useQuery<GalleryItem[]>({
    queryKey: ["galleryItems"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getGalleryItems();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useAddGalleryItem() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      title,
      description,
      image,
      taggedProductIds = [],
    }: {
      title: string;
      description: string;
      image: ExternalBlob;
      taggedProductIds?: string[];
    }) => {
      if (!actor) throw new Error("Actor not available");
      return actor.addGalleryItem(title, description, image, taggedProductIds);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["galleryItems"] });
    },
  });
}

export function useUpdateGalleryItemTags() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      galleryItemId,
      taggedProductIds,
    }: {
      galleryItemId: string;
      taggedProductIds: string[];
    }) => {
      if (!actor) throw new Error("Actor not available");
      return actor.updateGalleryItemTags(galleryItemId, taggedProductIds);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["galleryItems"] });
    },
  });
}

export function useDeleteGalleryItem() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      if (!actor) throw new Error("Actor not available");
      return actor.deleteGalleryItem(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["galleryItems"] });
    },
  });
}
