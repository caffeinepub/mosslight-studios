import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { Notification } from "../backendTypes";
import { useFullActor } from "./useFullActor";
import { useInternetIdentity } from "./useInternetIdentity";

export function useGetUnreadNotifications() {
  const { actor, isFetching } = useFullActor();
  const { identity } = useInternetIdentity();

  return useQuery<Notification[]>({
    queryKey: ["unreadNotifications"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getUnreadNotifications();
    },
    enabled: !!actor && !isFetching && !!identity,
  });
}

export function useMarkNotificationAsRead() {
  const { actor } = useFullActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (notificationId: string) => {
      if (!actor) throw new Error("Actor not available");
      return actor.markNotificationAsRead(notificationId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["unreadNotifications"] });
    },
  });
}
