import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useMemo, useRef, useState } from "react";
import type { CatalogEntry, CatalogEntryInput } from "../backend";
import { createActorWithConfig } from "../config";
import { getSecretParameter } from "../utils/urlParams";
import { useInternetIdentity } from "./useInternetIdentity";

export type { CatalogEntry, CatalogEntryInput };

/**
 * Creates a fresh actor directly tied to the current II identity.
 * This bypasses the shared actor cache so the catalog never accidentally
 * uses an anonymous/stale actor.
 */
async function createCatalogActor(identity: unknown) {
  const actorOptions = {
    agentOptions: {
      identity,
    },
  };
  const actor = await createActorWithConfig(
    actorOptions as Parameters<typeof createActorWithConfig>[0],
  );
  const adminToken = getSecretParameter("caffeineAdminToken") || "";
  await actor._initializeAccessControlWithSecret(adminToken);
  return actor;
}

/**
 * Returns a freshly-created actor that is always backed by the current
 * non-anonymous II identity.  `isReady` is only true once the actor has
 * been created and is not currently being (re)built.
 */
function useCatalogActor() {
  const { identity } = useInternetIdentity();
  const principalKey = identity?.getPrincipal().toString() ?? "anonymous";
  const isAuthenticated = !!identity && !identity.getPrincipal().isAnonymous();

  // Keep a ref to the latest actor to avoid re-renders
  const actorRef = useRef<Awaited<
    ReturnType<typeof createActorWithConfig>
  > | null>(null);
  const [isBuilding, setIsBuilding] = useState(false);
  const [isBuilt, setIsBuilt] = useState(false);
  const lastPrincipalRef = useRef<string>("anonymous");

  useEffect(() => {
    if (!isAuthenticated || !identity) {
      actorRef.current = null;
      setIsBuilt(false);
      lastPrincipalRef.current = "anonymous";
      return;
    }

    // Only rebuild if the principal changed
    if (principalKey === lastPrincipalRef.current && actorRef.current) {
      return;
    }

    let cancelled = false;
    setIsBuilding(true);
    setIsBuilt(false);

    createCatalogActor(identity)
      .then((actor) => {
        if (cancelled) return;
        actorRef.current = actor;
        lastPrincipalRef.current = principalKey;
        setIsBuilding(false);
        setIsBuilt(true);
      })
      .catch(() => {
        if (cancelled) return;
        actorRef.current = null;
        setIsBuilding(false);
        setIsBuilt(false);
      });

    return () => {
      cancelled = true;
    };
  }, [identity, principalKey, isAuthenticated]);

  return {
    actor: actorRef.current,
    isReady: isAuthenticated && isBuilt && !isBuilding,
    isBuilding,
    isAuthenticated,
  };
}

export function useCatalogActorStatus() {
  const { isReady, isBuilding, isAuthenticated } = useCatalogActor();
  return { isReady, isBuilding, isAuthenticated };
}

export function useGetCatalogEntries() {
  const { actor, isReady } = useCatalogActor();

  return useQuery<CatalogEntry[]>({
    queryKey: ["catalogEntries"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getCatalogEntries();
    },
    enabled: isReady,
  });
}

export function useBulkUpsertCatalogEntries() {
  const queryClient = useQueryClient();
  const { actor, isReady, isBuilding, isAuthenticated } = useCatalogActor();

  return {
    ...useMutation({
      mutationFn: async (entries: CatalogEntryInput[]) => {
        if (!isAuthenticated) {
          throw new Error(
            "Not signed in with Internet Identity. Please sign in and try again.",
          );
        }
        if (isBuilding || !actor) {
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
  const { actor, isBuilding, isAuthenticated } = useCatalogActor();

  return useMutation({
    mutationFn: async () => {
      if (!isAuthenticated) {
        throw new Error(
          "Not signed in with Internet Identity. Please sign in and try again.",
        );
      }
      if (isBuilding || !actor) {
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
  const { actor, isBuilding, isAuthenticated } = useCatalogActor();

  return useMutation({
    mutationFn: async (id: string) => {
      if (!isAuthenticated) {
        throw new Error(
          "Not signed in with Internet Identity. Please sign in and try again.",
        );
      }
      if (isBuilding || !actor) {
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
