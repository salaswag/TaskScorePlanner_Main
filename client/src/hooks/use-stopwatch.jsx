import * as React from "react";
const { useState, useEffect, createContext, useContext } = React;

const StopwatchContext = createContext();

export function StopwatchProvider({ children }) {
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
    <StopwatchContext.Provider value={{
      time,
      isActive,
      toggleStopwatch,
      resetStopwatch,
      adjustTime,
      formatStopwatchTime
    }}>
      {children}
    </StopwatchContext.Provider>
  );
}

export function useStopwatch() {
  const context = useContext(StopwatchContext);
  if (!context) {
    throw new Error("useStopwatch must be used within a StopwatchProvider");
  }
  return context;
}
