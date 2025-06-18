
import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Play, Pause, Square, Clock, X } from 'lucide-react';

export default function TaskStopwatch({ task, isOpen, onClose, onTimeUpdate }) {
  const [time, setTime] = useState(0); // time in seconds
  const [isRunning, setIsRunning] = useState(false);
  const intervalRef = useRef(null);

  useEffect(() => {
    if (isRunning) {
      intervalRef.current = setInterval(() => {
        setTime(prevTime => {
          const newTime = prevTime + 1;
          // Update the task's tracked time in real-time
          if (onTimeUpdate) {
            onTimeUpdate(task.id, Math.floor(newTime / 60)); // Convert to minutes
          }
          return newTime;
        });
      }, 1000);
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isRunning, task.id, onTimeUpdate]);

  const formatStopwatchTime = (seconds) => {
    const hours = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    if (hours > 0) {
      return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleStart = () => {
    setIsRunning(true);
  };

  const handlePause = () => {
    setIsRunning(false);
  };

  const handleStop = () => {
    setIsRunning(false);
    setTime(0);
    if (onTimeUpdate) {
      onTimeUpdate(task.id, 0);
    }
  };

  const handleClose = () => {
    setIsRunning(false);
    onClose();
  };

  if (!isOpen || !task) return null;

  return (
    <div className="fixed bottom-4 left-4 z-50">
      <Card className="w-80 shadow-lg border-2">
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center space-x-2">
              <Clock className="h-4 w-4 text-blue-600" />
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Tracking Time
              </span>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleClose}
              className="h-6 w-6 p-0"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
          
          <div className="text-center mb-4">
            <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-2 truncate">
              {task.title}
            </h3>
            <div className="text-3xl font-mono font-bold text-blue-600 dark:text-blue-400">
              {formatStopwatchTime(time)}
            </div>
          </div>

          <div className="flex justify-center space-x-2">
            {!isRunning ? (
              <Button
                onClick={handleStart}
                className="flex items-center space-x-1 bg-green-600 hover:bg-green-700"
              >
                <Play className="h-4 w-4" />
                <span>Start</span>
              </Button>
            ) : (
              <Button
                onClick={handlePause}
                className="flex items-center space-x-1 bg-yellow-600 hover:bg-yellow-700"
              >
                <Pause className="h-4 w-4" />
                <span>Pause</span>
              </Button>
            )}
            
            <Button
              onClick={handleStop}
              variant="outline"
              className="flex items-center space-x-1"
            >
              <Square className="h-4 w-4" />
              <span>Stop</span>
            </Button>
          </div>

          <div className="mt-3 text-xs text-gray-500 dark:text-gray-400 text-center">
            Estimated: {Math.floor((task.estimatedTime || 0) / 60)}h {(task.estimatedTime || 0) % 60}m
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
