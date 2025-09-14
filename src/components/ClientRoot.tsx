"use client";

import { useEffect, useRef } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { track } from "@/lib/track";

export default function ClientRoot() {

  const pathname = usePathname();
  const search = useSearchParams();
  const last = useRef<string>("");

  useEffect(() => {
    if (!pathname) return;
    if (pathname.startsWith("/admin")) return;

    const hash = typeof window !== "undefined" ? window.location.hash : "";
    const qs = search?.toString() ? `?${search}` : "";
    const path = `${pathname}${qs}${hash}`;

    if (last.current === path) return;
    last.current = path;

    const isMobile =
      typeof navigator !== "undefined" && /Mobi|Android/i.test(navigator.userAgent);
    const locale =
      typeof navigator !== "undefined" ? navigator.language : undefined;

    track("page_view", {
      path,
      referrer: typeof document !== "undefined" ? document.referrer : undefined,
      device: isMobile ? "mobile" : "desktop",
      locale,
    });
  }, [pathname, search]);

  return null;
}