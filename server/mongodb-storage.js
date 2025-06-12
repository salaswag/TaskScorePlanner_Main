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

  async getTasks(userId) {
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

  async createTask(taskData, userId) {
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

  // User authentication methods
  async getUser(id) {
    try {
      const user = await this.usersCollection.findOne({ id });
      if (!user) return null;
      return {
        id: user.id,
        username: user.username,
        createdAt: user.createdAt
      };
    } catch (error) {
      console.error('Error fetching user:', error);
      return null;
    }
  }

  async getUserByUsername(username) {
    try {
      const user = await this.usersCollection.findOne({ username });
      if (!user) return null;
      return {
        id: user.id,
        username: user.username,
        password: user.password,
        createdAt: user.createdAt
      };
    } catch (error) {
      console.error('Error fetching user by username:', error);
      return null;
    }
  }

  async createUser(userData) {
    try {
      const hashedPassword = await bcrypt.hash(userData.password, 10);
      const user = {
        id: nanoid(),
        username: userData.username,
        password: hashedPassword,
        createdAt: new Date()
      };
      
      await this.usersCollection.insertOne(user);
      return {
        id: user.id,
        username: user.username,
        createdAt: user.createdAt
      };
    } catch (error) {
      console.error('Error creating user:', error);
      throw error;
    }
  }

  async verifyUser(username, password) {
    try {
      const user = await this.getUserByUsername(username);
      if (!user) return null;
      
      const isValid = await bcrypt.compare(password, user.password);
      if (!isValid) return null;
      
      return {
        id: user.id,
        username: user.username,
        createdAt: user.createdAt
      };
    } catch (error) {
      console.error('Error verifying user:', error);
      return null;
    }
  }
}

export const mongoStorage = new MongoStorage();