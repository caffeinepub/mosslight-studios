import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { Customer, Message } from "../backend";
import { useActor } from "./useActor";

export function useGetMessages() {
  const { actor, isFetching } = useActor();

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
  const { actor } = useActor();
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
