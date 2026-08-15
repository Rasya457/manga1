"use client";

import Link from "next/link";
import Image from "next/image";
import { IconStar } from "@/components/ui/Icons";
import { MangaListItem } from "@/lib/sources/mangadex";

interface ContentCardProps {
  item: MangaListItem;
  rating?: number | string;
  showChapter?: boolean;
  variant?: "horizontal" | "grid";
  priority?: boolean; // Set true only for the first few visible cards (e.g. hero row)
}

export default function ContentCard({
  item,
  rating = 9.5,
  showChapter = true,
  variant = "grid",
  priority = false,
}: ContentCardProps) {
  const containerWidthClass =
    variant === "horizontal"
      ? "w-36 sm:w-44 md:w-48 flex-shrink-0"
      : "w-full";

  return (
    <Link
      href={`/manga/${item.id}`}
      className={`group flex flex-col transition-transform duration-300 hover:scale-[1.02] select-none ${containerWidthClass}`}
      prefetch={false}
    >
      <div className="relative aspect-[3/4] w-full overflow-hidden rounded-2xl bg-zinc-200 dark:bg-zinc-800 border border-zinc-200/80 dark:border-zinc-800 shadow-sm group-hover:border-zinc-400 dark:group-hover:border-zinc-600 group-hover:shadow-md transition-all">
        <Image
          src={item.coverUrl}
          alt={item.title}
          fill
          sizes="(max-width: 640px) 144px, (max-width: 768px) 176px, 192px"
          className="object-cover transition-transform duration-500 group-hover:scale-105"
          referrerPolicy="no-referrer"
          loading={priority ? "eager" : "lazy"}
          priority={priority}
        />

        {/* Subtle Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent opacity-80 group-hover:opacity-40 transition-opacity" />

        {/* Rating Badge */}
        <div className="absolute top-2.5 right-2.5 flex items-center gap-1 px-2.5 py-1 rounded-full bg-white/90 dark:bg-zinc-900/90 backdrop-blur-md border border-zinc-200 dark:border-zinc-700 text-amber-500 dark:text-amber-400 text-xs font-bold shadow-sm">
          <IconStar className="w-3.5 h-3.5 fill-current text-amber-500 dark:text-amber-400" />
          <span>{rating}</span>
        </div>

        {/* Content Type Badge */}
        <div className="absolute bottom-2.5 left-2.5">
          <span className="capitalize px-2.5 py-0.5 rounded-full bg-zinc-900/90 dark:bg-white/90 backdrop-blur-md text-[10px] font-extrabold text-white dark:text-zinc-900 uppercase tracking-wider">
            {item.contentType}
          </span>
        </div>
      </div>

      <div className="mt-2.5 flex flex-col gap-0.5">
        <h3 className="text-xs sm:text-sm font-extrabold text-zinc-900 dark:text-zinc-100 line-clamp-1 group-hover:text-black dark:group-hover:text-white transition-colors">
          {item.title}
        </h3>
        <p className="text-[11px] font-medium text-zinc-500 dark:text-zinc-400 line-clamp-1">
          {showChapter && item.lastChapter ? `Ch. ${item.lastChapter}` : item.genres[0] || "Manga"}
        </p>
      </div>
    </Link>
  );
}
