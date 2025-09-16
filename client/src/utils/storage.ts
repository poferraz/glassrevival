// Local storage utilities for workout data persistence

const STORAGE_KEYS = {
  WORKOUT_DATA: 'fittracker_workout_data',
  COMPLETED_EXERCISES: 'fittracker_completed_exercises',
  SELECTED_DAY: 'fittracker_selected_day'
} as const;

export interface StoredWorkoutData {
  data: any[];
  lastImported: string;
  filename?: string;
}

export interface CompletedExercise {
  exerciseId: string;
  dayId: string;
  completedAt: string;
}

// Workout data persistence
export function saveWorkoutData(data: any[], filename?: string): void {
  try {
    const storedData: StoredWorkoutData = {
      data,
      lastImported: new Date().toISOString(),
      filename
    };
    localStorage.setItem(STORAGE_KEYS.WORKOUT_DATA, JSON.stringify(storedData));
    console.log('Workout data saved to localStorage');
  } catch (error) {
    console.error('Failed to save workout data:', error);
  }
}

export function loadWorkoutData(): StoredWorkoutData | null {
  try {
    const stored = localStorage.getItem(STORAGE_KEYS.WORKOUT_DATA);
    return stored ? JSON.parse(stored) : null;
  } catch (error) {
    console.error('Failed to load workout data:', error);
    return null;
  }
}

export function clearWorkoutData(): void {
  localStorage.removeItem(STORAGE_KEYS.WORKOUT_DATA);
  localStorage.removeItem(STORAGE_KEYS.COMPLETED_EXERCISES);
  localStorage.removeItem(STORAGE_KEYS.SELECTED_DAY);
  console.log('Workout data cleared from localStorage');
}

// Exercise completion state
export function saveCompletedExercise(exerciseId: string, dayId: string): void {
  try {
    const completed = loadCompletedExercises();
    const newCompletion: CompletedExercise = {
      exerciseId,
      dayId,
      completedAt: new Date().toISOString()
    };
    
    // Remove existing completion for this exercise (toggle behavior)
    const filtered = completed.filter(c => c.exerciseId !== exerciseId || c.dayId !== dayId);
    filtered.push(newCompletion);
    
    localStorage.setItem(STORAGE_KEYS.COMPLETED_EXERCISES, JSON.stringify(filtered));
  } catch (error) {
    console.error('Failed to save exercise completion:', error);
  }
}

export function removeCompletedExercise(exerciseId: string, dayId: string): void {
  try {
    const completed = loadCompletedExercises();
    const filtered = completed.filter(c => !(c.exerciseId === exerciseId && c.dayId === dayId));
    localStorage.setItem(STORAGE_KEYS.COMPLETED_EXERCISES, JSON.stringify(filtered));
  } catch (error) {
    console.error('Failed to remove exercise completion:', error);
  }
}

export function loadCompletedExercises(): CompletedExercise[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEYS.COMPLETED_EXERCISES);
    return stored ? JSON.parse(stored) : [];
  } catch (error) {
    console.error('Failed to load completed exercises:', error);
    return [];
  }
}

export function isExerciseCompleted(exerciseId: string, dayId: string): boolean {
  const completed = loadCompletedExercises();
  return completed.some(c => c.exerciseId === exerciseId && c.dayId === dayId);
}

// Selected day persistence
export function saveSelectedDay(dayId: string): void {
  try {
    localStorage.setItem(STORAGE_KEYS.SELECTED_DAY, dayId);
  } catch (error) {
    console.error('Failed to save selected day:', error);
  }
}

export function loadSelectedDay(): string | null {
  try {
    return localStorage.getItem(STORAGE_KEYS.SELECTED_DAY);
  } catch (error) {
    console.error('Failed to load selected day:', error);
    return null;
  }
}