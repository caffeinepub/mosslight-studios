import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { Order, OrderStatus } from "../backendTypes";
import { useFullActor } from "./useFullActor";

export function useGetOrders() {
  const { actor, isFetching } = useFullActor();

  return useQuery<Order[]>({
    queryKey: ["orders"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getOrders();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useUpdateOrderStatus() {
  const { actor } = useFullActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      orderId,
      status,
    }: { orderId: string; status: OrderStatus }) => {
      if (!actor) throw new Error("Actor not available");
      return actor.updateOrderStatus(orderId, status);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["orders"] });
    },
  });
}
