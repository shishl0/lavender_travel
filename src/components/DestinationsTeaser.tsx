"use client";

import Link from "next/link";

type Item = {
  id: string;
  title: string;
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
  if (!items?.length) return null;

  return (
    <section className="teaser" aria-labelledby="popularDestinationsTitle">
      <div className="teaser-head">
        <h2 id="popularDestinationsTitle" className="teaser-title">
          Популярные направления
        </h2>

        {/* Кнопка «Смотреть все» */}
        <div className="teaser-actions">
          <Link
            href="/destinations"
            className="btn btn-surface btn-sm btn-pill press group"
            aria-label="Смотреть все направления"
          >
            <span>Смотреть все</span>
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

      <div className="pop-grid">
        {items.map((d) => {
          const href = d.href || `/destinations#${d.id}`;
          const img = d.imageUrl || "/images/placeholder.jpg";
          const priceNum = formatTengeNumber(d.priceFrom);

          return (
            <Link
              key={d.id}
              href={href}
              className="pop-card press"
              aria-label={priceNum ? `${d.title} — от ${priceNum} тг` : d.title}
            >
              {/* фон */}
              <img
                className="pop-img"
                src={img}
                alt={d.title}
                loading="lazy"
                decoding="async"
              />

              {/* подпись на блюре (сам блюр задаёт .pop-card::after) */}
              <div className="pop-cap">
                <div className="pop-title">{d.title}</div>
                {priceNum && (
                  <div className="pop-price">
                    <span className="muted">от</span> {priceNum}
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