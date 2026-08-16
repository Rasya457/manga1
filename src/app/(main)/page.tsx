"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import useSWR from "swr";
import HeroBanner from "@/components/content/HeroBanner";
import ContentCard from "@/components/content/ContentCard";
import ContinueReadingSection from "@/components/content/ContinueReadingSection";
import { MangaListItem } from "@/lib/sources/mangadex";

const fetcher = async (url: string): Promise<MangaListItem[]> => {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Failed to fetch ${url}`);
  const data = await res.json();
  return (data.items || []) as MangaListItem[];
};

export default function HomePage() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Fast initial fetch — 10 items, shows immediately
  const { data: mangaListFast = [], isLoading: fastLoading } = useSWR(
    "/api/mangadex/catalog?limit=10&order[updatedAt]=desc",
    fetcher
  );

  // Background fetch — loads the remaining popular titles
  const { data: mangaListMore = [] } = useSWR(
    "/api/mangadex/catalog?limit=50&offset=10&order[updatedAt]=desc",
    fetcher
  );

  const { data: mangaRomanceList = [] } = useSWR(
    "/api/mangadex/catalog?type=manga&genre=romance&limit=16",
    fetcher
  );

  const { data: manhwaRomanceList = [] } = useSWR(
    "/api/mangadex/catalog?type=manhwa&genre=romance&limit=16",
    fetcher
  );

  const newChapters = mangaListFast;
  const popularManga = mangaListMore;

  // Avoid hydration mismatch by waiting for client mount before switching off skeleton
  const catalogLoading = fastLoading;
  const showSkeleton = !mounted || (catalogLoading && mangaListFast.length === 0);

  return (
    <div className="space-y-8 text-zinc-900 dark:text-zinc-100">
      {/* Top Header */}
      <div className="flex items-center justify-between pt-2">
        <h1 className="text-2xl sm:text-3xl font-black text-zinc-900 dark:text-zinc-100 tracking-tight">
          MANGA VERSE
        </h1>
      </div>

      {/* Loading Skeleton */}
      {showSkeleton ? (
        <div className="space-y-8 animate-pulse">
          <div className="w-full h-80 bg-zinc-200 dark:bg-zinc-800 rounded-3xl" />
          <div className="flex gap-4 overflow-hidden">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="w-44 h-64 bg-zinc-200 dark:bg-zinc-800 rounded-2xl flex-shrink-0" />
            ))}
          </div>
          <div className="flex gap-4 overflow-hidden">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="w-44 h-64 bg-zinc-200 dark:bg-zinc-800 rounded-2xl flex-shrink-0" />
            ))}
          </div>
        </div>
      ) : (
        <>
          {/* Hero Banner Carousel */}
          {mangaList.length > 0 && <HeroBanner items={mangaList} />}

          {/* Continue Reading Section */}
          <ContinueReadingSection />

          {/* Section 1: New Chapters (Horizontal Scroll) */}
          <section className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg sm:text-xl font-black text-zinc-900 dark:text-zinc-100 tracking-tight uppercase">
                New Chapters
              </h2>
              <Link
                href="/search"
                className="text-xs font-extrabold text-zinc-700 dark:text-zinc-300 hover:text-black dark:hover:text-white transition-colors"
              >
                See all
              </Link>
            </div>

            <div className="flex items-center gap-4 overflow-x-auto no-scrollbar pb-4 pt-1">
              {newChapters.map((item) => (
                <ContentCard
                  key={item.id}
                  item={item}
                  showChapter={true}
                  variant="horizontal"
                />
              ))}
            </div>
          </section>

          {/* Section 2: Manga Romance (Horizontal Scroll) */}
          {mangaRomanceList.length > 0 && (
            <section className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-lg sm:text-xl font-black text-zinc-900 dark:text-zinc-100 tracking-tight uppercase">
                    Manga Romance
                  </h2>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400 font-medium">
                    Rekomendasi komik Jepang bergenre romantis
                  </p>
                </div>
                <Link
                  href="/search?type=manga&genre=romance"
                  className="text-xs font-extrabold text-zinc-700 dark:text-zinc-300 hover:text-black dark:hover:text-white transition-colors"
                >
                  See all
                </Link>
              </div>

              <div className="flex items-center gap-4 overflow-x-auto no-scrollbar pb-4 pt-1">
                {mangaRomanceList.map((item) => (
                  <ContentCard
                    key={`manga-rom-${item.id}`}
                    item={item}
                    showChapter={true}
                    variant="horizontal"
                  />
                ))}
              </div>
            </section>
          )}

          {/* Section 3: Manhwa Romance (Horizontal Scroll) */}
          {manhwaRomanceList.length > 0 && (
            <section className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-lg sm:text-xl font-black text-zinc-900 dark:text-zinc-100 tracking-tight uppercase">
                    Manhwa Romance
                  </h2>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400 font-medium">
                    Rekomendasi komik Korea bergenre romantis & kerajaan
                  </p>
                </div>
                <Link
                  href="/search?type=manhwa&genre=romance"
                  className="text-xs font-extrabold text-zinc-700 dark:text-zinc-300 hover:text-black dark:hover:text-white transition-colors"
                >
                  See all
                </Link>
              </div>

              <div className="flex items-center gap-4 overflow-x-auto no-scrollbar pb-4 pt-1">
                {manhwaRomanceList.map((item) => (
                  <ContentCard
                    key={`manhwa-rom-${item.id}`}
                    item={item}
                    showChapter={true}
                    variant="horizontal"
                  />
                ))}
              </div>
            </section>
          )}

          {/* Section 4: Popular Titles (Grid Layout) */}
          <section className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg sm:text-xl font-black text-zinc-900 dark:text-zinc-100 tracking-tight uppercase">
                Popular Titles
              </h2>
              <Link
                href="/search"
                className="text-xs font-extrabold text-zinc-700 dark:text-zinc-300 hover:text-black dark:hover:text-white transition-colors"
              >
                See all
              </Link>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4 sm:gap-6">
              {(popularManga.length > 0 ? popularManga : newChapters).map((item) => (
                <ContentCard key={`popular-${item.id}`} item={item} showChapter={false} variant="grid" />
              ))}
            </div>
          </section>
        </>
      )}
    </div>
  );
}