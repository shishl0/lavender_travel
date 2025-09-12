"use client";

import Link from "next/link";
import { useTranslation } from "react-i18next";
import type { Localized } from "@/types/cms";

type Item = {
  id: string;
  title: string | Localized;
  imageUrl?: string;
  priceFrom?: number | string;
  nights?: number;
  href?: string;
};

function formatTengeNumber(v?: number | string): string | null {
  if (v == null || v === "") return null;
  const n = Number(v);
  if (Number.isFinite(n)) {
    return new Intl.NumberFormat("ru-RU", { maximumFractionDigits: 0 }).format(n);
  }
  return String(v);
}

export default function DestinationsTeaser({ items = [] as Item[] }) {
  const { t, i18n } = useTranslation();
  if (!items?.length) return null;

  const sectionTitle = t("teaser.destinations.title", "Популярные направления");
  const viewAll = t("teaser.destinations.viewAll", "Смотреть все");
  const viewAllAria = t("teaser.destinations.viewAllAria", "Смотреть все направления");
  const pricePrefix = t("teaser.destinations.pricePrefix", "от");

  return (
    <section className="teaser" aria-labelledby="popularDestinationsTitle">
      <div className="teaser-head">
        <h2 id="popularDestinationsTitle" className="teaser-title">
          {sectionTitle}
        </h2>

        {/* Кнопка «Смотреть все» */}
        <div className="teaser-actions">
          <Link
            href="/destinations"
            className="btn btn-surface btn-sm btn-pill press group"
            aria-label={viewAllAria}
          >
            <span>{viewAll}</span>
            <svg
              className="icon transition-transform duration-200 ease-out group-hover:translate-x-1"
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="M5 12h14" />
              <path d="M13 5l7 7-7 7" />
            </svg>
          </Link>
        </div>
      </div>

      <div className="pop-grid" data-count={items.length}>
        {items.map((d) => {
          const href = d.href || `/destinations#${d.id}`;
          const img = d.imageUrl || "/images/placeholder.jpg";
          const priceNum = formatTengeNumber(d.priceFrom);
          const lang = (i18n.language || "ru").slice(0, 2);
          const titleText = (() => {
            if (typeof d.title === "string") return d.title;
            const m = d.title as Localized;
            if (lang === "kk" && m.kk) return m.kk;
            if (lang === "en" && m.en) return m.en;
            if (lang === "ru" && m.ru) return m.ru;
            return m.ru || m.kk || m.en || "Направление";
          })();

          return (
            <Link
              key={d.id}
              href={href}
              className="pop-card press"
              aria-label={
                priceNum
                  ? `${titleText} — ${pricePrefix} ${priceNum} тг`
                  : titleText
              }
            >
              {/* фон */}
              <img
                className="pop-img"
                src={img}
                alt={titleText}
                loading="lazy"
                decoding="async"
              />

              {/* подпись на блюре (сам блюр задаёт .pop-card::after) */}
              <div className="pop-cap">
                <div className="pop-title">{titleText}</div>
                {priceNum && (
                  <div className="pop-price">
                    <span className="muted">{pricePrefix}</span> {priceNum}
                    <span className="tenge">₸</span>
                  </div>
                )}
              </div>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
