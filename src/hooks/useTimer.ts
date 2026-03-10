import { useCallback, useEffect, useRef, useState } from "react";

export interface UseTimerReturn {
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
  const startedAtRef = useRef(0);
  const accumulatedRef = useRef(0);

  const clearTick = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  useEffect(() => clearTick, [clearTick]);

  const tick = useCallback(() => {
    setElapsed(accumulatedRef.current + (Date.now() - startedAtRef.current));
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
    clearTick();
    accumulatedRef.current += Date.now() - startedAtRef.current;
    setIsRunning(false);
  }, [clearTick]);

  const resume = useCallback(() => {
    startedAtRef.current = Date.now();
    setIsRunning(true);
    intervalRef.current = setInterval(tick, 100);
  }, [tick]);

  const stop = useCallback(() => {
    clearTick();
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
  }, [clearTick, isRunning, startTime]);

  const reset = useCallback(() => {
    clearTick();
    setElapsed(0);
    setIsRunning(false);
    setStartTime(null);
    accumulatedRef.current = 0;
  }, [clearTick]);

  return { elapsed, isRunning, startTime, start, pause, resume, stop, reset };
}
