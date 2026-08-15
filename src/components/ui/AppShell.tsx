"use client";

import React, { useRef } from "react";
import { usePathname, useRouter } from "next/navigation";
import Navbar from "@/components/ui/Navbar";
import AuthGuard from "@/components/auth/AuthGuard";

const MAIN_TABS = ["/", "/search", "/bookmark", "/profile"];

export default function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const isReaderPage = pathname?.startsWith("/chapter/");

  const touchStartX = useRef<number | null>(null);
  const touchStartY = useRef<number | null>(null);
  const isExcludedElement = useRef<boolean>(false);

  const handleTouchStart = (e: React.TouchEvent) => {
    const target = e.target as HTMLElement | null;

    // Don't trigger tab switch if swiping inside horizontal sliders, inputs, or buttons
    if (
      target?.closest(".overflow-x-auto") ||
      target?.closest(".no-scrollbar") ||
      target?.closest("input") ||
      target?.closest("textarea") ||
      target?.closest("button")
    ) {
      isExcludedElement.current = true;
      return;
    }

    isExcludedElement.current = false;
    touchStartX.current = e.touches[0].clientX;
    touchStartY.current = e.touches[0].clientY;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (
      isExcludedElement.current ||
      touchStartX.current === null ||
      touchStartY.current === null
    ) {
      touchStartX.current = null;
      touchStartY.current = null;
      return;
    }

    const deltaX = touchStartX.current - e.changedTouches[0].clientX;
    const deltaY = touchStartY.current - e.changedTouches[0].clientY;

    // Minimum swipe distance 60px, must be predominantly horizontal
    if (Math.abs(deltaX) > 60 && Math.abs(deltaX) > Math.abs(deltaY) * 1.3) {
      const currentIdx = MAIN_TABS.indexOf(pathname);
      if (currentIdx !== -1) {
        if (deltaX > 0 && currentIdx < MAIN_TABS.length - 1) {
          // Swipe Left (finger right -> left) = Go to Next Tab (e.g. Home -> Search)
          router.push(MAIN_TABS[currentIdx + 1]);
        } else if (deltaX < 0 && currentIdx > 0) {
          // Swipe Right (finger left -> right) = Go to Previous Tab (e.g. Search -> Home)
          router.push(MAIN_TABS[currentIdx - 1]);
        }
      }
    }

    touchStartX.current = null;
    touchStartY.current = null;
  };

  if (isReaderPage) {
    return (
      <div className="min-h-screen bg-black text-white">
        <AuthGuard>{children}</AuthGuard>
      </div>
    );
  }

  return (
    <div
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      className="min-h-screen bg-zinc-100 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-50 transition-colors duration-300"
    >
      <AuthGuard>
        <main className="min-h-screen max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-4 pb-28">
          <div key={pathname} className="page-enter-animation w-full">
            {children}
          </div>
        </main>
        <Navbar />
      </AuthGuard>
    </div>
  );
}
