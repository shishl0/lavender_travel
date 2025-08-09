"use client";

import { useEffect } from "react";

export default function SmoothScroll() {
  useEffect(() => {
    function onClick(e: MouseEvent) {
      const a = (e.target as HTMLElement).closest('a[href^="#"]') as HTMLAnchorElement | null;
      if (!a) return;
      const href = a.getAttribute("href");
      if (!href || href === "#" || href.length < 2) return;

      const id = href.slice(1);
      const el = document.getElementById(id);
      if (!el) return; // якоря нет — выходим

      e.preventDefault();

      // Высота фикcированного хедера (ищем <header class="sticky ...">)
      const header = document.querySelector("header.sticky") as HTMLElement | null;
      const offset = (header?.offsetHeight ?? 0) + 8; // +8px — небольшой зазор

      const top = el.getBoundingClientRect().top + window.pageYOffset - offset;

      window.scrollTo({ top, behavior: "smooth" });
      // Обновим hash без резкого джампа
      history.pushState(null, "", href);
    }

    document.addEventListener("click", onClick);
    return () => document.removeEventListener("click", onClick);
  }, []);

  return null;
}