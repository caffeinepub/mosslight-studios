import { useMutation, useQuery } from "@tanstack/react-query";
import type { Product } from "../backendTypes";
import { useFullActor } from "./useFullActor";

export function useGetAnalyticsData() {
  const { actor, isFetching } = useFullActor();

  return useQuery<{
    mostClickedProducts: [string, bigint][];
    mostViewedContent: [string, bigint][];
    totalRevenue: bigint;
    orderCount: bigint;
    lowInventoryProducts: Product[];
  }>({
    queryKey: ["analyticsData"],
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
  const { actor } = useFullActor();

  return useMutation({
    mutationFn: async (
      eventType:
        | { __kind__: "productClick"; productClick: string }
        | { __kind__: "contentView"; contentView: string }
        | { __kind__: "orderComplete"; orderComplete: null },
    ) => {
      if (!actor) return;
      return actor.recordAnalyticsEvent(eventType);
    },
  });
}
