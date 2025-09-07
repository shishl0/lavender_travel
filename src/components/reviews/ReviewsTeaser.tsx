"use client";
import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useTranslation } from "react-i18next";

/** Один отзыв */
type Item = {
  id: string;
  name: string;
  text: string;
  images: string[];
  rating: number;
  createdAt?: string | number;      // ISO | timestamp | undefined
  created_at?: string | number;
};

// ===== helpers: даты (raw→Date) =====
function pickRawDate(r: any) {
  return (
    r.createdAt ?? r.created_at ?? r.created ?? r.date ??
    r.publishedAt ?? r.published_at ?? r.inserted_at ?? r.ts ?? r.timestamp
  );
}
function toDate(raw: any): Date | null {
  if (raw == null) return null;
  if (raw instanceof Date) return isNaN(+raw) ? null : raw;
  if (typeof raw === "number") return new Date(raw < 2_000_000_000 ? raw * 1000 : raw);
  if (typeof raw === "string") {
    const s = raw.trim();
    if (/^\d{13}$/.test(s)) return new Date(+s);
    if (/^\d{10}$/.test(s)) return new Date(+s * 1000);
    const d = new Date(s);
    return isNaN(+d) ? null : d;
  }
  return null;
}

export default function ReviewsTeaser() {
  const { t, i18n } = useTranslation();

  // локализованный форматтер даты
  const formatDate = useMemo(() => {
    const months = (t("date.monthsShort", { returnObjects: true }) as string[]) || [];
    const todayLabel = t("date.today", "сегодня");
    const yesterdayLabel = t("date.yesterday", "вчера");

    return (raw: any) => {
      const d = toDate(raw);
      if (!d) return "";
      const now = new Date();

      const sameDay = (a: Date, b: Date) => a.toDateString() === b.toDateString();
      if (sameDay(d, now)) return todayLabel;

      const y = new Date(now);
      y.setDate(now.getDate() - 1);
      if (sameDay(d, y)) return yesterdayLabel;

      const m = months[d.getMonth()] ?? "";
      return `${d.getDate()} ${m} ${d.getFullYear()}`;
    };
  }, [i18n.language, t]);

  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);

  /** Модалка отзыва */
  const [selected, setSelected] = useState<Item | null>(null);
  const [show, setShow] = useState(false);

  /** Fullscreen просмотрщик фото (логика сохранена, UI не трогаем) */
  const [, setViewer] = useState<{ images: string[]; index: number } | null>(null);

  const open = (r: Item) => { setSelected(r); requestAnimationFrame(() => setShow(true)); };
  const closeAnimated = () => { setShow(false); setTimeout(() => setSelected(null), 120); };

  useEffect(() => {
    (async () => {
      try {
        const r = await fetch("/api/reviews/active?limit=4", { cache: "no-store" });
        const j = await r.json();
        const list = Array.isArray(j?.reviews) ? j.reviews : [];
        setItems(list);
      } catch { setItems([]); }
      finally { setLoading(false); }
    })();
  }, []);

  const title = t("reviewsTeaser.title", "Отзывы клиентов");
  const viewAll = t("reviewsTeaser.viewAll", "Смотреть все");
  const viewAllAria = t("reviewsTeaser.viewAllAria", "Смотреть все отзывы");
  const emptyText = t("reviewsTeaser.empty", "Отзывов пока нет — станьте первым!");
  const leaveCta = t("reviewsTeaser.leaveCta", "Оставить отзыв");
  const modalTitle = t("reviewsTeaser.modalTitle", "Отзыв");
  const modalClose = t("reviewsTeaser.modalClose", "Закрыть");
  const newBadge = t("reviewsTeaser.newBadge", "новое");

  return (
    <section className="teaser" aria-labelledby="reviewsTeaserTitle">
      <div className="teaser-head">
        <h2 id="reviewsTeaserTitle" className="teaser-title">{title}</h2>
        <div className="teaser-actions">
          <Link
            href="/reviews"
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
              <path d="M5 12h14" /><path d="M13 5l7 7-7 7" />
            </svg>
          </Link>
        </div>
      </div>

      <div className="teaser-grid" aria-busy={loading}>
        {/* СКЕЛЕТЫ */}
        {loading && Array.from({ length: 4 }).map((_, i) => <SkeletonCard key={`s-${i}`} />)}

        {/* КОНТЕНТ */}
        {!loading && items.map((r) => {
          const cleanText = (r.text || "").replace(/^[\s★☆]+/g, "");
          const dateLabel = formatDate(pickRawDate(r));
          const imgs = Array.isArray(r.images) ? r.images : [];
          const teaser = imgs.slice(0, 3);
          const rest = Math.max(0, imgs.length - teaser.length);

          const openAria = t("reviewsTeaser.openAria", "Открыть отзыв: {{name}}", { name: r.name });

          return (
            <article
              key={r.id}
              className="review-card review-card--elevated press"
              role="button"
              tabIndex={0}
              onClick={() => open(r)}
              onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && open(r)}
              aria-label={openAria}
            >
              {/* шапка: имя + дата (справа тонкой капсулой) */}
              <div className="head justify-between">
                <div className="name">{r.name}</div>
                {dateLabel ? <div className="date">{dateLabel}</div> : <div className="date">{newBadge}</div>}
              </div>

              {/* звёзды */}
              <div className="stars-row">
                <Stars value={Number.isFinite(r.rating) ? r.rating : 5} />
              </div>

              {/* текст */}
              <p className="text">{cleanText}</p>

              {/* мини-галерея (с тенью и оверлеем) */}
              {!!teaser.length && (
                <div className="photos">
                  {teaser.map((src, i) => (
                    <div key={src + i} className="photo-wrap">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img className="photo-img" src={src} alt="" />
                      {rest > 0 && i === teaser.length - 1 && (
                        <div className="photo-more">+{rest}</div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </article>
          );
        })}

        {/* ПУСТО */}
        {!loading && items.length === 0 && (
          <div className="review-card review-card--empty">
            <div className="text">{emptyText}</div>
          </div>
        )}
      </div>

      {/* CTA — Оставить отзыв */}
      <div className="mt-4 flex justify-center">
        <a
          href="#leave-review"
          className="btn btn-primary btn-pill btn-lg press"
          onClick={(e) => { e.preventDefault(); window.dispatchEvent(new CustomEvent("open-review-modal")); }}
        >
          {leaveCta}
        </a>
      </div>

      {/* ===== МОДАЛКА ПРОСМОТРА ===== */}
      {selected && (
        <div className="modal-backdrop" role="dialog" aria-modal="true" data-open={show ? 1 : 0} onClick={closeAnimated}>
          <div className="modal-sheet modal-sheet--review" data-open={show ? 1 : 0} onClick={(e) => e.stopPropagation()}>
            <div className="modal-head">
              <div className="modal-title">{modalTitle}</div>
              <button className="modal-close" onClick={closeAnimated} aria-label={modalClose}>✕</button>
            </div>

            <div className="modal-body review-modal">
              <div className="review-modal-head">
                <div className="review-modal-name">{selected.name}</div>
                <Stars value={Number.isFinite(selected.rating) ? selected.rating : 5} className="ml-2" />
              </div>

              <div className="review-modal-text">{selected.text}</div>

              {!!selected.images?.length && (
                <div className="review-modal-grid">
                  {selected.images.map((src, i) => (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      key={src + i}
                      src={src}
                      alt=""
                      className="review-modal-img"
                      onClick={() => setViewer({ images: selected.images, index: i })}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

    </section>
  );
}

/* ==== Скелет карточки — под новую разметку ==== */
function SkeletonCard() {
  return (
    <article className="review-card skel-card">
      <div className="animate-pulse">
        <div className="flex items-center justify-between">
          <div className="h-4 w-40 rounded bg-gray-200" />
          <div className="h-4 w-16 rounded bg-gray-100" />
        </div>
        <div className="mt-2 flex items-center gap-1">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-3.5 w-3.5 rounded bg-gray-200" />
          ))}
        </div>
        <div className="mt-3 space-y-2">
          <div className="h-3 w-full rounded bg-gray-200" />
          <div className="h-3 w-5/6 rounded bg-gray-200" />
          <div className="h-3 w-3/4 rounded bg-gray-200" />
        </div>
        <div className="mt-3 grid grid-cols-3 gap-2 min-h-[84px]">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-[84px] w-full rounded-md bg-gray-200" />
          ))}
        </div>
      </div>
    </article>
  );
}

/* ==== Звёзды ==== */
function Stars({ value = 5, size = 14, className = "" }: { value?: number | null; size?: number; className?: string; }) {
  const v = Math.max(0, Math.min(5, Math.round(value ?? 5)));
  return (
    <div className={`inline-flex items-center gap-0.5 ${className}`} aria-label={`Оценка: ${v} из 5`}>
      {Array.from({ length: 5 }).map((_, i) => (
        <svg key={i} width={size} height={size} viewBox="0 0 24 24" aria-hidden="true">
          <path
            d="M12 17.27l6.18 3.73-1.64-7.03L21.5 9.24l-7.19-.61L12 2 9.69 8.63 2.5 9.24l4.96 4.73L5.82 21z"
            fill={i < v ? "#f5b301" : "none"}
            stroke={i < v ? "#f5b301" : "#D1D5DB"}
            strokeWidth="1.2"
          />
        </svg>
      ))}
    </div>
  );
}