import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { Customer, Message } from "../backendTypes";
import { useFullActor } from "./useFullActor";

export function useGetMessages() {
  const { actor, isFetching } = useFullActor();

  return useQuery<Message[]>({
    queryKey: ["messages"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getMessages();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useSendMessage() {
  const { actor } = useFullActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      content,
      recipient,
    }: { content: string; recipient: Customer | null }) => {
      if (!actor) throw new Error("Actor not available");
      return actor.sendMessage(content, recipient);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["messages"] });
    },
  });
}
