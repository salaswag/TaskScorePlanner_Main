import { initializeApp, getApps } from 'firebase/app';
import { getAuth, setPersistence, browserLocalPersistence } from 'firebase/auth';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyBCqjskVuqS99hx_29uX5e2nJeyyWoJhrE",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "task-master-pro-auth.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "task-master-pro-auth",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "task-master-pro-auth.firebasestorage.app",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "1098500419305",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:1098500419305:web:4af12d37896359511c4a78",
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || "G-27LVP6GDRB"
};

// Prevent duplicate app initialization
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];

// Initialize Firebase Authentication and get a reference to the service
export const auth = getAuth(app);

// Detect if we're running in Brave browser
const isBrave = navigator.brave && navigator.brave.isBrave || false;

// Set up auth state persistence with error handling for Brave
try {
  setPersistence(auth, browserLocalPersistence);
} catch (error) {
  console.warn('Auth persistence setup failed (likely Brave browser):', error);
  // Continue without persistence in Brave
}