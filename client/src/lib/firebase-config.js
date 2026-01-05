
import { initializeApp, getApps } from 'firebase/app';
import { getAuth } from 'firebase/auth';

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
export const auth = getAuth(app);
