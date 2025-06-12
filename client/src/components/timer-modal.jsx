
<old_str>import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Clock, CheckCircle } from "lucide-react";

export default function TimerModal({ isOpen, task, onClose, onConfirm }) {
  const [actualTime, setActualTime] = useState(30);
  const [isRunning, setIsRunning] = useState(false);
  const [elapsedTime, setElapsedTime] = useState(0);

  useEffect(() => {
    let interval = null;
    if (isRunning) {
      interval = setInterval(() => {
        setElapsedTime(prevTime => prevTime + 1);
      }, 1000);
    } else if (!isRunning && elapsedTime !== 0) {
      clearInterval(interval);
    }
    return () => clearInterval(interval);
  }, [isRunning, elapsedTime]);

  const handleStart = () => {
    setIsRunning(true);
    setElapsedTime(0);
  };

  const handleStop = () => {
    setIsRunning(false);
    setActualTime(Math.floor(elapsedTime / 60));
  };

  const handleConfirm = () => {
    const timeInMinutes = elapsedTime > 0 ? Math.floor(elapsedTime / 60) : actualTime;
    if (timeInMinutes > 0) {
      onConfirm(timeInMinutes);
      setActualTime(30);
      setElapsedTime(0);
      setIsRunning(false);
    }
  };

  const handleClose = () => {
    setActualTime(30);
    setElapsedTime(0);
    setIsRunning(false);
    onClose();
  };

  const formatTime = (seconds) => {
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const formatTimeMinutes = (minutes) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
  };

  if (!isOpen || !task) return null;

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <CheckCircle className="h-5 w-5 text-green-600" />
            <span>Complete Task</span>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 p-4">
          <div className="text-center">
            <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
              {task.title}
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Estimated: {formatTimeMinutes(task.estimatedTime)}
            </p>
          </div>

          {/* Timer Section */}
          <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 text-center">
            <div className="text-2xl font-mono font-bold text-gray-900 dark:text-gray-100 mb-4">
              {formatTime(elapsedTime)}
            </div>
            <div className="flex justify-center space-x-2">
              <Button
                onClick={handleStart}
                disabled={isRunning}
                variant="outline"
                size="sm"
              >
                Start Timer
              </Button>
              <Button
                onClick={handleStop}
                disabled={!isRunning}
                variant="outline"
                size="sm"
              >
                Stop Timer
              </Button>
            </div>
          </div>

          {/* Time Slider */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
              Actual time spent: {formatTimeMinutes(actualTime)}
            </label>
            <div className="relative">
              <input
                type="range"
                min="5"
                max="240"
                step="5"
                value={actualTime}
                onChange={(e) => setActualTime(parseInt(e.target.value))}
                className="slider w-full"
              />
              <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mt-1">
                <span>5m</span>
                <span>4h</span>
              </div>
            </div>
          </div>

          <div className="flex space-x-3">
            <Button onClick={handleClose} variant="outline" className="flex-1">
              Cancel
            </Button>
            <Button 
              onClick={handleConfirm} 
              className="flex-1"
            >
              Complete Task
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}</old_str>
<new_str>import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { CheckCircle } from "lucide-react";

export default function TimerModal({ isOpen, task, onClose, onConfirm }) {
  const [actualTime, setActualTime] = useState(30);
  const [distractionLevel, setDistractionLevel] = useState(1);

  const handleConfirm = () => {
    if (actualTime > 0) {
      onConfirm(actualTime, distractionLevel);
      setActualTime(30);
      setDistractionLevel(1);
    }
  };

  const handleClose = () => {
    setActualTime(30);
    setDistractionLevel(1);
    onClose();
  };

  const formatTimeMinutes = (minutes) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
  };

  const getDistractionColor = (level) => {
    const colors = [
      'text-green-600', // 1 - Not distracted
      'text-green-500', // 2
      'text-yellow-500', // 3 - Moderately distracted
      'text-orange-500', // 4
      'text-red-500'    // 5 - Fully distracted
    ];
    return colors[level - 1];
  };

  const getDistractionLabel = (level) => {
    const labels = [
      'Not distracted',
      'Slightly distracted',
      'Moderately distracted',
      'Very distracted',
      'Fully distracted'
    ];
    return labels[level - 1];
  };

  if (!isOpen || !task) return null;

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <CheckCircle className="h-5 w-5 text-green-600" />
            <span>Complete Task</span>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 p-4">
          <div className="text-center">
            <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
              {task.title}
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Estimated: {formatTimeMinutes(task.estimatedTime)}
            </p>
          </div>

          {/* Actual Time Slider */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
              Actual time spent: {formatTimeMinutes(actualTime)}
            </label>
            <div className="relative">
              <input
                type="range"
                min="5"
                max="240"
                step="5"
                value={actualTime}
                onChange={(e) => setActualTime(parseInt(e.target.value))}
                className="slider w-full"
              />
              <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mt-1">
                <span>5m</span>
                <span>4h</span>
              </div>
            </div>
          </div>

          {/* Distraction Level Slider */}
          <div>
            <label className={`block text-sm font-medium mb-3 ${getDistractionColor(distractionLevel)}`}>
              Distraction level: {distractionLevel} - {getDistractionLabel(distractionLevel)}
            </label>
            <div className="relative">
              <input
                type="range"
                min="1"
                max="5"
                step="1"
                value={distractionLevel}
                onChange={(e) => setDistractionLevel(parseInt(e.target.value))}
                className="slider w-full"
              />
              <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mt-1">
                <span className="text-green-600">Focused</span>
                <span className="text-red-500">Distracted</span>
              </div>
            </div>
          </div>

          <div className="flex space-x-3">
            <Button onClick={handleClose} variant="outline" className="flex-1">
              Cancel
            </Button>
            <Button 
              onClick={handleConfirm} 
              className="flex-1"
            >
              Complete Task
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}</new_str>
