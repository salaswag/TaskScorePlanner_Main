import React, { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Clock, Edit, Trash2, ArrowUp, GripVertical, CheckCircle, Archive, MoreHorizontal, ChevronDown, ChevronRight, ListPlus } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { WorkTypeBadge, SubtaskProgress, SubtaskSection } from "./task-table";
import { InlineCompletionPanel } from "./timer-modal";

function LaterSection({ tasks, onMoveToMain, onDeleteTask, onEditTask, onUpdateTask, onMoveToLater, onCompleteTask, onUndoCompletion, onArchiveTask }) {
  const [expandedTasks, setExpandedTasks] = useState(new Set());
  const [expandedSubtasks, setExpandedSubtasks] = useState(new Set());
  const [completingTaskId, setCompletingTaskId] = useState(null);

  const toggleExpanded = (taskId) => {
    const newExpanded = new Set(expandedTasks);
    if (newExpanded.has(taskId)) {
      newExpanded.delete(taskId);
    } else {
      newExpanded.add(taskId);
    }
    setExpandedTasks(newExpanded);
  };

  const toggleSubtasks = (taskId) => {
    const newExpanded = new Set(expandedSubtasks);
    if (newExpanded.has(taskId)) {
      newExpanded.delete(taskId);
    } else {
      newExpanded.add(taskId);
    }
    setExpandedSubtasks(newExpanded);
  };

  const formatTime = (minutes) => {
    if (!minutes) return "-";
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
  };

  const getPriorityColor = (priority, isCompleted = false) => {
    if (isCompleted) {
      if (priority >= 8) return "bg-red-200 text-red-900";
      if (priority >= 5) return "bg-yellow-200 text-yellow-900";
      return "bg-green-200 text-green-900";
    }
    if (priority >= 8) return "bg-red-100 text-red-800";
    if (priority >= 5) return "bg-yellow-100 text-yellow-800";
    return "bg-green-100 text-green-800";
  };

  const getDistractionColor = (level) => {
    if (!level) return '';
    const colors = [
      'text-green-600', // 1
      'text-green-500', // 2
      'text-yellow-500', // 3
      'text-orange-500', // 4
      'text-red-500'    // 5
    ];
    return colors[level - 1];
  };

  const getDistractionBackgroundColor = (level) => {
    if (!level) return '';
    const colors = [
      'bg-green-50 dark:bg-green-900/20', // 1
      'bg-green-50 dark:bg-green-900/20', // 2
      'bg-yellow-50 dark:bg-yellow-900/20', // 3
      'bg-orange-50 dark:bg-orange-900/20', // 4
      'bg-red-50 dark:bg-red-900/20'    // 5
    ];
    return colors[level - 1];
  };

  // Sort tasks: incomplete first (by priority desc), then completed at the bottom (by completion time desc)
  const sortedTasks = [...tasks].sort((a, b) => {
    if (a.completed && !b.completed) return 1;
    if (!a.completed && b.completed) return -1;

    if (a.completed && b.completed) {
      if (a.completedAt && b.completedAt) {
        return new Date(b.completedAt).getTime() - new Date(a.completedAt).getTime();
      }
    }

    if (!a.completed && !b.completed) {
      return (b.priority || 0) - (a.priority || 0);
    }

    return 0;
  });

  return (
    <Card
      className="bg-gray-50/50 dark:bg-gray-900/50 shadow-sm border border-gray-200 dark:border-gray-700 border-dashed overflow-hidden mt-4 transition-colors"
      onDragOver={(e) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
        e.currentTarget.classList.add('border-blue-400', 'bg-blue-50/50', 'dark:bg-blue-900/20');
      }}
      onDragLeave={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget)) {
          e.currentTarget.classList.remove('border-blue-400', 'bg-blue-50/50', 'dark:bg-blue-900/20');
        }
      }}
      onDrop={(e) => {
        e.preventDefault();
        e.currentTarget.classList.remove('border-blue-400', 'bg-blue-50/50', 'dark:bg-blue-900/20');

        try {
          const taskData = JSON.parse(e.dataTransfer.getData('text/plain'));
          console.log('Dropped task data:', taskData);
          if (taskData && taskData.id && !taskData.completed) {
            onMoveToLater && onMoveToLater(taskData);
          }
        } catch (error) {
          console.error('Error parsing dropped task data:', error);
        }
      }}
    >
      <div className="px-3 sm:px-4 py-1.5 border-b border-gray-200 dark:border-gray-700 border-dashed">
        <h3 className="text-xs font-medium text-gray-500 dark:text-gray-400">Later (Not counted in score)</h3>
      </div>

      {/* Table Header - Only visible on larger screens */}
      <div className="hidden lg:block px-6 py-3 bg-gray-100/50 dark:bg-gray-800/50 border-b border-gray-200 dark:border-gray-700 border-dashed">
        <div className="grid grid-cols-12 gap-1 text-sm font-medium text-gray-700 dark:text-gray-300">
          <div className="col-span-1 text-center"></div>
          <div className="col-span-1 text-center">Done</div>
          <div className="col-span-1 text-center"></div>
          <div className="col-span-1 text-center">Priority</div>
          <div className="col-span-4 text-left">Task</div>
          <div className="col-span-1 text-right">Est Time</div>
          <div className="col-span-1 text-right">Actual Time</div>
          <div className="col-span-1 text-right">Distracted</div>
          <div className="col-span-1 text-right">Actions</div>
        </div>
      </div>

      {/* Task Rows */}
      <div className="divide-y divide-gray-200 dark:divide-gray-700 divide-dashed">
        {sortedTasks.length === 0 ? (
          <div className="px-4 sm:px-6 py-8 text-center text-gray-400 dark:text-gray-500">
            <p className="text-sm">Drag incomplete tasks here for later</p>
            <p className="text-xs mt-1 opacity-75">Completed tasks cannot be moved</p>
          </div>
        ) : (
          sortedTasks.map((task) => {
            const isExpanded = expandedTasks.has(task.id);
            const isSubtasksOpen = expandedSubtasks.has(task.id);

            return (
              <div
                key={task.id}
                className={`px-4 sm:px-6 py-3 sm:py-4 hover:bg-gray-100/50 dark:hover:bg-gray-800/50 transition-colors group ${
                  task.completed
                    ? `${getDistractionBackgroundColor(task.distractionLevel) || ''}`
                    : ''
                }`}
              >
                {/* Desktop Layout - Hidden on mobile/tablet */}
                <div className="hidden lg:grid grid-cols-12 gap-1 items-center">
                  <div className="col-span-1 flex items-center justify-center gap-1">
                    <div
                      draggable
                      onDragStart={(e) => {
                        e.dataTransfer.setData("text/plain", JSON.stringify({ ...task, isLater: true }));
                        e.dataTransfer.effectAllowed = "move";
                      }}
                      className="cursor-grab active:cursor-grabbing p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                      title="Drag to move"
                    >
                      <GripVertical className="h-4 w-4 text-gray-400" />
                    </div>
                    {!task.completed && (
                      <button
                        onClick={() => onMoveToMain(task)}
                        className="p-0.5 rounded hover:bg-blue-100 dark:hover:bg-blue-900/30 text-blue-500 hover:text-blue-700 dark:hover:text-blue-300 transition-colors"
                        title="Move to Main"
                      >
                        <ArrowUp className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </div>
                  <div className="col-span-1 flex justify-center">
                    <Checkbox
                      checked={task.completed}
                      onCheckedChange={() => task.completed ? onUndoCompletion(task) : setCompletingTaskId(task.id)}
                      className="cursor-pointer w-6 h-6"
                    />
                  </div>
                  <div className="col-span-1 flex justify-center">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => toggleSubtasks(task.id)}
                      className={`text-gray-400 dark:text-gray-500 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-gray-50 dark:hover:bg-gray-800 px-2 py-1 h-7 ${
                        isSubtasksOpen ? 'text-blue-500 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20' : ''
                      }`}
                      title="Subtasks"
                    >
                      <ListPlus className="h-4 w-4" />
                    </Button>
                  </div>
                  <div className="col-span-1 flex justify-center">
                    <span
                      className={`inline-flex items-center justify-center w-10 h-8 rounded-md text-lg font-extrabold border-2 flex-shrink-0 ${getPriorityColor(
                      task.priority,
                      task.completed,
                    )}`}
                    >
                      {task.priority}
                    </span>
                  </div>
                  <div className="col-span-4 flex items-center gap-2 flex-wrap">
                    <span className={`font-medium text-lg leading-relaxed ${
                      task.completed
                        ? 'text-gray-400 dark:text-gray-500 line-through'
                        : 'text-gray-900 dark:text-gray-100'
                    }`} title={task.title}>
                      {task.title}
                    </span>
                    <WorkTypeBadge workType={task.workType} />
                    <SubtaskProgress subtasks={task.subtasks} />
                  </div>
                  <div className="col-span-1 flex justify-end">
                    <div className="flex items-center text-xs text-gray-600 dark:text-gray-400">
                      <Clock className="h-3 w-3 mr-1" />
                      <span className="font-semibold">{formatTime(task.estimatedTime)}</span>
                    </div>
                  </div>
                  <div className="col-span-1 flex justify-end">
                    {task.completed && task.actualTime !== null && task.actualTime !== undefined ? (
                      <div className="flex items-center text-xs text-green-600 dark:text-green-400">
                        <CheckCircle className="h-3 w-3 mr-1" />
                        <span className="font-medium">{formatTime(task.actualTime)}</span>
                      </div>
                    ) : (
                      <span className="text-xs text-gray-500 dark:text-gray-400">-</span>
                    )}
                  </div>
                  <div className="col-span-1 flex justify-end">
                    {task.completed && task.distractionLevel !== null && task.distractionLevel !== undefined && task.distractionLevel >= 1 && task.distractionLevel <= 5 ? (
                      <span className={`text-xs font-bold ${getDistractionColor(task.distractionLevel)}`}>
                        {task.distractionLevel}
                      </span>
                    ) : (
                      <span className="text-xs text-gray-400 dark:text-gray-500">-</span>
                    )}
                  </div>
                  <div className="col-span-1 flex justify-end gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onEditTask && onEditTask(task)}
                      className="text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 px-1.5 py-1 h-7"
                      title="Edit"
                    >
                      <Edit className="h-3.5 w-3.5" />
                    </Button>
                    {task.completed ? (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onArchiveTask && onArchiveTask(task)}
                        className="text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 px-1.5 py-1 h-7"
                        title="Archive"
                      >
                        <Archive className="h-3.5 w-3.5" />
                      </Button>
                    ) : (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onDeleteTask(task)}
                        className="text-red-400 dark:text-red-500 hover:text-red-600 dark:hover:text-red-300 hover:bg-red-50 dark:hover:bg-red-900/20 px-1.5 py-1 h-7"
                        title="Delete"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    )}
                  </div>
                </div>

                {/* Mobile/Tablet Layout */}
                <div className="lg:hidden">
                  <div className="flex items-center gap-3">
                    {/* Checkbox */}
                    <Checkbox
                      checked={task.completed}
                      onCheckedChange={() => task.completed ? onUndoCompletion(task) : setCompletingTaskId(task.id)}
                      className="cursor-pointer flex-shrink-0 h-5 w-5"
                    />

                    {/* Priority */}
                    <span
                      className={`inline-flex items-center justify-center w-6 h-6 sm:w-7 sm:h-7 rounded-md text-lg sm:text-lg font-extrabold border-2 flex-shrink-0 ${getPriorityColor(
                      task.priority,
                      task.completed,
                    )}`}
                    >
                      {task.priority}
                    </span>

                    {/* Task Title and Details */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex flex-wrap items-center gap-1.5 min-w-0">
                          <span className={`font-medium text-base sm:text-lg leading-relaxed break-words ${
                            task.completed
                              ? 'text-gray-400 dark:text-gray-500 line-through'
                              : 'text-gray-900 dark:text-gray-100'
                          }`}>
                            {task.title}
                          </span>
                          <WorkTypeBadge workType={task.workType} />
                          <SubtaskProgress subtasks={task.subtasks} />
                        </div>

                        {/* Time and Actions Row */}
                        <div className="flex items-center gap-2 ml-2 flex-shrink-0">
                          {/* Estimated Time */}
                          <div className="flex items-center text-xs text-gray-600 dark:text-gray-400">
                            <Clock className="h-3 w-3 mr-1" />
                            <span className="font-semibold">{formatTime(task.estimatedTime)}</span>
                          </div>

                          {/* Expand Details Button (for completed tasks) */}
                          {task.completed && (task.actualTime !== null || task.distractionLevel !== null) && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => toggleExpanded(task.id)}
                              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 px-1 py-1 h-6"
                              title="Show Details"
                            >
                              {isExpanded ? (
                                <ChevronDown className="h-3 w-3" />
                              ) : (
                                <ChevronRight className="h-3 w-3" />
                              )}
                            </Button>
                          )}

                          {/* Actions Menu */}
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 px-1 py-1 h-6"
                              >
                                <MoreHorizontal className="h-3 w-3" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              {!task.completed && (
                                <DropdownMenuItem onClick={() => onMoveToMain(task)}>
                                  Move to Main
                                </DropdownMenuItem>
                              )}
                              <DropdownMenuItem onClick={() => toggleSubtasks(task.id)}>
                                <ListPlus className="h-4 w-4 mr-2" />
                                Subtasks
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => onEditTask && onEditTask(task)}>
                                <Edit className="h-4 w-4 mr-2" />
                                Edit
                              </DropdownMenuItem>
                              {task.completed ? (
                                <DropdownMenuItem onClick={() => onArchiveTask && onArchiveTask(task)}>
                                  <Archive className="h-4 w-4 mr-2" />
                                  Archive
                                </DropdownMenuItem>
                              ) : (
                                <DropdownMenuItem
                                  onClick={() => onDeleteTask(task)}
                                  className="text-red-600 focus:text-red-600"
                                >
                                  <Trash2 className="h-4 w-4 mr-2" />
                                  Delete
                                </DropdownMenuItem>
                              )}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Expandable Details for Mobile/Tablet */}
                  {isExpanded && task.completed && (
                    <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-800/50 rounded-md p-3">
                      <div className="grid grid-cols-2 gap-4 text-xs">
                        {task.actualTime !== null && task.actualTime !== undefined && (
                          <div className="flex items-center justify-center bg-green-50 dark:bg-green-900/20 rounded-md p-2">
                            <CheckCircle className="h-3 w-3 mr-2 text-green-600 dark:text-green-400" />
                            <span className="font-medium text-green-600 dark:text-green-400">
                              Actual: {formatTime(task.actualTime)}
                            </span>
                          </div>
                        )}
                        {task.distractionLevel !== null && task.distractionLevel !== undefined && task.distractionLevel >= 1 && task.distractionLevel <= 5 && (
                          <div className="flex items-center justify-center bg-gray-50 dark:bg-gray-800 rounded-md p-2">
                            <span className="text-gray-600 dark:text-gray-400 mr-2">Distraction:</span>
                            <span className={`font-bold ${getDistractionColor(task.distractionLevel)}`}>
                              {task.distractionLevel}/5
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {/* Inline Completion Panel */}
                {completingTaskId === task.id && !task.completed && (
                  <InlineCompletionPanel
                    task={task}
                    onConfirm={(t, actualTime, distractionLevel) => {
                      onCompleteTask(t, actualTime, distractionLevel);
                      setCompletingTaskId(null);
                    }}
                    onCancel={() => setCompletingTaskId(null)}
                  />
                )}

                {/* Subtasks Section */}
                {isSubtasksOpen && (
                  <SubtaskSection task={task} onUpdateTask={onUpdateTask} />
                )}
              </div>
            );
          })
        )}
      </div>
    </Card>
  );
}

export default LaterSection;
