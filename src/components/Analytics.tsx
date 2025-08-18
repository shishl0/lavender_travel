"use client";
import Script from "next/script";

export default function Analytics() {
  const id = process.env.NEXT_PUBLIC_UMAMI_WEBSITE_ID;
  const src = process.env.NEXT_PUBLIC_UMAMI_SRC || "https://analytics.umami.is/script.js";
  const domains = process.env.NEXT_PUBLIC_UMAMI_DOMAINS || "localhost";

  const enabled =
    !!id && (process.env.NODE_ENV === "production" || process.env.NEXT_PUBLIC_UMAMI_ENABLE_DEV === "1");

  if (!enabled) return null;

  return (
    <Script
      src={src}
      data-website-id={id}
      data-domains={domains}
      data-auto-track="true"
      strategy="afterInteractive"
    />
  );
}