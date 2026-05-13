import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, Clock, Lock, FileText } from "lucide-react";
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
} from "date-fns";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useAuth } from "@/hooks/use-auth";

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
    if (pct >= 70) borderClass = "border-l-4 border-blue-500";
    else if (pct >= 40) borderClass = "border-l-4 border-blue-500/60";
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
  };

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
      <div className="flex items-center justify-between py-3">
        <div className="flex items-center gap-5">
          <h1 className="text-lg font-bold">Time Tracking Calendar</h1>
          <h2 className="text-lg font-semibold">
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
                  min-h-[60px] sm:min-h-[120px] p-1 sm:p-2 border-b border-r border-gray-200 dark:border-gray-600 relative cursor-pointer
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
                                className="h-full bg-blue-500"
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

      {/* Time Edit Modal */}
      <Dialog open={showTimeModal} onOpenChange={setShowTimeModal}>
        <DialogContent className="w-[95vw] max-w-md sm:max-w-lg mx-auto max-h-[95vh] overflow-y-auto bg-white dark:bg-black border border-gray-200 dark:border-gray-800">
          <DialogHeader>
            <DialogTitle className="flex items-center space-x-2">
              <Clock className="h-5 w-5" />
              <span>
                Time Entry -{" "}
                {selectedDate ? format(selectedDate, "MMMM d, yyyy") : ""}
              </span>
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-6 p-4">
            {/* Time Slider */}
            <div className="text-center">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                Time worked:{" "}
                <span className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                  {formatSliderTime(sliderTime)}
                </span>
              </label>
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
            </div>

            {/* Deep vs Shallow Work Proportion */}
            <div className="space-y-3">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Work Type Proportion {deepWorkPercent == null && <span className="text-xs text-gray-400 font-normal">(move slider to set)</span>}
              </label>

              {/* Mobile: percentages stacked above slider */}
              <div className={`flex sm:hidden justify-between text-sm font-medium ${deepWorkPercent == null ? 'opacity-40' : ''}`}>
                <span className="text-yellow-500">{100 - (deepWorkPercent ?? 50)}% Shallow</span>
                <span className="text-blue-500">{deepWorkPercent ?? 50}% Deep</span>
              </div>

              <div className={`flex items-center gap-3 ${deepWorkPercent == null ? 'opacity-40' : ''}`}>
                <span className="hidden sm:inline text-sm font-medium text-yellow-500 min-w-[70px] text-right">
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
                      background: `linear-gradient(to right, #eab308 ${deepWorkPercent ?? 50}%, #3b82f6 ${deepWorkPercent ?? 50}%)`
                    }}
                  />
                </div>
                <span className="hidden sm:inline text-sm font-medium text-blue-500 min-w-[55px]">
                  {deepWorkPercent ?? 50}% Deep
                </span>
              </div>
              <div className="flex justify-between text-xs text-gray-400">
                <span>Shallow Work</span>
                <span>Deep Work</span>
              </div>
            </div>

            {/* Notes */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                What did you do today?
              </label>
              <textarea
                rows={6}
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
                className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 p-3 text-sm resize-y min-h-[100px] focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div className="flex space-x-3 pt-4">
              <Button
                onClick={handleTimeCancel}
                variant="outline"
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                onClick={handleTimeSave}
                className="flex-1 bg-black dark:bg-white text-white dark:text-black hover:bg-gray-800 dark:hover:bg-gray-200"
                disabled={isLoading}
              >
                {isLoading ? "Saving..." : "Save Time"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
