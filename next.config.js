/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
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
          // Don't send the full Referer header to external sites
          {
            key: "Referrer-Policy",
            value: "strict-origin-when-cross-origin",
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
          // Content Security Policy — only allow resources from trusted origins
          {
            key: "Content-Security-Policy",
            value: [
              "default-src 'self'",
              // Scripts: self + Next.js inline scripts (needed for RSC/hydration)
              "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
              // Styles: self + inline (Tailwind/styled-jsx inject inline styles)
              "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
              // Fonts
              "font-src 'self' https://fonts.gstatic.com",
              // Images: self + MangaDex CDN + data URIs (for Next/Image placeholders)
              "img-src 'self' data: blob: https://uploads.mangadex.org https://*.mangadex.network",
              // API/fetch calls: self only (our own Next.js API routes forward to MangaDex)
              "connect-src 'self' https://identitytoolkit.googleapis.com https://securetoken.googleapis.com https://firestore.googleapis.com https://www.googleapis.com",
              // No plugins (PDF, Flash, etc.)
              "object-src 'none'",
              // Disallow embedding this page in iframes
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