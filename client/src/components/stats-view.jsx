import React, { useState, useEffect, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/hooks/use-auth";
import { Lock, Clock, TrendingUp, Brain, Calendar } from "lucide-react";
import {
  format,
  startOfWeek,
  endOfWeek,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  subDays,
  subWeeks,
  subMonths,
  parseISO,
  isWithinInterval,
} from "date-fns";
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";

export function StatsView() {
  const { user } = useAuth();
  const [timeData, setTimeData] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  const [timeRange, setTimeRange] = useState("day");
  const [visibleSeries, setVisibleSeries] = useState({ hours: true, deepHours: true, shallowHours: true });
  const isAnonymous = !user || user.isAnonymous;

  useEffect(() => {
    if (isAnonymous) {
      setIsLoading(false);
      return;
    }
    const fetchData = async () => {
      try {
        const response = await apiRequest("/api/time-entries");
        const data = await response.json();
        setTimeData(data);
      } catch (e) {
        console.error("Failed to fetch time entries for stats:", e);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();

    const handler = () => fetchData();
    window.addEventListener("time-entries-updated", handler);
    return () => window.removeEventListener("time-entries-updated", handler);
  }, [isAnonymous]);

  const summaryStats = useMemo(() => {
    const now = new Date();
    const monthStart = startOfMonth(now);
    const monthEnd = endOfMonth(now);

    let totalMinutes = 0;
    let weightedDeepWork = 0;
    let deepWorkMinutes = 0;
    let daysWithEntries = 0;
    let allTimeMinutes = 0;

    Object.entries(timeData).forEach(([dateStr, entry]) => {
      const mins = typeof entry === "number" ? entry : entry.timeInMinutes;
      allTimeMinutes += mins;

      const date = parseISO(dateStr);
      if (isWithinInterval(date, { start: monthStart, end: monthEnd })) {
        totalMinutes += mins;
        const rawPct = typeof entry === "object" ? entry.deepWorkPercent : null;
        // Treat 50/50 as "not set" — the default slider position isn't an intentional entry
        const pct = rawPct === 50 ? null : rawPct;
        if (pct != null) {
          weightedDeepWork += pct * mins;
          deepWorkMinutes += mins;
        }
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

    if (timeRange === "day") {
      const days = eachDayOfInterval({ start: subDays(now, 29), end: now });
      return days.map((day) => {
        const key = format(day, "yyyy-MM-dd");
        const entry = timeData[key];
        const mins = entry ? (typeof entry === "number" ? entry : entry.timeInMinutes) : 0;
        const rawPct = entry && typeof entry === "object" ? entry.deepWorkPercent : null;
        const pct = rawPct === 50 ? null : rawPct;
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
        let totalMins = 0;
        let deepMins = 0;
        let hasDeepWork = false;

        Object.entries(timeData).forEach(([dateStr, entry]) => {
          const date = parseISO(dateStr);
          if (isWithinInterval(date, { start: ws, end: we })) {
            const mins = typeof entry === "number" ? entry : entry.timeInMinutes;
            totalMins += mins;
            const rawPct = typeof entry === "object" ? entry.deepWorkPercent : null;
            const pct = rawPct === 50 ? null : rawPct;
            if (pct != null) {
              deepMins += (mins * pct) / 100;
              hasDeepWork = true;
            }
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
        const ms = startOfMonth(subMonths(now, i));
        const me = endOfMonth(subMonths(now, i));
        let totalMins = 0;
        let deepMins = 0;
        let hasDeepWork = false;

        Object.entries(timeData).forEach(([dateStr, entry]) => {
          const date = parseISO(dateStr);
          if (isWithinInterval(date, { start: ms, end: me })) {
            const mins = typeof entry === "number" ? entry : entry.timeInMinutes;
            totalMins += mins;
            const rawPct = typeof entry === "object" ? entry.deepWorkPercent : null;
            const pct = rawPct === 50 ? null : rawPct;
            if (pct != null) {
              deepMins += (mins * pct) / 100;
              hasDeepWork = true;
            }
          }
        });

        months.push({
          label: format(ms, "MMM yy"),
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
      { name: "Deep Work", value: Math.round(deepHours * 10) / 10, color: "#3b82f6" },
      { name: "Shallow Work", value: Math.round(shallowHours * 10) / 10, color: "#eab308" },
    ];
  }, [summaryStats]);

  if (isAnonymous) {
    return (
      <Card className="border-yellow-500/30 bg-yellow-500/5">
        <CardContent className="p-6 text-center">
          <Lock className="h-8 w-8 mx-auto mb-3 text-yellow-500" />
          <h3 className="font-semibold text-yellow-400 mb-1">Authentication Required</h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Sign in to view your stats and analytics.
          </p>
        </CardContent>
      </Card>
    );
  }

  if (isLoading) {
    return <div className="text-center py-12 text-gray-500">Loading stats...</div>;
  }

  const rangeLabels = { day: "Daily", week: "Weekly", month: "Monthly" };
  const tooltipStyle = {
    backgroundColor: "#1f2937",
    border: "1px solid #374151",
    borderRadius: "8px",
    fontSize: "13px",
    color: "#f3f4f6",
  };

  return (
    <div className="space-y-6">
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
              <TrendingUp className="h-4 w-4 text-blue-500" />
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
              <Brain className="h-4 w-4 text-blue-500" />
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

      {/* Combined Hours & Work Type Chart */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">{rangeLabels[timeRange]} Hours & Work Type</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4 pb-3">
            {[
              { key: 'hours', label: 'Total Hours', color: '#10b981' },
              { key: 'deepHours', label: 'Deep Work', color: '#3b82f6' },
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
                  <linearGradient id="hoursGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="deepGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.02} />
                  </linearGradient>
                  <linearGradient id="shallowGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#eab308" stopOpacity={0.25} />
                    <stop offset="95%" stopColor="#eab308" stopOpacity={0.02} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" strokeOpacity={0.5} />
                <XAxis
                  dataKey="label"
                  tick={{ fontSize: 11, fill: "#9ca3af" }}
                  interval={timeRange === "day" ? 2 : 0}
                  angle={timeRange === "month" ? -45 : 0}
                  textAnchor={timeRange === "month" ? "end" : "middle"}
                />
                <YAxis tick={{ fontSize: 11, fill: "#9ca3af" }} />
                <Tooltip
                  contentStyle={tooltipStyle}
                  formatter={(value, name) => {
                    if (value == null) return ["--", name];
                    const labels = { hours: "Total Hours", deepHours: "Deep Work", shallowHours: "Shallow Work" };
                    return [`${value}h`, labels[name] || name];
                  }}
                />
                <Legend />
                {visibleSeries.hours && (
                  <Area
                    type="monotone"
                    dataKey="hours"
                    name="hours"
                    stroke="#10b981"
                    strokeWidth={2}
                    fill="url(#hoursGradient)"
                    dot={timeRange !== "day"}
                  />
                )}
                {visibleSeries.deepHours && (
                  <Area
                    type="monotone"
                    dataKey="deepHours"
                    name="deepHours"
                    stroke="#3b82f6"
                    strokeWidth={3}
                    fill="url(#deepGradient)"
                    dot={timeRange !== "day" ? { r: 4, fill: "#3b82f6" } : false}
                    connectNulls
                  />
                )}
                {visibleSeries.shallowHours && (
                  <Area
                    type="monotone"
                    dataKey="shallowHours"
                    name="shallowHours"
                    stroke="#eab308"
                    strokeWidth={3}
                    fill="url(#shallowGradient)"
                    dot={timeRange !== "day" ? { r: 4, fill: "#eab308" } : false}
                    connectNulls
                  />
                )}
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Deep vs Shallow Donut */}
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
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={80}
                      paddingAngle={2}
                      dataKey="value"
                    >
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
                  <div className="h-3 w-3 rounded-full bg-blue-500" />
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    Deep Work: {pieData[0].value}h
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="h-3 w-3 rounded-full bg-yellow-500" />
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    Shallow Work: {pieData[1].value}h
                  </span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* All-time stat */}
      <div className="text-center text-xs text-gray-400 dark:text-gray-500 pb-4">
        All-time total: {Math.round(summaryStats.allTimeHours * 10) / 10} hours tracked
      </div>
    </div>
  );
}
