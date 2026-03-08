import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type {
  CommissionAddon,
  CommissionRequestStatus,
  ExternalBlob,
} from "../backendTypes";
import { useFullActor } from "./useFullActor";

// ─── Queries ────────────────────────────────────────────────────────────────

export function useGetCommissions() {
  const { actor, isFetching } = useFullActor();

  return useQuery({
    queryKey: ["commissions"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getCommissions();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useGetCommission(commissionId: string) {
  const { actor, isFetching } = useFullActor();

  return useQuery({
    queryKey: ["commission", commissionId],
    queryFn: async () => {
      if (!actor) return null;
      return actor.getCommission(commissionId);
    },
    enabled: !!actor && !isFetching && !!commissionId,
  });
}

export function useGetCommissionRequests() {
  const { actor, isFetching } = useFullActor();

  return useQuery({
    queryKey: ["commissionRequests"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getCommissionRequests();
    },
    enabled: !!actor && !isFetching,
  });
}

// ─── Mutations ───────────────────────────────────────────────────────────────

export function useAddCommission() {
  const queryClient = useQueryClient();
  const { actor, isFetching } = useFullActor();

  return useMutation({
    mutationFn: async ({
      title,
      description,
      basePrice,
      totalSpots,
      addons,
    }: {
      title: string;
      description: string;
      basePrice: bigint;
      totalSpots: bigint;
      addons: CommissionAddon[];
    }) => {
      if (!actor || isFetching) {
        throw new Error("Backend actor is not available. Please try again.");
      }
      return actor.addCommission(
        title,
        description,
        basePrice,
        totalSpots,
        addons,
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["commissions"] });
    },
  });
}

export function useUpdateCommission() {
  const queryClient = useQueryClient();
  const { actor, isFetching } = useFullActor();

  return useMutation({
    mutationFn: async ({
      commissionId,
      title,
      description,
      basePrice,
      totalSpots,
      addons,
    }: {
      commissionId: string;
      title: string;
      description: string;
      basePrice: bigint;
      totalSpots: bigint;
      addons: CommissionAddon[];
    }) => {
      if (!actor || isFetching) {
        throw new Error("Backend actor is not available. Please try again.");
      }
      return actor.updateCommission(
        commissionId,
        title,
        description,
        basePrice,
        totalSpots,
        addons,
      );
    },
    onSuccess: (_data, { commissionId }) => {
      queryClient.invalidateQueries({ queryKey: ["commissions"] });
      queryClient.invalidateQueries({ queryKey: ["commission", commissionId] });
    },
  });
}

export function useDeleteCommission() {
  const queryClient = useQueryClient();
  const { actor, isFetching } = useFullActor();

  return useMutation({
    mutationFn: async (commissionId: string) => {
      if (!actor || isFetching) {
        throw new Error("Backend actor is not available. Please try again.");
      }
      return actor.deleteCommission(commissionId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["commissions"] });
    },
  });
}

export function useSubmitCommissionRequest() {
  const queryClient = useQueryClient();
  const { actor, isFetching } = useFullActor();

  return useMutation({
    mutationFn: async ({
      commissionId,
      name,
      discordUsername,
      phoneNumber,
      email,
      description,
      selectedAddons,
      referenceImages,
    }: {
      commissionId: string;
      name: string;
      discordUsername: string | null;
      phoneNumber: string | null;
      email: string | null;
      description: string;
      selectedAddons: CommissionAddon[];
      referenceImages: ExternalBlob[];
    }) => {
      if (!actor || isFetching) {
        throw new Error("Backend actor is not available. Please try again.");
      }
      return actor.submitCommissionRequest(
        commissionId,
        name,
        discordUsername,
        phoneNumber,
        email,
        description,
        selectedAddons,
        referenceImages,
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["commissionRequests"] });
    },
  });
}

export function useUpdateCommissionRequestStatus() {
  const queryClient = useQueryClient();
  const { actor, isFetching } = useFullActor();

  return useMutation({
    mutationFn: async ({
      requestId,
      status,
    }: {
      requestId: string;
      status: CommissionRequestStatus;
    }) => {
      if (!actor || isFetching) {
        throw new Error("Backend actor is not available. Please try again.");
      }
      return actor.updateCommissionRequestStatus(requestId, status);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["commissionRequests"] });
      queryClient.invalidateQueries({ queryKey: ["commissions"] });
    },
  });
}
