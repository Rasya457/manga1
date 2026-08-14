"use client";

import React, { useState, useEffect } from "react";
import { IconSearch, IconClock, IconX, IconTrash } from "@/components/ui/Icons";
import ContentCard from "@/components/content/ContentCard";
import { MangaListItem } from "@/lib/sources/mangadex";

const SEARCH_HISTORY_KEY = "manga_app_search_history";

export default function SearchPage() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<MangaListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [searchHistory, setSearchHistory] = useState<string[]>([]);
  const [isInputFocused, setIsInputFocused] = useState(false);

  // Load Search History from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(SEARCH_HISTORY_KEY);
      if (stored) {
        setSearchHistory(JSON.parse(stored));
      }
    } catch (e) {}
  }, []);

  // Save query to Search History ONLY on explicit Form Submit / Enter
  const saveSearchQuery = (term: string) => {
    const trimmed = term.trim();
    if (!trimmed || trimmed.length < 2) return;
    try {
      const updated = [
        trimmed,
        ...searchHistory.filter((item) => item.toLowerCase() !== trimmed.toLowerCase()),
      ].slice(0, 10);
      setSearchHistory(updated);
      localStorage.setItem(SEARCH_HISTORY_KEY, JSON.stringify(updated));
    } catch (e) {}
  };

  // Remove single history item
  const removeHistoryItem = (termToRemove: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      const updated = searchHistory.filter((item) => item !== termToRemove);
      setSearchHistory(updated);
      localStorage.setItem(SEARCH_HISTORY_KEY, JSON.stringify(updated));
    } catch (e) {}
  };

  // Clear all search history
  const clearAllHistory = () => {
    try {
      setSearchHistory([]);
      localStorage.removeItem(SEARCH_HISTORY_KEY);
    } catch (e) {}
  };

  // Load session cache on client mount to avoid SSR hydration mismatch
  useEffect(() => {
    try {
      const cached = sessionStorage.getItem("cache_search_catalog");
      if (cached) {
        const parsed = JSON.parse(cached);
        if (parsed.length > 0) {
          setResults(parsed);
          setLoading(false);
        }
      }
    } catch (e) {}
  }, []);

  // Reset page to 1 when query changes
  useEffect(() => {
    setPage(1);
    setHasMore(true);
  }, [query]);

  // Fetch search or catalog results
  useEffect(() => {
    async function fetchData() {
      if (page === 1) {
        setLoading(true);
      } else {
        setLoadingMore(true);
      }

      try {
        const params = new URLSearchParams();
        params.append("limit", "48");
        params.append("page", String(page));

        if (query.trim().length >= 2) {
          params.append("q", query.trim());
        }

        const endpoint = query.trim().length >= 2 ? "/api/mangadex/search" : "/api/mangadex/catalog";
        const res = await fetch(`${endpoint}?${params.toString()}`);

        if (res.ok) {
          const data = await res.json();
          const items: MangaListItem[] = data.items || [];

          if (items.length < 48) {
            setHasMore(false);
          }

          if (page === 1) {
            setResults(items);
            if (!query) {
              try {
                sessionStorage.setItem("cache_search_catalog", JSON.stringify(items));
              } catch (e) {}
            }
          } else {
            setResults((prev) => {
              const existingIds = new Set(prev.map((i) => i.id));
              const newItems = items.filter((i) => !existingIds.has(i.id));
              return [...prev, ...newItems];
            });
          }
        }
      } catch (err) {
        console.error("Failed to fetch search results", err);
      } finally {
        setLoading(false);
        setLoadingMore(false);
      }
    }

    const timer = setTimeout(fetchData, 200);
    return () => clearTimeout(timer);
  }, [query, page]);

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      saveSearchQuery(query.trim());
    }
  };

  const handleSelectHistory = (term: string) => {
    setQuery(term);
    setIsInputFocused(false);
    saveSearchQuery(term);
  };

  const handleLoadMore = () => {
    if (!loadingMore && hasMore) {
      setPage((prev) => prev + 1);
    }
  };

  const headerTitle = query.trim().length >= 2
    ? `Results for "${query}"`
    : `Explore Catalog (${results.length} titles)`;

  return (
    <div className="space-y-6 pt-2 pb-24 text-zinc-900 dark:text-zinc-100 font-sans">
      {/* Search Input Section */}
      <div className="relative w-full">
        <form onSubmit={handleFormSubmit} className="relative w-full flex items-center">
          <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none text-zinc-400">
            <IconSearch className="w-5 h-5" />
          </div>

          <input
            type="text"
            value={query}
            onFocus={() => setIsInputFocused(true)}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Ketik judul komik & tekan Enter untuk mencari..."
            className="w-full pl-12 pr-12 py-3.5 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800 text-sm font-semibold text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 focus:outline-none focus:border-zinc-900 dark:focus:border-zinc-100 shadow-sm transition-all"
          />

          {query && (
            <button
              type="button"
              onClick={() => setQuery("")}
              className="absolute inset-y-0 right-4 flex items-center text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200"
              aria-label="Clear search"
            >
              <IconX className="w-4 h-4" />
            </button>
          )}
        </form>
      </div>

      {/* Recent Searches Section (Only shows when search history exists) */}
      {searchHistory.length > 0 && (
        <div className="space-y-2 bg-white dark:bg-zinc-900/60 p-3.5 rounded-2xl border border-zinc-200/80 dark:border-zinc-800/80 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-black text-zinc-500 dark:text-zinc-400 uppercase tracking-wider flex items-center gap-1.5">
              <IconClock className="w-3.5 h-3.5" /> Recent Searches
            </span>
            <button
              onClick={clearAllHistory}
              className="text-[11px] font-bold text-red-500 hover:underline flex items-center gap-1"
            >
              <IconTrash className="w-3 h-3" />
              <span>Hapus Semua</span>
            </button>
          </div>

          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pt-1">
            {searchHistory.map((item) => (
              <div
                key={`chip-${item}`}
                className="group flex-shrink-0 flex items-center gap-2 px-3 py-1.5 rounded-xl bg-zinc-100 dark:bg-zinc-800 border border-zinc-200/60 dark:border-zinc-700/60 text-xs font-semibold text-zinc-800 dark:text-zinc-200 hover:border-zinc-400 cursor-pointer transition-all"
                onClick={() => handleSelectHistory(item)}
              >
                <span>{item}</span>
                <button
                  type="button"
                  onClick={(e) => removeHistoryItem(item, e)}
                  className="p-0.5 rounded-full hover:bg-zinc-300 dark:hover:bg-zinc-600 text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-100 transition-colors"
                  aria-label={`Hapus ${item}`}
                >
                  <IconX className="w-3 h-3" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Results Header Row */}
      <div className="flex items-center justify-between border-b border-zinc-200/80 dark:border-zinc-800 pb-2">
        <h2 className="text-sm font-extrabold text-zinc-900 dark:text-zinc-100 tracking-tight uppercase">
          {headerTitle}
        </h2>
        <span className="text-xs font-semibold text-zinc-500 dark:text-zinc-400">
          {loading && results.length === 0 ? "..." : `${results.length} komik`}
        </span>
      </div>

      {/* Results Grid — 3 Columns */}
      {loading && results.length === 0 ? (
        <div className="grid grid-cols-3 gap-3 sm:gap-5 lg:grid-cols-4 animate-pulse">
          {Array.from({ length: 12 }).map((_, i) => (
            <div key={i} className="aspect-[3/4] bg-zinc-200 dark:bg-zinc-800 rounded-2xl" />
          ))}
        </div>
      ) : results.length > 0 ? (
        <div className="space-y-6">
          <div className="grid grid-cols-3 gap-3 sm:gap-5 lg:grid-cols-4">
            {results.map((item) => (
              <ContentCard key={item.id} item={item} variant="grid" />
            ))}
          </div>

          {/* Load More Button */}
          {hasMore && (
            <div className="text-center pt-4">
              <button
                onClick={handleLoadMore}
                disabled={loadingMore}
                className="px-8 py-3 rounded-full bg-zinc-900 hover:bg-black dark:bg-white dark:hover:bg-zinc-200 text-white dark:text-zinc-900 text-xs font-bold shadow-md transition-all active:scale-95 disabled:opacity-50"
              >
                {loadingMore ? (
                  <span className="flex items-center gap-2">
                    <span className="w-4 h-4 border-2 border-white/30 dark:border-zinc-900/30 border-t-white dark:border-t-zinc-900 rounded-full animate-spin" />
                    Memuat...
                  </span>
                ) : (
                  "Tampilkan Lebih Banyak Komik (+48)"
                )}
              </button>
            </div>
          )}
        </div>
      ) : (
        <div className="text-center py-16 bg-white dark:bg-zinc-900 rounded-3xl border border-zinc-200 dark:border-zinc-800 p-6 shadow-sm">
          <p className="text-3xl mb-2">🔍</p>
          <p className="text-sm font-bold text-zinc-800 dark:text-zinc-200">Tidak ada komik ditemukan</p>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1 max-w-xs mx-auto">
            Coba cari dengan kata kunci lain.
          </p>
        </div>
      )}
    </div>
  );
}
