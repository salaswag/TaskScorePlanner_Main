import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus } from "lucide-react";

export default function TaskForm({ onSubmit, isLoading }) {
  const [title, setTitle] = useState("");
  const [priority, setPriority] = useState(5);
  const [estimatedTime, setEstimatedTime] = useState(30);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (title.trim()) {
      onSubmit({
        title: title.trim(),
        priority,
        estimatedTime,
      });
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
    <Card className="bg-white shadow-sm border border-gray-200">
      <CardContent className="p-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Task Input */}
          <div>
            <Input
              type="text"
              placeholder="Add a new task..."
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent transition-all duration-200"
            />
          </div>

          {/* Priority and Time Controls */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Priority Slider */}
            <div>
              <label className="block text-sm font-medium text-black mb-3">
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
                <div className="flex justify-between text-xs text-gray-500 mt-1">
                  <span>Low (1)</span>
                  <span>High (10)</span>
                </div>
              </div>
            </div>

            {/* Estimated Time Slider */}
            <div>
              <label className="block text-sm font-medium text-black mb-3">
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
                <div className="flex justify-between text-xs text-gray-500 mt-1">
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
            className="w-full bg-black text-white py-3 px-6 rounded-lg font-medium hover:bg-gray-800 transition-colors duration-200 flex items-center justify-center space-x-2"
          >
            <Plus className="h-4 w-4" />
            <span>{isLoading ? 'Adding...' : 'Add Task'}</span>
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
