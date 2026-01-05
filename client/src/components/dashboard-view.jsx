"use client"

import * as React from "react"

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Calendar } from "lucide-react"
import { CalendarView } from "./calendar-view"

export function DashboardView({ tasks, onUpdateTask }) {
  const [stopwatchComponent, setStopwatchComponent] = React.useState(null);

  return (
    <div className="space-y-6">
      {/* Manual Time Tracking Calendar */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Time Tracking Calendar
          </CardTitle>
          {stopwatchComponent}
        </CardHeader>
        <CardContent>
          <CalendarView onStopwatchMount={setStopwatchComponent} />
        </CardContent>
      </Card>
    </div>
  )
}
