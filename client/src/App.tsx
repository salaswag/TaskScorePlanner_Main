import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/components/theme-provider";
import TodoApp from "@/pages/todo-app";
import { CoggleView } from "@/pages/coggle-view";
import NotFound from "@/pages/not-found";
import { useEffect } from "react";

function Router() {
  return (
    <Switch>
      <Route path="/" component={TodoApp} />
      <Route path="/time-tracker" component={TodoApp} />
      <Route path="/mind-map" component={TodoApp} />
      <Route path="/coggle" component={TodoApp} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  useEffect(() => {
    // Check for app version changes and clear cache if needed
    const checkAppVersion = () => {
      const currentVersion = "2.1.0"; // Increment this on each deployment
      const storedVersion = localStorage.getItem("app-version");
      
      if (storedVersion && storedVersion !== currentVersion) {
        console.log("App version changed, clearing cache...");
        // Clear service worker caches
        if ('caches' in window) {
          caches.keys().then(names => {
            names.forEach(name => {
              if (name.startsWith('taskmaster-')) {
                caches.delete(name);
              }
            });
          });
        }
        
        // Update stored version
        localStorage.setItem("app-version", currentVersion);
        
        // Reload to get fresh resources
        setTimeout(() => {
          window.location.reload();
        }, 1000);
      } else if (!storedVersion) {
        localStorage.setItem("app-version", currentVersion);
      }
    };

    checkAppVersion();
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider defaultTheme="system">
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
