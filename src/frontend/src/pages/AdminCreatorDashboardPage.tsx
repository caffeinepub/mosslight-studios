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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import {
  Bell,
  BookOpen,
  Calendar,
  ChevronLeft,
  ChevronRight,
  Copy,
  ExternalLink,
  Layers,
  LayoutGrid,
  Lightbulb,
  Loader2,
  Package,
  Plus,
  Sparkles,
  Trash2,
} from "lucide-react";
import { useCallback, useMemo, useState } from "react";
import { toast } from "sonner";
import type { Drawing, IdeaVaultEntry, MerchPipeline } from "../backend.d";
import AdminGuard from "../components/AdminGuard";
import {
  IdeaVaultCategory,
  type IdeaVaultCategoryType,
  useAddContentBankEntry,
  useAddDrawing,
  useAddIdeaVaultEntry,
  useDeleteContentBankEntry,
  useDeleteDrawing,
  useDeleteIdeaVaultEntry,
  useGetContentBank,
  useGetDrawings,
  useGetIdeaVault,
  useGetMerchPipelines,
  useUpdateDrawingDate,
  useUpdateDrawingStatus,
  useUpsertMerchPipeline,
} from "../hooks/useCreatorDashboard";
import { dateToMs, useAddTask } from "../hooks/useTasks";

// ─── Utilities ────────────────────────────────────────────────────────────────

function nsToDate(ns: bigint): Date {
  return new Date(Number(ns) / 1_000_000);
}

function dateToNs(date: Date): bigint {
  return BigInt(date.getTime()) * 1_000_000n;
}

function formatDate(date: Date): string {
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function getWeekLabel(date: Date): string {
  const monday = getMonday(date);
  return `Week of ${monday.toLocaleDateString("en-US", { month: "short", day: "numeric" })}`;
}

function getMonday(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay(); // 0=Sun, 1=Mon...
  // Our week is Tue-Mon, so the "start" is Tuesday
  // For display purposes, find the Monday that anchors this week
  const diff = day === 0 ? -6 : 1 - day;
  d.setDate(d.getDate() + diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

function getTuesdayOfWeek(monday: Date): Date {
  const d = new Date(monday);
  d.setDate(d.getDate() + 1);
  return d;
}

function sameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

const STATUS_FIELDS = [
  { key: "status_pov", label: "POV" },
  { key: "status_bts", label: "BTS" },
  { key: "status_external_tl", label: "Ext TL" },
  { key: "status_procreate_tl", label: "Pcreate TL" },
  { key: "status_edited", label: "Edited" },
  { key: "status_posted", label: "Posted" },
  { key: "status_merch", label: "Merch" },
] as const;

type StatusField = (typeof STATUS_FIELDS)[number]["key"];

const MERCH_FIELDS = [
  { key: "sticker", label: "Sticker" },
  { key: "magnet", label: "Magnet" },
  { key: "keychain", label: "Keychain" },
  { key: "tote", label: "Tote" },
  { key: "print", label: "Print" },
  { key: "uploaded", label: "Uploaded" },
  { key: "live", label: "Live" },
] as const;

type MerchField = (typeof MERCH_FIELDS)[number]["key"];

// Week columns: Tue=2 Wed=3 Thu=4 Fri=5 Sat=6 Sun=0 Mon=1
const WEEK_DAYS = [
  { label: "Tue", dayOfWeek: 2 },
  { label: "Wed", dayOfWeek: 3 },
  { label: "Thu", dayOfWeek: 4 },
  { label: "Fri", dayOfWeek: 5 },
  { label: "Sat", dayOfWeek: 6 },
  { label: "Sun", dayOfWeek: 0 },
  { label: "Mon", dayOfWeek: 1 },
];

function getDayDate(tuesday: Date, dayOfWeek: number): Date {
  const d = new Date(tuesday);
  // tuesday is DOW 2; compute offset
  const tueDow = 2;
  let offset = dayOfWeek - tueDow;
  if (dayOfWeek === 0) offset = 5; // Sun is 5 days after Tue
  if (dayOfWeek === 1) offset = 6; // Mon is 6 days after Tue
  d.setDate(d.getDate() + offset);
  return d;
}

// ─── Sub-components ────────────────────────────────────────────────────────────

function StatusDot({
  checked,
  label,
}: {
  checked: boolean;
  label: string;
}) {
  return (
    <span
      title={label}
      className={`inline-block w-2 h-2 rounded-full transition-colors ${
        checked ? "bg-emerald-500" : "bg-muted-foreground/30"
      }`}
    />
  );
}

interface AddDrawingDialogProps {
  defaultDate?: Date;
  onSuccess?: () => void;
}

function AddDrawingDialog({ defaultDate, onSuccess }: AddDrawingDialogProps) {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [dateStr, setDateStr] = useState(
    defaultDate ? defaultDate.toISOString().slice(0, 10) : "",
  );
  const [weekLabel, setWeekLabel] = useState(
    defaultDate ? getWeekLabel(defaultDate) : "",
  );
  const addDrawing = useAddDrawing();

  const handleDateChange = (val: string) => {
    setDateStr(val);
    if (val) setWeekLabel(getWeekLabel(new Date(`${val}T12:00:00`)));
  };

  const handleSubmit = async () => {
    if (!title.trim() || !dateStr) {
      toast.error("Please fill in title and date");
      return;
    }
    try {
      const d = new Date(`${dateStr}T12:00:00`);
      await addDrawing.mutateAsync({
        title: title.trim(),
        scheduledDate: dateToNs(d),
        weekLabel: weekLabel || getWeekLabel(d),
      });
      toast.success("Drawing added");
      setTitle("");
      setOpen(false);
      onSuccess?.();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed to add drawing");
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          size="sm"
          variant="outline"
          className="gap-1 h-7 text-xs"
          data-ocid="drawing.open_modal_button"
        >
          <Plus className="h-3 w-3" />
          Add
        </Button>
      </DialogTrigger>
      <DialogContent data-ocid="drawing.dialog">
        <DialogHeader>
          <DialogTitle className="font-serif">Add Drawing</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="space-y-1">
            <Label htmlFor="drawing-title">Drawing Title</Label>
            <Input
              id="drawing-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Moonlit Forest"
              data-ocid="drawing.input"
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor="drawing-date">Scheduled Date</Label>
            <Input
              id="drawing-date"
              type="date"
              value={dateStr}
              onChange={(e) => handleDateChange(e.target.value)}
              data-ocid="drawing.input"
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor="drawing-week">Week Label</Label>
            <Input
              id="drawing-week"
              value={weekLabel}
              onChange={(e) => setWeekLabel(e.target.value)}
              placeholder="e.g. Week of Mar 10"
              data-ocid="drawing.input"
            />
          </div>
        </div>
        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => setOpen(false)}
            data-ocid="drawing.cancel_button"
          >
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={addDrawing.isPending}
            data-ocid="drawing.submit_button"
          >
            {addDrawing.isPending && (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            )}
            Add Drawing
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── Tab 1: Today / Reminder ───────────────────────────────────────────────────

function TodayTab({ drawings }: { drawings: Drawing[] }) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const todayDrawings = drawings.filter((d) => {
    const date = nsToDate(d.scheduledDate);
    date.setHours(0, 0, 0, 0);
    return date.getTime() === today.getTime();
  });

  const pendingItems = todayDrawings.reduce((acc, d) => {
    const pending = STATUS_FIELDS.filter((f) => !d[f.key as StatusField]);
    return acc + pending.length;
  }, 0);

  return (
    <div className="space-y-6" data-ocid="today.section">
      {/* Banner */}
      <div className="rounded-xl border border-primary/20 bg-primary/5 px-6 py-4 flex items-start gap-4">
        <div className="mt-0.5 p-2 rounded-lg bg-primary/10">
          <Bell className="h-5 w-5 text-primary" />
        </div>
        <div>
          <p className="font-semibold text-foreground">
            Today's Summary —{" "}
            {today.toLocaleDateString("en-US", {
              weekday: "long",
              month: "long",
              day: "numeric",
            })}
          </p>
          <p className="text-sm text-muted-foreground mt-1">
            {todayDrawings.length === 0
              ? "No drawings scheduled today. Enjoy the creative flow! ✦"
              : `${todayDrawings.length} drawing${todayDrawings.length > 1 ? "s" : ""} scheduled today · ${pendingItems} checklist item${pendingItems !== 1 ? "s" : ""} pending`}
          </p>
        </div>
      </div>

      {todayDrawings.length === 0 ? (
        <div
          className="text-center py-16 text-muted-foreground"
          data-ocid="today.empty_state"
        >
          <Sparkles className="h-10 w-10 mx-auto mb-3 opacity-30" />
          <p className="font-medium">Nothing scheduled for today</p>
          <p className="text-sm mt-1">
            Add drawings in the Weekly Workflow or Batch Tracker tabs
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {todayDrawings.map((drawing, i) => {
            const pending = STATUS_FIELDS.filter(
              (f) => !drawing[f.key as StatusField],
            );
            const completed = STATUS_FIELDS.filter(
              (f) => drawing[f.key as StatusField],
            );
            return (
              <Card
                key={drawing.id}
                className="border-l-4 border-l-primary"
                data-ocid={`today.item.${i + 1}`}
              >
                <CardContent className="pt-4 pb-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold font-serif text-base">
                        {drawing.title}
                      </h3>
                      <div className="flex flex-wrap gap-1.5 mt-2">
                        {pending.map((f) => (
                          <Badge
                            key={f.key}
                            variant="outline"
                            className="text-xs text-amber-700 border-amber-300 bg-amber-50"
                          >
                            {f.label}
                          </Badge>
                        ))}
                        {completed.map((f) => (
                          <Badge
                            key={f.key}
                            variant="outline"
                            className="text-xs text-emerald-700 border-emerald-300 bg-emerald-50 line-through opacity-60"
                          >
                            {f.label}
                          </Badge>
                        ))}
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-xs text-muted-foreground">
                        {completed.length}/{STATUS_FIELDS.length} done
                      </p>
                      <div className="mt-1 h-1.5 w-20 bg-muted rounded-full overflow-hidden">
                        <div
                          className="h-full bg-emerald-500 rounded-full transition-all"
                          style={{
                            width: `${(completed.length / STATUS_FIELDS.length) * 100}%`,
                          }}
                        />
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
      <QuickAddTask />
    </div>
  );
}

// Quick Add Task
function QuickAddTask() {
  const addTask = useAddTask();
  const [title, setTitle] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [priority, setPriority] = useState<"high" | "medium" | "low">("medium");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !dueDate) {
      toast.error("Please fill in task title and due date");
      return;
    }
    const p =
      priority === "high"
        ? { high: null }
        : priority === "medium"
          ? { medium: null }
          : { low: null };
    addTask.mutate(
      {
        title: title.trim(),
        date: dateToMs(new Date()),
        dueDate: dateToMs(new Date(dueDate)),
        priority: p,
        status: { notStarted: null },
      },
      {
        onSuccess: () => {
          setTitle("");
          setDueDate("");
          setPriority("medium");
          toast.success("Task added to board!");
        },
        onError: () => toast.error("Failed to add task"),
      },
    );
  };

  return (
    <div className="rounded-xl border border-border bg-card p-5 space-y-4">
      <div className="flex items-center gap-2">
        <div className="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center">
          <Plus className="h-4 w-4 text-emerald-700" />
        </div>
        <div>
          <h3 className="font-semibold text-sm">Quick Add Task</h3>
          <p className="text-xs text-muted-foreground">
            Add to your Task Board instantly
          </p>
        </div>
      </div>
      <form onSubmit={handleSubmit} className="flex flex-wrap gap-2 items-end">
        <div className="flex-1 min-w-[200px]">
          <Input
            placeholder="Task title..."
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            data-ocid="task.input"
          />
        </div>
        <Input
          type="date"
          value={dueDate}
          onChange={(e) => setDueDate(e.target.value)}
          data-ocid="task.input"
          className="w-40"
        />
        <Select
          value={priority}
          onValueChange={(v) => setPriority(v as "high" | "medium" | "low")}
        >
          <SelectTrigger className="w-32" data-ocid="task.select">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="high">High</SelectItem>
            <SelectItem value="medium">Medium</SelectItem>
            <SelectItem value="low">Low</SelectItem>
          </SelectContent>
        </Select>
        <Button
          type="submit"
          disabled={addTask.isPending}
          data-ocid="task.primary_button"
          className="bg-emerald-700 hover:bg-emerald-800 text-white gap-1.5"
        >
          {addTask.isPending ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <Plus className="h-3.5 w-3.5" />
          )}
          Add Task
        </Button>
      </form>
    </div>
  );
}

// ─── Tab 2: Weekly Workflow Board ─────────────────────────────────────────────

function WeeklyWorkflowTab({
  drawings,
}: {
  drawings: Drawing[];
}) {
  const [weekOffset, setWeekOffset] = useState(0);

  const today = new Date();
  const currentMonday = getMonday(today);
  const displayMonday = new Date(currentMonday);
  displayMonday.setDate(displayMonday.getDate() + weekOffset * 7);

  const tuesday = getTuesdayOfWeek(displayMonday);
  const weekLabel = getWeekLabel(displayMonday);

  const drawingsByDay = useMemo(() => {
    const map: Record<number, Drawing[]> = {};
    for (const day of WEEK_DAYS) {
      map[day.dayOfWeek] = [];
    }
    for (const d of drawings) {
      const date = nsToDate(d.scheduledDate);
      const dow = date.getDay();
      if (dow in map) {
        map[dow].push(d);
      }
    }
    return map;
  }, [drawings]);

  const filteredByDay = useMemo(() => {
    const map: Record<number, Drawing[]> = {};
    for (const day of WEEK_DAYS) {
      const dayDate = getDayDate(tuesday, day.dayOfWeek);
      map[day.dayOfWeek] = (drawingsByDay[day.dayOfWeek] || []).filter((d) => {
        const date = nsToDate(d.scheduledDate);
        return sameDay(date, dayDate);
      });
    }
    return map;
  }, [drawingsByDay, tuesday]);

  return (
    <div className="space-y-4" data-ocid="workflow.section">
      {/* Week navigation */}
      <div className="flex items-center justify-between">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setWeekOffset((o) => o - 1)}
          className="gap-1"
          data-ocid="workflow.pagination_prev"
        >
          <ChevronLeft className="h-4 w-4" />
          Prev
        </Button>
        <h2 className="font-serif text-lg font-semibold">{weekLabel}</h2>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setWeekOffset((o) => o + 1)}
          className="gap-1"
          data-ocid="workflow.pagination_next"
        >
          Next
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>

      {/* Day columns */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
        {WEEK_DAYS.map((day) => {
          const dayDate = getDayDate(tuesday, day.dayOfWeek);
          const isToday = sameDay(dayDate, new Date());
          const dayDrawings = filteredByDay[day.dayOfWeek] || [];

          return (
            <div
              key={day.label}
              className={`rounded-lg border p-3 min-h-[180px] flex flex-col gap-2 transition-colors ${
                isToday
                  ? "border-primary/40 bg-primary/5"
                  : "border-border bg-card"
              }`}
            >
              <div className="flex items-center justify-between">
                <div>
                  <p
                    className={`text-xs font-semibold uppercase tracking-wide ${isToday ? "text-primary" : "text-muted-foreground"}`}
                  >
                    {day.label}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {dayDate.toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                    })}
                  </p>
                </div>
                <AddDrawingDialog defaultDate={dayDate} />
              </div>

              <div className="flex-1 space-y-2">
                {dayDrawings.map((d) => (
                  <div
                    key={d.id}
                    className="rounded-md bg-background border p-2 text-xs cursor-default"
                  >
                    <p className="font-medium leading-tight truncate">
                      {d.title}
                    </p>
                    <div className="flex gap-0.5 mt-1.5 flex-wrap">
                      {STATUS_FIELDS.map((f) => (
                        <StatusDot
                          key={f.key}
                          checked={d[f.key as StatusField]}
                          label={f.label}
                        />
                      ))}
                    </div>
                  </div>
                ))}
                {dayDrawings.length === 0 && (
                  <p className="text-xs text-muted-foreground/40 text-center pt-4">
                    Empty
                  </p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Tab 3: Drawing Batch Tracker ─────────────────────────────────────────────

function BatchTrackerTab({
  drawings,
  isLoading,
}: {
  drawings: Drawing[];
  isLoading: boolean;
}) {
  const updateStatus = useUpdateDrawingStatus();
  const deleteDrawing = useDeleteDrawing();

  const handleStatusChange = async (
    id: string,
    field: string,
    value: boolean,
  ) => {
    try {
      await updateStatus.mutateAsync({ id, field, value });
    } catch {
      toast.error("Failed to update status");
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteDrawing.mutateAsync(id);
      toast.success("Drawing deleted");
    } catch {
      toast.error("Failed to delete drawing");
    }
  };

  // Group by weekLabel
  const grouped = useMemo(() => {
    const map: Record<string, Drawing[]> = {};
    for (const d of drawings) {
      if (!map[d.weekLabel]) map[d.weekLabel] = [];
      map[d.weekLabel].push(d);
    }
    return Object.entries(map).sort(([a], [b]) => a.localeCompare(b));
  }, [drawings]);

  return (
    <div className="space-y-6" data-ocid="batch.section">
      <div className="flex items-center justify-between">
        <h2 className="font-serif text-xl font-semibold">
          Drawing Batch Tracker
        </h2>
        <AddDrawingDialog />
      </div>

      {isLoading ? (
        <div className="space-y-2" data-ocid="batch.loading_state">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-12 w-full" />
          ))}
        </div>
      ) : drawings.length === 0 ? (
        <div
          className="text-center py-16 text-muted-foreground"
          data-ocid="batch.empty_state"
        >
          <Layers className="h-10 w-10 mx-auto mb-3 opacity-30" />
          <p className="font-medium">No drawings yet</p>
          <p className="text-sm mt-1">
            Add your first drawing to start tracking
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {grouped.map(([weekLabel, weekDrawings]) => (
            <div key={weekLabel}>
              <div className="flex items-center gap-2 mb-3">
                <Badge variant="outline" className="font-medium">
                  {weekLabel}
                </Badge>
                <span className="text-xs text-muted-foreground">
                  {weekDrawings.length} drawing
                  {weekDrawings.length !== 1 ? "s" : ""}
                </span>
              </div>
              <div className="rounded-lg border overflow-hidden">
                <Table data-ocid="batch.table">
                  <TableHeader>
                    <TableRow className="bg-muted/50">
                      <TableHead className="font-semibold min-w-[140px]">
                        Drawing
                      </TableHead>
                      {STATUS_FIELDS.map((f) => (
                        <TableHead
                          key={f.key}
                          className="text-center text-xs w-16"
                        >
                          {f.label}
                        </TableHead>
                      ))}
                      <TableHead className="text-xs w-28">Date</TableHead>
                      <TableHead className="w-12" />
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {weekDrawings.map((drawing, i) => (
                      <TableRow
                        key={drawing.id}
                        data-ocid={`batch.row.${i + 1}`}
                      >
                        <TableCell className="font-medium text-sm">
                          {drawing.title}
                        </TableCell>
                        {STATUS_FIELDS.map((f) => (
                          <TableCell key={f.key} className="text-center">
                            <Checkbox
                              checked={drawing[f.key as StatusField]}
                              onCheckedChange={(checked) =>
                                handleStatusChange(
                                  drawing.id,
                                  f.key,
                                  checked === true,
                                )
                              }
                              className="data-[state=checked]:bg-emerald-500 data-[state=checked]:border-emerald-500"
                              data-ocid={`batch.checkbox.${i + 1}`}
                            />
                          </TableCell>
                        ))}
                        <TableCell className="text-xs text-muted-foreground">
                          {formatDate(nsToDate(drawing.scheduledDate))}
                        </TableCell>
                        <TableCell>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-7 w-7 text-destructive hover:text-destructive"
                                data-ocid={`batch.delete_button.${i + 1}`}
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>
                                  Delete Drawing
                                </AlertDialogTitle>
                                <AlertDialogDescription>
                                  Delete "{drawing.title}"? This cannot be
                                  undone.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel data-ocid="batch.cancel_button">
                                  Cancel
                                </AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => handleDelete(drawing.id)}
                                  data-ocid="batch.confirm_button"
                                >
                                  Delete
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Tab 4: Merch Pipeline ────────────────────────────────────────────────────

function MerchPipelineTab({
  drawings,
  pipelines,
  isLoading,
}: {
  drawings: Drawing[];
  pipelines: MerchPipeline[];
  isLoading: boolean;
}) {
  const upsert = useUpsertMerchPipeline();

  const pipelineMap = useMemo(() => {
    const map: Record<string, MerchPipeline> = {};
    for (const p of pipelines) map[p.drawingId] = p;
    return map;
  }, [pipelines]);

  const defaultPipeline = (drawingId: string): MerchPipeline => ({
    drawingId,
    sticker: false,
    magnet: false,
    keychain: false,
    tote: false,
    print: false,
    uploaded: false,
    live: false,
  });

  const handleToggle = async (
    drawingId: string,
    field: MerchField,
    value: boolean,
  ) => {
    const current = pipelineMap[drawingId] || defaultPipeline(drawingId);
    const updated = { ...current, [field]: value };
    try {
      await upsert.mutateAsync(updated);
    } catch {
      toast.error("Failed to update merch pipeline");
    }
  };

  return (
    <div className="space-y-6" data-ocid="merch.section">
      <h2 className="font-serif text-xl font-semibold">Merch Pipeline</h2>

      {isLoading ? (
        <div className="space-y-2" data-ocid="merch.loading_state">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-12 w-full" />
          ))}
        </div>
      ) : drawings.length === 0 ? (
        <div
          className="text-center py-16 text-muted-foreground"
          data-ocid="merch.empty_state"
        >
          <Package className="h-10 w-10 mx-auto mb-3 opacity-30" />
          <p className="font-medium">No drawings yet</p>
          <p className="text-sm mt-1">Add drawings first to track merch</p>
        </div>
      ) : (
        <div className="rounded-lg border overflow-auto">
          <Table data-ocid="merch.table">
            <TableHeader>
              <TableRow className="bg-muted/50">
                <TableHead className="font-semibold min-w-[140px]">
                  Drawing
                </TableHead>
                {MERCH_FIELDS.map((f) => (
                  <TableHead key={f.key} className="text-center text-xs w-20">
                    {f.label}
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {drawings.map((drawing, i) => {
                const pipeline =
                  pipelineMap[drawing.id] || defaultPipeline(drawing.id);
                return (
                  <TableRow key={drawing.id} data-ocid={`merch.row.${i + 1}`}>
                    <TableCell className="font-medium text-sm">
                      {drawing.title}
                    </TableCell>
                    {MERCH_FIELDS.map((f) => (
                      <TableCell key={f.key} className="text-center">
                        <Checkbox
                          checked={pipeline[f.key as MerchField]}
                          onCheckedChange={(checked) =>
                            handleToggle(drawing.id, f.key, checked === true)
                          }
                          className="data-[state=checked]:bg-emerald-500 data-[state=checked]:border-emerald-500"
                          data-ocid={`merch.checkbox.${i + 1}`}
                        />
                      </TableCell>
                    ))}
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}

// ─── Tab 5: Content Bank ──────────────────────────────────────────────────────

function ContentBankTab() {
  const { data: entries = [], isLoading } = useGetContentBank();
  const addEntry = useAddContentBankEntry();
  const deleteEntry = useDeleteContentBankEntry();

  const [url, setUrl] = useState("");
  const [label, setLabel] = useState("");
  const [note, setNote] = useState("");

  const handleAdd = async () => {
    if (!url.trim() || !label.trim()) {
      toast.error("URL and label are required");
      return;
    }
    try {
      await addEntry.mutateAsync({
        url: url.trim(),
        contentLabel: label.trim(),
        note: note.trim(),
      });
      toast.success("Entry added");
      setUrl("");
      setLabel("");
      setNote("");
    } catch {
      toast.error("Failed to add entry");
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteEntry.mutateAsync(id);
      toast.success("Entry deleted");
    } catch {
      toast.error("Failed to delete entry");
    }
  };

  return (
    <div className="space-y-6" data-ocid="content.section">
      <h2 className="font-serif text-xl font-semibold">Content Bank</h2>

      {/* Add form */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
            Add New Entry
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label htmlFor="cb-label">Label</Label>
              <Input
                id="cb-label"
                value={label}
                onChange={(e) => setLabel(e.target.value)}
                placeholder="e.g. Week of Mar 10 — BTS"
                data-ocid="content.input"
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="cb-url">URL</Label>
              <Input
                id="cb-url"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://drive.google.com/..."
                data-ocid="content.input"
              />
            </div>
          </div>
          <div className="space-y-1">
            <Label htmlFor="cb-note">Note</Label>
            <Textarea
              id="cb-note"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="What's inside this folder?"
              rows={2}
              data-ocid="content.textarea"
            />
          </div>
          <Button
            onClick={handleAdd}
            disabled={addEntry.isPending}
            className="gap-2"
            data-ocid="content.submit_button"
          >
            {addEntry.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Plus className="h-4 w-4" />
            )}
            Add Entry
          </Button>
        </CardContent>
      </Card>

      {/* Entries list */}
      {isLoading ? (
        <div className="space-y-2" data-ocid="content.loading_state">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-20 w-full" />
          ))}
        </div>
      ) : entries.length === 0 ? (
        <div
          className="text-center py-12 text-muted-foreground"
          data-ocid="content.empty_state"
        >
          <BookOpen className="h-8 w-8 mx-auto mb-2 opacity-30" />
          <p className="font-medium text-sm">No entries yet</p>
        </div>
      ) : (
        <div className="space-y-3">
          {entries.map((entry, i) => (
            <Card
              key={entry.id}
              className="group"
              data-ocid={`content.item.${i + 1}`}
            >
              <CardContent className="pt-4 pb-4">
                <div className="flex items-start gap-3">
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm">
                      {entry.contentLabel}
                    </p>
                    {entry.note && (
                      <p className="text-sm text-muted-foreground mt-0.5">
                        {entry.note}
                      </p>
                    )}
                    <a
                      href={entry.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-xs text-primary hover:underline mt-1.5"
                      data-ocid={"content.link"}
                    >
                      <ExternalLink className="h-3 w-3" />
                      Open folder
                    </a>
                  </div>
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7"
                      onClick={() => {
                        navigator.clipboard.writeText(entry.url);
                        toast.success("URL copied");
                      }}
                    >
                      <Copy className="h-3.5 w-3.5" />
                    </Button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-destructive hover:text-destructive"
                          data-ocid={`content.delete_button.${i + 1}`}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Delete Entry</AlertDialogTitle>
                          <AlertDialogDescription>
                            Delete "{entry.contentLabel}"? This cannot be
                            undone.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel data-ocid="content.cancel_button">
                            Cancel
                          </AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => handleDelete(entry.id)}
                            data-ocid="content.confirm_button"
                          >
                            Delete
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Tab 6: Idea Vault ────────────────────────────────────────────────────────

const IDEA_COLUMNS = [
  {
    category: IdeaVaultCategory.drawing_idea,
    label: "Drawing Ideas",
    color: "border-l-emerald-400 bg-emerald-50/50 dark:bg-emerald-950/20",
    badgeClass: "bg-emerald-100 text-emerald-700",
  },
  {
    category: IdeaVaultCategory.merch_idea,
    label: "Merch Ideas",
    color: "border-l-amber-400 bg-amber-50/50 dark:bg-amber-950/20",
    badgeClass: "bg-amber-100 text-amber-700",
  },
  {
    category: IdeaVaultCategory.lore,
    label: "Lore",
    color: "border-l-violet-400 bg-violet-50/50 dark:bg-violet-950/20",
    badgeClass: "bg-violet-100 text-violet-700",
  },
  {
    category: IdeaVaultCategory.social_hook,
    label: "Social Hooks",
    color: "border-l-rose-400 bg-rose-50/50 dark:bg-rose-950/20",
    badgeClass: "bg-rose-100 text-rose-700",
  },
];

function IdeaVaultColumn({
  category,
  label,
  color,
  badgeClass,
  ideas,
  onAdd,
  onDelete,
  isAdding,
}: {
  category: IdeaVaultCategoryType;
  label: string;
  color: string;
  badgeClass: string;
  ideas: IdeaVaultEntry[];
  onAdd: (category: IdeaVaultCategoryType, content: string) => void;
  onDelete: (id: string) => void;
  isAdding: boolean;
}) {
  const [input, setInput] = useState("");

  const handleAdd = () => {
    if (!input.trim()) return;
    onAdd(category, input.trim());
    setInput("");
  };

  return (
    <div
      className={`rounded-lg border-l-4 border border-border ${color} p-4 flex flex-col gap-3`}
    >
      <div className="flex items-center justify-between">
        <span
          className={`text-xs font-semibold px-2 py-0.5 rounded-full ${badgeClass}`}
        >
          {label}
        </span>
        <span className="text-xs text-muted-foreground">{ideas.length}</span>
      </div>

      <ScrollArea className="max-h-[280px]">
        <div className="space-y-2 pr-2">
          {ideas.map((idea, i) => (
            <div
              key={idea.id}
              className="group flex items-start gap-2 rounded-md bg-background/70 p-2.5 text-sm"
              data-ocid={`vault.item.${i + 1}`}
            >
              <p className="flex-1 leading-snug">{idea.content}</p>
              <button
                type="button"
                onClick={() => onDelete(idea.id)}
                className="shrink-0 opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive transition-all"
                data-ocid={`vault.delete_button.${i + 1}`}
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
          ))}
          {ideas.length === 0 && (
            <p className="text-xs text-muted-foreground text-center py-4 opacity-60">
              No ideas yet
            </p>
          )}
        </div>
      </ScrollArea>

      <div className="flex gap-2">
        <Input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleAdd()}
          placeholder="Add idea..."
          className="text-xs h-8"
          data-ocid="vault.input"
        />
        <Button
          size="sm"
          variant="outline"
          onClick={handleAdd}
          disabled={isAdding || !input.trim()}
          className="h-8 px-2"
          data-ocid="vault.primary_button"
        >
          {isAdding ? (
            <Loader2 className="h-3 w-3 animate-spin" />
          ) : (
            <Plus className="h-3 w-3" />
          )}
        </Button>
      </div>
    </div>
  );
}

function IdeaVaultTab() {
  const { data: entries = [], isLoading } = useGetIdeaVault();
  const addEntry = useAddIdeaVaultEntry();
  const deleteEntry = useDeleteIdeaVaultEntry();

  const handleAdd = useCallback(
    async (category: IdeaVaultCategoryType, content: string) => {
      try {
        await addEntry.mutateAsync({ category, content });
      } catch {
        toast.error("Failed to add idea");
      }
    },
    [addEntry],
  );

  const handleDelete = useCallback(
    async (id: string) => {
      try {
        await deleteEntry.mutateAsync(id);
      } catch {
        toast.error("Failed to delete idea");
      }
    },
    [deleteEntry],
  );

  const byCategory = useMemo(() => {
    const map: Record<string, IdeaVaultEntry[]> = {
      drawing_idea: [],
      merch_idea: [],
      lore: [],
      social_hook: [],
    };
    for (const e of entries) {
      const key = e.category as unknown as string;
      if (key in map) map[key].push(e);
    }
    return map;
  }, [entries]);

  return (
    <div className="space-y-6" data-ocid="vault.section">
      <h2 className="font-serif text-xl font-semibold">Idea Vault</h2>
      {isLoading ? (
        <div
          className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4"
          data-ocid="vault.loading_state"
        >
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-64 w-full" />
          ))}
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {IDEA_COLUMNS.map((col) => (
            <IdeaVaultColumn
              key={String(col.category)}
              category={col.category}
              label={col.label}
              color={col.color}
              badgeClass={col.badgeClass}
              ideas={byCategory[String(col.category)] || []}
              onAdd={handleAdd}
              onDelete={handleDelete}
              isAdding={addEntry.isPending}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Tab 7: Monthly Calendar ──────────────────────────────────────────────────

interface CalDrawingDetailProps {
  drawing: Drawing;
  onClose: () => void;
}

function CalDrawingDetail({ drawing, onClose }: CalDrawingDetailProps) {
  return (
    <div className="space-y-3">
      <p className="font-serif font-semibold text-base">{drawing.title}</p>
      <p className="text-xs text-muted-foreground">
        {formatDate(nsToDate(drawing.scheduledDate))} · {drawing.weekLabel}
      </p>
      <div className="flex flex-wrap gap-1.5">
        {STATUS_FIELDS.map((f) => (
          <Badge
            key={f.key}
            variant="outline"
            className={`text-xs ${
              drawing[f.key as StatusField]
                ? "border-emerald-300 text-emerald-700 bg-emerald-50"
                : "border-muted text-muted-foreground"
            }`}
          >
            {f.label}
          </Badge>
        ))}
      </div>
      <Button size="sm" variant="outline" onClick={onClose} className="w-full">
        Close
      </Button>
    </div>
  );
}

function MonthlyCalendarTab({
  drawings,
  onDateDrop,
}: {
  drawings: Drawing[];
  onDateDrop: (drawingId: string, newDate: Date) => void;
}) {
  const today = new Date();
  const [year, setYear] = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth()); // 0-indexed
  const [selectedDrawing, setSelectedDrawing] = useState<Drawing | null>(null);
  const [dragOverDate, setDragOverDate] = useState<string | null>(null);

  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const startDow = firstDay.getDay(); // 0=Sun
  const daysInMonth = lastDay.getDate();

  const monthLabel = firstDay.toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
  });

  // Build calendar grid cells (including leading empty cells)
  const cells: (Date | null)[] = [];
  for (let i = 0; i < startDow; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(new Date(year, month, d));

  // Map drawings to date strings
  const drawingsByDate = useMemo(() => {
    const map: Record<string, Drawing[]> = {};
    for (const d of drawings) {
      const date = nsToDate(d.scheduledDate);
      const key = `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
      if (!map[key]) map[key] = [];
      map[key].push(d);
    }
    return map;
  }, [drawings]);

  const dateKey = (date: Date) =>
    `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;

  const prevMonth = () => {
    if (month === 0) {
      setMonth(11);
      setYear((y) => y - 1);
    } else {
      setMonth((m) => m - 1);
    }
  };

  const nextMonth = () => {
    if (month === 11) {
      setMonth(0);
      setYear((y) => y + 1);
    } else {
      setMonth((m) => m + 1);
    }
  };

  const handleDragStart = (e: React.DragEvent, drawingId: string) => {
    e.dataTransfer.setData("drawingId", drawingId);
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDragOver = (e: React.DragEvent, key: string) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    setDragOverDate(key);
  };

  const handleDrop = (e: React.DragEvent, date: Date) => {
    e.preventDefault();
    const drawingId = e.dataTransfer.getData("drawingId");
    if (drawingId) {
      onDateDrop(drawingId, date);
    }
    setDragOverDate(null);
  };

  const handleDragLeave = () => setDragOverDate(null);

  const DOW_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  return (
    <div className="space-y-4" data-ocid="calendar.section">
      {/* Month navigation */}
      <div className="flex items-center justify-between">
        <Button
          variant="ghost"
          size="sm"
          onClick={prevMonth}
          className="gap-1"
          data-ocid="calendar.pagination_prev"
        >
          <ChevronLeft className="h-4 w-4" />
          Prev
        </Button>
        <h2 className="font-serif text-lg font-semibold">{monthLabel}</h2>
        <Button
          variant="ghost"
          size="sm"
          onClick={nextMonth}
          className="gap-1"
          data-ocid="calendar.pagination_next"
        >
          Next
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>

      {/* Day-of-week header */}
      <div className="grid grid-cols-7 gap-1">
        {DOW_LABELS.map((d) => (
          <div
            key={d}
            className="text-xs font-semibold text-muted-foreground text-center py-1"
          >
            {d}
          </div>
        ))}
      </div>

      {/* Calendar grid */}
      <div className="grid grid-cols-7 gap-1">
        {cells.map((date, i) => {
          if (!date) {
            return (
              <div
                key={`empty-cell-col${i % 7}-row${Math.floor(i / 7)}`}
                className="min-h-[80px]"
              />
            );
          }
          const key = dateKey(date);
          const dayDrawings = drawingsByDate[key] || [];
          const isToday = sameDay(date, today);
          const isDragOver = dragOverDate === key;

          return (
            <div
              key={key}
              className={`min-h-[80px] rounded-lg border p-1.5 transition-colors select-none ${
                isToday
                  ? "border-primary bg-primary/5"
                  : isDragOver
                    ? "border-primary/50 bg-primary/10"
                    : "border-border bg-card"
              }`}
              onDragOver={(e) => handleDragOver(e, key)}
              onDrop={(e) => handleDrop(e, date)}
              onDragLeave={handleDragLeave}
              data-ocid="calendar.canvas_target"
            >
              <p
                className={`text-xs font-semibold mb-1 ${isToday ? "text-primary" : "text-muted-foreground"}`}
              >
                {date.getDate()}
              </p>
              <div className="space-y-0.5">
                {dayDrawings.map((d) => (
                  <button
                    key={d.id}
                    type="button"
                    draggable
                    onDragStart={(e) => handleDragStart(e, d.id)}
                    onClick={() => setSelectedDrawing(d)}
                    className="w-full text-left rounded px-1.5 py-0.5 text-xs bg-primary/10 text-primary cursor-pointer hover:bg-primary/20 transition-colors truncate"
                    title={d.title}
                    data-ocid="calendar.drag_handle"
                  >
                    {d.title}
                  </button>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {/* Drawing detail dialog */}
      {selectedDrawing && (
        <Dialog
          open={!!selectedDrawing}
          onOpenChange={(open) => !open && setSelectedDrawing(null)}
        >
          <DialogContent data-ocid="calendar.dialog">
            <DialogHeader>
              <DialogTitle className="font-serif">Drawing Details</DialogTitle>
            </DialogHeader>
            <CalDrawingDetail
              drawing={selectedDrawing}
              onClose={() => setSelectedDrawing(null)}
            />
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function AdminCreatorDashboardPage() {
  const { data: drawings = [], isLoading: drawingsLoading } = useGetDrawings();
  const { data: pipelines = [], isLoading: pipelinesLoading } =
    useGetMerchPipelines();
  const updateStatus = useUpdateDrawingStatus();
  const updateDate = useUpdateDrawingDate();

  const _handleStatusChange = useCallback(
    async (id: string, field: string, value: boolean) => {
      try {
        await updateStatus.mutateAsync({ id, field, value });
      } catch {
        toast.error("Failed to update status");
      }
    },
    [updateStatus],
  );

  const handleDateDrop = useCallback(
    async (drawingId: string, newDate: Date) => {
      try {
        await updateDate.mutateAsync({
          id: drawingId,
          newDate: dateToNs(newDate),
        });
        toast.success("Drawing rescheduled");
      } catch {
        toast.error("Failed to reschedule drawing");
      }
    },
    [updateDate],
  );

  return (
    <AdminGuard>
      <div className="container py-8 max-w-[1400px]">
        <div className="space-y-6">
          {/* Header */}
          <div className="flex items-start gap-4">
            <div className="p-3 rounded-xl bg-primary/10">
              <Sparkles className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h1 className="font-serif text-3xl font-bold">
                Creator Dashboard
              </h1>
              <p className="text-muted-foreground mt-0.5">
                Your personal workflow hub — track drawings, merch, content, and
                ideas
              </p>
            </div>
          </div>

          {/* Tabs */}
          <Tabs defaultValue="today" className="space-y-6">
            <div className="overflow-x-auto">
              <TabsList className="inline-flex min-w-max gap-1 h-auto p-1">
                <TabsTrigger
                  value="today"
                  className="gap-2 text-xs sm:text-sm"
                  data-ocid="creator.tab"
                >
                  <Bell className="h-3.5 w-3.5" />
                  Today
                </TabsTrigger>
                <TabsTrigger
                  value="workflow"
                  className="gap-2 text-xs sm:text-sm"
                  data-ocid="creator.tab"
                >
                  <LayoutGrid className="h-3.5 w-3.5" />
                  Weekly
                </TabsTrigger>
                <TabsTrigger
                  value="batch"
                  className="gap-2 text-xs sm:text-sm"
                  data-ocid="creator.tab"
                >
                  <Layers className="h-3.5 w-3.5" />
                  Batch
                </TabsTrigger>
                <TabsTrigger
                  value="merch"
                  className="gap-2 text-xs sm:text-sm"
                  data-ocid="creator.tab"
                >
                  <Package className="h-3.5 w-3.5" />
                  Merch
                </TabsTrigger>
                <TabsTrigger
                  value="content"
                  className="gap-2 text-xs sm:text-sm"
                  data-ocid="creator.tab"
                >
                  <BookOpen className="h-3.5 w-3.5" />
                  Content Bank
                </TabsTrigger>
                <TabsTrigger
                  value="vault"
                  className="gap-2 text-xs sm:text-sm"
                  data-ocid="creator.tab"
                >
                  <Lightbulb className="h-3.5 w-3.5" />
                  Idea Vault
                </TabsTrigger>
                <TabsTrigger
                  value="calendar"
                  className="gap-2 text-xs sm:text-sm"
                  data-ocid="creator.tab"
                >
                  <Calendar className="h-3.5 w-3.5" />
                  Calendar
                </TabsTrigger>
              </TabsList>
            </div>

            <TabsContent value="today" className="mt-0">
              {drawingsLoading ? (
                <div className="space-y-3" data-ocid="today.loading_state">
                  <Skeleton className="h-24 w-full" />
                  <Skeleton className="h-24 w-full" />
                </div>
              ) : (
                <TodayTab drawings={drawings} />
              )}
            </TabsContent>

            <TabsContent value="workflow" className="mt-0">
              {drawingsLoading ? (
                <div className="space-y-3" data-ocid="workflow.loading_state">
                  <Skeleton className="h-48 w-full" />
                </div>
              ) : (
                <WeeklyWorkflowTab drawings={drawings} />
              )}
            </TabsContent>

            <TabsContent value="batch" className="mt-0">
              <BatchTrackerTab
                drawings={drawings}
                isLoading={drawingsLoading}
              />
            </TabsContent>

            <TabsContent value="merch" className="mt-0">
              <MerchPipelineTab
                drawings={drawings}
                pipelines={pipelines}
                isLoading={drawingsLoading || pipelinesLoading}
              />
            </TabsContent>

            <TabsContent value="content" className="mt-0">
              <ContentBankTab />
            </TabsContent>

            <TabsContent value="vault" className="mt-0">
              <IdeaVaultTab />
            </TabsContent>

            <TabsContent value="calendar" className="mt-0">
              {drawingsLoading ? (
                <div className="space-y-3" data-ocid="calendar.loading_state">
                  <Skeleton className="h-96 w-full" />
                </div>
              ) : (
                <MonthlyCalendarTab
                  drawings={drawings}
                  onDateDrop={handleDateDrop}
                />
              )}
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </AdminGuard>
  );
}
