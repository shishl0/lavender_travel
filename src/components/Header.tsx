"use client";
import Link from "next/link";
import Image from "next/image";
import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import type { SiteSettingsDTO } from "@/types/cms";
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
  const { t, i18n } = useTranslation();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onResize = () => { if (window.innerWidth >= 768) setOpen(false); };
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  const brand = settings?.brand ?? "Lavender Travel KZ";
  const tagline = settings?.tagline ?? "Almaty & Astana";

  const waDigits = useMemo(
    () => waNumberToDigits(settings?.whatsappNumber) ?? "77080086191",
    [settings?.whatsappNumber]
  );
  const waHref = `https://wa.me/${waDigits}`;
  const instagramHref = settings?.instagramUrl || "https://www.instagram.com/lavender_travel_kz";

  const locale = i18n.language;
  const log = (name: string, extras?: Record<string, unknown>) => track(name, { locale, ...extras });

  const onLogo = () => log("click_logo");
  const onNav = (to: "destinations" | "reviews" | "about", place: "top" | "mobile") =>
    () => log("click_nav_link", { to, place });
  const onWhatsApp = (place: "header" | "header_mobile") =>
    () => log("click_whatsapp", { place });
  const onInstagram = (place: "header" | "header_mobile") =>
    () => log("click_instagram", { place });

  return (
    <header className="site-header">
      <div className="header-inner">
        {/* Логотип -> главная */}
        <Link href="/" className="brand" onClick={onLogo}>
          <Image src="/logo.png" alt={brand} width={40} height={40} className="rounded-lg" />
          <div className="leading-tight">
            <div className="brand-title">{brand}</div>
            <div className="brand-tagline">{tagline}</div>
          </div>
        </Link>

        {/* Десктоп-меню */}
        <nav className="nav">
          <Link href="/destinations" className="nav-link" onClick={onNav("destinations", "top")}>
            {t("nav.tours", "Направления")}
          </Link>
          <Link href="/reviews" className="nav-link" onClick={onNav("reviews", "top")}>
            {t("nav.reviews", "Отзывы")}
          </Link>
          <Link href="/about" className="nav-link" onClick={onNav("about", "top")}>
            {t("nav.about", "О нас")}
          </Link>

          <div className="header-icons">
            <IconButton className="icon-wa" href={waHref} label={t("nav.whatsapp", "WhatsApp")} title="WhatsApp" onClick={onWhatsApp("header")}>
              <WhatsAppIcon />
            </IconButton>
            <IconButton className="icon-ig" href={instagramHref} label={t("nav.instagram", "Instagram")} title="Instagram" onClick={onInstagram("header")}>
              <InstagramIcon />
            </IconButton>
            <LanguageSwitcher />
          </div>
        </nav>

        {/* Бургер */}
        <button
          onClick={() => setOpen(v => !v)}
          className="burger"
          aria-label={t("nav.menu", "Меню")}
          title={t("nav.menu", "Меню")}
          >
          ☰
        </button>
      </div>

      {/* Мобильное меню */}
      <div className={`mobile-menu ${open ? "mobile-menu--open" : ""}`}>
        <div className="mobile-inner">
          <div className="mobile-body">
            <Link href="/destinations" onClick={() => { setOpen(false); onNav("destinations", "mobile")(); }} className="mobile-link">
              {t("nav.tours", "Направления")}
            </Link>
            <Link href="/reviews" onClick={() => { setOpen(false); onNav("reviews", "mobile")(); }} className="mobile-link">
              {t("nav.reviews", "Отзывы")}
            </Link>
            <Link href="/about" onClick={() => { setOpen(false); onNav("about", "mobile")(); }} className="mobile-link">
              {t("nav.about", "О нас")}
            </Link>

            <div className="header-icons pt-1">
              <IconButton className="icon-wa" href={waHref} label={t("nav.whatsapp", "WhatsApp")} title="WhatsApp" onClick={onWhatsApp("header_mobile")}>
                <WhatsAppIcon />
              </IconButton>
              <IconButton className="icon-ig" href={instagramHref} label={t("nav.instagram", "Instagram")} title="Instagram" onClick={onInstagram("header_mobile")}>
                <InstagramIcon />
              </IconButton>
              <LanguageSwitcher />
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}

/* ===== Helpers ===== */

function IconButton({
  href, label, title, onClick, children, className = "",
}: {
  href: string;
  label: string;
  title?: string;
  onClick?: () => void;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      aria-label={label}
      title={title || label}
      onClick={onClick}
      className={`icon-btn ${className}`}
    >
      {children}
      <span className="sr-only">{label}</span>
    </a>
  );
}

function InstagramIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true" className="block">
      <rect x="3" y="3" width="18" height="18" rx="5" fill="none" stroke="currentColor" strokeWidth="1.7"/>
      <circle cx="12" cy="12" r="4.2" fill="none" stroke="currentColor" strokeWidth="1.7"/>
      <circle cx="17.3" cy="6.7" r="1.2" fill="currentColor" />
    </svg>
  );
}

function WhatsAppIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 16 16" aria-hidden="true" className="block">
      <path fill="currentColor" d="M13.601 2.326A7.85 7.85 0 0 0 7.994 0C3.627 0 .068 3.558.064 7.926c0 1.399.366 2.76 1.057 3.965L0 16l4.204-1.102a7.9 7.9 0 0 0 3.79.965h.004c4.368 0 7.926-3.558 7.93-7.93A7.9 7.9 0 0 0 13.6 2.326zM7.994 14.521a6.6 6.6 0 0 1-3.356-.92l-.24-.144-2.494.654.666-2.433-.156-.251a6.56 6.56 0 0 1-1.007-3.505c0-3.626 2.957-6.584 6.591-6.584a6.56 6.56 0 0 1 4.66 1.931 6.56 6.56 0 0 1 1.928 4.66c-.004 3.639-2.961 6.592-6.592 6.592m3.615-4.934c-.197-.099-1.17-.578-1.353-.646-.182-.065-.315-.099-.445.099-.133.197-.513.646-.627.775-.114.133-.232.148-.43.05-.197-.1-.836-.308-1.592-.985-.59-.525-.985-1.175-1.103-1.372-.114-.198-.011-.304.088-.403.087-.088.197-.232.296-.346.1-.114.133-.198.198-.33.065-.134.034-.248-.015-.347-.05-.099-.445-1.076-.612-1.47-.16-.389-.323-.335-.445-.34-.114-.007-.247-.007-.38-.007a.73.73 0 0 0-.529.247c-.182.198-.691.677-.691 1.654s.71 1.916.81 2.049c.098.133 1.394 2.132 3.383 2.992.47.205.84.326 1.129.418.475.152.904.129 1.246.08.38-.058 1.171-.48 1.338-.943.164-.464.164-.86.114-.943-.049-.084-.182-.133-.38-.232"/>
    </svg>
  );
}