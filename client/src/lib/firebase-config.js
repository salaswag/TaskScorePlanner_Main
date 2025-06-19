import { initializeApp } from 'firebase/app';
import { getAuth, connectAuthEmulator, signInAnonymously } from 'firebase/auth';

const firebaseConfig = {
  apiKey: "AIzaSyDSvbg8ko_7lx8_bUBOmXaE6hZ8u9Wrzgk",
  authDomain: "taskscoreplanner.firebaseapp.com",
  projectId: "taskscoreplanner",
  storageBucket: "taskscoreplanner.firebasestorage.app",
  messagingSenderId: "462209045062",
  appId: "1:462209045062:web:bd2c5bb7f48fc31daf4c74",
  measurementId: "G-EEL36PB3VC"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);

// Initialize anonymous user if no user is present
auth.onAuthStateChanged((user) => {
  if (!user) {
    // Don't try anonymous sign in, just let the user be anonymous
    console.log('No user authenticated, continuing as anonymous');
  }
});