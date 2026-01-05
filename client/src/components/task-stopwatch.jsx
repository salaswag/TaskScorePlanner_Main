import * as React from 'react';
const { useState, useEffect, useCallback } = React;
import { Button } from '@/components/ui/button';
import { Play, Pause, Square, Clock, Plus, Minus } from 'lucide-react';

export function TaskStopwatch() {
  const [isRunning, setIsRunning] = useState(false);
  const [elapsedTime, setElapsedTime] = useState(() => {
    const saved = localStorage.getItem('stopwatch_time');
    return saved ? parseInt(saved, 10) : 0;
  });

  useEffect(() => {
    localStorage.setItem('stopwatch_time', elapsedTime.toString());
  }, [elapsedTime]);

  useEffect(() => {
    let interval;
    if (isRunning) {
      interval = setInterval(() => {
        setElapsedTime(prev => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isRunning]);

  const formatTime = (seconds) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  };

  const addTime = (minutes) => {
    setElapsedTime(prev => Math.max(0, prev + minutes * 60));
  };

  return (
    <div className="flex items-center gap-2 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 p-2 rounded-lg shadow-sm">
      <div className="flex items-center gap-2 px-3 py-1 bg-gray-50 dark:bg-gray-800 rounded-md border border-gray-100 dark:border-gray-700 min-w-[100px] justify-center">
        <Clock className="h-4 w-4 text-gray-500" />
        <span className="font-mono text-lg font-bold text-black dark:text-white">
          {formatTime(elapsedTime)}
        </span>
      </div>

      <div className="flex items-center gap-1">
        <Button
          size="sm"
          variant="outline"
          onClick={() => setIsRunning(!isRunning)}
          className={`h-9 w-9 p-0 ${isRunning ? 'text-orange-500 border-orange-200 bg-orange-50' : 'text-green-500 border-green-200 bg-green-50'}`}
        >
          {isRunning ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
        </Button>
        
        <Button
          size="sm"
          variant="outline"
          onClick={() => {
            setIsRunning(false);
            setElapsedTime(0);
          }}
          className="h-9 w-9 p-0 text-red-500 border-red-200 bg-red-50"
        >
          <Square className="h-4 w-4" />
        </Button>
      </div>

      <div className="flex items-center gap-1 ml-1 border-l pl-2 dark:border-gray-800">
        <Button
          size="sm"
          variant="ghost"
          onClick={() => addTime(-15)}
          className="h-8 px-2 text-xs font-bold text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 flex items-center gap-1"
          title="Subtract 15 minutes"
        >
          <Minus className="h-3 w-3" /> 15m
        </Button>
        <Button
          size="sm"
          variant="ghost"
          onClick={() => addTime(15)}
          className="h-8 px-2 text-xs font-bold text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 flex items-center gap-1"
          title="Add 15 minutes"
        >
          <Plus className="h-3 w-3" /> 15m
        </Button>
      </div>
    </div>
  );
}