import * as React from 'react';
const { useState, useEffect } = React;
import { Button } from '@/components/ui/button';
import { Play, Pause, RotateCcw, Plus, Minus, Clock } from 'lucide-react';
import { Card } from '@/components/ui/card';

export function GlobalStopwatch() {
  const [time, setTime] = useState(0);
  const [isRunning, setIsRunning] = useState(false);

  useEffect(() => {
    let interval;
    if (isRunning) {
      interval = setInterval(() => {
        setTime((prev) => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isRunning]);

  const formatTime = (totalSeconds) => {
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    
    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const adjustTime = (minutes) => {
    setTime((prev) => Math.max(0, prev + minutes * 60));
  };

  const resetTimer = () => {
    if (window.confirm('Are you sure you want to reset the stopwatch?')) {
      setTime(0);
      setIsRunning(false);
    }
  };

  return (
    <Card className="flex items-center gap-2 p-2 bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800 shadow-sm h-12">
      <div className="flex items-center gap-1.5 px-2 border-r border-gray-100 dark:border-gray-800 h-full">
        <Clock className="h-4 w-4 text-gray-500" />
        <span className="text-lg font-mono font-bold tabular-nums min-w-[60px] text-center">
          {formatTime(time)}
        </span>
      </div>
      
      <div className="flex items-center gap-1">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setIsRunning(!isRunning)}
          className={`h-8 w-8 p-0 ${isRunning ? 'text-orange-500 hover:text-orange-600' : 'text-green-500 hover:text-green-600'}`}
        >
          {isRunning ? <Pause className="h-4 w-4 fill-current" /> : <Play className="h-4 w-4 fill-current ml-0.5" />}
        </Button>
        
        <Button
          variant="ghost"
          size="sm"
          onClick={() => adjustTime(-15)}
          className="h-8 px-2 text-xs font-medium text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
          title="-15 minutes"
        >
          -15m
        </Button>
        
        <Button
          variant="ghost"
          size="sm"
          onClick={() => adjustTime(15)}
          className="h-8 px-2 text-xs font-medium text-blue-500 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20"
          title="+15 minutes"
        >
          +15m
        </Button>

        <Button
          variant="ghost"
          size="sm"
          onClick={resetTimer}
          className="h-8 w-8 p-0 text-gray-400 hover:text-gray-600"
          title="Reset"
        >
          <RotateCcw className="h-3.5 w-3.5" />
        </Button>
      </div>
    </Card>
  );
}
