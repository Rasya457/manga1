# PRD — Manga/Manhwa/Manhua Reader Web App

## 1. Overview
Aplikasi web (dan nantinya di-package jadi app) untuk membaca manga, manhwa, dan manhua, dengan target pengguna pembaca komik/manga/manhwa yang aktif. Sumber data utama menggunakan MangaDex API (gratis, publik). Tahap awal fokus ke manga/manhwa/manhua — dukungan novel direncanakan sebagai fase lanjutan karena butuh sumber data terpisah (tidak tersedia di MangaDex).

## 2. Target Users
- Pembaca manga, manhwa, dan manhua (remaja–dewasa muda)
- Pengguna yang terbiasa baca lewat browser mobile maupun app
- Target monetisasi: traffic-based ads (Adsterra/PropellerAds, dsb — AdSense sulit approve untuk niche ini)

## 3. Goals (MVP / Percobaan)
- Katalog manga/manhwa/manhua dari MangaDex API, dengan filter tipe konten & genre
- Reader chapter berbasis gambar
- Login/register akun (Firebase Auth)
- Bookmark dan riwayat baca **per akun** (tidak tercampur antar user)
- 100% gratis untuk dijalankan (Firebase Spark plan + Vercel Hobby plan)

## 4. Non-Goals (untuk fase ini)
- Notifikasi chapter baru (dihapus dari scope — butuh Cloud Scheduler berbayar)
- Dukungan novel (butuh sumber data terpisah, fase berikutnya)
- Sistem upload/translasi manual oleh user

## 5. Tech Stack
| Bagian | Teknologi |
|---|---|
| Framework | Next.js (App Router) |
| Bahasa | TypeScript |
| Auth & DB | Firebase (Auth + Firestore), Spark (free) plan |
| Sumber data manga | MangaDex API (publik, gratis) |
| Hosting | Vercel (Hobby/free plan) |
| Styling | (bebas — Tailwind disarankan) |

## 6. Arsitektur Data
- **MangaDex API** = sumber data manga/manhwa/manhua (metadata, cover, chapter, gambar). Tidak disimpan ulang di Firestore — hanya di-fetch dan di-cache pakai Next.js `revalidate`.
- **Firestore** = hanya menyimpan data relasi user: profil, bookmark, riwayat baca. Bukan data manga itu sendiri.
- **Gambar chapter** diambil langsung dari CDN MangaDex di client (`<img src="...">`), **tidak** diproxy lewat server Vercel — untuk menghindari boros kuota bandwidth free tier.

### Deteksi tipe konten
MangaDex tidak punya field `contentType` langsung. Tipe konten (`manga` / `manhwa` / `manhua`) didekati dari `originalLanguage`:
- `ja` → manga
- `ko` → manhwa
- `zh` / `zh-hk` → manhua

### Caching strategy (Next.js `revalidate`)
| Data | Revalidate |
|---|---|
| Catalog list | 10 menit |
| Detail manga | 30 menit |
| Chapter list | 5 menit |
| Chapter image URLs | Tidak di-cache (`no-store`) — URL MangaDex expired ~15 menit |

## 7. Skema Firestore
```
users/{uid}
  ├── email, displayName, createdAt

users/{uid}/bookmarks/{contentId}
  ├── contentId, type: "manga" | "manhwa" | "manhua"
  ├── title, cover, bookmarkedAt

users/{uid}/history/{contentId}
  ├── type, lastChapterRead, lastReadAt, progress
```
Field `type` dipakai supaya satu koleksi `bookmarks`/`history` bisa menampung semua jenis konten (termasuk novel di fase depan) tanpa perlu koleksi terpisah per tipe.

## 8. Struktur Folder
```
manga-app/
├── src/
│   ├── app/
│   │   ├── (auth)/
│   │   │   ├── login/page.tsx
│   │   │   └── register/page.tsx
│   │   ├── (main)/
│   │   │   ├── page.tsx                     # homepage, tab: Manga/Manhwa/Manhua
│   │   │   ├── search/page.tsx
│   │   │   ├── manga/[id]/page.tsx          # detail + chapter list
│   │   │   ├── chapter/[id]/page.tsx        # reader (image-based)
│   │   │   ├── bookmark/page.tsx
│   │   │   ├── history/page.tsx
│   │   │   └── profile/page.tsx
│   │   └── api/
│   │       └── mangadex/
│   │           ├── catalog/route.ts         # list + pagination + filter
│   │           ├── search/route.ts
│   │           ├── manga/[id]/route.ts      # detail + chapter list (JSON only)
│   │           └── chapter/[id]/route.ts    # chapter page image URLs
│   │
│   ├── components/
│   │   ├── reader/
│   │   │   ├── ImageReader.tsx
│   │   │   └── ChapterDrawer.tsx
│   │   ├── content/
│   │   │   ├── ContentCard.tsx
│   │   │   ├── ContentTypeTabs.tsx          # switch Manga/Manhwa/Manhua
│   │   │   └── GenreFilter.tsx
│   │   ├── auth/
│   │   │   └── AuthGuard.tsx
│   │   └── ui/
│   │
│   ├── lib/
│   │   ├── firebase/
│   │   │   ├── config.ts
│   │   │   ├── auth.ts                      # login/register/logout helpers
│   │   │   └── firestore.ts                 # CRUD bookmark, history
│   │   └── sources/
│   │       └── mangadex.ts                  # semua fetch ke MangaDex + caching
│   │
│   ├── context/
│   │   └── AuthContext.tsx                  # global auth state (per akun)
│   │
│   ├── hooks/
│   │   ├── useAuth.ts
│   │   ├── useBookmark.ts
│   │   └── useReadingHistory.ts
│   │
│   └── types/
│       └── manga.ts
│
├── .env.local
└── next.config.js
```

## 9. Core Features (MVP)
1. **Katalog** — list manga/manhwa/manhua dari MangaDex, filter tipe konten, genre, status
2. **Pencarian** — search by title
3. **Detail manga** — info, cover, daftar chapter
4. **Reader** — baca chapter berbasis gambar, infinite-scroll/paged
5. **Auth** — register/login/logout via Firebase Auth (email/password)
6. **Bookmark** — simpan manga favorit, per akun
7. **Riwayat baca** — progress baca tersimpan per akun, otomatis terpisah lewat `uid`

## 10. Constraints & Batasan Free Tier
- Firebase Spark: 50rb reads/hari, 20rb writes/hari, 1GB Firestore storage
- Vercel Hobby: 100GB bandwidth/bulan, function timeout 10 detik
- Cloud Scheduler / Scheduled Functions **tidak dipakai** karena butuh Blaze plan (berbayar) — ini alasan fitur notifikasi dihapus dari scope
- Gambar chapter wajib di-load langsung dari CDN MangaDex di client, bukan diproxy server, untuk menjaga kuota bandwidth Vercel

## 11. Future Scope (di luar MVP)
- Dukungan novel (perlu sumber data/sistem upload terpisah)
- Notifikasi chapter baru (butuh upgrade ke Firebase Blaze + Cloud Scheduler, atau cron gratis eksternal seperti GitHub Actions/cron-job.org yang memanggil API route sendiri)
- Packaging ke Android (PWA → APK via PWABuilder)
- Monetisasi iklan (Adsterra/PropellerAds sebagai alternatif AdSense untuk niche manga)