"use client";

import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";

export default function SlidePane({ children }: { children: React.ReactNode }) {
  const pathname = usePathname() || "/";
  const ref = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.animate(
      [{ opacity: 0, transform: "translateX(8px)" }, { opacity: 1, transform: "translateX(0)" }],
      { duration: 160, easing: "ease-out" }
    );
  }, [pathname]);

  return (
    <div key={pathname} ref={ref}>
      {children}
    </div>
  );
}