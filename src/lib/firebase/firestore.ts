// src/lib/firebase/firestore.ts

import { doc, setDoc, deleteDoc, getDoc, serverTimestamp } from "firebase/firestore";
import { db } from "./config";

export type ContentType = "manga" | "manhwa" | "manhua";

interface BookmarkData {
  contentId: string; // mangaId
  type: ContentType;
  title: string;
  cover: string;
}

interface HistoryData {
  contentId: string; // mangaId
  type: ContentType;
  title: string;
  cover: string;
  lastChapterId: string;
  lastChapterRead: string;
  progress: number;
  currentPage?: number;
}

function isFirebaseConfigured(): boolean {
  return Boolean(db && process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID);
}

export async function setBookmark(uid: string, data: BookmarkData) {
  if (!db || !process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID) return;
  try {
    const docRef = doc(db, "users", uid, "bookmarks", data.contentId);
    await setDoc(docRef, {
      ...data,
      bookmarkedAt: serverTimestamp(),
    });
  } catch (err) {
    console.warn("setBookmark warning:", err);
  }
}

export async function removeBookmark(uid: string, contentId: string) {
  if (!db || !process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID) return;
  try {
    const docRef = doc(db, "users", uid, "bookmarks", contentId);
    await deleteDoc(docRef);
  } catch (err) {
    console.warn("removeBookmark warning:", err);
  }
}

export async function getBookmark(uid: string, contentId: string) {
  if (!db || !process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID) return null;
  try {
    const docRef = doc(db, "users", uid, "bookmarks", contentId);
    const snap = await getDoc(docRef);
    return snap.exists() ? snap.data() : null;
  } catch (err) {
    console.warn("getBookmark warning:", err);
    return null;
  }
}

export async function setHistory(uid: string, data: HistoryData) {
  if (!db || !process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID) return;
  try {
    const docRef = doc(db, "users", uid, "history", data.contentId);
    await setDoc(docRef, {
      ...data,
      lastReadAt: serverTimestamp(),
    });
  } catch (err) {
    console.warn("setHistory warning:", err);
  }
}