// src/lib/pageTransition.ts
"use client";

export type SlideDirection = "left" | "right" | "none";

// Order matters — direction is derived from relative position in this list.
export const MAIN_TABS = ["/", "/search", "/bookmark", "/profile"];

let pendingDirection: SlideDirection = "none";

export function setPendingDirection(direction: SlideDirection) {
  pendingDirection = direction;
}

// Reads AND clears in one step, so the same pending value never gets
// applied twice across two separate renders.
export function consumePendingDirection(): SlideDirection {
  const direction = pendingDirection;
  pendingDirection = "none";
  return direction;
}

// Convenience for anything that navigates directly between two known tabs
// (e.g. the navbar) rather than via a swipe gesture.
export function setPendingDirectionForTabChange(fromPath: string, toPath: string) {
  const fromIdx = MAIN_TABS.indexOf(fromPath);
  const toIdx = MAIN_TABS.indexOf(toPath);
  if (fromIdx === -1 || toIdx === -1 || fromIdx === toIdx) {
    setPendingDirection("none");
    return;
  }
  setPendingDirection(toIdx > fromIdx ? "left" : "right");
}