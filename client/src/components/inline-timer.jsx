import React, { useState, useEffect, useRef, useCallback } from "react";
import { createRoot } from "react-dom/client";
import { Play, Pause, RotateCcw, ExternalLink, ArrowDownToLine } from "lucide-react";
import { Button } from "@/components/ui/button";
import { apiRequest } from "@/lib/queryClient";
import { format, subDays } from "date-fns";

function TimerUI({ elapsed, isRunning, onToggle, onReset, onAddTime, formatElapsed, compact }) {
  if (compact) {
    return (
      <div className="flex items-center gap-1.5">
        <span className={`text-sm font-mono font-bold tabular-nums ${isRunning ? "text-green-600 dark:text-green-400" : "text-gray-900 dark:text-gray-100"}`}>
          {formatElapsed(elapsed)}
        </span>
        <button
          onClick={onToggle}
          className="h-7 w-7 flex items-center justify-center rounded-full transition-colors border border-gray-400 dark:border-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-600 dark:text-gray-400"
        >
          {isRunning ? <Pause className="h-3 w-3" /> : <Play className="h-3 w-3 ml-0.5" />}
        </button>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <span className={`text-lg font-mono font-bold tabular-nums ${isRunning ? "text-green-600 dark:text-green-400" : "text-gray-900 dark:text-gray-100"}`}>
        {formatElapsed(elapsed)}
      </span>
      <button
        onClick={onToggle}
        className="h-8 w-8 flex items-center justify-center rounded-full transition-colors border border-gray-400 dark:border-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-600 dark:text-gray-400"
      >
        {isRunning ? <Pause className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5 ml-0.5" />}
      </button>
      <button
        onClick={onReset}
        className="h-7 w-7 flex items-center justify-center rounded-full border border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors text-gray-600 dark:text-gray-400"
        title="Reset"
      >
        <RotateCcw className="h-3.5 w-3.5" />
      </button>
      <button
        onClick={() => onAddTime(-600)}
        className="h-6 px-2 text-[11px] font-medium rounded border border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors text-gray-600 dark:text-gray-400"
      >
        -10m
      </button>
      <button
        onClick={() => onAddTime(300)}
        className="h-6 px-2 text-[11px] font-medium rounded border border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors text-gray-600 dark:text-gray-400"
      >
        +5m
      </button>
    </div>
  );
}

function PipTimerUI({ elapsed, isRunning, onToggle, onReset, onAddTime, formatElapsed }) {
  return (
    <div style={{
      display: "flex",
      alignItems: "center",
      gap: "6px",
      padding: "4px 8px",
      fontFamily: "system-ui, -apple-system, sans-serif",
      background: "#111827",
      color: "#f3f4f6",
      height: "100%",
      boxSizing: "border-box",
      minWidth: "fit-content",
      flexShrink: 0,
    }}>
      <span style={{
        fontSize: "16px",
        fontFamily: "ui-monospace, monospace",
        fontWeight: 700,
        fontVariantNumeric: "tabular-nums",
        color: isRunning ? "#4ade80" : "#f3f4f6",
        flexShrink: 0,
      }}>
        {formatElapsed(elapsed)}
      </span>
      <button
        onClick={onToggle}
        style={{
          width: 28, height: 28,
          flexShrink: 0,
          borderRadius: "50%",
          border: "1px solid #6b7280",
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "transparent",
          color: "#9ca3af",
          fontSize: "12px",
        }}
      >
        {isRunning ? "⏸" : "▶"}
      </button>
      <button
        onClick={onReset}
        style={{
          width: 24, height: 24,
          flexShrink: 0,
          borderRadius: "50%",
          border: "1px solid #4b5563",
          background: "transparent",
          cursor: "pointer",
          color: "#9ca3af",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: "12px",
        }}
      >
        ↺
      </button>
      <button
        onClick={() => onAddTime(-600)}
        style={{
          height: 22, padding: "0 6px",
          flexShrink: 0,
          borderRadius: 4,
          border: "1px solid #4b5563",
          background: "transparent",
          cursor: "pointer",
          color: "#9ca3af",
          fontSize: "10px",
          fontWeight: 500,
        }}
      >
        -10m
      </button>
    </div>
  );
}

export default function InlineTimer() {
  const [elapsed, setElapsed] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [pipWindow, setPipWindow] = useState(null);
  const [showTransfer, setShowTransfer] = useState(false);
  const [isTransferring, setIsTransferring] = useState(false);
  const intervalRef = useRef(null);
  const pipRootRef = useRef(null);
  const elapsedRef = useRef(0);
  const isRunningRef = useRef(false);

  useEffect(() => {
    elapsedRef.current = elapsed;
  }, [elapsed]);

  useEffect(() => {
    isRunningRef.current = isRunning;
  }, [isRunning]);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 640);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

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

  const formatElapsed = useCallback((secs) => {
    const h = Math.floor(secs / 3600);
    const m = Math.floor((secs % 3600) / 60);
    const s = secs % 60;
    const pad = (n) => String(n).padStart(2, "0");
    return h > 0 ? `${h}:${pad(m)}:${pad(s)}` : `${pad(m)}:${pad(s)}`;
  }, []);

  const handleToggle = useCallback(() => setIsRunning((prev) => !prev), []);
  const handleReset = useCallback(() => { setIsRunning(false); setElapsed(0); }, []);
  const handleAddTime = useCallback((seconds) => setElapsed((prev) => Math.max(0, prev + seconds)), []);

  const handleTransfer = useCallback(async (targetDate) => {
    const elapsedMinutes = Math.round(elapsedRef.current / 60);
    if (elapsedMinutes <= 0) return;

    setIsTransferring(true);
    try {
      const dateStr = format(targetDate, "yyyy-MM-dd");

      const response = await apiRequest("/api/time-entries");
      const data = await response.json();
      const existing = data[dateStr];
      const existingMinutes = existing?.timeInMinutes || 0;

      const payload = {
        date: dateStr,
        timeInMinutes: existingMinutes + elapsedMinutes,
        notes: existing?.notes || "",
      };
      if (existing?.deepWorkPercent != null) {
        payload.deepWorkPercent = existing.deepWorkPercent;
      }

      await apiRequest("/api/time-entries", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      setIsRunning(false);
      setElapsed(0);
      window.dispatchEvent(new Event("time-entries-updated"));
    } catch (error) {
      console.error("Transfer failed:", error);
    } finally {
      setIsTransferring(false);
      setShowTransfer(false);
    }
  }, []);

  useEffect(() => {
    if (!pipWindow || !pipRootRef.current) return;
    pipRootRef.current.render(
      <PipTimerUI
        elapsed={elapsed}
        isRunning={isRunning}
        onToggle={handleToggle}
        onReset={handleReset}
        onAddTime={handleAddTime}
        formatElapsed={formatElapsed}
      />
    );
  }, [elapsed, isRunning, pipWindow]);

  const openPip = useCallback(async () => {
    if (!window.documentPictureInPicture) return;
    try {
      const pip = await window.documentPictureInPicture.requestWindow({
        width: 240,
        height: 40,
      });
      setPipWindow(pip);

      const container = pip.document.createElement("div");
      container.id = "pip-timer-root";
      pip.document.documentElement.style.background = "#111827";
      pip.document.body.style.margin = "0";
      pip.document.body.style.overflow = "hidden";
      pip.document.body.style.background = "#111827";
      pip.document.body.appendChild(container);

      const root = createRoot(container);
      pipRootRef.current = root;
      root.render(
        <PipTimerUI
          elapsed={elapsedRef.current}
          isRunning={isRunningRef.current}
          onToggle={handleToggle}
          onReset={handleReset}
          onAddTime={handleAddTime}
          formatElapsed={formatElapsed}
        />
      );

      pip.addEventListener("pagehide", () => {
        root.unmount();
        pipRootRef.current = null;
        setPipWindow(null);
      });
    } catch (e) {
      console.error("PiP failed:", e);
    }
  }, [handleToggle, handleReset, handleAddTime, formatElapsed]);

  const pipSupported = typeof window !== "undefined" && "documentPictureInPicture" in window;

  return (
    <div className="flex items-center gap-2">
      <TimerUI
        elapsed={elapsed}
        isRunning={isRunning}
        onToggle={handleToggle}
        onReset={handleReset}
        onAddTime={handleAddTime}
        formatElapsed={formatElapsed}
        compact={isMobile}
      />
      {!isMobile && (
        <>
          <div className="relative">
            <button
              onClick={() => elapsed > 0 && setShowTransfer(!showTransfer)}
              className="h-7 w-7 flex items-center justify-center rounded-full border border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors text-gray-600 dark:text-gray-400 disabled:opacity-40"
              title="Transfer time to calendar"
              disabled={elapsed === 0}
            >
              <ArrowDownToLine className="h-3.5 w-3.5" />
            </button>
            {showTransfer && (
              <div className="absolute top-full mt-2 right-0 z-50 w-52 p-3 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 shadow-lg">
                <p className="text-sm font-medium mb-2 text-gray-900 dark:text-gray-100">
                  Add {formatElapsed(elapsed)} to:
                </p>
                <div className="flex flex-col gap-1.5">
                  <Button size="sm" variant="outline" onClick={() => handleTransfer(new Date())} disabled={isTransferring}>
                    Today
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => handleTransfer(subDays(new Date(), 1))} disabled={isTransferring}>
                    Yesterday
                  </Button>
                </div>
              </div>
            )}
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={openPip}
            disabled={!pipSupported || !!pipWindow}
            className="h-7 w-7 p-0"
            title={pipSupported ? (pipWindow ? "Already popped out" : "Pop out timer") : "Pop-out requires Chrome or Edge"}
          >
            <ExternalLink className="h-3.5 w-3.5" />
          </Button>
        </>
      )}
    </div>
  );
}
