import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useActor } from './useActor';
import type { SocialMediaContent, GalleryItem, ExternalBlob } from '../backend';

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
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (_: { content: string; media: ExternalBlob[] }) => {
      throw new Error('Social media content upload not yet implemented in backend');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['socialMediaContent'] });
    },
  });
}

export function useGetGalleryItems() {
  const { actor, isFetching } = useActor();

  return useQuery<GalleryItem[]>({
    queryKey: ['galleryItems'],
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
    }: {
      title: string;
      description: string;
      image: ExternalBlob;
    }) => {
      if (!actor) throw new Error('Actor not available');
      return actor.addGalleryItem(title, description, image);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['galleryItems'] });
    },
  });
}

export function useDeleteGalleryItem() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (_id: string) => {
      // Backend does not expose deleteGalleryItem yet
      throw new Error('Delete gallery item not yet implemented in backend');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['galleryItems'] });
    },
  });
}
