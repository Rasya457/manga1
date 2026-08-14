import { NextRequest, NextResponse } from "next/server";
import { getMangaList, ContentType } from "@/lib/sources/mangadex";
import { memoryCache } from "@/lib/cache";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);

  const page = Number(searchParams.get("page") ?? "1");
  const limit = Number(searchParams.get("limit") ?? "20");
  const contentType = searchParams.get("type") as ContentType | null;
  const genre = searchParams.get("genre") ?? undefined;
  const status = searchParams.get("status") ?? undefined;
  const search = searchParams.get("search") ?? undefined;

  const cacheKey = `catalog:${page}:${limit}:${contentType ?? ""}:${genre ?? ""}:${status ?? ""}:${search ?? ""}`;

  // Serve from server-side memory cache if fresh (5 min TTL)
  const cached = memoryCache.get<object>(cacheKey);
  if (cached) {
    return NextResponse.json(cached, {
      headers: {
        "Cache-Control": "public, s-maxage=300, stale-while-revalidate=60",
        "X-Cache": "HIT",
      },
    });
  }

  try {
    const result = await getMangaList({
      page,
      limit,
      contentType: contentType ?? undefined,
      genre,
      status,
      search,
    });

    memoryCache.set(cacheKey, result, 5 * 60 * 1000); // 5 min

    return NextResponse.json(result, {
      headers: {
        "Cache-Control": "public, s-maxage=300, stale-while-revalidate=60",
        "X-Cache": "MISS",
      },
    });
  } catch (err) {
    console.error("[api/mangadex/catalog]", err);
    return NextResponse.json(
      { error: "Failed to fetch catalog" },
      { status: 502 }
    );
  }
}
