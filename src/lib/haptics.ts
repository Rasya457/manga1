// src/lib/haptics.ts
"use client";

/**
 * Universal Haptic Feedback utility.
 * Triggers subtle native micro-vibrations on mobile devices when tapping buttons,
 * changing tabs, bookmarking, or scrolling chapters.
 */
export type HapticStyle = "light" | "medium" | "heavy" | "selection";

export function triggerHaptic(style: HapticStyle = "light") {
  if (typeof window === "undefined" || !("navigator" in window)) return;

  try {
    // Check if standard web vibration API is available
    if (typeof navigator.vibrate === "function") {
      switch (style) {
        case "selection":
          navigator.vibrate(6);
          break;
        case "light":
          navigator.vibrate(10);
          break;
        case "medium":
          navigator.vibrate(20);
          break;
        case "heavy":
          navigator.vibrate([15, 50, 25]);
          break;
        default:
          navigator.vibrate(10);
      }
    }
  } catch (e) {
    // Silently ignore if device/browser disables vibration
  }
}
