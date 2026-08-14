// src/app/api/mangadex/manga/[id]/route.ts

import { NextRequest, NextResponse } from "next/server";
import { getMangaById, getChapterList } from "@/lib/sources/mangadex";
import { memoryCache } from "@/lib/cache";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const cacheKey = `manga:${id}`;

  // Serve from server-side memory cache if fresh (10 min TTL — manga details rarely change)
  const cached = memoryCache.get<object>(cacheKey);
  if (cached) {
    return NextResponse.json(cached, {
      headers: {
        "Cache-Control": "public, s-maxage=600, stale-while-revalidate=120",
        "X-Cache": "HIT",
      },
    });
  }

  try {
    const [detail, chapters] = await Promise.all([
      getMangaById(id),
      getChapterList(id),
    ]);

    const result = { detail, chapters };
    memoryCache.set(cacheKey, result, 10 * 60 * 1000); // 10 min

    return NextResponse.json(result, {
      headers: {
        "Cache-Control": "public, s-maxage=600, stale-while-revalidate=120",
        "X-Cache": "MISS",
      },
    });
  } catch (err) {
    console.error(`[api/mangadex/manga/${id}]`, err);
    return NextResponse.json(
      { error: "Failed to fetch manga detail" },
      { status: 502 }
    );
  }
}