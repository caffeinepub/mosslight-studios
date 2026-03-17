import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { Clock, Download, Plus, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import AdminGuard from "../components/AdminGuard";

const STORAGE_KEY = "mosslight_timesheet_entries";

interface TimesheetEntry {
  id: string;
  date: string;
  timeStarted: string;
  timeDone: string;
  activity: string;
  notes: string;
}

function calcDuration(start: string, end: string): string {
  if (!start || !end) return "—";
  const [sh, sm] = start.split(":").map(Number);
  const [eh, em] = end.split(":").map(Number);
  let mins = eh * 60 + em - (sh * 60 + sm);
  if (mins < 0) mins += 24 * 60;
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  if (h === 0) return `${m}m`;
  if (m === 0) return `${h}h`;
  return `${h}h ${m}m`;
}

function loadEntries(): TimesheetEntry[] {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
  } catch {
    return [];
  }
}

function saveEntries(entries: TimesheetEntry[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
}

function todayDate() {
  return new Date().toISOString().slice(0, 10);
}

export default function AdminTimesheetPage() {
  const [entries, setEntries] = useState<TimesheetEntry[]>(loadEntries);
  const [date, setDate] = useState(todayDate());
  const [timeStarted, setTimeStarted] = useState("");
  const [timeDone, setTimeDone] = useState("");
  const [activity, setActivity] = useState("");
  const [notes, setNotes] = useState("");
  const [confirmClear, setConfirmClear] = useState(false);

  useEffect(() => {
    saveEntries(entries);
  }, [entries]);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!date || !timeStarted || !timeDone || !activity.trim()) return;
    const entry: TimesheetEntry = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
      date,
      timeStarted,
      timeDone,
      activity: activity.trim(),
      notes: notes.trim(),
    };
    setEntries((prev) => [entry, ...prev]);
    setTimeStarted("");
    setTimeDone("");
    setActivity("");
    setNotes("");
    setDate(todayDate());
  }

  function handleClearAll() {
    if (!confirmClear) {
      setConfirmClear(true);
      return;
    }
    setEntries([]);
    setConfirmClear(false);
  }

  function exportCSV() {
    const headers = [
      "Date",
      "Time Started",
      "Time Done",
      "Duration",
      "Activity",
      "Notes",
    ];
    const rows = entries.map((e) => [
      e.date,
      e.timeStarted,
      e.timeDone,
      calcDuration(e.timeStarted, e.timeDone),
      `"${e.activity.replace(/"/g, '""')}"`,
      `"${e.notes.replace(/"/g, '""')}"`,
    ]);
    const csv = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `timesheet-${todayDate()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  const totalMins = entries.reduce((acc, e) => {
    if (!e.timeStarted || !e.timeDone) return acc;
    const [sh, sm] = e.timeStarted.split(":").map(Number);
    const [eh, em] = e.timeDone.split(":").map(Number);
    let m = eh * 60 + em - (sh * 60 + sm);
    if (m < 0) m += 24 * 60;
    return acc + m;
  }, 0);
  const totalH = Math.floor(totalMins / 60);
  const totalM = totalMins % 60;
  const totalLabel =
    totalMins === 0
      ? "0h"
      : totalH > 0
        ? `${totalH}h ${totalM}m`
        : `${totalM}m`;

  return (
    <AdminGuard>
      <div className="container py-10 max-w-5xl space-y-8">
        {/* Header */}
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-teal-50 dark:bg-teal-950 flex items-center justify-center">
            <Clock className="h-6 w-6 text-teal-600" />
          </div>
          <div>
            <h1 className="font-serif text-3xl font-bold">Time Tracker</h1>
            <p className="text-muted-foreground text-sm">
              Log your working hours and activities
            </p>
          </div>
        </div>

        {/* Input Form */}
        <Card>
          <CardHeader>
            <CardTitle className="font-serif text-lg flex items-center gap-2">
              <Plus className="h-4 w-4" /> Log Time
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid sm:grid-cols-3 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="ts-date">Date</Label>
                  <Input
                    id="ts-date"
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    required
                    data-ocid="timesheet.input"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="ts-start">Time Started</Label>
                  <Input
                    id="ts-start"
                    type="time"
                    value={timeStarted}
                    onChange={(e) => setTimeStarted(e.target.value)}
                    required
                    data-ocid="timesheet.input"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="ts-end">Time Done</Label>
                  <Input
                    id="ts-end"
                    type="time"
                    value={timeDone}
                    onChange={(e) => setTimeDone(e.target.value)}
                    required
                    data-ocid="timesheet.input"
                  />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="ts-activity">What I Was Doing</Label>
                <Input
                  id="ts-activity"
                  placeholder="e.g. Drawing batch — Moonlit Forest sticker"
                  value={activity}
                  onChange={(e) => setActivity(e.target.value)}
                  required
                  data-ocid="timesheet.input"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="ts-notes">
                  Notes{" "}
                  <span className="text-muted-foreground">(optional)</span>
                </Label>
                <Textarea
                  id="ts-notes"
                  placeholder="Any additional notes…"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={2}
                  data-ocid="timesheet.textarea"
                />
              </div>
              <Button
                type="submit"
                className="bg-teal-600 hover:bg-teal-700 text-white"
                data-ocid="timesheet.submit_button"
              >
                <Plus className="h-4 w-4 mr-1" /> Log Time
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Data Sheet */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between flex-wrap gap-3">
              <div>
                <CardTitle className="font-serif text-lg">
                  Timesheet Log
                </CardTitle>
                {entries.length > 0 && (
                  <p className="text-sm text-muted-foreground mt-0.5">
                    {entries.length}{" "}
                    {entries.length === 1 ? "entry" : "entries"} · Total:{" "}
                    <span className="font-semibold text-teal-600">
                      {totalLabel}
                    </span>
                  </p>
                )}
              </div>
              {entries.length > 0 && (
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={exportCSV}
                    data-ocid="timesheet.secondary_button"
                  >
                    <Download className="h-4 w-4 mr-1" /> Export CSV
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleClearAll}
                    onBlur={() => setConfirmClear(false)}
                    className={
                      confirmClear
                        ? "border-red-400 text-red-600 hover:bg-red-50"
                        : ""
                    }
                    data-ocid="timesheet.delete_button"
                  >
                    <Trash2 className="h-4 w-4 mr-1" />
                    {confirmClear ? "Confirm Clear All" : "Clear All"}
                  </Button>
                </div>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {entries.length === 0 ? (
              <div
                className="text-center py-12 text-muted-foreground"
                data-ocid="timesheet.empty_state"
              >
                <Clock className="h-10 w-10 mx-auto mb-3 opacity-30" />
                <p className="font-medium">No entries yet</p>
                <p className="text-sm">
                  Fill out the form above to log your first session.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table data-ocid="timesheet.table">
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Started</TableHead>
                      <TableHead>Done</TableHead>
                      <TableHead>Duration</TableHead>
                      <TableHead>Activity</TableHead>
                      <TableHead>Notes</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {entries.map((entry, idx) => (
                      <TableRow
                        key={entry.id}
                        data-ocid={`timesheet.row.${idx + 1}`}
                      >
                        <TableCell className="font-medium whitespace-nowrap">
                          {entry.date}
                        </TableCell>
                        <TableCell className="whitespace-nowrap">
                          {entry.timeStarted}
                        </TableCell>
                        <TableCell className="whitespace-nowrap">
                          {entry.timeDone}
                        </TableCell>
                        <TableCell className="whitespace-nowrap font-semibold text-teal-600">
                          {calcDuration(entry.timeStarted, entry.timeDone)}
                        </TableCell>
                        <TableCell>{entry.activity}</TableCell>
                        <TableCell className="text-muted-foreground text-sm max-w-xs">
                          {entry.notes || "—"}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AdminGuard>
  );
}
