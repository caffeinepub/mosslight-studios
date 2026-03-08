import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { CatalogEntry, CatalogEntryInput } from "../backend";
import { useActor } from "./useActor";
import { useInternetIdentity } from "./useInternetIdentity";

export type { CatalogEntry, CatalogEntryInput };

/** Returns true only when the actor is ready AND backed by a real (non-anonymous) II identity. */
function useAuthenticatedActor() {
  const { actor, isFetching } = useActor();
  const { identity } = useInternetIdentity();
  const isReady =
    !!actor &&
    !isFetching &&
    !!identity &&
    !identity.getPrincipal().isAnonymous();
  return { actor, isFetching, isReady, identity };
}

export function useGetCatalogEntries() {
  const { actor, isFetching, isReady } = useAuthenticatedActor();

  return useQuery<CatalogEntry[]>({
    queryKey: ["catalogEntries"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getCatalogEntries();
    },
    enabled: isReady && !isFetching,
  });
}

export function useBulkUpsertCatalogEntries() {
  const queryClient = useQueryClient();
  const { actor, isFetching, isReady } = useAuthenticatedActor();

  return useMutation({
    mutationFn: async (entries: CatalogEntryInput[]) => {
      if (!isReady || !actor || isFetching) {
        throw new Error(
          "Not signed in with Internet Identity. Please sign in and try again.",
        );
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
  const { actor, isFetching, isReady } = useAuthenticatedActor();

  return useMutation({
    mutationFn: async () => {
      if (!isReady || !actor || isFetching) {
        throw new Error(
          "Not signed in with Internet Identity. Please sign in and try again.",
        );
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
  const { actor, isFetching, isReady } = useAuthenticatedActor();

  return useMutation({
    mutationFn: async (id: string) => {
      if (!isReady || !actor || isFetching) {
        throw new Error(
          "Not signed in with Internet Identity. Please sign in and try again.",
        );
      }
      return actor.deleteCatalogEntry(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["catalogEntries"] });
    },
  });
}
