import { MongoClient } from 'mongodb';


const MONGODB_URI = process.env.MONGODB_URI || "mongodb+srv://salaswag:Borderbiz8k@clusterfortask.riwouqe.mongodb.net/ClusterforTask";

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
      this.timeEntriesCollection = this.db.collection('TimeEntries');

      // Test the connection with a ping
      await this.db.command({ ping: 1 });

      console.log('✅ Connected to MongoDB successfully');
      console.log('📊 Database:', this.db.databaseName);
      console.log('📦 Main Collection:', this.tasksCollection.collectionName);
      console.log('📦 Archive Collection:', this.archiveCollection.collectionName);
      console.log('📦 Later Tasks Collection:', this.laterTasksCollection.collectionName);
      console.log('📦 Time Entries Collection:', this.timeEntriesCollection.collectionName);
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
      this.timeEntriesCollection = null;
      return false;
    }
  }

  async getTasks(userId = null) {
    try {
      const userFilter = userId ? { userId } : {};
      
      // Fetch tasks from main Tasks collection
      const mainTasks = await this.tasksCollection.find(userFilter).sort({ createdAt: -1 }).toArray();
      console.log('Raw main tasks from MongoDB:', JSON.stringify(mainTasks, null, 2));
      console.log('Fetched main tasks from MongoDB:', mainTasks.length);

      // Fetch tasks from Later Tasks collection
      const laterTasks = await this.laterTasksCollection.find(userFilter).sort({ createdAt: -1 }).toArray();
      console.log('Raw later tasks from MongoDB:', JSON.stringify(laterTasks, null, 2));
      console.log('Fetched later tasks from MongoDB:', laterTasks.length);

      // Combine both collections
      const allTasks = [
        ...mainTasks.map(task => ({
          ...task,
          id: task.id || task._id.toString(),
          createdAt: task.createdAt || new Date(),
          completedAt: task.completedAt || null,
          actualTime: task.actualTime,
          distractionLevel: task.distractionLevel,
          isLater: task.isLater || false,  // Main tasks are not later by default
          isFocus: task.isFocus || false,
          archived: task.archived || false
        })),
        ...laterTasks.map(task => ({
          ...task,
          id: task.id || task._id.toString(),
          createdAt: task.createdAt || new Date(),
          completedAt: task.completedAt || null,
          actualTime: task.actualTime,
          distractionLevel: task.distractionLevel,
          isLater: true,  // Later tasks are always marked as later
          isFocus: task.isFocus || false,
          archived: task.archived || false
        }))
      ];

      console.log('Total combined tasks:', allTasks.length);
      return allTasks;
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
      console.log('===== CREATING TASK =====');
      console.log('Original task data:', JSON.stringify(taskData, null, 2));

      // Get the next numeric ID from both collections
      const lastMainTask = await this.tasksCollection.findOne({}, { sort: { id: -1 } });
      const lastLaterTask = await this.laterTasksCollection.findOne({}, { sort: { id: -1 } });
      
      const lastMainId = lastMainTask ? (lastMainTask.id || 0) : 0;
      const lastLaterId = lastLaterTask ? (lastLaterTask.id || 0) : 0;
      const nextId = Math.max(lastMainId, lastLaterId) + 1;

      console.log('Next task ID:', nextId);
      console.log('isLater from taskData:', taskData.isLater, 'Type:', typeof taskData.isLater);
      console.log('Raw isLater value:', taskData.isLater);

      // Ensure isLater is properly preserved - explicitly check for truthy values
      const isLaterFlag = taskData.isLater === true || taskData.isLater === 'true' || taskData.isLater === 1;
      console.log('Processed isLater flag:', isLaterFlag);

      const task = {
        ...taskData,
        id: nextId,
        priority: taskData.priority || 5,
        completed: false,
        actualTime: null,
        distractionLevel: null,
        isLater: isLaterFlag,
        isFocus: Boolean(taskData.isFocus),
        archived: Boolean(taskData.archived),
        userId: taskData.userId || 'anonymous',
        createdAt: new Date(),
        completedAt: null
      };

      console.log('Final task object to insert:', JSON.stringify(task, null, 2));
      console.log('Will insert into collection:', task.isLater ? 'Later Tasks' : 'Main Tasks');
      
      // Choose collection based on isLater flag
      const targetCollection = task.isLater ? this.laterTasksCollection : this.tasksCollection;
      const collectionName = task.isLater ? 'Later Tasks' : 'Main Tasks';
      
      const result = await targetCollection.insertOne(task);
      console.log(`MongoDB insert result in ${collectionName}:`, result);
      console.log('Task created successfully with ID:', task.id);
      console.log('===========================');

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

      // First, find the current task from both collections
      let currentTask = null;
      let currentCollection = null;

      // Try to find in main tasks collection
      if (!isNaN(Number(id))) {
        currentTask = await this.tasksCollection.findOne({ id: Number(id) });
        if (currentTask) {
          currentCollection = this.tasksCollection;
          console.log('Found task in main collection');
        }
      }

      // If not found, try later tasks collection
      if (!currentTask) {
        if (!isNaN(Number(id))) {
          currentTask = await this.laterTasksCollection.findOne({ id: Number(id) });
          if (currentTask) {
            currentCollection = this.laterTasksCollection;
            console.log('Found task in later collection');
          }
        }
      }

      // If still not found, try by ObjectId
      if (!currentTask) {
        try {
          const { ObjectId } = await import('mongodb');
          let objectId;

          if (typeof id === 'string' && id.length === 24) {
            objectId = new ObjectId(id);
          }

          if (objectId) {
            // Try main collection first
            currentTask = await this.tasksCollection.findOne({ _id: objectId });
            if (currentTask) {
              currentCollection = this.tasksCollection;
              console.log('Found task in main collection by ObjectId');
            } else {
              // Try later collection
              currentTask = await this.laterTasksCollection.findOne({ _id: objectId });
              if (currentTask) {
                currentCollection = this.laterTasksCollection;
                console.log('Found task in later collection by ObjectId');
              }
            }
          }
        } catch (objectIdError) {
          console.error('Error with ObjectId conversion:', objectIdError);
        }
      }

      if (!currentTask || !currentCollection) {
        console.error('Task not found for update:', id);
        return undefined;
      }

      // Check if we need to move the task between collections
      const currentIsLater = Boolean(currentTask.isLater);
      const newIsLater = updateFields.isLater !== undefined ? Boolean(updateFields.isLater) : currentIsLater;

      if (currentIsLater !== newIsLater) {
        console.log(`Moving task from ${currentIsLater ? 'later' : 'main'} to ${newIsLater ? 'later' : 'main'} collection`);
        
        // Create updated task
        const updatedTask = { ...currentTask, ...updateFields };
        
        // Insert into target collection
        const targetCollection = newIsLater ? this.laterTasksCollection : this.tasksCollection;
        await targetCollection.insertOne(updatedTask);
        
        // Remove from current collection
        await currentCollection.deleteOne({ _id: currentTask._id });
        
        console.log('Task moved successfully between collections');
        return {
          ...updatedTask,
          id: updatedTask.id || updatedTask._id.toString(),
          actualTime: updatedTask.actualTime,
          distractionLevel: updatedTask.distractionLevel,
          isLater: Boolean(updatedTask.isLater),
          isFocus: Boolean(updatedTask.isFocus)
        };
      } else {
        // Update in current collection
        const result = await currentCollection.findOneAndUpdate(
          { _id: currentTask._id },
          { $set: updateFields },
          { returnDocument: 'after' }
        );

        if (!result) {
          console.error('Task update failed:', id);
          return undefined;
        }

        console.log('Task updated successfully:', result);
        return {
          ...result,
          id: result.id || result._id.toString(),
          actualTime: result.actualTime,
          distractionLevel: result.distractionLevel,
          isLater: Boolean(result.isLater),
          isFocus: Boolean(result.isFocus)
        };
      }
    } catch (error) {
      console.error('Error updating task:', error);
      return undefined;
    }
  }

  async deleteTask(id) {
    try {
      console.log('Delete task with ID:', id);
      
      let result = null;

      // Try to find by numeric id in main collection first
      if (!isNaN(Number(id))) {
        result = await this.tasksCollection.deleteOne({ id: Number(id) });
        console.log('Delete result in main collection by numeric id:', result.deletedCount);
      }

      // If not found in main collection, try later collection
      if (!result || result.deletedCount === 0) {
        if (!isNaN(Number(id))) {
          result = await this.laterTasksCollection.deleteOne({ id: Number(id) });
          console.log('Delete result in later collection by numeric id:', result.deletedCount);
        }
      }

      // If still not found by numeric id, try by _id (ObjectId) in both collections
      if (!result || result.deletedCount === 0) {
        try {
          const { ObjectId } = await import('mongodb');
          let objectId;

          if (typeof id === 'string' && id.length === 24) {
            objectId = new ObjectId(id);
          } else {
            // Search for any task with this numeric id and get its _id from both collections
            let task = await this.tasksCollection.findOne({ id: Number(id) });
            if (!task) {
              task = await this.laterTasksCollection.findOne({ id: Number(id) });
            }
            if (task) {
              objectId = task._id;
            }
          }

          if (objectId) {
            // Try main collection first
            result = await this.tasksCollection.deleteOne({ _id: objectId });
            console.log('Delete result in main collection by ObjectId:', result.deletedCount);
            
            // If not found in main, try later collection
            if (result.deletedCount === 0) {
              result = await this.laterTasksCollection.deleteOne({ _id: objectId });
              console.log('Delete result in later collection by ObjectId:', result.deletedCount);
            }
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
      
      // First, find the task to archive from both collections
      let task = null;
      let sourceCollection = null;

      // Try to find by numeric id in main collection first
      if (!isNaN(Number(id))) {
        task = await this.tasksCollection.findOne({ id: Number(id) });
        if (task) {
          sourceCollection = this.tasksCollection;
          console.log('Found task in main collection by numeric id');
        }
      }

      // If not found in main, try later collection
      if (!task && !isNaN(Number(id))) {
        task = await this.laterTasksCollection.findOne({ id: Number(id) });
        if (task) {
          sourceCollection = this.laterTasksCollection;
          console.log('Found task in later collection by numeric id');
        }
      }

      // If not found by numeric id, try by _id (ObjectId) in both collections
      if (!task) {
        try {
          const { ObjectId } = await import('mongodb');
          let objectId;

          if (typeof id === 'string' && id.length === 24) {
            objectId = new ObjectId(id);
          } else {
            // Search for any task with this numeric id and get its _id from both collections
            let foundTask = await this.tasksCollection.findOne({ id: Number(id) });
            if (foundTask) {
              objectId = foundTask._id;
              sourceCollection = this.tasksCollection;
            } else {
              foundTask = await this.laterTasksCollection.findOne({ id: Number(id) });
              if (foundTask) {
                objectId = foundTask._id;
                sourceCollection = this.laterTasksCollection;
              }
            }
          }

          if (objectId && sourceCollection) {
            task = await sourceCollection.findOne({ _id: objectId });
            console.log('Found task by ObjectId in', sourceCollection === this.tasksCollection ? 'main' : 'later', 'collection');
          }
        } catch (objectIdError) {
          console.error('Error with ObjectId conversion:', objectIdError);
        }
      }

      if (!task || !sourceCollection) {
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
        // Remove from source collection
        const deleteResult = await sourceCollection.deleteOne({ _id: task._id });
        console.log('Delete from source collection result:', deleteResult);
        
        if (deleteResult && deleteResult.deletedCount > 0) {
          console.log('✅ Task successfully archived');
          return true;
        } else {
          console.error('❌ Failed to remove task from source collection after archiving');
          // Remove from archive since source deletion failed
          await this.archiveCollection.deleteOne({ _id: insertResult.insertedId });
          return false;
        }
      }

      return false;
    } catch (error) {

  async transferUserData(fromUserId, toUserId) {
    try {
      console.log(`Transferring data from ${fromUserId} to ${toUserId}`);
      
      // Update all tasks in main collection
      const mainResult = await this.tasksCollection.updateMany(
        { userId: fromUserId },
        { $set: { userId: toUserId } }
      );
      
      // Update all tasks in later collection
      const laterResult = await this.laterTasksCollection.updateMany(
        { userId: fromUserId },
        { $set: { userId: toUserId } }
      );
      
      // Update all archived tasks
      const archiveResult = await this.archiveCollection.updateMany(
        { userId: fromUserId },
        { $set: { userId: toUserId } }
      );
      
      // Update all time entries
      const timeResult = await this.timeEntriesCollection.updateMany(
        { userId: fromUserId },
        { $set: { userId: toUserId } }
      );
      
      console.log(`Transfer completed: ${mainResult.modifiedCount} main tasks, ${laterResult.modifiedCount} later tasks, ${archiveResult.modifiedCount} archived tasks, ${timeResult.modifiedCount} time entries`);
      
      return true;
    } catch (error) {
      console.error('Error transferring user data:', error);
      return false;
    }
  }

  async archiveTask(id) {
    try {
      console.log('Archive task with ID:', id);
      
      // First, find the task to archive from both collections
      let task = null;
      let sourceCollection = null;

      // Try to find by numeric id in main collection first
      if (!isNaN(Number(id))) {
        task = await this.tasksCollection.findOne({ id: Number(id) });
        if (task) {
          sourceCollection = this.tasksCollection;
          console.log('Found task in main collection by numeric id');
        }
      }

      // If not found in main, try later collection
      if (!task && !isNaN(Number(id))) {
        task = await this.laterTasksCollection.findOne({ id: Number(id) });
        if (task) {
          sourceCollection = this.laterTasksCollection;
          console.log('Found task in later collection by numeric id');
        }
      }

      // If not found by numeric id, try by _id (ObjectId) in both collections
      if (!task) {
        try {
          const { ObjectId } = await import('mongodb');
          let objectId;

          if (typeof id === 'string' && id.length === 24) {
            objectId = new ObjectId(id);
          } else {
            // Search for any task with this numeric id and get its _id from both collections
            let foundTask = await this.tasksCollection.findOne({ id: Number(id) });
            if (foundTask) {
              objectId = foundTask._id;
              sourceCollection = this.tasksCollection;
            } else {
              foundTask = await this.laterTasksCollection.findOne({ id: Number(id) });
              if (foundTask) {
                objectId = foundTask._id;
                sourceCollection = this.laterTasksCollection;
              }
            }
          }

          if (objectId && sourceCollection) {
            task = await sourceCollection.findOne({ _id: objectId });
            console.log('Found task by ObjectId in', sourceCollection === this.tasksCollection ? 'main' : 'later', 'collection');
          }
        } catch (objectIdError) {
          console.error('Error with ObjectId conversion:', objectIdError);
        }
      }

      if (!task || !sourceCollection) {
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
        // Remove from source collection
        const deleteResult = await sourceCollection.deleteOne({ _id: task._id });
        console.log('Delete from source collection result:', deleteResult);
        
        if (deleteResult && deleteResult.deletedCount > 0) {
          console.log('✅ Task successfully archived');
          return true;
        } else {
          console.error('❌ Failed to remove task from source collection after archiving');
          // Remove from archive since source deletion failed
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

  async getTimeEntries() {
    try {
      const timeEntries = await this.timeEntriesCollection.find({}).toArray();
      console.log('Fetched time entries from MongoDB:', timeEntries.length);
      return timeEntries.map(entry => ({
        ...entry,
        id: entry.id || entry._id.toString()
      }));
    } catch (error) {
      console.error('Error fetching time entries:', error);
      return [];
    }
  }

  async createTimeEntry(entryData) {
    try {
      console.log('Creating time entry:', entryData);
      
      const entry = {
        ...entryData,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      const result = await this.timeEntriesCollection.insertOne(entry);
      console.log('Time entry created with ID:', result.insertedId);

      return {
        ...entry,
        id: result.insertedId.toString()
      };
    } catch (error) {
      console.error('Error creating time entry:', error);
      throw error;
    }
  }

  async updateTimeEntry(date, timeInMinutes) {
    try {
      console.log('Updating time entry for date:', date, 'time:', timeInMinutes);
      
      const result = await this.timeEntriesCollection.findOneAndUpdate(
        { date: date },
        { 
          $set: { 
            timeInMinutes: timeInMinutes,
            updatedAt: new Date()
          }
        },
        { 
          upsert: true,
          returnDocument: 'after'
        }
      );

      console.log('Time entry updated/created:', result);
      return {
        ...result,
        id: result._id.toString()
      };
    } catch (error) {
      console.error('Error updating time entry:', error);
      throw error;
    }
  }

  async deleteTimeEntry(date) {
    try {
      const result = await this.timeEntriesCollection.deleteOne({ date: date });
      console.log('Time entry deleted for date:', date, 'deleted count:', result.deletedCount);
      return result.deletedCount > 0;
    } catch (error) {
      console.error('Error deleting time entry:', error);
      return false;
    }
  }


}

export const mongoStorage = new MongoStorage();