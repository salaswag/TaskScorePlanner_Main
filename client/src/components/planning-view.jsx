import React, { useState, useEffect, useCallback, useRef } from "react";
import { Excalidraw } from "@excalidraw/excalidraw";
import "@excalidraw/excalidraw/index.css";
import { apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/hooks/use-auth";
import { useTheme } from "@/components/theme-provider";
import { Save, Check, Cloud, CloudOff } from "lucide-react";

const STORAGE_KEY = "excalidraw-planning-data";

function PlanningView() {
  const { user } = useAuth();
  const { resolvedTheme } = useTheme();
  const isAnonymous = !user || user.isAnonymous;
  const [initialData, setInitialData] = useState(null);
  const [loaded, setLoaded] = useState(false);
  const [saveStatus, setSaveStatus] = useState("idle"); // idle | saving | saved | error
  const saveTimer = useRef(null);
  const latestData = useRef({ elements: [], appState: {}, files: {} });
  const statusTimer = useRef(null);

  // Resolve theme for Excalidraw ("light" or "dark")
  const excalidrawTheme = (() => {
    if (resolvedTheme === "dark") return "dark";
    if (resolvedTheme === "light") return "light";
    if (typeof window !== "undefined" && window.matchMedia("(prefers-color-scheme: dark)").matches) return "dark";
    return "light";
  })();

  // ── Load saved data ──
  useEffect(() => {
    (async () => {
      try {
        if (isAnonymous) {
          const stored = localStorage.getItem(STORAGE_KEY);
          if (stored) {
            const parsed = JSON.parse(stored);
            setInitialData(parsed);
          }
        } else {
          const res = await apiRequest("/api/planning-nodes");
          const data = await res.json();
          if (data.elements && data.elements.length > 0) {
            setInitialData(data);
          } else {
            // Server empty or old format — try localStorage
            const stored = localStorage.getItem(STORAGE_KEY);
            if (stored) {
              try { setInitialData(JSON.parse(stored)); } catch {}
            }
          }
        }
      } catch (e) {
        console.error("Failed to load planning data:", e);
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored) {
          try { setInitialData(JSON.parse(stored)); } catch {}
        }
      }
      setLoaded(true);
    })();
  }, [isAnonymous]);

  // ── Save helper ──
  const doSave = useCallback(async (immediate = false) => {
    const { elements: els, appState: as, files: fs } = latestData.current;
    if (!els || els.length === 0) return;

    const trimmedAppState = {
      viewBackgroundColor: as?.viewBackgroundColor,
      currentItemFontFamily: as?.currentItemFontFamily,
      zoom: as?.zoom,
      scrollX: as?.scrollX,
      scrollY: as?.scrollY,
      gridSize: as?.gridSize,
    };
    const saveData = { elements: els, appState: trimmedAppState, files: fs || {} };

    // Always save to localStorage
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(saveData));
    } catch {}

    // Save to server for authenticated users
    if (!isAnonymous) {
      if (immediate) setSaveStatus("saving");
      try {
        await apiRequest("/api/planning-nodes", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(saveData),
        });
        setSaveStatus("saved");
        if (statusTimer.current) clearTimeout(statusTimer.current);
        statusTimer.current = setTimeout(() => setSaveStatus("idle"), 3000);
      } catch (e) {
        console.error("Server save failed:", e);
        setSaveStatus("error");
        if (statusTimer.current) clearTimeout(statusTimer.current);
        statusTimer.current = setTimeout(() => setSaveStatus("idle"), 5000);
      }
    } else {
      setSaveStatus("saved");
      if (statusTimer.current) clearTimeout(statusTimer.current);
      statusTimer.current = setTimeout(() => setSaveStatus("idle"), 3000);
    }
  }, [isAnonymous]);

  // ── Auto-save (debounced 2s) ──
  const handleChange = useCallback(
    (elements, appState, files) => {
      if (!loaded) return;
      latestData.current = { elements, appState, files };

      if (saveTimer.current) clearTimeout(saveTimer.current);
      saveTimer.current = setTimeout(() => doSave(false), 2000);
    },
    [loaded, doSave]
  );

  // Manual save
  const handleManualSave = useCallback(() => {
    if (saveTimer.current) clearTimeout(saveTimer.current);
    doSave(true);
  }, [doSave]);

  // Flush pending save on unmount and page unload
  useEffect(() => {
    const handleBeforeUnload = () => {
      if (saveTimer.current) clearTimeout(saveTimer.current);
      // Synchronous localStorage save
      const { elements: els, appState: as, files: fs } = latestData.current;
      if (els && els.length > 0) {
        const trimmedAppState = {
          viewBackgroundColor: as?.viewBackgroundColor,
          currentItemFontFamily: as?.currentItemFontFamily,
          zoom: as?.zoom,
          scrollX: as?.scrollX,
          scrollY: as?.scrollY,
          gridSize: as?.gridSize,
        };
        try {
          localStorage.setItem(STORAGE_KEY, JSON.stringify({ elements: els, appState: trimmedAppState, files: fs || {} }));
        } catch {}
      }
      // Fire-and-forget server save
      if (!isAnonymous && els && els.length > 0) {
        const trimmedAppState = {
          viewBackgroundColor: as?.viewBackgroundColor,
          currentItemFontFamily: as?.currentItemFontFamily,
          zoom: as?.zoom,
          scrollX: as?.scrollX,
          scrollY: as?.scrollY,
          gridSize: as?.gridSize,
        };
        apiRequest("/api/planning-nodes", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ elements: els, appState: trimmedAppState, files: fs || {} }),
        }).catch(() => {});
      }
    };
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
      if (saveTimer.current) clearTimeout(saveTimer.current);
      // Flush on unmount (tab switch)
      doSave(false);
    };
  }, [doSave, isAnonymous]);

  if (!loaded) {
    return <div className="text-center py-12 text-gray-500">Loading planning canvas...</div>;
  }

  return (
    <div className="relative w-full h-[calc(100vh-70px)] overflow-hidden bg-white dark:bg-[#121212] -mx-2 md:-mx-4 -mb-4 md:-mb-6" style={{ width: 'calc(100% + 1rem)', maxWidth: 'none' }}>
      <Excalidraw
        initialData={initialData || undefined}
        onChange={handleChange}
        theme={excalidrawTheme}
        UIOptions={{
          canvasActions: {
            loadScene: true,
            export: { saveFileToDisk: true },
            toggleTheme: false,
          },
        }}
      />

      {/* Save indicator + manual save button */}
      <div className="absolute bottom-4 right-4 z-[10] flex items-center gap-2">
        {saveStatus === "saving" && (
          <span className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400 bg-white/90 dark:bg-gray-900/90 backdrop-blur px-2.5 py-1.5 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm">
            <Cloud className="h-3.5 w-3.5 animate-pulse" />
            Saving...
          </span>
        )}
        {saveStatus === "saved" && (
          <span className="flex items-center gap-1.5 text-xs text-green-600 dark:text-green-400 bg-white/90 dark:bg-gray-900/90 backdrop-blur px-2.5 py-1.5 rounded-lg border border-green-200 dark:border-green-800 shadow-sm">
            <Check className="h-3.5 w-3.5" />
            Saved{!isAnonymous ? " to cloud" : ""}
          </span>
        )}
        {saveStatus === "error" && (
          <span className="flex items-center gap-1.5 text-xs text-red-600 dark:text-red-400 bg-white/90 dark:bg-gray-900/90 backdrop-blur px-2.5 py-1.5 rounded-lg border border-red-200 dark:border-red-800 shadow-sm">
            <CloudOff className="h-3.5 w-3.5" />
            Save failed
          </span>
        )}
        <button
          onClick={handleManualSave}
          className="flex items-center gap-1.5 text-xs text-gray-600 dark:text-gray-300 bg-white/90 dark:bg-gray-900/90 backdrop-blur px-2.5 py-1.5 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          title="Save now"
        >
          <Save className="h-3.5 w-3.5" />
          Save
        </button>
      </div>
    </div>
  );
}

export default PlanningView;
