import { MongoClient } from 'mongodb';
import bcrypt from 'bcrypt';
import { nanoid } from 'nanoid';

const MONGODB_URI = "mongodb+srv://salaswag:Borderbiz8k@clusterfortask.riwouqe.mongodb.net/ClusterforTask";

export class MongoStorage {
  constructor() {
    this.client = null;
    this.db = null;
    this.tasksCollection = null;
    this.usersCollection = null;
  }

  async connect() {
    try {
      this.client = new MongoClient(MONGODB_URI, {
        connectTimeoutMS: 5000,
        serverSelectionTimeoutMS: 5000,
      });
      await this.client.connect();
      this.db = this.client.db('ClusterforTask');
      this.tasksCollection = this.db.collection('Tasks');
      this.usersCollection = this.db.collection('Users');
      console.log('Connected to MongoDB successfully');
      return true;
    } catch (error) {
      console.error('MongoDB connection error:', error);
      this.client = null;
      return false;
    }
  }

  async getTasks(userId = null) {
    try {
      const filter = userId ? { userId } : { $or: [{ userId: null }, { userId: { $exists: false } }] };
      const tasks = await this.tasksCollection.find(filter).sort({ createdAt: -1 }).toArray();
      return tasks.map(task => ({
        ...task,
        id: task._id.toString(),
        createdAt: task.createdAt || new Date(),
        completedAt: task.completedAt || null,
        actualTime: task.actualTime || null,
        userId: task.userId || null
      }));
    } catch (error) {
      console.error('Error fetching tasks:', error);
      return [];
    }
  }

  async getTask(id) {
    try {
      const task = await this.tasksCollection.findOne({ _id: id });
      if (!task) return undefined;
      return {
        ...task,
        id: task._id.toString(),
        createdAt: task.createdAt || new Date(),
        completedAt: task.completedAt || null,
        actualTime: task.actualTime || null
      };
    } catch (error) {
      console.error('Error fetching task:', error);
      return undefined;
    }
  }

  async createTask(taskData, userId = null) {
    try {
      const task = {
        ...taskData,
        priority: taskData.priority || 5,
        completed: false,
        actualTime: null,
        createdAt: new Date(),
        completedAt: null,
        userId: userId
      };
      
      const result = await this.tasksCollection.insertOne(task);
      return {
        ...task,
        id: result.insertedId.toString()
      };
    } catch (error) {
      console.error('Error creating task:', error);
      throw error;
    }
  }

  async updateTask(updateData) {
    try {
      const { id, ...updateFields } = updateData;
      
      if (updateFields.completedAt && typeof updateFields.completedAt === 'string') {
        updateFields.completedAt = new Date(updateFields.completedAt);
      }
      
      const result = await this.tasksCollection.findOneAndUpdate(
        { _id: id },
        { $set: updateFields },
        { returnDocument: 'after' }
      );
      
      if (!result.value) return undefined;
      
      return {
        ...result.value,
        id: result.value._id.toString()
      };
    } catch (error) {
      console.error('Error updating task:', error);
      return undefined;
    }
  }

  async deleteTask(id) {
    try {
      const result = await this.tasksCollection.deleteOne({ _id: id });
      return result.deletedCount > 0;
    } catch (error) {
      console.error('Error deleting task:', error);
      return false;
    }
  }

  // Legacy user methods (keeping for compatibility)
  async getUser(id) {
    return null;
  }

  async getUserByUsername(username) {
    return null;
  }

  async createUser(user) {
    return null;
  }
}

export const mongoStorage = new MongoStorage();