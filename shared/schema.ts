import { sql } from "drizzle-orm";
import { pgTable, text, varchar } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

// Session and workout data types
export interface SessionExercise {
  id: string;
  name: string;
  sets: number;
  repsMin?: number;
  repsMax?: number;
  timeSecondsMin?: number;
  timeSecondsMax?: number;
  stepsCount?: number;
  unit: 'reps' | 'seconds' | 'steps';
  perSide: boolean;
  weight?: number;
  notes?: string;
  formGuidance?: string;
  muscleGroup: string;
  mainMuscle: string;
  restSeconds?: number; // Rest time after this exercise
}

export interface SessionTemplate {
  id: string;
  name: string;
  description?: string;
  exercises: SessionExercise[];
  estimatedDurationMinutes?: number;
  tags: string[];
  createdAt: string;
  updatedAt: string;
}

export interface SessionInstance {
  id: string;
  templateId: string; // Reference to original template
  templateSnapshot: {
    name: string;
    description?: string;
    exercises: SessionExercise[]; // Snapshot of exercises at time of scheduling
    estimatedDurationMinutes?: number;
    tags: string[];
  };
  date: string; // Local date string (YYYY-MM-DD)
  startTime?: string; // Optional start time (HH:MM)
  status: 'scheduled' | 'in_progress' | 'completed' | 'skipped';
  scheduledAt: string;
  startedAt?: string;
  completedAt?: string;
  notes?: string;
}

// Legacy type for backward compatibility
export interface ScheduledSession {
  id: string;
  templateId: string;
  date: string; // ISO date string (YYYY-MM-DD)
  startTime?: string; // Optional start time (HH:MM)
  status: 'scheduled' | 'in_progress' | 'completed' | 'skipped';
  completedAt?: string;
  notes?: string;
}

export interface WorkoutProgress {
  sessionId: string;
  exerciseId: string;
  sets: SetProgress[];
  startedAt: string;
  completedAt?: string;
  notes?: string;
}

export interface SetProgress {
  setNumber: number;
  reps?: number;
  weight?: number;
  timeSeconds?: number;
  steps?: number;
  completed: boolean;
  completedAt?: string;
  restTimerUsed?: boolean;
}

// Zod schemas for validation
export const sessionExerciseSchema = z.object({
  id: z.string(),
  name: z.string().min(1),
  sets: z.number().min(1),
  repsMin: z.number().min(1).optional(),
  repsMax: z.number().min(1).optional(),
  timeSecondsMin: z.number().min(1).optional(),
  timeSecondsMax: z.number().min(1).optional(),
  stepsCount: z.number().min(1).optional(),
  unit: z.enum(['reps', 'seconds', 'steps']),
  perSide: z.boolean(),
  weight: z.number().min(0).optional(),
  notes: z.string().optional(),
  formGuidance: z.string().optional(),
  muscleGroup: z.string().min(1),
  mainMuscle: z.string().min(1),
  restSeconds: z.number().min(0).optional(),
}).refine(
  (data) => {
    // Ensure proper ranges for reps
    if (data.repsMin && data.repsMax) {
      return data.repsMin <= data.repsMax;
    }
    // Ensure proper ranges for time
    if (data.timeSecondsMin && data.timeSecondsMax) {
      return data.timeSecondsMin <= data.timeSecondsMax;
    }
    return true;
  },
  {
    message: "Min values must be less than or equal to max values"
  }
);

export const sessionTemplateSchema = z.object({
  id: z.string(),
  name: z.string().min(1).max(100),
  description: z.string().max(500).optional(),
  exercises: z.array(sessionExerciseSchema).min(1),
  estimatedDurationMinutes: z.number().min(1).optional(),
  tags: z.array(z.string()),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

export const sessionInstanceSchema = z.object({
  id: z.string(),
  templateId: z.string(),
  templateSnapshot: z.object({
    name: z.string().min(1),
    description: z.string().optional(),
    exercises: z.array(sessionExerciseSchema),
    estimatedDurationMinutes: z.number().min(1).optional(),
    tags: z.array(z.string()),
  }),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be in YYYY-MM-DD format"),
  startTime: z.string().regex(/^\d{2}:\d{2}$/, "Time must be in HH:MM format").optional(),
  status: z.enum(['scheduled', 'in_progress', 'completed', 'skipped']),
  scheduledAt: z.string().datetime(),
  startedAt: z.string().datetime().optional(),
  completedAt: z.string().datetime().optional(),
  notes: z.string().max(1000).optional(),
});

// Legacy schema for backward compatibility
export const scheduledSessionSchema = z.object({
  id: z.string(),
  templateId: z.string(),
  date: z.string(),
  startTime: z.string().optional(),
  status: z.enum(['scheduled', 'in_progress', 'completed', 'skipped']),
  completedAt: z.string().optional(),
  notes: z.string().optional(),
});

// Zod schemas for WorkoutProgress and SetProgress
export const setProgressSchema = z.object({
  setNumber: z.number().min(1),
  reps: z.number().min(0).optional(),
  weight: z.number().min(0).optional(),
  timeSeconds: z.number().min(0).optional(),
  steps: z.number().min(0).optional(),
  completed: z.boolean(),
  completedAt: z.string().datetime().optional(),
  restTimerUsed: z.boolean().optional(),
});

export const workoutProgressSchema = z.object({
  sessionId: z.string(),
  exerciseId: z.string(),
  sets: z.array(setProgressSchema),
  startedAt: z.string().datetime(),
  completedAt: z.string().datetime().optional(),
  notes: z.string().max(500).optional(),
});

// Insert schemas (omit auto-generated fields)
export const insertSessionExerciseSchema = sessionExerciseSchema.omit({ id: true });
export const insertSessionTemplateSchema = sessionTemplateSchema.omit({ 
  id: true, 
  createdAt: true, 
  updatedAt: true 
});
export const insertSessionInstanceSchema = sessionInstanceSchema.omit({ 
  id: true,
  scheduledAt: true,
  startedAt: true,
  completedAt: true 
});
export const insertWorkoutProgressSchema = workoutProgressSchema.omit({ 
  startedAt: true,
  completedAt: true 
});
export const insertSetProgressSchema = setProgressSchema.omit({ 
  completedAt: true 
});

// Insert and select types
export type SessionExerciseInsert = z.infer<typeof insertSessionExerciseSchema>;
export type SessionTemplateInsert = z.infer<typeof insertSessionTemplateSchema>;
export type SessionInstanceInsert = z.infer<typeof insertSessionInstanceSchema>;
export type WorkoutProgressInsert = z.infer<typeof insertWorkoutProgressSchema>;
export type SetProgressInsert = z.infer<typeof insertSetProgressSchema>;

// Legacy types for backward compatibility
export type ScheduledSessionInsert = z.infer<typeof scheduledSessionSchema>;
