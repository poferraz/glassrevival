import { useState } from "react";
import { cn } from "@/lib/utils";
import ExerciseCard, { Exercise } from "./ExerciseCard";
import GlassCard from "./GlassCard";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Trophy, Target, Clock, CheckCircle } from "lucide-react";

interface WorkoutSessionProps {
  dayLabel: string;
  exercises: Exercise[];
  onExerciseComplete?: (exerciseId: string) => void;
  onSessionComplete?: () => void;
}

export default function WorkoutSession({
  dayLabel,
  exercises,
  onExerciseComplete,
  onSessionComplete
}: WorkoutSessionProps) {
  const [completedExercises, setCompletedExercises] = useState<Set<string>>(new Set());
  
  const completionPercentage = (completedExercises.size / exercises.length) * 100;
  const isSessionComplete = completedExercises.size === exercises.length;

  const handleExerciseComplete = (exerciseId: string) => {
    const newCompleted = new Set(completedExercises);
    if (newCompleted.has(exerciseId)) {
      newCompleted.delete(exerciseId);
    } else {
      newCompleted.add(exerciseId);
    }
    setCompletedExercises(newCompleted);
    onExerciseComplete?.(exerciseId);
    
    // Check if session is now complete
    if (newCompleted.size === exercises.length && newCompleted.size > 0) {
      setTimeout(() => {
        console.log('Session completed!');
        onSessionComplete?.();
      }, 500);
    }
  };

  const getMuscleGroups = () => {
    const groups = Array.from(new Set(exercises.map(ex => ex.muscleGroup)));
    return groups;
  };

  const getTotalSets = () => {
    return exercises.reduce((total, ex) => total + ex.sets, 0);
  };

  const getEstimatedTime = () => {
    // Rough estimation: 2-3 minutes per set + rest time
    const totalSets = getTotalSets();
    return Math.round(totalSets * 2.5);
  };

  return (
    <div className="space-y-6">
      {/* Session Header */}
      <GlassCard variant="primary">
        <div className="p-6">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h2 className="text-2xl font-bold text-white mb-2" data-testid="session-title">
                {dayLabel}
              </h2>
              <div className="flex flex-wrap gap-2">
                {getMuscleGroups().map((group, index) => (
                  <Badge key={index} variant="secondary" className="text-xs">
                    {group}
                  </Badge>
                ))}
              </div>
            </div>
            {isSessionComplete && (
              <div className="text-green-400 animate-bounce">
                <Trophy className="w-8 h-8" />
              </div>
            )}
          </div>

          {/* Session Stats */}
          <div className="grid grid-cols-3 gap-4 mb-4">
            <div className="flex items-center gap-2 text-white/90">
              <Target className="w-4 h-4 text-primary" />
              <div>
                <div className="text-xs opacity-75">Exercises</div>
                <div className="font-semibold" data-testid="exercise-count">
                  {exercises.length}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2 text-white/90">
              <CheckCircle className="w-4 h-4 text-primary" />
              <div>
                <div className="text-xs opacity-75">Total Sets</div>
                <div className="font-semibold" data-testid="total-sets">
                  {getTotalSets()}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2 text-white/90">
              <Clock className="w-4 h-4 text-primary" />
              <div>
                <div className="text-xs opacity-75">Est. Time</div>
                <div className="font-semibold" data-testid="estimated-time">
                  {getEstimatedTime()}min
                </div>
              </div>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-white/75">Progress</span>
              <span className="text-white font-medium" data-testid="progress-text">
                {completedExercises.size} of {exercises.length} completed
              </span>
            </div>
            <Progress 
              value={completionPercentage} 
              className="h-2 bg-white/20"
              data-testid="progress-bar"
            />
            {isSessionComplete && (
              <div className="text-green-400 text-sm font-medium animate-fade-in">
                🎉 Session Complete! Great work!
              </div>
            )}
          </div>
        </div>
      </GlassCard>

      {/* Exercise List */}
      <div className="space-y-4">
        {exercises.map((exercise) => (
          <ExerciseCard
            key={exercise.id}
            exercise={exercise}
            isCompleted={completedExercises.has(exercise.id)}
            onComplete={handleExerciseComplete}
          />
        ))}
      </div>

      {/* Session Actions */}
      {isSessionComplete && (
        <GlassCard variant="secondary" className="animate-slide-up">
          <div className="p-6 text-center">
            <Trophy className="w-12 h-12 text-yellow-400 mx-auto mb-3" />
            <h3 className="text-lg font-semibold text-white mb-2">
              Workout Complete!
            </h3>
            <p className="text-white/75 mb-4">
              You've finished all {exercises.length} exercises. Great job!
            </p>
            <div className="flex gap-3 justify-center">
              <Button 
                variant="outline" 
                onClick={() => setCompletedExercises(new Set())}
                data-testid="restart-session-button"
              >
                Restart Session
              </Button>
              <Button 
                onClick={() => console.log('Navigate to next workout')}
                data-testid="next-workout-button"
              >
                Next Workout
              </Button>
            </div>
          </div>
        </GlassCard>
      )}
    </div>
  );
}