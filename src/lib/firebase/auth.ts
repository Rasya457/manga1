// src/lib/firebase/auth.ts
import {
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
} from "firebase/auth";
import { auth, googleProvider } from "./config";

export async function signInWithGoogle() {
  if (!auth || !googleProvider) {
    throw new Error("Firebase Auth is not initialized. Please check your environment variables.");
  }
  try {
    const result = await signInWithPopup(auth, googleProvider);
    return result.user;
  } catch (error: any) {
    console.error("Firebase Google Auth Error:", error);
    throw error;
  }
}

export async function loginWithEmail(email: string, pass: string) {
  if (!auth) {
    throw new Error("Firebase Auth is not initialized. Please check your environment variables.");
  }
  try {
    const result = await signInWithEmailAndPassword(auth, email, pass);
    return result.user;
  } catch (error: any) {
    console.error("Firebase Email Login Error:", error);
    throw error;
  }
}

export async function registerWithEmail(email: string, pass: string) {
  if (!auth) {
    throw new Error("Firebase Auth is not initialized. Please check your environment variables.");
  }
  try {
    const result = await createUserWithEmailAndPassword(auth, email, pass);
    return result.user;
  } catch (error: any) {
    console.error("Firebase Email Register Error:", error);
    throw error;
  }
}

export async function logoutFirebase() {
  if (!auth) return;
  try {
    await signOut(auth);
  } catch (error: any) {
    console.error("Firebase SignOut Error:", error);
  }
}
