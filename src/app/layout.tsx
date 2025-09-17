import "./globals.css";
import type { Metadata } from "next";
import { Suspense } from "react";
import I18nInit from "@/components/I18nInit";
import ClientRoot from "@/components/ClientRoot";
import ChatMini from "@/components/ChatMini";
import { getActiveSettings } from "@/lib/cms-cache";
import { detectLocale } from "@/lib/i18n-server";
import { Analytics } from "@vercel/analytics/next";

const SITE_URL =
  (process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000").replace(/\/$/, "");

export async function generateMetadata(): Promise<Metadata> {
  const s = await getActiveSettings();

  const title =
    s?.title || "Lavender Travel KZ — туры из Алматы и Астаны";
  const description =
    s?.description || "Авторские туры, забота 24/7, маршруты под ваш стиль отдыха.";
  const og = s?.ogImageUrl || "/images/hero.jpg";

  const ogUrl =
    og?.startsWith("http")
      ? og
      : `${SITE_URL}${og?.startsWith("/") ? og : `/${og}`}`;

  return {
    metadataBase: new URL(SITE_URL),
    title,
    description,
    openGraph: {
      title,
      description,
      url: SITE_URL,
      siteName: s?.brand || "Lavender Travel KZ",
      type: "website",
      images: og ? [{ url: ogUrl }] : [],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: og ? [ogUrl] : [],
    },
    alternates: { canonical: SITE_URL },
    icons: { icon: "/favicon.ico", shortcut: "/favicon.ico" },
  };
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const lang = await detectLocale();
  return (
    <html lang={lang} suppressHydrationWarning>
      <body className="antialiased">
        <Suspense fallback={null}><I18nInit /></Suspense>
        <Suspense fallback={null}><ClientRoot /></Suspense>
        <Suspense fallback={null}>{children}</Suspense>
        <Suspense fallback={null}><ChatMini /></Suspense>
        {/* Vercel Analytics (дополнительно к нашей аналитике) */}
        <Analytics />
      </body>
    </html>
  );
}
