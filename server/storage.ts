import { tasks, type Task, type InsertTask, type UpdateTask } from "@shared/schema";

export interface IStorage {
  // Task operations
  getTasks(userId?: string): Promise<Task[]>;
  getTask(id: number): Promise<Task | undefined>;
  createTask(task: InsertTask, userId?: string): Promise<Task>;
  updateTask(task: UpdateTask): Promise<Task | undefined>;
  deleteTask(id: number | string): Promise<boolean>;

  // User operations
  getUser(id: string): Promise<any>;
  getUserByUsername(username: string): Promise<any>;
  createUser(user: any): Promise<any>;
  verifyUser(username: string, password: string): Promise<any>;
}

export class MemStorage implements IStorage {
  private tasks: Map<number, Task>;
  private users: Map<string, any>;
  private currentTaskId: number;
  private currentUserId: number;
  private sessionStorage: Map<string, Task[]>; // Store tasks by session ID

  constructor() {
    this.tasks = new Map();
    this.users = new Map();
    this.currentTaskId = 1;
    this.currentUserId = 1;
    this.sessionStorage = new Map();
  }

  // Task operations
  async getTasks(userId?: string): Promise<any[]> {
    if (userId && userId.startsWith('anonymous-')) {
      // Return tasks for this specific anonymous session
      const sessionTasks = Array.from(this.tasks.values()).filter(task => task.userId === userId);
      console.log(`In-memory storage: Retrieved ${sessionTasks.length} tasks for anonymous session ${userId}`);
      return sessionTasks;
    }

    // For authenticated users, filter by their userId
    if (userId && !userId.startsWith('anonymous-')) {
      const userTasks = Array.from(this.tasks.values()).filter(task => task.userId === userId);
      console.log(`In-memory storage: Retrieved ${userTasks.length} tasks for authenticated user ${userId}`);
      return userTasks;
    }

    // Fallback: return all tasks (should rarely happen)
    const allTasks = Array.from(this.tasks.values());
    console.log(`In-memory storage: Retrieved ${allTasks.length} total tasks (fallback)`);
    return allTasks;
  }

  async getTask(id: number): Promise<Task | undefined> {
    return this.tasks.get(id);
  }

  async createTask(taskData: any, userId?: string): Promise<any> {
    const id = this.currentTaskId++;
    const task = {
      id,
      ...taskData,
      userId: userId || taskData.userId || 'anonymous',
      createdAt: new Date(),
      completedAt: null,
      completed: taskData.completed || false,
      isLater: Boolean(taskData.isLater),
      isFocus: Boolean(taskData.isFocus),
      actualTime: taskData.actualTime || null,
      distractionLevel: taskData.distractionLevel || null,
    };
    this.tasks.set(id, task);
    console.log('In-memory storage: Task created successfully', task);
    return task;
  }

  async updateTask(taskData: any): Promise<any> {
    const task = this.tasks.get(taskData.id);
    if (!task) {
      return undefined;
    }

    // Handle completion timestamp
    const updateFields = { ...taskData };
    if (updateFields.completed === true && !updateFields.completedAt) {
      updateFields.completedAt = new Date();
    } else if (updateFields.completed === false) {
      updateFields.completedAt = null;
    }

    // Ensure boolean fields are properly handled
    if (updateFields.isLater !== undefined) {
      updateFields.isLater = Boolean(updateFields.isLater);
    }
    if (updateFields.isFocus !== undefined) {
      updateFields.isFocus = Boolean(updateFields.isFocus);
    }
    if (updateFields.completed !== undefined) {
      updateFields.completed = Boolean(updateFields.completed);
    }

    const updatedTask = { ...task, ...updateFields };
    this.tasks.set(taskData.id, updatedTask);
    console.log('In-memory storage: Task updated successfully', updatedTask);
    return updatedTask;
  }

  async deleteTask(id: number | string): Promise<boolean> {
    const numId = typeof id === 'string' ? parseInt(id) : id;

    // First check session storage for anonymous users
    for (const [sessionId, sessionTasks] of this.sessionStorage.entries()) {
      const taskIndex = sessionTasks.findIndex(task => task.id === numId);
      if (taskIndex !== -1) {
        sessionTasks.splice(taskIndex, 1);
        this.sessionStorage.set(sessionId, sessionTasks);
        return true;
      }
    }

    // Fall back to regular storage
    return this.tasks.delete(numId);
  }

  // User operations
  async getUser(id: string): Promise<any> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<any> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: any): Promise<any> {
    const id = `user_${this.currentUserId++}`;
    const user = { ...insertUser, id };
    this.users.set(id, user);
    return user;
  }

  async verifyUser(username: string, password: string): Promise<any> {
    const user = await this.getUserByUsername(username);
    if (!user || user.password !== password) return null;
    return { id: user.id, username: user.username };
  }

  // Transfer session data to authenticated user
  async transferSessionData(sessionId: string, authenticatedUserId: string): Promise<boolean> {
    const sessionTasks = this.sessionStorage.get(sessionId);
    if (!sessionTasks || sessionTasks.length === 0) {
      return true; // Nothing to transfer
    }

    // Move tasks from session to authenticated user storage
    for (const task of sessionTasks) {
      const updatedTask = { ...task, userId: authenticatedUserId };
      this.tasks.set(task.id, updatedTask);
    }

    // Clear session storage
    this.sessionStorage.delete(sessionId);
    console.log(`📤 Transferred ${sessionTasks.length} tasks from session ${sessionId} to user ${authenticatedUserId}`);
    return true;
  }

  // Clean up old sessions (call periodically)
  cleanupSessions(): void {
    // In a real implementation, you'd check timestamps and remove old sessions
    // For now, we'll keep sessions until the server restarts
    console.log(`🧹 Session cleanup: ${this.sessionStorage.size} active sessions`);
  }
}

export const storage = new MemStorage();