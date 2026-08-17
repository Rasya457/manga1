// src/components/auth/AuthGuard.tsx

"use client";

import React, { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAuthContext } from "@/context/AuthContext";

export default function AuthGuard({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuthContext();
  const router = useRouter();
  const pathname = usePathname();
  const [mounted, setMounted] = useState(false);

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

    // 1. If NOT logged in and trying to access a protected page -> Redirect to /login
    if (!user && isProtectedPage) {
      router.replace(`/login?redirect=${encodeURIComponent(pathname)}`);
      return;
    }

    // 2. If ALREADY logged in and visiting login, register, or verify page -> Redirect to /
    if (user && (pathname === "/login" || pathname === "/register" || pathname === "/verify")) {
      router.replace("/");
      return;
    }
  }, [user, loading, mounted, pathname, router, isProtectedPage]);

  if (!mounted || loading) {
    return <>{children}</>;
  }

  // Prevent flash of protected page content while redirecting unauthenticated users
  if (!user && isProtectedPage) {
    return null;
  }

  return <>{children}</>;
}
