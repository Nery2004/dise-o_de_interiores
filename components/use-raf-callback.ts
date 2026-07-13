"use client";

import { useCallback, useEffect, useRef } from "react";

export function useRafCallback<Arguments extends unknown[]>(callback: (...args: Arguments) => void) {
  const callbackRef = useRef(callback);
  const argumentsRef = useRef<Arguments | null>(null);
  const frameRef = useRef<number | null>(null);

  useEffect(() => {
    callbackRef.current = callback;
  }, [callback]);

  useEffect(() => () => {
    if (frameRef.current !== null) cancelAnimationFrame(frameRef.current);
  }, []);

  const schedule = useCallback((...args: Arguments) => {
    argumentsRef.current = args;
    if (frameRef.current !== null) return;
    frameRef.current = requestAnimationFrame(() => {
      frameRef.current = null;
      const pending = argumentsRef.current;
      argumentsRef.current = null;
      if (pending) callbackRef.current(...pending);
    });
  }, []);

  const flush = useCallback(() => {
    if (frameRef.current !== null) cancelAnimationFrame(frameRef.current);
    frameRef.current = null;
    const pending = argumentsRef.current;
    argumentsRef.current = null;
    if (pending) callbackRef.current(...pending);
  }, []);

  return { schedule, flush };
}
