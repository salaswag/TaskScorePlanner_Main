
import { initializeApp, getApps } from 'firebase/app';
import { getAuth } from 'firebase/auth';

const firebaseConfig = {
  apiKey: "AIzaSyBCqjskVuqS99hx_29uX5e2nJeyyWoJhrE",
  authDomain: "task-master-pro-auth.firebaseapp.com",
  projectId: "task-master-pro-auth",
  storageBucket: "task-master-pro-auth.firebasestorage.app",
  messagingSenderId: "1098500419305",
  appId: "1:1098500419305:web:4af12d37896359511c4a78",
  measurementId: "G-27LVP6GDRB"
};

// Prevent duplicate app initialization
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
export const auth = getAuth(app);
