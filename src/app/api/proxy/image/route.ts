// src/app/api/proxy/image/route.ts
import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const url = req.nextUrl.searchParams.get("url");

  if (!url) {
    return new NextResponse("Missing url parameter", { status: 400 });
  }

  // Security check: Only allow proxying MangaDex image domains and Unsplash
  try {
    const parsedUrl = new URL(url);
    const hostname = parsedUrl.hostname;
    const isAllowedHost =
      hostname.endsWith("mangadex.org") ||
      hostname.endsWith("mangadex.network") ||
      hostname.endsWith("unsplash.com");

    if (!isAllowedHost) {
      return new NextResponse("Forbidden domain", { status: 403 });
    }

    const upstreamRes = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "Referer": "https://mangadex.org/",
        "Accept": "image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8",
      },
    });

    if (!upstreamRes.ok) {
      console.warn(`[ImageProxy] Upstream returned status ${upstreamRes.status} for ${url}`);
      return new NextResponse("Failed to fetch upstream image", { status: upstreamRes.status });
    }

    const contentType = upstreamRes.headers.get("content-type") || "image/jpeg";
    const imageBuffer = await upstreamRes.arrayBuffer();

    return new NextResponse(imageBuffer, {
      status: 200,
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "public, max-age=604800, s-maxage=2592000, immutable",
        "Access-Control-Allow-Origin": "*",
      },
    });
  } catch (err: any) {
    console.error("[ImageProxy Error]", err);
    return new NextResponse("Proxy internal error", { status: 500 });
  }
}
