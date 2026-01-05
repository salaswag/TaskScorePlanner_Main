import * as React from 'react';
const { useEffect } = React;
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Play, Pause, Square, Clock } from 'lucide-react';
import { useGlobalStopwatch } from '@/hooks/use-global-stopwatch';

export function TaskStopwatch({ activeTask, isRunning, onStart, onPause, onStop, elapsedTime }) {
  const { time: globalTime, isActive: globalIsActive, toggle, reset, adjust } = useGlobalStopwatch();

  const formatTime = (seconds) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <Card className="w-full">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg flex items-center gap-2">
          <Clock className="h-5 w-5" />
          {activeTask?.title || "Stopwatch"}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col items-center gap-4 py-4">
          <div className="text-4xl font-mono font-bold">{formatTime(globalTime)}</div>
          <div className="flex items-center gap-2">
            <Button onClick={toggle} variant={globalIsActive ? "outline" : "default"}>
              {globalIsActive ? <Pause className="mr-2 h-4 w-4" /> : <Play className="mr-2 h-4 w-4" />}
              {globalIsActive ? "Pause" : "Start"}
            </Button>
            <Button onClick={reset} variant="ghost">
              <Square className="mr-2 h-4 w-4" />
              Reset
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
