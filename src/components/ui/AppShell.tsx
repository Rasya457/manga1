"use client";

import { usePathname } from "next/navigation";
import Navbar from "@/components/ui/Navbar";
import AuthGuard from "@/components/auth/AuthGuard";

export default function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isReaderPage = pathname?.startsWith("/chapter/");

  if (isReaderPage) {
    return (
      <div className="min-h-screen bg-black text-white">
        <AuthGuard>{children}</AuthGuard>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-100 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-50 transition-colors duration-300">
      <AuthGuard>
        <main className="min-h-screen max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-4 pb-28">
          {children}
        </main>
        <Navbar />
      </AuthGuard>
    </div>
  );
}
