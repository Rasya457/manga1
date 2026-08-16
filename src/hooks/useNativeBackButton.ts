// src/hooks/useNativeBackButton.ts
"use client";

import { useEffect, useRef } from "react";
import { useRouter, usePathname } from "next/navigation";
import { triggerHaptic } from "@/lib/haptics";

/**
 * Handles Android hardware back button and browser back navigation seamlessly.
 * Prevents accidental app exit when on Home screen by requiring double back press.
 */
export function useNativeBackButton() {
  const router = useRouter();
  const pathname = usePathname();
  const lastBackPressRef = useRef<number>(0);

  useEffect(() => {
    if (typeof window === "undefined") return;

    // Listen for Capacitor App backButton event if available
    let capacitorListener: any = null;

    async function registerCapacitorBack() {
      try {
        const { App } = await import("@capacitor/app");
        capacitorListener = await App.addListener("backButton", ({ canGoBack }: { canGoBack: boolean }) => {
          triggerHaptic("light");

          // 1. If currently on a sub-page, navigate back
          if (pathname !== "/" && canGoBack) {
            router.back();
            return;
          }

          // 2. If already on Home page, implement double-press to exit
          const now = Date.now();
          if (now - lastBackPressRef.current < 2000) {
            App.exitApp();
          } else {
            lastBackPressRef.current = now;
            showExitToast();
          }
        });
      } catch (e) {
        // Not running inside Capacitor or plugin not loaded yet
      }
    }

    registerCapacitorBack();

    return () => {
      if (capacitorListener && typeof capacitorListener.remove === "function") {
        capacitorListener.remove();
      }
    };
  }, [pathname, router]);
}

function showExitToast() {
  if (typeof document === "undefined") return;
  const existing = document.getElementById("native-exit-toast");
  if (existing) existing.remove();

  const toast = document.createElement("div");
  toast.id = "native-exit-toast";
  toast.className =
    "fixed bottom-20 left-1/2 -translate-x-1/2 z-[999] px-4 py-2 bg-zinc-900/90 text-white text-xs font-semibold rounded-full shadow-2xl backdrop-blur-md border border-zinc-700 animate-fade-in pointer-events-none transition-all duration-300";
  toast.innerText = "Tekan sekali lagi untuk keluar";

  document.body.appendChild(toast);

  setTimeout(() => {
    toast.style.opacity = "0";
    setTimeout(() => toast.remove(), 300);
  }, 1800);
}
