"use client";

import * as React from "react";

import {
  Card,
  CardContent,
} from "@/components/ui/card";
import { Calendar, BookOpen } from "lucide-react";
import { CalendarView } from "./calendar-view";
import { JournalView } from "./journal-view";

export function DashboardView({ viewMode = "calendar", onViewModeChange }) {
  return (
    <div className="space-y-4">
      {/* Mobile-only toggle (desktop toggle is in the header) */}
      <div className="sm:hidden flex items-center justify-center gap-1 bg-gray-100 dark:bg-gray-800 rounded-lg p-1 w-fit mx-auto">
        <button
          onClick={() => onViewModeChange?.("calendar")}
          className={`flex items-center gap-1.5 px-4 py-2 text-sm font-medium rounded-md transition-colors ${
            viewMode === "calendar"
              ? "bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 shadow-sm"
              : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
          }`}
        >
          <Calendar className="h-4 w-4" />
          Calendar
        </button>
        <button
          onClick={() => onViewModeChange?.("journal")}
          className={`flex items-center gap-1.5 px-4 py-2 text-sm font-medium rounded-md transition-colors ${
            viewMode === "journal"
              ? "bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 shadow-sm"
              : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
          }`}
        >
          <BookOpen className="h-4 w-4" />
          Journal
        </button>
      </div>

      {/* Conditional render */}
      {viewMode === "calendar" ? (
        <Card>
          <CardContent>
            <CalendarView />
          </CardContent>
        </Card>
      ) : (
        <JournalView />
      )}
    </div>
  );
}
