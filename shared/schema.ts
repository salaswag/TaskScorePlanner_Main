import { pgTable, text, serial, integer, boolean, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const tasks = pgTable("tasks", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  priority: integer("priority").notNull().default(5),
  estimatedTime: integer("estimated_time").notNull(), // in minutes
  actualTime: integer("actual_time"), // in minutes, null until completed
  distractionLevel: integer("distraction_level"), // 1-5, null until completed
  completed: boolean("completed").notNull().default(false),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  completedAt: timestamp("completed_at"),
  userId: text("user_id"), // null for anonymous users
  isMindMapOnly: boolean("is_mind_map_only").default(false),
  isLater: boolean("is_later").default(false),
});

export const insertTaskSchema = createInsertSchema(tasks).pick({
  title: true,
  priority: true,
  estimatedTime: true,
});

export const updateTaskSchema = z.object({
  id: z.union([z.number(), z.string()]),
  title: z.string().optional(),
  priority: z.number().optional(),
  estimatedTime: z.number().optional(),
  actualTime: z.number().nullable().optional(),
  distractionLevel: z.number().min(1).max(5).nullable().optional(),
  completed: z.boolean().optional(),
  completedAt: z.union([z.string(), z.date()]).nullable().optional(),
  isLater: z.boolean().optional(),
  isMindMapOnly: z.boolean().optional(),
});

export type InsertTask = z.infer<typeof insertTaskSchema>;
export type UpdateTask = z.infer<typeof updateTaskSchema>;
export type Task = typeof tasks.$inferSelect;

export const users = pgTable("users", {
  id: text("id").primaryKey(), // Using text ID for MongoDB compatibility
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export const loginSchema = z.object({
  username: z.string().min(1, "Username is required"),
  password: z.string().min(1, "Password is required"),
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type LoginUser = z.infer<typeof loginSchema>;
export type User = typeof users.$inferSelect;

export const timelineEvents = pgTable("timeline_events", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description"),
  dueDate: timestamp("due_date").notNull(),
  priority: integer("priority").notNull().default(5),
  completed: boolean("completed").notNull().default(false),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  completedAt: timestamp("completed_at"),
  userId: text("user_id"), // null for anonymous users
  isMindMapOnly: boolean("is_mind_map_only").default(false),
  isLater: boolean("is_later").default(false),
});

export const insertTimelineSchema = createInsertSchema(timelineEvents).pick({
  title: true,
  description: true,
  dueDate: true,
  priority: true,
});

export const updateTimelineSchema = z.object({
  id: z.union([z.number(), z.string()]),
  title: z.string().optional(),
  description: z.string().optional(),
  dueDate: z.union([z.string(), z.date()]).optional(),
  priority: z.number().optional(),
  completed: z.boolean().optional(),
  completedAt: z.union([z.string(), z.date()]).nullable().optional(),
});

export type InsertTimelineEvent = z.infer<typeof insertTimelineSchema>;
export type UpdateTimelineEvent = z.infer<typeof updateTimelineSchema>;
export type TimelineEvent = typeof timelineEvents.$inferSelect;