import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { useRoute, useLocation } from "wouter";
import { SessionExercise, WorkoutProgress, SetProgress, SessionInstance, ScheduledSession } from "@shared/schema";
import { 
  getSessionTemplate,
  getScheduledSessionsForDate,
  loadSessionInstances,
  loadScheduledSessions,
  saveSessionInstance,
  saveScheduledSession,
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
import GlassCard from "@/components/GlassCard";
import SetList from "@/components/SetList";
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
  Minus
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
  const [sessionInstance, setSessionInstance] = useState<SessionInstance | ScheduledSession | null>(null);
  const [sessionNotFound, setSessionNotFound] = useState(false);
  const [showFormGuidance, setShowFormGuidance] = useState(false);
  const [showNotes, setShowNotes] = useState(false);
  
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

    // Load session data - check both SessionInstance and legacy ScheduledSession
    let foundSession: SessionInstance | ScheduledSession | null = null;
    let sessionExercises: SessionExercise[] = [];
    
    // First, try to find in SessionInstances
    const sessionInstances = loadSessionInstances();
    const instance = sessionInstances.find(s => s.id === sessionId);
    
    if (instance) {
      foundSession = instance;
      sessionExercises = instance.templateSnapshot.exercises;
    } else {
      // Fall back to legacy ScheduledSessions
      const scheduledSessions = loadScheduledSessions();
      const legacySession = scheduledSessions.find(s => s.id === sessionId);
      
      if (legacySession) {
        foundSession = legacySession;
        const template = getSessionTemplate(legacySession.templateId);
        if (template) {
          sessionExercises = template.exercises;
        }
      }
    }
    
    if (foundSession && sessionExercises.length > 0) {
      setSessionInstance(foundSession);
      setExercises(sessionExercises);
      setWorkoutProgress(getWorkoutProgress(sessionId));
      setSessionNotFound(false);
      
      // Update session status to in_progress when first loaded
      if (foundSession.status === 'scheduled') {
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
      } else {
        // Legacy ScheduledSession
        const updatedSession: ScheduledSession = {
          ...sessionInstance,
          status,
          completedAt: status === 'completed' ? new Date().toISOString() : sessionInstance.completedAt
        };
        saveScheduledSession(updatedSession);
        setSessionInstance(updatedSession);
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
    if (confirm('Are you sure you want to exit this workout? Your progress will be saved.')) {
      clearActiveWorkoutState();
      navigate('/');
    }
  };

  if (!sessionId) {
    return (
      <div className="mobile-viewport flex items-center justify-center bg-background px-4">
        <div className="p-4 text-center">
          <p className="text-foreground">Invalid session ID</p>
        </div>
      </div>
    );
  }
  
  if (sessionNotFound) {
    return (
      <div className="mobile-viewport flex items-center justify-center bg-background px-4">
        <div className="p-4 text-center">
          <p className="text-foreground mb-4">Session not found</p>
          <Button onClick={() => navigate('/')}>Return to Calendar</Button>
        </div>
      </div>
    );
  }

  if (!currentExercise) {
    return (
      <div className="mobile-viewport flex items-center justify-center bg-background px-4">
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
    <div className="mobile-viewport bg-background flex flex-col overflow-hidden">
      {/* Exit Button - Top Left */}
      <div className="absolute top-safe left-4 z-10">
        <Button
          size="icon"
          variant="ghost"
          onClick={exitWorkout}
          className="text-foreground hover:text-foreground"
          data-testid="button-exit-workout"
        >
          <ChevronLeft className="w-5 h-5" />
        </Button>
      </div>

      {/* 1. Progress Info Region */}
      <div className="flex-none px-4 pt-16 pb-2" data-testid="progress-info">
        <GlassCard variant="secondary" className="p-3">
          <div className="flex items-center justify-between mb-2">
            <div className="text-sm text-white/80">
              Exercise {currentExerciseIndex + 1} of {exercises.length}
            </div>
            <div className="text-right">
              <div className="text-xs text-white/60">Progress</div>
              <div className="text-lg font-bold text-white">{overallProgress}%</div>
            </div>
          </div>
          {/* Compact Progress Bar */}
          <div className="w-full bg-white/20 rounded-full h-1.5">
            <div 
              className="bg-primary h-1.5 rounded-full transition-all duration-300"
              style={{ width: `${overallProgress}%` }}
            />
          </div>
        </GlassCard>
      </div>

      {/* 2. Exercise Title Region */}
      <div className="flex-none px-4 pb-2" data-testid="exercise-title">
        <GlassCard variant="primary" className="p-4 text-center">
          <h2 className="text-xl font-bold text-white mb-1" data-testid="current-exercise-name">
            {currentExercise.name}
          </h2>
          <div className="text-sm text-blue-300">
            {currentExercise.muscleGroup}
            {currentExercise.mainMuscle && currentExercise.mainMuscle !== currentExercise.muscleGroup && (
              <span className="ml-2 text-white/60">
                • {currentExercise.mainMuscle}
              </span>
            )}
          </div>
        </GlassCard>
      </div>

      {/* 3. Set Progress Box Region */}
      <div className="flex-1 px-4 pb-2 min-h-0" data-testid="set-progress">
        <div className="h-full overflow-hidden">
          {sessionStarted && currentExercise && sessionId ? (
            <SetList 
              sessionId={sessionId}
              currentExercise={currentExercise}
              workoutProgress={workoutProgress}
              onProgressUpdate={(updatedProgress) => setWorkoutProgress(updatedProgress)}
            />
          ) : (
            <GlassCard variant="tertiary" className="h-full flex items-center justify-center">
              <div className="text-center p-8">
                <h3 className="text-lg font-semibold text-white mb-2">
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

      {/* 4. Collapsed Panels Region */}
      {(currentExercise.formGuidance || currentExercise.notes) && (
        <div className="flex-none px-4 pb-2" data-testid="panels">
          <div className="space-y-2">
            {currentExercise.formGuidance && (
              <Collapsible open={showFormGuidance} onOpenChange={setShowFormGuidance}>
                <CollapsibleTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full justify-between text-white border-white/20 hover:bg-white/10"
                    data-testid="button-toggle-form-guidance"
                  >
                    <span>Form Guidance</span>
                    <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${
                      showFormGuidance ? 'rotate-180' : ''
                    }`} />
                  </Button>
                </CollapsibleTrigger>
                <CollapsibleContent className="pt-2">
                  <GlassCard variant="tertiary" className="p-3">
                    <div className="text-sm text-white/80">
                      {currentExercise.formGuidance}
                    </div>
                  </GlassCard>
                </CollapsibleContent>
              </Collapsible>
            )}
            
            {currentExercise.notes && (
              <Collapsible open={showNotes} onOpenChange={setShowNotes}>
                <CollapsibleTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full justify-between text-white border-white/20 hover:bg-white/10"
                    data-testid="button-toggle-notes"
                  >
                    <span>Notes</span>
                    <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${
                      showNotes ? 'rotate-180' : ''
                    }`} />
                  </Button>
                </CollapsibleTrigger>
                <CollapsibleContent className="pt-2">
                  <GlassCard variant="tertiary" className="p-3">
                    <div className="text-sm text-white/80">
                      {currentExercise.notes}
                    </div>
                  </GlassCard>
                </CollapsibleContent>
              </Collapsible>
            )}
          </div>
        </div>
      )}

      {/* 5. Complete Button Region */}
      <div className="flex-none px-4 pb-2" data-testid="complete">
        {!sessionStarted ? (
          <Button
            size="lg"
            variant="default"
            onClick={startWorkout}
            className="w-full"
            data-testid="button-start-workout"
          >
            <Play className="w-5 h-5 mr-2" />
            Start Workout
          </Button>
        ) : (
          <Button
            size="lg"
            variant="default"
            onClick={completeSet}
            className="w-full"
            data-testid="button-complete-set"
          >
            <CheckCircle className="w-5 h-5 mr-2" />
            Complete Set {currentSetIndex + 1}
          </Button>
        )}
      </div>

      {/* 6. Navigation Region */}
      {sessionStarted && (
        <div className="flex-none px-4 pb-2" data-testid="navigation">
          <GlassCard variant="secondary" className="p-3">
            <div className="flex items-center justify-between">
              <Button
                size="sm"
                variant="outline"
                onClick={previousExercise}
                disabled={currentExerciseIndex === 0}
                className="text-white border-white/20 hover:bg-white/10"
                data-testid="button-previous-exercise"
              >
                <SkipBack className="w-4 h-4 mr-1" />
                Prev
              </Button>
              
              {/* Set Status Indicators */}
              <div className="flex gap-1">
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
              
              <Button
                size="sm"
                variant="outline"
                onClick={nextExercise}
                disabled={currentExerciseIndex >= exercises.length - 1}
                className="text-white border-white/20 hover:bg-white/10"
                data-testid="button-next-exercise"
              >
                Next
                <SkipForward className="w-4 h-4 ml-1" />
              </Button>
            </div>
          </GlassCard>
        </div>
      )}

      {/* 7. Timer Box Region - Pinned at Bottom */}
      {sessionStarted && (
        <div className="flex-none px-4 pb-safe" data-testid="timer">
          <GlassCard variant="tertiary" className="p-3">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-semibold text-white">Timer</h3>
              <div className="flex gap-1">
                <Button
                  size="sm"
                  variant={timerType === 'rest' ? 'default' : 'outline'}
                  onClick={startRestTimer}
                  className="text-xs px-2 py-1 text-white border-white/20 hover:bg-white/10"
                  data-testid="button-rest-timer"
                >
                  <Timer className="w-3 h-3 mr-1" />
                  Rest
                </Button>
                <Button
                  size="sm"
                  variant={timerType === 'stopwatch' ? 'default' : 'outline'}
                  onClick={startStopwatch}
                  className="text-xs px-2 py-1 text-white border-white/20 hover:bg-white/10"
                  data-testid="button-stopwatch"
                >
                  <Clock className="w-3 h-3 mr-1" />
                  Stopwatch
                </Button>
              </div>
            </div>

            {timerType && (
              <div className="text-center">
                <div className="text-2xl font-mono font-bold text-white mb-2">
                  {formatTimerDisplay(timerSeconds)}
                </div>
                <div className="flex justify-center gap-1">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={toggleTimer}
                    className="text-xs px-2 py-1 text-white border-white/20 hover:bg-white/10"
                    data-testid="button-toggle-timer"
                  >
                    {isTimerRunning ? (
                      <>
                        <Pause className="w-3 h-3 mr-1" />
                        Pause
                      </>
                    ) : (
                      <>
                        <Play className="w-3 h-3 mr-1" />
                        Start
                      </>
                    )}
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={resetTimer}
                    className="text-xs px-2 py-1 text-white border-white/20 hover:bg-white/10"
                    data-testid="button-reset-timer"
                  >
                    <RotateCcw className="w-3 h-3 mr-1" />
                    Reset
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={stopTimer}
                    className="text-xs px-2 py-1 text-white border-white/20 hover:bg-white/10"
                    data-testid="button-stop-timer"
                  >
                    <Square className="w-3 h-3 mr-1" />
                    Stop
                  </Button>
                </div>
              </div>
            )}
          </GlassCard>
        </div>
      )}
    </div>
  );
}