"use client";

import React, { useRef, useEffect, useLayoutEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import Navbar from "@/components/ui/Navbar";
import AuthGuard from "@/components/auth/AuthGuard";
import {
  MAIN_TABS,
  type SlideDirection,
  setPendingDirection,
  consumePendingDirection,
} from "@/lib/pageTransition";

interface PageSnapshot {
  pathname: string;
  children: React.ReactNode;
}

// Must match the CSS animation duration in globals.css (.page-slide-in-*, .page-slide-out-*)
const SLIDE_TRANSITION_MS = 340;

export default function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();

  const touchStartX = useRef<number | null>(null);
  const touchStartY = useRef<number | null>(null);
  const isExcludedElement = useRef<boolean>(false);

  // The previous page, kept mounted just long enough to animate out
  // underneath/behind the incoming page.
  const [outgoing, setOutgoing] = useState<{ snapshot: PageSnapshot; direction: SlideDirection } | null>(null);
  const [incomingDirection, setIncomingDirection] = useState<SlideDirection>("none");
  const [animKey, setAnimKey] = useState(0);

  // Always mirrors the last rendered pathname/children, so the instant the
  // route changes we can snapshot exactly what was on screen a moment ago.
  const lastRenderedRef = useRef<PageSnapshot>({ pathname, children });
  const outgoingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // useLayoutEffect (not useEffect) is essential here: it runs before the
  // browser paints, so the correct transition state is applied before the
  // user ever sees a frame — avoids a double-animation flicker.
  useLayoutEffect(() => {
    if (lastRenderedRef.current.pathname === pathname) {
      // Same route re-rendering with new content (not a navigation) — just
      // keep the snapshot fresh, don't trigger a transition.
      lastRenderedRef.current = { pathname, children };
      return;
    }

    const direction = consumePendingDirection();

    if (outgoingTimeoutRef.current) clearTimeout(outgoingTimeoutRef.current);

    if (direction !== "none") {
      // Keep rendering the previous page (from just before this update) so
      // it can animate out while the new page animates in over it.
      setOutgoing({ snapshot: lastRenderedRef.current, direction });
      outgoingTimeoutRef.current = setTimeout(() => {
        setOutgoing(null);
      }, SLIDE_TRANSITION_MS);
    } else {
      setOutgoing(null);
    }

    setIncomingDirection(direction);
    setAnimKey((k) => k + 1);
    lastRenderedRef.current = { pathname, children };
  }, [pathname, children]);

  useEffect(() => {
    return () => {
      if (outgoingTimeoutRef.current) clearTimeout(outgoingTimeoutRef.current);
    };
  }, []);

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
          setPendingDirection("left");
          router.push(MAIN_TABS[currentIdx + 1]);
        } else if (deltaX < 0 && currentIdx > 0) {
          // Swipe right → go back → page slides in from left
          setPendingDirection("right");
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

  const incomingClass =
    incomingDirection === "left"
      ? "page-slide-in-from-right"
      : incomingDirection === "right"
      ? "page-slide-in-from-left"
      : "page-fade-up";

  const outgoingClass =
    outgoing?.direction === "left"
      ? "page-slide-out-to-left"
      : outgoing?.direction === "right"
      ? "page-slide-out-to-right"
      : "";

  // Shared so the absolutely-positioned outgoing layer lines up exactly
  // with the normal-flow incoming layer (absolute positioning ignores the
  // parent's padding, so it has to be repeated here).
  const pagePadding = "px-4 sm:px-6 lg:px-8 pt-4";

  return (
    <div
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      className="min-h-screen bg-zinc-100 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-50 transition-colors duration-300"
      style={{ overflow: "hidden" }}
    >
      <AuthGuard>
        <main className="relative min-h-screen max-w-7xl mx-auto pb-28">
          {outgoing && (
            <div
              key={`outgoing-${outgoing.snapshot.pathname}`}
              className={`absolute inset-0 ${pagePadding} ${outgoingClass}`}
              aria-hidden="true"
              style={{ pointerEvents: "none" }}
            >
              {outgoing.snapshot.children}
            </div>
          )}
          <div key={`${pathname}-${animKey}`} className={`${pagePadding} ${incomingClass} w-full`}>
            {children}
          </div>
        </main>
        <Navbar />
      </AuthGuard>
    </div>
  );
}
