import React, { useState, useEffect, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, Clock, Lock, FileText, Mic, Loader2, Square, TrendingUp, Brain, Calendar } from "lucide-react";
import InlineTimer from "@/components/inline-timer";
import { apiRequest } from "@/lib/queryClient";
import {
  format,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  isSameMonth,
  isSameDay,
  addMonths,
  subMonths,
  startOfWeek,
  endOfWeek,
  isAfter,
  subDays,
  subWeeks,
  parseISO,
  isWithinInterval,
} from "date-fns";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useAuth } from "@/hooks/use-auth";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
} from "recharts";

const getTimeColorClasses = (timeInMinutes) => {
  if (timeInMinutes === undefined || timeInMinutes === null) return "";

  const hours = timeInMinutes / 60;

  if (hours >= 8) {
    // Green for 8+ hours
    return "bg-green-100 dark:bg-green-900/30 border-green-300 dark:border-green-700 text-green-800 dark:text-green-200";
  } else if (hours >= 7) {
    // Light green for 7+ hours
    return "bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800 text-green-700 dark:text-green-300";
  } else if (hours <= 1) {
    // Red for 1 hour or less
    return "bg-red-100 dark:bg-red-900/30 border-red-300 dark:border-red-700 text-red-800 dark:text-red-200";
  } else {
    // Scale from red to green (2-6 hours)
    const ratio = (hours - 1) / 6; // 0 to 1 scale for 2-6 hours
    if (ratio < 0.2) {
      // Red-ish
      return "bg-red-100 dark:bg-red-900/30 border-red-300 dark:border-red-700 text-red-800 dark:text-red-200";
    } else if (ratio < 0.4) {
      // Orange-ish
      return "bg-orange-100 dark:bg-orange-900/30 border-orange-300 dark:border-orange-700 text-orange-800 dark:text-orange-200";
    } else if (ratio < 0.6) {
      // Yellow-ish
      return "bg-yellow-100 dark:bg-yellow-900/30 border-yellow-300 dark:border-yellow-700 text-yellow-800 dark:text-yellow-200";
    } else if (ratio < 0.8) {
      // Lime-ish
      return "bg-lime-100 dark:bg-lime-900/30 border-lime-300 dark:border-lime-700 text-lime-800 dark:text-lime-200";
    } else {
      // Light lime approaching green
      return "bg-lime-50 dark:bg-lime-900/20 border-lime-200 dark:border-lime-800 text-lime-700 dark:text-lime-300";
    }
  }
};

export function CalendarView() {
  const { user } = useAuth();
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [showTimeModal, setShowTimeModal] = useState(false);
  const [selectedDate, setSelectedDate] = useState(null);
  const [sliderTime, setSliderTime] = useState(0);
  const [timeData, setTimeData] = useState({}); // Store manual time entries
  const [isLoading, setIsLoading] = useState(false);
  const [deepWorkPercent, setDeepWorkPercent] = useState(50);
  const [notes, setNotes] = useState('');
  const [panelLayout, setPanelLayout] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('time-entry-layout') || 'horizontal';
    }
    return 'horizontal';
  });

  // Voice recording states
  const [isRecording, setIsRecording] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [mediaRecorder, setMediaRecorder] = useState(null);
  const [audioChunks, setAudioChunks] = useState([]);
  const [timeRange, setTimeRange] = useState("day");
  const [visibleSeries, setVisibleSeries] = useState({ hours: true, deepHours: true, shallowHours: true });

  const isAnonymous = !user || user.isAnonymous;

  useEffect(() => {
    fetchTimeEntries();
  }, [user, isAnonymous]);

  useEffect(() => {
    const handler = () => fetchTimeEntries();
    window.addEventListener("time-entries-updated", handler);
    return () => window.removeEventListener("time-entries-updated", handler);
  }, [isAnonymous]);

  const fetchTimeEntries = async () => {
    // Don't fetch time entries for anonymous users
    if (isAnonymous) {
      console.log("👤 Anonymous user - time entries not available");
      setTimeData({});
      return;
    }

    try {
      setIsLoading(true);
      const response = await apiRequest("/api/time-entries");
      if (response.ok) {
        const data = await response.json();
        const formattedData = {};
        Object.keys(data).forEach((date) => {
          if (typeof data[date] === "number") {
            formattedData[date] = {
              timeInMinutes: data[date],
              deepWorkPercent: null,
              notes: '',
            };
          } else {
            // Treat 50/50 as "not set" — the default slider position means no intentional entry
            const rawPct = data[date].deepWorkPercent ?? null;
            formattedData[date] = {
              timeInMinutes: data[date].timeInMinutes,
              deepWorkPercent: rawPct === 50 ? null : rawPct,
              notes: data[date].notes || '',
            };
          }
        });
        setTimeData(formattedData);
      } else {
        console.error("Failed to fetch time entries:", response.status);
        setTimeData({});
      }
    } catch (error) {
      console.error("Error fetching time entries:", error);
      setTimeData({});
    } finally {
      setIsLoading(false);
    }
  };

  const formatTime = (timeInMinutes) => {
    if (!timeInMinutes || timeInMinutes === 0) return "0m";
    if (timeInMinutes >= 60) {
      const hours = Math.floor(timeInMinutes / 60);
      const minutes = timeInMinutes % 60;
      return minutes > 0 ? `${hours}h ${minutes}m` : `${hours}h`;
    } else {
      return `${timeInMinutes}m`;
    }
  };

  const formatSliderTime = (timeInMinutes) => {
    if (timeInMinutes === 0) return "0m";
    if (timeInMinutes >= 60) {
      const hours = Math.floor(timeInMinutes / 60);
      const minutes = timeInMinutes % 60;
      return minutes > 0 ? `${hours}h ${minutes}m` : `${hours}h`;
    } else {
      return `${timeInMinutes}m`;
    }
  };

  const getWorkTypeColorClasses = (timeEntry) => {
    if (!timeEntry || !timeEntry.timeInMinutes || timeEntry.timeInMinutes === 0)
      return "";

    const hoursClass = getTimeColorClasses(timeEntry.timeInMinutes);
    if (timeEntry.deepWorkPercent == null) return hoursClass;
    const pct = timeEntry.deepWorkPercent;
    let borderClass = "";
    if (pct >= 70) borderClass = "border-l-4 border-green-500";
    else if (pct >= 40) borderClass = "border-l-4 border-green-500/60";
    else borderClass = "border-l-4 border-yellow-500";

    return `${hoursClass} ${borderClass}`.trim();
  };

  const handleTimeEdit = (date) => {
    // Don't allow editing for anonymous users
    if (isAnonymous) {
      return;
    }

    // Don't allow editing future dates
    if (isAfter(date, new Date())) {
      return;
    }

    const dateKey = format(date, "yyyy-MM-dd");
    const existingEntry = timeData[dateKey];
    setSelectedDate(date);
    setSliderTime(existingEntry?.timeInMinutes || 0);
    setDeepWorkPercent(existingEntry?.deepWorkPercent ?? null);
    setNotes(existingEntry?.notes || '');
    setShowTimeModal(true);
  };

  const handleTimeSave = async () => {
    // Don't allow saving for anonymous users
    if (isAnonymous) {
      return;
    }

    if (selectedDate) {
      const dateKey = format(selectedDate, "yyyy-MM-dd");

      // Treat 50/50 as "not set" — the default slider position isn't an intentional entry
      const effectiveDeepWork = (deepWorkPercent != null && deepWorkPercent !== 50) ? deepWorkPercent : null;

      const payload = {
        date: dateKey,
        timeInMinutes: sliderTime,
        notes,
      };
      if (effectiveDeepWork != null) {
        payload.deepWorkPercent = effectiveDeepWork;
      }

      // Optimistic update so the cell reflects the change immediately
      setTimeData((prev) => ({
        ...prev,
        [dateKey]: {
          timeInMinutes: sliderTime,
          deepWorkPercent: effectiveDeepWork,
          notes,
        },
      }));

      // Close modal immediately for snappy UX
      setShowTimeModal(false);
      setSelectedDate(null);
      setSliderTime(0);
      setDeepWorkPercent(null);
      setNotes('');

      try {
        await apiRequest("/api/time-entries", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(payload),
        });
        // Re-sync from server to catch any backend-side conversions
        fetchTimeEntries();
      } catch (error) {
        console.error("Error saving time entry:", error);
      }
      return;
    }

    setShowTimeModal(false);
    setSelectedDate(null);
    setSliderTime(0);
  };

  const handleTimeCancel = () => {
    setShowTimeModal(false);
    setSelectedDate(null);
    setSliderTime(0);
    setDeepWorkPercent(null);
    setNotes('');
    // Stop any active recording
    if (mediaRecorder && mediaRecorder.state === 'recording') {
      mediaRecorder.stop();
      mediaRecorder.stream.getTracks().forEach(track => track.stop());
    }
    setIsRecording(false);
    setIsTranscribing(false);
    setMediaRecorder(null);
    setAudioChunks([]);
  };

  // Voice recording handlers
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream, { mimeType: 'audio/webm' });
      const chunks = [];

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunks.push(e.data);
      };

      recorder.onstop = async () => {
        stream.getTracks().forEach(track => track.stop());
        setIsRecording(false);
        setIsTranscribing(true);

        try {
          const audioBlob = new Blob(chunks, { type: 'audio/webm' });
          const reader = new FileReader();
          reader.readAsDataURL(audioBlob);
          reader.onloadend = async () => {
            const base64Audio = reader.result.split(',')[1];

            const token = user ? await user.getIdToken() : null;
            const res = await fetch('/api/transcribe', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                ...(token ? { Authorization: `Bearer ${token}` } : {}),
              },
              body: JSON.stringify({ audio: base64Audio, mimeType: 'audio/webm' }),
            });

            if (res.ok) {
              const data = await res.json();
              const textToAppend = data.formatted || data.transcript || '';
              if (textToAppend) {
                setNotes(prev => prev ? prev + '\n\n' + textToAppend : textToAppend);
              }
            } else {
              const err = await res.json();
              console.error('Transcription failed:', err.message);
              alert(err.message || 'Transcription failed');
            }
          };
        } catch (err) {
          console.error('Error processing audio:', err);
        }
        setIsTranscribing(false);
      };

      recorder.start();
      setMediaRecorder(recorder);
      setAudioChunks(chunks);
      setIsRecording(true);
    } catch (err) {
      console.error('Microphone access denied:', err);
      alert('Microphone access is required for voice recording.');
    }
  };

  const stopRecording = () => {
    if (mediaRecorder && mediaRecorder.state === 'recording') {
      mediaRecorder.stop();
    }
  };

  // ── Stats computations (merged from stats-view) ──
  const summaryStats = useMemo(() => {
    const now = new Date();
    const ms = startOfMonth(now);
    const me = endOfMonth(now);
    let totalMinutes = 0, weightedDeepWork = 0, deepWorkMinutes = 0, daysWithEntries = 0, allTimeMinutes = 0;

    Object.entries(timeData).forEach(([dateStr, entry]) => {
      const mins = entry.timeInMinutes || 0;
      allTimeMinutes += mins;
      const date = parseISO(dateStr);
      if (isWithinInterval(date, { start: ms, end: me })) {
        totalMinutes += mins;
        const pct = entry.deepWorkPercent;
        if (pct != null) { weightedDeepWork += pct * mins; deepWorkMinutes += mins; }
        if (mins > 0) daysWithEntries++;
      }
    });

    const totalHours = totalMinutes / 60;
    const avgDaily = daysWithEntries > 0 ? totalHours / daysWithEntries : 0;
    const deepWorkPct = deepWorkMinutes > 0 ? weightedDeepWork / deepWorkMinutes : null;
    const allTimeHours = allTimeMinutes / 60;
    return { totalHours, avgDaily, deepWorkPct, daysWithEntries, allTimeHours };
  }, [timeData]);

  const chartData = useMemo(() => {
    const now = new Date();
    const getEntry = (key) => timeData[key];

    if (timeRange === "day") {
      return eachDayOfInterval({ start: subDays(now, 29), end: now }).map((day) => {
        const entry = getEntry(format(day, "yyyy-MM-dd"));
        const mins = entry ? entry.timeInMinutes || 0 : 0;
        const pct = entry ? entry.deepWorkPercent : null;
        return {
          label: format(day, "MMM d"),
          hours: Math.round((mins / 60) * 10) / 10,
          deepHours: pct != null ? Math.round(((mins * pct) / 100 / 60) * 10) / 10 : null,
          shallowHours: pct != null ? Math.round(((mins * (100 - pct)) / 100 / 60) * 10) / 10 : null,
        };
      });
    }

    if (timeRange === "week") {
      const weeks = [];
      for (let i = 11; i >= 0; i--) {
        const ws = startOfWeek(subWeeks(now, i));
        const we = endOfWeek(subWeeks(now, i));
        let totalMins = 0, deepMins = 0, hasDeepWork = false;
        Object.entries(timeData).forEach(([dateStr, entry]) => {
          const date = parseISO(dateStr);
          if (isWithinInterval(date, { start: ws, end: we })) {
            const mins = entry.timeInMinutes || 0;
            totalMins += mins;
            const pct = entry.deepWorkPercent;
            if (pct != null) { deepMins += (mins * pct) / 100; hasDeepWork = true; }
          }
        });
        weeks.push({
          label: format(ws, "MMM d"),
          hours: Math.round((totalMins / 60) * 10) / 10,
          deepHours: hasDeepWork ? Math.round((deepMins / 60) * 10) / 10 : null,
          shallowHours: hasDeepWork ? Math.round(((totalMins - deepMins) / 60) * 10) / 10 : null,
        });
      }
      return weeks;
    }

    if (timeRange === "month") {
      const months = [];
      for (let i = 11; i >= 0; i--) {
        const mStart = startOfMonth(subMonths(now, i));
        const mEnd = endOfMonth(subMonths(now, i));
        let totalMins = 0, deepMins = 0, hasDeepWork = false;
        Object.entries(timeData).forEach(([dateStr, entry]) => {
          const date = parseISO(dateStr);
          if (isWithinInterval(date, { start: mStart, end: mEnd })) {
            const mins = entry.timeInMinutes || 0;
            totalMins += mins;
            const pct = entry.deepWorkPercent;
            if (pct != null) { deepMins += (mins * pct) / 100; hasDeepWork = true; }
          }
        });
        months.push({
          label: format(mStart, "MMM yy"),
          hours: Math.round((totalMins / 60) * 10) / 10,
          deepHours: hasDeepWork ? Math.round((deepMins / 60) * 10) / 10 : null,
          shallowHours: hasDeepWork ? Math.round(((totalMins - deepMins) / 60) * 10) / 10 : null,
        });
      }
      return months;
    }
    return [];
  }, [timeData, timeRange]);

  const pieData = useMemo(() => {
    if (summaryStats.deepWorkPct == null) return null;
    const deepHours = (summaryStats.totalHours * summaryStats.deepWorkPct) / 100;
    const shallowHours = summaryStats.totalHours - deepHours;
    return [
      { name: "Deep Work", value: Math.round(deepHours * 10) / 10, color: "#22c55e" },
      { name: "Shallow Work", value: Math.round(shallowHours * 10) / 10, color: "#eab308" },
    ];
  }, [summaryStats]);

  const rangeLabels = { day: "Daily", week: "Weekly", month: "Monthly" };
  const tooltipStyle = { backgroundColor: "#1f2937", border: "1px solid #374151", borderRadius: "8px", fontSize: "13px", color: "#f3f4f6" };

  // Generate calendar days
  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const calendarStart = startOfWeek(monthStart);
  const calendarEnd = endOfWeek(monthEnd);
  const calendarDays = eachDayOfInterval({
    start: calendarStart,
    end: calendarEnd,
  });

  const navigateMonth = (direction) => {
    if (direction === "prev") {
      setCurrentMonth(subMonths(currentMonth, 1));
    } else {
      setCurrentMonth(addMonths(currentMonth, 1));
    }
  };

  const goToToday = () => {
    setCurrentMonth(new Date());
  };

  return (
    <div className="w-full space-y-4">
      {/* Authentication Required Message */}
      {isAnonymous && (
        <Card className="bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-700">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Lock className="h-5 w-5 text-yellow-600 dark:text-yellow-400" />
              <div>
                <p className="text-sm font-medium text-yellow-800 dark:text-yellow-200">
                  Authentication Required
                </p>
                <p className="text-xs text-yellow-700 dark:text-yellow-300">
                  You must be logged in to use the time tracking calendar.
                  Please log in to track your work hours.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Calendar Header */}
      <div className="flex items-center justify-between py-4 px-1">
        <div className="flex items-center gap-4">
          <h1 className="text-base font-bold">Time Tracking Calendar</h1>
          <h2 className="text-base font-semibold text-gray-600 dark:text-gray-300">
            {format(currentMonth, "MMMM yyyy")}
          </h2>
          <Button
            variant="outline"
            size="sm"
            onClick={goToToday}
            className="text-xs"
            disabled={isAnonymous}
          >
            Today
          </Button>
        </div>
        <div className="flex items-center gap-4">
          <InlineTimer />
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigateMonth("prev")}
              disabled={isAnonymous}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigateMonth("next")}
              disabled={isAnonymous}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Calendar Grid */}
      {isLoading ? (
        <Card className="bg-white dark:bg-gray-950 border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
          <CardContent className="p-6">
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
              <p className="text-gray-500 dark:text-gray-400 mt-4">
                Loading calendar...
              </p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div
          className={`bg-white dark:bg-gray-950 border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden ${isAnonymous ? "opacity-50 pointer-events-none" : ""}`}
        >
          {/* Days of Week Header */}
          <div className="grid grid-cols-7 bg-gray-50 dark:bg-gray-800">
            {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
              <div
                key={day}
                className="p-1.5 sm:p-3 text-center text-xs sm:text-sm font-medium text-gray-600 dark:text-gray-300"
              >
                <span className="sm:hidden">{day.charAt(0)}</span>
                <span className="hidden sm:inline">{day}</span>
              </div>
            ))}
          </div>

          {/* Calendar Days */}
          <div className="grid grid-cols-7">
            {calendarDays.map((day, index) => {
              const dateKey = format(day, "yyyy-MM-dd");
              const timeEntry = timeData[dateKey];
              const timeSpent = timeEntry?.timeInMinutes || 0;
              const isCurrentMonth = isSameMonth(day, currentMonth);
              const isToday = isSameDay(day, new Date());
              const isFuture = isAfter(day, new Date());

              return (
                <div
                  key={index}
                  className={`
                  min-h-[50px] sm:min-h-[100px] p-0.5 sm:p-1.5 border-b border-r border-gray-200 dark:border-gray-600 relative cursor-pointer
                  ${!isCurrentMonth ? "bg-gray-50 dark:bg-gray-800/30 text-gray-400" : ""}
                  ${isToday ? "bg-blue-50 dark:bg-blue-900/20" : ""}
                  ${isFuture ? "opacity-50" : ""}
                  ${isCurrentMonth && !isFuture && timeEntry ? getTimeColorClasses(timeSpent) : ""}
                  ${isCurrentMonth && !isFuture && !timeEntry ? "bg-white dark:bg-gray-900 hover:bg-gray-50 dark:hover:bg-gray-800" : ""}
                `}
                  onClick={() =>
                    !isFuture &&
                    isCurrentMonth &&
                    !isAnonymous &&
                    handleTimeEdit(day)
                  }
                  title={
                    isAnonymous
                      ? "Login required to track time"
                      : !isFuture && isCurrentMonth
                        ? timeSpent > 0
                          ? `${formatTime(timeSpent)} worked${timeEntry?.deepWorkPercent != null ? `\nDeep work: ${timeEntry.deepWorkPercent}%\nShallow work: ${100 - timeEntry.deepWorkPercent}%` : ''}${timeEntry?.notes ? `\n${timeEntry.notes}` : ''}\nClick to edit`
                          : "Click to add time"
                        : ""
                  }
                >
                  <div className="flex flex-col h-full relative z-10">
                    {/* Date Number + mobile hours indicator */}
                    <div
                      className={`
                    text-xs sm:text-sm font-medium mb-1 sm:mb-2 flex items-center justify-between
                    ${isToday ? "text-blue-600 dark:text-blue-400 font-bold" : ""}
                    ${!isCurrentMonth ? "text-gray-400" : "text-gray-900 dark:text-gray-100"}
                  `}
                    >
                      <span>{format(day, "d")}</span>
                      {isCurrentMonth && !isFuture && timeSpent > 0 && (
                        <span className="sm:hidden text-[10px] font-normal text-gray-600 dark:text-gray-300">
                          {timeSpent >= 60 ? `${Math.round(timeSpent / 60)}h` : "·"}
                        </span>
                      )}
                    </div>

                    {/* Mobile: minimal indicator dot if notes exist */}
                    {isCurrentMonth && !isFuture && timeEntry?.notes && (
                      <div className="sm:hidden absolute bottom-1 right-1">
                        <FileText className="w-2.5 h-2.5 text-gray-500 dark:text-gray-400" />
                      </div>
                    )}

                    {/* Desktop: empty-state "Add" button */}
                    {isCurrentMonth && !isFuture && !timeEntry && (
                      <div className="hidden sm:flex flex-1 flex-col items-center justify-center">
                        <div
                          className={`rounded-lg p-2 transition-colors w-full text-center ${isAnonymous ? "cursor-not-allowed" : "cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800"}`}
                          onClick={() => !isAnonymous && handleTimeEdit(day)}
                          title={
                            isAnonymous
                              ? "Login required to track time"
                              : "Click to add time"
                          }
                        >
                          <div className="flex items-center justify-center gap-1 text-gray-400 dark:text-gray-500">
                            {isAnonymous ? (
                              <Lock className="w-3 h-3" />
                            ) : (
                              <Clock className="w-3 h-3" />
                            )}
                            <span className="text-xs">
                              {isAnonymous ? "Login" : "Add"}
                            </span>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Desktop: rich time + proportion display */}
                    {isCurrentMonth && !isFuture && timeEntry && (
                      <div className="hidden sm:flex flex-1 flex-col items-center justify-center space-y-1">
                        <div className="flex items-center gap-2">
                          <Clock className="w-4 h-4" />
                          <span className="text-lg font-semibold">
                            {formatTime(timeSpent)}
                          </span>
                        </div>

                        {/* Work Proportion Bar */}
                        {timeEntry.deepWorkPercent != null && (
                          <div className="w-full">
                            <div className="flex h-1.5 rounded-full overflow-hidden">
                              <div
                                className="h-full bg-green-500"
                                style={{ width: `${timeEntry.deepWorkPercent}%` }}
                              />
                              <div className="h-full bg-yellow-400 flex-1" />
                            </div>
                            <div className="text-[10px] text-center text-gray-500 dark:text-gray-400">
                              {timeEntry.deepWorkPercent}% deep
                            </div>
                          </div>
                        )}

                        {/* Notes indicator */}
                        {timeEntry?.notes && (
                          <div className="flex items-center gap-1 text-[10px] text-gray-500 dark:text-gray-400 w-full justify-center" title={timeEntry.notes}>
                            <FileText className="w-2.5 h-2.5" />
                            <span className="truncate max-w-[80px]">{timeEntry.notes}</span>
                          </div>
                        )}
                      </div>
                    )}

                    {isFuture && isCurrentMonth && (
                      <div className="hidden sm:flex flex-1 items-center justify-center">
                        <span className="text-xs text-gray-400">
                          Future date
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Instructions and Small Disclaimer */}
      <div className="flex items-center justify-between text-sm text-gray-600 dark:text-gray-300">
        <div className="flex items-center gap-2">
          {isAnonymous ? (
            <Lock className="w-4 h-4" />
          ) : (
            <Clock className="w-4 h-4" />
          )}
          <span>
            {isAnonymous
              ? "Login required to track time on calendar"
              : "Click any day to manually enter time worked"}
          </span>
        </div>
        <div className="text-xs text-gray-400 dark:text-gray-500">
          Manual time tracking - not connected to tasks
        </div>
      </div>

      {/* ── Merged Stats Section ── */}
      {!isAnonymous && Object.keys(timeData).length > 0 && (
        <div className="space-y-4 pt-2">
          <hr className="border-gray-200 dark:border-gray-700" />

          {/* Header with range selector */}
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100">
              {format(new Date(), "MMMM yyyy")} Stats
            </h2>
            <div className="flex gap-1 bg-gray-100 dark:bg-gray-800 rounded-lg p-1">
              {["day", "week", "month"].map((range) => (
                <button
                  key={range}
                  onClick={() => setTimeRange(range)}
                  className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                    timeRange === range
                      ? "bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 shadow-sm"
                      : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
                  }`}
                >
                  {rangeLabels[range]}
                </button>
              ))}
            </div>
          </div>

          {/* Summary Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-1">
                  <Clock className="h-4 w-4 text-green-500" />
                  <p className="text-xs text-gray-500 dark:text-gray-400">This Month</p>
                </div>
                <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                  {Math.round(summaryStats.totalHours * 10) / 10}h
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-1">
                  <TrendingUp className="h-4 w-4 text-violet-500" />
                  <p className="text-xs text-gray-500 dark:text-gray-400">Avg/Day</p>
                </div>
                <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                  {Math.round(summaryStats.avgDaily * 10) / 10}h
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-1">
                  <Brain className="h-4 w-4 text-green-500" />
                  <p className="text-xs text-gray-500 dark:text-gray-400">Deep Work</p>
                </div>
                <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                  {summaryStats.deepWorkPct != null ? `${Math.round(summaryStats.deepWorkPct)}%` : "—"}
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-1">
                  <Calendar className="h-4 w-4 text-purple-500" />
                  <p className="text-xs text-gray-500 dark:text-gray-400">Active Days</p>
                </div>
                <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                  {summaryStats.daysWithEntries}
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Area Chart */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">{rangeLabels[timeRange]} Hours & Work Type</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-4 pb-3">
                {[
                  { key: 'hours', label: 'Total Hours', color: '#8b5cf6' },
                  { key: 'deepHours', label: 'Deep Work', color: '#22c55e' },
                  { key: 'shallowHours', label: 'Shallow Work', color: '#eab308' },
                ].map(({ key, label, color }) => (
                  <label key={key} className="flex items-center gap-1.5 cursor-pointer text-xs text-gray-600 dark:text-gray-400 select-none">
                    <input
                      type="checkbox"
                      checked={visibleSeries[key]}
                      onChange={() => setVisibleSeries(prev => ({ ...prev, [key]: !prev[key] }))}
                      className="w-3 h-3 rounded accent-current"
                      style={{ accentColor: color }}
                    />
                    <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: color }} />
                    {label}
                  </label>
                ))}
              </div>
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData}>
                    <defs>
                      <linearGradient id="statsHoursGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
                      </linearGradient>
                      <linearGradient id="statsDeepGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#22c55e" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#22c55e" stopOpacity={0.02} />
                      </linearGradient>
                      <linearGradient id="statsShallowGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#eab308" stopOpacity={0.25} />
                        <stop offset="95%" stopColor="#eab308" stopOpacity={0.02} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#374151" strokeOpacity={0.5} />
                    <XAxis dataKey="label" tick={{ fontSize: 11, fill: "#9ca3af" }} interval={timeRange === "day" ? 2 : 0} angle={timeRange === "month" ? -45 : 0} textAnchor={timeRange === "month" ? "end" : "middle"} />
                    <YAxis tick={{ fontSize: 11, fill: "#9ca3af" }} />
                    <Tooltip contentStyle={tooltipStyle} formatter={(value, name) => {
                      if (value == null) return ["--", name];
                      const labels = { hours: "Total Hours", deepHours: "Deep Work", shallowHours: "Shallow Work" };
                      return [`${value}h`, labels[name] || name];
                    }} />
                    <Legend />
                    {visibleSeries.hours && <Area type="monotone" dataKey="hours" name="hours" stroke="#8b5cf6" strokeWidth={2} fill="url(#statsHoursGrad)" dot={timeRange !== "day"} />}
                    {visibleSeries.deepHours && <Area type="monotone" dataKey="deepHours" name="deepHours" stroke="#22c55e" strokeWidth={3} fill="url(#statsDeepGrad)" dot={timeRange !== "day" ? { r: 4, fill: "#22c55e" } : false} connectNulls />}
                    {visibleSeries.shallowHours && <Area type="monotone" dataKey="shallowHours" name="shallowHours" stroke="#eab308" strokeWidth={3} fill="url(#statsShallowGrad)" dot={timeRange !== "day" ? { r: 4, fill: "#eab308" } : false} connectNulls />}
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Pie Chart */}
          {pieData && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Work Breakdown — {format(new Date(), "MMMM")}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-center gap-8">
                  <div className="h-48 w-48">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie data={pieData} cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={2} dataKey="value">
                          {pieData.map((entry, index) => (
                            <Cell key={index} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip contentStyle={tooltipStyle} formatter={(value) => `${value}h`} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <div className="h-3 w-3 rounded-full bg-green-500" />
                      <span className="text-sm text-gray-600 dark:text-gray-400">Deep Work: {pieData[0].value}h</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="h-3 w-3 rounded-full bg-yellow-500" />
                      <span className="text-sm text-gray-600 dark:text-gray-400">Shallow Work: {pieData[1].value}h</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* All-time total */}
          <div className="text-center text-xs text-gray-400 dark:text-gray-500 pb-2">
            All-time total: {Math.round(summaryStats.allTimeHours * 10) / 10} hours tracked
          </div>
        </div>
      )}

      {/* Time Edit Modal */}
      <Dialog open={showTimeModal} onOpenChange={setShowTimeModal}>
        <DialogContent className={`w-[95vw] mx-auto max-h-[95vh] overflow-y-auto bg-white dark:bg-black border border-gray-200 dark:border-gray-800 ${panelLayout === 'vertical' ? 'max-w-2xl sm:max-w-3xl' : 'max-w-md sm:max-w-lg'}`}>
          <DialogHeader>
            <DialogTitle className="flex items-center space-x-2">
              <Clock className="h-5 w-5" />
              <span>
                Time Entry -{" "}
                {selectedDate ? format(selectedDate, "MMMM d, yyyy") : ""}
              </span>
            </DialogTitle>
          </DialogHeader>

          {/* Layout Toggle */}
          <div className="flex items-center justify-center gap-1 px-4 pt-1">
            <button
              onClick={() => { setPanelLayout('horizontal'); localStorage.setItem('time-entry-layout', 'horizontal'); }}
              className={`px-3 py-1 text-xs rounded-md transition-colors ${panelLayout === 'horizontal' ? 'bg-gray-200 dark:bg-gray-700 font-medium text-gray-900 dark:text-white' : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'}`}
            >
              Stacked
            </button>
            <button
              onClick={() => { setPanelLayout('vertical'); localStorage.setItem('time-entry-layout', 'vertical'); }}
              className={`px-3 py-1 text-xs rounded-md transition-colors ${panelLayout === 'vertical' ? 'bg-gray-200 dark:bg-gray-700 font-medium text-gray-900 dark:text-white' : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'}`}
            >
              Side-by-Side
            </button>
          </div>

          <div className={`p-4 text-sm ${panelLayout === 'vertical' ? 'flex gap-4' : 'space-y-5'}`}>
            {/* Left side (or top in stacked) — sliders */}
            <div className={panelLayout === 'vertical' ? 'w-1/3 space-y-4 flex flex-col items-center' : ''}>
              {/* Time Slider */}
              <div className={panelLayout === 'vertical' ? 'text-center w-full' : 'text-center'}>
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Time worked:{" "}
                  <span className="text-lg font-bold text-blue-600 dark:text-blue-400">
                    {formatSliderTime(sliderTime)}
                  </span>
                </label>
                {panelLayout === 'vertical' ? (
                  <div className="flex flex-col items-center">
                    <input
                      type="range"
                      min="0"
                      max="720"
                      step="15"
                      value={sliderTime}
                      onChange={(e) => setSliderTime(parseInt(e.target.value))}
                      className="slider h-2 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer"
                      style={{ writingMode: 'vertical-lr', direction: 'rtl', height: '120px', width: '8px' }}
                    />
                    <div className="flex flex-col justify-between text-xs text-gray-500 dark:text-gray-400 mt-1 h-6">
                      <span>0 — 12h</span>
                    </div>
                  </div>
                ) : (
                  <div className="relative max-w-md mx-auto">
                    <input
                      type="range"
                      min="0"
                      max="720"
                      step="15"
                      value={sliderTime}
                      onChange={(e) => setSliderTime(parseInt(e.target.value))}
                      className="slider w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer"
                    />
                    <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mt-2">
                      <span>0m</span>
                      <span>3h</span>
                      <span>6h</span>
                      <span>9h</span>
                      <span>12h</span>
                    </div>
                  </div>
                )}
              </div>

              {/* Deep vs Shallow Work Proportion */}
              <div className={panelLayout === 'vertical' ? 'text-center w-full' : 'space-y-2'}>
                {deepWorkPercent == null && <p className="text-xs text-gray-400 text-center mb-1">(move slider to set)</p>}

                {panelLayout === 'vertical' ? (
                  <div className={`flex flex-col items-center gap-2 ${deepWorkPercent == null ? 'opacity-40' : ''}`}>
                    <span className="text-xs font-medium text-green-500">{deepWorkPercent ?? 50}% Deep</span>
                    <input
                      type="range"
                      min="0"
                      max="100"
                      step="5"
                      value={deepWorkPercent ?? 50}
                      onChange={(e) => setDeepWorkPercent(parseInt(e.target.value))}
                      className="slider rounded-lg appearance-none cursor-pointer"
                      style={{
                        writingMode: 'vertical-lr',
                        direction: 'rtl',
                        height: '100px',
                        width: '8px',
                        background: `linear-gradient(to top, #eab308 ${deepWorkPercent ?? 50}%, #22c55e ${deepWorkPercent ?? 50}%)`
                      }}
                    />
                    <span className="text-xs font-medium text-yellow-500">{100 - (deepWorkPercent ?? 50)}% Shallow</span>
                  </div>
                ) : (
                  <>
                    <div className={`flex sm:hidden justify-between text-xs font-medium ${deepWorkPercent == null ? 'opacity-40' : ''}`}>
                      <span className="text-yellow-500">{100 - (deepWorkPercent ?? 50)}% Shallow</span>
                      <span className="text-green-500">{deepWorkPercent ?? 50}% Deep</span>
                    </div>
                    <div className={`flex items-center gap-3 ${deepWorkPercent == null ? 'opacity-40' : ''}`}>
                      <span className="hidden sm:inline text-xs font-medium text-yellow-500 min-w-[70px] text-right">
                        {100 - (deepWorkPercent ?? 50)}% Shallow
                      </span>
                      <div className="flex-1 relative">
                        <input
                          type="range"
                          min="0"
                          max="100"
                          step="5"
                          value={deepWorkPercent ?? 50}
                          onChange={(e) => setDeepWorkPercent(parseInt(e.target.value))}
                          className="slider w-full h-2 rounded-lg appearance-none cursor-pointer"
                          style={{
                            background: `linear-gradient(to right, #eab308 ${deepWorkPercent ?? 50}%, #22c55e ${deepWorkPercent ?? 50}%)`
                          }}
                        />
                      </div>
                      <span className="hidden sm:inline text-xs font-medium text-blue-500 min-w-[55px]">
                        {deepWorkPercent ?? 50}% Deep
                      </span>
                    </div>
                    <div className="flex justify-between text-xs text-gray-400">
                      <span>Shallow Work</span>
                      <span>Deep Work</span>
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Right side (or bottom in stacked) — Notes */}
            <div className={panelLayout === 'vertical' ? 'w-2/3 flex flex-col' : ''}>
              <div className="space-y-2 flex-1 flex flex-col">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-medium text-gray-700 dark:text-gray-300">
                    What did you do today?
                  </label>
                  {!isAnonymous && (
                    <button
                      type="button"
                      onClick={isRecording ? stopRecording : isTranscribing ? undefined : startRecording}
                      disabled={isTranscribing}
                      className={`flex items-center gap-1 px-2 py-1 rounded-md text-xs transition-all ${
                        isRecording
                          ? 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 animate-pulse'
                          : isTranscribing
                          ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 cursor-wait'
                          : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
                      }`}
                      title={isRecording ? 'Stop recording' : isTranscribing ? 'Transcribing...' : 'Voice to text'}
                    >
                      {isRecording ? (
                        <>
                          <Square className="w-3 h-3 fill-current" />
                          <span>Stop</span>
                        </>
                      ) : isTranscribing ? (
                        <>
                          <Loader2 className="w-3 h-3 animate-spin" />
                          <span>Transcribing...</span>
                        </>
                      ) : (
                        <>
                          <Mic className="w-3 h-3" />
                          <span>Voice</span>
                        </>
                      )}
                    </button>
                  )}
                </div>
                <textarea
                  rows={panelLayout === 'vertical' ? 12 : 8}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Tab') {
                      e.preventDefault();
                      const { selectionStart, selectionEnd } = e.target;
                      const newValue = notes.substring(0, selectionStart) + '    ' + notes.substring(selectionEnd);
                      setNotes(newValue);
                      requestAnimationFrame(() => {
                        e.target.selectionStart = e.target.selectionEnd = selectionStart + 4;
                      });
                    }
                  }}
                  placeholder={"- Use dash for bullets\n    Tab to indent (4 spaces)\n    - Nested items\nNotes about your work today..."}
                  className="w-full flex-1 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 p-3 text-sm resize-y min-h-[120px] focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex space-x-3 px-4 pb-4">
            <Button
              onClick={handleTimeCancel}
              variant="outline"
              className="flex-1 text-sm"
            >
              Cancel
            </Button>
            <Button
              onClick={handleTimeSave}
              className="flex-1 bg-black dark:bg-white text-white dark:text-black hover:bg-gray-800 dark:hover:bg-gray-200 text-sm"
              disabled={isLoading}
            >
              {isLoading ? "Saving..." : "Save Time"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
