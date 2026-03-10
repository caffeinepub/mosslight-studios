// useProductCatalog.ts
// Stores catalog data in localStorage — no backend auth needed.
// Financial data is private and only viewed by the admin on their own device.

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { CatalogEntry, CatalogEntryInput } from "../backend";

export type { CatalogEntry, CatalogEntryInput };

const CATALOG_STORAGE_KEY = "mosslight_product_catalog";
const QUERY_KEY = ["catalogEntries"];

// ─── localStorage helpers ────────────────────────────────────────────────────

function loadEntries(): CatalogEntry[] {
  try {
    const raw = localStorage.getItem(CATALOG_STORAGE_KEY);
    return raw ? (JSON.parse(raw) as CatalogEntry[]) : [];
  } catch {
    return [];
  }
}

function saveEntries(entries: CatalogEntry[]): void {
  localStorage.setItem(CATALOG_STORAGE_KEY, JSON.stringify(entries));
}

// ─── Always-ready status (no backend needed) ─────────────────────────────────

export function useCatalogActorStatus() {
  return { isReady: true, isBuilding: false, isAuthenticated: true };
}

// ─── Hooks ───────────────────────────────────────────────────────────────────

export function useGetCatalogEntries() {
  return useQuery<CatalogEntry[]>({
    queryKey: QUERY_KEY,
    queryFn: loadEntries,
    staleTime: 0,
  });
}

export function useBulkUpsertCatalogEntries() {
  const queryClient = useQueryClient();

  return {
    ...useMutation({
      mutationFn: async (
        inputs: CatalogEntryInput[],
      ): Promise<CatalogEntry[]> => {
        const existing = loadEntries();
        const map = new Map<string, CatalogEntry>(
          existing.map((e) => [e.id, e]),
        );

        const now = BigInt(Date.now()) * BigInt(1_000_000);

        const upserted: CatalogEntry[] = inputs.map((input, idx) => {
          // Use a deterministic key so re-uploading the same CSV updates rows
          const key = `${input.item_name}::${input.size}::${input.merch_type}`;
          const existing_entry = [...map.values()].find((e) => {
            const eKey = `${e.item_name}::${e.size}::${e.merch_type}`;
            return eKey === key;
          });

          const id = existing_entry?.id ?? `catalog_${idx}_${Date.now()}`;
          const entry: CatalogEntry = {
            ...input,
            id,
            linkedProductId: input.linkedProductId ?? "",
            createdAt: existing_entry?.createdAt ?? now,
          };
          map.set(id, entry);
          return entry;
        });

        saveEntries([...map.values()]);
        return upserted;
      },
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: QUERY_KEY });
      },
    }),
    isReady: true,
    isBuilding: false,
    isAuthenticated: true,
  };
}

export function useClearCatalog() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      saveEntries([]);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEY });
    },
  });
}

export function useDeleteCatalogEntry() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const entries = loadEntries().filter((e) => e.id !== id);
      saveEntries(entries);
      return true;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEY });
    },
  });
}
