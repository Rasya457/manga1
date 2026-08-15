// src/app/api/mangadex/chapter/[id]/route.ts

import { NextRequest, NextResponse } from "next/server";
import { getChapterPages, getChapterMetadata } from "@/lib/sources/mangadex";
import { memoryCache } from "@/lib/cache";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const metaCacheKey = `chapter_meta:${id}`;

  try {
    // Metadata (title, chapter number, manga info) is safe to cache — it
    // doesn't carry the short-lived At-Home access token that page image
    // URLs do, so it's fine to reuse across requests for a while.
    let meta = memoryCache.get<object>(metaCacheKey);
    if (!meta) {
      meta = await getChapterMetadata(id);
      if (meta) memoryCache.set(metaCacheKey, meta, 30 * 60 * 1000); // 30 min
    }

    // Pages are never cached at this layer either — see getChapterPages,
    // which itself calls MangaDex with cache: "no-store" for the same reason.
    const pages = await getChapterPages(id);

    return NextResponse.json(
      { pages, meta },
      {
        headers: {
          // s-maxage=0 so any CDN/edge cache in front of this route doesn't
          // hand out stale, token-expired image URLs either.
          "Cache-Control": "private, no-store",
        },
      }
    );
  } catch (err) {
    console.error(`[api/mangadex/chapter/${id}]`, err);
    return NextResponse.json(
      { error: "Failed to fetch chapter pages" },
      { status: 502 }
    );
  }
}
