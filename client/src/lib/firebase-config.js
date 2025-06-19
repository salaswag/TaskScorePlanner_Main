import { initializeApp, getApps } from 'firebase/app';
import { getAuth } from 'firebase/auth';

const firebaseConfig = {
  apiKey: "AIzaSyDSvbg8ko_7lx8_bUBOmXaE6hZ8u9Wrzgk",
  authDomain: "taskscoreplanner.firebaseapp.com",
  projectId: "taskscoreplanner",
  storageBucket: "taskscoreplanner.firebasestorage.app",
  messagingSenderId: "462209045062",
  appId: "1:462209045062:web:bd2c5bb7f48fc31daf4c74",
  measurementId: "G-EEL36PB3VC"
};

// Prevent duplicate app initialization
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
export const auth = getAuth(app);