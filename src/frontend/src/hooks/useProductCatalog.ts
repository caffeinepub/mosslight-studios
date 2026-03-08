import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { CatalogEntry, CatalogEntryInput } from "../backend";
import { useActor } from "./useActor";

export type { CatalogEntry, CatalogEntryInput };

export function useGetCatalogEntries() {
  const { actor, isFetching } = useActor();

  return useQuery<CatalogEntry[]>({
    queryKey: ["catalogEntries"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getCatalogEntries();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useBulkUpsertCatalogEntries() {
  const queryClient = useQueryClient();
  const { actor, isFetching } = useActor();

  return useMutation({
    mutationFn: async (entries: CatalogEntryInput[]) => {
      if (!actor || isFetching) {
        throw new Error("Backend actor is not available.");
      }
      return actor.bulkUpsertCatalogEntries(entries);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["catalogEntries"] });
    },
  });
}

export function useClearCatalog() {
  const queryClient = useQueryClient();
  const { actor, isFetching } = useActor();

  return useMutation({
    mutationFn: async () => {
      if (!actor || isFetching) {
        throw new Error("Backend actor is not available.");
      }
      return actor.clearCatalog();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["catalogEntries"] });
    },
  });
}

export function useDeleteCatalogEntry() {
  const queryClient = useQueryClient();
  const { actor, isFetching } = useActor();

  return useMutation({
    mutationFn: async (id: string) => {
      if (!actor || isFetching) {
        throw new Error("Backend actor is not available.");
      }
      return actor.deleteCatalogEntry(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["catalogEntries"] });
    },
  });
}
