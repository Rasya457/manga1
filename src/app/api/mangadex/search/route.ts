// src/app/api/mangadex/search/route.ts

import { NextRequest, NextResponse } from "next/server";
import { getMangaList, ContentType } from "@/lib/sources/mangadex";
import { memoryCache } from "@/lib/cache";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const search = searchParams.get("q");
  const contentType = searchParams.get("type") as ContentType | null;
  const limit = Number(searchParams.get("limit") ?? "24");

  if (!search || search.trim().length < 2) {
    return NextResponse.json(
      { error: "Query must be at least 2 characters" },
      { status: 400 }
    );
  }

  const cacheKey = `search:${search.trim().toLowerCase()}:${contentType ?? ""}:${limit}`;

  // Cache search results for 3 minutes to avoid hammering the API on repeated searches
  const cached = memoryCache.get<object>(cacheKey);
  if (cached) {
    return NextResponse.json(cached, {
      headers: {
        "Cache-Control": "public, s-maxage=180, stale-while-revalidate=60",
        "X-Cache": "HIT",
      },
    });
  }

  try {
    const result = await getMangaList({
      search,
      limit,
      contentType: contentType ?? undefined,
    });

    memoryCache.set(cacheKey, result, 3 * 60 * 1000); // 3 min

    return NextResponse.json(result, {
      headers: {
        "Cache-Control": "public, s-maxage=180, stale-while-revalidate=60",
        "X-Cache": "MISS",
      },
    });
  } catch (err) {
    console.error("[api/mangadex/search]", err);
    return NextResponse.json(
      { error: "Search failed" },
      { status: 502 }
    );
  }
}