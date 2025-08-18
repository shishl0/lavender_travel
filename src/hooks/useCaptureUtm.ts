"use client";

import { useEffect } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { captureUtmOnce } from "@/lib/utm";

export function useCaptureUtm() {
  const pathname = usePathname();
  const search = useSearchParams();

  useEffect(() => {
    // не трекаем админку
    if (pathname?.startsWith("/admin")) return;
    captureUtmOnce();
  }, [pathname, search]);
}