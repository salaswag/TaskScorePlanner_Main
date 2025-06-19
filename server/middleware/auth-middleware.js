import { admin } from '../firebase-admin.js';

// Cache for anonymous users to avoid repeated logs
const loggedAnonymousUsers = new Set();
const lastLogTime = new Map();

export async function verifyFirebaseToken(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    const anonymousId = `anonymous-${req.ip}`;
    const now = Date.now();
    const lastLog = lastLogTime.get(req.ip) || 0;

    // Only log once per IP per 30 seconds to reduce spam significantly
    if (now - lastLog > 30000) {
      console.log(`No token provided, using anonymous user for IP: ${req.ip}`);
      lastLogTime.set(req.ip, now);

      // Clean up old entries every hour
      setTimeout(() => {
        lastLogTime.delete(req.ip);
      }, 60 * 60 * 1000);
    }

    req.user = {
      uid: anonymousId,
      email: null,
      isAnonymous: true
    };
    next();
    return;
  }

  const token = authHeader.split(' ')[1];

  try {
    const decodedToken = await admin.auth().verifyIdToken(token);
    req.user = {
      uid: decodedToken.uid,
      email: decodedToken.email,
      isAnonymous: false
    };
    console.log(`Authenticated user: ${decodedToken.email}`);
    next();
  } catch (error) {
    console.error('Firebase token verification failed:', error.message);
    req.user = {
      uid: `anonymous-${req.ip}`,
      email: null,
      isAnonymous: true
    };
    next();
  }
}