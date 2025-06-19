import { admin } from '../firebase-admin.js';
import { Logger } from '../logger.js';

// Cache for anonymous users to avoid repeated logs
const loggedAnonymousUsers = new Set();
const lastLogTime = new Map();

export const authenticateUser = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    const clientIP = req.ip || req.connection.remoteAddress || req.socket.remoteAddress || 'unknown';
    const userAgent = req.headers['user-agent'] || 'unknown';
    
    // Create a more unique anonymous identifier
    const anonymousId = `anonymous-${clientIP}-${Buffer.from(userAgent).toString('base64').substring(0, 8)}`;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      // Only log once per unique anonymous ID to reduce spam
      if (!loggedAnonymousUsers.has(anonymousId)) {
        Logger.debug(`👤 No token provided, using anonymous user: ${anonymousId}`);
        loggedAnonymousUsers.add(anonymousId);
      }

      req.user = { 
        uid: anonymousId, 
        email: null, 
        isAnonymous: true 
      };
      return next();
    }

    const token = authHeader.split(' ')[1];
    Logger.debug('🔐 Verifying Firebase token...');
    const decodedToken = await admin.auth().verifyIdToken(token);

    Logger.info(`✅ Token verified for user: ${decodedToken.email}`);
    req.user = {
      uid: decodedToken.uid,
      email: decodedToken.email,
      isAnonymous: false
    };

    next();
  } catch (error) {
    Logger.warn('❌ Token verification failed:', error.code || 'unknown', '-', error.message);

    // Fall back to anonymous user on error
    const clientIP = req.ip || req.connection.remoteAddress || req.socket.remoteAddress || 'unknown';
    const userAgent = req.headers['user-agent'] || 'unknown';
    const anonymousId = `anonymous-${clientIP}-${Buffer.from(userAgent).toString('base64').substring(0, 8)}`;
    
    Logger.debug(`🔄 Falling back to anonymous user: ${anonymousId}`);
    req.user = { 
      uid: anonymousId, 
      email: null, 
      isAnonymous: true 
    };
    next();
  }
};