import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus } from "lucide-react";

function TaskForm({ onSubmit, isLoading }) {
  const [title, setTitle] = useState("");
  const [priority, setPriority] = useState(5);
  const [estimatedTime, setEstimatedTime] = useState(30);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (title.trim() && priority >= 1 && priority <= 10 && estimatedTime > 0) {
      const taskData = {
        title: title.trim(),
        priority: Number(priority),
        estimatedTime: Number(estimatedTime),
        isFocus: false,
      };
      console.log('Submitting task with data:', taskData);
      onSubmit(taskData);
      setTitle("");
      setPriority(5);
      setEstimatedTime(30);
    }
  };

  const formatTime = (minutes) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
  };

  return (
    <div className="w-full flex justify-center">
      <form onSubmit={handleSubmit} className="w-full max-w-6xl bg-white dark:bg-black shadow-md border border-gray-200 dark:border-gray-800 rounded-lg p-3 lg:p-4">
          {/* Two-line responsive layout */}
          <div className="flex flex-col gap-3">
            {/* First line: Task Input */}
            <div className="w-full">
              <Input
                type="text"
                placeholder="Add new task..."
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full px-4 py-3 h-11 bg-white dark:bg-gray-900 text-black dark:text-white border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-black dark:focus:ring-white focus:border-transparent transition-all duration-200 hover:border-gray-400 dark:hover:border-gray-600"
              />
            </div>

            {/* Second line: Controls */}
            <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4">
              {/* Priority and Time Sliders - Side by side on mobile and up */}
              <div className="flex flex-1 gap-4">
                {/* Priority Slider */}
                <div className="flex items-center gap-2 flex-1 min-w-0 p-2 rounded-lg transition-all duration-200 hover:bg-gray-50 dark:hover:bg-gray-800/50">
                  <label className="text-sm font-medium text-black dark:text-white whitespace-nowrap">
                    Priority: {priority}
                  </label>
                  <input
                    type="range"
                    min="1"
                    max="10"
                    value={priority}
                    onChange={(e) => setPriority(parseInt(e.target.value))}
                    className="slider flex-1 min-w-[60px]"
                  />
                </div>

                {/* Time Slider */}
                <div className="flex items-center gap-2 flex-1 min-w-0 p-2 rounded-lg transition-all duration-200 hover:bg-gray-50 dark:hover:bg-gray-800/50">
                  <label className="text-sm font-medium text-black dark:text-white whitespace-nowrap">
                    Time: {formatTime(estimatedTime)}
                  </label>
                  <input
                    type="range"
                    min="5"
                    max="120"
                    step="5"
                    value={estimatedTime}
                    onChange={(e) => setEstimatedTime(parseInt(e.target.value))}
                    className="slider flex-1 min-w-[60px]"
                  />
                </div>
              </div>

              {/* Add Button */}
              <Button
                type="submit"
                disabled={!title.trim() || isLoading}
                className="w-full sm:w-auto bg-black dark:bg-white text-white dark:text-black px-6 py-2.5 h-10 rounded-lg font-medium hover:bg-gray-800 dark:hover:bg-gray-200 hover:shadow-lg transition-all duration-200 flex items-center justify-center space-x-2 whitespace-nowrap"
              >
                <Plus className="h-4 w-4" />
                <span>{isLoading ? 'Adding...' : 'Add'}</span>
              </Button>
            </div>
          </div>
        </form>
    </div>
  );
}

export default TaskForm;