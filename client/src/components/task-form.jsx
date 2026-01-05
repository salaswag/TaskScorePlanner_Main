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

  const { isKeyboardVisible, viewportHeight, keyboardHeight } =
    useKeyboardAware();
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
    return `${hrs.toString().padStart(2, "0")}:${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  // Picture-in-Picture logic
  const videoRef = React.useRef(null);
  const canvasRef = React.useRef(null);
  const requestRef = React.useRef(null);

  const drawPiP = () => {
    if (!canvasRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    
    // Use a higher scale for resolution but smaller canvas size
    const scale = 2;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Background
    ctx.fillStyle = 'black';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Text
    ctx.fillStyle = 'white';
    ctx.font = 'bold 60px monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(formatStopwatchTime(time), canvas.width / 2, canvas.height / 2);
    
    requestRef.current = requestAnimationFrame(drawPiP);
  };

  useEffect(() => {
    if (document.pictureInPictureElement) {
      // If we are in PiP, we don't need to restart it, 
      // but we need to make sure it keeps drawing if the time changes
      // Actually, drawPiP is already using the current 'time' because it's in the closure
    }
  }, [time]);

  const startPiP = async () => {
    try {
      if (document.pictureInPictureElement) {
        await document.exitPictureInPicture();
        if (requestRef.current) cancelAnimationFrame(requestRef.current);
        return;
      }

      const canvas = canvasRef.current;
      // Start the animation loop
      drawPiP();

      const stream = canvas.captureStream(30); // 30 FPS
      videoRef.current.srcObject = stream;
      await videoRef.current.play();
      await videoRef.current.requestPictureInPicture();
      
      videoRef.current.addEventListener('leavepictureinpicture', () => {
        if (requestRef.current) cancelAnimationFrame(requestRef.current);
      }, { once: true });

    } catch (error) {
      console.error('Failed to enter Picture-in-Picture:', error);
    }
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
      console.log("Submitting task with data:", taskData);
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
      className="w-full flex flex-col lg:flex-row items-stretch gap-4 transition-all duration-300 ease-in-out"
      style={{
        transform: isKeyboardVisible ? "translateY(-10px)" : "translateY(0)",
        marginBottom: isKeyboardVisible ? "10px" : "0",
        minHeight: "auto",
      }}
    >
      <form
        onSubmit={handleSubmit}
        className={`w-full lg:flex-[0.7] max-w-4xl bg-white dark:bg-black shadow-lg border border-gray-200 dark:border-gray-800 rounded-lg p-3 transition-all duration-300 ${
          isKeyboardVisible ? "shadow-xl border-blue-300 dark:border-blue-600" : ""
        }`}
      >
        {/* Responsive Container */}
        <div className="flex flex-col xl:flex-row xl:items-center gap-4 w-full">
          {/* Task Input */}
          <Input
            type="text"
            placeholder="Add new task..."
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            onFocus={handleInputFocus}
            onBlur={handleInputBlur}
            onKeyDown={(e) => {
              if (e.key === "Enter" && title.trim()) {
                handleSubmit(e);
              } else if (e.key === "Tab") {
                e.preventDefault();
                focusNextInput();
              }
            }}
            className="w-full xl:flex-1 px-4 py-4 h-12 bg-white dark:bg-gray-900 text-black dark:text-white border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-black dark:focus:ring-white focus:border-transparent transition-all duration-200 hover:border-gray-400 dark:hover:border-gray-600 hover:shadow-md"
          />

          {/* Controls Group */}
          <div className="flex flex-col sm:flex-row gap-4 w-full xl:w-auto">
            {/* Priority Slider */}
            <div className="flex items-center gap-2 sm:min-w-[180px] p-2 rounded-lg transition-all duration-200 hover:bg-gray-50 dark:hover:bg-gray-800/50">
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
                  if (e.key === "Tab") {
                    e.preventDefault();
                    focusNextInput();
                  }
                }}
                className="slider flex-1"
              />
            </div>

            {/* Time Slider */}
            <div className="flex items-center gap-2 sm:min-w-[200px] p-2 rounded-lg transition-all duration-200 hover:bg-gray-50 dark:hover:bg-gray-800/50">
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
                className="slider flex-1"
              />
            </div>
          </div>

          {/* Add Button */}
          <Button
            type="submit"
            disabled={!title.trim() || isLoading}
            className="w-full xl:w-auto bg-black dark:bg-white text-white dark:text-black px-4 py-3 h-12 rounded-lg font-medium hover:bg-gray-800 dark:hover:bg-gray-200 hover:shadow-lg transition-all duration-200 flex items-center justify-center space-x-2 whitespace-nowrap transform hover:scale-105"
          >
            <Plus className="h-4 w-4" />
            <span>{isLoading ? "Adding..." : "Add"}</span>
          </Button>
        </div>
      </form>

      {/* Stopwatch Container */}
      <div className="flex lg:flex-[0.3] w-full min-w-[320px] items-center justify-between gap-3 bg-white dark:bg-black shadow-lg border border-gray-200 dark:border-gray-800 rounded-lg p-3 h-14 self-center font-medium">
        <div className="flex items-center gap-2 px-2 border-r border-gray-200 dark:border-gray-800">
          <Clock className="h-5 w-5 text-gray-500" />
          <span className="font-mono font-bold text-xl min-w-[90px] text-black dark:text-white">
            {formatStopwatchTime(time)}
          </span>
        </div>
        <div className="flex items-center gap-1 flex-1 justify-end">
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
          <div className="w-px h-6 bg-gray-200 dark:bg-gray-800 mx-1 hidden sm:block" />
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={startPiP}
            title="Pin Stopwatch (Float)"
            className="h-9 w-9 p-0 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="h-5 w-5 text-blue-500"
            >
              <rect width="20" height="12" x="2" y="3" rx="2" />
              <path d="M22 15h-9v6h9v-6z" />
              <path d="M14 18h2" />
            </svg>
          </Button>
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
        {/* Hidden elements for PiP functionality */}
        <canvas ref={canvasRef} width="400" height="120" className="hidden" />
        <video ref={videoRef} className="hidden" muted playsInline />
      </div>
    </div>
  );
}

export default TaskForm;
