// src/lib/firebase/auth.ts
import { auth, googleProvider } from "./config";

export async function signInWithGoogle() {
  if (!auth) {
    throw new Error("Firebase SDK is not installed in node_modules yet. Please run: npm i");
  }
  try {
    const { signInWithPopup } = require("firebase/auth");
    const result = await signInWithPopup(auth, googleProvider);
    return result.user;
  } catch (error: any) {
    console.error("Firebase Google Auth Error:", error);
    throw error;
  }
}

export async function loginWithEmail(email: string, pass: string) {
  if (!auth) {
    throw new Error("Firebase SDK is not installed in node_modules yet. Please run: npm i");
  }
  try {
    const { signInWithEmailAndPassword } = require("firebase/auth");
    const result = await signInWithEmailAndPassword(auth, email, pass);
    return result.user;
  } catch (error: any) {
    console.error("Firebase Email Login Error:", error);
    throw error;
  }
}

export async function registerWithEmail(email: string, pass: string) {
  if (!auth) {
    throw new Error("Firebase SDK is not installed in node_modules yet. Please run: npm i");
  }
  try {
    const { createUserWithEmailAndPassword } = require("firebase/auth");
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
    const { signOut } = require("firebase/auth");
    await signOut(auth);
  } catch (error: any) {
    console.error("Firebase SignOut Error:", error);
  }
}
