
import { initializeApp, getApps } from 'firebase/app';
import { getAuth } from 'firebase/auth';

// Detect Brave browser
const isBrave = () => {
  return (navigator.brave && navigator.brave.isBrave) || false;
};

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyBCqjskVuqS99hx_29uX5e2nJeyyWoJhrE",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "task-master-pro-auth.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "task-master-pro-auth",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "task-master-pro-auth.firebasestorage.app",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "1098500419305",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:1098500419305:web:4af12d37896359511c4a78",
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || "G-27LVP6GDRB"
};

let app;
let auth;

try {
  // Prevent duplicate app initialization
  app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
  auth = getAuth(app);
  
  if (isBrave()) {
    console.log('🦁 Brave browser detected - Firebase initialized with enhanced compatibility');
  } else {
    console.log('🔥 Firebase initialized successfully');
  }
} catch (error) {
  console.error('❌ Firebase initialization failed:', error);
  if (isBrave()) {
    console.log('🦁 Brave browser detected - this might be due to Brave Shields blocking Google services');
  }
  // Create a fallback auth object that won't crash the app
  auth = null;
}

export { auth };
