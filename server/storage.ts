import { tasks, type Task, type InsertTask, type UpdateTask } from "@shared/schema";

export interface IStorage {
  // Task operations
  getTasks(userId?: string | null): Promise<Task[]>;
  getTask(id: number): Promise<Task | undefined>;
  createTask(task: InsertTask, userId?: string | null): Promise<Task>;
  updateTask(task: UpdateTask): Promise<Task | undefined>;
  deleteTask(id: number): Promise<boolean>;
  
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

  constructor() {
    this.tasks = new Map();
    this.users = new Map();
    this.currentTaskId = 1;
    this.currentUserId = 1;
  }

  // Task operations
  async getTasks(userId?: string | null): Promise<Task[]> {
    return Array.from(this.tasks.values())
      .filter(task => userId ? task.userId === userId : !task.userId)
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
    this.tasks.set(id, task);
    return task;
  }

  async updateTask(updateTask: UpdateTask): Promise<Task | undefined> {
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

  async deleteTask(id: number): Promise<boolean> {
    return this.tasks.delete(id);
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
}

export const storage = new MemStorage();
