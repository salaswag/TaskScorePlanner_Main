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
    <Card className="bg-white dark:bg-black shadow-lg border border-gray-200 dark:border-gray-800 backdrop-blur-sm bg-white/95 dark:bg-black/95">
      <CardContent className="p-4 h-full flex items-center justify-center">
        <form onSubmit={handleSubmit} className="w-full">
          {/* All Elements in One Line */}
          <div className="flex items-center gap-4 w-full">
            {/* Task Input - Flexible width with increased height */}
            <Input
              type="text"
              placeholder="Add new task..."
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="flex-1 px-4 py-4 h-12 bg-white dark:bg-gray-900 text-black dark:text-white border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-black dark:focus:ring-white focus:border-transparent transition-all duration-200 hover:border-gray-400 dark:hover:border-gray-600 hover:shadow-md"
            />

            {/* Priority Slider - Bigger with descriptive label */}
            <div className="flex items-center gap-2 min-w-[180px] p-2 rounded-lg transition-all duration-200 hover:bg-gray-50 dark:hover:bg-gray-800/50">
              <label className="text-sm font-medium text-black dark:text-white whitespace-nowrap">
                Priority: {priority}
              </label>
              <input
                type="range"
                min="1"
                max="10"
                value={priority}
                onChange={(e) => setPriority(parseInt(e.target.value))}
                className="slider w-20 flex-1"
              />
            </div>

            {/* Time Slider - Bigger with descriptive label */}
            <div className="flex items-center gap-2 min-w-[200px] p-2 rounded-lg transition-all duration-200 hover:bg-gray-50 dark:hover:bg-gray-800/50">
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
                className="slider w-20 flex-1"
              />
            </div>

            {/* Add Button */}
            <Button
              type="submit"
              disabled={!title.trim() || isLoading}
              className="bg-black dark:bg-white text-white dark:text-black px-4 py-3 h-12 rounded-lg font-medium hover:bg-gray-800 dark:hover:bg-gray-200 hover:shadow-lg transition-all duration-200 flex items-center space-x-2 whitespace-nowrap transform hover:scale-105"
            >
              <Plus className="h-4 w-4" />
              <span>{isLoading ? 'Adding...' : 'Add'}</span>
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

export default TaskForm;