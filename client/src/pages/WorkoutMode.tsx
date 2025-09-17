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
import Layout from "@/components/Layout";
import GlassCard from "@/components/GlassCard";
import SetList from "@/components/SetList";
import { Button } from "@/components/ui/button";
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
      // Navigate back
    }
  };

  if (!sessionId) {
    return (
      <Layout>
        <div className="p-4 text-center">
          <p className="text-white">Invalid session ID</p>
        </div>
      </Layout>
    );
  }
  
  if (sessionNotFound) {
    return (
      <Layout>
        <div className="p-4 text-center">
          <p className="text-white mb-4">Session not found</p>
          <Button onClick={() => navigate('/')}>Return to Calendar</Button>
        </div>
      </Layout>
    );
  }

  if (!currentExercise) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-screen">
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
      </Layout>
    );
  }

  const formatTimerDisplay = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const currentSetProgress = currentExerciseProgress?.sets.find(s => s.setNumber === currentSetIndex + 1);
  const completedSets = calculateCompletedSets(currentExerciseProgress);

  return (
    <Layout>
      <div className="workout-mode-container space-y-4">
        {/* Workout Header */}
        <GlassCard variant="secondary">
          <div className="p-4">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-3">
                <Button
                  size="icon"
                  variant="ghost"
                  onClick={exitWorkout}
                  className="text-white hover:text-white"
                  data-testid="button-exit-workout"
                >
                  <ChevronLeft className="w-5 h-5" />
                </Button>
                <div>
                  <h1 className="text-lg font-bold text-white">
                    Exercise {currentExerciseIndex + 1} of {exercises.length}
                  </h1>
                  <p className="text-sm text-white/60">
                    Set {currentSetIndex + 1} of {currentExercise.sets}
                  </p>
                </div>
              </div>
              
              <div className="text-right">
                <div className="text-sm text-white/60">Progress</div>
                <div className="text-lg font-bold text-white">
                  {Math.round(((currentExerciseIndex + (completedSets / currentExercise.sets)) / exercises.length) * 100)}%
                </div>
              </div>
            </div>

            {/* Progress Bar */}
            <div className="w-full bg-white/20 rounded-full h-2">
              <div 
                className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                style={{ 
                  width: `${((currentExerciseIndex + (completedSets / currentExercise.sets)) / exercises.length) * 100}%` 
                }}
              />
            </div>
          </div>
        </GlassCard>

        {/* Current Exercise */}
        <GlassCard variant="primary">
          <div className="p-6 text-center">
            <h2 className="text-2xl font-bold text-white mb-2" data-testid="current-exercise-name">
              {currentExercise.name}
            </h2>
            
            <div className="text-lg text-blue-300 mb-4">
              {formatExercisePrescription(currentExercise)}
              {currentExercise.weight && (
                <span className="ml-2 text-white/60">
                  @ {formatWeight(currentExercise.weight)}
                </span>
              )}
            </div>

            {/* Set Status */}
            <div className="flex justify-center gap-2 mb-6">
              {Array.from({ length: currentExercise.sets }, (_, i) => {
                const setProgress = currentExerciseProgress?.sets.find(s => s.setNumber === i + 1);
                const isCompleted = setProgress?.completed || false;
                const isCurrent = i === currentSetIndex;
                
                return (
                  <div
                    key={i}
                    className={`w-8 h-8 rounded-full flex items-center justify-center border-2 ${
                      isCompleted 
                        ? 'bg-green-500 border-green-400 text-white'
                        : isCurrent
                        ? 'border-blue-400 text-blue-400'
                        : 'border-white/30 text-white/50'
                    }`}
                  >
                    {isCompleted ? (
                      <CheckCircle className="w-4 h-4" />
                    ) : (
                      <span className="text-sm font-bold">{i + 1}</span>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Form Guidance & Notes */}
            {(currentExercise.formGuidance || currentExercise.notes) && (
              <div className="bg-white/10 rounded-lg p-4 mb-6 text-left">
                {currentExercise.formGuidance && (
                  <div className="mb-2">
                    <div className="text-sm font-medium text-blue-300">Form Guidance:</div>
                    <div className="text-sm text-white/80">{currentExercise.formGuidance}</div>
                  </div>
                )}
                {currentExercise.notes && (
                  <div>
                    <div className="text-sm font-medium text-yellow-300">Notes:</div>
                    <div className="text-sm text-white/80">{currentExercise.notes}</div>
                  </div>
                )}
              </div>
            )}

            {/* Set List Interface */}
            {sessionStarted && currentExercise && sessionId && (
              <SetList 
                sessionId={sessionId}
                currentExercise={currentExercise}
                workoutProgress={workoutProgress}
                onProgressUpdate={(updatedProgress) => setWorkoutProgress(updatedProgress)}
              />
            )}

            {/* Action Buttons */}
            {!sessionStarted ? (
              <Button
                size="lg"
                variant="default"
                onClick={startWorkout}
                className="w-full max-w-sm"
                data-testid="button-start-workout"
              >
                <Play className="w-5 h-5 mr-2" />
                Start Workout
              </Button>
            ) : (
              <div className="space-y-4">
                <Button
                  size="lg"
                  variant="default"
                  onClick={completeSet}
                  className="w-full max-w-sm"
                  data-testid="button-complete-set"
                >
                  <CheckCircle className="w-5 h-5 mr-2" />
                  Complete Set {currentSetIndex + 1}
                </Button>
                
                <div className="flex gap-2 justify-center">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={previousExercise}
                    disabled={currentExerciseIndex === 0}
                    className="text-white border-white/20 hover:bg-white/10"
                    data-testid="button-previous-exercise"
                  >
                    <SkipBack className="w-4 h-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={nextExercise}
                    disabled={currentExerciseIndex >= exercises.length - 1}
                    className="text-white border-white/20 hover:bg-white/10"
                    data-testid="button-next-exercise"
                  >
                    <SkipForward className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            )}
          </div>
        </GlassCard>

        {/* Timer Section */}
        {sessionStarted && (
          <GlassCard variant="tertiary">
            <div className="p-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-white">Timer</h3>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant={timerType === 'rest' ? 'default' : 'outline'}
                    onClick={startRestTimer}
                    className="text-white border-white/20 hover:bg-white/10"
                    data-testid="button-rest-timer"
                  >
                    <Timer className="w-4 h-4 mr-1" />
                    Rest ({formatRestTime(getRestDuration())})
                  </Button>
                  <Button
                    size="sm"
                    variant={timerType === 'stopwatch' ? 'default' : 'outline'}
                    onClick={startStopwatch}
                    className="text-white border-white/20 hover:bg-white/10"
                    data-testid="button-stopwatch"
                  >
                    <Clock className="w-4 h-4 mr-1" />
                    Stopwatch
                  </Button>
                </div>
              </div>

              {timerType && (
                <div className="text-center">
                  <div className="text-3xl font-mono font-bold text-white mb-4">
                    {formatTimerDisplay(timerSeconds)}
                  </div>
                  <div className="flex justify-center gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={toggleTimer}
                      className="text-white border-white/20 hover:bg-white/10"
                      data-testid="button-toggle-timer"
                    >
                      {isTimerRunning ? (
                        <>
                          <Pause className="w-4 h-4 mr-1" />
                          Pause
                        </>
                      ) : (
                        <>
                          <Play className="w-4 h-4 mr-1" />
                          Start
                        </>
                      )}
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={resetTimer}
                      className="text-white border-white/20 hover:bg-white/10"
                      data-testid="button-reset-timer"
                    >
                      <RotateCcw className="w-4 h-4 mr-1" />
                      Reset
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={stopTimer}
                      className="text-white border-white/20 hover:bg-white/10"
                      data-testid="button-stop-timer"
                    >
                      <Square className="w-4 h-4 mr-1" />
                      Stop
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </GlassCard>
        )}
      </div>
    </Layout>
  );
}