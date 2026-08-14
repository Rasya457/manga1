"use client";

import Link from "next/link";
import Image from "next/image";
import { IconPlay, IconClock } from "@/components/ui/Icons";
import { useReadingHistory } from "@/hooks/useReadingHistory";

export default function ContinueReadingSection() {
  const { history } = useReadingHistory();

  // Filter out any stale placeholder history items from before metadata fix
  const validHistory = (history || []).filter(
    (item) => item.title && item.title !== "Manga Reader" && item.title !== "Manga"
  );

  if (validHistory.length === 0) {
    return null;
  }

  // Display recent valid history items
  const recentItems = validHistory.slice(0, 10);

  return (
    <section className="my-6 text-zinc-900 dark:text-zinc-100 space-y-3">
      {/* Section Title Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-extrabold text-zinc-900 dark:text-zinc-100 flex items-center gap-2 tracking-tight">
          <IconClock className="w-5 h-5 text-zinc-700 dark:text-zinc-300" />
          <span>Continue Reading</span>
        </h2>
        <Link
          href="/history"
          className="text-xs text-zinc-600 dark:text-zinc-400 hover:text-black dark:hover:text-white font-bold transition-colors"
        >
          View All History ({validHistory.length})
        </Link>
      </div>

      {/* Horizontal Scroll Cards Container */}
      <div className="flex items-center gap-4 overflow-x-auto no-scrollbar pb-3 pt-1">
        {recentItems.map((item, idx) => {
          const progressPercent = item.progress || 50;
          const coverImage =
            item.cover ||
            "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=400&q=80";

          return (
            <div
              key={item.contentId ? `${item.contentId}-${idx}` : `history-${idx}`}
              className="flex-shrink-0 w-72 sm:w-80 flex items-center gap-3.5 p-3 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800 shadow-sm hover:border-zinc-400 dark:hover:border-zinc-700 transition-all group select-none"
            >
              {/* Cover Image */}
              <div className="relative w-16 h-22 rounded-xl overflow-hidden flex-shrink-0 bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 shadow-xs">
                <Image
                  src={coverImage}
                  alt={item.title || "Manga Cover"}
                  fill
                  className="object-cover group-hover:scale-105 transition-transform duration-300"
                  unoptimized
                />
              </div>

              {/* Info Details */}
              <div className="flex-1 min-w-0 flex flex-col justify-between h-full py-0.5">
                <div>
                  <h3 className="text-xs sm:text-sm font-extrabold text-zinc-900 dark:text-zinc-100 line-clamp-1 group-hover:text-black dark:group-hover:text-white transition-colors">
                    {item.title}
                  </h3>
                  <div className="flex items-center gap-1.5 mt-1">
                    <span className="px-2 py-0.5 rounded-md bg-zinc-100 dark:bg-zinc-800 border border-zinc-200/60 dark:border-zinc-700 text-[10px] font-bold text-zinc-700 dark:text-zinc-300">
                      {item.lastChapterRead || "Last Chapter"}
                    </span>
                  </div>
                </div>

                {/* Progress Bar */}
                <div className="mt-2">
                  <div className="flex items-center justify-between text-[10px] text-zinc-500 dark:text-zinc-400 font-semibold mb-1">
                    <span>Progress</span>
                    <span>{progressPercent}%</span>
                  </div>
                  <div className="w-full h-1.5 rounded-full bg-zinc-100 dark:bg-zinc-800 overflow-hidden">
                    <div
                      className="h-full rounded-full bg-zinc-900 dark:bg-zinc-100 transition-all duration-300"
                      style={{ width: `${progressPercent}%` }}
                    />
                  </div>
                </div>
              </div>

              {/* Resume Reading Play Button */}
              <Link
                href={`/chapter/${item.lastChapterId}?mangaId=${item.contentId}&page=${
                  item.currentPage || 1
                }&title=${encodeURIComponent(item.title)}&cover=${encodeURIComponent(item.cover || "")}`}
                className="p-3 rounded-full bg-zinc-900 dark:bg-white hover:bg-black dark:hover:bg-zinc-100 text-white dark:text-zinc-900 shadow-md transition-transform hover:scale-110 flex-shrink-0 ml-1"
                aria-label={`Resume reading ${item.title}`}
              >
                <IconPlay className="w-4 h-4 fill-current" />
              </Link>
            </div>
          );
        })}
      </div>
    </section>
  );
}