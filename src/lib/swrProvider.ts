// src/lib/swrProvider.ts
"use client";

const STORAGE_KEY = "app_swr_cache";

// SWR's default cache is just an in-memory Map — it's gone on a hard reload.
// This provider seeds that Map from sessionStorage on first load, and saves
// it back before the tab closes/reloads, so data fetched earlier in this
// browser tab renders instantly instead of showing a loading skeleton again.
export function sessionStorageProvider(): Map<string, any> {
  let initialEntries: [string, any][] = [];

  if (typeof window !== "undefined") {
    try {
      const stored = sessionStorage.getItem(STORAGE_KEY);
      if (stored) initialEntries = JSON.parse(stored);
    } catch (e) {
      initialEntries = [];
    }
  }

  const map = new Map<string, any>(initialEntries);

  if (typeof window !== "undefined") {
    window.addEventListener("beforeunload", () => {
      try {
        sessionStorage.setItem(STORAGE_KEY, JSON.stringify(Array.from(map.entries())));
      } catch (e) {
        // storage full or unavailable — safe to ignore, just loses the cache
      }
    });
  }

  return map;
}