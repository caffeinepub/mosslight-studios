import { useQuery } from "@tanstack/react-query";
import type { Message } from "../backend";
import { useActor } from "./useActor";

export function useGetMyMessages() {
  const { actor, isFetching } = useActor();

  return useQuery<Message[]>({
    queryKey: ["myMessages"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getMyMessages();
    },
    enabled: !!actor && !isFetching,
  });
}
