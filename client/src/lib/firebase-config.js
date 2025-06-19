
import { initializeApp, getApps } from 'firebase/app';
import { getAuth } from 'firebase/auth';

const firebaseConfig = {
  apiKey: "AIzaSyDSvbg8ko_7lx8_bUBOmXaE6hZ8u9Wrzgk",
  authDomain: "taskscoreplanner.firebaseapp.com",
  projectId: "taskscoreplanner",
  storageBucket: "taskscoreplanner.firebasestorage.app",
  messagingSenderId: "10710154133",
  appId: "1:10710154133:web:9d2327a6b9e90b5cf6a3f5",
  measurementId: "G-EEL36PB3VC"
};

// Prevent duplicate app initialization
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
export const auth = getAuth(app);
