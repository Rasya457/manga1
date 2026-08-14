// src/components/providers/SWRProviderWrapper.tsx
"use client";

import React from "react";
import { SWRConfig } from "swr";
import { sessionStorageProvider } from "@/lib/swrProvider";

export default function SWRProviderWrapper({ children }: { children: React.ReactNode }) {
  return (
    <SWRConfig
      value={{
        provider: sessionStorageProvider,
        // Avoid redundant re-fetches when the same URL is used in multiple components
        dedupingInterval: 60_000,       // 1 min — no duplicate network calls within 1 min
        revalidateOnFocus: false,        // Don't refetch when user switches tabs back
        revalidateOnReconnect: true,     // Refetch when network reconnects
        errorRetryCount: 2,              // Don't hammer on errors — max 2 retries
        focusThrottleInterval: 30_000,   // Even if revalidateOnFocus were true, throttle to 30s
      }}
    >
      {children}
    </SWRConfig>
  );
}
