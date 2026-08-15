/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    formats: ["image/avif", "image/webp"],
    remotePatterns: [
      {
        protocol: "https",
        hostname: "uploads.mangadex.org",
        pathname: "/covers/**",
      },
      {
        protocol: "https",
        hostname: "*.mangadex.network",
        pathname: "/**",
      },
    ],
    minimumCacheTTL: 60 * 60 * 24, // 24 hours
  },

  // Tree-shake and optimize heavy packages to eliminate unused JavaScript
  experimental: {
    optimizePackageImports: [
      "firebase/app",
      "firebase/auth",
      "firebase/firestore",
      "@vercel/speed-insights",
    ],
  },

  async headers() {
    return [
      // ─── Cache Static Assets ────────────────────────────────────────────────
      {
        source: "/_next/static/:path*",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=31536000, immutable",
          },
        ],
      },
      // ─── Cache MangaDex API Responses ───────────────────────────────────────
      {
        source: "/api/mangadex/:path*",
        headers: [
          {
            key: "Cache-Control",
            value: "public, s-maxage=300, stale-while-revalidate=60",
          },
        ],
      },

      // ─── Security Headers (applies to all routes) ───────────────────────────
      {
        source: "/:path*",
        headers: [
          // Prevent browsers from MIME-sniffing response types
          {
            key: "X-Content-Type-Options",
            value: "nosniff",
          },
          // Block clickjacking attacks (do not allow embedding in <iframe>)
          {
            key: "X-Frame-Options",
            value: "DENY",
          },
          // Disable legacy XSS auditor (modern CSP replaces this, but still good to set)
          {
            key: "X-XSS-Protection",
            value: "1; mode=block",
          },
          // Prevent third-party image CDNs (like MangaDex) from blocking covers due to hotlinking
          {
            key: "Referrer-Policy",
            value: "no-referrer",
          },
          // Restrict browser features not needed by this app
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=(), interest-cohort=()",
          },
          // Force HTTPS for 1 year (enable only in production with a real domain)
          {
            key: "Strict-Transport-Security",
            value: "max-age=31536000; includeSubDomains",
          },
          // Content Security Policy — configured to allow MangaDex, Firebase, and Google Sign-In
          {
            key: "Content-Security-Policy",
            value: [
              "default-src 'self'",
              // Scripts: self + Next.js + Google Sign-In APIs
              "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://apis.google.com https://accounts.google.com https://www.gstatic.com",
              // Styles: self + inline + Google Fonts
              "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://accounts.google.com",
              // Fonts
              "font-src 'self' https://fonts.gstatic.com data:",
              // Images: allow all HTTPS images (MangaDex At-Home nodes with custom ports, covers, avatars, etc.)
              "img-src 'self' data: blob: https: http:",
              // API/fetch calls: self + Firebase Auth & Firestore + Google OAuth
              "connect-src 'self' https://*.googleapis.com https://identitytoolkit.googleapis.com https://securetoken.googleapis.com https://firestore.googleapis.com https://*.firebaseio.com https://*.firebaseapp.com https://accounts.google.com",
              // Frames needed for Firebase Auth & Google Sign-In popups
              "frame-src 'self' https://*.firebaseapp.com https://accounts.google.com https://apis.google.com",
              // No plugins (PDF, Flash, etc.)
              "object-src 'none'",
              // Disallow embedding this page in external iframes
              "frame-ancestors 'none'",
              // Only load resources from HTTPS
              "upgrade-insecure-requests",
            ].join("; "),
          },
        ],
      },
    ];
  },

  // Compress all responses with gzip/brotli
  compress: true,
};

module.exports = nextConfig;