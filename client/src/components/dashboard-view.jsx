"use client"

import * as React from "react"

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Calendar, Clock, Play, Pause, RotateCcw } from "lucide-react"
import { CalendarView } from "./calendar-view"
import { useStopwatch } from "@/hooks/use-stopwatch"
import { Button } from "@/components/ui/button"

export function DashboardView({ tasks, onUpdateTask }) {
  const [stopwatchComponent, setStopwatchComponent] = React.useState(null);
  const {
    time,
    isActive,
    toggleStopwatch,
    resetStopwatch,
    adjustTime,
    formatStopwatchTime
  } = useStopwatch();

  return (
    <div className="space-y-6">
      {/* Shared Stopwatch Card */}
      <Card className="bg-white dark:bg-black shadow-lg border-gray-200 dark:border-gray-800">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg font-semibold flex items-center gap-2">
            <Clock className="h-5 w-5 text-blue-500" />
            Live Stopwatch
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row items-center justify-between gap-6 p-4 bg-gray-50 dark:bg-gray-900/50 rounded-xl border border-gray-100 dark:border-gray-800">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-white dark:bg-black rounded-full shadow-inner border border-gray-100 dark:border-gray-800">
                <Clock className={`h-8 w-8 ${isActive ? 'text-blue-500 animate-pulse' : 'text-gray-400'}`} />
              </div>
              <div className="flex flex-col">
                <span className="text-3xl font-mono font-bold tracking-wider text-black dark:text-white">
                  {formatStopwatchTime(time)}
                </span>
                <span className="text-xs text-gray-500 font-medium">Session duration</span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => adjustTime(-900)}
                className="h-10 px-3 text-gray-500 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20"
              >
                -15m
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => adjustTime(900)}
                className="h-10 px-3 text-green-600 hover:text-green-700 hover:bg-green-50 dark:hover:bg-green-950/20"
              >
                +15m
              </Button>
              <div className="w-px h-8 bg-gray-200 dark:bg-gray-800 mx-2" />
              <Button
                onClick={toggleStopwatch}
                size="icon"
                className={`h-12 w-12 rounded-full transition-all duration-300 ${
                  isActive 
                    ? 'bg-orange-500 hover:bg-orange-600 text-white shadow-orange-500/20 shadow-lg' 
                    : 'bg-green-600 hover:bg-green-700 text-white shadow-green-600/20 shadow-lg'
                }`}
              >
                {isActive ? <Pause className="h-6 w-6" /> : <Play className="h-6 w-6 ml-1" />}
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={resetStopwatch}
                className="h-12 w-12 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
              >
                <RotateCcw className="h-6 w-6" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

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
