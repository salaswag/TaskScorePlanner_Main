import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { mongoStorage } from "./mongodb-storage.js";
import { insertTaskSchema, updateTaskSchema } from "@shared/schema";
import { z } from "zod";
import "./types"; // Import session type declarations

export async function registerRoutes(app: Express): Promise<Server> {
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
      // Always try MongoDB first
      const mongoAvailable = await testMongoConnection();
      const storageToUse = mongoAvailable ? mongoStorage : storage;

      if (!mongoAvailable) {
        console.warn("⚠️  Using in-memory storage - MongoDB unavailable");
      } else {
        console.log("✅ Using MongoDB storage");
      }

      const tasks = await storageToUse.getTasks();
      res.json(tasks);
    } catch (error) {
      console.error("Error fetching tasks:", error);
      res.status(500).json({ message: "Failed to fetch tasks" });
    }
  });

  // Create a new task
  app.post("/api/tasks", async (req, res) => {
    try {
      const validatedData = insertTaskSchema.parse(req.body);

      // Always try MongoDB first
      const mongoAvailable = await testMongoConnection();
      const storageToUse = mongoAvailable ? mongoStorage : storage;

      if (!mongoAvailable) {
        console.warn("⚠️  Creating task in in-memory storage - MongoDB unavailable");
      } else {
        console.log("✅ Creating task in MongoDB storage");
      }

      const task = await storageToUse.createTask(validatedData);
      res.status(201).json(task);
    } catch (error) {
      if (error instanceof z.ZodError) {
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

      // Always try MongoDB first
      const mongoAvailable = await testMongoConnection();
      const storageToUse = mongoAvailable ? mongoStorage : storage;

      if (!mongoAvailable) {
        console.warn("⚠️  Updating task in in-memory storage - MongoDB unavailable");
      } else {
        console.log("✅ Updating task in MongoDB storage");
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

      // Always try MongoDB first
      const mongoAvailable = await testMongoConnection();
      const storageToUse = mongoAvailable ? mongoStorage : storage;

      if (!mongoAvailable) {
        console.warn("⚠️  Deleting task from in-memory storage - MongoDB unavailable");
      } else {
        console.log("✅ Deleting task from MongoDB storage");
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

  // Update task
  app.put('/api/tasks/:id', async (req, res) => {
    try {
      const taskId = parseInt(req.params.id);

      // Validate request body
      if (!req.body || typeof req.body !== 'object') {
        return res.status(400).json({ error: 'Invalid request body' });
      }

      const updatedTask = await storage.updateTask(taskId, req.body);
      res.json(updatedTask);
    } catch (error) {
      console.error('Error updating task:', error);
      res.status(500).json({ error: 'Failed to update task' });
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