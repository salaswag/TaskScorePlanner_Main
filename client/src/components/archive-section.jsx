import React, { useState, useMemo } from "react";
import { Card } from "@/components/ui/card";
import {
  Collapsible,
  CollapsibleTrigger,
  CollapsibleContent,
} from "@/components/ui/collapsible";
import { Archive, ChevronDown, ChevronRight, Clock, CheckCircle } from "lucide-react";
import { WorkTypeBadge } from "./task-table";

const getPriorityColor = (priority) => {
  if (priority >= 8) return "bg-red-200 text-red-900 border-red-300";
  if (priority >= 6) return "bg-orange-200 text-orange-900 border-orange-300";
  if (priority >= 4) return "bg-yellow-200 text-yellow-900 border-yellow-300";
  return "bg-green-200 text-green-900 border-green-300";
};

const getDistractionColor = (level) => {
  const colors = [
    "text-green-600",
    "text-green-500",
    "text-yellow-500",
    "text-orange-500",
    "text-red-500",
  ];
  return colors[(level || 1) - 1] || "text-muted-foreground";
};

const formatTime = (minutes) => {
  if (!minutes && minutes !== 0) return "—";
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return h > 0 ? `${h}h ${m}m` : `${m}m`;
};

function formatDateHeader(dateStr) {
  const date = new Date(dateStr + "T12:00:00");
  return date.toLocaleDateString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
}

export default function ArchiveSection({ tasks }) {
  const [isOpen, setIsOpen] = useState(false);

  // Group tasks by archivedAt date (local timezone), newest first
  const dateGroups = useMemo(() => {
    if (!tasks || tasks.length === 0) return [];

    const groups = {};
    for (const task of tasks) {
      const d = task.archivedAt
        ? new Date(task.archivedAt)
        : new Date(task.completedAt || task.createdAt);
      const key = d.toLocaleDateString("en-CA"); // YYYY-MM-DD format
      if (!groups[key]) groups[key] = [];
      groups[key].push(task);
    }

    return Object.entries(groups)
      .sort(([a], [b]) => b.localeCompare(a))
      .map(([date, dateTasks]) => ({
        date,
        label: formatDateHeader(date),
        tasks: dateTasks.sort(
          (a, b) =>
            new Date(b.archivedAt || 0) - new Date(a.archivedAt || 0)
        ),
      }));
  }, [tasks]);

  if (!tasks || tasks.length === 0) return null;

  return (
    <Card className="bg-muted/30 border border-dashed border-border overflow-hidden">
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        {/* Section Header */}
        <CollapsibleTrigger className="w-full px-3 sm:px-4 py-2.5 flex items-center gap-2 hover:bg-muted/50 transition-colors cursor-pointer">
          {isOpen ? (
            <ChevronDown className="h-4 w-4 text-muted-foreground shrink-0" />
          ) : (
            <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
          )}
          <Archive className="h-4 w-4 text-muted-foreground shrink-0" />
          <span className="text-sm font-medium text-muted-foreground">
            Archive
          </span>
          <span className="text-xs font-medium text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
            {tasks.length}
          </span>
        </CollapsibleTrigger>

        <CollapsibleContent>
          <div className="px-2 sm:px-3 pb-3 space-y-2">
            {dateGroups.map((group) => (
              <DateGroup key={group.date} group={group} />
            ))}
          </div>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  );
}

function DateGroup({ group }) {
  const [isOpen, setIsOpen] = useState(true);

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      {/* Date Header */}
      <CollapsibleTrigger className="w-full flex items-center gap-2 px-3 py-2 rounded-md hover:bg-muted/60 transition-colors cursor-pointer">
        {isOpen ? (
          <ChevronDown className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
        ) : (
          <ChevronRight className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
        )}
        <span className="text-sm font-semibold text-foreground">
          {group.label}
        </span>
        <span className="text-xs text-muted-foreground">
          ({group.tasks.length} {group.tasks.length === 1 ? 'task' : 'tasks'})
        </span>
      </CollapsibleTrigger>

      <CollapsibleContent>
        {/* Desktop Table */}
        <div className="hidden lg:block divide-y divide-border/50">
          {group.tasks.map((task) => (
            <DesktopRow key={task.id || task._id} task={task} />
          ))}
        </div>

        {/* Mobile Cards */}
        <div className="lg:hidden space-y-1 px-1">
          {group.tasks.map((task) => (
            <MobileRow key={task.id || task._id} task={task} />
          ))}
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}

function DesktopRow({ task }) {
  return (
    <div className="grid grid-cols-12 gap-2 items-center px-4 sm:px-6 py-3 hover:bg-muted/40 transition-colors">
      {/* Priority */}
      <div className="col-span-1 flex justify-center">
        <span
          className={`inline-flex items-center justify-center w-10 h-8 rounded-md text-lg font-extrabold border-2 shrink-0 ${getPriorityColor(
            task.priority
          )}`}
        >
          {task.priority}
        </span>
      </div>

      {/* Title + Work Type */}
      <div className="col-span-5 flex items-center gap-2 min-w-0">
        <span className="text-sm text-foreground line-through opacity-80 truncate">
          {task.title}
        </span>
        <WorkTypeBadge workType={task.workType} />
      </div>

      {/* Estimated Time */}
      <div className="col-span-2 flex justify-end">
        <div className="flex items-center text-xs text-muted-foreground">
          <Clock className="h-3 w-3 mr-1" />
          <span className="font-semibold">{formatTime(task.estimatedTime)}</span>
        </div>
      </div>

      {/* Actual Time */}
      <div className="col-span-2 flex justify-end">
        {task.actualTime != null ? (
          <div className="flex items-center text-xs text-green-600 dark:text-green-400">
            <CheckCircle className="h-3 w-3 mr-1" />
            <span className="font-medium">{formatTime(task.actualTime)}</span>
          </div>
        ) : (
          <span className="text-xs text-muted-foreground">—</span>
        )}
      </div>

      {/* Distraction */}
      <div className="col-span-2 flex justify-end">
        {task.distractionLevel != null && task.distractionLevel >= 1 && task.distractionLevel <= 5 ? (
          <span className={`text-sm font-bold ${getDistractionColor(task.distractionLevel)}`}>
            {task.distractionLevel}/5
          </span>
        ) : (
          <span className="text-xs text-muted-foreground">—</span>
        )}
      </div>
    </div>
  );
}

function MobileRow({ task }) {
  return (
    <div className="px-3 py-2.5 rounded-md hover:bg-muted/40 transition-colors">
      <div className="flex items-center gap-2">
        {/* Priority */}
        <span
          className={`inline-flex items-center justify-center w-7 h-7 rounded-md text-sm font-extrabold border-2 shrink-0 ${getPriorityColor(
            task.priority
          )}`}
        >
          {task.priority}
        </span>

        {/* Title */}
        <span className="text-sm text-foreground line-through opacity-80 truncate flex-1 min-w-0">
          {task.title}
        </span>

        {/* Work Type */}
        <WorkTypeBadge workType={task.workType} />
      </div>

      {/* Details row */}
      <div className="flex items-center gap-3 mt-1.5 ml-9 text-xs">
        {/* Est Time */}
        <div className="flex items-center text-muted-foreground">
          <Clock className="h-3 w-3 mr-1" />
          <span>{formatTime(task.estimatedTime)}</span>
        </div>

        {/* Actual Time */}
        {task.actualTime != null && (
          <div className="flex items-center text-green-600 dark:text-green-400">
            <CheckCircle className="h-3 w-3 mr-1" />
            <span>{formatTime(task.actualTime)}</span>
          </div>
        )}

        {/* Distraction */}
        {task.distractionLevel != null && task.distractionLevel >= 1 && (
          <span className={`font-bold ${getDistractionColor(task.distractionLevel)}`}>
            {task.distractionLevel}/5
          </span>
        )}
      </div>
    </div>
  );
}
