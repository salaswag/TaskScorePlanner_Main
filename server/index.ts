import express, { type Request, Response, NextFunction } from "express";
import session from "express-session";
import { EventEmitter } from "events";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import { MongoStorage } from "./mongodb-storage.js";

// Simple in-memory session store that persists across requests
class MemorySessionStore extends EventEmitter {
  constructor() {
    super();
    this.sessions = new Map();
  }

  get(sessionId, callback) {
    const session = this.sessions.get(sessionId);
    callback(null, session);
  }

  set(sessionId, session, callback) {
    this.sessions.set(sessionId, session);
    callback();
  }

  destroy(sessionId, callback) {
    this.sessions.delete(sessionId);
    callback();
  }

  length(callback) {
    callback(null, this.sessions.size);
  }

  clear(callback) {
    this.sessions.clear();
    callback();
  }

  // Clean up expired sessions periodically
  cleanup() {
    const now = Date.now();
    for (const [sessionId, session] of this.sessions.entries()) {
      if (session.cookie && session.cookie.expires && session.cookie.expires < now) {
        this.sessions.delete(sessionId);
      }
    }
  }
}

const sessionStore = new MemorySessionStore();

// Clean up expired sessions every hour
setInterval(() => {
  sessionStore.cleanup();
}, 60 * 60 * 1000);

// Import storage for session cleanup
import { storage } from "./storage";

// Clean up expired anonymous sessions every 6 hours
setInterval(() => {
  storage.cleanupSessions();
}, 6 * 60 * 60 * 1000);

export const mongoStorage = new MongoStorage();

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Session configuration
app.use(session({
  secret: process.env.SESSION_SECRET || 'dev-secret-change-in-production',
  resave: false,
  saveUninitialized: false,
  rolling: true, // Reset expiry on activity
  cookie: {
    secure: process.env.NODE_ENV === 'production', // HTTPS in production
    maxAge: 24 * 60 * 60 * 1000, // 24 hours
    httpOnly: true, // Prevent XSS
    sameSite: 'lax' // CSRF protection
  },
  store: sessionStore
}));

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }

      log(logLine);
    }
  });

  next();
});

(async () => {
  // Connect to MongoDB with timeout
  const connected = await mongoStorage.connect();
  if (!connected) {
    console.warn("MongoDB connection failed, using in-memory storage");
  }

  const server = await registerRoutes(app);

  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    res.status(status).json({ message });
    throw err;
  });

  // importantly only setup vite in development and after
  // setting up all the other routes so the catch-all route
  // doesn't interfere with the other routes
  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  // Use PORT environment variable for production deployments (like Render)
  // or fallback to 5000 for development
  const port = process.env.PORT || 5000;
  const host = process.env.NODE_ENV === 'production' ? '0.0.0.0' : '0.0.0.0';
  server.listen(port, host, () => {
    log(`serving on port ${port} in ${process.env.NODE_ENV || 'development'} mode`);
  });
})();

