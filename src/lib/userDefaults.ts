// src/lib/userDefaults.ts

import { doc, getDoc, setDoc } from "firebase/firestore";
import { db } from "@/lib/firebase/config";

/**
 * Utility functions for user profile defaults, local storage retrieval,
 * and Firestore persistence per user account UID.
 */

export function getSavedAvatar(uid?: string | null, photoURL?: string | null): string | null {
  if (!uid) return photoURL || null;
  try {
    const saved = localStorage.getItem(`manga_app_user_avatar_${uid}`);
    if (saved) return saved;
  } catch (e) {}
  return photoURL || null;
}

export function getSavedBanner(uid?: string | null): string | null {
  if (!uid) return null;
  try {
    const saved = localStorage.getItem(`manga_app_user_banner_${uid}`);
    if (saved) return saved;
  } catch (e) {}
  return null;
}

export function getSavedDisplayName(
  uid?: string | null,
  googleName?: string | null,
  email?: string | null
): string {
  if (uid) {
    try {
      const saved = localStorage.getItem(`manga_app_user_name_${uid}`);
      if (saved) return saved;
    } catch (e) {}
  }
  return googleName || email?.split("@")[0] || "Reader";
}

export async function syncUserProfileWithFirestore(uid: string) {
  if (!uid || !db || !process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID) return;
  try {
    const snap = await getDoc(doc(db, "users", uid));
    if (snap.exists()) {
      const data = snap.data();
      if (data.avatarUrl) {
        localStorage.setItem(`manga_app_user_avatar_${uid}`, data.avatarUrl);
      }
      if (data.bannerUrl) {
        localStorage.setItem(`manga_app_user_banner_${uid}`, data.bannerUrl);
      }
      if (data.displayName) {
        localStorage.setItem(`manga_app_user_name_${uid}`, data.displayName);
      }
    }
  } catch (e) {
    console.warn("syncUserProfileWithFirestore warning:", e);
  }
}

export async function saveUserAvatar(uid: string, avatarUrl: string | null) {
  if (!uid) return;
  try {
    if (avatarUrl) {
      localStorage.setItem(`manga_app_user_avatar_${uid}`, avatarUrl);
    } else {
      localStorage.removeItem(`manga_app_user_avatar_${uid}`);
    }
  } catch (e) {}

  if (db && process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID) {
    try {
      await setDoc(doc(db, "users", uid), { avatarUrl: avatarUrl || "" }, { merge: true });
    } catch (e) {}
  }
}

export async function saveUserBanner(uid: string, bannerUrl: string | null) {
  if (!uid) return;
  try {
    if (bannerUrl) {
      localStorage.setItem(`manga_app_user_banner_${uid}`, bannerUrl);
    } else {
      localStorage.removeItem(`manga_app_user_banner_${uid}`);
    }
  } catch (e) {}

  if (db && process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID) {
    try {
      await setDoc(doc(db, "users", uid), { bannerUrl: bannerUrl || "" }, { merge: true });
    } catch (e) {}
  }
}

export async function saveUserName(uid: string, displayName: string) {
  if (!uid) return;
  try {
    if (displayName.trim()) {
      localStorage.setItem(`manga_app_user_name_${uid}`, displayName.trim());
    } else {
      localStorage.removeItem(`manga_app_user_name_${uid}`);
    }
  } catch (e) {}

  if (db && process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID) {
    try {
      await setDoc(doc(db, "users", uid), { displayName: displayName.trim() }, { merge: true });
    } catch (e) {}
  }
}
