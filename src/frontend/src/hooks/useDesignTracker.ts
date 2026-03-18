import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useFullActor } from "./useFullActor";

// ─── Types ────────────────────────────────────────────────────────────────────

export type DesignStatus =
  | { notStarted: null }
  | { inProgress: null }
  | { done: null };

export interface DesignEntry {
  id: string;
  title: string;
  tags: string[];
  status: DesignStatus;
  createdAt: bigint;
}

export interface CreateDesignData {
  title: string;
  tags: string[];
}

export interface UpdateDesignData {
  title: string;
  tags: string[];
  status: DesignStatus;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

export function statusLabel(s: DesignStatus): string {
  if ("notStarted" in s) return "Not Started";
  if ("inProgress" in s) return "In Progress";
  return "Done";
}

export function statusOrder(s: DesignStatus): number {
  if ("notStarted" in s) return 0;
  if ("inProgress" in s) return 1;
  return 2;
}

export function nextStatus(s: DesignStatus): DesignStatus {
  if ("notStarted" in s) return { inProgress: null };
  if ("inProgress" in s) return { done: null };
  return { done: null };
}

// ─── Queries ─────────────────────────────────────────────────────────────────

export function useGetDesignEntries() {
  const { actor, isFetching } = useFullActor();

  return useQuery<DesignEntry[]>({
    queryKey: ["designEntries"],
    queryFn: async () => {
      if (!actor) return [];
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return (actor as any).getDesignEntries();
    },
    enabled: !!actor && !isFetching,
  });
}

// ─── Mutations ───────────────────────────────────────────────────────────────

export function useAddDesignEntry() {
  const queryClient = useQueryClient();
  const { actor, isFetching } = useFullActor();

  return useMutation({
    mutationFn: async (data: CreateDesignData) => {
      if (!actor || isFetching) throw new Error("Backend actor not available");
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return (actor as any).addDesignEntry(data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["designEntries"] });
    },
  });
}

export function useUpdateDesignEntry() {
  const queryClient = useQueryClient();
  const { actor, isFetching } = useFullActor();

  return useMutation({
    mutationFn: async ({
      id,
      data,
    }: { id: string; data: UpdateDesignData }) => {
      if (!actor || isFetching) throw new Error("Backend actor not available");
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return (actor as any).updateDesignEntry(id, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["designEntries"] });
    },
  });
}

export function useDeleteDesignEntry() {
  const queryClient = useQueryClient();
  const { actor, isFetching } = useFullActor();

  return useMutation({
    mutationFn: async (id: string) => {
      if (!actor || isFetching) throw new Error("Backend actor not available");
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return (actor as any).deleteDesignEntry(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["designEntries"] });
    },
  });
}
