import { Switch, Route, useLocation } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/components/theme-provider";
import TodoApp from "@/pages/todo-app";
import NotFound from "@/pages/not-found";
import { useEffect, Component, type ReactNode } from "react";

function Router() {
  return (
    <Switch>
      <Route path="/time-tracker" component={TodoApp} />
      <Route path="/planning" component={TodoApp} />
      <Route path="/" component={TodoApp} />
      <Route component={NotFound} />
    </Switch>
  );
}

/**
 * Error boundary that catches chunk-load failures (stale deploy)
 * and auto-reloads to get fresh assets.
 */
class ChunkErrorBoundary extends Component<
  { children: ReactNode },
  { hasError: boolean }
> {
  constructor(props: { children: ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error) {
    // Chunk load failures show up as these error types
    if (
      error.message?.includes("Failed to fetch dynamically imported module") ||
      error.message?.includes("Loading chunk") ||
      error.message?.includes("Loading CSS chunk") ||
      error.name === "ChunkLoadError"
    ) {
      return { hasError: true };
    }
    throw error; // Re-throw non-chunk errors
  }

  componentDidCatch(error: Error) {
    // Only auto-reload once per session to avoid reload loops
    const reloadKey = "chunk-reload-ts";
    const lastReload = sessionStorage.getItem(reloadKey);
    const now = Date.now();

    if (!lastReload || now - parseInt(lastReload) > 10000) {
      sessionStorage.setItem(reloadKey, String(now));
      // Clear SW caches then hard reload
      if ("caches" in window) {
        caches.keys().then((names) =>
          Promise.all(names.map((n) => caches.delete(n)))
        ).then(() => window.location.reload());
      } else {
        window.location.reload();
      }
    }
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex items-center justify-center min-h-screen bg-gray-50 dark:bg-gray-900">
          <div className="text-center p-8">
            <h2 className="text-lg font-semibold mb-2">App Updated</h2>
            <p className="text-gray-500 mb-4">A new version is available. Reloading...</p>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

function App() {
  useEffect(() => {
    // Force the new service worker to take over immediately
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.getRegistration().then((reg) => {
        if (reg?.waiting) {
          reg.waiting.postMessage({ type: "SKIP_WAITING" });
        }
        reg?.addEventListener("updatefound", () => {
          const newWorker = reg.installing;
          newWorker?.addEventListener("statechange", () => {
            if (newWorker.state === "activated") {
              window.location.reload();
            }
          });
        });
      });
    }
  }, []);

  return (
    <ChunkErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <ThemeProvider defaultTheme="system">
          <TooltipProvider>
            <Toaster />
            <Router />
          </TooltipProvider>
        </ThemeProvider>
      </QueryClientProvider>
    </ChunkErrorBoundary>
  );
}

export default App;
