import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus } from "lucide-react";

export default function TaskForm({ onSubmit, isLoading }) {
  const [title, setTitle] = useState("");
  const [priority, setPriority] = useState(5);
  const [estimatedTime, setEstimatedTime] = useState(30);
  const [isLater, setIsLater] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (title.trim() && priority >= 1 && priority <= 10 && estimatedTime > 0) {
      const taskData = {
        title: title.trim(),
        priority: Number(priority),
        estimatedTime: Number(estimatedTime),
        isLater: Boolean(isLater),
        isFocus: false,
      };
      console.log('Submitting task with data:', taskData);
      console.log('isLater flag being sent:', Boolean(isLater));
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
    <Card className="bg-white dark:bg-black shadow-sm border border-gray-200 dark:border-gray-800">
      <CardContent className="p-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Task Destination Toggle */}
          <div>
            <label className="block text-sm font-medium text-black dark:text-white mb-3">
              Add to:
            </label>
            <div className="flex bg-gray-100 dark:bg-gray-800 rounded-lg p-1">
              <button
                type="button"
                onClick={() => setIsLater(false)}
                className={`flex-1 px-4 py-2 text-sm font-medium rounded-md transition-all duration-200 ${
                  !isLater
                    ? 'bg-white dark:bg-gray-700 text-black dark:text-white shadow-sm'
                    : 'text-gray-600 dark:text-gray-400 hover:text-black dark:hover:text-white'
                }`}
              >
                Main Tasks
              </button>
              <button
                type="button"
                onClick={() => setIsLater(true)}
                className={`flex-1 px-4 py-2 text-sm font-medium rounded-md transition-all duration-200 ${
                  isLater
                    ? 'bg-white dark:bg-gray-700 text-black dark:text-white shadow-sm'
                    : 'text-gray-600 dark:text-gray-400 hover:text-black dark:hover:text-white'
                }`}
              >
                Later Tasks
              </button>
            </div>
          </div>

          {/* Task Input */}
          <div>
            <Input
              type="text"
              placeholder={`Add a new ${isLater ? 'later' : 'main'} task...`}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-4 py-3 bg-white dark:bg-gray-900 text-black dark:text-white border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-black dark:focus:ring-white focus:border-transparent transition-all duration-200"
            />
          </div>

          {/* Priority and Time Controls */}
          <div className="space-y-4">
            {/* Priority Slider */}
            <div>
              <label className="block text-sm font-medium text-black dark:text-white mb-2">
                Priority: {priority}
              </label>
              <div className="relative">
                <input
                  type="range"
                  min="1"
                  max="10"
                  value={priority}
                  onChange={(e) => setPriority(parseInt(e.target.value))}
                  className="slider w-full"
                />
                <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mt-1">
                  <span>Low (1)</span>
                  <span>High (10)</span>
                </div>
              </div>
            </div>

            {/* Estimated Time Slider */}
            <div>
              <label className="block text-sm font-medium text-black dark:text-white mb-2">
                Estimated Time: {formatTime(estimatedTime)}
              </label>
              <div className="relative">
                <input
                  type="range"
                  min="5"
                  max="120"
                  step="5"
                  value={estimatedTime}
                  onChange={(e) => setEstimatedTime(parseInt(e.target.value))}
                  className="slider w-full"
                />
                <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mt-1">
                  <span>5m</span>
                  <span>2h</span>
                </div>
              </div>
            </div>
          </div>

          {/* Add Task Button */}
          <Button
            type="submit"
            disabled={!title.trim() || isLoading}
            className="w-full bg-black dark:bg-white text-white dark:text-black py-3 px-6 rounded-lg font-medium hover:bg-gray-800 dark:hover:bg-gray-200 transition-colors duration-200 flex items-center justify-center space-x-2"
          >
            <Plus className="h-4 w-4" />
            <span>{isLoading ? 'Adding...' : `Add to ${isLater ? 'Later' : 'Main'} Tasks`}</span>
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}