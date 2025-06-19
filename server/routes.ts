import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { mongoStorage } from "./mongodb-storage.js";
import { insertTaskSchema, updateTaskSchema } from "@shared/schema";
import { z } from "zod";
import { authenticateUser } from "./middleware/auth-middleware.js";
import "./types"; // Import session type declarations

export async function registerRoutes(app: Express): Promise<Server> {
  // Add Firebase authentication middleware to all routes
  app.use(authenticateUser);
  
  // Always try to use MongoDB storage, only fallback to in-memory if MongoDB is completely unavailable
  let activeStorage = mongoStorage;
  
  // Test MongoDB connection before each request by trying a simple operation
  const testMongoConnection = async () => {
    try {
      if (!mongoStorage.client || !mongoStorage.tasksCollection) {
        console.log("MongoDB client not available, attempting reconnection...");
        const reconnected = await mongoStorage.connect();
        if (!reconnected) {
          throw new Error("Failed to reconnect to MongoDB");
        }
      }
      // Test with a simple ping operation
      await mongoStorage.tasksCollection.findOne({}, { limit: 1 });
      return true;
    } catch (error) {
      console.error("MongoDB connection test failed:", error);
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
      console.log('Task creation request received');
      console.log('Request body:', req.body);
      console.log('User:', req.user);
      
      const validatedData = insertTaskSchema.parse(req.body);
      console.log('Validated data:', validatedData);
      
      const userId = req.user?.uid || 'anonymous';
      const isAnonymous = !req.user || req.user.isAnonymous;
      
      // Anonymous users ALWAYS use in-memory storage
      if (isAnonymous) {
        console.log("👤 Anonymous user - creating task in in-memory storage");
        const taskWithUser = { ...validatedData, userId };
        const task = await storage.createTask(taskWithUser);
        console.log('Anonymous task created successfully:', task);
        res.status(201).json(task);
        return;
      }
      
      // Authenticated users try MongoDB first
      const mongoAvailable = await testMongoConnection();
      const storageToUse = mongoAvailable ? mongoStorage : storage;
      
      if (!mongoAvailable) {
        console.warn("⚠️  Authenticated user creating task in in-memory storage - MongoDB unavailable");
      } else {
        console.log("✅ Authenticated user creating task in MongoDB storage");
      }
      
      const taskWithUser = { ...validatedData, userId };
      console.log('Task with user:', taskWithUser);
      
      const task = await storageToUse.createTask(taskWithUser);
      console.log('Task created successfully:', task);
      res.status(201).json(task);
    } catch (error) {
      if (error instanceof z.ZodError) {
        console.error('Validation error:', error.errors);
        res.status(400).json({ message: "Invalid task data", errors: error.errors });
      } else {
        console.error("Error creating task:", error);
        res.status(500).json({ message: "Failed to create task" });
      }
    }
  });

  // Update a task (mainly for completion)
  app.patch("/api/tasks/:id", async (req, res) => {
    try {
      const id = req.params.id;
      console.log('Updating task with ID:', id, 'Data:', req.body);

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
      // Always try MongoDB first
      const mongoAvailable = await testMongoConnection();

  // Transfer anonymous data to authenticated user
  app.post("/api/auth/transfer-data", async (req, res) => {
    try {
      const { anonymousUid, permanentUid } = req.body;
      
      if (!anonymousUid || !permanentUid) {
        return res.status(400).json({ message: "Both anonymousUid and permanentUid are required" });
      }

      const mongoAvailable = await testMongoConnection();
      
      if (!mongoAvailable) {
        console.warn("⚠️  Data transfer requires MongoDB - unavailable");
        return res.status(503).json({ message: "Data transfer requires MongoDB" });
      }
      
      const success = await mongoStorage.transferUserData(anonymousUid, permanentUid);
      
      if (success) {
        res.json({ message: "Data transferred successfully" });
      } else {
        res.status(500).json({ message: "Failed to transfer data" });
      }
    } catch (error) {
      console.error("Error transferring data:", error);
      res.status(500).json({ message: "Failed to transfer data" });
    }
  });


      const storageToUse = mongoAvailable ? mongoStorage : storage;
      
      if (!mongoAvailable) {
        console.warn("⚠️  Getting archived tasks from in-memory storage - MongoDB unavailable");
        return res.json([]);
      } else {
        console.log("✅ Getting archived tasks from MongoDB storage");
      }
      
      const archivedTasks = await storageToUse.getArchivedTasks();
      res.json(archivedTasks);
    } catch (error) {
      console.error("Error fetching archived tasks:", error);
      res.status(500).json({ message: "Failed to fetch archived tasks" });
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
        timeData[entry.date] = entry.timeInMinutes;
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
      const { date, timeInMinutes } = req.body;
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
      
      const timeEntry = await mongoStorage.updateTimeEntry(date, timeInMinutes, userId);
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