"use client";

import Link from "next/link";
import Image from "next/image";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import LanguageSwitcher from "./LanguageSwitcher";

export default function Header(){
  const [open, setOpen] = useState(false);
  const { t } = useTranslation();

  return (
    <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-md ring-1 ring-gray-100">
      <div className="container h-16 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-3">
          <Image src="/logo.png" alt="Lavender Travel" width={40} height={40} className="rounded-lg"/>
          <div className="leading-tight">
            <div className="font-semibold text-[15px]" style={{color:"var(--navy)"}}>{t("brand")}</div>
            <div className="text-xs text-gray-500">Almaty & Astana</div>
          </div>
        </Link>

        <nav className="hidden md:flex items-center gap-6 text-sm">
          <a href="#dest" className="hover:text-gray-700">{t("nav.tours")}</a>
          <a href="#why" className="hover:text-gray-700">{t("nav.why")}</a>
          <a href="#contact" className="hover:text-gray-700">{t("nav.contacts")}</a>
          <a href="https://wa.me/77080086191" target="_blank" className="btn-ghost press">{t("nav.whatsapp")}</a>
          <LanguageSwitcher />
        </nav>

        <button onClick={()=>setOpen(v=>!v)} className="md:hidden p-2 text-gray-600" aria-label="Меню">☰</button>
      </div>

      <div className={`md:hidden overflow-hidden transition-[max-height,opacity] duration-300 ${open ? "max-h-64 opacity-100" : "max-h-0 opacity-0"}`}>
        <div className="border-t">
          <div className="container py-3 flex flex-col gap-3 text-sm">
            <a href="#dest" onClick={()=>setOpen(false)}>{t("nav.tours")}</a>
            <a href="#why" onClick={()=>setOpen(false)}>{t("nav.why")}</a>
            <a href="#contact" onClick={()=>setOpen(false)}>{t("nav.contacts")}</a>
            <a href="https://wa.me/77080086191" target="_blank" className="btn-ghost w-max">{t("nav.whatsapp")}</a>
            <LanguageSwitcher />
          </div>
        </div>
      </div>
    </header>
  );
}