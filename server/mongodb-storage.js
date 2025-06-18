import { MongoClient } from 'mongodb';


const MONGODB_URI = "mongodb+srv://salaswag:Borderbiz8k@clusterfortask.riwouqe.mongodb.net/ClusterforTask";

export class MongoStorage {
  constructor() {
    this.client = null;
    this.db = null;
    this.tasksCollection = null;
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

      // Build the query
      const baseQuery = { id: Number(id) };

      // Try to update by numeric id first
      let result = await this.tasksCollection.findOneAndUpdate(
        baseQuery,
        { $set: updateFields },
        { returnDocument: 'after' }
      );

      // If not found and id looks like ObjectId, try _id
      if (!result.value && typeof id === 'string' && id.length === 24) {
        const { ObjectId } = await import('mongodb');
        try {
          const objectId = new ObjectId(id);
          const objectIdQuery = { _id: objectId };
          result = await this.tasksCollection.findOneAndUpdate(
            objectIdQuery,
            { $set: updateFields },
            { returnDocument: 'after' }
          );
        } catch (objectIdError) {
          console.error('Error with ObjectId conversion:', objectIdError);
        }
      }

      if (!result.value) {
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