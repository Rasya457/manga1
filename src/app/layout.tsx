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
      </head>
      <body className="min-h-screen antialiased pb-24 md:pb-28">
        <SWRProviderWrapper>
          <AuthProvider>
            <ThemeProvider>
              <AppShell>{children}</AppShell>
            </ThemeProvider>
          </AuthProvider>
        </SWRProviderWrapper>
        <SpeedInsights />
      </body>
    </html>
  );
}