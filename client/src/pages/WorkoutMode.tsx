import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { useRoute, useLocation } from "wouter";
import { SessionExercise, WorkoutProgress, SetProgress, SessionInstance } from "@shared/schema";
import { 
  getSessionTemplate,
  loadSessionInstances,
  saveSessionInstance,
  saveWorkoutProgress,
  getWorkoutProgress,
  getExerciseProgress,
  saveActiveWorkoutState,
  loadActiveWorkoutState,
  clearActiveWorkoutState,
  ActiveWorkoutState
} from "@/utils/sessionStorage";
import { 
  formatExercisePrescription, 
  formatWeight, 
  formatRestTime,
  calculateCompletedSets,
  getNextIncompleteSet,
  createEmptySetProgress,
  createEmptyWorkoutProgress
} from "@/utils/workoutHelpers";
import { isAIConfigured, type AISuggestion } from "@/utils/deepseekApi";
import GlassCard from "@/components/GlassCard";
import SetList from "@/components/SetList";
import AIHelperModal from "@/components/AIHelperModal";
import { Button } from "@/components/ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { 
  Play, 
  Pause, 
  Square, 
  SkipForward, 
  SkipBack, 
  Timer, 
  Clock,
  CheckCircle,
  Circle,
  RotateCcw,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  Plus,
  Minus,
  Sparkles
} from "lucide-react";
import { Input } from "@/components/ui/input";

interface WorkoutModeProps {
  sessionId: string;
}

export default function WorkoutMode() {
  const [match, params] = useRoute("/workout/:sessionId");
  const [, navigate] = useLocation();
  const sessionId = params?.sessionId;
  
  const [currentExerciseIndex, setCurrentExerciseIndex] = useState(0);
  const [currentSetIndex, setCurrentSetIndex] = useState(0);
  const [exercises, setExercises] = useState<SessionExercise[]>([]);
  const [workoutProgress, setWorkoutProgress] = useState<WorkoutProgress[]>([]);
  const [timerType, setTimerType] = useState<'rest' | 'stopwatch' | null>(null);
  const [timerSeconds, setTimerSeconds] = useState(0);
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const [sessionStarted, setSessionStarted] = useState(false);
  const [sessionInstance, setSessionInstance] = useState<SessionInstance | null>(null);
  const [sessionNotFound, setSessionNotFound] = useState(false);
  const [showFormGuidance, setShowFormGuidance] = useState(false);
  const [showNotes, setShowNotes] = useState(false);
  const [showAIModal, setShowAIModal] = useState(false);
  
  // Handler for progress updates from SetList
  const handleProgressUpdate = useCallback((updatedProgress: WorkoutProgress[]) => {
    setWorkoutProgress(updatedProgress);
  }, []);
  
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const startTimeRef = useRef<number | null>(null);

  useEffect(() => {
    if (!sessionId) return;

    // Try to load active workout state first
    const activeState = loadActiveWorkoutState();
    if (activeState && activeState.sessionId === sessionId) {
      // Resume existing workout
      setCurrentExerciseIndex(activeState.currentExerciseIndex);
      setCurrentSetIndex(activeState.currentSetIndex);
      setSessionStarted(true);
      
      if (activeState.timerState) {
        setTimerType(activeState.timerState.type);
        setIsTimerRunning(activeState.timerState.isRunning);
        if (activeState.timerState.isRunning) {
          const elapsed = Date.now() - activeState.timerState.startTime;
          if (activeState.timerState.type === 'rest' && activeState.timerState.duration) {
            setTimerSeconds(Math.max(0, activeState.timerState.duration - Math.floor(elapsed / 1000)));
          } else {
            setTimerSeconds(Math.floor(elapsed / 1000));
          }
        } else {
          setTimerSeconds(activeState.timerState.duration || 0);
        }
      }
    }

    // Load session data from SessionInstances
    const sessionInstances = loadSessionInstances();
    const instance = sessionInstances.find(s => s.id === sessionId);
    
    if (instance) {
      setSessionInstance(instance);
      setExercises(instance.templateSnapshot.exercises);
      setWorkoutProgress(getWorkoutProgress(sessionId));
      setSessionNotFound(false);
      
      // Update session status to in_progress when first loaded
      if (instance.status === 'scheduled') {
        updateSessionStatus('in_progress');
      }
    } else {
      setSessionNotFound(true);
      console.error('Session not found:', sessionId);
    }
  }, [sessionId]);

  useEffect(() => {
    // Update active workout state whenever key state changes
    if (sessionStarted && sessionId) {
      const activeState: ActiveWorkoutState = {
        sessionId,
        instanceId: sessionId, // Using sessionId as instanceId for now
        currentExerciseIndex,
        currentSetIndex,
        startedAt: startTimeRef.current ? new Date(startTimeRef.current).toISOString() : new Date().toISOString(),
        timerState: timerType ? {
          type: timerType,
          startTime: Date.now() - (timerSeconds * 1000),
          duration: timerType === 'rest' ? getRestDuration() : undefined,
          isRunning: isTimerRunning
        } : undefined
      };
      saveActiveWorkoutState(activeState);
    }
  }, [sessionId, currentExerciseIndex, currentSetIndex, timerType, timerSeconds, isTimerRunning, sessionStarted]);

  useEffect(() => {
    if (isTimerRunning && timerRef.current === null) {
      timerRef.current = setInterval(() => {
        setTimerSeconds(prev => {
          if (timerType === 'rest' && prev <= 1) {
            // Rest timer finished
            setIsTimerRunning(false);
            setTimerType(null);
            return 0;
          }
          return timerType === 'rest' ? prev - 1 : prev + 1;
        });
      }, 1000);
    } else if (!isTimerRunning && timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [isTimerRunning, timerType]);

  const currentExercise = exercises[currentExerciseIndex];

  // Current exercise progress for display
  const currentExerciseProgress = useMemo(() => {
    return currentExercise ? getExerciseProgress(sessionId!, currentExercise.id) : null;
  }, [workoutProgress, currentExercise, sessionId]);

  const startWorkout = () => {
    setSessionStarted(true);
    startTimeRef.current = Date.now();
    console.log('Workout started');
  };

  // Helper function for session status updates (defined below)

  const completeSet = () => {
    if (!currentExercise || !sessionId) return;

    let progress = currentExerciseProgress || createEmptyWorkoutProgress(sessionId, currentExercise.id);
    
    // Ensure we have enough set progress entries
    while (progress.sets.length <= currentSetIndex) {
      progress.sets.push(createEmptySetProgress(progress.sets.length + 1));
    }

    // Mark current set as completed - values are managed by SetList
    const currentSetProgress = progress.sets[currentSetIndex];
    progress.sets[currentSetIndex] = {
      ...currentSetProgress,
      completed: true,
      completedAt: new Date().toISOString(),
      restTimerUsed: timerType === 'rest'
    };

    saveWorkoutProgress(progress);
    setWorkoutProgress(prev => {
      const updated = prev.filter(p => p.exerciseId !== currentExercise.id);
      updated.push(progress);
      return updated;
    });

    // Move to next set or exercise
    if (currentSetIndex < currentExercise.sets - 1) {
      setCurrentSetIndex(prev => prev + 1);
    } else {
      nextExercise();
    }

    console.log(`Set ${currentSetIndex + 1} completed for ${currentExercise.name}`, progress.sets[currentSetIndex]);
  };

  const nextExercise = () => {
    if (currentExerciseIndex < exercises.length - 1) {
      setCurrentExerciseIndex(prev => prev + 1);
      setCurrentSetIndex(0);
      stopTimer();
    } else {
      // Workout complete
      finishWorkout();
    }
  };

  const previousExercise = () => {
    if (currentExerciseIndex > 0) {
      setCurrentExerciseIndex(prev => prev - 1);
      setCurrentSetIndex(0);
      stopTimer();
    }
  };

  const handleAddSet = useCallback(() => {
    if (!currentExercise || !sessionId || !currentExerciseProgress) return;
    
    // Don't allow more than 12 sets
    if (currentExerciseProgress.sets.length >= 12) return;
    
    let updatedProgress = { ...currentExerciseProgress, sets: [...currentExerciseProgress.sets] };
    
    // Create new set with default values
    const newSetNumber = currentExerciseProgress.sets.length + 1;
    const newSet = createEmptySetProgress(newSetNumber);
    
    // Set default values based on exercise type
    if (currentExercise.unit === 'reps') {
      newSet.reps = currentExercise.repsMin || 8;
    } else if (currentExercise.unit === 'seconds') {
      newSet.timeSeconds = currentExercise.timeSecondsMin || 30;
    } else if (currentExercise.unit === 'steps') {
      newSet.steps = currentExercise.stepsCount || 10;
    }
    
    if (currentExercise.weight && currentExercise.weight > 0) {
      newSet.weight = currentExercise.weight;
    }
    
    updatedProgress.sets.push(newSet);
    
    saveWorkoutProgress(updatedProgress);
    setWorkoutProgress(prev => {
      const updated = prev.filter(p => p.exerciseId !== currentExercise.id);
      updated.push(updatedProgress);
      return updated;
    });
  }, [currentExercise, sessionId, currentExerciseProgress]);

  const getRestDuration = (): number => {
    return currentExercise?.restSeconds || 60;
  };

  const startRestTimer = () => {
    const duration = getRestDuration();
    setTimerType('rest');
    setTimerSeconds(duration);
    setIsTimerRunning(true);
  };

  const startStopwatch = () => {
    setTimerType('stopwatch');
    setTimerSeconds(0);
    setIsTimerRunning(true);
  };

  const stopTimer = () => {
    setIsTimerRunning(false);
    setTimerType(null);
    setTimerSeconds(0);
  };

  const toggleTimer = () => {
    setIsTimerRunning(prev => !prev);
  };

  const resetTimer = () => {
    if (timerType === 'rest') {
      setTimerSeconds(getRestDuration());
    } else {
      setTimerSeconds(0);
    }
    setIsTimerRunning(false);
  };

  const updateSessionStatus = (status: 'in_progress' | 'completed' | 'skipped') => {
    if (!sessionInstance) return;
    
    try {
      if ('templateSnapshot' in sessionInstance) {
        // SessionInstance
        const updatedInstance: SessionInstance = {
          ...sessionInstance,
          status,
          startedAt: status === 'in_progress' && !sessionInstance.startedAt 
            ? new Date().toISOString() 
            : sessionInstance.startedAt,
          completedAt: status === 'completed' ? new Date().toISOString() : sessionInstance.completedAt
        };
        saveSessionInstance(updatedInstance);
        setSessionInstance(updatedInstance);
      }
      
      console.log(`Session status updated to: ${status}`);
    } catch (error) {
      console.error('Failed to update session status:', error);
    }
  };

  const finishWorkout = () => {
    updateSessionStatus('completed');
    clearActiveWorkoutState();
    console.log('Workout completed');
    
    // Navigate back to calendar
    navigate('/');
  };

  const exitWorkout = () => {
    clearActiveWorkoutState();
    navigate('/');
  };

  // AI Helper functions
  const handleOpenAIModal = () => {
    setShowAIModal(true);
  };

  const handleCloseAIModal = () => {
    setShowAIModal(false);
  };

  const handleApplyQuickEdit = useCallback((edits: Partial<SessionExercise>) => {
    if (!sessionInstance || !currentExercise) return;
    
    // Update the current exercise in the session instance
    const updatedExercises = exercises.map(exercise => 
      exercise.id === currentExercise.id 
        ? { ...exercise, ...edits }
        : exercise
    );
    
    setExercises(updatedExercises);
    
    // Update the session instance with the modified exercise
    if ('templateSnapshot' in sessionInstance) {
      const updatedInstance: SessionInstance = {
        ...sessionInstance,
        templateSnapshot: {
          ...sessionInstance.templateSnapshot,
          exercises: updatedExercises
        }
      };
      saveSessionInstance(updatedInstance);
      setSessionInstance(updatedInstance);
    }
    
    console.log('Applied AI quick edit to exercise:', currentExercise.name, edits);
  }, [sessionInstance, currentExercise, exercises]);

  const handleApplySuggestion = useCallback((suggestion: AISuggestion) => {
    if (!sessionInstance || !currentExercise) return;
    
    // Parse the suggestion reps format
    let repsMin: number | undefined;
    let repsMax: number | undefined;
    let timeSecondsMin: number | undefined;
    let timeSecondsMax: number | undefined;
    
    // Simple parsing for common formats
    const repsStr = suggestion.reps.toLowerCase();
    if (repsStr.includes('-')) {
      const [min, max] = repsStr.split('-').map(s => parseInt(s.trim()));
      repsMin = min;
      repsMax = max;
    } else if (repsStr.includes('s')) {
      const seconds = parseInt(repsStr.replace('s', ''));
      timeSecondsMin = seconds;
      timeSecondsMax = seconds;
    } else {
      const reps = parseInt(repsStr);
      repsMin = reps;
      repsMax = reps;
    }
    
    // Create updated exercise based on suggestion
    const updatedExercise: SessionExercise = {
      ...currentExercise,
      name: suggestion.name,
      sets: suggestion.sets,
      repsMin,
      repsMax,
      timeSecondsMin,
      timeSecondsMax,
      formGuidance: suggestion.formGuidance || currentExercise.formGuidance
    };
    
    // Update exercises array
    const updatedExercises = exercises.map(exercise => 
      exercise.id === currentExercise.id ? updatedExercise : exercise
    );
    
    setExercises(updatedExercises);
    
    // Update the session instance
    if ('templateSnapshot' in sessionInstance) {
      const updatedInstance: SessionInstance = {
        ...sessionInstance,
        templateSnapshot: {
          ...sessionInstance.templateSnapshot,
          exercises: updatedExercises
        }
      };
      saveSessionInstance(updatedInstance);
      setSessionInstance(updatedInstance);
    }
    
    console.log('Applied AI suggestion:', suggestion.name);
  }, [sessionInstance, currentExercise, exercises]);

  if (!sessionId) {
    return (
      <div className="flex flex-col h-dvh min-h-0 bg-background items-center justify-center px-4">
        <div className="p-4 text-center">
          <p className="text-foreground">Invalid session ID</p>
        </div>
      </div>
    );
  }
  
  if (sessionNotFound) {
    return (
      <div className="flex flex-col h-dvh min-h-0 bg-background items-center justify-center px-4">
        <div className="p-4 text-center">
          <p className="text-foreground mb-4">Session not found</p>
          <Button onClick={() => navigate('/')}>Return to Calendar</Button>
        </div>
      </div>
    );
  }

  if (!currentExercise) {
    return (
      <div className="flex flex-col h-dvh min-h-0 bg-background items-center justify-center px-4">
        <GlassCard variant="tertiary">
          <div className="p-8 text-center">
            <h2 className="text-lg font-semibold text-white mb-2">
              Loading Workout...
            </h2>
            <p className="text-white/60">
              Please wait while we load your workout data.
            </p>
          </div>
        </GlassCard>
      </div>
    );
  }

  const formatTimerDisplay = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const currentSetProgress = currentExerciseProgress?.sets.find(s => s.setNumber === currentSetIndex + 1);
  const completedSets = calculateCompletedSets(currentExerciseProgress);
  const overallProgress = Math.round(((currentExerciseIndex + (completedSets / currentExercise.sets)) / exercises.length) * 100);

  return (
    <div className="flex flex-col h-screen max-h-screen overflow-hidden">
        {/* Compact Header with Exit, Progress, and AI */}
        <div className="flex-none px-3 pt-safe pb-1" data-testid="header">
          <div className="flex items-center gap-2">
            {/* Exit Button */}
            <GlassCard 
              variant="secondary" 
              onClick={exitWorkout}
              className="w-10 h-10 flex items-center justify-center cursor-pointer bg-red-500/20 border-red-500/40 text-red-400"
              data-testid="button-exit-workout"
            >
              <ChevronLeft className="w-4 h-4" />
            </GlassCard>
            
            {/* Progress */}
            <div className="flex-1">
              <GlassCard variant="secondary" className="p-2">
                <div className="flex items-center justify-between">
                  <div className="text-xs text-white/80">
                    {currentExerciseIndex + 1}/{exercises.length}
                  </div>
                  <div className="text-sm font-bold text-white">{overallProgress}%</div>
                </div>
                <div className="w-full bg-white/20 rounded-full h-1 mt-1">
                  <div 
                    className="bg-primary h-1 rounded-full transition-all duration-300"
                    style={{ width: `${overallProgress}%` }}
                  />
                </div>
              </GlassCard>
            </div>
            
            {/* AI Button */}
            {isAIConfigured() && (
              <GlassCard 
                variant="secondary" 
                onClick={handleOpenAIModal}
                className="w-10 h-10 flex items-center justify-center cursor-pointer bg-blue-500/20 border-blue-500/40 text-blue-400"
                data-testid="button-ai-helper"
              >
                <Sparkles className="w-4 h-4" />
              </GlassCard>
            )}
          </div>
        </div>

      {/* Middle Content Container - Title + SetList + Panels */}
      <div className="flex flex-col flex-1 min-h-0">
        {/* Compact Exercise Title */}
        <div className="flex-none px-3 pb-1" data-testid="exercise-title">
          <GlassCard variant="primary" className="p-3">
            <div className="text-center">
              <h2 className="text-lg font-bold text-white mb-1" data-testid="current-exercise-name">
                {currentExercise.name}
              </h2>
              <div className="text-xs text-blue-300 mb-2">
                {currentExercise.muscleGroup}
                {currentExercise.mainMuscle && currentExercise.mainMuscle !== currentExercise.muscleGroup && (
                  <span className="ml-1 text-white/60">• {currentExercise.mainMuscle}</span>
                )}
              </div>
              
              {/* Compact Set Status Indicators */}
              <div className="flex gap-1 items-center justify-center">
                {Array.from({ length: currentExercise.sets }, (_, i) => {
                  const setProgress = currentExerciseProgress?.sets.find(s => s.setNumber === i + 1);
                  const isCompleted = setProgress?.completed || false;
                  const isCurrent = i === currentSetIndex;
                  
                  return (
                    <div
                      key={i}
                      className={`w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold ${
                        isCompleted 
                          ? 'bg-green-500 text-white'
                          : isCurrent
                          ? 'bg-primary text-white'
                          : 'bg-white/20 text-white/50'
                      }`}
                    >
                      {isCompleted ? '✓' : i + 1}
                    </div>
                  );
                })}
              </div>
            </div>
          </GlassCard>
        </div>

        {/* Compact Set Progress */}
        <div className="flex-1 px-3 pb-1 min-h-0" data-testid="set-progress">
          <div className="h-full">
            {sessionStarted && currentExercise && sessionId ? (
              <SetList 
                sessionId={sessionId}
                currentExercise={currentExercise}
                workoutProgress={workoutProgress}
                onProgressUpdate={(updatedProgress) => setWorkoutProgress(updatedProgress)}
                isPanelsOpen={false}
                onAddSet={handleAddSet}
              />
            ) : (
              <GlassCard variant="tertiary" className="h-full flex items-center justify-center">
                <div className="text-center p-6">
                  <h3 className="text-base font-semibold text-white mb-2">
                    Ready to Start?
                  </h3>
                  <p className="text-white/60 text-sm">
                    Set tracking will appear here once you begin your workout.
                  </p>
                </div>
              </GlassCard>
            )}
          </div>
        </div>

        {/* Compact Action Bar */}
        <div className="flex-none px-3 pb-1" data-testid="action-bar">
          <div className="flex gap-2">
            {!sessionStarted ? (
              <Button
                size="lg"
                variant="default"
                onClick={startWorkout}
                className="flex-1"
                data-testid="button-start-workout"
              >
                <Play className="w-4 h-4 mr-2" />
                Start Workout
              </Button>
            ) : (
              <>
                <Button
                  size="lg"
                  variant="default"
                  onClick={completeSet}
                  className="flex-1"
                  data-testid="button-complete-set"
                >
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Complete Set {currentSetIndex + 1}
                </Button>
                
                {/* Compact Navigation */}
                <div className="flex gap-1">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={previousExercise}
                    disabled={currentExerciseIndex === 0}
                    className="text-white border-white/20 hover:bg-white/10 px-2"
                    data-testid="button-previous-exercise"
                  >
                    <SkipBack className="w-3 h-3" />
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={nextExercise}
                    disabled={currentExerciseIndex >= exercises.length - 1}
                    className="text-white border-white/20 hover:bg-white/10 px-2"
                    data-testid="button-next-exercise"
                  >
                    <SkipForward className="w-3 h-3" />
                  </Button>
                </div>
              </>
            )}
          </div>
          
          {/* Compact Timer */}
          {sessionStarted && (
            <div className="mt-2">
              <GlassCard variant="tertiary" className="p-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Timer className="w-4 h-4 text-white/60" />
                    <span className="text-sm font-semibold text-white">
                      {formatTimerDisplay(timerSeconds)}
                    </span>
                  </div>
                  
                  <div className="flex gap-1">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setTimerType(timerType === 'rest' ? null : 'rest')}
                      className={`text-xs px-2 py-1 ${
                        timerType === 'rest' 
                          ? 'bg-blue-500/20 border-blue-500/40 text-blue-400' 
                          : 'text-white border-white/20 hover:bg-white/10'
                      }`}
                      data-testid="button-rest-timer"
                    >
                      Rest
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setTimerType(timerType === 'stopwatch' ? null : 'stopwatch')}
                      className={`text-xs px-2 py-1 ${
                        timerType === 'stopwatch' 
                          ? 'bg-green-500/20 border-green-500/40 text-green-400' 
                          : 'text-white border-white/20 hover:bg-white/10'
                      }`}
                      data-testid="button-stopwatch"
                    >
                      Stopwatch
                    </Button>
                    {timerType && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setIsTimerRunning(!isTimerRunning)}
                        className="text-xs px-2 py-1 text-white border-white/20 hover:bg-white/10"
                        data-testid="button-timer-toggle"
                      >
                        {isTimerRunning ? <Pause className="w-3 h-3" /> : <Play className="w-3 h-3" />}
                      </Button>
                    )}
                  </div>
                </div>
              </GlassCard>
            </div>
          )}
        </div>

        {/* AI Helper Modal */}
        {currentExercise && (
          <AIHelperModal
            isOpen={showAIModal}
            onClose={handleCloseAIModal}
            currentExercise={currentExercise}
            sessionExercises={exercises}
            onApplyQuickEdit={handleApplyQuickEdit}
            onApplySuggestion={handleApplySuggestion}
          />
        )}
      </div>
    </div>
  );
}