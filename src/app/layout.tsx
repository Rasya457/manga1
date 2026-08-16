import type { Metadata } from "next";
import "./globals.css";
import { AuthProvider } from "@/context/AuthContext";
import { ThemeProvider } from "@/context/ThemeContext";
import AppShell from "@/components/ui/AppShell";
import SWRProviderWrapper from "@/components/providers/SWRProviderWrapper";
import { SpeedInsights } from "@vercel/speed-insights/next";

export const metadata: Metadata = {
  title: "Manga Verse — iOS Minimalist Manga App",
  description: "Read Manga, Manhwa, Manhua and Novels with iOS minimalist aesthetics",
  referrer: "no-referrer",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="scroll-smooth">
      <head>
        <meta name="referrer" content="no-referrer" />
        {/* Preconnect to key image CDNs to reduce LCP */}
        <link rel="preconnect" href="https://uploads.mangadex.org" crossOrigin="anonymous" />
        <link rel="dns-prefetch" href="https://uploads.mangadex.org" />
        <link rel="preconnect" href="https://manga1.vercel.app" crossOrigin="anonymous" />
      </head>
      <body className="min-h-screen antialiased pb-24 md:pb-28">
        <SWRProviderWrapper>
          <AuthProvider>
            <ThemeProvider>
              <AppShell>{children}</AppShell>
              <SpeedInsights />
            </ThemeProvider>
          </AuthProvider>
        </SWRProviderWrapper>
      </body>
    </html>
  );
}