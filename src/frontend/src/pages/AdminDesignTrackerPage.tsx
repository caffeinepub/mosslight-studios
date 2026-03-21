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
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { useNavigate } from "@tanstack/react-router";
import {
  ArrowLeft,
  Clipboard,
  Paintbrush,
  Pencil,
  Plus,
  Trash2,
} from "lucide-react";
import { useState } from "react";
import AdminGuard from "../components/AdminGuard";
import {
  type DesignEntry,
  type UpdateDesignData,
  nextStatus,
  statusLabel,
  statusOrder,
  useAddDesignEntry,
  useDeleteDesignEntry,
  useGetDesignEntries,
  useUpdateDesignEntry,
} from "../hooks/useDesignTracker";

function StatusBadge({
  entry,
  onAdvance,
}: { entry: DesignEntry; onAdvance: () => void }) {
  const label = statusLabel(entry.status);
  const isDone = "done" in entry.status;

  const colorClass =
    "notStarted" in entry.status
      ? "bg-gray-100 text-gray-700 border-gray-200 hover:bg-gray-200"
      : "inProgress" in entry.status
        ? "bg-amber-100 text-amber-700 border-amber-200 hover:bg-amber-200"
        : "bg-emerald-100 text-emerald-700 border-emerald-200 cursor-default";

  return (
    <button
      type="button"
      onClick={isDone ? undefined : onAdvance}
      title={
        isDone
          ? "Completed"
          : `Advance to ${statusLabel(nextStatus(entry.status))}`
      }
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border transition-colors ${colorClass}`}
      data-ocid="design.status.toggle"
    >
      {label}
    </button>
  );
}

function EditRow({
  entry,
  onSave,
  onCancel,
}: {
  entry: DesignEntry;
  onSave: (data: UpdateDesignData) => void;
  onCancel: () => void;
}) {
  const [title, setTitle] = useState(entry.title);
  const [tagsStr, setTagsStr] = useState(entry.tags.join(", "));

  const handleSave = () => {
    const tags = tagsStr
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean);
    onSave({ title, tags, status: entry.status });
  };

  return (
    <TableRow className="bg-muted/40">
      <TableCell>
        <Input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="h-8 text-sm"
          data-ocid="design.edit.input"
        />
      </TableCell>
      <TableCell>
        <span className="text-xs text-muted-foreground">
          {statusLabel(entry.status)}
        </span>
      </TableCell>
      <TableCell>
        <Input
          value={tagsStr}
          onChange={(e) => setTagsStr(e.target.value)}
          placeholder="tag1, tag2"
          className="h-8 text-sm"
          data-ocid="design.edit.tags_input"
        />
      </TableCell>
      <TableCell>
        <div className="flex gap-2">
          <Button
            size="sm"
            onClick={handleSave}
            data-ocid="design.edit.save_button"
          >
            Save
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={onCancel}
            data-ocid="design.edit.cancel_button"
          >
            Cancel
          </Button>
        </div>
      </TableCell>
    </TableRow>
  );
}

export default function AdminDesignTrackerPage() {
  const { data: entries = [], isLoading } = useGetDesignEntries();
  const addDesign = useAddDesignEntry();
  const updateDesign = useUpdateDesignEntry();
  const deleteDesign = useDeleteDesignEntry();
  const navigate = useNavigate();

  const [newTitle, setNewTitle] = useState("");
  const [newTags, setNewTags] = useState("");
  const [activeTag, setActiveTag] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isImporting, setIsImporting] = useState(false);
  const [importResult, setImportResult] = useState<string | null>(null);
  const [showPasteBox, setShowPasteBox] = useState(false);
  const [pasteText, setPasteText] = useState("");

  const allTags = Array.from(new Set(entries.flatMap((e) => e.tags))).sort();

  const filtered = activeTag
    ? entries.filter((e) => e.tags.includes(activeTag))
    : entries;

  const sorted = [...filtered].sort((a, b) => {
    const aDone = "done" in a.status;
    const bDone = "done" in b.status;
    if (aDone !== bDone) return aDone ? 1 : -1;
    const aOrder = statusOrder(a.status);
    const bOrder = statusOrder(b.status);
    if (aOrder !== bOrder) return aOrder - bOrder;
    return a.title.localeCompare(b.title);
  });

  const handleAdd = () => {
    const title = newTitle.trim();
    if (!title) return;
    const tags = newTags
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean);
    addDesign.mutate({ title, tags });
    setNewTitle("");
    setNewTags("");
  };

  const handleAdvanceStatus = (entry: DesignEntry) => {
    const next = nextStatus(entry.status);
    updateDesign.mutate({
      id: entry.id,
      data: { title: entry.title, tags: entry.tags, status: next },
    });
  };

  const handleSaveEdit = (entry: DesignEntry, data: UpdateDesignData) => {
    updateDesign.mutate({ id: entry.id, data });
    setEditingId(null);
  };

  const handlePasteImport = async () => {
    const lines = pasteText
      .split("\n")
      .map((l) => l.trim())
      .filter(Boolean);

    const existingTitlesLower = new Set(
      entries.map((entry) => entry.title.toLowerCase()),
    );

    const newTitles: string[] = [];
    let skipped = 0;

    for (const line of lines) {
      if (existingTitlesLower.has(line.toLowerCase())) {
        skipped++;
      } else {
        newTitles.push(line);
        existingTitlesLower.add(line.toLowerCase());
      }
    }

    if (newTitles.length === 0) {
      const msg =
        skipped > 0
          ? `0 added, ${skipped} skipped as duplicate${skipped !== 1 ? "s" : ""}`
          : "No valid titles found";
      setImportResult(msg);
      setTimeout(() => setImportResult(null), 5000);
      setPasteText("");
      setShowPasteBox(false);
      return;
    }

    setIsImporting(true);

    try {
      for (const title of newTitles) {
        await addDesign.mutateAsync({ title, tags: [] });
      }

      const parts: string[] = [];
      if (newTitles.length > 0) parts.push(`${newTitles.length} added`);
      if (skipped > 0)
        parts.push(
          `${skipped} skipped as duplicate${skipped !== 1 ? "s" : ""}`,
        );
      setImportResult(parts.join(", "));
      setTimeout(() => setImportResult(null), 5000);
      setPasteText("");
      setShowPasteBox(false);
    } catch (_err) {
      setImportResult("Import failed — please try again.");
      setTimeout(() => setImportResult(null), 5000);
    } finally {
      setIsImporting(false);
    }
  };

  const importIsError = importResult?.startsWith("Import failed") ?? false;

  return (
    <AdminGuard>
      <div className="container py-10 max-w-5xl">
        {/* Header */}
        <div className="mb-8">
          <button
            type="button"
            onClick={() => navigate({ to: "/admin-dashboard" })}
            className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-4 transition-colors"
            data-ocid="design.back.link"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Dashboard
          </button>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-rose-50 dark:bg-rose-950 flex items-center justify-center">
              <Paintbrush className="h-5 w-5 text-rose-600" />
            </div>
            <div>
              <h1 className="font-serif text-3xl font-bold">Design Tracker</h1>
              <p className="text-sm text-muted-foreground">
                {entries.length} design{entries.length !== 1 ? "s" : ""} tracked
              </p>
            </div>
          </div>
        </div>

        {/* Add Design Form */}
        <div className="flex gap-3 mb-2 flex-wrap">
          <Input
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            placeholder="Design name"
            className="flex-1 min-w-[160px]"
            onKeyDown={(e) => e.key === "Enter" && handleAdd()}
            data-ocid="design.input"
          />
          <Input
            value={newTags}
            onChange={(e) => setNewTags(e.target.value)}
            placeholder="e.g. sticker, nature, seasonal"
            className="flex-1 min-w-[200px]"
            onKeyDown={(e) => e.key === "Enter" && handleAdd()}
            data-ocid="design.tags.input"
          />
          <Button
            onClick={handleAdd}
            disabled={!newTitle.trim() || addDesign.isPending}
            className="gap-1.5"
            data-ocid="design.add_button"
          >
            <Plus className="h-4 w-4" />
            Add Design
          </Button>
          <Button
            variant="outline"
            onClick={() => setShowPasteBox((prev) => !prev)}
            className="gap-1.5"
            data-ocid="design.upload_button"
          >
            <Clipboard className="h-4 w-4" />
            Paste Names
          </Button>
        </div>

        {/* Paste Box Panel */}
        {showPasteBox && (
          <div className="mb-4 p-4 rounded-xl border border-border bg-muted/30">
            <p className="text-sm font-medium mb-2 text-muted-foreground">
              Paste design names below — one name per line. Duplicates will be
              skipped.
            </p>
            <Textarea
              value={pasteText}
              onChange={(e) => setPasteText(e.target.value)}
              placeholder="Paste design names here, one per line…"
              rows={6}
              className="w-full mb-3 font-mono text-sm"
              data-ocid="design.textarea"
            />
            <div className="flex gap-2">
              <Button
                onClick={handlePasteImport}
                disabled={!pasteText.trim() || isImporting}
                className="gap-1.5"
                data-ocid="design.submit_button"
              >
                {isImporting ? "Importing…" : "Import Names"}
              </Button>
              <Button
                variant="ghost"
                onClick={() => {
                  setShowPasteBox(false);
                  setPasteText("");
                }}
                data-ocid="design.cancel_button"
              >
                Cancel
              </Button>
            </div>
          </div>
        )}

        {/* Import result message */}
        {importResult && (
          <p
            className={`text-sm mb-4 font-medium ${
              importIsError
                ? "text-destructive"
                : "text-emerald-700 dark:text-emerald-400"
            }`}
            data-ocid={
              importIsError ? "design.error_state" : "design.success_state"
            }
          >
            {importIsError ? "✕" : "✓"} {importResult}
          </p>
        )}

        {/* Spacer when no result message */}
        {!importResult && <div className="mb-6" />}

        {/* Tag Filter Chips */}
        {allTags.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-6">
            <button
              type="button"
              onClick={() => setActiveTag(null)}
              className={`px-3 py-1 rounded-full text-xs font-medium border transition-colors ${
                activeTag === null
                  ? "bg-emerald-600 text-white border-emerald-600"
                  : "bg-muted text-muted-foreground border-border hover:border-emerald-400 hover:text-emerald-700"
              }`}
              data-ocid="design.filter.tab"
            >
              All
            </button>
            {allTags.map((tag) => (
              <button
                key={tag}
                type="button"
                onClick={() => setActiveTag(activeTag === tag ? null : tag)}
                className={`px-3 py-1 rounded-full text-xs font-medium border transition-colors ${
                  activeTag === tag
                    ? "bg-emerald-600 text-white border-emerald-600"
                    : "bg-muted text-muted-foreground border-border hover:border-emerald-400 hover:text-emerald-700"
                }`}
                data-ocid="design.filter.tab"
              >
                {tag}
              </button>
            ))}
          </div>
        )}

        {/* Table */}
        {isLoading ? (
          <div
            className="text-center py-16 text-muted-foreground"
            data-ocid="design.loading_state"
          >
            Loading designs…
          </div>
        ) : sorted.length === 0 ? (
          <div
            className="text-center py-16 rounded-xl border-2 border-dashed border-border"
            data-ocid="design.empty_state"
          >
            <Paintbrush className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
            <p className="font-medium text-muted-foreground mb-4">
              {activeTag
                ? `No designs tagged "${activeTag}"`
                : "No designs yet"}
            </p>
            {!activeTag && (
              <Button
                variant="outline"
                onClick={() =>
                  document
                    .querySelector<HTMLInputElement>(
                      "[data-ocid='design.input']",
                    )
                    ?.focus()
                }
                data-ocid="design.empty_state.primary_button"
              >
                <Plus className="h-4 w-4 mr-1.5" />
                Add your first design
              </Button>
            )}
          </div>
        ) : (
          <div className="rounded-xl border border-border overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead className="font-semibold">Design Name</TableHead>
                  <TableHead className="font-semibold">Status</TableHead>
                  <TableHead className="font-semibold">Tags</TableHead>
                  <TableHead className="font-semibold text-right">
                    Actions
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sorted.map((entry, idx) => {
                  const isDone = "done" in entry.status;
                  if (editingId === entry.id) {
                    return (
                      <EditRow
                        key={entry.id}
                        entry={entry}
                        onSave={(data) => handleSaveEdit(entry, data)}
                        onCancel={() => setEditingId(null)}
                      />
                    );
                  }
                  return (
                    <TableRow
                      key={entry.id}
                      className={isDone ? "opacity-50" : ""}
                      data-ocid={`design.item.${idx + 1}`}
                    >
                      <TableCell className="font-medium">
                        {entry.title}
                      </TableCell>
                      <TableCell>
                        <StatusBadge
                          entry={entry}
                          onAdvance={() => handleAdvanceStatus(entry)}
                        />
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {entry.tags.length > 0 ? (
                            entry.tags.map((tag) => (
                              <Badge
                                key={tag}
                                variant="secondary"
                                className="text-xs"
                              >
                                {tag}
                              </Badge>
                            ))
                          ) : (
                            <span className="text-muted-foreground text-xs">
                              —
                            </span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-8 w-8"
                            onClick={() => setEditingId(entry.id)}
                            data-ocid={`design.edit_button.${idx + 1}`}
                          >
                            <Pencil className="h-3.5 w-3.5" />
                          </Button>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button
                                size="icon"
                                variant="ghost"
                                className="h-8 w-8 text-destructive hover:text-destructive"
                                data-ocid={`design.delete_button.${idx + 1}`}
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent data-ocid="design.dialog">
                              <AlertDialogHeader>
                                <AlertDialogTitle>
                                  Delete Design
                                </AlertDialogTitle>
                                <AlertDialogDescription>
                                  Are you sure you want to delete &ldquo;
                                  {entry.title}&rdquo;? This cannot be undone.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel data-ocid="design.cancel_button">
                                  Cancel
                                </AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => deleteDesign.mutate(entry.id)}
                                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                  data-ocid="design.confirm_button"
                                >
                                  Delete
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        )}
      </div>
    </AdminGuard>
  );
}
