"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect, useState } from "react";

export default function Header() {
  const [open, setOpen] = useState(false);

  // Закрывать меню при ресайзе на десктоп
  useEffect(() => {
    const onResize = () => {
      if (window.innerWidth >= 768) setOpen(false);
    };
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  return (
    <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-md ring-1 ring-gray-100">
      <div className="container h-16 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-3">
          <Image src="/logo.png" alt="Lavender Travel" width={40} height={40} className="rounded-lg" />
          <div className="leading-tight">
            <div className="font-semibold text-[15px]" style={{ color: "var(--navy)" }}>
              Lavender Travel KZ
            </div>
            <div className="text-xs text-gray-500">Вылеты из Алматы и Астаны</div>
          </div>
        </Link>

        <nav className="hidden md:flex items-center gap-8 text-sm">
          <a href="#dest" className="hover:text-gray-700">Туры</a>
          <a href="#why" className="hover:text-gray-700">Почему мы</a>
          <a href="#contact" className="hover:text-gray-700">Контакты</a>
          <a href="https://wa.me/77080086191" target="_blank" className="btn-ghost press">WhatsApp</a>
        </nav>

        <button
          onClick={() => setOpen(v => !v)}
          className="md:hidden p-2 text-gray-700 press"
          aria-label="Меню"
          aria-expanded={open}
          aria-controls="mobile-menu"
        >
          {/* Иконка-бургер → крестик */}
          <span className="sr-only">Открыть меню</span>
          <svg width="26" height="26" viewBox="0 0 24 24" className="block">
            <g className={`transition-all duration-200 ${open ? "opacity-0 scale-90" : "opacity-100 scale-100"}`}>
              <path d="M4 7h16M4 12h16M4 17h16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </g>
            <g className={`-mt-6 transition-all duration-200 ${open ? "opacity-100 scale-100" : "opacity-0 scale-90"}`}>
              <path d="M6 6l12 12M18 6l-12 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </g>
          </svg>
        </button>
      </div>

      {/* Оверлей для клика вне (мобайл) */}
      <div
        className={`md:hidden fixed inset-0 z-30 bg-black/20 backdrop-blur-[1px] transition-opacity duration-300
        ${open ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"}`}
        onClick={() => setOpen(false)}
      />

      {/* Мобильное меню: плавный slide-down + fade */}
      <div
        id="mobile-menu"
        className={`
          md:hidden relative z-40 overflow-hidden border-t bg-white/95 backdrop-blur
          transition-[max-height,opacity,transform] duration-300 ease-out
          ${open ? "max-h-64 opacity-100 translate-y-0" : "max-h-0 opacity-0 -translate-y-1"}
        `}
      >
        <div className="container py-3 flex flex-col gap-3 text-sm">
          <a href="#dest" onClick={() => setOpen(false)} className="py-2">Туры</a>
          <a href="#why" onClick={() => setOpen(false)} className="py-2">Почему мы</a>
          <a href="#contact" onClick={() => setOpen(false)} className="py-2">Контакты</a>
          <a href="https://wa.me/77080086191" target="_blank" className="btn-ghost w-max press mt-1">WhatsApp</a>
        </div>
      </div>
    </header>
  );
}