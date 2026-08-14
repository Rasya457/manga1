"use client";

import Link from "next/link";
import Image from "next/image";
import { IconClock, IconPlay } from "@/components/ui/Icons";
import { useReadingHistory } from "@/hooks/useReadingHistory";

export default function HistoryPage() {
  const { history } = useReadingHistory();

  return (
    <div className="space-y-6 pt-2">
      <div className="flex items-center gap-2">
        <IconClock className="w-6 h-6 text-zinc-900" />
        <h1 className="text-2xl sm:text-3xl font-black text-zinc-900 tracking-tight">Reading History</h1>
      </div>

      {history.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-3xl border border-zinc-200 p-6 shadow-sm">
          <p className="text-sm font-bold text-zinc-800">No reading history yet</p>
          <p className="text-xs text-zinc-500 mt-1 max-w-xs mx-auto">
            Your reading history will automatically appear here as you read chapters.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {history.map((item) => (
            <div
              key={item.contentId}
              className="flex items-center justify-between p-3.5 rounded-2xl bg-white border border-zinc-200/80 shadow-xs hover:border-zinc-300 transition-all"
            >
              <div className="flex items-center gap-4">
                <div className="relative w-14 h-20 rounded-xl overflow-hidden bg-zinc-100 border border-zinc-200 flex-shrink-0">
                  <Image
                    src={item.cover}
                    alt={item.title}
                    fill
                    className="object-cover"
                    unoptimized
                  />
                </div>
                <div>
                  <h3 className="text-sm font-extrabold text-zinc-900 line-clamp-1">{item.title}</h3>
                  <p className="text-xs font-semibold text-zinc-600 mt-0.5">
                    {item.lastChapterRead}
                  </p>
                  <p className="text-[11px] font-medium text-zinc-400 mt-1">
                    {item.lastReadAt ? new Date(item.lastReadAt).toLocaleDateString() : ""}
                  </p>
                </div>
              </div>

              <Link
                href={`/chapter/${item.lastChapterId}?mangaId=${item.contentId}&page=${item.currentPage || 1}`}
                className="flex items-center gap-2 px-4 py-2 rounded-full bg-zinc-900 hover:bg-black text-white text-xs font-bold shadow-sm transition-all"
              >
                <IconPlay className="w-3.5 h-3.5 fill-current" />
                <span>Continue</span>
              </Link>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
