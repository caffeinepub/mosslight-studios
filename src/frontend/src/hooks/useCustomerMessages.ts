import { useQuery } from "@tanstack/react-query";
import type { Message } from "../backend";
import { useActor } from "./useActor";
import { useInternetIdentity } from "./useInternetIdentity";

export function useGetMyMessages() {
  const { actor, isFetching } = useActor();
  const { identity } = useInternetIdentity();

  return useQuery<Message[]>({
    queryKey: ["myMessages"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getMyMessages();
    },
    enabled: !!actor && !isFetching && !!identity,
  });
}
