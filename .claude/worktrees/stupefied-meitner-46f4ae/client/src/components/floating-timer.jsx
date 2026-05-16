import React, { useState, useEffect, useRef, useCallback } from "react";
import { Play, Pause, RotateCcw, X, Minus, Maximize2, GripHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function FloatingTimer({ isVisible, onClose }) {
  const [elapsed, setElapsed] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const dragOffset = useRef({ x: 0, y: 0 });
  const panelRef = useRef(null);
  const intervalRef = useRef(null);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 640);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  useEffect(() => {
    if (!isMobile && isVisible && position.x === 0 && position.y === 0) {
      setPosition({ x: window.innerWidth - 300, y: 90 });
    }
  }, [isMobile, isVisible]);

  useEffect(() => {
    if (isRunning) {
      intervalRef.current = setInterval(() => {
        setElapsed((prev) => prev + 1);
      }, 1000);
    } else {
      clearInterval(intervalRef.current);
    }
    return () => clearInterval(intervalRef.current);
  }, [isRunning]);

  const formatElapsed = (secs) => {
    const h = Math.floor(secs / 3600);
    const m = Math.floor((secs % 3600) / 60);
    const s = secs % 60;
    const pad = (n) => String(n).padStart(2, "0");
    return h > 0 ? `${h}:${pad(m)}:${pad(s)}` : `${pad(m)}:${pad(s)}`;
  };

  const handleReset = () => {
    setIsRunning(false);
    setElapsed(0);
  };

  const handleAddTime = (seconds) => {
    setElapsed((prev) => prev + seconds);
  };

  const handleMouseDown = useCallback(
    (e) => {
      if (isMobile) return;
      e.preventDefault();
      setIsDragging(true);
      dragOffset.current = {
        x: e.clientX - position.x,
        y: e.clientY - position.y,
      };
    },
    [isMobile, position]
  );

  useEffect(() => {
    if (!isDragging) return;

    const handleMouseMove = (e) => {
      const newX = Math.max(0, Math.min(window.innerWidth - 260, e.clientX - dragOffset.current.x));
      const newY = Math.max(0, Math.min(window.innerHeight - 60, e.clientY - dragOffset.current.y));
      setPosition({ x: newX, y: newY });
    };

    const handleMouseUp = () => setIsDragging(false);

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, [isDragging]);

  if (!isVisible) return null;

  if (isMobile) {
    return (
      <div className="fixed bottom-0 left-0 right-0 z-50 floating-timer-panel border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 shadow-lg timer-enter">
        <div className="flex items-center justify-between px-3 py-2">
          <div className="flex items-center gap-3">
            <span className="text-2xl font-mono font-bold tabular-nums text-gray-900 dark:text-gray-100">
              {formatElapsed(elapsed)}
            </span>
          </div>

          <div className="flex items-center gap-1.5">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleAddTime(300)}
              className="text-xs px-2 h-7"
            >
              +5m
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleAddTime(600)}
              className="text-xs px-2 h-7"
            >
              +10m
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsRunning(!isRunning)}
              className="h-8 w-8 p-0"
            >
              {isRunning ? (
                <Pause className="h-4 w-4" />
              ) : (
                <Play className="h-4 w-4" />
              )}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleReset}
              className="h-8 w-8 p-0"
            >
              <RotateCcw className="h-3.5 w-3.5" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="h-8 w-8 p-0"
            >
              <X className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (isMinimized) {
    return (
      <div
        ref={panelRef}
        className="fixed z-50 floating-timer-panel border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 rounded-full shadow-lg timer-enter select-none"
        style={{ left: position.x, top: position.y }}
      >
        <div className="flex items-center gap-2 px-3 py-1.5">
          <div
            className="cursor-grab active:cursor-grabbing"
            onMouseDown={handleMouseDown}
          >
            <GripHorizontal className="h-3 w-3 text-gray-400" />
          </div>
          <span
            className={`text-sm font-mono font-bold tabular-nums ${isRunning ? "text-green-600 dark:text-green-400" : "text-gray-900 dark:text-gray-100"}`}
          >
            {formatElapsed(elapsed)}
          </span>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsRunning(!isRunning)}
            className="h-6 w-6 p-0"
          >
            {isRunning ? (
              <Pause className="h-3 w-3" />
            ) : (
              <Play className="h-3 w-3" />
            )}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsMinimized(false)}
            className="h-6 w-6 p-0"
          >
            <Maximize2 className="h-3 w-3" />
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div
      ref={panelRef}
      className="fixed z-50 floating-timer-panel border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 rounded-xl shadow-xl timer-enter select-none"
      style={{ left: position.x, top: position.y, width: 260 }}
    >
      {/* Drag handle */}
      <div
        className="flex items-center justify-between px-3 py-2 border-b border-gray-100 dark:border-gray-800 cursor-grab active:cursor-grabbing"
        onMouseDown={handleMouseDown}
      >
        <div className="flex items-center gap-2">
          <GripHorizontal className="h-4 w-4 text-gray-400" />
          <span className="text-xs font-medium text-gray-500 dark:text-gray-400">
            Stopwatch
          </span>
        </div>
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsMinimized(true)}
            className="h-6 w-6 p-0"
          >
            <Minus className="h-3 w-3" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="h-6 w-6 p-0"
          >
            <X className="h-3 w-3" />
          </Button>
        </div>
      </div>

      {/* Time display */}
      <div className="px-4 pt-4 pb-2 text-center">
        <span
          className={`text-4xl font-mono font-bold tabular-nums ${isRunning ? "text-green-600 dark:text-green-400" : "text-gray-900 dark:text-gray-100"}`}
        >
          {formatElapsed(elapsed)}
        </span>
      </div>

      {/* Controls */}
      <div className="px-4 pb-4 space-y-2">
        <div className="flex items-center justify-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleReset}
            className="h-9 w-9 p-0 rounded-full"
            title="Reset"
          >
            <RotateCcw className="h-4 w-4" />
          </Button>
          <Button
            onClick={() => setIsRunning(!isRunning)}
            className={`h-12 w-12 p-0 rounded-full ${
              isRunning
                ? "bg-red-500 hover:bg-red-600 text-white"
                : "bg-green-500 hover:bg-green-600 text-white"
            }`}
            title={isRunning ? "Pause" : "Start"}
          >
            {isRunning ? (
              <Pause className="h-5 w-5" />
            ) : (
              <Play className="h-5 w-5 ml-0.5" />
            )}
          </Button>
          <div className="flex flex-col gap-1">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleAddTime(300)}
              className="h-4 text-[10px] px-2 py-0 leading-none"
            >
              +5m
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleAddTime(600)}
              className="h-4 text-[10px] px-2 py-0 leading-none"
            >
              +10m
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
