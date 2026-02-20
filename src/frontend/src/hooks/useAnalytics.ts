import { useQuery, useMutation } from '@tanstack/react-query';
import { useActor } from './useActor';
import type { Product } from '../backend';

export function useGetAnalyticsData() {
  const { actor, isFetching } = useActor();

  return useQuery<{
    mostClickedProducts: [string, bigint][];
    mostViewedContent: [string, bigint][];
    totalRevenue: bigint;
    orderCount: bigint;
    lowInventoryProducts: Product[];
  }>({
    queryKey: ['analyticsData'],
    queryFn: async () => {
      if (!actor) {
        return {
          mostClickedProducts: [],
          mostViewedContent: [],
          totalRevenue: BigInt(0),
          orderCount: BigInt(0),
          lowInventoryProducts: [],
        };
      }
      return actor.getAnalyticsData();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useRecordAnalyticsEvent() {
  const { actor } = useActor();

  return useMutation({
    mutationFn: async (
      eventType:
        | { __kind__: 'productClick'; productClick: string }
        | { __kind__: 'contentView'; contentView: string }
        | { __kind__: 'orderComplete'; orderComplete: null }
    ) => {
      if (!actor) return;
      return actor.recordAnalyticsEvent(eventType);
    },
  });
}
