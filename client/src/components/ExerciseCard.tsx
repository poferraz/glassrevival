import { useState } from "react";
import { cn } from "@/lib/utils";
import GlassCard from "./GlassCard";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dumbbell, Clock, Target, Info } from "lucide-react";

export interface Exercise {
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
}

interface ExerciseCardProps {
  exercise: Exercise;
  isCompleted?: boolean;
  onComplete?: (exerciseId: string) => void;
}

export default function ExerciseCard({ 
  exercise, 
  isCompleted = false, 
  onComplete 
}: ExerciseCardProps) {
  const [completed, setCompleted] = useState(isCompleted);
  const [showDetails, setShowDetails] = useState(false);

  const handleComplete = () => {
    const newCompleted = !completed;
    setCompleted(newCompleted);
    onComplete?.(exercise.id);
    console.log(`Exercise ${exercise.name} ${newCompleted ? 'completed' : 'uncompleted'}`);
  };

  const formatPrescription = () => {
    const { unit, repsMin, repsMax, timeSecondsMin, timeSecondsMax, stepsCount, perSide } = exercise;
    
    let prescription = '';
    
    if (unit === 'reps') {
      if (repsMin === repsMax) {
        prescription = `${repsMin} reps`;
      } else {
        prescription = `${repsMin}-${repsMax} reps`;
      }
    } else if (unit === 'seconds') {
      if (timeSecondsMin === timeSecondsMax) {
        prescription = `${timeSecondsMin}s`;
      } else {
        prescription = `${timeSecondsMin}-${timeSecondsMax}s`;
      }
    } else if (unit === 'steps') {
      prescription = `${stepsCount} steps`;
    }
    
    return perSide ? `${prescription} per side` : prescription;
  };

  return (
    <GlassCard 
      variant="primary" 
      className={cn(
        "transition-all duration-300",
        completed && "opacity-75 bg-green-500/20 dark:bg-green-400/20"
      )}
    >
      <div className="p-6 space-y-4">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-white mb-1" data-testid={`exercise-name-${exercise.id}`}>
              {exercise.name}
            </h3>
            <div className="flex flex-wrap gap-2 mb-2">
              <Badge variant="secondary" className="text-xs">
                {exercise.mainMuscle}
              </Badge>
              <Badge variant="outline" className="text-xs text-white/80 border-white/30">
                {exercise.muscleGroup}
              </Badge>
            </div>
          </div>
          <Button
            size="sm"
            variant={completed ? "default" : "outline"}
            onClick={handleComplete}
            className="flex-shrink-0"
            data-testid={`complete-button-${exercise.id}`}
          >
            {completed ? "Done" : "Mark Complete"}
          </Button>
        </div>

        {/* Exercise Details */}
        <div className="grid grid-cols-2 gap-4 text-white">
          <div className="flex items-center gap-2">
            <Target className="w-4 h-4 text-primary" />
            <div>
              <div className="text-sm opacity-75">Sets</div>
              <div className="font-mono font-semibold" data-testid={`sets-${exercise.id}`}>
                {exercise.sets}
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            {exercise.unit === 'seconds' ? (
              <Clock className="w-4 h-4 text-primary" />
            ) : (
              <Dumbbell className="w-4 h-4 text-primary" />
            )}
            <div>
              <div className="text-sm opacity-75">
                {exercise.unit === 'seconds' ? 'Time' : 'Reps'}
              </div>
              <div className="font-mono font-semibold" data-testid={`prescription-${exercise.id}`}>
                {formatPrescription()}
              </div>
            </div>
          </div>
        </div>

        {/* Weight */}
        {exercise.weight && (
          <div className="flex items-center gap-2 text-white">
            <Dumbbell className="w-4 h-4 text-primary" />
            <div>
              <span className="text-sm opacity-75">Weight: </span>
              <span className="font-mono font-semibold" data-testid={`weight-${exercise.id}`}>
                {exercise.weight}kg
              </span>
            </div>
          </div>
        )}

        {/* Notes and Form Guidance Toggle */}
        {(exercise.notes || exercise.formGuidance) && (
          <div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowDetails(!showDetails)}
              className="text-white/80 hover:text-white p-0 h-auto"
              data-testid={`details-button-${exercise.id}`}
            >
              <Info className="w-4 h-4 mr-1" />
              {showDetails ? 'Hide Details' : 'Show Details'}
            </Button>
            
            {showDetails && (
              <div className="mt-3 space-y-3 animate-slide-up">
                {exercise.notes && (
                  <div>
                    <div className="text-sm font-medium text-white mb-1">Notes:</div>
                    <div className="text-sm text-white/80 whitespace-pre-line">
                      {exercise.notes}
                    </div>
                  </div>
                )}
                {exercise.formGuidance && (
                  <div>
                    <div className="text-sm font-medium text-white mb-1">Form Guidance:</div>
                    <div className="text-sm text-white/80">
                      {exercise.formGuidance}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </GlassCard>
  );
}