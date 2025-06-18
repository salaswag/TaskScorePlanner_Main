"use client"

import * as React from "react"
import { Area, AreaChart, CartesianGrid, XAxis } from "recharts"
import { format, subDays, startOfDay } from 'date-fns'

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { BarChart3, Calendar } from "lucide-react"
import { CalendarView } from "./calendar-view"

const chartConfig = {
  priorityScore: {
    label: "Priority Score",
    color: "var(--chart-1)",
  }
};

export function DashboardView({ tasks }) {
  const [timeRange, setTimeRange] = React.useState("30d")

  // Generate chart data from tasks
  const generateChartData = () => {
    const days = timeRange === "7d" ? 7 : timeRange === "30d" ? 30 : 90
    const chartData = []

    for (let i = days - 1; i >= 0; i--) {
      const date = startOfDay(subDays(new Date(), i))
      const dateStr = format(date, 'yyyy-MM-dd')

      // Get completed tasks for this date
      const dayTasks = tasks.filter(task => {
        if (!task.completed || !task.completedAt) return false
        const taskDate = startOfDay(new Date(task.completedAt))
        return taskDate.getTime() === date.getTime()
      })

      const priorityScore = dayTasks.reduce((sum, task) => sum + (task.priority || 0), 0)

      chartData.push({
        date: dateStr,
        priorityScore
      })
    }

    return chartData
  }

  const chartData = generateChartData()

  // Check if we have enough data (at least 7 days of activity)
  const activeDays = chartData.filter(day => day.priorityScore > 0).length
  const hasEnoughData = activeDays >= 7

  return (
    <div className="space-y-6">
      {/* Calendar View */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Daily Performance Calendar
          </CardTitle>
          <CardDescription>
            Daily priority scores and time tracking
          </CardDescription>
        </CardHeader>
        <CardContent>
          <CalendarView tasks={tasks} />
        </CardContent>
      </Card>

      {/* Priority Score Chart */}
      <Card>
        <CardHeader className="flex items-center gap-2 space-y-0 border-b py-5 sm:flex-row">
          <div className="grid flex-1 gap-1">
            <CardTitle>Priority Score Trends</CardTitle>
            <CardDescription>
              Daily priority completion over time
            </CardDescription>
          </div>
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger
              className="w-[160px] rounded-lg"
              aria-label="Select time range"
            >
              <SelectValue placeholder="Last 30 days" />
            </SelectTrigger>
            <SelectContent className="rounded-xl">
              <SelectItem value="90d" className="rounded-lg">
                Last 3 months
              </SelectItem>
              <SelectItem value="30d" className="rounded-lg">
                Last 30 days
              </SelectItem>
              <SelectItem value="7d" className="rounded-lg">
                Last 7 days
              </SelectItem>
            </SelectContent>
          </Select>
        </CardHeader>
        <CardContent className="px-2 pt-4 sm:px-6 sm:pt-6">
          {!hasEnoughData ? (
            <div className="flex items-center justify-center h-[400px] text-center">
              <div className="space-y-3">
                <div className="text-muted-foreground">
                  <BarChart3 className="h-12 w-12 mx-auto mb-4 opacity-50" />
                </div>
                <h3 className="text-lg font-medium text-muted-foreground">Not Enough Data</h3>
                <p className="text-sm text-muted-foreground max-w-sm">
                  Complete at least 7 days of tasks to see your priority score trends.
                </p>
                <Badge variant="outline" className="mt-2">
                  {activeDays} of 7 days completed
                </Badge>
              </div>
            </div>
          ) : (
            <ChartContainer
              config={chartConfig}
              className="aspect-auto h-[400px] w-full"
            >
            <AreaChart data={chartData}>
              <defs>
                <linearGradient id="fillPriorityScore" x1="0" y1="0" x2="0" y2="1">
                  <stop
                    offset="5%"
                    stopColor="var(--color-priorityScore)"
                    stopOpacity={0.8}
                  />
                  <stop
                    offset="95%"
                    stopColor="var(--color-priorityScore)"
                    stopOpacity={0.1}
                  />
                </linearGradient>
              </defs>
              <CartesianGrid vertical={false} />
              <XAxis
                dataKey="date"
                tickLine={false}
                axisLine={false}
                tickMargin={8}
                minTickGap={32}
                tickFormatter={(value) => {
                  const date = new Date(value)
                  return date.toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                  })
                }}
              />
              <ChartTooltip
                cursor={false}
                content={
                  <ChartTooltipContent
                    labelFormatter={(value) => {
                      return new Date(value).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        year: "numeric"
                      })
                    }}
                    indicator="dot"
                  />
                }
              />
              <Area
                dataKey="priorityScore"
                type="natural"
                fill="url(#fillPriorityScore)"
                stroke="var(--color-priorityScore)"
                stackId="a"
              />
            </AreaChart>
          </ChartContainer>
          )}
        </CardContent>
      </Card>
    </div>
  )
}