"use client";

import Link from "next/link";
import Image from "next/image";
import { IconBookmark } from "@/components/ui/Icons";
import { useBookmark } from "@/hooks/useBookmark";

export default function BookmarkPage() {
  const { bookmarks, removeBookmark } = useBookmark();

  return (
    <div className="space-y-6 pt-2">
      <div className="flex items-center gap-2">
        <IconBookmark className="w-6 h-6 text-zinc-900" />
        <h1 className="text-2xl sm:text-3xl font-black text-zinc-900 tracking-tight">Bookmarks</h1>
      </div>

      {bookmarks.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-3xl border border-zinc-200 p-6 shadow-sm">
          <p className="text-sm font-bold text-zinc-800">Your bookmark list is empty</p>
          <p className="text-xs text-zinc-500 mt-1 max-w-xs mx-auto">
            Bookmark your favorite manga to easily access them anytime.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4 sm:gap-6">
          {bookmarks.map((item) => (
            <div key={item.contentId} className="group relative flex flex-col">
              <Link
                href={`/manga/${item.contentId}`}
                className="relative aspect-[3/4] w-full overflow-hidden rounded-2xl bg-zinc-100 border border-zinc-200 shadow-sm group-hover:border-zinc-400 transition-all"
              >
                <Image
                  src={item.cover}
                  alt={item.title}
                  fill
                  className="object-cover group-hover:scale-105 transition-transform duration-300"
                  unoptimized
                />
              </Link>

              <div className="mt-2.5 flex items-center justify-between">
                <Link
                  href={`/manga/${item.contentId}`}
                  className="text-xs font-bold text-zinc-900 line-clamp-1 group-hover:text-black"
                >
                  {item.title}
                </Link>

                <button
                  onClick={() => removeBookmark(item.contentId)}
                  className="text-[11px] text-red-600 hover:text-red-700 font-semibold px-2 py-0.5 rounded-full bg-red-50 hover:bg-red-100 transition-colors"
                >
                  Remove
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
