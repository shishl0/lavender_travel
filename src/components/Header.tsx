"use client";
import Link from "next/link";
import Image from "next/image";
import { useEffect, useState, useMemo } from "react";
import { SiteSettingsDTO } from "@/types/cms";
import { useTranslation } from "react-i18next";
import LanguageSwitcher from "./LanguageSwitcher";
import { track } from "@/lib/track";

function waNumberToDigits(whats?: string | null): string | null {
  if (!whats) return null;
  let d = whats.replace(/\D/g, "");
  if (d.startsWith("8")) d = "7" + d.slice(1);
  if (!d.startsWith("7")) d = "7" + d;
  return d.length === 11 ? d : null;
}

export default function Header({ settings }: { settings: SiteSettingsDTO | null }) {
  const [open, setOpen] = useState(false);
  const { t, i18n } = useTranslation();

  useEffect(() => {
    const onResize = () => { if (window.innerWidth >= 768) setOpen(false); };
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  const brand = settings?.brand ?? t("brand");
  const tagline = settings?.tagline ?? "Almaty & Astana";

  const waDigits = useMemo(
    () => waNumberToDigits(settings?.whatsappNumber) ?? "77080086191",
    [settings?.whatsappNumber]
  );
  const waHref = `https://wa.me/${waDigits}`;

  const locale = i18n.language;
  const log = (name: string, extras?: Record<string, unknown>) =>
    track(name, { locale, ...extras });

  const navClick = (to: "tours" | "why" | "contacts", place: "top" | "mobile") =>
    () => log("click_nav_link", { to, place });

  const onWhatsAppTop = () => log("click_whatsapp", { place: "header" });
  const onWhatsAppMob = () => log("click_whatsapp", { place: "header_mobile" });
  const onLogo = () => log("click_logo");

  return (
    <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-md ring-1 ring-gray-100">
      <div className="container h-16 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-3" onClick={onLogo}>
          <Image src="/logo.png" alt={brand} width={40} height={40} className="rounded-lg" />
          <div className="leading-tight">
            <div className="font-semibold text-[15px]" style={{ color: "var(--navy)" }}>
              {brand}
            </div>
            <div className="text-xs text-gray-500">{tagline}</div>
          </div>
        </Link>

        <nav className="hidden md:flex items-center gap-6 text-sm">
          <a href="#dest" className="hover:text-gray-700" onClick={navClick("tours", "top")}>
            {t("nav.tours")}
          </a>
          <a href="#why" className="hover:text-gray-700" onClick={navClick("why", "top")}>
            {t("nav.why")}
          </a>
          <a href="#contact" className="hover:text-gray-700" onClick={navClick("contacts", "top")}>
            {t("nav.contacts")}
          </a>
          <a href={waHref} target="_blank" className="btn-ghost press" rel="noreferrer" onClick={onWhatsAppTop}>
            {t("nav.whatsapp")}
          </a>
          <LanguageSwitcher />
        </nav>

        <button onClick={() => setOpen(v => !v)} className="md:hidden p-2 text-gray-600" aria-label="Меню">☰</button>
      </div>

      <div className={`md:hidden overflow-hidden transition-[max-height,opacity] duration-300 ${open ? "max-h-64 opacity-100" : "max-h-0 opacity-0"}`}>
        <div className="border-t">
          <div className="container py-3 flex flex-col gap-3 text-sm">
            <a href="#dest" onClick={() => { setOpen(false); navClick("tours", "mobile")(); }}>
              {t("nav.tours")}
            </a>
            <a href="#why" onClick={() => { setOpen(false); navClick("why", "mobile")(); }}>
              {t("nav.why")}
            </a>
            <a href="#contact" onClick={() => { setOpen(false); navClick("contacts", "mobile")(); }}>
              {t("nav.contacts")}
            </a>
            <a href={waHref} target="_blank" className="btn-ghost w-max" rel="noreferrer" onClick={onWhatsAppMob}>
              {t("nav.whatsapp")}
            </a>
            <LanguageSwitcher />
          </div>
        </div>
      </div>
    </header>
  );
}