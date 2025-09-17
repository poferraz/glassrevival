import { useCallback, useMemo } from "react";
import { SetRow } from "./SetRow";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import GlassCard from "./GlassCard";
import { SessionExercise, WorkoutProgress, SetProgress } from "@shared/schema";
import { saveWorkoutProgress } from "@/utils/sessionStorage";
import { createEmptySetProgress, createEmptyWorkoutProgress } from "@/utils/workoutHelpers";

interface SetListProps {
  sessionId: string;
  currentExercise: SessionExercise;
  workoutProgress: WorkoutProgress[];
  onProgressUpdate: (updatedProgress: WorkoutProgress[]) => void;
}

export default function SetList({ 
  sessionId, 
  currentExercise, 
  workoutProgress, 
  onProgressUpdate 
}: SetListProps) {
  // Get current exercise progress or create empty one
  const currentExerciseProgress = useMemo(() => {
    return workoutProgress.find(p => p.exerciseId === currentExercise.id) 
      || createEmptyWorkoutProgress(sessionId, currentExercise.id);
  }, [workoutProgress, currentExercise.id, sessionId]);
  
  // Generate sets data from exercise definition and current progress
  const sets = useMemo(() => {
    const setsArray = [];
    for (let i = 0; i < currentExercise.sets; i++) {
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
    // Update the set progress with new values
    let updatedProgress = { ...currentExerciseProgress };
    
    // Ensure we have enough set entries
    while (updatedProgress.sets.length < setNumber) {
      updatedProgress.sets.push(createEmptySetProgress(updatedProgress.sets.length + 1));
    }
    
    // Update the specific set
    updatedProgress.sets = updatedProgress.sets.map(set => 
      set.setNumber === setNumber 
        ? { 
            ...set, 
            reps: currentExercise.unit === 'reps' ? data.reps : set.reps,
            weight: data.weight > 0 ? data.weight : undefined,
            timeSeconds: currentExercise.unit === 'seconds' ? data.reps : set.timeSeconds, // Using reps field for seconds
            steps: currentExercise.unit === 'steps' ? data.reps : set.steps // Using reps field for steps
          }
        : set
    );
    
    updateProgress(updatedProgress);
  }, [currentExerciseProgress, currentExercise.unit, updateProgress]);

  const handleToggleComplete = useCallback((setNumber: number) => {
    let updatedProgress = { ...currentExerciseProgress };
    
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
    // For now, we don't allow removing sets from the template definition
    // This would require updating the exercise template
    console.log('Remove set not implemented - would need to modify exercise template');
  }, []);

  const handleAddSet = useCallback(() => {
    // For now, we don't allow adding sets beyond the template definition
    // This would require updating the exercise template  
    console.log('Add set not implemented - would need to modify exercise template');
  }, []);

  return (
    <GlassCard variant="tertiary" className="overflow-hidden">
      <div className="p-4">
        <h3 className="text-lg font-semibold text-white mb-4 text-center">
          Set Progress
        </h3>
        
        {/* Sets Container with max height for mobile viewport */}
        <div className="set-list-container space-y-3 mb-4">
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

        {/* Note: Add Set functionality would require modifying exercise template */}
        {currentExercise.sets < 10 && (
          <div className="text-center text-white/60 text-sm">
            Template defines {currentExercise.sets} sets
          </div>
        )}
      </div>
    </GlassCard>
  );
}