import * as React from "react";
const { useState, useEffect } = React;
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Play, Pause, RotateCcw, Clock } from "lucide-react";
import { useKeyboardAware } from "@/hooks/use-keyboard-aware";
import { useInputFocus } from "@/hooks/use-input-focus";

function TaskForm({ onSubmit, isLoading }) {
  const [title, setTitle] = useState("");
  const [priority, setPriority] = useState(5);
  const [estimatedTime, setEstimatedTime] = useState(30);
  
  // Stopwatch state
  const [time, setTime] = useState(0);
  const [isActive, setIsActive] = useState(false);
  
  const { isKeyboardVisible, viewportHeight, keyboardHeight } = useKeyboardAware();
  const { handleInputFocus, handleInputBlur, focusNextInput } = useInputFocus();

  useEffect(() => {
    let interval = null;
    if (isActive) {
      interval = setInterval(() => {
        setTime((prevTime) => {
          const newTime = prevTime + 1;
          // 16 hours = 16 * 3600 = 57600 seconds
          if (newTime >= 57600) {
            setIsActive(false);
            return 0;
          }
          return newTime;
        });
      }, 1000);
    } else {
      clearInterval(interval);
    }
    return () => clearInterval(interval);
  }, [isActive]);

  const toggleStopwatch = () => {
    setIsActive(!isActive);
  };

  const resetStopwatch = () => {
    setTime(0);
    setIsActive(false);
  };

  const adjustTime = (seconds) => {
    setTime((prevTime) => Math.max(0, prevTime + seconds));
  };

  const formatStopwatchTime = (seconds) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

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
    <div 
      className="w-full flex flex-col lg:flex-row items-stretch lg:items-center gap-4 transition-all duration-300 ease-in-out"
      style={{
        transform: isKeyboardVisible ? 'translateY(-10px)' : 'translateY(0)',
        marginBottom: isKeyboardVisible ? '10px' : '0',
        minHeight: 'auto'
      }}
    >
      <form 
        onSubmit={handleSubmit} 
        className={`w-full lg:w-[70%] max-w-4xl bg-white dark:bg-black shadow-lg border border-gray-200 dark:border-gray-800 rounded-lg p-3 transition-all duration-300 ${
          isKeyboardVisible ? 'shadow-xl border-blue-300 dark:border-blue-600' : ''
        }`}
      >
          {/* Desktop: All Elements in One Line, Mobile: Stacked Layout */}
          <div className="flex flex-col lg:flex-row lg:items-center gap-4 w-full">
            {/* Task Input - Full width on mobile, flexible on desktop */}
            <Input
              type="text"
              placeholder="Add new task..."
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              onFocus={handleInputFocus}
              onBlur={handleInputBlur}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && title.trim()) {
                  handleSubmit(e);
                } else if (e.key === 'Tab') {
                  e.preventDefault();
                  focusNextInput();
                }
              }}
              className="w-full lg:flex-1 px-4 py-4 h-12 bg-white dark:bg-gray-900 text-black dark:text-white border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-black dark:focus:ring-white focus:border-transparent transition-all duration-200 hover:border-gray-400 dark:hover:border-gray-600 hover:shadow-md"
            />

            {/* Mobile: Priority and Time in same row, Desktop: Separate */}
            <div className="flex flex-col sm:flex-row lg:flex-row gap-4 lg:gap-4 w-full lg:w-auto">
              {/* Priority Slider */}
              <div className="flex items-center gap-2 lg:min-w-[180px] p-2 rounded-lg transition-all duration-200 hover:bg-gray-50 dark:hover:bg-gray-800/50">
                <label className="text-sm font-medium text-black dark:text-white whitespace-nowrap">
                  Priority: {priority}
                </label>
                <input
                  type="range"
                  min="1"
                  max="10"
                  value={priority}
                  onChange={(e) => setPriority(parseInt(e.target.value))}
                  onFocus={handleInputFocus}
                  onBlur={handleInputBlur}
                  onKeyDown={(e) => {
                    if (e.key === 'Tab') {
                      e.preventDefault();
                      focusNextInput();
                    }
                  }}
                  className="slider flex-1 lg:w-20"
                />
              </div>

              {/* Time Slider */}
              <div className="flex items-center gap-2 lg:min-w-[250px] p-2 rounded-lg transition-all duration-200 hover:bg-gray-50 dark:hover:bg-gray-800/50">
                <label className="text-sm font-medium text-black dark:text-white whitespace-nowrap">
                  Time: {formatTime(estimatedTime)}
                </label>
                <input
                  type="range"
                  min="5"
                  max="180"
                  step="5"
                  value={estimatedTime}
                  onChange={(e) => setEstimatedTime(parseInt(e.target.value))}
                  onFocus={handleInputFocus}
                  onBlur={handleInputBlur}
                  className="slider flex-1 lg:w-32"
                />
              </div>
            </div>

            {/* Add Button - Full width on mobile, auto width on desktop */}
            <Button
              type="submit"
              disabled={!title.trim() || isLoading}
              className="w-full lg:w-auto bg-black dark:bg-white text-white dark:text-black px-4 py-3 h-12 rounded-lg font-medium hover:bg-gray-800 dark:hover:bg-gray-200 hover:shadow-lg transition-all duration-200 flex items-center justify-center space-x-2 whitespace-nowrap transform hover:scale-105"
            >
              <Plus className="h-4 w-4" />
              <span>{isLoading ? 'Adding...' : 'Add'}</span>
            </Button>
          </div>
        </form>

        {/* Stopwatch - Only on desktop right side */}
        <div className="hidden lg:flex flex-1 items-center justify-between gap-3 bg-white dark:bg-black shadow-lg border border-gray-200 dark:border-gray-800 rounded-lg p-3 h-12 self-start mt-0">
          <div className="flex items-center gap-2 px-2 border-r border-gray-200 dark:border-gray-800">
            <Clock className="h-5 w-5 text-gray-500" />
            <span className="font-mono font-bold text-xl min-w-[90px] text-black dark:text-white">
              {formatStopwatchTime(time)}
            </span>
          </div>
          <div className="flex items-center gap-1">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => adjustTime(-900)}
              title="-15m"
              className="h-8 px-2 text-xs text-gray-500 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 transition-colors"
            >
              -15m
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => adjustTime(900)}
              title="+15m"
              className="h-8 px-2 text-xs text-gray-500 hover:text-green-500 hover:bg-green-50 dark:hover:bg-green-950/20 transition-colors"
            >
              +15m
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => adjustTime(-3600)}
              title="-1h"
              className="h-8 px-2 text-xs text-gray-500 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 transition-colors"
            >
              -1h
            </Button>
            <div className="w-px h-6 bg-gray-200 dark:bg-gray-800 mx-1" />
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={toggleStopwatch}
              className="h-9 w-9 p-0 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            >
              {isActive ? (
                <Pause className="h-5 w-5 text-orange-500 fill-orange-500/20" />
              ) : (
                <Play className="h-5 w-5 text-green-600 fill-green-600/20" />
              )}
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={resetStopwatch}
              className="h-9 w-9 p-0 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            >
              <RotateCcw className="h-5 w-5 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300" />
            </Button>
          </div>
        </div>
    </div>
  );
}

export default TaskForm;