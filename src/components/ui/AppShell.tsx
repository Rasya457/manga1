"use client";

import React, { useRef, useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import Navbar from "@/components/ui/Navbar";
import AuthGuard from "@/components/auth/AuthGuard";

const MAIN_TABS = ["/", "/search", "/bookmark", "/profile"];

// Direction context for the page transition
type SlideDirection = "left" | "right" | "none";
let pendingDirection: SlideDirection = "none";

export default function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();

  const touchStartX = useRef<number | null>(null);
  const touchStartY = useRef<number | null>(null);
  const isExcludedElement = useRef<boolean>(false);

  const [slideDirection, setSlideDirection] = useState<SlideDirection>("none");
  const [animKey, setAnimKey] = useState(0);

  // After mount, read the pending direction set during swipe
  useEffect(() => {
    if (pendingDirection !== "none") {
      setSlideDirection(pendingDirection);
      setAnimKey((k) => k + 1);
      pendingDirection = "none";
    } else {
      setSlideDirection("none");
      setAnimKey((k) => k + 1);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);

  const handleTouchStart = (e: React.TouchEvent) => {
    const target = e.target as HTMLElement | null;

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

    if (Math.abs(deltaX) > 60 && Math.abs(deltaX) > Math.abs(deltaY) * 1.3) {
      const currentIdx = MAIN_TABS.indexOf(pathname);
      if (currentIdx !== -1) {
        if (deltaX > 0 && currentIdx < MAIN_TABS.length - 1) {
          // Swipe left → go forward → page slides in from right
          pendingDirection = "left";
          router.push(MAIN_TABS[currentIdx + 1]);
        } else if (deltaX < 0 && currentIdx > 0) {
          // Swipe right → go back → page slides in from left
          pendingDirection = "right";
          router.push(MAIN_TABS[currentIdx - 1]);
        }
      }
    }

    touchStartX.current = null;
    touchStartY.current = null;
  };

  const isAuthPage = pathname === "/login" || pathname === "/register" || pathname === "/verify";
  const isReaderPage = pathname?.startsWith("/chapter/");

  if (isAuthPage || isReaderPage) {
    return <AuthGuard>{children}</AuthGuard>;
  }

  const animClass =
    slideDirection === "left"
      ? "page-slide-from-right"
      : slideDirection === "right"
      ? "page-slide-from-left"
      : "page-fade-up";

  return (
    <div
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      className="min-h-screen bg-zinc-100 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-50 transition-colors duration-300"
      style={{ overflow: "hidden" }}
    >
      <AuthGuard>
        <main className="min-h-screen max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-4 pb-28">
          <div key={`${pathname}-${animKey}`} className={`${animClass} w-full`}>
            {children}
          </div>
        </main>
        <Navbar />
      </AuthGuard>
    </div>
  );
}
