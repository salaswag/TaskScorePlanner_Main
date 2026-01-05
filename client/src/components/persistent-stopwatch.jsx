import * as React from "react";
const { useState, useEffect } = React;
import { Button } from "@/components/ui/button";
import { Play, Pause, RotateCcw, Clock } from "lucide-react";

export function PersistentStopwatch() {
  const [time, setTime] = useState(() => {
    const saved = localStorage.getItem("stopwatch_time");
    return saved ? parseInt(saved, 10) : 0;
  });
  const [isActive, setIsActive] = useState(() => {
    const saved = localStorage.getItem("stopwatch_active");
    return saved === "true";
  });
  const [lastTick, setLastTick] = useState(() => {
    const saved = localStorage.getItem("stopwatch_last_tick");
    return saved ? parseInt(saved, 10) : null;
  });

  useEffect(() => {
    localStorage.setItem("stopwatch_time", time.toString());
    localStorage.setItem("stopwatch_active", isActive.toString());
    if (lastTick) {
      localStorage.setItem("stopwatch_last_tick", lastTick.toString());
    } else {
      localStorage.removeItem("stopwatch_last_tick");
    }
  }, [time, isActive, lastTick]);

  useEffect(() => {
    if (isActive && lastTick) {
      const now = Date.now();
      const diff = Math.floor((now - lastTick) / 1000);
      if (diff > 0) {
        setTime(prev => {
          const newTime = prev + diff;
          return newTime >= 57600 ? 0 : newTime;
        });
        setLastTick(now);
      }
    }
  }, []);

  useEffect(() => {
    let interval = null;
    if (isActive) {
      interval = setInterval(() => {
        const now = Date.now();
        setTime((prevTime) => {
          const newTime = prevTime + 1;
          if (newTime >= 57600) {
            setIsActive(false);
            setLastTick(null);
            return 0;
          }
          return newTime;
        });
        setLastTick(now);
      }, 1000);
    } else {
      clearInterval(interval);
    }
    return () => clearInterval(interval);
  }, [isActive]);

  const toggleStopwatch = () => {
    const newIsActive = !isActive;
    setIsActive(newIsActive);
    if (newIsActive) {
      setLastTick(Date.now());
    } else {
      setLastTick(null);
    }
  };

  const resetStopwatch = () => {
    setTime(0);
    setIsActive(false);
    setLastTick(null);
  };

  const adjustTime = (seconds) => {
    setTime((prevTime) => Math.max(0, prevTime + seconds));
  };

  const formatStopwatchTime = (seconds) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hrs.toString().padStart(2, "0")}:${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  return (
    <div className="flex items-center justify-between gap-3 bg-white dark:bg-black shadow-lg border border-gray-200 dark:border-gray-800 rounded-lg p-3 h-14 self-center font-medium min-w-[320px]">
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
          onClick={() => adjustTime(900)}
          title="+15m"
          className="h-8 px-2 text-xs text-green-600 hover:text-green-700 hover:bg-green-50 dark:hover:bg-green-950/20 transition-colors font-bold"
        >
          +15m
        </Button>
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
        <div className="w-px h-6 bg-gray-200 dark:bg-gray-800 mx-1" />
        <div className="flex items-center gap-1">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={toggleStopwatch}
            className="h-10 w-10 p-0 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          >
            {isActive ? (
              <Pause className="h-6 w-6 text-orange-500 fill-orange-500/20" />
            ) : (
              <Play className="h-6 w-6 text-green-600 fill-green-600/20" />
            )}
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={resetStopwatch}
            className="h-10 w-10 p-0 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          >
            <RotateCcw className="h-6 w-6 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300" />
          </Button>
        </div>
      </div>
    </div>
  );
}
