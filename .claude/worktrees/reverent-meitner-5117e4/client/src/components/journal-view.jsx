import React, { useState, useEffect, useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Lock, FileText, Clock, Pencil, Plus, Save, X } from "lucide-react";
import { format, parseISO, isAfter } from "date-fns";
import InlineTimer from "@/components/inline-timer";
import { apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/hooks/use-auth";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";

export function JournalView() {
  const { user } = useAuth();
  const [timeData, setTimeData] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  const isAnonymous = !user || user.isAnonymous;

  // Editing state
  const [editDate, setEditDate] = useState(null);
  const [editTime, setEditTime] = useState(0);
  const [editDeepWork, setEditDeepWork] = useState(null);
  const [editNotes, setEditNotes] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (isAnonymous) { setIsLoading(false); return; }
    const fetchData = async () => {
      try {
        const response = await apiRequest("/api/time-entries");
        const data = await response.json();
        setTimeData(data);
      } catch (e) {
        console.error("Failed to fetch time entries for journal:", e);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
    const handler = () => fetchData();
    window.addEventListener("time-entries-updated", handler);
    return () => window.removeEventListener("time-entries-updated", handler);
  }, [isAnonymous]);

  // Convert to sorted array grouped by month
  const groupedEntries = useMemo(() => {
    const entries = Object.entries(timeData)
      .map(([dateStr, entry]) => {
        const raw = typeof entry === "number" ? { timeInMinutes: entry } : entry;
        return {
          date: dateStr,
          timeInMinutes: raw.timeInMinutes || 0,
          deepWorkPercent: raw.deepWorkPercent === 50 ? null : (raw.deepWorkPercent ?? null),
          notes: raw.notes || "",
        };
      })
      .filter((e) => e.timeInMinutes > 0)
      .sort((a, b) => b.date.localeCompare(a.date));

    const groups = {};
    entries.forEach((entry) => {
      const monthKey = format(parseISO(entry.date), "MMMM yyyy");
      if (!groups[monthKey]) groups[monthKey] = [];
      groups[monthKey].push(entry);
    });
    return Object.entries(groups);
  }, [timeData]);

  const formatTime = (mins) => {
    if (!mins) return "0m";
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    return h > 0 ? (m > 0 ? `${h}h ${m}m` : `${h}h`) : `${m}m`;
  };

  const openEditor = (entry) => {
    setEditDate(entry.date);
    setEditTime(entry.timeInMinutes);
    setEditDeepWork(entry.deepWorkPercent);
    setEditNotes(entry.notes);
  };

  const openNewEntry = () => {
    const today = format(new Date(), "yyyy-MM-dd");
    const existing = timeData[today];
    const raw = existing ? (typeof existing === "number" ? { timeInMinutes: existing } : existing) : null;
    setEditDate(today);
    setEditTime(raw?.timeInMinutes || 0);
    setEditDeepWork(raw?.deepWorkPercent === 50 ? null : (raw?.deepWorkPercent ?? null));
    setEditNotes(raw?.notes || "");
  };

  const handleSave = async () => {
    if (!editDate) return;
    setIsSaving(true);
    const effectiveDeepWork = (editDeepWork != null && editDeepWork !== 50) ? editDeepWork : null;
    const payload = { date: editDate, timeInMinutes: editTime, notes: editNotes };
    if (effectiveDeepWork != null) payload.deepWorkPercent = effectiveDeepWork;

    try {
      await apiRequest("/api/time-entries", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      // Refresh
      const response = await apiRequest("/api/time-entries");
      const data = await response.json();
      setTimeData(data);
      window.dispatchEvent(new Event("time-entries-updated"));
    } catch (e) {
      console.error("Failed to save entry:", e);
    }
    setIsSaving(false);
    setEditDate(null);
  };

  if (isAnonymous) {
    return (
      <Card className="border-yellow-500/30 bg-yellow-500/5">
        <CardContent className="p-6 text-center">
          <Lock className="h-8 w-8 mx-auto mb-3 text-yellow-500" />
          <h3 className="font-semibold text-yellow-400 mb-1">Authentication Required</h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Sign in to view your journal entries.
          </p>
        </CardContent>
      </Card>
    );
  }

  if (isLoading) {
    return <div className="text-center py-12 text-gray-500">Loading journal...</div>;
  }

  return (
    <div className="space-y-4">
      {/* Top bar: stopwatch + add entry */}
      <div className="flex items-center justify-between">
        <InlineTimer />
        <Button size="sm" onClick={openNewEntry} className="gap-1.5 h-8 text-xs">
          <Plus className="h-3.5 w-3.5" /> Add Entry
        </Button>
      </div>

      {groupedEntries.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center">
            <FileText className="h-10 w-10 mx-auto mb-3 text-gray-400" />
            <h3 className="font-semibold text-gray-600 dark:text-gray-300 mb-1">No entries yet</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Start tracking time on the calendar to see your journal entries here.
            </p>
          </CardContent>
        </Card>
      ) : (
        groupedEntries.map(([month, entries]) => (
          <div key={month}>
            <h3 className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3 px-1">
              {month}
            </h3>
            <div className="space-y-2">
              {entries.map((entry) => (
                <Card
                  key={entry.date}
                  className="hover:shadow-md transition-shadow cursor-pointer group"
                  onClick={() => openEditor(entry)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start gap-4">
                      <div className="shrink-0 text-center min-w-[52px]">
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          {format(parseISO(entry.date), "EEE")}
                        </p>
                        <p className="text-lg font-bold text-gray-900 dark:text-gray-100">
                          {format(parseISO(entry.date), "d")}
                        </p>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-3 mb-1.5">
                          <div className="flex items-center gap-1.5">
                            <Clock className="h-3.5 w-3.5 text-gray-400" />
                            <span className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                              {formatTime(entry.timeInMinutes)}
                            </span>
                          </div>
                          {entry.deepWorkPercent != null && (
                            <div className="flex items-center gap-2 flex-1 max-w-[200px]">
                              <div className="flex h-1.5 rounded-full overflow-hidden flex-1">
                                <div className="h-full bg-green-500" style={{ width: `${entry.deepWorkPercent}%` }} />
                                <div className="h-full bg-yellow-400 flex-1" />
                              </div>
                              <span className="text-xs text-gray-500 dark:text-gray-400 whitespace-nowrap">
                                {entry.deepWorkPercent}% deep
                              </span>
                            </div>
                          )}
                        </div>
                        {entry.notes ? (
                          <div className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap leading-relaxed">
                            {entry.notes}
                          </div>
                        ) : (
                          <p className="text-xs text-gray-400 italic">No notes</p>
                        )}
                      </div>
                      <Pencil className="h-3.5 w-3.5 text-gray-300 dark:text-gray-600 opacity-0 group-hover:opacity-100 transition-opacity shrink-0 mt-1" />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        ))
      )}

      {/* ── Edit Entry Dialog ── */}
      <Dialog open={editDate !== null} onOpenChange={(v) => !v && setEditDate(null)}>
        <DialogContent className="w-[95vw] max-w-md mx-auto bg-white dark:bg-black border border-gray-200 dark:border-gray-800">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              {editDate ? format(parseISO(editDate), "MMMM d, yyyy") : ""}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 p-4 text-sm">
            {/* Time slider */}
            <div className="text-center">
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-2">
                Time worked:{" "}
                <span className="text-lg font-bold text-violet-600 dark:text-violet-400">
                  {formatTime(editTime)}
                </span>
              </label>
              <input
                type="range" min="0" max="720" step="15"
                value={editTime}
                onChange={(e) => setEditTime(parseInt(e.target.value))}
                className="slider w-full"
              />
              <div className="flex justify-between text-xs text-gray-500 mt-1">
                <span>0m</span><span>3h</span><span>6h</span><span>9h</span><span>12h</span>
              </div>
            </div>

            {/* Deep/shallow slider */}
            <div className="space-y-1">
              {editDeepWork == null && <p className="text-xs text-gray-400 text-center">(move slider to set)</p>}
              <div className={`flex items-center gap-3 ${editDeepWork == null ? 'opacity-40' : ''}`}>
                <span className="text-xs font-medium text-yellow-500 min-w-[60px] text-right">
                  {100 - (editDeepWork ?? 50)}% Shallow
                </span>
                <input
                  type="range" min="0" max="100" step="5"
                  value={editDeepWork ?? 50}
                  onChange={(e) => setEditDeepWork(parseInt(e.target.value))}
                  className="slider flex-1"
                  style={{ background: `linear-gradient(to right, #eab308 ${editDeepWork ?? 50}%, #22c55e ${editDeepWork ?? 50}%)` }}
                />
                <span className="text-xs font-medium text-green-500 min-w-[50px]">
                  {editDeepWork ?? 50}% Deep
                </span>
              </div>
            </div>

            {/* Notes */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-gray-700 dark:text-gray-300">Notes</label>
              <textarea
                rows={6}
                value={editNotes}
                onChange={(e) => setEditNotes(e.target.value)}
                placeholder="What did you work on?"
                className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 p-3 text-sm resize-y min-h-[100px] focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
              />
            </div>
          </div>

          <div className="flex gap-3 px-4 pb-4">
            <Button variant="outline" className="flex-1 text-sm" onClick={() => setEditDate(null)}>
              Cancel
            </Button>
            <Button
              className="flex-1 bg-black dark:bg-white text-white dark:text-black hover:bg-gray-800 dark:hover:bg-gray-200 text-sm"
              onClick={handleSave}
              disabled={isSaving}
            >
              {isSaving ? "Saving..." : "Save"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
