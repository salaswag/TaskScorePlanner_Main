import { MongoClient } from 'mongodb';


const MONGODB_URI = "mongodb+srv://salaswag:Borderbiz8k@clusterfortask.riwouqe.mongodb.net/ClusterforTask";

export class MongoStorage {
  constructor() {
    this.client = null;
    this.db = null;
    this.tasksCollection = null;
  }

  async connect(retries = 5) {
    try {
      this.client = new MongoClient(MONGODB_URI, {
        connectTimeoutMS: 10000,
        serverSelectionTimeoutMS: 10000,
        maxPoolSize: 10,
        retryWrites: true,
        retryReads: true,
      });
      await this.client.connect();
      this.db = this.client.db('ClusterforTask');
      this.tasksCollection = this.db.collection('Tasks');

      // Test the connection with a ping
      await this.db.command({ ping: 1 });

      console.log('✅ Connected to MongoDB successfully');
      console.log('📊 Database:', this.db.databaseName);
      console.log('📦 Collection:', this.tasksCollection.collectionName);
      return true;
    } catch (error) {
      console.error(`❌ MongoDB connection failed (attempt ${6 - retries}/5):`, error.message);

      if (retries > 1) {
        console.log(`🔄 Retrying connection in 3 seconds...`);
        await new Promise(resolve => setTimeout(resolve, 3000));
        return this.connect(retries - 1);
      }
      console.error('💥 MongoDB connection completely failed after all retries:', error);
      this.client = null;
      this.db = null;
      this.tasksCollection = null;
      return false;
    }
  }

  async getTasks() {
    try {
      const tasks = await this.tasksCollection.find({}).sort({ createdAt: -1 }).toArray();
      console.log('Raw tasks from MongoDB:', JSON.stringify(tasks, null, 2));
      console.log('Fetched tasks from MongoDB:', tasks.length);
      return tasks.map(task => ({
        ...task,
        id: task.id || task._id.toString(),
        createdAt: task.createdAt || new Date(),
        completedAt: task.completedAt || null,
        actualTime: task.actualTime,
        distractionLevel: task.distractionLevel,
        isLater: task.isLater || false
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

  async createTask(taskData) {
    try {
      console.log('Creating task with data:', taskData);

      // Get the next numeric ID
      const lastTask = await this.tasksCollection.findOne({}, { sort: { id: -1 } });
      const nextId = lastTask ? (lastTask.id || 0) + 1 : 1;

      console.log('Next task ID:', nextId);

      const task = {
        ...taskData,
        id: nextId,
        priority: taskData.priority || 5,
        completed: false,
        actualTime: null,
        distractionLevel: null,
        isLater: taskData.isLater || false,
        isFocus: taskData.isFocus || false,
        archived: false,
        createdAt: new Date(),
        completedAt: null
      };

      console.log('Task object to insert:', task);
      const result = await this.tasksCollection.insertOne(task);
      console.log('MongoDB insert result:', result);
      console.log('Task created successfully with ID:', task.id);

      return {
        ...task,
        id: task.id
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

      // If marking as completed, add completedAt timestamp
      if (updateFields.completed === true) {
          updateFields.completedAt = new Date();
      } else if (updateFields.completed === false) {
          updateFields.completedAt = null;
      }

      // Ensure all fields are properly handled
      if (updateFields.isLater !== undefined) {
        updateFields.isLater = Boolean(updateFields.isLater);
      }
      if (updateFields.isFocus !== undefined) {
        updateFields.isFocus = Boolean(updateFields.isFocus);
      }
      if (updateFields.completed !== undefined) {
        updateFields.completed = Boolean(updateFields.completed);
      }
      if (updateFields.actualTime !== undefined) {
        updateFields.actualTime = updateFields.actualTime === null ? null : Number(updateFields.actualTime);
      }
      if (updateFields.distractionLevel !== undefined) {
        updateFields.distractionLevel = updateFields.distractionLevel === null ? null : Number(updateFields.distractionLevel);
      }
      if (updateFields.priority !== undefined) {
        updateFields.priority = Number(updateFields.priority);
      }
      if (updateFields.estimatedTime !== undefined) {
        updateFields.estimatedTime = Number(updateFields.estimatedTime);
      }

      console.log('Updating task:', id, updateFields);

      let result = null;

      // Try to find by numeric id first
      if (!isNaN(Number(id))) {
        result = await this.tasksCollection.findOneAndUpdate(
          { id: Number(id) },
          { $set: updateFields },
          { returnDocument: 'after' }
        );
        console.log('Update result by numeric id:', result.value ? 'Found' : 'Not found');
      }

      // If not found by numeric id, try by _id (ObjectId)
      if (!result || !result.value) {
        try {
          const { ObjectId } = await import('mongodb');
          let objectId;

          // If id looks like ObjectId string, convert it
          if (typeof id === 'string' && id.length === 24) {
            objectId = new ObjectId(id);
          } else {
            // Search for any task with this numeric id and get its _id
            const task = await this.tasksCollection.findOne({ id: Number(id) });
            if (task) {
              objectId = task._id;
            }
          }

          if (objectId) {
            result = await this.tasksCollection.findOneAndUpdate(
              { _id: objectId },
              { $set: updateFields },
              { returnDocument: 'after' }
            );
            console.log('Update result by ObjectId:', result.value ? 'Found' : 'Not found');
          }
        } catch (objectIdError) {
          console.error('Error with ObjectId conversion:', objectIdError);
        }
      }

      if (!result || !result.value) {
        console.error('Task not found for update:', id);
        return undefined;
      }

      console.log('Task updated successfully:', result.value);
      return {
        ...result.value,
        id: result.value.id || result.value._id.toString(),
        actualTime: result.value.actualTime,
        distractionLevel: result.value.distractionLevel,
        isLater: Boolean(result.value.isLater),
        isFocus: Boolean(result.value.isFocus)
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


}

export const mongoStorage = new MongoStorage();