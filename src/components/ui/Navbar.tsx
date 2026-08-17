"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { IconHome, IconSearch, IconBookmark, IconUser } from "./Icons";
import { triggerHaptic } from "@/lib/haptics";

const NAV_ITEMS = [
  { href: "/", label: "Home", icon: IconHome },
  { href: "/search", label: "Search", icon: IconSearch },
  { href: "/bookmark", label: "Bookmark", icon: IconBookmark },
  { href: "/profile", label: "Profile", icon: IconUser },
];

export default function Navbar() {
  const pathname = usePathname();

  // Only show navbar on the 4 main tab pages
  const SHOW_ON = ["/", "/search", "/bookmark", "/profile"];
  if (!SHOW_ON.includes(pathname)) {
    return null;
  }

  return (
    <header className="fixed bottom-5 left-0 right-0 z-50 flex justify-center px-4 pointer-events-none md:bottom-6">
      <nav
        className="pointer-events-auto flex items-center justify-around gap-1 md:gap-4 px-4 py-2.5 rounded-full 
        bg-white/80 dark:bg-zinc-900/80 backdrop-blur-2xl 
        border border-white/80 dark:border-zinc-700/60
        shadow-[inset_0_1px_1px_0_rgba(255,255,255,0.9),0_12px_30px_-5px_rgba(0,0,0,0.12)]
        dark:shadow-[inset_0_1px_1px_0_rgba(255,255,255,0.05),0_12px_30px_-5px_rgba(0,0,0,0.5)]
        transition-all duration-300 w-full max-w-md sm:max-w-lg"
        aria-label="Main Navigation"
      >
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const isActive =
            pathname === item.href ||
            (item.href !== "/" && pathname.startsWith(item.href));

          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => triggerHaptic("selection")}
              className={`relative flex flex-col sm:flex-row items-center justify-center gap-1.5 px-4 py-2 rounded-full text-xs font-semibold transition-all duration-300 select-none ${
                isActive
                  ? "text-white font-bold"
                  : "text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-100/60 dark:hover:bg-zinc-800/60"
              }`}
            >
              {isActive && (
                <span
                  className="absolute inset-0 rounded-full 
                  bg-zinc-900 
                  shadow-md shadow-zinc-900/20"
                />
              )}
              <Icon className={`relative z-10 w-5 h-5 transition-transform duration-300 ${isActive ? "scale-110 text-white" : ""}`} />
              <span className="relative z-10 hidden sm:inline text-[11px] tracking-wide">{item.label}</span>
            </Link>
          );
        })}
      </nav>
    </header>
  );
}
