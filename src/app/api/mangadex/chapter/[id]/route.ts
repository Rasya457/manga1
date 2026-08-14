// src/app/api/mangadex/chapter/[id]/route.ts

import { NextRequest, NextResponse } from "next/server";
import { getChapterPages, getChapterMetadata } from "@/lib/sources/mangadex";
import { memoryCache } from "@/lib/cache";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const cacheKey = `chapter:${id}`;

  // Chapter pages rarely change — cache for 30 min
  const cached = memoryCache.get<object>(cacheKey);
  if (cached) {
    return NextResponse.json(cached, {
      headers: {
        "Cache-Control": "public, s-maxage=1800, stale-while-revalidate=300",
        "X-Cache": "HIT",
      },
    });
  }

  try {
    const [pages, meta] = await Promise.all([
      getChapterPages(id),
      getChapterMetadata(id),
    ]);

    const result = { pages, meta };
    memoryCache.set(cacheKey, result, 30 * 60 * 1000); // 30 min

    return NextResponse.json(result, {
      headers: {
        "Cache-Control": "public, s-maxage=1800, stale-while-revalidate=300",
        "X-Cache": "MISS",
      },
    });
  } catch (err) {
    console.error(`[api/mangadex/chapter/${id}]`, err);
    return NextResponse.json(
      { error: "Failed to fetch chapter pages" },
      { status: 502 }
    );
  }
}
