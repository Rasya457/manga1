// src/lib/firebase/config.ts

export const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID,
};

let app: any = null;
let auth: any = null;
let db: any = null;
let googleProvider: any = null;

try {
  const { initializeApp, getApps, getApp } = require("firebase/app");
  const { getAuth, GoogleAuthProvider } = require("firebase/auth");
  const { getFirestore } = require("firebase/firestore");

  app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
  auth = getAuth(app);
  db = getFirestore(app);
  googleProvider = new GoogleAuthProvider();
} catch (e) {
  // Graceful fallback when firebase is still installing in node_modules
}

export { app, auth, db, googleProvider };
