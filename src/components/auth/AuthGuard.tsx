// src/components/auth/AuthGuard.tsx

"use client";

import React, { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase/config";
import { useAuthContext } from "@/context/AuthContext";

export default function AuthGuard({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuthContext();
  const router = useRouter();
  const pathname = usePathname();
  const [mounted, setMounted] = useState(false);
  const [emailVerified, setEmailVerified] = useState<boolean | null>(null);
  const [checkingVerification, setCheckingVerification] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const isProtectedPage =
    pathname.startsWith("/chapter/") ||
    pathname.startsWith("/profile") ||
    pathname.startsWith("/settings") ||
    pathname.startsWith("/bookmark") ||
    pathname.startsWith("/history");

  useEffect(() => {
    if (!mounted || loading) return;

    if (!user) {
      setEmailVerified(null);
      setCheckingVerification(false);
      return;
    }

    if (!db || !process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID) {
      setEmailVerified(false);
      setCheckingVerification(false);
      return;
    }

    setCheckingVerification(true);
    try {
      getDoc(doc(db, "users", user.uid))
        .then((snap) => {
          if (snap.exists()) {
            const data = snap.data();
            setEmailVerified(data?.emailVerified === true);
          } else {
            setEmailVerified(false);
          }
        })
        .catch(() => {
          setEmailVerified(false);
        })
        .finally(() => {
          setCheckingVerification(false);
        });
    } catch (err) {
      setEmailVerified(false);
      setCheckingVerification(false);
    }
  }, [user, mounted, loading, pathname]);

  useEffect(() => {
    if (!mounted || loading) return;

    // 1. If NOT logged in and trying to access a protected page (e.g. read chapter, profile) -> Redirect to /login
    if (!user && isProtectedPage) {
      router.replace(`/login?redirect=${encodeURIComponent(pathname)}`);
      return;
    }

    // 2. If ALREADY logged in and visiting login or register page -> Redirect to /
    if (user && (pathname === "/login" || pathname === "/register")) {
      router.replace("/");
      return;
    }

    // 3. Verified user visiting /verify page -> Redirect to /
    if (
      user &&
      !checkingVerification &&
      emailVerified === true &&
      pathname === "/verify"
    ) {
      router.replace("/");
      return;
    }
  }, [user, loading, mounted, emailVerified, checkingVerification, pathname, router, isProtectedPage]);

  if (!mounted || loading) {
    return <>{children}</>;
  }

  // Prevent flash of protected page content while redirecting unauthenticated users from protected pages
  if (!user && isProtectedPage) {
    return null;
  }

  return <>{children}</>;
}
