import {
  signInWithPopup,
  signInWithCredential,
  GoogleAuthProvider,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
} from "firebase/auth";
import { auth, googleProvider } from "./config";
import { Capacitor } from "@capacitor/core";

export async function signInWithGoogle() {
  if (!auth) {
    throw new Error("Firebase Auth is not initialized. Please check your environment variables.");
  }

  // 1. Native Mobile (Android/iOS) Google Sign-In
  if (Capacitor.isNativePlatform()) {
    try {
      const { FirebaseAuthentication } = await import("@capacitor-firebase/authentication");
      const result = await FirebaseAuthentication.signInWithGoogle();
      const idToken = result.credential?.idToken;
      if (idToken) {
        const credential = GoogleAuthProvider.credential(idToken);
        const userCredential = await signInWithCredential(auth, credential);
        return userCredential.user;
      }
      if (result.user) {
        return result.user as any;
      }
    } catch (nativeErr: any) {
      console.warn("Native Google Auth failed or cancelled, trying web popup fallback:", nativeErr);
    }
  }

  // 2. Web Browser Google Sign-In Fallback
  if (!googleProvider) {
    throw new Error("Google Provider not initialized.");
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
