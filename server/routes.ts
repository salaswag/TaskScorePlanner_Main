import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { mongoStorage } from "./mongodb-storage.js";
import { insertTaskSchema, updateTaskSchema, insertCategorySchema, updateCategorySchema } from "@shared/schema";
import { z } from "zod";
import { authenticateUser } from "./middleware/auth-middleware.js";
import { Logger } from "./logger.js";
import "./types"; // Import session type declarations

function convertLegacyToPercent(entry: any): number | null {
  if (entry.deepWorkPercent !== undefined && entry.deepWorkPercent !== null) {
    // Treat 50 as "not set" — 50/50 is the default slider position, not an intentional entry
    return entry.deepWorkPercent === 50 ? null : entry.deepWorkPercent;
  }
  const deepMap: Record<string, number> = {
    'lots-deep-work': 90,
    'some-deep-work': 70,
    'little-deep-work': 40,
    'no-deep-work': 15,
  };
  if (entry.deepWork && entry.deepWork !== 'none' && deepMap[entry.deepWork] !== undefined) {
    return deepMap[entry.deepWork];
  }
  const shallowMap: Record<string, number> = {
    'lots-shallow-needed': 20,
    'some-shallow-needed': 40,
    'some-shallow-not-needed': 60,
    'lots-shallow-not-needed': 80,
    'no-shallow-work': 95,
  };
  if (entry.shallowWork && entry.shallowWork !== 'none' && shallowMap[entry.shallowWork] !== undefined) {
    return shallowMap[entry.shallowWork];
  }
  return null;
}

// Simple rate limiting middleware
const rateLimitMap = new Map();
const rateLimit = (maxRequests = 100, windowMs = 60000) => {
  return (req, res, next) => {
    const clientId = req.ip || req.connection.remoteAddress || 'unknown';
    const now = Date.now();
    const windowStart = now - windowMs;
    
    if (!rateLimitMap.has(clientId)) {
      rateLimitMap.set(clientId, []);
    }
    
    const requests = rateLimitMap.get(clientId);
    const recentRequests = requests.filter(time => time > windowStart);
    
    if (recentRequests.length >= maxRequests) {
      return res.status(429).json({ message: 'Too many requests' });
    }
    
    requests.push(now);
    rateLimitMap.set(clientId, recentRequests.concat([now]));
    
    // Clean up old entries periodically
    if (Math.random() < 0.01) {
      for (const [key, times] of rateLimitMap.entries()) {
        const filtered = times.filter(time => time > windowStart);
        if (filtered.length === 0) {
          rateLimitMap.delete(key);
        } else {
          rateLimitMap.set(key, filtered);
        }
      }
    }
    
    next();
  };
};

export async function registerRoutes(app: Express): Promise<Server> {
  // Add rate limiting to API routes
  app.use('/api', rateLimit(200, 60000)); // 200 requests per minute
  
  // Add Firebase authentication middleware to all routes
  app.use(authenticateUser);
  
  // Always try to use MongoDB storage, only fallback to in-memory if MongoDB is completely unavailable
  let activeStorage = mongoStorage;
  let mongoConnectionStatus = { isAvailable: true, lastCheck: 0, checkInterval: 30000 }; // 30 seconds
  
  // Test MongoDB connection with timeout and caching
  const testMongoConnection = async () => {
    const now = Date.now();
    
    // Use cached status if within check interval
    if (now - mongoConnectionStatus.lastCheck < mongoConnectionStatus.checkInterval) {
      return mongoConnectionStatus.isAvailable;
    }
    
    try {
      if (!mongoStorage.client || !mongoStorage.tasksCollection) {
        console.log("MongoDB client not available, attempting reconnection...");
        const reconnected = await mongoStorage.connect();
        if (!reconnected) {
          throw new Error("Failed to reconnect to MongoDB");
        }
      }
      
      // Test with a simple ping operation with timeout
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('MongoDB connection timeout')), 3000)
      );
      
      await Promise.race([
        mongoStorage.tasksCollection.findOne({}, { limit: 1 }),
        timeoutPromise
      ]);
      
      mongoConnectionStatus.isAvailable = true;
      mongoConnectionStatus.lastCheck = now;
      return true;
    } catch (error) {
      console.error("MongoDB connection test failed:", error);
      mongoConnectionStatus.isAvailable = false;
      mongoConnectionStatus.lastCheck = now;
      // Reduce check interval if MongoDB is down to avoid spam
      mongoConnectionStatus.checkInterval = 60000; // 1 minute
      return false;
    }
  };
  
  console.log("MongoDB storage prioritized - in-memory storage will only be used if MongoDB is completely unavailable");

  // Get all tasks
  app.get("/api/tasks", async (req, res) => {
    try {
      const userId = req.user?.uid || 'anonymous';
      const isAnonymous = !req.user || req.user.isAnonymous;
      
      // Anonymous users ALWAYS use in-memory storage
      if (isAnonymous) {
        console.log("👤 Anonymous user - using in-memory storage");
        const tasks = await storage.getTasks(userId);
        res.json(tasks);
        return;
      }
      
      // Authenticated users try MongoDB first
      const mongoAvailable = await testMongoConnection();
      const storageToUse = mongoAvailable ? mongoStorage : storage;
      
      if (!mongoAvailable) {
        console.warn("⚠️  Authenticated user using in-memory storage - MongoDB unavailable");
      } else {
        console.log("✅ Authenticated user using MongoDB storage");
      }
      
      const tasks = await storageToUse.getTasks(userId);
      res.json(tasks);
    } catch (error) {
      console.error("Error fetching tasks:", error);
      res.status(500).json({ message: "Failed to fetch tasks" });
    }
  });

  // Create a new task
  app.post("/api/tasks", async (req, res) => {
    try {
      Logger.debug('Task creation request received');
      Logger.debug('Request body:', req.body);
      Logger.debug('User:', req.user);
      
      // Validate required fields
      if (!req.body || typeof req.body !== 'object') {
        return res.status(400).json({ message: "Request body must be a valid JSON object" });
      }

      if (!req.body.title || typeof req.body.title !== 'string' || req.body.title.trim().length === 0) {
        return res.status(400).json({ message: "Task title is required and must be a non-empty string" });
      }

      const validatedData = insertTaskSchema.parse(req.body);
      
      // Ensure isLater and isFocus are mutually exclusive
      if (validatedData.isLater && validatedData.isFocus) {
        return res.status(400).json({ message: "Task cannot be both in 'Later' and 'Focus' state simultaneously" });
      }
      
      // Validate priority range
      if (validatedData.priority && (validatedData.priority < 1 || validatedData.priority > 10)) {
        return res.status(400).json({ message: "Priority must be between 1 and 10" });
      }
      
      Logger.debug('Validated data:', validatedData);
      
      const userId = req.user?.uid || 'anonymous';
      const isAnonymous = !req.user || req.user.isAnonymous;
      
      // Anonymous users ALWAYS use in-memory storage
      if (isAnonymous) {
        Logger.debug("👤 Anonymous user - creating task in in-memory storage for session:", userId);
        try {
          const task = await storage.createTask(validatedData, userId);
          console.log('Anonymous task created successfully:', task);
          res.status(201).json(task);
          return;
        } catch (storageError) {
          console.error("Error creating task in in-memory storage:", storageError);
          return res.status(500).json({ message: "Failed to create task in session storage" });
        }
      }
      
      // Authenticated users try MongoDB first
      let mongoAvailable = false;
      try {
        mongoAvailable = await testMongoConnection();
      } catch (connectionError) {
        console.error("Error testing MongoDB connection:", connectionError);
        mongoAvailable = false;
      }
      
      const storageToUse = mongoAvailable ? mongoStorage : storage;
      
      if (!mongoAvailable) {
        console.warn("⚠️  Authenticated user creating task in in-memory storage - MongoDB unavailable");
      } else {
        console.log("✅ Authenticated user creating task in MongoDB storage");
      }
      
      const taskWithUser = { ...validatedData, userId };
      console.log('Task with user:', taskWithUser);
      
      try {
        const task = await storageToUse.createTask(taskWithUser);
        console.log('Task created successfully:', task);
        res.status(201).json(task);
      } catch (storageError) {
        console.error("Error creating task in storage:", storageError);
        
        // Try fallback to in-memory storage if MongoDB fails
        if (storageToUse === mongoStorage) {
          console.log("Attempting fallback to in-memory storage...");
          try {
            const task = await storage.createTask(taskWithUser);
            console.log('Task created successfully in fallback storage:', task);
            res.status(201).json(task);
          } catch (fallbackError) {
            console.error("Fallback storage also failed:", fallbackError);
            res.status(500).json({ message: "Failed to create task in both primary and fallback storage" });
          }
        } else {
          res.status(500).json({ message: "Failed to create task" });
        }
      }
    } catch (error) {
      if (error instanceof z.ZodError) {
        console.error('Validation error:', error.errors);
        res.status(400).json({ message: "Invalid task data", errors: error.errors });
      } else {
        console.error("Unexpected error creating task:", error);
        res.status(500).json({ message: "An unexpected error occurred while creating the task" });
      }
    }
  });

  // Update a task (mainly for completion)
  app.patch("/api/tasks/:id", async (req, res) => {
    try {
      const id = req.params.id;
      console.log('Updating task with ID:', id, 'Data:', req.body);

      // Validate mutually exclusive fields
      if (req.body.isLater && req.body.isFocus) {
        return res.status(400).json({ message: "Task cannot be both in 'Later' and 'Focus' state simultaneously" });
      }

      const isAnonymous = !req.user || req.user.isAnonymous;
      
      // Anonymous users ALWAYS use in-memory storage
      if (isAnonymous) {
        console.log("👤 Anonymous user - updating task in in-memory storage");
        const updateData = { id: Number(id), ...req.body };
        const updatedTask = await storage.updateTask(updateData);
        
        if (!updatedTask) {
          return res.status(404).json({ message: "Task not found" });
        }
        
        res.json(updatedTask);
        return;
      }

      // Authenticated users try MongoDB first
      const mongoAvailable = await testMongoConnection();
      const storageToUse = mongoAvailable ? mongoStorage : storage;
      
      if (!mongoAvailable) {
        console.warn("⚠️  Authenticated user updating task in in-memory storage - MongoDB unavailable");
      } else {
        console.log("✅ Authenticated user updating task in MongoDB storage");
      }

      let updateData;

      if (storageToUse === storage) {
        // In-memory storage expects numeric id
        updateData = { id: Number(id), ...req.body };
      } else {
        // MongoDB storage expects string id or numeric id
        updateData = { id: isNaN(Number(id)) ? id : Number(id), ...req.body };
      }

      const updatedTask = await storageToUse.updateTask(updateData);

      if (!updatedTask) {
        return res.status(404).json({ message: "Task not found" });
      }

      res.json(updatedTask);
    } catch (error) {
      console.error('Update error:', error);
      res.status(500).json({ message: "Failed to update task" });
    }
  });

  // Delete a task
  app.delete("/api/tasks/:id", async (req, res) => {
    try {
      const idParam = req.params.id;
      const isAnonymous = !req.user || req.user.isAnonymous;
      
      // Anonymous users ALWAYS use in-memory storage
      if (isAnonymous) {
        console.log("👤 Anonymous user - deleting task from in-memory storage");
        const idNum = Number(idParam);
        if (isNaN(idNum)) {
          return res.status(400).json({ message: "Invalid task id" });
        }
        const deleted = await storage.deleteTask(idNum);
        
        if (!deleted) {
          return res.status(404).json({ message: "Task not found" });
        }
        
        res.status(204).send();
        return;
      }
      
      // Authenticated users try MongoDB first
      const mongoAvailable = await testMongoConnection();
      const storageToUse = mongoAvailable ? mongoStorage : storage;
      
      if (!mongoAvailable) {
        console.warn("⚠️  Authenticated user deleting task from in-memory storage - MongoDB unavailable");
      } else {
        console.log("✅ Authenticated user deleting task from MongoDB storage");
      }
      
      let deleted: boolean;
      if (storageToUse === storage) {
        // In-memory storage expects a number
        const idNum = Number(idParam);
        if (isNaN(idNum)) {
          return res.status(400).json({ message: "Invalid task id" });
        }
        deleted = await storageToUse.deleteTask(idNum);
      } else {
        // MongoDB storage expects a string
        deleted = await storageToUse.deleteTask(idParam as string);
      }
      if (!deleted) {
        return res.status(404).json({ message: "Task not found" });
      }

      res.status(204).send();
    } catch (error) {
      console.error("Error deleting task:", error);
      res.status(500).json({ message: "Failed to delete task" });
    }
  });

  // Archive all completed tasks (bulk)
  app.post("/api/tasks/archive-completed", async (req, res) => {
    try {
      const userId = req.user?.uid || 'anonymous';
      const isAnonymous = !req.user || req.user.isAnonymous;

      if (isAnonymous) {
        return res.status(403).json({ message: "Anonymous users cannot archive tasks" });
      }

      const mongoAvailable = await testMongoConnection();
      if (!mongoAvailable) {
        return res.status(503).json({ message: "Archive functionality requires MongoDB" });
      }

      const count = await mongoStorage.archiveCompletedTasks(userId);
      res.status(200).json({ message: `${count} tasks archived`, count });
    } catch (error) {
      console.error("Error archiving completed tasks:", error);
      res.status(500).json({ message: "Failed to archive completed tasks" });
    }
  });

  // Archive a task
  app.post("/api/tasks/:id/archive", async (req, res) => {
    try {
      const idParam = req.params.id;
      
      // Always try MongoDB first
      const mongoAvailable = await testMongoConnection();
      const storageToUse = mongoAvailable ? mongoStorage : storage;
      
      if (!mongoAvailable) {
        console.warn("⚠️  Archiving task in in-memory storage - MongoDB unavailable");
        return res.status(503).json({ message: "Archive functionality requires MongoDB" });
      } else {
        console.log("✅ Archiving task in MongoDB storage");
      }
      
      const archived = await storageToUse.archiveTask(idParam);
      
      if (!archived) {
        return res.status(404).json({ message: "Task not found or failed to archive" });
      }

      res.status(200).json({ message: "Task archived successfully" });
    } catch (error) {
      console.error("Error archiving task:", error);
      res.status(500).json({ message: "Failed to archive task" });
    }
  });

  // Get archived tasks
  app.get("/api/tasks/archived", async (req, res) => {
    try {
      const userId = req.user?.uid || 'anonymous';
      const isAnonymous = !req.user || req.user.isAnonymous;

      // Anonymous users have no archive
      if (isAnonymous) {
        return res.json([]);
      }

      const mongoAvailable = await testMongoConnection();

      if (!mongoAvailable) {
        console.warn("⚠️  MongoDB unavailable for archived tasks");
        return res.json([]);
      }

      const archivedTasks = await mongoStorage.getArchivedTasks(userId);
      res.json(archivedTasks);
    } catch (error) {
      console.error("Error fetching archived tasks:", error);
      res.status(500).json({ message: "Failed to fetch archived tasks" });
    }
  });

  // Transfer anonymous data to authenticated user
  app.post("/api/auth/transfer-data", async (req, res) => {
    try {
      const { anonymousUid, permanentUid } = req.body;

      if (!anonymousUid || !permanentUid) {
        return res.status(400).json({ message: "Both anonymousUid and permanentUid are required" });
      }

      Logger.info("Starting data transfer", { anonymousUid, permanentUid });

      // Try MongoDB first for authenticated users
      const mongoAvailable = await testMongoConnection();

      if (mongoAvailable) {
        Logger.info("📤 Transferring data via MongoDB...");
        try {
          const success = await mongoStorage.transferUserData(anonymousUid, permanentUid);

          if (success) {
            Logger.info("Data transfer completed successfully via MongoDB");
            res.json({ message: "Data transferred successfully" });
            return;
          } else {
            Logger.warn("MongoDB transfer reported failure, trying in-memory fallback");
          }
        } catch (mongoError) {
          Logger.error("MongoDB transfer failed:", mongoError);
        }
      }

      // Fall back to in-memory storage transfer
      Logger.info("📤 Transferring session data from in-memory storage...");
      try {
        const success = await storage.transferSessionData(anonymousUid, permanentUid);

        if (success) {
          Logger.info("Session data transfer completed successfully");
          res.json({ message: "Session data transferred successfully" });
        } else {
          Logger.error("In-memory transfer also failed");
          res.status(500).json({ message: "Failed to transfer session data" });
        }
      } catch (memoryError) {
        Logger.error("In-memory transfer error:", memoryError);
        res.status(500).json({ message: "Failed to transfer data" });
      }
    } catch (error) {
      Logger.error("Error in data transfer endpoint:", error);
      res.status(500).json({ message: "Failed to transfer data" });
    }
  });

  // Get time entries
  app.get("/api/time-entries", async (req, res) => {
    try {
      const userId = req.user?.uid || 'anonymous';
      const isAnonymous = !req.user || req.user.isAnonymous;
      
      // Anonymous users cannot access time entries
      if (isAnonymous) {
        console.log("👤 Anonymous user - time entries not available");
        return res.status(401).json({ message: "Authentication required for time entries" });
      }
      
      const mongoAvailable = await testMongoConnection();
      
      if (!mongoAvailable) {
        console.warn("⚠️  Time entries require MongoDB - unavailable");
        return res.json({});
      }
      
      console.log("✅ Getting time entries for user:", userId);
      const timeEntries = await mongoStorage.getTimeEntries(userId);
      
      // Convert to date-indexed object for easier frontend usage
      const timeData = {};
      timeEntries.forEach(entry => {
        timeData[entry.date] = {
          timeInMinutes: entry.timeInMinutes,
          deepWorkPercent: convertLegacyToPercent(entry),
          notes: entry.notes || '',
        };
      });
      
      console.log("📅 Time entries for user", userId, ":", Object.keys(timeData).length, "entries");
      res.json(timeData);
    } catch (error) {
      console.error("Error fetching time entries:", error);
      res.status(500).json({ message: "Failed to fetch time entries" });
    }
  });

  // Update/create time entry
  app.post("/api/time-entries", async (req, res) => {
    try {
      const { date, timeInMinutes, deepWorkPercent, notes } = req.body;
      const userId = req.user?.uid || 'anonymous';
      const isAnonymous = !req.user || req.user.isAnonymous;
      
      // Anonymous users cannot create time entries
      if (isAnonymous) {
        console.log("👤 Anonymous user - time entries not available");
        return res.status(401).json({ message: "Authentication required for time entries" });
      }
      
      if (!date || timeInMinutes === undefined) {
        return res.status(400).json({ message: "Date and timeInMinutes are required" });
      }
      
      const mongoAvailable = await testMongoConnection();
      
      if (!mongoAvailable) {
        console.warn("⚠️  Time entries require MongoDB - unavailable");
        return res.status(503).json({ message: "Time entries require MongoDB" });
      }
      
      // Treat 50 as "not set" — the default slider position isn't an intentional entry
      const effectivePct = (deepWorkPercent != null && deepWorkPercent !== 50) ? deepWorkPercent : null;
      const timeEntry = await mongoStorage.updateTimeEntry(
        date,
        timeInMinutes,
        userId,
        effectivePct,
        notes || ''
      );
      res.json(timeEntry);
    } catch (error) {
      console.error("Error updating time entry:", error);
      res.status(500).json({ message: "Failed to update time entry" });
    }
  });

  // Delete time entry
  app.delete("/api/time-entries/:date", async (req, res) => {
    try {
      const { date } = req.params;
      const userId = req.user?.uid || 'anonymous';
      const isAnonymous = !req.user || req.user.isAnonymous;
      
      // Anonymous users cannot delete time entries
      if (isAnonymous) {
        console.log("👤 Anonymous user - time entries not available");
        return res.status(401).json({ message: "Authentication required for time entries" });
      }
      
      const mongoAvailable = await testMongoConnection();
      
      if (!mongoAvailable) {
        console.warn("⚠️  Time entries require MongoDB - unavailable");
        return res.status(503).json({ message: "Time entries require MongoDB" });
      }
      
      const deleted = await mongoStorage.deleteTimeEntry(date, userId);
      
      if (!deleted) {
        return res.status(404).json({ message: "Time entry not found" });
      }
      
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting time entry:", error);
      res.status(500).json({ message: "Failed to delete time entry" });
    }
  });





  // Get user settings
  app.get("/api/settings", async (req, res) => {
    try {
      const userId = req.user?.uid;
      const isAnonymous = !req.user || req.user.isAnonymous;

      if (isAnonymous || !userId) {
        // Anonymous users: return empty settings (client uses localStorage)
        return res.json({ openaiApiKey: '', voicePrompt: '' });
      }

      const mongoAvailable = await testMongoConnection();
      if (!mongoAvailable) {
        return res.status(503).json({ message: "Settings require MongoDB" });
      }

      const settings = await mongoStorage.getSettings(userId);
      // Mask API key for security — only show last 4 chars
      const maskedKey = settings.openaiApiKey
        ? '***' + settings.openaiApiKey.slice(-4)
        : '';

      res.json({
        openaiApiKey: maskedKey,
        voicePrompt: settings.voicePrompt || '',
        hasApiKey: !!settings.openaiApiKey,
      });
    } catch (error) {
      console.error("Error fetching settings:", error);
      res.status(500).json({ message: "Failed to fetch settings" });
    }
  });

  // Update user settings
  app.post("/api/settings", async (req, res) => {
    try {
      const userId = req.user?.uid;
      const isAnonymous = !req.user || req.user.isAnonymous;

      if (isAnonymous || !userId) {
        return res.status(401).json({ message: "Authentication required to save settings" });
      }

      const mongoAvailable = await testMongoConnection();
      if (!mongoAvailable) {
        return res.status(503).json({ message: "Settings require MongoDB" });
      }

      const { openaiApiKey, voicePrompt } = req.body;
      const updateData: any = {};

      // Only update API key if it's not the masked placeholder
      if (openaiApiKey !== undefined && !openaiApiKey.startsWith('***')) {
        updateData.openaiApiKey = openaiApiKey;
      }
      if (voicePrompt !== undefined) {
        updateData.voicePrompt = voicePrompt;
      }

      const success = await mongoStorage.updateSettings(userId, updateData);
      if (success) {
        res.json({ message: "Settings saved successfully" });
      } else {
        res.status(500).json({ message: "Failed to save settings" });
      }
    } catch (error) {
      console.error("Error updating settings:", error);
      res.status(500).json({ message: "Failed to save settings" });
    }
  });

  // Transcribe audio using OpenAI Whisper + GPT formatting
  app.post("/api/transcribe", async (req, res) => {
    try {
      const userId = req.user?.uid;
      const isAnonymous = !req.user || req.user.isAnonymous;

      if (isAnonymous || !userId) {
        return res.status(401).json({ message: "Authentication required for transcription" });
      }

      const mongoAvailable = await testMongoConnection();
      if (!mongoAvailable) {
        return res.status(503).json({ message: "Transcription requires MongoDB for API key storage" });
      }

      // Get user's OpenAI API key
      const settings = await mongoStorage.getSettings(userId);
      if (!settings.openaiApiKey) {
        return res.status(400).json({ message: "OpenAI API key not configured. Please add it in Settings." });
      }

      const { audio, mimeType } = req.body;
      if (!audio) {
        return res.status(400).json({ message: "Audio data is required" });
      }

      // Convert base64 audio to a Blob for the Whisper API
      const audioBuffer = Buffer.from(audio, 'base64');
      const audioBlob = new Blob([audioBuffer], { type: mimeType || 'audio/webm' });

      // Step 1: Transcribe with Whisper
      const formData = new FormData();
      formData.append('file', audioBlob, 'recording.webm');
      formData.append('model', 'whisper-1');

      const whisperRes = await fetch('https://api.openai.com/v1/audio/transcriptions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${settings.openaiApiKey}`,
        },
        body: formData,
      });

      if (!whisperRes.ok) {
        const errorText = await whisperRes.text();
        console.error('Whisper API error:', errorText);
        return res.status(502).json({ message: "Transcription failed. Check your OpenAI API key." });
      }

      const whisperData = await whisperRes.json() as any;
      const transcript = whisperData.text;

      if (!transcript || transcript.trim().length === 0) {
        return res.json({ transcript: '', formatted: '' });
      }

      // Step 2: Format with GPT-4o-mini
      const voicePrompt = settings.voicePrompt || 'Convert the following transcript into concise bullet points. Keep it brief and organized.';

      const gptRes = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${settings.openaiApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          messages: [
            { role: 'system', content: voicePrompt },
            { role: 'user', content: transcript },
          ],
          max_tokens: 1000,
          temperature: 0.3,
        }),
      });

      if (!gptRes.ok) {
        const errorText = await gptRes.text();
        console.error('GPT API error:', errorText);
        // Return raw transcript if formatting fails
        return res.json({ transcript, formatted: transcript });
      }

      const gptData = await gptRes.json() as any;
      const formatted = gptData.choices?.[0]?.message?.content || transcript;

      res.json({ transcript, formatted });
    } catch (error) {
      console.error("Error in transcription:", error);
      res.status(500).json({ message: "Transcription failed" });
    }
  });

  // Get planning data
  app.get("/api/planning-nodes", async (req, res) => {
    try {
      const userId = req.user?.uid;
      const isAnonymous = !req.user || req.user.isAnonymous;
      if (isAnonymous || !userId) {
        return res.status(401).json({ message: "Authentication required" });
      }
      const mongoAvailable = await testMongoConnection();
      if (!mongoAvailable) {
        return res.status(503).json({ message: "Planning requires MongoDB" });
      }
      const data = await mongoStorage.getPlanningData(userId);
      res.json(data);
    } catch (error) {
      console.error("Error fetching planning data:", error);
      res.status(500).json({ message: "Failed to fetch planning data" });
    }
  });

  // Save planning data
  app.post("/api/planning-nodes", async (req, res) => {
    try {
      const userId = req.user?.uid;
      const isAnonymous = !req.user || req.user.isAnonymous;
      if (isAnonymous || !userId) {
        return res.status(401).json({ message: "Authentication required" });
      }
      const mongoAvailable = await testMongoConnection();
      if (!mongoAvailable) {
        return res.status(503).json({ message: "Planning requires MongoDB" });
      }
      const { elements, appState, files, nodes, edges, viewport } = req.body;
      // Support both Excalidraw format (elements/appState/files) and legacy React Flow format
      const data = elements ? { elements, appState, files } : { nodes, edges, viewport };
      const success = await mongoStorage.savePlanningData(userId, data);
      if (success) {
        res.json({ message: "Planning data saved" });
      } else {
        res.status(500).json({ message: "Failed to save planning data" });
      }
    } catch (error) {
      console.error("Error saving planning data:", error);
      res.status(500).json({ message: "Failed to save planning data" });
    }
  });

  // ─── Category Endpoints ──────────────────────────────────────

  // Get all categories
  app.get("/api/categories", async (req, res) => {
    try {
      const userId = req.user?.uid || 'anonymous';
      const isAnonymous = !req.user || req.user.isAnonymous;

      if (isAnonymous) {
        return res.json([]);
      }

      const mongoAvailable = await testMongoConnection();
      if (!mongoAvailable) {
        return res.json([]);
      }

      const categories = await mongoStorage.getCategories(userId);
      res.json(categories);
    } catch (error) {
      console.error("Error fetching categories:", error);
      res.status(500).json({ message: "Failed to fetch categories" });
    }
  });

  // Create a category
  app.post("/api/categories", async (req, res) => {
    try {
      const userId = req.user?.uid || 'anonymous';
      const isAnonymous = !req.user || req.user.isAnonymous;

      if (isAnonymous) {
        return res.status(401).json({ message: "Authentication required" });
      }

      const validated = insertCategorySchema.parse(req.body);
      const mongoAvailable = await testMongoConnection();
      if (!mongoAvailable) {
        return res.status(503).json({ message: "Categories require MongoDB" });
      }

      const category = await mongoStorage.createCategory({ ...validated, userId });
      res.status(201).json(category);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid category data", errors: error.errors });
      }
      console.error("Error creating category:", error);
      res.status(500).json({ message: "Failed to create category" });
    }
  });

  // Update a category
  app.patch("/api/categories/:id", async (req, res) => {
    try {
      const userId = req.user?.uid || 'anonymous';
      const isAnonymous = !req.user || req.user.isAnonymous;

      if (isAnonymous) {
        return res.status(401).json({ message: "Authentication required" });
      }

      const validated = updateCategorySchema.parse(req.body);
      const mongoAvailable = await testMongoConnection();
      if (!mongoAvailable) {
        return res.status(503).json({ message: "Categories require MongoDB" });
      }

      const updated = await mongoStorage.updateCategory(req.params.id, userId, validated);
      if (!updated) {
        return res.status(404).json({ message: "Category not found" });
      }
      res.json(updated);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid category data", errors: error.errors });
      }
      console.error("Error updating category:", error);
      res.status(500).json({ message: "Failed to update category" });
    }
  });

  // Delete a category
  app.delete("/api/categories/:id", async (req, res) => {
    try {
      const userId = req.user?.uid || 'anonymous';
      const isAnonymous = !req.user || req.user.isAnonymous;

      if (isAnonymous) {
        return res.status(401).json({ message: "Authentication required" });
      }

      const mongoAvailable = await testMongoConnection();
      if (!mongoAvailable) {
        return res.status(503).json({ message: "Categories require MongoDB" });
      }

      const deleted = await mongoStorage.deleteCategory(req.params.id, userId);
      if (!deleted) {
        return res.status(404).json({ message: "Category not found" });
      }
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting category:", error);
      res.status(500).json({ message: "Failed to delete category" });
    }
  });

  // Move all tasks in a category to Later
  app.post("/api/categories/:name/to-later", async (req, res) => {
    try {
      const userId = req.user?.uid || 'anonymous';
      const isAnonymous = !req.user || req.user.isAnonymous;

      if (isAnonymous) {
        return res.status(401).json({ message: "Authentication required" });
      }

      const mongoAvailable = await testMongoConnection();
      if (!mongoAvailable) {
        return res.status(503).json({ message: "Requires MongoDB" });
      }

      const categoryName = decodeURIComponent(req.params.name);
      const count = await mongoStorage.moveCategoryToLater(categoryName, userId);
      res.json({ message: `${count} tasks moved to Later`, count });
    } catch (error) {
      console.error("Error moving category to later:", error);
      res.status(500).json({ message: "Failed to move category to later" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}

// In-memory storage implementation
class InMemoryStorage {
  private tasks: Map<number, any> = new Map();
  private timelineEvents: Map<number, any> = new Map();
  private taskIdCounter: number = 1;
  private timelineIdCounter: number = 1;

  async getTasks() {
    return Array.from(this.tasks.values());
  }

  async createTask(taskData: any) {
    const id = this.taskIdCounter++;
    const task = { id, ...taskData };
    this.tasks.set(id, task);
    return task;
  }

  async updateTask(taskData: any) {
    if (!this.tasks.has(taskData.id)) {
      return null;
    }
    this.tasks.set(taskData.id, { ...this.tasks.get(taskData.id), ...taskData });
    return this.tasks.get(taskData.id);
  }

  async deleteTask(id: number): Promise<boolean> {
    return this.tasks.delete(id);
  }

  async archiveTask(id: number): Promise<boolean> {
    // In-memory storage doesn't support archive - just return false
    console.log('Archive not supported in in-memory storage');
    return false;
  }

  async getArchivedTasks() {
    // In-memory storage doesn't support archive
    return [];
  }

  async getTimelineEvents() {
    return Array.from(this.timelineEvents.values());
  }

  async createTimelineEvent(eventData: any) {
    const id = this.timelineIdCounter++;
    const event = { id, ...eventData };
    this.timelineEvents.set(id, event);
    return event;
  }

  async updateTimelineEvent(eventData: any) {
    if (!this.timelineEvents.has(eventData.id)) {
      return null;
    }
    this.timelineEvents.set(eventData.id, { ...this.timelineEvents.get(eventData.id), ...eventData });
    return this.timelineEvents.get(eventData.id);
  }

  async deleteTimelineEvent(id: number): Promise<boolean> {
    return this.timelineEvents.delete(id);
  }
}

// MongoDB storage implementation
class MongoDBStorage {
  private client: any;
  private dbName: string;
  private tasksCollection: any;

  constructor(client: any, dbName: string) {
    this.client = client;
    this.dbName = dbName;
    this.tasksCollection = client.db(dbName).collection("tasks");
  }

  async getTasks() {
    return this.tasksCollection.find({}).toArray();
  }

  async createTask(taskData: any) {
    const result = await this.tasksCollection.insertOne(taskData);
    return { id: result.insertedId, ...taskData };
  }

  async updateTask(taskData: any) {
    const { id, ...updateData } = taskData;
    await this.tasksCollection.updateOne({ _id: id }, { $set: updateData });
    return this.getTaskById(id);
  }

  async deleteTask(id: string) {
    try {
      // Convert string id to ObjectId if necessary
      const { ObjectId } = require('mongodb');
      const objectId = typeof id === 'string' ? new ObjectId(id) : id;
      const result = await this.tasksCollection.deleteOne({ _id: objectId });
      return result.deletedCount > 0;
    } catch (error) {
      console.error('Error deleting task:', error);
      return false;
    }
  }

  private async getTaskById(id: string) {
    const { ObjectId } = require('mongodb');
    const objectId = new ObjectId(id);
    return this.tasksCollection.findOne({ _id: objectId });
  }
}