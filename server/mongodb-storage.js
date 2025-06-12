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

  async connect(retries = 3) {
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
      console.error(`MongoDB connection failed (attempt ${4 - retries}/3):`, error.message);

      if (retries > 1) {
        console.log(`Retrying connection in 2 seconds...`);
        await new Promise(resolve => setTimeout(resolve, 2000));
        return this.connect(retries - 1);
      }
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

      // Convert string ID to ObjectId if needed
      const { ObjectId } = await import('mongodb');
      const objectId = typeof id === 'string' && id.length === 24 ? new ObjectId(id) : id;

      const result = await this.tasksCollection.findOneAndUpdate(
        { _id: objectId },
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
      // Convert string ID to ObjectId if needed
      const { ObjectId } = await import('mongodb');
      const objectId = typeof id === 'string' && id.length === 24 ? new ObjectId(id) : id;

      const result = await this.tasksCollection.deleteOne({ _id: objectId });
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

  async createUser(userData) {
    try {
      if (!userData.username || !userData.password) {
        throw new Error('Username and password are required');
      }

      if (userData.password.length < 6) {
        throw new Error('Password must be at least 6 characters long');
      }

      // Check if username is already taken
      const existingUser = await this.getUserByUsername(userData.username);
      if (existingUser) {
        throw new Error('Username already exists');
      }

      const hashedPassword = await bcrypt.hash(userData.password, 10);
      const user = {
        id: nanoid(),
        username: userData.username.trim().toLowerCase(),
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
      if (error.message.includes('already exists') ||
        error.message.includes('required') ||
        error.message.includes('characters long')) {
        throw error;
      }
      throw new Error('Failed to create user account');
    }
  }

  async getUserByUsername(username) {
    try {
      if (!username) {
        throw new Error('Username is required');
      }
      const user =  await this.usersCollection.findOne({ username: username.trim().toLowerCase() });
      return user
    } catch (error) {
      console.error('Error finding user:', error);
      if (error.message.includes('required')) {
        throw error;
      }
      throw new Error('Failed to find user');
    }
  }

  async verifyUser(username, password) {
    try {
      if (!username || !password) {
        throw new Error('Username and password are required');
      }

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
      if (error.message.includes('required')) {
        throw error;
      }
      return null;
    }
  }
}

export const mongoStorage = new MongoStorage();