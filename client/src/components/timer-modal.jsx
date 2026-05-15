import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Clock, Check, X } from "lucide-react";

/**
 * Inline completion panel — renders as an expandable section
 * beneath the task row, like subtasks do.
 */
export function InlineCompletionPanel({ task, onConfirm, onCancel }) {
  const [actualTime, setActualTime] = useState(task?.estimatedTime || 30);
  const [distractionLevel, setDistractionLevel] = useState(1);
  const [timeInteracted, setTimeInteracted] = useState(false);

  useEffect(() => {
    if (task) {
      setActualTime(task.estimatedTime || 30);
      setDistractionLevel(1);
      setTimeInteracted(false);
    }
  }, [task]);

  const handleConfirm = () => {
    const time = timeInteracted ? actualTime : (task?.estimatedTime || actualTime);
    onConfirm(task, time, distractionLevel);
  };

  const formatTimeMinutes = (minutes) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
  };

  const getDistractionColor = (level) => {
    const colors = ['text-green-600', 'text-green-500', 'text-yellow-500', 'text-orange-500', 'text-red-500'];
    return colors[level - 1];
  };

  const getDistractionLabel = (level) => {
    const labels = ['Focused', 'Slight', 'Moderate', 'High', 'Full'];
    return labels[level - 1];
  };

  const hasEstimate = task?.estimatedTime != null && task.estimatedTime > 0;

  return (
    <div className="ml-4 lg:ml-12 mt-2 pl-3 border-l-2 border-blue-300 dark:border-blue-600 bg-blue-50/50 dark:bg-blue-900/10 rounded-r-lg py-3 pr-3 animate-in slide-in-from-top-1 duration-200">
      <div className="flex flex-col sm:flex-row sm:items-end gap-3">
        {/* Actual Time */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs font-medium text-gray-600 dark:text-gray-400 flex items-center gap-1">
              <Clock className="h-3 w-3" />
              Actual Time
            </span>
            <span className={`text-sm font-bold ${timeInteracted ? 'text-gray-900 dark:text-white' : 'text-gray-400 dark:text-gray-500'}`}>
              {formatTimeMinutes(actualTime)}
            </span>
          </div>
          {hasEstimate && (
            <p className="text-[10px] text-gray-400 dark:text-gray-500 mb-0.5">
              Estimated: {formatTimeMinutes(task.estimatedTime)}
            </p>
          )}
          <input
            type="range"
            min="5"
            max="240"
            step="5"
            value={actualTime}
            onChange={(e) => {
              setActualTime(parseInt(e.target.value));
              setTimeInteracted(true);
            }}
            onMouseDown={(e) => e.stopPropagation()}
            onPointerDown={(e) => e.stopPropagation()}
            className={`slider w-full ${!timeInteracted ? 'opacity-40' : ''}`}
          />
          <div className="flex justify-between text-[10px] text-gray-400 mt-0.5">
            <span>5m</span>
            <span>4h</span>
          </div>
        </div>

        {/* Distraction */}
        <div className="sm:w-48 shrink-0">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-xs font-medium text-gray-600 dark:text-gray-400">Distraction</span>
            <span className={`text-xs font-medium ${getDistractionColor(distractionLevel)}`}>
              {getDistractionLabel(distractionLevel)}
            </span>
          </div>
          <div className="flex gap-1">
            {[1, 2, 3, 4, 5].map((level) => (
              <button
                key={level}
                type="button"
                onClick={() => setDistractionLevel(level)}
                className={`flex-1 py-1.5 text-xs font-medium rounded-md border transition-all ${
                  distractionLevel === level
                    ? 'bg-gray-900 dark:bg-white text-white dark:text-gray-900 border-gray-900 dark:border-white'
                    : 'bg-white dark:bg-gray-800 text-gray-500 dark:text-gray-400 border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                }`}
              >
                {level}
              </button>
            ))}
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-1.5 shrink-0 sm:pb-0.5">
          <Button
            size="sm"
            variant="outline"
            onClick={onCancel}
            className="h-8 px-2.5 text-xs"
          >
            <X className="h-3 w-3 mr-1" />
            Cancel
          </Button>
          <Button
            size="sm"
            onClick={handleConfirm}
            className="h-8 px-3 text-xs bg-gray-900 dark:bg-white text-white dark:text-gray-900 hover:bg-gray-800 dark:hover:bg-gray-200"
          >
            <Check className="h-3 w-3 mr-1" />
            Done
          </Button>
        </div>
      </div>
    </div>
  );
}

// Keep default export for backward compatibility
export default function TimerModal() {
  return null;
}
