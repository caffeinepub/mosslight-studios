import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  ArrowLeft,
  ClipboardList,
  Loader2,
  Pencil,
  Plus,
  Trash2,
} from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import AdminGuard from "../components/AdminGuard";
import {
  type CreateTaskData,
  type Task,
  type TaskPriority,
  type TaskStatus,
  dateToMs,
  msToDate,
  priorityLabel,
  priorityOrder,
  statusLabel,
  statusOrder,
  useAddTask,
  useDeleteTask,
  useGetTasks,
  useUpdateTask,
} from "../hooks/useTasks";

// ─── Styling helpers ─────────────────────────────────────────────────────────

function priorityColor(p: TaskPriority): string {
  if ("high" in p) return "bg-red-100 text-red-700 border-red-200";
  if ("medium" in p) return "bg-yellow-100 text-yellow-700 border-yellow-200";
  return "bg-green-100 text-green-700 border-green-200";
}

function priorityBorder(p: TaskPriority): string {
  if ("high" in p) return "border-l-red-500";
  if ("medium" in p) return "border-l-yellow-500";
  return "border-l-green-500";
}

function statusColor(s: TaskStatus): string {
  if ("notStarted" in s) return "bg-gray-100 text-gray-600 border-gray-200";
  if ("started" in s) return "bg-blue-100 text-blue-700 border-blue-200";
  if ("workingOnIt" in s) return "bg-amber-100 text-amber-700 border-amber-200";
  return "bg-emerald-100 text-emerald-700 border-emerald-200";
}

function formatDate(ms: bigint): string {
  return msToDate(ms).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function toInputDate(ms: bigint): string {
  const d = msToDate(ms);
  return d.toISOString().split("T")[0];
}

// ─── Empty Form State ─────────────────────────────────────────────────────────

const EMPTY_FORM = {
  title: "",
  date: new Date().toISOString().split("T")[0],
  dueDate: "",
  priority: "medium" as "high" | "medium" | "low",
  status: "notStarted" as "notStarted" | "started" | "workingOnIt" | "finished",
};

type FormState = typeof EMPTY_FORM;

function formToPriority(v: FormState["priority"]): TaskPriority {
  if (v === "high") return { high: null };
  if (v === "medium") return { medium: null };
  return { low: null };
}

function formToStatus(v: FormState["status"]): TaskStatus {
  if (v === "notStarted") return { notStarted: null };
  if (v === "started") return { started: null };
  if (v === "workingOnIt") return { workingOnIt: null };
  return { finished: null };
}

function priorityToForm(p: TaskPriority): FormState["priority"] {
  if ("high" in p) return "high";
  if ("medium" in p) return "medium";
  return "low";
}

function statusToForm(s: TaskStatus): FormState["status"] {
  if ("notStarted" in s) return "notStarted";
  if ("started" in s) return "started";
  if ("workingOnIt" in s) return "workingOnIt";
  return "finished";
}

// ─── Task Form Dialog ─────────────────────────────────────────────────────────

function TaskFormDialog({
  open,
  onClose,
  onSubmit,
  initialValues,
  isPending,
  mode,
}: {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: CreateTaskData) => void;
  initialValues?: FormState;
  isPending: boolean;
  mode: "add" | "edit";
}) {
  const [form, setForm] = useState<FormState>(initialValues ?? EMPTY_FORM);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim() || !form.dueDate) {
      toast.error("Please fill in task title and due date");
      return;
    }
    onSubmit({
      title: form.title.trim(),
      date: dateToMs(new Date(form.date)),
      dueDate: dateToMs(new Date(form.dueDate)),
      priority: formToPriority(form.priority),
      status: formToStatus(form.status),
    });
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent data-ocid="task.dialog" className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-serif text-xl">
            {mode === "add" ? "Add New Task" : "Edit Task"}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="task-title">Task</Label>
            <Input
              id="task-title"
              data-ocid="task.input"
              placeholder="What needs to be done?"
              value={form.title}
              onChange={(e) =>
                setForm((f) => ({ ...f, title: e.target.value }))
              }
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="task-date">Date</Label>
              <Input
                id="task-date"
                type="date"
                data-ocid="task.input"
                value={form.date}
                onChange={(e) =>
                  setForm((f) => ({ ...f, date: e.target.value }))
                }
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="task-due">Due Date</Label>
              <Input
                id="task-due"
                type="date"
                data-ocid="task.input"
                value={form.dueDate}
                onChange={(e) =>
                  setForm((f) => ({ ...f, dueDate: e.target.value }))
                }
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Priority</Label>
              <Select
                value={form.priority}
                onValueChange={(v) =>
                  setForm((f) => ({
                    ...f,
                    priority: v as FormState["priority"],
                  }))
                }
              >
                <SelectTrigger data-ocid="task.select">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="high">🔴 High</SelectItem>
                  <SelectItem value="medium">🟡 Medium</SelectItem>
                  <SelectItem value="low">🟢 Low</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Status</Label>
              <Select
                value={form.status}
                onValueChange={(v) =>
                  setForm((f) => ({ ...f, status: v as FormState["status"] }))
                }
              >
                <SelectTrigger data-ocid="task.select">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="notStarted">Not Started</SelectItem>
                  <SelectItem value="started">Started</SelectItem>
                  <SelectItem value="workingOnIt">Working On It</SelectItem>
                  <SelectItem value="finished">Finished</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter className="pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              data-ocid="task.cancel_button"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isPending}
              data-ocid="task.submit_button"
              className="bg-emerald-700 hover:bg-emerald-800 text-white"
            >
              {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {mode === "add" ? "Add Task" : "Save Changes"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function AdminTaskBoardPage() {
  const { data: tasks = [], isLoading } = useGetTasks();
  const addTask = useAddTask();
  const updateTask = useUpdateTask();
  const deleteTask = useDeleteTask();

  const [addOpen, setAddOpen] = useState(false);
  const [editTask, setEditTask] = useState<Task | null>(null);

  const sorted = useMemo(() => {
    return [...tasks].sort((a, b) => {
      const pd = priorityOrder(a.priority) - priorityOrder(b.priority);
      if (pd !== 0) return pd;
      return statusOrder(a.status) - statusOrder(b.status);
    });
  }, [tasks]);

  const handleAdd = (data: CreateTaskData) => {
    addTask.mutate(data, {
      onSuccess: () => {
        setAddOpen(false);
        toast.success("Task added!");
      },
      onError: () => toast.error("Failed to add task"),
    });
  };

  const handleEdit = (data: CreateTaskData) => {
    if (!editTask) return;
    updateTask.mutate(
      { id: editTask.id, data },
      {
        onSuccess: () => {
          setEditTask(null);
          toast.success("Task updated!");
        },
        onError: () => toast.error("Failed to update task"),
      },
    );
  };

  const handleDelete = (id: string) => {
    deleteTask.mutate(id, {
      onSuccess: () => toast.success("Task deleted"),
      onError: () => toast.error("Failed to delete task"),
    });
  };

  return (
    <AdminGuard>
      <div className="container py-10 space-y-8">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-muted-foreground text-sm mb-1">
              <a
                href="/admin-dashboard"
                className="flex items-center gap-1 hover:text-foreground transition-colors"
                data-ocid="task.link"
              >
                <ArrowLeft className="h-3.5 w-3.5" />
                Admin Dashboard
              </a>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-emerald-50 flex items-center justify-center">
                <ClipboardList className="h-5 w-5 text-emerald-700" />
              </div>
              <div>
                <h1 className="font-serif text-3xl font-bold">Task Board</h1>
                <p className="text-muted-foreground text-sm">
                  {tasks.length} task{tasks.length !== 1 ? "s" : ""} — sorted by
                  priority &amp; progress
                </p>
              </div>
            </div>
          </div>
          <Button
            onClick={() => setAddOpen(true)}
            data-ocid="task.primary_button"
            className="bg-emerald-700 hover:bg-emerald-800 text-white gap-2"
          >
            <Plus className="h-4 w-4" />
            Add Task
          </Button>
        </div>

        {/* Legend */}
        <div className="flex flex-wrap gap-3 text-xs">
          <span className="font-medium text-muted-foreground">Priority:</span>
          {(["High", "Medium", "Low"] as const).map((p) => (
            <span
              key={p}
              className={`px-2 py-0.5 rounded-full border font-medium ${
                p === "High"
                  ? "bg-red-100 text-red-700 border-red-200"
                  : p === "Medium"
                    ? "bg-yellow-100 text-yellow-700 border-yellow-200"
                    : "bg-green-100 text-green-700 border-green-200"
              }`}
            >
              {p}
            </span>
          ))}
          <span className="font-medium text-muted-foreground ml-4">
            Status:
          </span>
          {(
            ["Not Started", "Started", "Working On It", "Finished"] as const
          ).map((s) => (
            <span
              key={s}
              className={`px-2 py-0.5 rounded-full border font-medium ${
                s === "Not Started"
                  ? "bg-gray-100 text-gray-600 border-gray-200"
                  : s === "Started"
                    ? "bg-blue-100 text-blue-700 border-blue-200"
                    : s === "Working On It"
                      ? "bg-amber-100 text-amber-700 border-amber-200"
                      : "bg-emerald-100 text-emerald-700 border-emerald-200"
              }`}
            >
              {s}
            </span>
          ))}
        </div>

        {/* Table */}
        {isLoading ? (
          <div
            data-ocid="task.loading_state"
            className="flex items-center justify-center py-20"
          >
            <Loader2 className="h-8 w-8 animate-spin text-emerald-700" />
          </div>
        ) : sorted.length === 0 ? (
          <div
            data-ocid="task.empty_state"
            className="flex flex-col items-center justify-center py-24 text-center space-y-4"
          >
            <div className="w-16 h-16 rounded-full bg-emerald-50 flex items-center justify-center">
              <ClipboardList className="h-8 w-8 text-emerald-600" />
            </div>
            <div>
              <p className="font-medium text-lg">No tasks yet</p>
              <p className="text-muted-foreground text-sm">
                Add your first task to get started
              </p>
            </div>
            <Button
              onClick={() => setAddOpen(true)}
              data-ocid="task.secondary_button"
              variant="outline"
              className="gap-2"
            >
              <Plus className="h-4 w-4" />
              Add Task
            </Button>
          </div>
        ) : (
          <div className="rounded-xl border border-border overflow-hidden shadow-sm">
            <Table data-ocid="task.table">
              <TableHeader>
                <TableRow className="bg-muted/40">
                  <TableHead className="w-[40%] font-semibold">Task</TableHead>
                  <TableHead className="font-semibold">Date</TableHead>
                  <TableHead className="font-semibold">Due Date</TableHead>
                  <TableHead className="font-semibold">Priority</TableHead>
                  <TableHead className="font-semibold">Status</TableHead>
                  <TableHead className="w-[80px]" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {sorted.map((task, i) => (
                  <TableRow
                    key={task.id}
                    data-ocid={`task.item.${i + 1}`}
                    className={`border-l-4 ${priorityBorder(task.priority)} ${
                      "finished" in task.status ? "opacity-60" : ""
                    } hover:bg-muted/30 transition-colors`}
                  >
                    <TableCell className="font-medium">
                      <span
                        className={`${
                          "finished" in task.status
                            ? "line-through text-muted-foreground"
                            : ""
                        }`}
                      >
                        {task.title}
                      </span>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {formatDate(task.date)}
                    </TableCell>
                    <TableCell className="text-sm">
                      <span
                        className={`${
                          new Date() > msToDate(task.dueDate) &&
                          !("finished" in task.status)
                            ? "text-red-600 font-medium"
                            : "text-muted-foreground"
                        }`}
                      >
                        {formatDate(task.dueDate)}
                      </span>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={`text-xs font-medium ${priorityColor(task.priority)}`}
                      >
                        {priorityLabel(task.priority)}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={`text-xs font-medium ${statusColor(task.status)}`}
                      >
                        {statusLabel(task.status)}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-7 w-7"
                          data-ocid={`task.edit_button.${i + 1}`}
                          onClick={() => setEditTask(task)}
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button
                              size="icon"
                              variant="ghost"
                              className="h-7 w-7 text-destructive hover:text-destructive"
                              data-ocid={`task.delete_button.${i + 1}`}
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent data-ocid="task.dialog">
                            <AlertDialogHeader>
                              <AlertDialogTitle>Delete Task?</AlertDialogTitle>
                              <AlertDialogDescription>
                                This will permanently delete &ldquo;{task.title}
                                &rdquo;.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel data-ocid="task.cancel_button">
                                Cancel
                              </AlertDialogCancel>
                              <AlertDialogAction
                                data-ocid="task.confirm_button"
                                className="bg-destructive hover:bg-destructive/90"
                                onClick={() => handleDelete(task.id)}
                              >
                                Delete
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </div>

      {/* Add Dialog */}
      <TaskFormDialog
        open={addOpen}
        onClose={() => setAddOpen(false)}
        onSubmit={handleAdd}
        isPending={addTask.isPending}
        mode="add"
      />

      {/* Edit Dialog */}
      <TaskFormDialog
        open={!!editTask}
        onClose={() => setEditTask(null)}
        onSubmit={handleEdit}
        initialValues={
          editTask
            ? {
                title: editTask.title,
                date: toInputDate(editTask.date),
                dueDate: toInputDate(editTask.dueDate),
                priority: priorityToForm(editTask.priority),
                status: statusToForm(editTask.status),
              }
            : undefined
        }
        isPending={updateTask.isPending}
        mode="edit"
      />
    </AdminGuard>
  );
}
