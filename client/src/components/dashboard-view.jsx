"use client"

import * as React from "react"

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Calendar, Clock, Info } from "lucide-react"
import { CalendarView } from "./calendar-view"

export function DashboardView({ tasks, onUpdateTask }) {
  return (
    <div className="space-y-6">
      {/* Info Card */}
      <Card className="border-blue-200 dark:border-blue-800 bg-blue-50/50 dark:bg-blue-900/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-blue-800 dark:text-blue-200">
            <Info className="h-5 w-5" />
            Manual Time Tracking Dashboard
          </CardTitle>
          <CardDescription className="text-blue-700 dark:text-blue-300">
            This dashboard provides a manual time tracking calendar. The time entries here are independent 
            of your task management system and are meant for personal time tracking only.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4 text-sm text-blue-700 dark:text-blue-300">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4" />
              <span>Track work hours manually</span>
            </div>
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              <span>View daily and monthly summaries</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Manual Time Tracking Calendar */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Time Tracking Calendar
          </CardTitle>
          <CardDescription>
            Manually track your daily work hours. Double-click any day to enter time.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <CalendarView />
        </CardContent>
      </Card>

      {/* Usage Instructions */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">How to Use</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <h4 className="font-medium text-gray-900 dark:text-gray-100">Adding Time</h4>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Double-click on any day in the calendar to open the time entry modal. 
                Use the slider to select how many hours you worked that day.
              </p>
            </div>
            <div className="space-y-2">
              <h4 className="font-medium text-gray-900 dark:text-gray-100">Editing Time</h4>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                You can edit time entries for today and past dates only. 
                Future dates cannot be edited to maintain accuracy.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}