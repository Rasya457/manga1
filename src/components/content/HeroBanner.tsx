"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { IconStar, IconPlay } from "@/components/ui/Icons";
import { MangaListItem } from "@/lib/sources/mangadex";

interface HeroBannerProps {
  items: MangaListItem[];
}

export default function HeroBanner({ items }: HeroBannerProps) {
  const [currentIndex, setCurrentIndex] = useState(0);

  // Take top 5 items for hero carousel
  const bannerItems = items.slice(0, 5);

  useEffect(() => {
    if (bannerItems.length <= 1) return;
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % bannerItems.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [bannerItems.length]);

  if (!bannerItems.length) return null;

  const current = bannerItems[currentIndex];

  return (
    <div className="relative w-full h-[360px] sm:h-[420px] md:h-[460px] rounded-3xl overflow-hidden shadow-xl border border-zinc-200 group bg-zinc-900">
      {/* Background Image Carousel */}
      {bannerItems.map((item, idx) => {
        // Only mount current or adjacent slide to conserve bandwidth
        const shouldRenderImage = idx === currentIndex || idx === 0 || idx === (currentIndex + 1) % bannerItems.length;
        if (!shouldRenderImage) return null;

        return (
          <div
            key={item.id}
            className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${
              idx === currentIndex ? "opacity-100 z-10" : "opacity-0 z-0"
            }`}
          >
            <Image
              src={item.coverUrl}
              alt={item.title}
              fill
              priority={idx === 0}
              fetchPriority={idx === 0 ? "high" : "auto"}
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 90vw, 1200px"
              className="object-cover object-top filter brightness-[0.85] scale-105 transition-transform duration-10000 group-hover:scale-110"
              referrerPolicy="no-referrer"
              placeholder="blur"
              blurDataURL="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAQAAAAFCAYAAABirU3bAAAACXBIWXMAAAsTAAALEwEAmpwYAAAAMElEQVQImWNgYGBg+P//PwMDAwMDIyMjAwMDAwMjIyMDAwMDAwMDAwMDAwMDAwMDAAkdBRsklno9AAAAAElFTkSuQmCC"
            />
            {/* Gradient Overlays for Readability */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent" />
            <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/30 to-transparent" />
          </div>
        );
      })}

      {/* Hero Content Overlay */}
      <div className="relative z-20 h-full flex flex-col justify-end p-6 sm:p-8 md:p-10 max-w-2xl text-white">
        <div className="flex flex-wrap items-center gap-2 mb-3">
          <div className="flex items-center gap-1 px-3 py-1 rounded-full bg-white/90 backdrop-blur-md text-amber-500 text-xs font-bold shadow-sm">
            <IconStar className="w-3.5 h-3.5 fill-current text-amber-500" />
            <span>9.5</span>
          </div>

          {(current.genres || []).slice(0, 3).map((genre) => (
            <span
              key={genre}
              className="px-3 py-1 rounded-full bg-white/20 backdrop-blur-md border border-white/30 text-white text-xs font-semibold"
            >
              {genre}
            </span>
          ))}
        </div>

        <h1 className="text-2xl sm:text-4xl font-extrabold text-white tracking-tight leading-tight line-clamp-2 drop-shadow-md mb-2">
          {current.title}
        </h1>

        <p className="text-xs sm:text-sm text-zinc-200 line-clamp-2 sm:line-clamp-3 mb-6 max-w-lg font-normal leading-relaxed">
          {current.description || "Discover thrilling adventures, unforgettable characters, and epic battles in this popular series."}
        </p>

        <div className="flex items-center gap-4">
          <Link
            href={`/manga/${current.id}`}
            className="flex items-center gap-2.5 px-6 py-3 rounded-full bg-white hover:bg-zinc-100 text-zinc-900 text-sm font-bold shadow-lg transition-all duration-200 hover:scale-105 active:scale-95"
          >
            <IconPlay className="w-4 h-4 fill-current text-zinc-900" />
            <span>Read Now</span>
          </Link>
        </div>
      </div>

      {/* Carousel Indicators */}
      <div className="absolute bottom-5 right-6 z-20 flex items-center gap-2 bg-black/40 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/20">
        {bannerItems.map((_, idx) => (
          <button
            key={idx}
            onClick={() => setCurrentIndex(idx)}
            className={`transition-all duration-300 rounded-full ${
              idx === currentIndex
                ? "w-6 h-2 bg-white shadow-sm"
                : "w-2 h-2 bg-white/40 hover:bg-white/70"
            }`}
            aria-label={`Go to slide ${idx + 1}`}
          />
        ))}
      </div>
    </div>
  );
}
