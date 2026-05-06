import { useState, useEffect, useRef, useCallback } from 'react';
import { syncSteps } from '../api/steps.js';

const TODAY = () => new Date().toISOString().split('T')[0];
const STORAGE_KEY = () => `blink_steps_${TODAY()}`;
const THRESHOLD = 1.4;  // g-force threshold for step detection
const MIN_STEP_INTERVAL = 280; // ms — minimum time between counted steps

const loadSaved = () => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY());
    return raw ? parseInt(raw, 10) : 0;
  } catch {
    return 0;
  }
};

const save = (count) => {
  try {
    localStorage.setItem(STORAGE_KEY(), String(count));
  } catch {}
};

export const usePedometer = () => {
  const isSupported = typeof DeviceMotionEvent !== 'undefined';
  const needsPermission = isSupported && typeof DeviceMotionEvent.requestPermission === 'function';

  const [steps, setSteps] = useState(loadSaved);
  const [hasPermission, setHasPermission] = useState(!needsPermission);
  const [isTracking, setIsTracking] = useState(false);

  const stepsRef = useRef(loadSaved());
  const lastStepTime = useRef(0);
  const prevMag = useRef(0);
  const aboveThreshold = useRef(false);
  const syncTimer = useRef(null);

  const scheduleSyncToServer = useCallback(() => {
    if (syncTimer.current) clearTimeout(syncTimer.current);
    syncTimer.current = setTimeout(async () => {
      try {
        await syncSteps(stepsRef.current, TODAY());
      } catch { /* silent — local count is still valid */ }
    }, 5000);
  }, []);

  const onMotion = useCallback((e) => {
    const a = e.accelerationIncludingGravity;
    if (!a) return;
    const x = a.x || 0;
    const y = a.y || 0;
    const z = a.z || 0;
    const mag = Math.sqrt(x * x + y * y + z * z) / 9.81; // normalize to g

    // Peak detection: crossing threshold going upward
    if (mag > THRESHOLD && !aboveThreshold.current) {
      aboveThreshold.current = true;
      const now = Date.now();
      if (now - lastStepTime.current >= MIN_STEP_INTERVAL) {
        lastStepTime.current = now;
        const next = stepsRef.current + 1;
        stepsRef.current = next;
        save(next);
        setSteps(next);
        scheduleSyncToServer();
      }
    } else if (mag <= THRESHOLD) {
      aboveThreshold.current = false;
    }
    prevMag.current = mag;
  }, [scheduleSyncToServer]);

  const requestPermission = useCallback(async () => {
    if (!needsPermission) {
      setHasPermission(true);
      return true;
    }
    try {
      const result = await DeviceMotionEvent.requestPermission();
      const granted = result === 'granted';
      setHasPermission(granted);
      return granted;
    } catch {
      return false;
    }
  }, [needsPermission]);

  const startTracking = useCallback(() => {
    if (!hasPermission || !isSupported) return;
    window.addEventListener('devicemotion', onMotion);
    setIsTracking(true);
  }, [hasPermission, isSupported, onMotion]);

  const stopTracking = useCallback(() => {
    window.removeEventListener('devicemotion', onMotion);
    setIsTracking(false);
    if (syncTimer.current) clearTimeout(syncTimer.current);
    syncSteps(stepsRef.current, TODAY()).catch(() => {});
  }, [onMotion]);

  // Reset steps at midnight
  useEffect(() => {
    const key = STORAGE_KEY();
    const saved = loadSaved();
    stepsRef.current = saved;
    setSteps(saved);

    const now = new Date();
    const msUntilMidnight =
      new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1).getTime() - now.getTime();
    const t = setTimeout(() => {
      stepsRef.current = 0;
      setSteps(0);
      save(0);
    }, msUntilMidnight);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    return () => {
      if (isTracking) window.removeEventListener('devicemotion', onMotion);
      if (syncTimer.current) clearTimeout(syncTimer.current);
    };
  }, [isTracking, onMotion]);

  return {
    steps,
    isSupported,
    hasPermission,
    needsPermission,
    isTracking,
    requestPermission,
    startTracking,
    stopTracking,
  };
};
