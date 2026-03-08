import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type {
  ProductCatalogEntry,
  ProductCatalogEntryInput,
} from "../types/catalog";
import { useActor } from "./useActor";

// The catalog methods exist on the deployed canister but are not yet reflected
// in the generated backend.d.ts. We extend the actor type locally.
interface CatalogActor {
  getCatalogEntries(): Promise<ProductCatalogEntry[]>;
  bulkUpsertCatalogEntries(
    entries: ProductCatalogEntryInput[],
  ): Promise<ProductCatalogEntry[]>;
  clearCatalog(): Promise<void>;
  deleteCatalogEntry(id: string): Promise<boolean>;
}

function asCatalogActor(actor: unknown): CatalogActor {
  return actor as CatalogActor;
}

export function useGetCatalogEntries() {
  const { actor, isFetching } = useActor();

  return useQuery<ProductCatalogEntry[]>({
    queryKey: ["catalogEntries"],
    queryFn: async () => {
      if (!actor) return [];
      return asCatalogActor(actor).getCatalogEntries();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useBulkUpsertCatalogEntries() {
  const queryClient = useQueryClient();
  const { actor, isFetching } = useActor();

  return useMutation({
    mutationFn: async (entries: ProductCatalogEntryInput[]) => {
      if (!actor || isFetching) {
        throw new Error("Backend actor is not available.");
      }
      return asCatalogActor(actor).bulkUpsertCatalogEntries(entries);
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
      return asCatalogActor(actor).clearCatalog();
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
      return asCatalogActor(actor).deleteCatalogEntry(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["catalogEntries"] });
    },
  });
}
