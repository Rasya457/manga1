"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { auth } from "@/lib/firebase/config";
import {
  signInWithGoogle,
  loginWithEmail,
  registerWithEmail,
  logoutFirebase,
} from "@/lib/firebase/auth";

export interface UserProfile {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
}

interface AuthContextType {
  user: UserProfile | null;
  loading: boolean;
  login: (email: string, pass: string) => Promise<void>;
  register: (email: string, pass: string) => Promise<void>;
  googleLogin: () => Promise<void>;
  logout: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  login: async () => {},
  register: async () => {},
  googleLogin: async () => {},
  logout: async () => {},
});

const AUTH_STORAGE_KEY = "manga_app_auth_user";

function toProfile(fbUser: any, fallbackName?: string): UserProfile {
  return {
    uid: fbUser.uid,
    email: fbUser.email,
    displayName: fbUser.displayName || fallbackName || fbUser.email?.split("@")[0] || "User",
    photoURL: fbUser.photoURL,
  };
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    // 1. Check local storage fallback first (only for instant UI, real state comes from Firebase below)
    try {
      if (typeof window !== "undefined") {
        const stored = localStorage.getItem(AUTH_STORAGE_KEY);
        if (stored) {
          setUser(JSON.parse(stored));
        }
      }
    } catch (e) {
      console.error("Failed to load user auth state from storage", e);
    }

    // 2. Listen to real-time Firebase Auth state changes if auth is initialized
    let unsubscribe: any = () => {};
    if (auth) {
      try {
        const { onAuthStateChanged } = require("firebase/auth");
        unsubscribe = onAuthStateChanged(auth, (fbUser: any) => {
          if (fbUser) {
            const profile = toProfile(fbUser);
            setUser(profile);
            if (typeof window !== "undefined") {
              localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(profile));
            }
          } else {
            // Firebase says nobody's logged in — trust it, clear any stale local cache
            setUser(null);
            if (typeof window !== "undefined") {
              localStorage.removeItem(AUTH_STORAGE_KEY);
            }
          }
          setLoading(false);
        });
      } catch (e) {
        setLoading(false);
      }
    } else {
      setLoading(false);
    }

    return () => unsubscribe();
  }, []);

  const login = async (email: string, pass: string) => {
    // No fallback here on purpose: if Firebase auth fails, the error
    // must propagate so the login form can show a real error message
    // instead of pretending the user is signed in.
    const fbUser = await loginWithEmail(email, pass);
    const profile = toProfile(fbUser);
    setUser(profile);
    if (typeof window !== "undefined") {
      localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(profile));
    }
  };

  const register = async (email: string, pass: string) => {
    const fbUser = await registerWithEmail(email, pass);
    const profile = toProfile(fbUser);
    setUser(profile);
    if (typeof window !== "undefined") {
      localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(profile));
    }
    try {
      const { doc, setDoc } = require("firebase/firestore");
      const { db } = require("@/lib/firebase/config");
      if (db && fbUser?.uid) {
        await setDoc(doc(db, "users", fbUser.uid), { emailVerified: false, email }, { merge: true });
      }
    } catch (e) {
      console.error("Failed to initialize user doc on register:", e);
    }
  };

  const googleLogin = async () => {
    try {
      const fbUser = await signInWithGoogle();
      const profile = toProfile(fbUser, "Google User");
      setUser(profile);
      if (typeof window !== "undefined") {
        localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(profile));
      }
      try {
        const { doc, setDoc } = require("firebase/firestore");
        const { db } = require("@/lib/firebase/config");
        if (db && fbUser?.uid) {
          await setDoc(doc(db, "users", fbUser.uid), { emailVerified: true }, { merge: true });
        }
      } catch (e) {}
    } catch (err) {
      console.error("Google login error:", err);
      throw err;
    }
  };

  const logout = async () => {
    try {
      await logoutFirebase();
    } catch (e) {
      // ignore
    }
    setUser(null);
    if (typeof window !== "undefined") {
      localStorage.removeItem(AUTH_STORAGE_KEY);
    }
  };

  return (
    <AuthContext.Provider
      value={{ user, loading, login, register, googleLogin, logout }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuthContext() {
  return useContext(AuthContext);
}