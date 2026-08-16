// src/hooks/useStatusBar.ts
"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { useTheme } from "@/context/ThemeContext";

/**
 * Synchronizes mobile status bar style (Dark / Light) and background color
 * with current theme and active page (e.g. Pure Black in Reader).
 */
export function useStatusBar() {
  const { isDark } = useTheme();
  const pathname = usePathname();
  const isReader = pathname.startsWith("/chapter/") || pathname.startsWith("/read/");

  useEffect(() => {
    if (typeof window === "undefined") return;

    const themeColor = isReader ? "#000000" : isDark ? "#09090b" : "#f4f4f5";

    // 1. Update HTML meta theme-color tag
    let metaTag = document.querySelector('meta[name="theme-color"]');
    if (!metaTag) {
      metaTag = document.createElement("meta");
      metaTag.setAttribute("name", "theme-color");
      document.head.appendChild(metaTag);
    }
    metaTag.setAttribute("content", themeColor);

    // 2. Update Capacitor StatusBar if running in native app
    async function syncCapacitorStatusBar() {
      try {
        const { StatusBar, Style } = await import("@capacitor/status-bar");
        if (isReader) {
          await StatusBar.setStyle({ style: Style.Dark });
          await StatusBar.setBackgroundColor({ color: "#000000" });
        } else if (isDark) {
          await StatusBar.setStyle({ style: Style.Dark });
          await StatusBar.setBackgroundColor({ color: "#09090b" });
        } else {
          await StatusBar.setStyle({ style: Style.Light });
          await StatusBar.setBackgroundColor({ color: "#f4f4f5" });
        }
      } catch (e) {
        // Fallback when not inside Capacitor
      }
    }

    syncCapacitorStatusBar();
  }, [isDark, isReader]);
}
