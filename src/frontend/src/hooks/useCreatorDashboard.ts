import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useActor } from "./useActor";

// Re-export the enum values as a plain object for runtime use
export const IdeaVaultCategory = {
  drawing_idea: "drawing_idea",
  merch_idea: "merch_idea",
  lore: "lore",
  social_hook: "social_hook",
} as const;

export type IdeaVaultCategoryType =
  (typeof IdeaVaultCategory)[keyof typeof IdeaVaultCategory];

// ─── Drawings ────────────────────────────────────────────────────────────────

export function useGetDrawings() {
  const { actor, isFetching } = useActor();
  return useQuery({
    queryKey: ["drawings"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getDrawings();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useAddDrawing() {
  const queryClient = useQueryClient();
  const { actor, isFetching } = useActor();
  return useMutation({
    mutationFn: async ({
      title,
      scheduledDate,
      weekLabel,
    }: {
      title: string;
      scheduledDate: bigint;
      weekLabel: string;
    }) => {
      if (!actor || isFetching) throw new Error("Backend actor not available");
      return actor.addDrawing(title, scheduledDate, weekLabel);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["drawings"] });
    },
  });
}

export function useUpdateDrawingStatus() {
  const queryClient = useQueryClient();
  const { actor, isFetching } = useActor();
  return useMutation({
    mutationFn: async ({
      id,
      field,
      value,
    }: {
      id: string;
      field: string;
      value: boolean;
    }) => {
      if (!actor || isFetching) throw new Error("Backend actor not available");
      return actor.updateDrawingStatus(id, field, value);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["drawings"] });
    },
  });
}

export function useUpdateDrawingDate() {
  const queryClient = useQueryClient();
  const { actor, isFetching } = useActor();
  return useMutation({
    mutationFn: async ({ id, newDate }: { id: string; newDate: bigint }) => {
      if (!actor || isFetching) throw new Error("Backend actor not available");
      return actor.updateDrawingDate(id, newDate);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["drawings"] });
    },
  });
}

export function useDeleteDrawing() {
  const queryClient = useQueryClient();
  const { actor, isFetching } = useActor();
  return useMutation({
    mutationFn: async (id: string) => {
      if (!actor || isFetching) throw new Error("Backend actor not available");
      return actor.deleteDrawing(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["drawings"] });
    },
  });
}

// ─── Merch Pipelines ─────────────────────────────────────────────────────────

export function useGetMerchPipelines() {
  const { actor, isFetching } = useActor();
  return useQuery({
    queryKey: ["merch-pipelines"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getMerchPipelines();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useUpsertMerchPipeline() {
  const queryClient = useQueryClient();
  const { actor, isFetching } = useActor();
  return useMutation({
    mutationFn: async ({
      drawingId,
      sticker,
      magnet,
      keychain,
      tote,
      print,
      uploaded,
      live,
    }: {
      drawingId: string;
      sticker: boolean;
      magnet: boolean;
      keychain: boolean;
      tote: boolean;
      print: boolean;
      uploaded: boolean;
      live: boolean;
    }) => {
      if (!actor || isFetching) throw new Error("Backend actor not available");
      return actor.upsertMerchPipeline(
        drawingId,
        sticker,
        magnet,
        keychain,
        tote,
        print,
        uploaded,
        live,
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["merch-pipelines"] });
    },
  });
}

// ─── Content Bank ─────────────────────────────────────────────────────────────

export function useGetContentBank() {
  const { actor, isFetching } = useActor();
  return useQuery({
    queryKey: ["content-bank"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getContentBank();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useAddContentBankEntry() {
  const queryClient = useQueryClient();
  const { actor, isFetching } = useActor();
  return useMutation({
    mutationFn: async ({
      url,
      contentLabel,
      note,
    }: {
      url: string;
      contentLabel: string;
      note: string;
    }) => {
      if (!actor || isFetching) throw new Error("Backend actor not available");
      return actor.addContentBankEntry(url, contentLabel, note);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["content-bank"] });
    },
  });
}

export function useDeleteContentBankEntry() {
  const queryClient = useQueryClient();
  const { actor, isFetching } = useActor();
  return useMutation({
    mutationFn: async (id: string) => {
      if (!actor || isFetching) throw new Error("Backend actor not available");
      return actor.deleteContentBankEntry(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["content-bank"] });
    },
  });
}

// ─── Idea Vault ───────────────────────────────────────────────────────────────

export function useGetIdeaVault() {
  const { actor, isFetching } = useActor();
  return useQuery({
    queryKey: ["idea-vault"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getIdeaVault();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useAddIdeaVaultEntry() {
  const queryClient = useQueryClient();
  const { actor, isFetching } = useActor();
  return useMutation({
    mutationFn: async ({
      category,
      content,
    }: {
      category: IdeaVaultCategoryType;
      content: string;
    }) => {
      if (!actor || isFetching) throw new Error("Backend actor not available");
      // Cast to any to bridge our runtime const object with the .d.ts enum type
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return actor.addIdeaVaultEntry(category as any, content);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["idea-vault"] });
    },
  });
}

export function useDeleteIdeaVaultEntry() {
  const queryClient = useQueryClient();
  const { actor, isFetching } = useActor();
  return useMutation({
    mutationFn: async (id: string) => {
      if (!actor || isFetching) throw new Error("Backend actor not available");
      return actor.deleteIdeaVaultEntry(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["idea-vault"] });
    },
  });
}
