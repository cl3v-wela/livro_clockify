import { useState, useRef, useCallback } from "react";

interface UseTimerReturn {
  elapsed: number;
  isRunning: boolean;
  startTime: Date | null;
  start: () => void;
  pause: () => void;
  resume: () => void;
  stop: () => { startTime: Date; endTime: Date; duration: number };
  reset: () => void;
}

export function useTimer(): UseTimerReturn {
  const [elapsed, setElapsed] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const [startTime, setStartTime] = useState<Date | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const startedAtRef = useRef<number>(0);
  const accumulatedRef = useRef<number>(0);

  const tick = useCallback(() => {
    const now = Date.now();
    setElapsed(accumulatedRef.current + (now - startedAtRef.current));
  }, []);

  const start = useCallback(() => {
    const now = Date.now();
    startedAtRef.current = now;
    accumulatedRef.current = 0;
    setElapsed(0);
    setIsRunning(true);
    setStartTime(new Date(now));
    intervalRef.current = setInterval(tick, 100);
  }, [tick]);

  const pause = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    accumulatedRef.current += Date.now() - startedAtRef.current;
    setIsRunning(false);
  }, []);

  const resume = useCallback(() => {
    startedAtRef.current = Date.now();
    setIsRunning(true);
    intervalRef.current = setInterval(tick, 100);
  }, [tick]);

  const stop = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    const endTime = new Date();
    const duration = Math.floor(
      (accumulatedRef.current +
        (isRunning ? Date.now() - startedAtRef.current : 0)) /
        1000
    );
    const result = {
      startTime: startTime || new Date(),
      endTime,
      duration,
    };
    setIsRunning(false);
    setElapsed(0);
    accumulatedRef.current = 0;
    setStartTime(null);
    return result;
  }, [isRunning, startTime]);

  const reset = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    setElapsed(0);
    setIsRunning(false);
    setStartTime(null);
    accumulatedRef.current = 0;
  }, []);

  return { elapsed, isRunning, startTime, start, pause, resume, stop, reset };
}
