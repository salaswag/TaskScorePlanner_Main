import * as React from 'react';
const { useState, useEffect } = React;

// Create a global state manager for the stopwatch
let globalTime = 0;
let globalIsActive = false;
const listeners = new Set();

const notify = () => {
  listeners.forEach(listener => listener({ time: globalTime, isActive: globalIsActive }));
};

// Start a single interval for the whole app
let interval = null;
const startGlobalInterval = () => {
  if (interval) return;
  interval = setInterval(() => {
    if (globalIsActive) {
      globalTime += 1;
      // 16 hours limit
      if (globalTime >= 57600) {
        globalIsActive = false;
        globalTime = 0;
        clearInterval(interval);
        interval = null;
      }
      notify();
    }
  }, 1000);
};

export const useGlobalStopwatch = () => {
  const [state, setState] = useState({ time: globalTime, isActive: globalIsActive });

  useEffect(() => {
    const listener = (newState) => setState(newState);
    listeners.add(listener);
    if (globalIsActive && !interval) startGlobalInterval();
    return () => listeners.delete(listener);
  }, []);

  const toggle = () => {
    globalIsActive = !globalIsActive;
    if (globalIsActive) startGlobalInterval();
    notify();
  };

  const reset = () => {
    globalTime = 0;
    globalIsActive = false;
    notify();
  };

  const adjust = (seconds) => {
    globalTime = Math.max(0, globalTime + seconds);
    notify();
  };

  return { time: state.time, isActive: state.isActive, toggle, reset, adjust };
};
