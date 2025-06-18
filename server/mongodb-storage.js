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
      this.archiveCollection = this.db.collection('Archive');
      this.laterTasksCollection = this.db.collection('Later Tasks');

      // Test the connection with a ping
      await this.db.command({ ping: 1 });

      console.log('✅ Connected to MongoDB successfully');
      console.log('📊 Database:', this.db.databaseName);
      console.log('📦 Main Collection:', this.tasksCollection.collectionName);
      console.log('📦 Archive Collection:', this.archiveCollection.collectionName);
      console.log('📦 Later Tasks Collection:', this.laterTasksCollection.collectionName);
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
      this.archiveCollection = null;
      this.laterTasksCollection = null;
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
        archived: taskData.archived || false,
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
      const { id, _id, ...updateFields } = updateData;

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
      if (updateFields.archived !== undefined) {
        updateFields.archived = Boolean(updateFields.archived);
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
      console.log('Delete task with ID:', id);
      
      let result = null;

      // Try to find by numeric id first
      if (!isNaN(Number(id))) {
        result = await this.tasksCollection.deleteOne({ id: Number(id) });
        console.log('Delete result by numeric id:', result.deletedCount);
      }

      // If not found by numeric id, try by _id (ObjectId)
      if (!result || result.deletedCount === 0) {
        try {
          const { ObjectId } = await import('mongodb');
          let objectId;

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
            result = await this.tasksCollection.deleteOne({ _id: objectId });
            console.log('Delete result by ObjectId:', result.deletedCount);
          }
        } catch (objectIdError) {
          console.error('Error with ObjectId conversion:', objectIdError);
        }
      }

      if (result && result.deletedCount > 0) {
        console.log('✅ Task successfully deleted');
        return true;
      } else {
        console.error('❌ Task not found for deletion:', id);
        return false;
      }
    } catch (error) {
      console.error('Error deleting task:', error);
      return false;
    }
  }

  async archiveTask(id) {
    try {
      console.log('Archive task with ID:', id);
      
      // First, find the task to archive
      let task = null;

      // Try to find by numeric id first
      if (!isNaN(Number(id))) {
        task = await this.tasksCollection.findOne({ id: Number(id) });
        console.log('Found task by numeric id:', task ? 'Yes' : 'No');
      }

      // If not found by numeric id, try by _id (ObjectId)
      if (!task) {
        try {
          const { ObjectId } = await import('mongodb');
          let objectId;

          if (typeof id === 'string' && id.length === 24) {
            objectId = new ObjectId(id);
          } else {
            // Search for any task with this numeric id and get its _id
            const foundTask = await this.tasksCollection.findOne({ id: Number(id) });
            if (foundTask) {
              objectId = foundTask._id;
            }
          }

          if (objectId) {
            task = await this.tasksCollection.findOne({ _id: objectId });
            console.log('Found task by ObjectId:', task ? 'Yes' : 'No');
          }
        } catch (objectIdError) {
          console.error('Error with ObjectId conversion:', objectIdError);
        }
      }

      if (!task) {
        console.error('Task not found for archiving:', id);
        return false;
      }

      console.log('Task to archive:', JSON.stringify(task, null, 2));

      // Add archived timestamp
      const archivedTask = {
        ...task,
        archived: true,
        archivedAt: new Date()
      };

      // Insert into archive collection
      const insertResult = await this.archiveCollection.insertOne(archivedTask);
      console.log('Archive insert result:', insertResult);

      if (insertResult.acknowledged) {
        // Remove from main tasks collection
        let deleteResult = null;

        if (!isNaN(Number(id))) {
          deleteResult = await this.tasksCollection.deleteOne({ id: Number(id) });
        }

        if (!deleteResult || deleteResult.deletedCount === 0) {
          try {
            const { ObjectId } = await import('mongodb');
            const objectId = task._id;
            deleteResult = await this.tasksCollection.deleteOne({ _id: objectId });
          } catch (error) {
            console.error('Error deleting from main collection:', error);
          }
        }

        console.log('Delete from main collection result:', deleteResult);
        
        if (deleteResult && deleteResult.deletedCount > 0) {
          console.log('✅ Task successfully archived');
          return true;
        } else {
          console.error('❌ Failed to remove task from main collection after archiving');
          // Remove from archive since main deletion failed
          await this.archiveCollection.deleteOne({ _id: insertResult.insertedId });
          return false;
        }
      }

      return false;
    } catch (error) {
      console.error('Error archiving task:', error);
      return false;
    }
  }

  async getArchivedTasks() {
    try {
      const archivedTasks = await this.archiveCollection.find({}).sort({ archivedAt: -1 }).toArray();
      console.log('Fetched archived tasks:', archivedTasks.length);
      console.log('Archived tasks:', JSON.stringify(archivedTasks, null, 2));
      return archivedTasks.map(task => ({
        ...task,
        id: task.id || task._id.toString(),
        archived: true,
        archivedAt: task.archivedAt || new Date()
      }));
    } catch (error) {
      console.error('Error fetching archived tasks:', error);
      return [];
    }
  }


}

export const mongoStorage = new MongoStorage();