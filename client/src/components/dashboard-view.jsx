
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
import { BarChart3, TrendingUp, Clock, Target } from "lucide-react"

const chartConfig = {
  priorityScore: {
    label: "Priority Score",
    color: "var(--chart-1)",
  },
  tasksCompleted: {
    label: "Tasks Completed", 
    color: "var(--chart-2)",
  },
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
      const tasksCompleted = dayTasks.length
      
      chartData.push({
        date: dateStr,
        priorityScore,
        tasksCompleted
      })
    }
    
    return chartData
  }

  const chartData = generateChartData()
  
  // Calculate summary stats
  const totalScore = chartData.reduce((sum, day) => sum + day.priorityScore, 0)
  const totalTasksCompleted = chartData.reduce((sum, day) => sum + day.tasksCompleted, 0)
  const avgDailyScore = chartData.length > 0 ? Math.round(totalScore / chartData.length) : 0
  
  // Get recent trend
  const recentDays = chartData.slice(-7)
  const oldDays = chartData.slice(-14, -7)
  const recentAvg = recentDays.reduce((sum, day) => sum + day.priorityScore, 0) / 7
  const oldAvg = oldDays.reduce((sum, day) => sum + day.priorityScore, 0) / 7
  const trendPercent = oldAvg > 0 ? Math.round(((recentAvg - oldAvg) / oldAvg) * 100) : 0

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Target className="h-4 w-4 text-blue-500" />
              <div>
                <p className="text-sm font-medium">Total Score</p>
                <p className="text-2xl font-bold">{totalScore}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <BarChart3 className="h-4 w-4 text-green-500" />
              <div>
                <p className="text-sm font-medium">Tasks Completed</p>
                <p className="text-2xl font-bold">{totalTasksCompleted}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Clock className="h-4 w-4 text-orange-500" />
              <div>
                <p className="text-sm font-medium">Avg Daily Score</p>
                <p className="text-2xl font-bold">{avgDailyScore}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <TrendingUp className={`h-4 w-4 ${trendPercent >= 0 ? 'text-green-500' : 'text-red-500'}`} />
              <div>
                <p className="text-sm font-medium">7-Day Trend</p>
                <p className="text-2xl font-bold flex items-center gap-1">
                  {trendPercent >= 0 ? '+' : ''}{trendPercent}%
                  <Badge variant={trendPercent >= 0 ? "default" : "destructive"} className="text-xs">
                    {trendPercent >= 0 ? 'UP' : 'DOWN'}
                  </Badge>
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Priority Score Chart */}
      <Card>
        <CardHeader className="flex items-center gap-2 space-y-0 border-b py-5 sm:flex-row">
          <div className="grid flex-1 gap-1">
            <CardTitle>Priority Score Dashboard</CardTitle>
            <CardDescription>
              Daily priority scores and task completion over time
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
                <linearGradient id="fillTasksCompleted" x1="0" y1="0" x2="0" y2="1">
                  <stop
                    offset="5%"
                    stopColor="var(--color-tasksCompleted)"
                    stopOpacity={0.8}
                  />
                  <stop
                    offset="95%"
                    stopColor="var(--color-tasksCompleted)"
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
                dataKey="tasksCompleted"
                type="natural"
                fill="url(#fillTasksCompleted)"
                stroke="var(--color-tasksCompleted)"
                stackId="a"
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
        </CardContent>
      </Card>
    </div>
  )
}
