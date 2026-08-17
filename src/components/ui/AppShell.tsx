"use client";

import React from "react";
import { usePathname } from "next/navigation";
import Navbar from "@/components/ui/Navbar";
import AuthGuard from "@/components/auth/AuthGuard";
import { useNativeBackButton } from "@/hooks/useNativeBackButton";
import { useStatusBar } from "@/hooks/useStatusBar";

export default function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  // Native Android hardware back button and Edge-to-edge status bar hooks
  useNativeBackButton();
  useStatusBar();

  const isAuthPage = pathname === "/login" || pathname === "/register" || pathname === "/verify";
  const isReaderPage = pathname?.startsWith("/chapter/");

  if (isAuthPage || isReaderPage) {
    return <AuthGuard>{children}</AuthGuard>;
  }

  return (
    <div className="min-h-screen bg-zinc-100 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-50 transition-colors duration-200">
      <AuthGuard>
        <main className="relative min-h-screen max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-4 pb-28">
          {children}
        </main>
        <Navbar />
      </AuthGuard>
    </div>
  );
}
