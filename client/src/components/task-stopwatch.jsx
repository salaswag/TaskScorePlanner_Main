import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Play, Pause, Square, Clock } from 'lucide-react';

export function TaskStopwatch({ activeTask, isRunning, onStart, onPause, onStop, elapsedTime }) {
  const [localElapsedTime, setLocalElapsedTime] = useState(elapsedTime || 0);

  useEffect(() => {
    setLocalElapsedTime(elapsedTime || 0);
  }, [elapsedTime]);

  useEffect(() => {
    let interval;
    if (isRunning && activeTask && activeTask.id) {
      interval = setInterval(() => {
        setLocalElapsedTime(prev => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isRunning, activeTask]);

  const formatTime = (seconds) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  };

  if (!activeTask || !activeTask.id) {
    return null;
  }
}