"use client";

import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import Lightbox from "@/components/reviews/LightBox";

type Review = {
  id: string;
  name: string;
  text: string;
  images?: string[];
  rating?: number;
  createdAtISO?: string;
  created_at?: string | number;
  createdAt?: string | number;
  date?: string | number;
};
type ApiResp = { reviews?: Review[] };

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

function formatDateLocalized(raw: any, lang: string, t: (k: string, fb?: string) => string) {
  const d = toDate(raw);
  if (!d) return "";
  const now = new Date();
  if (d.toDateString() === now.toDateString()) return t("date.today", "сегодня");
  const y = new Date(now); y.setDate(now.getDate() - 1);
  if (d.toDateString() === y.toDateString()) return t("date.yesterday", "вчера");
  const dd = d.getDate();
  const mon = d.toLocaleString(lang || "ru", { month: "short" });
  const yyyy = d.getFullYear();
  return `${dd} ${mon} ${yyyy}`;
}

function Stars({ value = 5, size = 14, className = "" }: { value?: number | null; size?: number; className?: string }) {
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

function StarPicker({
  value, onChange, className = "",
}: { value: number; onChange: (v: number) => void; className?: string; }) {
  const [hover, setHover] = useState<number | null>(null);
  const show = hover ?? value;
  return (
    <div className={`inline-flex items-center gap-1 ${className}`}>
      {Array.from({ length: 5 }).map((_, i) => {
        const n = i + 1;
        const active = n <= show;
        return (
          <button
            key={n}
            type="button"
            onClick={() => onChange(n)}
            onMouseEnter={() => setHover(n)}
            onMouseLeave={() => setHover(null)}
            aria-label={`${n} из 5`}
            className="press grid h-9 w-9 place-items-center rounded-lg hover:bg-gray-50"
          >
            <svg width="22" height="22" viewBox="0 0 24 24" aria-hidden="true">
              <path
                d="M12 17.27l6.18 3.73-1.64-7.03L21.5 9.24l-7.19-.61L12 2 9.69 8.63 2.5 9.24l4.96 4.73L5.82 21z"
                fill={active ? "#f5b301" : "none"}
                stroke={active ? "#f5b301" : "#D1D5DB"}
                strokeWidth="1.3"
              />
            </svg>
          </button>
        );
      })}
      <span className="ml-1 text-sm text-gray-500">{value}/5</span>
    </div>
  );
}

type SelectedReview = { name: string; text: string; images: string[]; rating: number };

export default function ReviewsPageClient() {
  const { t, i18n } = useTranslation();
  const [all, setAll] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);

  const tr = (k: string, fb?: string) => t(k, { defaultValue: fb });
  const pageSize = 12;
  const [page, setPage] = useState(1);

  const [selected, setSelected] = useState<SelectedReview | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

  const [viewer, setViewer] = useState<{ images: string[]; index: number } | null>(null);

  const [name, setName] = useState("");
  const [rating, setRating] = useState(5);
  const [text, setText] = useState("");
  const [images, setImages] = useState<string[]>([]);
  const [submitBusy, setSubmitBusy] = useState(false);
  const [submitMsg, setSubmitMsg] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    (async () => {
      setLoading(true);
      try {
        const r = await fetch("/api/reviews/active?limit=100", { cache: "no-store" });
        const j: ApiResp = await r.json().catch(() => ({} as ApiResp));
        if (!alive) return;
        setAll(Array.isArray(j?.reviews) ? j.reviews : []);
      } catch {
        if (!alive) return;
        setAll([]);
      } finally {
        if (!alive) return;
        setLoading(false);
        setPage(1);
      }
    })();
    return () => { alive = false; };
  }, []);

  const totalPages = Math.max(1, Math.ceil(all.length / pageSize));
  const safePage = Math.min(Math.max(1, page), totalPages);
  const items = useMemo(
    () => all.slice((safePage - 1) * pageSize, (safePage - 1) * pageSize + pageSize),
    [all, safePage]
  );

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitMsg(null);
    const nameClean = name.trim();
    const textClean = text.trim();
    if (!nameClean || !textClean) { setSubmitMsg(t("reviews.form.errors.required", "Имя и текст обязательны")); return; }
    setSubmitBusy(true);
    try {
      const res = await fetch("/api/reviews/public-create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: nameClean, text: textClean, images: images.slice(0, 5), rating, createdAt: Date.now() }),
      });
      const j = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(j?.error || t("reviews.form.errors.submit", "Не удалось отправить"));
      setSubmitMsg(t("reviews.form.ok", "Спасибо! Мы опубликуем отзыв после модерации."));
      setName(""); setText(""); setImages([]); setRating(5);
      const r = await fetch("/api/reviews/active?limit=100", { cache: "no-store" });
      const jj: ApiResp = await r.json().catch(() => ({} as ApiResp));
      setAll(Array.isArray(jj?.reviews) ? jj.reviews : []);
      setPage(1);
    } catch (err: any) {
      setSubmitMsg(err?.message || t("reviews.form.errors.generic", "Ошибка отправки"));
    } finally {
      setSubmitBusy(false);
    }
  }

  function openModal(r: Review) {
    setSelected({
      name: r.name,
      text: (r.text || "").replace(/^[\s★☆]+/g, ""),
      images: Array.isArray(r.images) ? r.images : [],
      rating: Number.isFinite(r.rating as any) ? (r.rating as number) : 5,
    });
    requestAnimationFrame(() => setModalOpen(true));
    document.body.style.overflow = "hidden";
  }

  function closeModal() {
    setModalOpen(false);
    setTimeout(() => setSelected(null), 160);
    document.body.style.overflow = "";
  }

  const lang = i18n.language || "ru";

  return (
    <div className="grid gap-8 lg:grid-cols-[1fr_400px] xl:grid-cols-[1fr_440px]">
      {/* ===== ЛЕВАЯ: сетка карточек ===== */}
      <section aria-label={t("reviews.list.aria", "Список отзывов")}>
        <div className="teaser-grid" aria-busy={loading}>
          {loading &&
            Array.from({ length: 12 }).map((_, i) => (
              <article key={`sk-${i}`} className="review-card skel-card">
                <div className="animate-pulse">
                  <div className="flex items-center justify-between">
                    <div className="h-4 w-40 rounded bg-gray-200" />
                    <div className="h-4 w-16 rounded bg-gray-100" />
                  </div>
                  <div className="mt-2 flex items-center gap-1">
                    {Array.from({ length: 5 }).map((_, j) => (
                      <div key={j} className="h-3.5 w-3.5 rounded bg-gray-200" />
                    ))}
                  </div>
                  <div className="mt-3 space-y-2">
                    <div className="h-3 w-full rounded bg-gray-200" />
                    <div className="h-3 w-5/6 rounded bg-gray-200" />
                    <div className="h-3 w-3/4 rounded bg-gray-200" />
                  </div>
                  <div className="mt-3 grid grid-cols-3 gap-2 min-h-[84px]">
                    {Array.from({ length: 3 }).map((_, k) => (
                      <div key={k} className="h-[84px] w-full rounded-md bg-gray-200" />
                    ))}
                  </div>
                </div>
              </article>
            ))}

          {!loading && items.length === 0 && (
            <div className="review-card review-card--empty">
              <div className="text">{t("reviews.empty", "Отзывов пока нет — станьте первым!")}</div>
            </div>
          )}

          {!loading &&
            items.map((r) => {
              const cleanText = (r.text || "").replace(/^[\s★☆]+/g, "");
              const dateLabel = formatDateLocalized(
                r.createdAtISO ?? r.created_at ?? r.createdAt ?? r.date,
                lang,
                tr
              );
              const imgs = Array.isArray(r.images) ? r.images : [];
              const teaser = imgs.slice(0, 3);
              const rest = Math.max(0, imgs.length - teaser.length);

              return (
                <article
                  key={r.id}
                  className="review-card review-card--elevated press"
                  role="button"
                  tabIndex={0}
                  onClick={() => openModal(r)}
                  onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && openModal(r)}
                  aria-label={`${t("reviews.openAria", "Открыть отзыв")}: ${r.name}`}
                >
                  <div className="head justify-between">
                    <div className="name">{r.name}</div>
                    {dateLabel ? <div className="date">{dateLabel}</div> : <div className="date">{t("reviews.new", "новое")}</div>}
                  </div>

                  <div className="stars-row">
                    <Stars value={Number.isFinite(r.rating as any) ? (r.rating as number) : 5} />
                  </div>

                  <p className="text">{cleanText}</p>

                  {!!teaser.length && (
                    <div className="photos">
                      {teaser.map((src, i) => (
                        <div key={src + i} className="photo-wrap">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            className="photo-img"
                            src={src}
                            alt=""
                            loading="lazy"
                            decoding="async"
                            onClick={(e) => { e.stopPropagation(); setViewer({ images: imgs, index: i }); }}
                          />
                          {rest > 0 && i === teaser.length - 1 && <div className="photo-more">+{rest}</div>}
                        </div>
                      ))}
                    </div>
                  )}
                </article>
              );
            })}
        </div>

        {/* Пагинация */}
        {totalPages > 1 && !loading && (
          <nav className="mt-6 flex flex-wrap items-center gap-2" aria-label={t("reviews.pagination.aria", "Пагинация отзывов")}>
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              className={`btn btn-surface btn-sm btn-pill press ${page === 1 ? "pointer-events-none opacity-50" : ""}`}
            >
              {t("reviews.pagination.prev", "← Назад")}
            </button>

            <div className="ml-1 flex items-center gap-1">
              {Array.from({ length: totalPages }).map((_, idx) => {
                const p = idx + 1;
                const active = p === page;
                return (
                  <button
                    key={p}
                    onClick={() => setPage(p)}
                    className={`btn btn-sm btn-pill press ${active ? "btn-primary" : "btn-surface"}`}
                    aria-current={active ? "page" : undefined}
                  >
                    {p}
                  </button>
                );
              })}
            </div>

            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              className={`btn btn-surface btn-sm btn-pill press ${page === totalPages ? "pointer-events-none opacity-50" : ""}`}
            >
              {t("reviews.pagination.next", "Вперёд →")}
            </button>
          </nav>
        )}
      </section>

      {/* ===== ПРАВАЯ: форма ===== */}
      <aside className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold">{t("reviews.form.title", "Оставить отзыв")}</h2>

        <form onSubmit={onSubmit} className="mt-5 grid gap-4">
          <div>
            <label className="lbl mb-1">{t("reviews.form.nameLabel", "Имя *")}</label>
            <input
              className="w-full h-12 rounded-lg border border-slate-300 px-3 text-[15px] shadow-sm focus:border-violet-400 focus:ring-2 focus:ring-violet-200 transition"
              placeholder={t("reviews.form.namePh", "Как к вам обращаться")}
              required
              maxLength={120}
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>

          <div className="md:flex md:items-center md:justify-between">
            <span className="lbl mr-2 whitespace-nowrap leading-none">{t("reviews.form.ratingLabel", "Ваша оценка")}</span>
            <StarPicker value={rating} onChange={setRating} />
          </div>

          <div>
            <label className="lbl mb-1">{t("reviews.form.textLabel", "Текст отзыва *")}</label>
            <textarea
              className="w-full min-h-[140px] rounded-lg border border-slate-300 px-3 py-2 text-[15px] shadow-sm focus:border-violet-400 focus:ring-2 focus:ring-violet-200 transition leading-6"
              placeholder={t("reviews.form.textPh", "Что понравилось, как всё прошло…")}
              required
              maxLength={2000}
              value={text}
              onChange={(e) => setText(e.target.value)}
            />
            <div className="mt-1 text-xs text-slate-500">{text.length}/2000</div>
          </div>

          <div>
            <div className="lbl mb-2">{t("reviews.form.photosLabel", "Фото (до 5)")}</div>
            <div className="grid grid-cols-3 gap-3 sm:grid-cols-5">
              {images.map((url, i) => (
                <div key={url} className="relative overflow-hidden rounded-xl border bg-white shadow-sm">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={url}
                    alt=""
                    className="h-28 w-full cursor-zoom-in object-cover"
                    onClick={() => setViewer({ images, index: i })}
                  />
                  <button
                    type="button"
                    className="press absolute right-1 top-1 rounded-full border bg-white/95 px-2 py-1 text-xs text-rose-600 shadow hover:bg-white"
                    onClick={() => setImages((arr) => arr.filter((x) => x !== url))}
                    title={t("reviews.form.remove", "Удалить")}
                  >
                    ✕
                  </button>
                </div>
              ))}
              {images.length < 5 && (
                <label className="press grid h-28 cursor-pointer place-items-center rounded-xl border-2 border-dashed border-slate-300 transition hover:bg-gray-50">
                  <div className="text-center text-xs">
                    <div className="mb-1 text-2xl leading-none">＋</div>
                    <div className="font-medium">{t("reviews.form.add", "Добавить")}</div>
                    <div className="text-gray-400">
                      {t("reviews.form.left", { n: 5 - images.length, defaultValue: "{{n}} ост." })}
                    </div>
                  </div>
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    className="hidden"
                    onChange={(e) => {
                      const fs = Array.from(e.target.files || []).slice(0, 5 - images.length);
                      const urls = fs.map((f) => URL.createObjectURL(f));
                      setImages((arr) => [...arr, ...urls].slice(0, 5));
                      e.currentTarget.value = "";
                    }}
                    disabled={submitBusy}
                  />
                </label>
              )}
            </div>
            <div className="mt-2 text-xs text-slate-500">
              {t("reviews.form.formatHint", "PNG, JPG, WebP, HEIC/HEIF — до 5 изображений.")}
            </div>
          </div>

          <button
            type="submit"
            disabled={submitBusy}
            className={`btn btn-primary btn-lg btn-pill w-full press ${submitBusy ? "opacity-70 cursor-wait" : ""}`}
          >
            {submitBusy ? t("reviews.form.sending", "Отправляем…") : t("reviews.form.submit", "Отправить отзыв")}
          </button>

          {submitMsg && (
            <div className={`text-sm ${/спасибо|thank/i.test(submitMsg) ? "text-emerald-600" : "text-rose-600"}`}>{submitMsg}</div>
          )}
        </form>
      </aside>

      {/* ===== МОДАЛКА ===== */}
      {selected && (
        <div
          className="modal-backdrop"
          role="dialog"
          aria-modal="true"
          data-open={modalOpen ? 1 : 0}
          onClick={(e) => { if (e.target === e.currentTarget) closeModal(); }}
        >
          <div className="modal-sheet modal-sheet--review" data-open={modalOpen ? 1 : 0}>
            <div className="modal-head">
              <div className="modal-title">{t("reviews.modal.title", "Отзыв")}</div>
              <button className="modal-close" onClick={closeModal} aria-label={t("common.close", "Закрыть")}>✕</button>
            </div>

            <div className="modal-body review-modal">
              <div className="review-modal-head">
                <div className="review-modal-name">{selected.name}</div>
                <Stars value={selected.rating} className="ml-2" />
              </div>

              <div className="review-modal-text whitespace-pre-wrap">{selected.text}</div>

              {!!selected.images?.length && (
                <div className="review-modal-grid">
                  {selected.images.map((src, i) => (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      key={src + i}
                      src={src}
                      alt=""
                      className="review-modal-img cursor-zoom-in"
                      onClick={() => setViewer({ images: selected.images, index: i })}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Лайтбокс */}
      {viewer && (
        <Lightbox
          images={viewer.images}
          startIndex={viewer.index}
          onClose={() => setViewer(null)}
        />
      )}
    </div>
  );
}