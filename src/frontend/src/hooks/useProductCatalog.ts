import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { CatalogEntry, CatalogEntryInput } from "../backend";
import { useActor } from "./useActor";
import { useInternetIdentity } from "./useInternetIdentity";

export type { CatalogEntry, CatalogEntryInput };

/**
 * Returns status info about whether the shared actor is ready for admin calls.
 */
export function useCatalogActorStatus() {
  const { actor, isFetching } = useActor();
  const { identity } = useInternetIdentity();
  const isAuthenticated = !!identity && !identity.getPrincipal().isAnonymous();
  const isReady = !!actor && !isFetching && isAuthenticated;
  const isBuilding = isFetching && isAuthenticated;
  return { isReady, isBuilding, isAuthenticated };
}

export function useGetCatalogEntries() {
  const { actor, isFetching } = useActor();
  const { identity } = useInternetIdentity();
  const isAuthenticated = !!identity && !identity.getPrincipal().isAnonymous();

  return useQuery<CatalogEntry[]>({
    queryKey: ["catalogEntries"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getCatalogEntries();
    },
    enabled: !!actor && !isFetching && isAuthenticated,
  });
}

export function useBulkUpsertCatalogEntries() {
  const queryClient = useQueryClient();
  const { actor, isFetching } = useActor();
  const { identity } = useInternetIdentity();
  const isAuthenticated = !!identity && !identity.getPrincipal().isAnonymous();
  const isBuilding = isFetching && isAuthenticated;
  const isReady = !!actor && !isFetching && isAuthenticated;

  return {
    ...useMutation({
      mutationFn: async (entries: CatalogEntryInput[]) => {
        if (!isAuthenticated) {
          throw new Error(
            "Not signed in with Internet Identity. Please sign in and try again.",
          );
        }
        if (isFetching || !actor) {
          throw new Error(
            "Still connecting to backend. Please wait a moment and try again.",
          );
        }
        return actor.bulkUpsertCatalogEntries(entries);
      },
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ["catalogEntries"] });
      },
    }),
    isReady,
    isBuilding,
    isAuthenticated,
  };
}

export function useClearCatalog() {
  const queryClient = useQueryClient();
  const { actor, isFetching } = useActor();
  const { identity } = useInternetIdentity();
  const isAuthenticated = !!identity && !identity.getPrincipal().isAnonymous();

  return useMutation({
    mutationFn: async () => {
      if (!isAuthenticated) {
        throw new Error(
          "Not signed in with Internet Identity. Please sign in and try again.",
        );
      }
      if (isFetching || !actor) {
        throw new Error(
          "Still connecting to backend. Please wait a moment and try again.",
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
  const { actor, isFetching } = useActor();
  const { identity } = useInternetIdentity();
  const isAuthenticated = !!identity && !identity.getPrincipal().isAnonymous();

  return useMutation({
    mutationFn: async (id: string) => {
      if (!isAuthenticated) {
        throw new Error(
          "Not signed in with Internet Identity. Please sign in and try again.",
        );
      }
      if (isFetching || !actor) {
        throw new Error(
          "Still connecting to backend. Please wait a moment and try again.",
        );
      }
      return actor.deleteCatalogEntry(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["catalogEntries"] });
    },
  });
}
