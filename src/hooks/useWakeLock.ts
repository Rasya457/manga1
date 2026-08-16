// src/hooks/useWakeLock.ts
"use client";

import { useEffect, useRef } from "react";

/**
 * Hook to keep the device screen ON while reading manga / novels.
 * Automatically releases wake lock when navigating away or unmounting.
 */
export function useWakeLock(enabled: boolean = true) {
  const wakeLockRef = useRef<any>(null);

  useEffect(() => {
    if (!enabled || typeof window === "undefined" || !("wakeLock" in navigator)) return;

    let released = false;

    async function requestWakeLock() {
      try {
        if ("wakeLock" in navigator && !released) {
          wakeLockRef.current = await (navigator as any).wakeLock.request("screen");
        }
      } catch (err) {
        // WakeLock request can fail if device battery is extremely low or tab is in background
      }
    }

    requestWakeLock();

    // Re-acquire lock if tab visibility changes back to visible
    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible" && enabled) {
        requestWakeLock();
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      released = true;
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      if (wakeLockRef.current) {
        try {
          wakeLockRef.current.release();
        } catch (e) {}
        wakeLockRef.current = null;
      }
    };
  }, [enabled]);
}
