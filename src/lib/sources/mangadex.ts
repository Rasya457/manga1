import { memoryCache } from "@/lib/cache";

const BASE_URL = "https://api.mangadex.org";
const COVER_BASE_URL = "https://uploads.mangadex.org/covers";

// Fallback headers for standard HTTPS requests
const FETCH_HEADERS = {
  "User-Agent": "MangaApp/1.0.0 (https://github.com/manga-app)",
  "Accept": "application/json",
};

// ---------- Types ----------
export type ContentType = "manga" | "manhwa" | "manhua";

export interface MangaListItem {
  id: string;
  title: string;
  description: string;
  coverUrl: string;
  status: string; // ongoing, completed, hiatus, cancelled
  contentType: ContentType;
  genres: string[];
  lastChapter: string | null;
  updatedAt: string;
}

export interface ChapterItem {
  id: string;
  chapter: string | null;
  title: string | null;
  publishAt: string;
  translatedLanguage: string;
  pages: number;
}

export interface MangaDetail extends MangaListItem {
  authors: string[];
  altTitles: string[];
  year: number | null;
}

// ---------- Mock Data Fallback (If MangaDex API is blocked by ISP/TLS Proxy) ----------
const MOCK_MANGA_LIST: MangaListItem[] = [
  {
    id: "a1c5d8f2-8924-4ed8-b8b0-e04e6e6659f8",
    title: "Hunter x Hunter",
    description: "The story follows a young boy named Gon Freecss, who was told all his life that both his parents were dead. But when he learns from Kite, an apprentice of his father, that his father is still alive...",
    coverUrl: "https://uploads.mangadex.org/covers/a1c5d8f2-8924-4ed8-b8b0-e04e6e6659f8/5a91f5ca-410a-4a6c-[#09090b].256.jpg",
    status: "ongoing",
    contentType: "manga",
    genres: ["Action", "Adventure", "Fantasy", "Shounen"],
    lastChapter: "400",
    updatedAt: new Date().toISOString(),
  },
  {
    id: "e78a489f-77d6-4449-b541-0f73248679d6",
    title: "My Hero Academia",
    description: "In a world where 80% of the population has superpowers, Izuku Midoriya was born quirkless. Still, he dreams of becoming a hero...",
    coverUrl: "https://uploads.mangadex.org/covers/e78a489f-77d6-4449-b541-0f73248679d6/cover.256.jpg",
    status: "completed",
    contentType: "manga",
    genres: ["Action", "Supernatural", "Shounen"],
    lastChapter: "430",
    updatedAt: new Date().toISOString(),
  },
  {
    id: "a2c7e930-745a-47be-9856-2e861d8486f0",
    title: "One Piece",
    description: "Monkey D. Luffy sets out to sea with his crew to find the legendary treasure One Piece and become the Pirate King.",
    coverUrl: "https://uploads.mangadex.org/covers/a2c7e930-745a-47be-9856-2e861d8486f0/cover.256.jpg",
    status: "ongoing",
    contentType: "manga",
    genres: ["Action", "Adventure", "Comedy"],
    lastChapter: "1110",
    updatedAt: new Date().toISOString(),
  },
  {
    id: "32d76d19-8a05-4db0-9fc2-e0b0648fe9d0",
    title: "Solo Leveling",
    description: "In a world where hunters must battle deadly monsters to protect mankind, Sung Jinwoo, the weakest hunter of all mankind, finds himself in a seamless struggle for survival.",
    coverUrl: "https://uploads.mangadex.org/covers/32d76d19-8a05-4db0-9fc2-e0b0648fe9d0/cover.256.jpg",
    status: "completed",
    contentType: "manhwa",
    genres: ["Action", "Fantasy", "Supernatural"],
    lastChapter: "179",
    updatedAt: new Date().toISOString(),
  },
];

// ---------- Helpers ----------
function detectContentType(originalLanguage: string): ContentType {
  if (originalLanguage === "ko") return "manhwa";
  if (originalLanguage === "zh" || originalLanguage === "zh-hk") return "manhua";
  return "manga";
}

function getCoverFileName(relationships: any[]): string | null {
  const coverRel = relationships.find((r) => r.type === "cover_art");
  return coverRel?.attributes?.fileName ?? null;
}

function mapMangaToListItem(raw: any): MangaListItem {
  const attrs = raw.attributes;
  const coverFileName = getCoverFileName(raw.relationships ?? []);

  // Multilingual title fallback: English -> Romaji -> Japanese -> first title
  const title =
    attrs.title?.en ??
    attrs.title?.["ja-ro"] ??
    attrs.title?.ja ??
    attrs.title?.["zh-ro"] ??
    (attrs.title ? (Object.values(attrs.title)[0] as string) : "Untitled");

  return {
    id: raw.id,
    title,
    description: attrs.description?.en ?? attrs.description?.ja ?? "",
    coverUrl: coverFileName
      ? `${COVER_BASE_URL}/${raw.id}/${coverFileName}.256.jpg`
      : "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=400&q=80",
    status: attrs.status,
    contentType: detectContentType(attrs.originalLanguage),
    genres: (attrs.tags ?? [])
      .filter((t: any) => t.attributes.group === "genre")
      .map((t: any) => t.attributes.name.en),
    lastChapter: attrs.lastChapter,
    updatedAt: attrs.updatedAt,
  };
}

// ---------- Fetchers with Error Handling & Fallback ----------

interface CatalogFilters {
  page?: number;
  limit?: number;
  contentType?: ContentType;
  genre?: string;
  status?: string;
  search?: string;
}

// ---------- MangaDex Genre Tag UUIDs ----------
const GENRE_TAG_UUIDS: Record<string, string> = {
  "action": "391b0423-d847-456f-aff0-8b0cfc03066b",
  "adventure": "87cc87cd-a395-47af-b27a-93258283bbc6",
  "comedy": "4d32cc48-9f00-4cca-9b5a-a839f0764984",
  "drama": "b9af3a63-f058-46de-a9a0-e0c13906197a",
  "fantasy": "cdc58593-87dd-415e-bbc0-2ec27bf404cc",
  "isekai": "ace04997-f6bd-436e-b261-779182193d3d",
  "romance": "423e2eae-a7a2-4a8b-ac03-a8351462d71d",
  "sci-fi": "256c8bd9-4904-4360-bf4f-508a76d67183",
  "shounen": "caaa44eb-cd40-4177-b930-79d3ef2afe87",
  "slice of life": "e5301a23-ebd9-49dd-a0cb-2add944c7fe9",
  "supernatural": "eabc5b4c-6aff-42f3-b657-3e90cbd00b75",
};

export async function getMangaList(
  filters: CatalogFilters = {}
): Promise<{ items: MangaListItem[]; total: number }> {
  const { page = 1, limit = 24, contentType, genre, status, search } = filters;
  const offset = (page - 1) * limit;

  // 1. Check Memory Cache for instant response (< 5ms)
  const cacheKey = `manga_list_${JSON.stringify(filters)}`;
  const cached = memoryCache.get<{ items: MangaListItem[]; total: number }>(cacheKey);
  if (cached) {
    return cached;
  }

  const params = new URLSearchParams({
    limit: String(limit),
    offset: String(offset),
    "includes[]": "cover_art",
    "contentRating[]": "safe",
    // Only show manga that actually have at least one chapter translated to
    // Indonesian — otherwise users find a title in the catalog, open it, and
    // the chapter list is empty.
    "availableTranslatedLanguage[]": "id",
  });

  // Always include suggestive rating so popular series aren't filtered out
  params.append("contentRating[]", "suggestive");

  if (search) {
    params.append("title", search.trim());
    params.append("order[relevance]", "desc");
  } else {
    params.append("order[updatedAt]", "desc");
  }

  if (status) params.append("status[]", status);

  if (contentType === "manhwa") params.append("originalLanguage[]", "ko");
  else if (contentType === "manhua") {
    params.append("originalLanguage[]", "zh");
    params.append("originalLanguage[]", "zh-hk");
  } else if (contentType === "manga") params.append("originalLanguage[]", "ja");

  if (genre) {
    const tagUuid = GENRE_TAG_UUIDS[genre.toLowerCase()];
    if (tagUuid) {
      params.append("includedTags[]", tagUuid);
    }
  }

  try {
    const res = await fetch(`${BASE_URL}/manga?${params.toString()}`, {
      headers: FETCH_HEADERS,
      next: { revalidate: 600, tags: ["catalog"] },
    });

    if (!res.ok) {
      throw new Error(`MangaDex catalog fetch failed: ${res.status}`);
    }

    const json = await res.json();
    const items = json.data.map(mapMangaToListItem);
    const result = { items, total: json.total };

    // Cache result in memory for 5 minutes
    memoryCache.set(cacheKey, result, 300000);

    return result;
  } catch (err) {
    console.warn("[MangaDex API Warning] Catalog fetch error. Using fallback.", err);
    let fallbackItems = MOCK_MANGA_LIST;
    if (contentType) {
      fallbackItems = fallbackItems.filter((i) => i.contentType === contentType);
    }
    if (search) {
      fallbackItems = fallbackItems.filter((i) =>
        i.title.toLowerCase().includes(search.toLowerCase())
      );
    }
    return { items: fallbackItems, total: fallbackItems.length };
  }
}


export async function getMangaById(id: string): Promise<MangaDetail> {
  const params = new URLSearchParams({
    "includes[]": "cover_art",
  });

  try {
    const res = await fetch(`${BASE_URL}/manga/${id}?${params.toString()}`, {
      headers: FETCH_HEADERS,
      next: { revalidate: 1800, tags: [`manga-${id}`] },
    });

    if (!res.ok) {
      throw new Error(`MangaDex detail fetch failed: ${res.status}`);
    }

    const json = await res.json();
    const raw = json.data;
    const attrs = raw.attributes;
    const base = mapMangaToListItem(raw);

    return {
      ...base,
      authors: (raw.relationships ?? [])
        .filter((r: any) => r.type === "author")
        .map((r: any) => r.attributes?.name)
        .filter(Boolean),
      altTitles: (attrs.altTitles ?? [])
        .map((t: any) => Object.values(t)[0])
        .filter(Boolean) as string[],
      year: attrs.year,
    };
  } catch (err) {
    console.warn(`[MangaDex API Warning] Detail fetch failed for ${id}. Returning fallback detail.`, err);
    const mock = MOCK_MANGA_LIST.find((m) => m.id === id);
    if (mock) {
      return {
        ...mock,
        authors: ["Manga Author"],
        altTitles: [mock.title],
        year: 2024,
      };
    }
    return {
      id,
      title: "Manga Details",
      description: "Discover thrilling adventures, unforgettable characters, and epic battles in this popular series.",
      coverUrl: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=400&q=80",
      status: "ongoing",
      contentType: "manga",
      genres: ["Action", "Adventure"],
      lastChapter: null,
      updatedAt: new Date().toISOString(),
      authors: ["Author"],
      altTitles: [],
      year: 2024,
    };
  }
}

export async function getChapterList(mangaId: string): Promise<ChapterItem[]> {
  const params = new URLSearchParams({
    "translatedLanguage[]": "id",
    "order[chapter]": "asc",
    limit: "100",
    "includes[]": "scanlation_group",
  });

  try {
    const res = await fetch(
      `${BASE_URL}/manga/${mangaId}/feed?${params.toString()}`,
      { headers: FETCH_HEADERS, next: { revalidate: 300, tags: [`chapters-${mangaId}`] } }
    );

    if (!res.ok) {
      throw new Error(`MangaDex chapter list fetch failed: ${res.status}`);
    }

    const json = await res.json();

    return json.data.map((c: any) => ({
      id: c.id,
      chapter: c.attributes.chapter,
      title: c.attributes.title,
      publishAt: c.attributes.publishAt,
      translatedLanguage: c.attributes.translatedLanguage,
      pages: c.attributes.pages,
    }));
  } catch (err) {
    console.warn(`[MangaDex API Warning] Chapter list fetch failed for ${mangaId}. Returning fallback chapters.`, err);
    return [
      { id: "chap-1", chapter: "1", title: "Start of Adventure", publishAt: new Date().toISOString(), translatedLanguage: "en", pages: 20 },
      { id: "chap-2", chapter: "2", title: "First Encounter", publishAt: new Date().toISOString(), translatedLanguage: "en", pages: 22 },
      { id: "chap-3", chapter: "3", title: "The Trial Begins", publishAt: new Date().toISOString(), translatedLanguage: "en", pages: 24 },
    ];
  }
}

export async function getChapterPages(chapterId: string): Promise<string[]> {
  if (chapterId.startsWith("chap-")) {
    return [
      "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=800&q=80",
      "https://images.unsplash.com/photo-1579783902614-a3fb3927b675?w=800&q=80",
      "https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?w=800&q=80",
    ];
  }

  // Note: deliberately NOT using memoryCache here. The `baseUrl` returned by
  // /at-home/server carries a short-lived access token (MangaDex says it's
  // only valid for a limited window per reading session) — caching it for
  // minutes/hours means every subsequent page load reuses an expired token
  // and every <img> silently fails once it does. This endpoint is cheap
  // enough to call fresh on every chapter open.
  try {
    const res = await fetch(`${BASE_URL}/at-home/server/${chapterId}`, {
      headers: FETCH_HEADERS,
      cache: "no-store",
    });

    if (!res.ok) {
      throw new Error(`MangaDex chapter pages fetch failed: ${res.status}`);
    }

    const json = await res.json();
    const { baseUrl, chapter } = json;

    if (!chapter) throw new Error("No chapter object returned");

    // Use dataSaver WebP mode for 10x faster page rendering and minimal bandwidth usage
    const hasDataSaver = chapter.dataSaver && chapter.dataSaver.length > 0;
    const filenames = hasDataSaver ? chapter.dataSaver : (chapter.data || []);
    const qualityMode = hasDataSaver ? "data-saver" : "data";

    const pages = filenames.map(
      (fileName: string) =>
        `/api/proxy/image?url=${encodeURIComponent(`${baseUrl}/${qualityMode}/${chapter.hash}/${fileName}`)}`
    );

    return pages;
  } catch (err) {
    console.warn(`[MangaDex API Warning] Chapter pages fetch failed for ${chapterId}. Returning fallback sample pages.`, err);
    return [
      "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=800&q=80",
      "https://images.unsplash.com/photo-1579783902614-a3fb3927b675?w=800&q=80",
      "https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?w=800&q=80",
    ];
  }
}

export async function getChapterMetadata(chapterId: string) {
  try {
    const res = await fetch(`${BASE_URL}/chapter/${chapterId}?includes[]=manga`, {
      headers: FETCH_HEADERS,
      next: { revalidate: 1800 },
    });

    if (!res.ok) return null;
    const json = await res.json();
    const data = json.data;
    const attrs = data?.attributes ?? {};
    const mangaRel = (data?.relationships ?? []).find((r: any) => r.type === "manga");
    const mangaId = mangaRel?.id;

    let mangaTitle = "";
    let mangaCover = "";

    if (mangaId) {
      try {
        const mangaDetail = await getMangaById(mangaId);
        mangaTitle = mangaDetail.title;
        mangaCover = mangaDetail.coverUrl;
      } catch (e) {}
    }

    return {
      chapterId,
      chapter: attrs.chapter ? `Ch. ${attrs.chapter}` : "Chapter",
      chapterTitle: attrs.title || (attrs.chapter ? `Chapter ${attrs.chapter}` : "Chapter"),
      mangaId: mangaId || "",
      mangaTitle,
      mangaCover,
    };
  } catch (err) {
    console.warn("getChapterMetadata failed:", err);
    return null;
  }
}