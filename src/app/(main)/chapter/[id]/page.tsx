"use client";

import React, { useState, useEffect, useCallback, use, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import InfiniteChapterReader from "@/components/reader/InfiniteChapterReader";
import { ChapterItem } from "@/lib/sources/mangadex";

function ChapterReaderContent({ id }: { id: string }) {
  const searchParams = useSearchParams();

  const queryMangaId = searchParams.get("mangaId") || "";
  const queryTitle = searchParams.get("title") || "";
  const queryCover = searchParams.get("cover") || "";
  const queryPage = searchParams.get("page") || "1";
  const initialPageNum = parseInt(queryPage, 10) || 1;

  const [mangaId, setMangaId] = useState<string>(queryMangaId);
  const [mangaTitle, setMangaTitle] = useState<string>(queryTitle);
  const [mangaCover, setMangaCover] = useState<string>(queryCover);
  const [chapterList, setChapterList] = useState<ChapterItem[]>([]);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let isMounted = true;

    async function resolveMetadata() {
      let activeMangaId = queryMangaId;
      let activeTitle = queryTitle;
      let activeCover = queryCover;

      if (!activeMangaId) {
        try {
          const res = await fetch(`/api/mangadex/chapter/${id}`);
          if (res.ok) {
            const data = await res.json();
            if (data.mangaId) {
              activeMangaId = data.mangaId;
              if (isMounted) setMangaId(data.mangaId);
            }
          }
        } catch (e) {
          console.error("Failed to resolve mangaId from chapter API", e);
        }
      }

      if (activeMangaId) {
        try {
          const res = await fetch(`/api/mangadex/manga/${activeMangaId}`);
          if (res.ok) {
            const data = await res.json();
            if (isMounted) {
              if (data.chapters) setChapterList(data.chapters);
              if (data.detail) {
                if (!activeTitle && data.detail.title) setMangaTitle(data.detail.title);
                if (!activeCover && data.detail.coverUrl) setMangaCover(data.detail.coverUrl);
              }
            }
          }
        } catch (e) {
          console.error("Failed to fetch manga chapters", e);
        }
      }

      if (isMounted) setReady(true);
    }

    resolveMetadata();

    return () => {
      isMounted = false;
    };
  }, [id, queryMangaId, queryTitle, queryCover]);

  if (!ready) {
    return (
      <div className="fixed inset-0 bg-black flex flex-col items-center justify-center text-zinc-500 font-sans">
        <div className="w-8 h-8 border-3 border-zinc-700 border-t-white rounded-full animate-spin mb-3" />
        <p className="text-xs font-semibold text-zinc-400">Loading reader...</p>
      </div>
    );
  }

  return (
    <InfiniteChapterReader
      initialChapterId={id}
      mangaId={mangaId}
      mangaTitle={mangaTitle || "Manga"}
      mangaCover={mangaCover}
      chapterList={chapterList}
      initialPage={initialPageNum}
    />
  );
}

export default function MangaReaderPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);

  return (
    <Suspense fallback={
      <div className="fixed inset-0 bg-black flex flex-col items-center justify-center text-zinc-500 font-sans">
        <div className="w-8 h-8 border-3 border-zinc-700 border-t-white rounded-full animate-spin mb-3" />
        <p className="text-xs font-semibold text-zinc-400">Loading reader...</p>
      </div>
    }>
      <ChapterReaderContent id={id} />
    </Suspense>
  );
}