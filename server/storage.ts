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
  async getTasks(userId?: string): Promise<Task[]> {
    // For anonymous users, use session storage
    if (userId?.startsWith('anonymous-')) {
      const sessionTasks = this.sessionStorage.get(userId) || [];
      return sessionTasks.sort((a, b) => 
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
    }
    
    return Array.from(this.tasks.values())
      .filter(task => {
        if (!userId) return !task.userId;
        return task.userId === userId;
      })
      .sort((a, b) => 
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
  }

  async getTask(id: number): Promise<Task | undefined> {
    return this.tasks.get(id);
  }

  async createTask(insertTask: InsertTask, userId?: string): Promise<Task> {
    const id = this.currentTaskId++;
    const task: Task = {
      ...insertTask,
      id,
      priority: insertTask.priority || 5,
      completed: false,
      actualTime: null,
      createdAt: new Date(),
      completedAt: null,
      userId: userId || null,
    };

    // For anonymous users, store in session storage
    if (userId?.startsWith('anonymous-')) {
      const sessionTasks = this.sessionStorage.get(userId) || [];
      sessionTasks.push(task);
      this.sessionStorage.set(userId, sessionTasks);
      return task;
    }

    this.tasks.set(id, task);
    return task;
  }

  async updateTask(updateTask: UpdateTask): Promise<Task | undefined> {
    // First check session storage for anonymous users
    for (const [sessionId, sessionTasks] of this.sessionStorage.entries()) {
      const taskIndex = sessionTasks.findIndex(task => task.id === updateTask.id);
      if (taskIndex !== -1) {
        const existingTask = sessionTasks[taskIndex];
        const updatedTask: Task = {
          ...existingTask,
          actualTime: updateTask.actualTime ?? existingTask.actualTime,
          completed: updateTask.completed ?? existingTask.completed,
          completedAt: updateTask.completedAt ? (typeof updateTask.completedAt === 'string' ? new Date(updateTask.completedAt) : updateTask.completedAt) : existingTask.completedAt,
        };
        sessionTasks[taskIndex] = updatedTask;
        this.sessionStorage.set(sessionId, sessionTasks);
        return updatedTask;
      }
    }

    // Fall back to regular storage
    const existingTask = this.tasks.get(updateTask.id);
    if (!existingTask) return undefined;

    const updatedTask: Task = {
      ...existingTask,
      actualTime: updateTask.actualTime ?? existingTask.actualTime,
      completed: updateTask.completed ?? existingTask.completed,
      completedAt: updateTask.completedAt ? (typeof updateTask.completedAt === 'string' ? new Date(updateTask.completedAt) : updateTask.completedAt) : existingTask.completedAt,
    };

    this.tasks.set(updateTask.id, updatedTask);
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