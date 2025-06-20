import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";

// Detect Brave browser
const isBrave = () => {
  return (navigator.brave && navigator.brave.isBrave) || false;
};

// Register service worker for PWA - but skip for Brave if it causes issues
if ('serviceWorker' in navigator && !isBrave()) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js')
      .then((registration) => {
        console.log('SW registered: ', registration);
      })
      .catch((registrationError) => {
        console.log('SW registration failed: ', registrationError);
      });
  });
} else if (isBrave()) {
  console.log('Brave browser detected - skipping service worker registration');
}

createRoot(document.getElementById("root")!).render(<App />);
