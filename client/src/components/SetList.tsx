import { useCallback, useMemo } from "react";
import { SetRow } from "./SetRow";
import GlassCard from "./GlassCard";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { SessionExercise, WorkoutProgress, SetProgress } from "@shared/schema";
import { saveWorkoutProgress } from "@/utils/sessionStorage";
import { createEmptySetProgress, createEmptyWorkoutProgress } from "@/utils/workoutHelpers";

interface SetListProps {
  sessionId: string;
  currentExercise: SessionExercise;
  workoutProgress: WorkoutProgress[];
  onProgressUpdate: (updatedProgress: WorkoutProgress[]) => void;
  isPanelsOpen?: boolean;
  onAddSet?: () => void;
}

export default function SetList({ 
  sessionId, 
  currentExercise, 
  workoutProgress, 
  onProgressUpdate,
  isPanelsOpen = false,
  onAddSet
}: SetListProps) {
  // Get current exercise progress or create empty one
  const currentExerciseProgress = useMemo(() => {
    return workoutProgress.find(p => p.exerciseId === currentExercise.id) 
      || createEmptyWorkoutProgress(sessionId, currentExercise.id);
  }, [workoutProgress, currentExercise.id, sessionId]);
  
  // Generate sets data from exercise definition and current progress
  // Allow dynamic expansion beyond template definition
  const sets = useMemo(() => {
    const setsArray = [];
    // Use the maximum of template sets or actual progress sets
    const maxSets = Math.max(currentExercise.sets, currentExerciseProgress.sets.length);
    
    for (let i = 0; i < maxSets; i++) {
      const setNumber = i + 1;
      const setProgress = currentExerciseProgress.sets.find(s => s.setNumber === setNumber)
        || createEmptySetProgress(setNumber);
      
      setsArray.push({
        setNumber,
        setProgress,
        // Default values based on exercise definition
        defaultReps: currentExercise.unit === 'reps' ? (currentExercise.repsMin || 8) : 0,
        defaultWeight: currentExercise.weight || 0,
        defaultTimeSeconds: currentExercise.unit === 'seconds' ? (currentExercise.timeSecondsMin || 30) : 0,
        defaultSteps: currentExercise.unit === 'steps' ? (currentExercise.stepsCount || 10) : 0
      });
    }
    return setsArray;
  }, [currentExercise, currentExerciseProgress]);

  const updateProgress = useCallback((updatedExerciseProgress: WorkoutProgress) => {
    // Update the workout progress and save to storage
    saveWorkoutProgress(updatedExerciseProgress);
    
    // Update parent state
    const updatedProgressList = workoutProgress.map(p => 
      p.exerciseId === updatedExerciseProgress.exerciseId ? updatedExerciseProgress : p
    );
    
    // If this exercise progress didn't exist before, add it
    if (!workoutProgress.find(p => p.exerciseId === updatedExerciseProgress.exerciseId)) {
      updatedProgressList.push(updatedExerciseProgress);
    }
    
    onProgressUpdate(updatedProgressList);
  }, [workoutProgress, onProgressUpdate]);

  const handleSetChange = useCallback((setNumber: number, data: { reps: number; weight: number }) => {
    // Update the set progress with new values - use proper immutable updates
    let updatedProgress = { ...currentExerciseProgress, sets: [...currentExerciseProgress.sets] };
    
    // Ensure we have enough set entries
    while (updatedProgress.sets.length < setNumber) {
      updatedProgress.sets.push(createEmptySetProgress(updatedProgress.sets.length + 1));
    }
    
    // Update the specific set and reset completion flag if values changed
    updatedProgress.sets = updatedProgress.sets.map(set => {
      if (set.setNumber === setNumber) {
        const newReps = currentExercise.unit === 'reps' ? data.reps : set.reps;
        const newTimeSeconds = currentExercise.unit === 'seconds' ? data.reps : set.timeSeconds;
        const newSteps = currentExercise.unit === 'steps' ? data.reps : set.steps;
        const newWeight = data.weight > 0 ? data.weight : undefined;
        
        // Check if values actually changed to reset completion
        const repsChanged = newReps !== set.reps;
        const timeChanged = newTimeSeconds !== set.timeSeconds;
        const stepsChanged = newSteps !== set.steps;
        const weightChanged = newWeight !== set.weight;
        
        const shouldResetCompletion = set.completed && (repsChanged || timeChanged || stepsChanged || weightChanged);
        
        return {
          ...set,
          reps: newReps,
          weight: newWeight,
          timeSeconds: newTimeSeconds,
          steps: newSteps,
          // Reset completion flag if values changed
          completed: shouldResetCompletion ? false : set.completed,
          completedAt: shouldResetCompletion ? undefined : set.completedAt
        };
      }
      return set;
    });
    
    updateProgress(updatedProgress);
  }, [currentExerciseProgress, currentExercise.unit, updateProgress]);

  const handleToggleComplete = useCallback((setNumber: number) => {
    let updatedProgress = { ...currentExerciseProgress, sets: [...currentExerciseProgress.sets] };
    
    // Ensure we have enough set entries
    while (updatedProgress.sets.length < setNumber) {
      updatedProgress.sets.push(createEmptySetProgress(updatedProgress.sets.length + 1));
    }
    
    // Toggle completion status
    updatedProgress.sets = updatedProgress.sets.map(set => 
      set.setNumber === setNumber 
        ? { 
            ...set, 
            completed: !set.completed,
            completedAt: !set.completed ? new Date().toISOString() : undefined
          }
        : set
    );
    
    updateProgress(updatedProgress);
  }, [currentExerciseProgress, updateProgress]);

  const handleRemoveSet = useCallback((setNumber: number) => {
    // Prevent removing if only one set remains
    if (sets.length <= 1) {
      alert('Cannot remove the last set. At least one set is required.');
      return;
    }
    
    let updatedProgress = { ...currentExerciseProgress, sets: [...currentExerciseProgress.sets] };
    
    // Remove the set and renumber remaining sets
    const filteredSets = updatedProgress.sets
      .filter(set => set.setNumber !== setNumber)
      .map((set, index) => ({
        ...set,
        setNumber: index + 1 // Renumber sets to maintain sequence
      }));
    
    updatedProgress.sets = filteredSets;
    updateProgress(updatedProgress);
  }, [currentExerciseProgress, sets.length, updateProgress]);


  return (
    <GlassCard variant="tertiary" className="overflow-hidden h-full">
      <div className="p-4 h-full flex flex-col">
        <div className="flex items-center justify-between mb-4 flex-none">
          <h3 className="text-lg font-semibold text-white">
            Set Progress
          </h3>
          {onAddSet && currentExerciseProgress && currentExerciseProgress.sets.length < 12 && (
            <Button
              size="sm"
              variant="outline"
              onClick={onAddSet}
              className="w-6 h-6 p-0 rounded-full text-white border-white/20 hover:bg-white/10 hover:border-white/30"
              data-testid="button-add-set"
            >
              <Plus className="w-3 h-3" />
            </Button>
          )}
        </div>
        
        {/* Sets Container - Scrollable list with height constraints */}
        <div className={`set-list-container divide-y divide-white/10 mb-4 overflow-y-auto flex-1 min-h-0`}>
          {sets.map((set) => {
            const displayValue = currentExercise.unit === 'reps' ? 
              (set.setProgress.reps ?? set.defaultReps) :
              currentExercise.unit === 'seconds' ?
              (set.setProgress.timeSeconds ?? set.defaultTimeSeconds) :
              (set.setProgress.steps ?? set.defaultSteps);
              
            return (
              <SetRow
                key={set.setNumber}
                index={set.setNumber}
                reps={displayValue}
                weight={set.setProgress.weight ?? set.defaultWeight}
                completed={set.setProgress.completed}
                unit={currentExercise.unit}
                perSide={currentExercise.perSide}
                onChange={(data) => handleSetChange(set.setNumber, data)}
                onToggleComplete={() => handleToggleComplete(set.setNumber)}
                onRemove={() => handleRemoveSet(set.setNumber)}
              />
            );
          })}
        </div>

      </div>
    </GlassCard>
  );
}