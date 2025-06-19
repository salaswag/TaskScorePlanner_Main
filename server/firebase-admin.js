
import admin from 'firebase-admin';

// Initialize Firebase Admin SDK
if (!admin.apps.length) {
  admin.initializeApp({
    projectId: "task-master-pro-auth",
    // In production, you would use a service account key
    // For development, we'll use the default credentials
  });
}

export { admin };
export const auth = admin.auth();
