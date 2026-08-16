// src/hooks/useBookmark.ts

"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { collection, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase/config";
import { setBookmark, removeBookmark as removeBookmarkDoc, ContentType } from "@/lib/firebase/firestore";
import { useAuthContext } from "@/context/AuthContext";
import { triggerHaptic } from "@/lib/haptics";

export interface BookmarkInput {
  contentId: string; // mangaId
  type: ContentType;
  title: string;
  cover: string;
}

export type BookmarkItem = BookmarkInput;

export function useBookmark() {
  const { user } = useAuthContext();
  const [bookmarks, setBookmarks] = useState<BookmarkItem[]>([]);

  // User-isolated storage key per UID
  const userKey = user?.uid
    ? `manga_app_bookmarks_${user.uid}`
    : "manga_app_bookmarks_guest";

  useEffect(() => {
    // 1. Read from user-isolated localStorage
    try {
      const stored = localStorage.getItem(userKey);
      if (stored) {
        setBookmarks(JSON.parse(stored));
      } else {
        setBookmarks([]);
      }
    } catch (e) {
      setBookmarks([]);
    }

    // 2. Sync with Firestore for logged-in user
    if (!user?.uid || !db || !process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID) return;

    try {
      getDocs(collection(db, "users", user.uid, "bookmarks"))
        .then((snap) => {
          const items = snap.docs.map((d) => ({ contentId: d.id, ...d.data() } as BookmarkItem));
          setBookmarks(items);
          try {
            localStorage.setItem(userKey, JSON.stringify(items));
          } catch (e) {}
        })
        .catch((err) => {
          console.warn("Firestore bookmark sync failed:", err);
        });
    } catch (err) {
      console.warn("Firestore collection error:", err);
    }
  }, [user?.uid, userKey]);

  const saveLocal = useCallback(
    (items: BookmarkItem[]) => {
      setBookmarks(items);
      try {
        localStorage.setItem(userKey, JSON.stringify(items));
      } catch (e) {}
    },
    [userKey]
  );

  const bookmarkedIds = useMemo(
    () => new Set(bookmarks.map((b) => b.contentId)),
    [bookmarks]
  );

  const isBookmarked = useCallback(
    (contentId: string) => bookmarkedIds.has(contentId),
    [bookmarkedIds]
  );

  const removeBookmark = useCallback(
    async (contentId: string) => {
      triggerHaptic("light");
      const updated = bookmarks.filter((b) => b.contentId !== contentId);
      saveLocal(updated);
      if (user?.uid && db) {
        await removeBookmarkDoc(user.uid, contentId);
      }
    },
    [user?.uid, bookmarks, saveLocal]
  );

  const addBookmark = useCallback(
    async (data: BookmarkInput) => {
      triggerHaptic("medium");
      const updated = [data, ...bookmarks.filter((b) => b.contentId !== data.contentId)];
      saveLocal(updated);
      if (user?.uid && db) {
        await setBookmark(user.uid, data);
      }
    },
    [user?.uid, bookmarks, saveLocal]
  );

  const toggleBookmark = useCallback(
    async (data: BookmarkInput) => {
      if (isBookmarked(data.contentId)) {
        await removeBookmark(data.contentId);
      } else {
        await addBookmark(data);
      }
    },
    [isBookmarked, removeBookmark, addBookmark]
  );

  return { bookmarks, isBookmarked, toggleBookmark, removeBookmark };
}