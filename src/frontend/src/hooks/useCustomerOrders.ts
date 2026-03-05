import { useQuery } from "@tanstack/react-query";
import type { Order } from "../backend";
import { useActor } from "./useActor";
import { useInternetIdentity } from "./useInternetIdentity";

export function useGetMyOrders() {
  const { actor, isFetching } = useActor();
  const { identity } = useInternetIdentity();

  return useQuery<Order[]>({
    queryKey: ["myOrders"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getMyOrders();
    },
    enabled: !!actor && !isFetching && !!identity,
  });
}

export function useGetMyOrder(orderId: string) {
  const { actor, isFetching } = useActor();
  const { identity } = useInternetIdentity();

  return useQuery<Order | null>({
    queryKey: ["myOrder", orderId],
    queryFn: async () => {
      if (!actor) return null;
      return actor.getMyOrder(orderId);
    },
    enabled: !!actor && !isFetching && !!orderId && !!identity,
  });
}
