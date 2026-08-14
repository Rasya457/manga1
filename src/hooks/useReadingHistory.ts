// src/hooks/useReadingHistory.ts

"use client";

import { useState, useEffect, useCallback } from "react";
import { collection, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase/config";
import { setHistory, ContentType } from "@/lib/firebase/firestore";
import { useAuthContext } from "@/context/AuthContext";

export interface HistoryItem {
  contentId: string; // mangaId
  type: ContentType;
  title: string;
  cover: string;
  lastChapterId: string;
  lastChapterRead: string;
  progress: number;
  currentPage?: number;
  lastReadAt?: string;
}

export function useReadingHistory() {
  const { user } = useAuthContext();
  const [history, setHistoryState] = useState<HistoryItem[]>([]);

  // User-isolated storage key per UID
  const userKey = user?.uid
    ? `manga_app_reading_history_${user.uid}`
    : "manga_app_reading_history_guest";

  useEffect(() => {
    const isStale = (h: HistoryItem) =>
      !h.title || h.title === "Manga Reader" || h.title === "Manga" || !h.cover;

    // 1. Read from user-isolated localStorage
    try {
      const stored = localStorage.getItem(userKey);
      if (stored) {
        const parsed: HistoryItem[] = JSON.parse(stored);
        const cleaned = parsed.filter((h) => !isStale(h));
        setHistoryState(cleaned);
      } else {
        setHistoryState([]);
      }
    } catch (e) {
      setHistoryState([]);
    }

    // 2. Sync with Firestore for logged-in user
    if (!user?.uid || !db || !process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID) return;

    try {
      getDocs(collection(db, "users", user.uid, "history"))
        .then((snap) => {
          const items = snap.docs
            .map((d) => ({ contentId: d.id, ...d.data() } as HistoryItem))
            .filter((h) => !isStale(h));

          setHistoryState(items);
          try {
            localStorage.setItem(userKey, JSON.stringify(items));
          } catch (e) {}
        })
        .catch((err) => {
          console.warn("Firestore history sync failed:", err);
        });
    } catch (err) {
      console.warn("Firestore collection error:", err);
    }
  }, [user?.uid, userKey]);

  const saveLocal = useCallback(
    (items: HistoryItem[]) => {
      setHistoryState(items);
      try {
        localStorage.setItem(userKey, JSON.stringify(items));
      } catch (e) {}
    },
    [userKey]
  );

  const updateHistory = useCallback(
    async (data: HistoryItem) => {
      if (!data.title || data.title === "Manga Reader" || data.title === "Manga") {
        return;
      }

      const itemWithTimestamp: HistoryItem = {
        ...data,
        lastReadAt: data.lastReadAt || new Date().toISOString(),
      };

      setHistoryState((prev) => {
        const filtered = prev.filter((h) => h.contentId !== data.contentId);
        const updated = [itemWithTimestamp, ...filtered];
        saveLocal(updated);
        return updated;
      });

      if (user?.uid && db) {
        await setHistory(user.uid, itemWithTimestamp);
      }
    },
    [user?.uid, saveLocal]
  );

  return { history, updateHistory };
}