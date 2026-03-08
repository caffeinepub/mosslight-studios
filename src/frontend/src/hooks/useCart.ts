import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { OrderItem } from "../backendTypes";
import { useFullActor } from "./useFullActor";
import { useInternetIdentity } from "./useInternetIdentity";

export function useViewCart() {
  const { actor, isFetching } = useFullActor();
  const { identity } = useInternetIdentity();

  return useQuery<OrderItem[]>({
    queryKey: ["cart"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.viewCart();
    },
    enabled: !!actor && !isFetching && !!identity,
  });
}

export function useAddItemToCart() {
  const { actor } = useFullActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (item: OrderItem) => {
      if (!actor) throw new Error("Actor not available");
      return actor.addItemToCart(item);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cart"] });
    },
  });
}

export function useClearCart() {
  const { actor } = useFullActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      if (!actor) throw new Error("Actor not available");
      return actor.clearCart();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cart"] });
    },
  });
}

export function useCheckout() {
  const { actor } = useFullActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      if (!actor) throw new Error("Actor not available");
      return actor.checkout();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cart"] });
      queryClient.invalidateQueries({ queryKey: ["myOrders"] });
      queryClient.invalidateQueries({ queryKey: ["products"] });
    },
  });
}
