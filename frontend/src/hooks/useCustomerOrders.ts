import { useQuery } from '@tanstack/react-query';
import { useActor } from './useActor';
import type { Order } from '../backend';

export function useGetMyOrders() {
  const { actor, isFetching } = useActor();

  return useQuery<Order[]>({
    queryKey: ['myOrders'],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getMyOrders();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useGetMyOrder(orderId: string) {
  const { actor, isFetching } = useActor();

  return useQuery<Order | null>({
    queryKey: ['myOrder', orderId],
    queryFn: async () => {
      if (!actor) return null;
      return actor.getMyOrder(orderId);
    },
    enabled: !!actor && !isFetching && !!orderId,
  });
}

