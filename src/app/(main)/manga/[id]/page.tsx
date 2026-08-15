"use client";

import React, { useState, useEffect, use } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  IconStar,
  IconPlay,
  IconBookmark,
  IconChevronLeft,
  IconBookOpen,
} from "@/components/ui/Icons";
import ContentCard from "@/components/content/ContentCard";
import { MangaDetail, ChapterItem, MangaListItem } from "@/lib/sources/mangadex";
import { useBookmark } from "@/hooks/useBookmark";
import { useReadingHistory } from "@/hooks/useReadingHistory";

export default function MangaDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const { isBookmarked, toggleBookmark } = useBookmark();
  const { history } = useReadingHistory();

  const [detail, setDetail] = useState<MangaDetail | null>(null);
  const [chapters, setChapters] = useState<ChapterItem[]>([]);
  const [similarManga, setSimilarManga] = useState<MangaListItem[]>([]);
  const [activeTab, setActiveTab] = useState<"detail" | "chapters" | "reviews">("detail");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    try {
      const cachedDetail = sessionStorage.getItem(`cache_manga_detail_${id}`);
      if (cachedDetail) {
        setDetail(JSON.parse(cachedDetail));
        setLoading(false);
      }
      const cachedChapters = sessionStorage.getItem(`cache_manga_chapters_${id}`);
      if (cachedChapters) {
        setChapters(JSON.parse(cachedChapters));
      }
    } catch (e) {}

    async function fetchData() {
      try {
        const res = await fetch(`/api/mangadex/manga/${id}`);
        if (res.ok) {
          const data = await res.json();
          setDetail(data.detail);
          setChapters(data.chapters || []);
          try {
            sessionStorage.setItem(`cache_manga_detail_${id}`, JSON.stringify(data.detail));
            sessionStorage.setItem(`cache_manga_chapters_${id}`, JSON.stringify(data.chapters || []));
          } catch (e) {}
        }

        const catalogRes = await fetch(`/api/mangadex/catalog?limit=8`);
        if (catalogRes.ok) {
          const catalogData = await catalogRes.json();
          setSimilarManga(catalogData.items || []);
        }
      } catch (err) {
        console.error("Failed to fetch detail", err);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [id]);

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse p-4">
        <div className="w-full h-72 bg-zinc-200 rounded-3xl" />
        <div className="h-8 w-1/2 bg-zinc-200 rounded-lg" />
        <div className="h-24 w-full bg-zinc-200 rounded-xl" />
      </div>
    );
  }

  if (!detail) {
    return (
      <div className="text-center py-20">
        <h2 className="text-base font-bold text-zinc-700">Manga not found</h2>
        <button
          onClick={() => router.back()}
          className="mt-4 px-5 py-2.5 rounded-full bg-zinc-900 text-white text-xs font-bold"
        >
          Go Back
        </button>
      </div>
    );
  }

  const bookmarked = isBookmarked(detail.id);
  const firstChapter = chapters[0];

  const historyItem = history.find((h) => h.contentId === detail.id);

  return (
    <div className="space-y-6 pb-20 text-zinc-900 dark:text-zinc-100">
      {/* Back Button */}
      <button
        onClick={() => router.push("/")}
        className="flex items-center gap-2 text-xs font-bold text-zinc-700 dark:text-zinc-300 hover:text-black dark:hover:text-white transition-colors bg-white dark:bg-zinc-900 px-4 py-2 rounded-full border border-zinc-200 dark:border-zinc-800 shadow-sm w-fit cursor-pointer"
      >
        <IconChevronLeft className="w-4 h-4" />
        <span>Home</span>
      </button>

      {/* Hero Cover Banner */}
      <div className="relative w-full h-[280px] sm:h-[360px] rounded-3xl overflow-hidden border border-zinc-200 dark:border-zinc-800 shadow-lg bg-zinc-900">
        <Image
          src={detail.coverUrl}
          alt={detail.title}
          fill
          priority
          sizes="(max-width: 768px) 100vw, 1200px"
          className="object-cover filter blur-md brightness-[0.7] scale-110"
          referrerPolicy="no-referrer"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent" />

        <div className="absolute bottom-0 left-0 right-0 p-5 sm:p-8 flex items-end gap-5">
          <div className="relative w-24 h-36 sm:w-32 sm:h-48 rounded-2xl overflow-hidden shadow-2xl border-2 border-white/20 flex-shrink-0 bg-zinc-800">
            <Image
              src={detail.coverUrl}
              alt={detail.title}
              fill
              sizes="(max-width: 640px) 96px, 128px"
              className="object-cover"
              referrerPolicy="no-referrer"
            />
          </div>

          <div className="flex-1 min-w-0 pb-1">
            <div className="flex items-center gap-2 mb-1.5">
              <div className="flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-white/90 backdrop-blur-md text-amber-500 text-xs font-bold shadow-sm">
                <IconStar className="w-3.5 h-3.5 fill-current text-amber-500" />
                <span>9.5</span>
              </div>
              <span className="capitalize px-2.5 py-0.5 rounded-full bg-white/20 backdrop-blur-md border border-white/30 text-[11px] font-extrabold text-white uppercase tracking-wider">
                {detail.contentType}
              </span>
            </div>

            <h1 className="text-xl sm:text-3xl font-black text-white line-clamp-2 drop-shadow-md">
              {detail.title}
            </h1>

            <p className="text-xs sm:text-sm text-zinc-200 font-semibold mt-1">
              {detail.authors.join(", ") || "Unknown Author"}
            </p>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex items-center gap-3">
        {historyItem ? (
          <Link
            href={`/chapter/${historyItem.lastChapterId}?mangaId=${detail.id}&title=${encodeURIComponent(detail.title)}&cover=${encodeURIComponent(detail.coverUrl)}&ch=${encodeURIComponent(historyItem.lastChapterRead)}&page=${historyItem.currentPage || 1}&autoScroll=true`}
            className="flex-1 flex items-center justify-center gap-2.5 py-3.5 rounded-full bg-zinc-900 hover:bg-black dark:bg-white dark:hover:bg-zinc-100 text-white dark:text-zinc-900 font-bold text-sm shadow-md transition-all hover:scale-[1.01] active:scale-95"
          >
            <IconPlay className="w-4 h-4 fill-current text-white dark:text-zinc-900" />
            <span>Lanjut Baca ({historyItem.lastChapterRead || "Chapter"})</span>
          </Link>
        ) : firstChapter ? (
          <Link
            href={`/chapter/${firstChapter.id}?mangaId=${detail.id}&title=${encodeURIComponent(detail.title)}&cover=${encodeURIComponent(detail.coverUrl)}&ch=${encodeURIComponent(firstChapter.chapter || "1")}&page=1&autoScroll=true`}
            className="flex-1 flex items-center justify-center gap-2.5 py-3.5 rounded-full bg-zinc-900 hover:bg-black dark:bg-white dark:hover:bg-zinc-100 text-white dark:text-zinc-900 font-bold text-sm shadow-md transition-all hover:scale-[1.01] active:scale-95"
          >
            <IconPlay className="w-4 h-4 fill-current text-white dark:text-zinc-900" />
            <span>Read Now</span>
          </Link>
        ) : (
          <button
            disabled
            className="flex-1 py-3.5 rounded-full bg-zinc-200 dark:bg-zinc-800 text-zinc-400 font-bold text-sm cursor-not-allowed"
          >
            No Chapters Available
          </button>
        )}

        <button
          onClick={() =>
            toggleBookmark({
              contentId: detail.id,
              type: detail.contentType,
              title: detail.title,
              cover: detail.coverUrl,
            })
          }
          className={`p-3.5 rounded-full border transition-all duration-300 ${
            bookmarked
              ? "bg-zinc-900 text-white border-zinc-900 shadow-md dark:bg-white dark:text-zinc-900 dark:border-white"
              : "bg-white dark:bg-zinc-900 text-zinc-700 dark:text-zinc-300 border-zinc-200 dark:border-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-800"
          }`}
          aria-label="Bookmark"
        >
          <IconBookmark className={`w-5 h-5 ${bookmarked ? "fill-current" : ""}`} />
        </button>
      </div>

      {/* Navigation Tabs */}
      <div className="flex items-center border-b border-zinc-200 dark:border-zinc-800 pb-1">
        {(["detail", "chapters", "reviews"] as const).map((tab) => {
          const isActive = activeTab === tab;
          return (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-5 py-2.5 text-xs sm:text-sm font-bold capitalize transition-all relative ${
                isActive
                  ? "text-zinc-900 dark:text-zinc-100"
                  : "text-zinc-500 dark:text-zinc-400 hover:text-zinc-800 dark:hover:text-zinc-200"
              }`}
            >
              {tab === "detail" ? "Manga Detail" : tab}
              {isActive && (
                <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-zinc-900 dark:bg-zinc-100 rounded-full" />
              )}
            </button>
          );
        })}
      </div>

      {/* Tab Content */}
      {activeTab === "detail" && (
        <div className="space-y-6">
          {/* Description */}
          <div className="p-6 rounded-3xl bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800 shadow-sm">
            <h2 className="text-sm font-extrabold text-zinc-900 dark:text-zinc-100 mb-2">Synopsis</h2>
            <p className="text-xs sm:text-sm text-zinc-600 dark:text-zinc-300 leading-relaxed font-normal whitespace-pre-line">
              {detail.description || "No description available for this manga."}
            </p>
          </div>

          {/* Genres */}
          <div>
            <h3 className="text-xs font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider mb-2.5">
              Genres
            </h3>
            <div className="flex flex-wrap gap-2">
              {detail.genres.map((g) => (
                <span
                  key={g}
                  className="px-3.5 py-1.5 rounded-full bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-800 dark:text-zinc-200 text-xs font-semibold shadow-xs"
                >
                  {g}
                </span>
              ))}
            </div>
          </div>

          {/* Metadata Table */}
          <div className="p-6 rounded-3xl bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800 shadow-sm space-y-3">
            <h3 className="text-xs font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider">
              Information
            </h3>
            <div className="grid grid-cols-2 gap-4 text-xs">
              <div>
                <span className="text-zinc-400 dark:text-zinc-500 block font-medium">Author</span>
                <span className="text-zinc-900 dark:text-zinc-100 font-extrabold">
                  {detail.authors.join(", ") || "N/A"}
                </span>
              </div>
              <div>
                <span className="text-zinc-400 dark:text-zinc-500 block font-medium">Status</span>
                <span className="text-zinc-900 dark:text-zinc-100 font-extrabold capitalize">
                  {detail.status || "Unknown"}
                </span>
              </div>
              <div>
                <span className="text-zinc-400 dark:text-zinc-500 block font-medium">Release Year</span>
                <span className="text-zinc-900 dark:text-zinc-100 font-extrabold">
                  {detail.year || "N/A"}
                </span>
              </div>
              <div>
                <span className="text-zinc-400 dark:text-zinc-500 block font-medium">Content Type</span>
                <span className="text-zinc-900 dark:text-zinc-100 font-extrabold capitalize">
                  {detail.contentType}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === "chapters" && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-extrabold text-zinc-900 dark:text-zinc-100">
              Chapters ({chapters.length})
            </h2>
          </div>

          <div className="space-y-2 max-h-[480px] overflow-y-auto pr-1">
            {chapters.length === 0 ? (
              <p className="text-xs text-zinc-500 dark:text-zinc-400 py-6 text-center">
                No chapters found for this title.
              </p>
            ) : (
              chapters.map((chap) => (
                <Link
                  key={chap.id}
                  href={`/chapter/${chap.id}?mangaId=${detail.id}&title=${encodeURIComponent(detail.title)}&cover=${encodeURIComponent(detail.coverUrl)}&ch=${encodeURIComponent(chap.chapter || "1")}`}
                  className="flex items-center justify-between p-3.5 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800 hover:border-zinc-400 dark:hover:border-zinc-700 hover:bg-zinc-50 dark:hover:bg-zinc-800/60 transition-all group shadow-xs"
                >
                  <div className="flex items-center gap-3">
                    <IconBookOpen className="w-4 h-4 text-zinc-700 dark:text-zinc-300 group-hover:scale-110 transition-transform" />
                    <div>
                      <span className="text-xs font-bold text-zinc-900 dark:text-zinc-100 group-hover:text-black dark:group-hover:text-white transition-colors">
                        Chapter {chap.chapter || "N/A"}
                      </span>
                      {chap.title && (
                        <span className="text-xs text-zinc-500 dark:text-zinc-400 ml-2 font-normal">
                          - {chap.title}
                        </span>
                      )}
                    </div>
                  </div>
                  <span className="text-[11px] font-medium text-zinc-400 dark:text-zinc-500">
                    {chap.publishAt ? new Date(chap.publishAt).toLocaleDateString() : ""}
                  </span>
                </Link>
              ))
            )}
          </div>
        </div>
      )}

      {activeTab === "reviews" && (
        <div className="p-6 rounded-3xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-center">
          <p className="text-xs font-semibold text-zinc-500 dark:text-zinc-400">
            Reviews system coming soon. ⭐ 9.5 overall rating based on MangaDex community.
          </p>
        </div>
      )}

      {/* Similar Manga Section */}
      {similarManga.length > 0 && (
        <section className="space-y-3 pt-4 border-t border-zinc-200 dark:border-zinc-800">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-extrabold text-zinc-900 dark:text-zinc-100 uppercase tracking-tight">
              Similar Series
            </h2>
            <span className="text-xs font-semibold text-zinc-500 dark:text-zinc-400">
              {similarManga.length} Titles
            </span>
          </div>

          <div className="flex items-center gap-4 overflow-x-auto no-scrollbar pb-3 pt-1">
            {similarManga.map((item) => (
              <ContentCard
                key={`similar-${item.id}`}
                item={item}
                variant="horizontal"
                showChapter={false}
              />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
