// src/components/reader/ChapterDrawer.tsx

"use client";

import { useRef, useEffect } from "react";
import { IconChevronLeft } from "@/components/ui/Icons";

interface ChapterListItem {
  id: string;
  chapter: string | null;
  title: string | null;
}

interface ChapterDrawerProps {
  chapterId: string;
  mangaId: string;
  open: boolean;
  onClose: () => void;
  onSelectChapter?: (chapterId: string) => void;
  /** Pre-loaded chapter list from the parent reader — avoids a redundant API call */
  chapterList?: ChapterListItem[];
}

export default function ChapterDrawer({
  chapterId,
  mangaId,
  open,
  onClose,
  onSelectChapter,
  chapterList = [],
}: ChapterDrawerProps) {
  // Scroll the active chapter into view when the drawer opens
  const activeRef = useRef<HTMLButtonElement | null>(null);

  useEffect(() => {
    if (open && activeRef.current) {
      // Small delay so the drawer has finished its CSS transition before scrolling
      const timer = setTimeout(() => {
        activeRef.current?.scrollIntoView({ block: "center", behavior: "smooth" });
      }, 150);
      return () => clearTimeout(timer);
    }
  }, [open, chapterId]);

  if (!open) return null;

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-[100] flex justify-end bg-black/70 backdrop-blur-sm animate-fadeIn"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="h-full w-80 max-w-[85vw] overflow-y-auto bg-zinc-950/95 border-l border-zinc-800 text-white p-5 shadow-2xl flex flex-col gap-5"
      >
        {/* Drawer Header */}
        <div className="pb-3 border-b border-zinc-800 flex items-center justify-between flex-shrink-0">
          <div>
            <h3 className="font-extrabold text-sm text-zinc-100 uppercase tracking-wider">
              Pilih Chapter
            </h3>
            <p className="text-[11px] text-zinc-400 font-medium">
              {chapterList.length} chapter tersedia
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-white/10 text-zinc-400 hover:text-white transition-colors"
            aria-label="Close"
          >
            ✕
          </button>
        </div>

        {chapterList.length === 0 ? (
          <div className="py-12 text-center text-xs text-zinc-500">
            Tidak ada chapter ditemukan.
          </div>
        ) : (
          /* Chapter List */
          <ul className="space-y-1.5 flex-1 overflow-y-auto no-scrollbar">
            {chapterList.map((ch) => {
              const isCurrent = ch.id === chapterId;
              return (
                <li key={ch.id}>
                  <button
                    ref={isCurrent ? activeRef : null}
                    className={`w-full flex items-center justify-between rounded-xl px-3.5 py-3 text-left text-xs font-bold transition-all ${
                      isCurrent
                        ? "bg-white text-zinc-950 shadow-md scale-[1.02]"
                        : "text-zinc-300 hover:text-white hover:bg-zinc-900 border border-transparent hover:border-zinc-800"
                    }`}
                    onClick={() => {
                      // Always use onSelectChapter — it handles the page load+scroll
                      if (onSelectChapter) {
                        onSelectChapter(ch.id);
                      }
                      onClose();
                    }}
                  >
                    <span>
                      Chapter {ch.chapter ?? "?"}{ch.title ? ` — ${ch.title}` : ""}
                    </span>
                    {isCurrent && (
                      <span className="text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-full bg-zinc-950 text-white font-extrabold flex-shrink-0 ml-2">
                        Aktif
                      </span>
                    )}
                  </button>
                </li>
              );
            })}
          </ul>
        )}

        {/* Drawer Footer */}
        <div className="pt-3 border-t border-zinc-800 flex-shrink-0">
          <button
            onClick={onClose}
            className="w-full py-2.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-xs font-bold text-zinc-300 transition-colors"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
}