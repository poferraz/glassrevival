// Workout utility functions
import { 
  SessionExercise, 
  SessionInstance,
  SessionTemplate,
  SetProgress, 
  WorkoutProgress 
} from "@shared/schema";

export function calculateCompletedSets(progress: WorkoutProgress | null): number {
  if (!progress) return 0;
  return progress.sets.filter(set => set.completed).length;
}

export function isExerciseCompleted(exercise: SessionExercise, progress: WorkoutProgress | null): boolean {
  if (!progress) return false;
  const completedSets = calculateCompletedSets(progress);
  return completedSets >= exercise.sets;
}

export function getNextIncompleteSet(exercise: SessionExercise, progress: WorkoutProgress | null): number {
  if (!progress) return 1;
  
  for (let i = 0; i < exercise.sets; i++) {
    const setProgress = progress.sets.find(s => s.setNumber === i + 1);
    if (!setProgress || !setProgress.completed) {
      return i + 1;
    }
  }
  
  return exercise.sets; // All sets completed, return last set
}

export function formatExercisePrescription(exercise: SessionExercise): string {
  switch (exercise.unit) {
    case 'reps':
      if (exercise.repsMin && exercise.repsMax) {
        if (exercise.repsMin === exercise.repsMax) {
          return `${exercise.repsMin} reps`;
        }
        return `${exercise.repsMin}-${exercise.repsMax} reps`;
      }
      return exercise.repsMin ? `${exercise.repsMin} reps` : 'Reps';
    
    case 'seconds':
      if (exercise.timeSecondsMin && exercise.timeSecondsMax) {
        if (exercise.timeSecondsMin === exercise.timeSecondsMax) {
          return `${exercise.timeSecondsMin}s`;
        }
        return `${exercise.timeSecondsMin}-${exercise.timeSecondsMax}s`;
      }
      return exercise.timeSecondsMin ? `${exercise.timeSecondsMin}s` : 'Time';
    
    case 'steps':
      return exercise.stepsCount ? `${exercise.stepsCount} steps` : 'Steps';
    
    default:
      return '';
  }
}

export function formatWeight(weight: number | undefined): string {
  if (weight === undefined || weight === null) return '';
  if (weight === 0) return '0kg';
  return weight % 1 === 0 ? `${weight}kg` : `${weight.toFixed(1)}kg`;
}

export function formatRestTime(seconds: number): string {
  if (seconds < 60) {
    return `${seconds}s`;
  }
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  if (remainingSeconds === 0) {
    return `${minutes}m`;
  }
  return `${minutes}m ${remainingSeconds}s`;
}

export function calculateSessionProgress(exercises: SessionExercise[], progressList: WorkoutProgress[]): {
  completedExercises: number;
  totalExercises: number;
  completedSets: number;
  totalSets: number;
  percentage: number;
} {
  const totalExercises = exercises.length;
  const totalSets = exercises.reduce((sum, ex) => sum + ex.sets, 0);
  
  let completedExercises = 0;
  let completedSets = 0;
  
  exercises.forEach(exercise => {
    const progress = progressList.find(p => p.exerciseId === exercise.id) || null;
    const exerciseCompletedSets = calculateCompletedSets(progress);
    completedSets += exerciseCompletedSets;
    
    if (exerciseCompletedSets >= exercise.sets) {
      completedExercises++;
    }
  });
  
  const percentage = totalSets > 0 ? Math.round((completedSets / totalSets) * 100) : 0;
  
  return {
    completedExercises,
    totalExercises,
    completedSets,
    totalSets,
    percentage
  };
}

// SessionInstance helper functions
export function calculateInstanceProgress(instance: SessionInstance, progressList: WorkoutProgress[]): {
  completedExercises: number;
  totalExercises: number;
  completedSets: number;
  totalSets: number;
  percentage: number;
} {
  return calculateSessionProgress(instance.templateSnapshot.exercises, progressList);
}

export function getInstanceExercises(instance: SessionInstance): SessionExercise[] {
  return instance.templateSnapshot.exercises;
}

export function isInstanceCompleted(instance: SessionInstance, progressList: WorkoutProgress[]): boolean {
  const { completedExercises, totalExercises } = calculateInstanceProgress(instance, progressList);
  return completedExercises >= totalExercises;
}

export function getInstanceDuration(instance: SessionInstance): number {
  return instance.templateSnapshot.estimatedDurationMinutes || estimateSessionDuration(instance.templateSnapshot.exercises);
}

export function estimateSessionDuration(exercises: SessionExercise[]): number {
  // Rough estimation: 2-3 minutes per set based on exercise type + rest time
  let totalMinutes = 0;
  
  exercises.forEach(exercise => {
    // Different time estimates based on exercise unit
    let setTime = 2; // Default 2 minutes per set
    
    if (exercise.unit === 'seconds') {
      // For time-based exercises, use the actual time plus setup
      const avgTime = exercise.timeSecondsMin && exercise.timeSecondsMax 
        ? (exercise.timeSecondsMin + exercise.timeSecondsMax) / 2
        : exercise.timeSecondsMin || 60;
      setTime = (avgTime + 30) / 60; // Add 30s setup time, convert to minutes
    } else if (exercise.unit === 'steps') {
      // Steps-based exercises typically take longer
      setTime = 3;
    } else {
      // Reps-based exercises
      const avgReps = exercise.repsMin && exercise.repsMax 
        ? (exercise.repsMin + exercise.repsMax) / 2
        : exercise.repsMin || 10;
      
      // Estimate time based on rep count (higher reps = longer time)
      if (avgReps > 15) {
        setTime = 3;
      } else if (avgReps > 8) {
        setTime = 2.5;
      } else {
        setTime = 2;
      }
    }
    
    const restTime = (exercise.restSeconds || 60) / 60; // Convert to minutes
    totalMinutes += (exercise.sets * setTime) + ((exercise.sets - 1) * restTime);
  });
  
  return Math.round(totalMinutes);
}

export function generateUniqueId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

// Enhanced exercise prescription formatting with better units handling
export function formatExercisePrescriptionDetailed(exercise: SessionExercise): {
  primary: string;
  secondary?: string;
  unit: string;
} {
  let primary = '';
  let secondary = undefined;
  let unit = '';
  
  switch (exercise.unit) {
    case 'reps':
      unit = exercise.perSide ? 'reps per side' : 'reps';
      if (exercise.repsMin && exercise.repsMax) {
        if (exercise.repsMin === exercise.repsMax) {
          primary = `${exercise.repsMin}`;
        } else {
          primary = `${exercise.repsMin}-${exercise.repsMax}`;
        }
      } else {
        primary = exercise.repsMin?.toString() || 'Reps';
      }
      break;
    
    case 'seconds':
      unit = 'seconds';
      if (exercise.timeSecondsMin && exercise.timeSecondsMax) {
        if (exercise.timeSecondsMin === exercise.timeSecondsMax) {
          primary = `${exercise.timeSecondsMin}`;
        } else {
          primary = `${exercise.timeSecondsMin}-${exercise.timeSecondsMax}`;
        }
      } else {
        primary = exercise.timeSecondsMin?.toString() || 'Time';
      }
      break;
    
    case 'steps':
      unit = exercise.perSide ? 'steps per side' : 'steps';
      primary = exercise.stepsCount?.toString() || 'Steps';
      break;
  }
  
  // Add weight as secondary info if available
  if (exercise.weight) {
    secondary = formatWeight(exercise.weight);
  }
  
  return { primary, secondary, unit };
}

export function createEmptySetProgress(setNumber: number): SetProgress {
  return {
    setNumber,
    completed: false,
    restTimerUsed: false
  };
}

export function createEmptyWorkoutProgress(sessionId: string, exerciseId: string): WorkoutProgress {
  return {
    sessionId,
    exerciseId,
    sets: [],
    startedAt: new Date().toISOString()
  };
}

// Advanced set tracking utilities
export function getSetStatus(exercise: SessionExercise, progress: WorkoutProgress | null, setNumber: number): 'not_started' | 'in_progress' | 'completed' {
  if (!progress) return 'not_started';
  
  const setProgress = progress.sets.find(s => s.setNumber === setNumber);
  if (!setProgress) return 'not_started';
  if (setProgress.completed) return 'completed';
  
  // Check if any data has been entered for this set
  const hasData = setProgress.reps !== undefined || 
                  setProgress.weight !== undefined || 
                  setProgress.timeSeconds !== undefined || 
                  setProgress.steps !== undefined;
  
  return hasData ? 'in_progress' : 'not_started';
}

export function getAllSetsStatus(exercise: SessionExercise, progress: WorkoutProgress | null): ('not_started' | 'in_progress' | 'completed')[] {
  const statuses = [];
  for (let i = 1; i <= exercise.sets; i++) {
    statuses.push(getSetStatus(exercise, progress, i));
  }
  return statuses;
}

export function getCompletionPercentage(exercise: SessionExercise, progress: WorkoutProgress | null): number {
  if (!progress) return 0;
  const completedSets = calculateCompletedSets(progress);
  return Math.round((completedSets / exercise.sets) * 100);
}

// Session status utilities
export function getSessionStatus(instance: SessionInstance): string {
  switch (instance.status) {
    case 'scheduled':
      return 'Scheduled';
    case 'in_progress':
      return 'In Progress';
    case 'completed':
      return 'Completed';
    case 'skipped':
      return 'Skipped';
    default:
      return 'Unknown';
  }
}

export function getSessionStatusColor(instance: SessionInstance): string {
  switch (instance.status) {
    case 'scheduled':
      return 'text-blue-400';
    case 'in_progress':
      return 'text-yellow-400';
    case 'completed':
      return 'text-green-400';
    case 'skipped':
      return 'text-gray-400';
    default:
      return 'text-gray-400';
  }
}

// Time formatting utilities
export function formatDuration(minutes: number): string {
  if (minutes < 60) {
    return `${minutes}m`;
  }
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  if (remainingMinutes === 0) {
    return `${hours}h`;
  }
  return `${hours}h ${remainingMinutes}m`;
}

export function formatTimeOfDay(timeString?: string): string {
  if (!timeString) return '';
  
  try {
    const [hours, minutes] = timeString.split(':').map(Number);
    const date = new Date();
    date.setHours(hours, minutes, 0, 0);
    
    return date.toLocaleTimeString([], { 
      hour: 'numeric', 
      minute: '2-digit',
      hour12: true 
    });
  } catch {
    return timeString;
  }
}

// Validation utilities
export function validateExerciseData(exercise: SessionExercise): string[] {
  const errors: string[] = [];
  
  if (!exercise.name.trim()) {
    errors.push('Exercise name is required');
  }
  
  if (exercise.sets < 1) {
    errors.push('Sets must be at least 1');
  }
  
  if (exercise.unit === 'reps') {
    if (exercise.repsMin && exercise.repsMin < 1) {
      errors.push('Minimum reps must be at least 1');
    }
    if (exercise.repsMax && exercise.repsMin && exercise.repsMax < exercise.repsMin) {
      errors.push('Maximum reps must be greater than or equal to minimum reps');
    }
  }
  
  if (exercise.unit === 'seconds') {
    if (exercise.timeSecondsMin && exercise.timeSecondsMin < 1) {
      errors.push('Minimum time must be at least 1 second');
    }
    if (exercise.timeSecondsMax && exercise.timeSecondsMin && exercise.timeSecondsMax < exercise.timeSecondsMin) {
      errors.push('Maximum time must be greater than or equal to minimum time');
    }
  }
  
  if (exercise.unit === 'steps' && exercise.stepsCount && exercise.stepsCount < 1) {
    errors.push('Steps count must be at least 1');
  }
  
  if (exercise.weight !== undefined && exercise.weight < 0) {
    errors.push('Weight cannot be negative');
  }
  
  if (exercise.restSeconds !== undefined && exercise.restSeconds < 0) {
    errors.push('Rest time cannot be negative');
  }
  
  return errors;
}