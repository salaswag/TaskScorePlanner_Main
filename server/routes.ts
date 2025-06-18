import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { mongoStorage } from "./mongodb-storage.js";
import { insertTaskSchema, updateTaskSchema } from "@shared/schema";
import { z } from "zod";
import "./types"; // Import session type declarations

export async function registerRoutes(app: Express): Promise<Server> {
  // Determine which storage to use
  const activeStorage = mongoStorage.client ? mongoStorage : storage;

  // Get all tasks
  app.get("/api/tasks", async (req, res) => {
    try {
      const tasks = await activeStorage.getTasks();
      res.json(tasks);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch tasks" });
    }
  });

  // Create a new task
  app.post("/api/tasks", async (req, res) => {
    try {
      const validatedData = insertTaskSchema.parse(req.body);
      const task = await activeStorage.createTask(validatedData);
      res.status(201).json(task);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: "Invalid task data", errors: error.errors });
      } else {
        res.status(500).json({ message: "Failed to create task" });
      }
    }
  });

  // Update a task (mainly for completion)
  app.patch("/api/tasks/:id", async (req, res) => {
    try {
      const id = req.params.id;
      console.log('Updating task with ID:', id, 'Data:', req.body);

      let updateData;

      if (activeStorage === storage) {
        // In-memory storage expects numeric id
        updateData = { id: Number(id), ...req.body };
      } else {
        // MongoDB storage expects string id or numeric id
        updateData = { id: isNaN(Number(id)) ? id : Number(id), ...req.body };
      }

      const updatedTask = await activeStorage.updateTask(updateData);

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
      let deleted: boolean;
      if (activeStorage === storage) {
        // In-memory storage expects a number
        const idNum = Number(idParam);
        if (isNaN(idNum)) {
          return res.status(400).json({ message: "Invalid task id" });
        }
        deleted = await activeStorage.deleteTask(idNum);
      } else {
        // MongoDB storage expects a string
        deleted = await activeStorage.deleteTask(idParam as string);
      }
      if (!deleted) {
        return res.status(404).json({ message: "Task not found" });
      }

      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Failed to delete task" });
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