import { useQuery } from "@tanstack/react-query";
import type { Message } from "../backendTypes";
import { useFullActor } from "./useFullActor";
import { useInternetIdentity } from "./useInternetIdentity";

export function useGetMyMessages() {
  const { actor, isFetching } = useFullActor();
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
