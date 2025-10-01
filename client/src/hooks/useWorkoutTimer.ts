import { useState, useEffect, useRef, useCallback } from 'react';

export type TimerType = 'rest' | 'stopwatch' | null;

export interface WorkoutTimerState {
  timerType: TimerType;
  timerSeconds: number;
  isTimerRunning: boolean;
}

export interface WorkoutTimerControls {
  startRestTimer: (duration: number) => void;
  startStopwatch: () => void;
  stopTimer: () => void;
  toggleTimer: () => void;
  resetTimer: (restDuration?: number) => void;
}

/**
 * Custom hook for managing workout timers (rest timer and stopwatch)
 * Handles both countdown rest timers and count-up stopwatches
 */
export function useWorkoutTimer(): WorkoutTimerState & WorkoutTimerControls {
  const [timerType, setTimerType] = useState<TimerType>(null);
  const [timerSeconds, setTimerSeconds] = useState(0);
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Main timer effect - handles both rest timer (countdown) and stopwatch (count-up)
  useEffect(() => {
    if (isTimerRunning && timerRef.current === null) {
      timerRef.current = setInterval(() => {
        setTimerSeconds(prev => {
          if (timerType === 'rest' && prev <= 1) {
            // Rest timer finished - auto-stop
            setIsTimerRunning(false);
            setTimerType(null);
            return 0;
          }
          // Rest timer counts down, stopwatch counts up
          return timerType === 'rest' ? prev - 1 : prev + 1;
        });
      }, 1000);
    } else if (!isTimerRunning && timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }

    // Cleanup on unmount
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [isTimerRunning, timerType]);

  /**
   * Start a countdown rest timer
   * @param duration - Rest duration in seconds
   */
  const startRestTimer = useCallback((duration: number) => {
    setTimerType('rest');
    setTimerSeconds(duration);
    setIsTimerRunning(true);
  }, []);

  /**
   * Start a count-up stopwatch timer
   */
  const startStopwatch = useCallback(() => {
    setTimerType('stopwatch');
    setTimerSeconds(0);
    setIsTimerRunning(true);
  }, []);

  /**
   * Stop the timer and reset to initial state
   */
  const stopTimer = useCallback(() => {
    setIsTimerRunning(false);
    setTimerType(null);
    setTimerSeconds(0);
  }, []);

  /**
   * Toggle timer between running and paused
   */
  const toggleTimer = useCallback(() => {
    setIsTimerRunning(prev => !prev);
  }, []);

  /**
   * Reset the current timer to its initial value
   * @param restDuration - Optional rest duration for rest timer
   */
  const resetTimer = useCallback((restDuration?: number) => {
    if (timerType === 'rest') {
      setTimerSeconds(restDuration || 60);
    } else if (timerType === 'stopwatch') {
      setTimerSeconds(0);
    }
    setIsTimerRunning(false);
  }, [timerType]);

  return {
    // State
    timerType,
    timerSeconds,
    isTimerRunning,
    // Controls
    startRestTimer,
    startStopwatch,
    stopTimer,
    toggleTimer,
    resetTimer
  };
}

/**
 * Load timer state from saved workout state
 * @param savedState - Saved timer state from ActiveWorkoutState
 * @returns Timer state to initialize with
 */
export function loadTimerState(savedState: {
  type: 'rest' | 'stopwatch';
  startTime: number;
  duration?: number;
  isRunning: boolean;
}): Partial<WorkoutTimerState> {
  const elapsed = Date.now() - savedState.startTime;
  
  if (savedState.type === 'rest' && savedState.duration) {
    // Rest timer - calculate remaining time
    const remaining = Math.max(0, savedState.duration - Math.floor(elapsed / 1000));
    return {
      timerType: 'rest',
      timerSeconds: remaining,
      isTimerRunning: savedState.isRunning && remaining > 0
    };
  } else {
    // Stopwatch - calculate elapsed time
    return {
      timerType: 'stopwatch',
      timerSeconds: Math.floor(elapsed / 1000),
      isTimerRunning: savedState.isRunning
    };
  }
}
