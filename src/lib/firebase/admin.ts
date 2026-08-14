// src/lib/firebase/admin.ts
// Server-only. Never import this in a client component.

import { cert, getApps, initializeApp, type App } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";

function getAdminApp(): App | null {
  const existing = getApps();
  if (existing.length > 0) {
    return existing[0];
  }

  const projectId = process.env.FIREBASE_ADMIN_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_ADMIN_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_ADMIN_PRIVATE_KEY?.replace(/\\n/g, "\n");

  if (!projectId || !clientEmail || !privateKey) {
    return null;
  }

  try {
    return initializeApp({
      credential: cert({ projectId, clientEmail, privateKey }),
    });
  } catch (e) {
    console.error("Firebase Admin initialization error:", e);
    return null;
  }
}

export const adminAuth = new Proxy({} as ReturnType<typeof getAuth>, {
  get(_target, prop) {
    const app = getAdminApp();
    if (!app) {
      throw new Error("Missing Firebase Admin env vars: FIREBASE_ADMIN_PROJECT_ID, FIREBASE_ADMIN_CLIENT_EMAIL, FIREBASE_ADMIN_PRIVATE_KEY");
    }
    const authInstance = getAuth(app) as any;
    const value = authInstance[prop];
    return typeof value === "function" ? value.bind(authInstance) : value;
  },
});

export const adminDb = new Proxy({} as ReturnType<typeof getFirestore>, {
  get(_target, prop) {
    const app = getAdminApp();
    if (!app) {
      throw new Error("Missing Firebase Admin env vars: FIREBASE_ADMIN_PROJECT_ID, FIREBASE_ADMIN_CLIENT_EMAIL, FIREBASE_ADMIN_PRIVATE_KEY");
    }
    const dbInstance = getFirestore(app) as any;
    const value = dbInstance[prop];
    return typeof value === "function" ? value.bind(dbInstance) : value;
  },
});