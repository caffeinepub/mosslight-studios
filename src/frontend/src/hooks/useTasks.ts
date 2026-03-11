import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useFullActor } from "./useFullActor";

// ─── Types ────────────────────────────────────────────────────────────────────

export type TaskPriority = { high: null } | { medium: null } | { low: null };

export type TaskStatus =
  | { notStarted: null }
  | { started: null }
  | { workingOnIt: null }
  | { finished: null };

export interface Task {
  id: string;
  title: string;
  date: bigint;
  dueDate: bigint;
  priority: TaskPriority;
  status: TaskStatus;
  createdAt: bigint;
}

export interface CreateTaskData {
  title: string;
  date: bigint;
  dueDate: bigint;
  priority: TaskPriority;
  status: TaskStatus;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

export function priorityLabel(p: TaskPriority): string {
  if ("high" in p) return "High";
  if ("medium" in p) return "Medium";
  return "Low";
}

export function statusLabel(s: TaskStatus): string {
  if ("notStarted" in s) return "Not Started";
  if ("started" in s) return "Started";
  if ("workingOnIt" in s) return "Working On It";
  return "Finished";
}

export function priorityOrder(p: TaskPriority): number {
  if ("high" in p) return 0;
  if ("medium" in p) return 1;
  return 2;
}

export function statusOrder(s: TaskStatus): number {
  if ("notStarted" in s) return 0;
  if ("started" in s) return 1;
  if ("workingOnIt" in s) return 2;
  return 3;
}

export function msToDate(ms: bigint): Date {
  return new Date(Number(ms));
}

export function dateToMs(date: Date): bigint {
  return BigInt(date.getTime());
}

// ─── Queries ─────────────────────────────────────────────────────────────────

export function useGetTasks() {
  const { actor, isFetching } = useFullActor();

  return useQuery<Task[]>({
    queryKey: ["tasks"],
    queryFn: async () => {
      if (!actor) return [];
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return (actor as any).getTasks();
    },
    enabled: !!actor && !isFetching,
  });
}

// ─── Mutations ───────────────────────────────────────────────────────────────

export function useAddTask() {
  const queryClient = useQueryClient();
  const { actor, isFetching } = useFullActor();

  return useMutation({
    mutationFn: async (data: CreateTaskData) => {
      if (!actor || isFetching) throw new Error("Backend actor not available");
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return (actor as any).addTask(data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
    },
  });
}

export function useUpdateTask() {
  const queryClient = useQueryClient();
  const { actor, isFetching } = useFullActor();

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: CreateTaskData }) => {
      if (!actor || isFetching) throw new Error("Backend actor not available");
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return (actor as any).updateTask(id, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
    },
  });
}

export function useDeleteTask() {
  const queryClient = useQueryClient();
  const { actor, isFetching } = useFullActor();

  return useMutation({
    mutationFn: async (id: string) => {
      if (!actor || isFetching) throw new Error("Backend actor not available");
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return (actor as any).deleteTask(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
    },
  });
}
