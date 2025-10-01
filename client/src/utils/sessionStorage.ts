// Session and calendar storage utilities
import { 
  SessionTemplate, 
  SessionInstance,
  WorkoutProgress, 
  SetProgress,
  SessionExercise,
  SessionTemplateInsert,
  SessionInstanceInsert,
  WorkoutProgressInsert,
  SetProgressInsert
} from "@shared/schema";

const STORAGE_KEYS = {
  SESSION_TEMPLATES: 'fittracker_session_templates',
  SESSION_INSTANCES: 'fittracker_session_instances',
  WORKOUT_PROGRESS: 'fittracker_workout_progress',
  ACTIVE_WORKOUT: 'fittracker_active_workout'
} as const;

// Utility functions for auto-timestamps
function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

function getCurrentISOString(): string {
  return new Date().toISOString();
}

function formatLocalDate(date: Date = new Date()): string {
  // Format as YYYY-MM-DD in local timezone
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function parseLocalDate(dateString: string): Date {
  // Parse YYYY-MM-DD as local date (not UTC)
  const [year, month, day] = dateString.split('-').map(Number);
  return new Date(year, month - 1, day);
}

// Session Template Management
export function saveSessionTemplate(templateData: SessionTemplateInsert | SessionTemplate): SessionTemplate {
  try {
    const templates = loadSessionTemplates();
    const now = getCurrentISOString();
    
    let template: SessionTemplate;
    if ('id' in templateData) {
      // Updating existing template
      template = { ...templateData, updatedAt: now };
      const existingIndex = templates.findIndex(t => t.id === template.id);
      if (existingIndex >= 0) {
        templates[existingIndex] = template;
      } else {
        templates.push(template);
      }
    } else {
      // Creating new template
      template = {
        ...templateData,
        id: generateId(),
        createdAt: now,
        updatedAt: now
      };
      templates.push(template);
    }
    
    localStorage.setItem(STORAGE_KEYS.SESSION_TEMPLATES, JSON.stringify(templates));
    console.log('Session template saved:', template.name);
    return template;
  } catch (error) {
    console.error('Failed to save session template:', error);
    throw new Error('Failed to save session template');
  }
}

export function loadSessionTemplates(): SessionTemplate[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEYS.SESSION_TEMPLATES);
    return stored ? JSON.parse(stored) : [];
  } catch (error) {
    console.error('Failed to load session templates:', error);
    return [];
  }
}

export function deleteSessionTemplate(templateId: string): void {
  try {
    const templates = loadSessionTemplates();
    const filtered = templates.filter(t => t.id !== templateId);
    localStorage.setItem(STORAGE_KEYS.SESSION_TEMPLATES, JSON.stringify(filtered));
    console.log('Session template deleted:', templateId);
  } catch (error) {
    console.error('Failed to delete session template:', error);
  }
}

export function getSessionTemplate(templateId: string): SessionTemplate | null {
  const templates = loadSessionTemplates();
  return templates.find(t => t.id === templateId) || null;
}

// Session Instance Management (replaces Scheduled Session)
export function saveSessionInstance(instanceData: SessionInstanceInsert | SessionInstance): SessionInstance {
  try {
    const instances = loadSessionInstances();
    const now = getCurrentISOString();
    
    let instance: SessionInstance;
    if ('id' in instanceData) {
      // Updating existing instance
      instance = instanceData;
      const existingIndex = instances.findIndex(s => s.id === instance.id);
      if (existingIndex >= 0) {
        instances[existingIndex] = instance;
      } else {
        instances.push(instance);
      }
    } else {
      // Creating new instance
      instance = {
        ...instanceData,
        id: generateId(),
        scheduledAt: now
      };
      instances.push(instance);
    }
    
    localStorage.setItem(STORAGE_KEYS.SESSION_INSTANCES, JSON.stringify(instances));
    console.log('Session instance saved:', instance.date);
    return instance;
  } catch (error) {
    console.error('Failed to save session instance:', error);
    throw new Error('Failed to save session instance');
  }
}

export function loadSessionInstances(): SessionInstance[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEYS.SESSION_INSTANCES);
    return stored ? JSON.parse(stored) : [];
  } catch (error) {
    console.error('Failed to load session instances:', error);
    return [];
  }
}

export function getSessionInstancesForDate(date: string): SessionInstance[] {
  const instances = loadSessionInstances();
  return instances.filter(s => s.date === date);
}

export function getSessionInstancesForDateRange(startDate: string, endDate: string): SessionInstance[] {
  const instances = loadSessionInstances();
  return instances.filter(s => s.date >= startDate && s.date <= endDate);
}

export function deleteSessionInstance(instanceId: string): void {
  try {
    const instances = loadSessionInstances();
    const filtered = instances.filter(s => s.id !== instanceId);
    localStorage.setItem(STORAGE_KEYS.SESSION_INSTANCES, JSON.stringify(filtered));
    console.log('Session instance deleted:', instanceId);
  } catch (error) {
    console.error('Failed to delete session instance:', error);
  }
}

export function createSessionInstanceFromTemplate(template: SessionTemplate, date: string, startTime?: string): SessionInstance {
  const instanceData: SessionInstanceInsert = {
    templateId: template.id,
    templateSnapshot: {
      name: template.name,
      description: template.description,
      exercises: template.exercises,
      estimatedDurationMinutes: template.estimatedDurationMinutes,
      tags: template.tags
    },
    date,
    startTime,
    status: 'scheduled'
  };
  
  return saveSessionInstance(instanceData);
}

// Workout Progress Management
export function saveWorkoutProgress(progressData: WorkoutProgressInsert | WorkoutProgress): WorkoutProgress {
  try {
    const allProgress = loadAllWorkoutProgress();
    const now = getCurrentISOString();
    
    let progress: WorkoutProgress;
    if ('startedAt' in progressData) {
      // Updating existing progress
      progress = progressData;
    } else {
      // Creating new progress
      progress = {
        ...progressData,
        startedAt: now
      };
    }
    
    const existingIndex = allProgress.findIndex(
      p => p.sessionId === progress.sessionId && p.exerciseId === progress.exerciseId
    );
    
    if (existingIndex >= 0) {
      allProgress[existingIndex] = progress;
    } else {
      allProgress.push(progress);
    }
    
    localStorage.setItem(STORAGE_KEYS.WORKOUT_PROGRESS, JSON.stringify(allProgress));
    return progress;
  } catch (error) {
    console.error('Failed to save workout progress:', error);
    throw new Error('Failed to save workout progress');
  }
}

export function markExerciseCompleted(sessionId: string, exerciseId: string): WorkoutProgress {
  const progress = getExerciseProgress(sessionId, exerciseId);
  if (progress) {
    const updatedProgress = {
      ...progress,
      completedAt: getCurrentISOString()
    };
    return saveWorkoutProgress(updatedProgress);
  } else {
    throw new Error('Exercise progress not found');
  }
}

export function loadAllWorkoutProgress(): WorkoutProgress[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEYS.WORKOUT_PROGRESS);
    return stored ? JSON.parse(stored) : [];
  } catch (error) {
    console.error('Failed to load workout progress:', error);
    return [];
  }
}

export function getWorkoutProgress(sessionId: string): WorkoutProgress[] {
  const allProgress = loadAllWorkoutProgress();
  return allProgress.filter(p => p.sessionId === sessionId);
}

export function getExerciseProgress(sessionId: string, exerciseId: string): WorkoutProgress | null {
  const allProgress = loadAllWorkoutProgress();
  return allProgress.find(p => p.sessionId === sessionId && p.exerciseId === exerciseId) || null;
}

// Active Workout State Management
export interface ActiveWorkoutState {
  sessionId: string;
  instanceId: string; // Changed from templateId to support SessionInstance
  currentExerciseIndex: number;
  currentSetIndex: number;
  startedAt: string;
  timerState?: {
    type: 'rest' | 'stopwatch';
    startTime: number;
    duration?: number; // For rest timer
    isRunning: boolean;
  };
}

export function startWorkoutSession(instance: SessionInstance): ActiveWorkoutState {
  const activeState: ActiveWorkoutState = {
    sessionId: instance.id,
    instanceId: instance.id,
    currentExerciseIndex: 0,
    currentSetIndex: 0,
    startedAt: getCurrentISOString()
  };
  
  // Update instance status to in_progress
  const updatedInstance: SessionInstance = {
    ...instance,
    status: 'in_progress',
    startedAt: getCurrentISOString()
  };
  saveSessionInstance(updatedInstance);
  
  saveActiveWorkoutState(activeState);
  return activeState;
}

export function completeWorkoutSession(sessionId: string): void {
  // Mark session as completed
  const instances = loadSessionInstances();
  const instanceIndex = instances.findIndex(i => i.id === sessionId);
  if (instanceIndex >= 0) {
    instances[instanceIndex] = {
      ...instances[instanceIndex],
      status: 'completed',
      completedAt: getCurrentISOString()
    };
    localStorage.setItem(STORAGE_KEYS.SESSION_INSTANCES, JSON.stringify(instances));
  }
  
  // Clear active workout state
  clearActiveWorkoutState();
  console.log('Workout session completed:', sessionId);
}

export function saveActiveWorkoutState(state: ActiveWorkoutState): void {
  try {
    localStorage.setItem(STORAGE_KEYS.ACTIVE_WORKOUT, JSON.stringify(state));
    console.log('Active workout state saved:', state.sessionId);
  } catch (error) {
    console.error('Failed to save active workout state:', error);
  }
}

export function loadActiveWorkoutState(): ActiveWorkoutState | null {
  try {
    const stored = localStorage.getItem(STORAGE_KEYS.ACTIVE_WORKOUT);
    return stored ? JSON.parse(stored) : null;
  } catch (error) {
    console.error('Failed to load active workout state:', error);
    return null;
  }
}

export function clearActiveWorkoutState(): void {
  localStorage.removeItem(STORAGE_KEYS.ACTIVE_WORKOUT);
}

// Set progress utilities
export function createSetProgress(setNumber: number, data: Partial<SetProgressInsert> = {}): SetProgress {
  return {
    setNumber,
    completed: false,
    restTimerUsed: false,
    ...data
  };
}

export function markSetCompleted(sessionId: string, exerciseId: string, setNumber: number, setData: Partial<SetProgressInsert> = {}): WorkoutProgress {
  let progress = getExerciseProgress(sessionId, exerciseId);
  
  if (!progress) {
    // Create new progress if it doesn't exist
    progress = {
      sessionId,
      exerciseId,
      sets: [],
      startedAt: getCurrentISOString()
    };
  }
  
  // Find or create the set
  const setIndex = progress.sets.findIndex(s => s.setNumber === setNumber);
  const completedSet: SetProgress = {
    setNumber,
    completed: true,
    completedAt: getCurrentISOString(),
    restTimerUsed: false,
    ...setData
  };
  
  if (setIndex >= 0) {
    progress.sets[setIndex] = completedSet;
  } else {
    progress.sets.push(completedSet);
  }
  
  return saveWorkoutProgress(progress);
}

// Migration utilities for existing CSV data
export function convertCSVDataToTemplates(csvData: any[]): SessionTemplate[] {
  // Group exercises by day
  const dayGroups = csvData.reduce((groups, exercise) => {
    const dayKey = exercise.dayKey || exercise.day;
    if (!groups[dayKey]) {
      groups[dayKey] = {
        day: exercise.day,
        exercises: []
      };
    }
    groups[dayKey].exercises.push(exercise);
    return groups;
  }, {} as any);

  // Convert each day to a session template
  return Object.values(dayGroups).map((group: any, index) => {
    const exercises: SessionExercise[] = group.exercises.map((ex: any, exIndex: number) => ({
      id: generateId(),
      name: ex.exercise || ex.name,
      sets: ex.sets,
      repsMin: ex.prescription?.repsMin || ex.repsMin,
      repsMax: ex.prescription?.repsMax || ex.repsMax,
      timeSecondsMin: ex.prescription?.timeSecondsMin || ex.timeSecondsMin,
      timeSecondsMax: ex.prescription?.timeSecondsMax || ex.timeSecondsMax,
      stepsCount: ex.prescription?.stepsCount || ex.stepsCount,
      unit: ex.prescription?.unit || ex.unit || 'reps',
      perSide: ex.prescription?.perSide || ex.perSide || false,
      weight: ex.weight,
      notes: ex.notes,
      formGuidance: ex.formGuidance,
      muscleGroup: ex.muscleGroup || 'Unknown',
      mainMuscle: ex.mainMuscle || 'Unknown',
      restSeconds: 60 // Default rest time
    }));

    const templateData: SessionTemplateInsert = {
      name: group.day,
      description: `Imported from CSV data`,
      exercises,
      estimatedDurationMinutes: exercises.length * 3, // Rough estimate
      tags: ['imported', 'csv']
    };

    return saveSessionTemplate(templateData);
  });
}

// Utility functions for date handling (using local timezone)
export function formatDate(date: Date = new Date()): string {
  return formatLocalDate(date);
}

export function parseDate(dateString: string): Date {
  return parseLocalDate(dateString);
}

export function isToday(dateString: string): boolean {
  return dateString === formatLocalDate(new Date());
}

export function getWeekDates(date: Date = new Date()): string[] {
  const week = [];
  const startOfWeek = new Date(date);
  startOfWeek.setDate(date.getDate() - date.getDay()); // Start on Sunday
  
  for (let i = 0; i < 7; i++) {
    const day = new Date(startOfWeek);
    day.setDate(startOfWeek.getDate() + i);
    week.push(formatLocalDate(day));
  }
  
  return week;
}

export function getTodayString(): string {
  return formatLocalDate(new Date());
}

export function addDays(dateString: string, days: number): string {
  const date = parseLocalDate(dateString);
  date.setDate(date.getDate() + days);
  return formatLocalDate(date);
}