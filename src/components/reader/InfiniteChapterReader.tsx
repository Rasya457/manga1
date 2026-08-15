// src/components/reader/InfiniteChapterReader.tsx

"use client";

import React, { useState, useEffect, useRef, useCallback, useLayoutEffect } from "react";
import { useRouter } from "next/navigation";
import {
  IconChevronLeft,
  IconBookmark,
  IconChapterList,
} from "@/components/ui/Icons";
import { useBookmark } from "@/hooks/useBookmark";
import { useReadingHistory } from "@/hooks/useReadingHistory";
import ChapterDrawer from "./ChapterDrawer";

interface ChapterRef {
  id: string;
  chapter: string | null;
  title: string | null;
}

interface LoadedChapter extends ChapterRef {
  pages: string[];
}

const defaultFetchChapterPages = async (chapterId: string): Promise<string[]> => {
  try {
    const res = await fetch(`/api/mangadex/chapter/${chapterId}`);
    if (!res.ok) return [];
    const data = await res.json();
    return data.pages || [];
  } catch (e) {
    return [];
  }
};

interface InfiniteChapterReaderProps {
  initialChapterId: string;
  mangaId: string;
  mangaCover: string;
  mangaTitle?: string;
  chapterList: ChapterRef[]; // ordered list for this manga (ascending)
  fetchChapterPages?: (chapterId: string) => Promise<string[]>;
  initialPage?: number; // resume position within the initial chapter (from reading history)
}

function MangaPageItem({
  url,
  index,
  onLoad,
}: {
  url: string;
  index: number;
  onLoad?: () => void;
}) {
  // First 8 pages load eagerly and render immediately without fade
  const isEager = index < 8;

  return (
    <div className="manga-page-item relative w-full flex flex-col items-center justify-center bg-zinc-950 overflow-hidden">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={url}
        alt={`Page ${index + 1}`}
        loading={isEager ? "eager" : "lazy"}
        decoding={isEager ? "sync" : "async"}
        fetchPriority={isEager ? "high" : "low"}
        referrerPolicy="no-referrer"
        onLoad={onLoad}
        className="w-full h-auto max-w-full object-contain block"
      />
    </div>
  );
}

export default function InfiniteChapterReader({
  initialChapterId,
  mangaId,
  mangaCover,
  mangaTitle = "Manga Reader",
  chapterList,
  fetchChapterPages = defaultFetchChapterPages,
  initialPage = 1,
}: InfiniteChapterReaderProps) {
  const router = useRouter();
  const { isBookmarked, toggleBookmark } = useBookmark();
  const { updateHistory } = useReadingHistory();

  const [loadedChapters, setLoadedChapters] = useState<LoadedChapter[]>([]);
  const [loadingNext, setLoadingNext] = useState(false);
  const [loadingPrev, setLoadingPrev] = useState(false);
  const [showToolbar, setShowToolbar] = useState(true);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [activeChapterId, setActiveChapterId] = useState(initialChapterId);
  const [currentPage, setCurrentPage] = useState(initialPage || 1);

  const topSentinelRef = useRef<HTMLDivElement | null>(null);
  const bottomSentinelRef = useRef<HTMLDivElement | null>(null);
  const lastScrollY = useRef(0);
  const isInitialMountRef = useRef(true);

  // When we prepend a chapter above, the browser keeps scrollY the same
  const prependHeightBeforeRef = useRef<number | null>(null);

  // Guards the resume-to-page scroll so it only ever runs for the initial chapter
  const hasScrolledToInitialRef = useRef(false);

  // The top sentinel must not start observing until any initial resume-scroll has settled
  const [topObserverReady, setTopObserverReady] = useState(initialPage <= 1);

  // Set when the user jumps to a chapter that wasn't already loaded (via drawer selection),
  // so we know to snap to its top once it actually lands in the DOM.
  const jumpTargetIdRef = useRef<string | null>(null);

  // Load the initial chapter once
  useEffect(() => {
    let cancelled = false;

    async function loadInitial() {
      const ref = chapterList.find((c) => c.id === initialChapterId) ?? {
        id: initialChapterId,
        chapter: null,
        title: null,
      };
      const pages = await fetchChapterPages(initialChapterId);
      if (!cancelled) {
        setLoadedChapters([{ ...ref, pages }]);
        setActiveChapterId(initialChapterId);
      }
    }

    loadInitial();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialChapterId]);

  // Jump INSTANTLY to the exact last read page without any smooth scroll animation
  const scrollToInitialPage = useCallback(() => {
    if (!initialPage || initialPage <= 1) return;

    const chapterContainer = Array.from(
      document.querySelectorAll("[data-chapter-id]")
    ).find((el) => el.getAttribute("data-chapter-id") === initialChapterId);
    if (!chapterContainer) return;

    const pageEls = chapterContainer.querySelectorAll(".manga-page-item");
    const targetEl = pageEls[initialPage - 1] as HTMLElement | undefined;

    if (targetEl) {
      targetEl.scrollIntoView({ behavior: "instant" as ScrollBehavior, block: "start" });
    }
  }, [initialChapterId, initialPage]);

  // Apply instant jump on initial chapter load
  useEffect(() => {
    const isInitialChapterOnly =
      loadedChapters.length === 1 && loadedChapters[0].id === initialChapterId;

    if (isInitialChapterOnly && !hasScrolledToInitialRef.current && initialPage > 1) {
      hasScrolledToInitialRef.current = true;
      // Instant jump immediately and once images begin layout
      scrollToInitialPage();
      const t1 = setTimeout(scrollToInitialPage, 100);
      const t2 = setTimeout(() => {
        scrollToInitialPage();
        setTopObserverReady(true);
      }, 400);
      return () => {
        clearTimeout(t1);
        clearTimeout(t2);
      };
    }
  }, [loadedChapters, initialChapterId, initialPage, scrollToInitialPage]);

  const handlePageImageLoad = useCallback(() => {
    if (initialPage > 1 && !topObserverReady) {
      scrollToInitialPage();
    }
  }, [initialPage, topObserverReady, scrollToInitialPage]);

  const nextAfterLastLoaded = (() => {
    const last = loadedChapters[loadedChapters.length - 1];
    if (!last) return null;
    const idx = chapterList.findIndex((c) => c.id === last.id);
    return idx >= 0 ? chapterList[idx + 1] ?? null : null;
  })();

  const prevBeforeFirstLoaded = (() => {
    const first = loadedChapters[0];
    if (!first) return null;
    const idx = chapterList.findIndex((c) => c.id === first.id);
    return idx > 0 ? chapterList[idx - 1] ?? null : null;
  })();

  const loadNextChapter = useCallback(async () => {
    if (loadingNext || !nextAfterLastLoaded) return;

    setLoadingNext(true);
    try {
      const pages = await fetchChapterPages(nextAfterLastLoaded.id);
      setLoadedChapters((prev) => [...prev, { ...nextAfterLastLoaded, pages }]);
    } catch (err) {
      console.error("Failed to load next chapter:", err);
    } finally {
      setLoadingNext(false);
    }
  }, [loadingNext, nextAfterLastLoaded, fetchChapterPages]);

  const loadPrevChapter = useCallback(async () => {
    if (loadingPrev || !prevBeforeFirstLoaded) return;

    setLoadingPrev(true);
    try {
      const pages = await fetchChapterPages(prevBeforeFirstLoaded.id);
      prependHeightBeforeRef.current = document.documentElement.scrollHeight;
      setLoadedChapters((prev) => [{ ...prevBeforeFirstLoaded, pages }, ...prev]);
    } catch (err) {
      console.error("Failed to load previous chapter:", err);
    } finally {
      setLoadingPrev(false);
    }
  }, [loadingPrev, prevBeforeFirstLoaded, fetchChapterPages]);

  // Correct scroll position after a chapter is prepended
  useLayoutEffect(() => {
    if (prependHeightBeforeRef.current !== null) {
      const newHeight = document.documentElement.scrollHeight;
      const diff = newHeight - prependHeightBeforeRef.current;
      if (diff > 0) {
        window.scrollBy(0, diff);
      }
      prependHeightBeforeRef.current = null;
    }
  }, [loadedChapters]);

  // Prefetch next/prev chapter when reaching edge
  useEffect(() => {
    const bottomEl = bottomSentinelRef.current;
    const topEl = topObserverReady ? topSentinelRef.current : null;
    if (!bottomEl && !topEl) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          if (entry.target === bottomEl) loadNextChapter();
          if (entry.target === topEl) loadPrevChapter();
        });
      },
      { rootMargin: "800px 0px" }
    );

    if (bottomEl) observer.observe(bottomEl);
    if (topEl) observer.observe(topEl);
    return () => observer.disconnect();
  }, [loadNextChapter, loadPrevChapter, topObserverReady]);

  // Track scroll: toolbar visibility + which chapter and page is currently active
  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;

      if (Math.abs(currentScrollY - lastScrollY.current) > 15) {
        if (currentScrollY > lastScrollY.current && currentScrollY > 60) {
          setShowToolbar(false);
        } else if (currentScrollY < lastScrollY.current) {
          setShowToolbar(true);
        }
        lastScrollY.current = currentScrollY;
      }

      const chapterEls = document.querySelectorAll("[data-chapter-id]");
      const centerY = window.innerHeight / 2;
      let activeId: string | null = null;
      let activeContainer: Element | null = null;

      // A chapter is "active" only if it actually straddles the viewport's
      // center line — not just "top has scrolled above center", which lets a
      // short chapter that was just auto-loaded below (e.g. during prefetch)
      // hijack active status even though it isn't really on screen yet.
      chapterEls.forEach((el) => {
        const rect = el.getBoundingClientRect();
        if (rect.top <= centerY && rect.bottom >= centerY) {
          activeId = el.getAttribute("data-chapter-id");
          activeContainer = el;
        }
      });

      // Fallback for edge cases (e.g. the very last loaded chapter is shorter
      // than half the viewport, so nothing strictly straddles the center):
      // fall back to the last chapter whose top has scrolled past center.
      if (!activeContainer) {
        chapterEls.forEach((el) => {
          const rect = el.getBoundingClientRect();
          if (rect.top <= centerY && rect.bottom >= 0) {
            activeId = el.getAttribute("data-chapter-id");
            activeContainer = el;
          }
        });
      }

      if (activeId) {
        setActiveChapterId((prev) => (prev === activeId ? prev : (activeId as string)));
      }

      if (activeContainer) {
        const pageEls = (activeContainer as Element).querySelectorAll(".manga-page-item");
        let activePageIndex = 0;
        let pageFound = false;
        pageEls.forEach((el, index) => {
          const rect = el.getBoundingClientRect();
          if (rect.top <= centerY && rect.bottom >= centerY) {
            activePageIndex = index;
            pageFound = true;
          }
        });
        if (!pageFound) {
          pageEls.forEach((el, index) => {
            const rect = el.getBoundingClientRect();
            if (rect.top <= centerY && rect.bottom >= 0) {
              activePageIndex = index;
            }
          });
        }
        const pageNum = activePageIndex + 1;
        setCurrentPage((prev) => (prev === pageNum ? prev : pageNum));
      }
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Update reading history whenever the active chapter or page changes
  useEffect(() => {
    const active = loadedChapters.find((c) => c.id === activeChapterId);
    if (!active || !mangaId) return;

    const chItem = chapterList.find((c) => c.id === active.id) || active;
    const chNum = chItem.chapter || active.chapter;
    const label = chNum ? `Chapter ${chNum}` : chItem.title || active.title || "Chapter";

    const totalPages = active.pages.length || 1;
    const progress = Math.round((currentPage / totalPages) * 100);

    updateHistory({
      contentId: mangaId,
      type: "manga",
      title: mangaTitle,
      cover: mangaCover,
      lastChapterId: active.id,
      lastChapterRead: label,
      progress,
      currentPage,
    });
  }, [activeChapterId, currentPage, loadedChapters, chapterList, mangaId, mangaTitle, mangaCover, updateHistory]);

  // Keep the browser URL in sync with whichever chapter AND page is currently on screen.
  // This ensures that a page refresh returns the user to the exact chapter AND page they
  // were reading, rather than reverting to the initial chapter/page in the URL.
  useEffect(() => {
    if (!activeChapterId || !mangaId) return;

    const expectedUrl = `/chapter/${activeChapterId}?mangaId=${mangaId}&page=${currentPage}`;

    // Only update if actually different to avoid unnecessary history spam
    const currentSearch = window.location.pathname + window.location.search;
    const expectedPage = `page=${currentPage}`;
    const expectedChapter = activeChapterId;

    if (!currentSearch.includes(expectedChapter) || !currentSearch.includes(expectedPage)) {
      window.history.replaceState(window.history.state, "", expectedUrl);
    }
  }, [activeChapterId, currentPage, mangaId]);

  const bookmarked = isBookmarked(mangaId);
  const activeChapter = loadedChapters.find((c) => c.id === activeChapterId);
  const activeChItem = chapterList.find((c) => c.id === activeChapterId) || activeChapter;
  const activeChNum = activeChItem?.chapter || activeChapter?.chapter;
  const activeChapterLabel = activeChNum
    ? `Chapter ${activeChNum}`
    : activeChItem?.title || activeChapter?.title || "Chapter";

  const handleBack = () => {
    if (mangaId) router.push(`/manga/${mangaId}`);
    else router.back();
  };

  const handleSelectChapter = useCallback(
    async (chId: string) => {
      setDrawerOpen(false);

      if (chId === activeChapterId) return;

      // Case 1: the chapter is already in the loaded feed (from infinite scroll) —
      // just scroll to it and make sure the active state actually reflects it.
      const targetContainer = Array.from(
        document.querySelectorAll("[data-chapter-id]")
      ).find((el) => el.getAttribute("data-chapter-id") === chId);

      if (targetContainer) {
        // Instant jump — no smooth scroll, no retry timeouts
        targetContainer.scrollIntoView({ behavior: "instant" as ScrollBehavior, block: "start" });
        window.scrollBy(0, -4); // 4px offset so the chapter header is clearly visible
        setActiveChapterId(chId);
        setCurrentPage(1);
        return;
      }

      // Case 2: chapter not yet in the feed — fetch & swap in.
      // Also pre-load up to 2 chapters BEFORE the target so the user can scroll up
      // immediately without having to wait for the infinite-scroll sentinel to fire.
      window.scrollTo(0, 0);
      setLoadingNext(false);
      setLoadingPrev(false);
      setLoadedChapters([]);

      try {
        const targetIdx = chapterList.findIndex((c) => c.id === chId);

        // Collect the target and up to 2 chapters before it
        const toLoad: typeof chapterList = [];
        for (let i = Math.max(0, targetIdx - 2); i <= targetIdx; i++) {
          if (chapterList[i]) toLoad.push(chapterList[i]);
        }

        // Fetch all in parallel
        const fetched = await Promise.all(
          toLoad.map(async (ref) => {
            const pages = await fetchChapterPages(ref.id);
            return { ...ref, pages };
          })
        );

        setLoadedChapters(fetched);
        setActiveChapterId(chId);
        setCurrentPage(1);
        // jumpTargetIdRef causes useLayoutEffect to snap to the target chapter's top
        jumpTargetIdRef.current = chId;

        // Sync URL without full Next.js navigation
        const url = `/chapter/${chId}?mangaId=${mangaId}`;
        window.history.replaceState(window.history.state, "", url);
      } catch (err) {
        console.error("Failed to load selected chapter:", err);
      }
    },
    [activeChapterId, chapterList, fetchChapterPages, mangaId]
  );

  // After a drawer-selected chapter finishes loading, snap to its top once it's
  // actually rendered in the DOM. We now load prev chapters alongside the target,
  // so we must scroll to the target container — not just window top 0.
  useLayoutEffect(() => {
    if (!jumpTargetIdRef.current) return;
    const targetId = jumpTargetIdRef.current;
    const exists = loadedChapters.some((c) => c.id === targetId);
    if (exists) {
      const el = document.querySelector(`[data-chapter-id="${targetId}"]`);
      if (el) {
        el.scrollIntoView({ behavior: "instant" as ScrollBehavior, block: "start" });
      } else {
        window.scrollTo({ top: 0, behavior: "instant" as ScrollBehavior });
      }
      jumpTargetIdRef.current = null;
    }
  }, [loadedChapters]);

  return (
    <div
      onClick={() => setShowToolbar((prev) => !prev)}
      className="relative min-h-screen bg-zinc-900 dark:bg-zinc-950 text-zinc-100 flex flex-col items-center cursor-pointer select-none"
    >
      {/* Top Floating Toolbar */}
      <div
        className={`fixed top-0 left-0 right-0 z-40 transition-all duration-300 transform px-4 pt-4 flex justify-center ${
          showToolbar ? "translate-y-0 opacity-100" : "-translate-y-full opacity-0"
        }`}
      >
        <header
          onClick={(e) => e.stopPropagation()}
          className="pointer-events-auto w-full max-w-2xl flex items-center justify-between px-4 py-3 rounded-full
          bg-white/90 dark:bg-zinc-900/90 backdrop-blur-2xl
          border border-white/80 dark:border-zinc-700/80
          shadow-[inset_0_1px_1px_0_rgba(255,255,255,0.9),0_12px_30px_-5px_rgba(0,0,0,0.2)]
          dark:shadow-[inset_0_1px_1px_0_rgba(255,255,255,0.05),0_12px_30px_-5px_rgba(0,0,0,0.8)]"
        >
          <button
            onClick={handleBack}
            className="p-2 rounded-full hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-white transition-colors"
            aria-label="Back to Manga Detail"
          >
            <IconChevronLeft className="w-5 h-5" />
          </button>

          <div className="text-center min-w-0 px-2">
            <h1 className="text-xs sm:text-sm font-black text-zinc-900 dark:text-zinc-100 line-clamp-1">
              {mangaTitle}
            </h1>
            <p className="text-[11px] text-zinc-500 dark:text-zinc-400 font-semibold">
              {activeChapterLabel} (Hal. {currentPage})
            </p>
          </div>

          <button
            onClick={(e) => {
              e.stopPropagation();
              setDrawerOpen(true);
            }}
            className="p-2 rounded-full hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-white transition-colors"
            aria-label="Chapter list"
          >
            <IconChapterList className="w-5 h-5" />
          </button>
        </header>
      </div>

      {/* Continuous Chapter Feed */}
      <main className="w-full max-w-full sm:max-w-4xl flex flex-col items-center pt-0 pb-20 min-h-screen">
        {loadedChapters.length === 0 ? (
          <div className="flex flex-col items-center justify-center min-h-[70vh] gap-3">
            <div className="w-9 h-9 border-3 border-zinc-700 border-t-white rounded-full animate-spin" />
            <p className="text-xs font-bold text-zinc-300">Memuat halaman komik...</p>
          </div>
        ) : (
          <>
            {/* Sentinel that triggers loading the PREVIOUS chapter */}
            <div ref={topSentinelRef} className="w-full h-4" />

            {loadingPrev && (
              <div className="py-6 flex items-center justify-center gap-2 text-zinc-400 text-xs font-semibold">
                <div className="w-4 h-4 border-2 border-zinc-700 border-t-zinc-300 rounded-full animate-spin" />
                Memuat chapter sebelumnya...
              </div>
            )}

            {!prevBeforeFirstLoaded && !loadingPrev && (
              <div className="py-6 text-center text-zinc-500 text-xs font-semibold">
                Ini chapter pertama.
              </div>
            )}

            {loadedChapters.map((ch) => (
              <div key={ch.id} data-chapter-id={ch.id} className="w-full">
                <div className="w-full py-4 text-center border-y border-zinc-800 bg-zinc-950/60">
                  <span className="text-xs font-bold text-zinc-400 uppercase tracking-widest">
                    {ch.chapter ? `Chapter ${ch.chapter}` : ch.title || "Chapter"}
                  </span>
                </div>
                {ch.pages.map((url, i) => (
                  <MangaPageItem
                    key={`${ch.id}-${i}`}
                    url={url}
                    index={i}
                    onLoad={ch.id === initialChapterId && i < 8 ? handlePageImageLoad : undefined}
                  />
                ))}
              </div>
            ))}

            {/* Sentinel that triggers loading the NEXT chapter */}
            <div ref={bottomSentinelRef} className="w-full h-4" />

            {loadingNext && (
              <div className="py-8 flex items-center justify-center gap-2 text-zinc-400 text-xs font-semibold">
                <div className="w-4 h-4 border-2 border-zinc-700 border-t-zinc-300 rounded-full animate-spin" />
                Memuat chapter berikutnya...
              </div>
            )}

            {!nextAfterLastLoaded && !loadingNext && (
              <div className="py-10 text-center text-zinc-500 text-xs font-semibold">
                Ini chapter terakhir yang tersedia.
              </div>
            )}
          </>
        )}
      </main>

      {/* Bottom Floating Toolbar */}
      <div
        className={`fixed bottom-6 left-0 right-0 z-40 transition-all duration-300 transform ${
          showToolbar ? "translate-y-0 opacity-100" : "translate-y-full opacity-0"
        } pointer-events-none px-4 flex justify-center`}
      >
        <footer
          onClick={(e) => e.stopPropagation()}
          className="pointer-events-auto w-full max-w-md flex items-center justify-between px-5 py-3 rounded-full
          bg-white/90 dark:bg-zinc-900/90 backdrop-blur-2xl
          border border-white/80 dark:border-zinc-700/80
          shadow-[inset_0_1px_1px_0_rgba(255,255,255,0.9),0_12px_30px_-5px_rgba(0,0,0,0.2)]
          dark:shadow-[inset_0_1px_1px_0_rgba(255,255,255,0.05),0_12px_30px_-5px_rgba(0,0,0,0.8)]"
        >
          <button
            onClick={() =>
              toggleBookmark({
                contentId: mangaId,
                type: "manga",
                title: mangaTitle,
                cover: mangaCover,
              })
            }
            className={`p-2 rounded-full transition-colors ${
              bookmarked
                ? "bg-zinc-900 text-white dark:bg-white dark:text-zinc-900 shadow-md"
                : "text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-800"
            }`}
            aria-label="Bookmark"
          >
            <IconBookmark className={`w-5 h-5 ${bookmarked ? "fill-current" : ""}`} />
          </button>

          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-zinc-100 dark:bg-zinc-800/80 border border-zinc-200/80 dark:border-zinc-700/60">
            <span className="text-xs sm:text-sm font-extrabold text-zinc-900 dark:text-zinc-100 line-clamp-1 max-w-[140px]">
              {activeChapterLabel} (Hal. {currentPage})
            </span>
          </div>

          <button
            onClick={(e) => {
              e.stopPropagation();
              setDrawerOpen(true);
            }}
            className="p-2 rounded-full text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
            aria-label="Chapter list"
          >
            <IconChapterList className="w-5 h-5" />
          </button>
        </footer>
      </div>

      <ChapterDrawer
        chapterId={activeChapterId}
        mangaId={mangaId}
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        onSelectChapter={handleSelectChapter}
        chapterList={chapterList}
      />
    </div>
  );
}