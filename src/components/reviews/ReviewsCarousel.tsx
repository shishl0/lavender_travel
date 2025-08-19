"use client";

import { useEffect, useMemo, useRef, useState } from "react";

/* ================= Types ================= */
type Review = {
  id: string;
  name: string;
  text: string;
  images: string[];
  rating?: number | null; // 1..5 (если нет — показываем 5)
};

/* ================= Root ================= */
export default function ReviewsCarousel() {
  const [items, setItems] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [perPage, setPerPage] = useState(2);
  const [active, setActive] = useState<Review | null>(null);
  const [fading, setFading] = useState(false);
  const fadeTimer = useRef<number | null>(null);

  useEffect(() => {
    const onResize = () => setPerPage(window.innerWidth < 768 ? 1 : 2);
    onResize();
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  // грузим: сначала visible (активные + свежие), если нет — fallback на active
  useEffect(() => {
    let stop = false;
    const load = async () => {
      setLoading(true);
      try {
        const r1 = await fetch("/api/reviews/visible?limit=50", { cache: "no-store" });
        if (r1.ok) {
          const j = await r1.json();
          if (!stop) setItems(Array.isArray(j?.reviews) ? j.reviews : []);
        } else {
          const r2 = await fetch("/api/reviews/active?limit=50", { cache: "no-store" });
          const j = await r2.json();
          if (!stop) setItems(Array.isArray(j?.reviews) ? j.reviews : []);
        }
      } catch {
        if (!stop) setItems([]);
      } finally {
        if (!stop) setLoading(false);
      }
    };
    load();
    return () => {
      stop = true;
    };
  }, []);

  const pages = useMemo(
    () => Math.max(1, Math.ceil(items.length / perPage)),
    [items.length, perPage],
  );

  useEffect(() => {
    if (page > pages - 1) setPage(Math.max(0, pages - 1));
  }, [pages, page]);

  const slice = useMemo(() => {
    const from = page * perPage;
    return items.slice(from, from + perPage);
  }, [items, page, perPage]);

  // плавная смена страниц (fade-out -> смена -> fade-in)
  const goPage = (to: number) => {
    if (to === page) return;
    if (fadeTimer.current) window.clearTimeout(fadeTimer.current);
    setFading(true);
    fadeTimer.current = window.setTimeout(() => {
      setPage(Math.max(0, Math.min(pages - 1, to)));
      setFading(false);
    }, 150);
  };
  const prev = () => goPage(page - 1);
  const next = () => goPage(page + 1);

  // рендер скелетонов во время загрузки
  if (loading) {
    return (
      <div id="reviews" className="mt-8" aria-busy="true" aria-live="polite">
        <div className="flex items-center justify-between mb-2">
          <div className="kicker">Отзывы</div>
        </div>

        <div className={`grid gap-3 ${perPage === 1 ? "grid-cols-1" : "grid-cols-2"}`}>
          {Array.from({ length: perPage }).map((_, i) => (
            <SkeletonReviewCard key={i} />
          ))}
        </div>
      </div>
    );
  }

  // если пусто — ничего не показываем (как и раньше)
  if (!loading && items.length === 0) return null;

  return (
    <div id="reviews" className="mt-8">
      <div className="flex items-center justify-between mb-2">
        <div className="kicker">Отзывы</div>
        {pages > 1 && (
          <div className="flex items-center gap-2">
            <NavButton onClick={prev} disabled={page === 0} ariaLabel="Назад">◀</NavButton>
            <NavButton onClick={next} disabled={page >= pages - 1} ariaLabel="Вперёд">▶</NavButton>
          </div>
        )}
      </div>

      <div
        key={page}
        className={`grid gap-3 ${perPage === 1 ? "grid-cols-1" : "grid-cols-2"} transition-opacity duration-300 ${fading ? "opacity-0" : "opacity-100"}`}
      >
        {slice.map((r) => (
          <ReviewCard key={r.id} review={r} onOpen={() => setActive(r)} />
        ))}
      </div>

      <div className="mt-2 text-xs text-gray-500">Стр. {page + 1} / {pages}</div>

      {active && <ReviewModal review={active} onClose={() => setActive(null)} />}
    </div>
  );
}

/* ================= Atoms ================= */
function NavButton({
  onClick, disabled, ariaLabel, children,
}: { onClick: () => void; disabled?: boolean; ariaLabel: string; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      aria-label={ariaLabel}
      className="w-8 h-8 border rounded-lg press disabled:opacity-40 grid place-items-center"
    >
      {children}
    </button>
  );
}

function Stars({ value = 5, className = "" }: { value?: number | null; className?: string }) {
  const v = Math.max(0, Math.min(5, Math.round((value ?? 5))));
  return (
    <div className={`inline-flex items-center gap-0.5 ${className}`} aria-label={`Оценка: ${v} из 5`}>
      {Array.from({ length: 5 }).map((_, i) => (
        <svg key={i} width="14" height="14" viewBox="0 0 24 24" aria-hidden="true">
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

/* ============= Skeleton card ============= */
function SkeletonReviewCard() {
  return (
    <article className="card p-4 min-h-[200px]">
      <div className="flex items-center justify-between gap-3">
        <div className="h-4 w-40 rounded bg-gray-200 animate-pulse" />
        <div className="flex items-center gap-1">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="w-3.5 h-3.5 rounded-sm bg-gray-200 animate-pulse" />
          ))}
        </div>
      </div>

      <div className="mt-3 space-y-2">
        <div className="h-3 w-full rounded bg-gray-200 animate-pulse" />
        <div className="h-3 w-5/6 rounded bg-gray-200 animate-pulse" />
        <div className="h-3 w-3/4 rounded bg-gray-200 animate-pulse" />
        <div className="h-3 w-2/3 rounded bg-gray-200 animate-pulse" />
      </div>

      <div className="mt-4 grid grid-cols-5 gap-2">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="h-14 w-full rounded-md bg-gray-200 animate-pulse" />
        ))}
      </div>
    </article>
  );
}

/* ============= Review card ============= */
function ReviewCard({ review, onOpen }: { review: Review; onOpen: () => void }) {
  const imgs = (review.images || []).slice(0, 5);
  const textRef = useRef<HTMLParagraphElement | null>(null);
  const [overflow, setOverflow] = useState(false);

  // проверяем «не влезает ли» текст
  useEffect(() => {
    const check = () => {
      const el = textRef.current;
      if (!el) return setOverflow(false);
      setOverflow(el.scrollHeight - el.clientHeight > 2);
    };
    check();
    const id = setTimeout(check, 0);
    window.addEventListener("resize", check);
    return () => {
      clearTimeout(id);
      window.removeEventListener("resize", check);
    };
  }, [review.text]);

  const needsMore = overflow || imgs.length > 1;

  const onKeyDown: React.KeyboardEventHandler<HTMLElement> = (e) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      onOpen();
    }
  };

  return (
    <article
      role="button"
      tabIndex={0}
      onKeyDown={onKeyDown}
      onClick={onOpen}
      className="card p-4 flex flex-col min-h-[200px] cursor-pointer transition hover:shadow-sm focus:outline-none focus:ring-2 focus:ring-[var(--navy)]/30"
      aria-label={`Отзыв: ${review.name}`}
    >
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-3">
          <div className="font-medium text-[var(--navy)] truncate">{review.name}</div>
          <Stars value={review.rating ?? 5} />
        </div>

        {/* окно текста фиксированной высоты + fade */}
        <div className="relative mt-1">
          <p
            ref={textRef}
            className="text-sm text-gray-700 whitespace-pre-wrap overflow-hidden pr-1"
            style={{ maxHeight: "5.75rem" }}
          >
            {review.text}
          </p>
          {overflow && (
            <div aria-hidden className="pointer-events-none absolute inset-x-0 bottom-0 h-8 bg-gradient-to-t from-white to-transparent" />
          )}
        </div>

        {needsMore && (
          <span className="mt-1 inline-block text-xs text-[var(--navy)] underline decoration-dotted">
            Показать ещё
          </span>
        )}
      </div>

      {imgs.length > 0 && (
        <div className="mt-3">
          <div className="grid grid-cols-5 gap-2">
            {imgs.map((u, i) => (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                key={u + i}
                src={u}
                alt=""
                className="w-full h-14 object-cover rounded-md border"
                loading="lazy"
              />
            ))}
          </div>
        </div>
      )}
    </article>
  );
}

/* ============= Modal + gallery ============= */
function ReviewModal({ review, onClose }: { review: Review; onClose: () => void }) {
  const imgs = (review.images || []).filter(Boolean);
  const [idx, setIdx] = useState(0);
  const [viewer, setViewer] = useState(false);
  const [show, setShow] = useState(false); // для анимации in/out

  useEffect(() => {
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") requestClose();
      if (e.key === "ArrowRight") setIdx((i) => Math.min(i + 1, Math.max(0, imgs.length - 1)));
      if (e.key === "ArrowLeft") setIdx((i) => Math.max(0, i - 1));
    };
    document.addEventListener("keydown", onKey);
    requestAnimationFrame(() => setShow(true)); // анимация «входа»
    return () => {
      document.body.style.overflow = prevOverflow;
      document.removeEventListener("keydown", onKey);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const requestClose = () => {
    setShow(false);
    setTimeout(onClose, 180); // даём доиграть анимацию
  };

  return (
    <div className="fixed inset-0 z-50">
      {/* overlay */}
      <div
        className={`absolute inset-0 bg-black/50 transition-opacity duration-200 ${show ? "opacity-100" : "opacity-0"}`}
        onClick={requestClose}
      />

      {/* panel */}
      <div
        className={`relative mx-auto my-6 w-[min(100%,42rem)] max-h-[85vh] rounded-2xl bg-white shadow-xl overflow-hidden transition duration-200 ease-out
        ${show ? "opacity-100 scale-100 translate-y-0" : "opacity-0 scale-95 translate-y-1"}`}
      >
        {/* close */}
        <button
          onClick={requestClose}
          aria-label="Закрыть"
          className="absolute right-3 top-3 w-9 h-9 z-10 grid place-items-center rounded-full border bg-white/95 hover:bg-white press"
        >
          ✕
        </button>

        <div className="p-5 overflow-y-auto max-h-[85vh]">
          <div className="flex items-center justify-between gap-3 pr-12">
            <div className="text-lg font-semibold text-[var(--navy)]">{review.name}</div>
            <Stars value={review.rating ?? 5} />
          </div>
          <p className="mt-2 text-[15px] text-gray-800 whitespace-pre-wrap">{review.text}</p>

          {imgs.length > 0 && (
            <div className="mt-4">
              <div className="relative h-72 rounded-xl overflow-hidden border bg-black/5">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  key={imgs[idx]}
                  src={imgs[idx]}
                  alt=""
                  className="w-full h-full object-contain cursor-zoom-in transition-opacity duration-200"
                  onClick={() => setViewer(true)}
                  loading="lazy"
                />
                {imgs.length > 1 && (
                  <>
                    <button
                      type="button"
                      onClick={() => setIdx((i) => Math.max(0, i - 1))}
                      disabled={idx === 0}
                      className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-white/90 hover:bg-white border grid place-items-center press disabled:opacity-50"
                      aria-label="Предыдущее фото"
                    >
                      ‹
                    </button>
                    <button
                      type="button"
                      onClick={() => setIdx((i) => Math.min(imgs.length - 1, i + 1))}
                      disabled={idx >= imgs.length - 1}
                      className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-white/90 hover:bg-white border grid place-items-center press disabled:opacity-50"
                      aria-label="Следующее фото"
                    >
                      ›
                    </button>
                  </>
                )}
              </div>

              {imgs.length > 1 && (
                <div className="mt-2 flex items-center gap-2 overflow-x-auto pb-1">
                  {imgs.map((u, i) => (
                    <button
                      key={u + i}
                      onClick={() => setIdx(i)}
                      className={`w-14 h-14 rounded-md overflow-hidden border ${i === idx ? "ring-2 ring-[var(--navy)]" : ""}`}
                      aria-label={`Фото ${i + 1}`}
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={u} alt="" className="w-full h-full object-cover" loading="lazy" />
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {viewer && (
        <PhotoViewer
          images={imgs}
          index={idx}
          onClose={() => setViewer(false)}
          onIndex={(i) => setIdx(i)}
        />
      )}
    </div>
  );
}

/* ============= Full-screen viewer ============= */
function PhotoViewer({
  images, index, onClose, onIndex,
}: {
  images: string[];
  index: number;
  onClose: () => void;
  onIndex: (i: number) => void;
}) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowRight") onIndex(Math.min(images.length - 1, index + 1));
      if (e.key === "ArrowLeft") onIndex(Math.max(0, index - 1));
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [images.length, index, onClose, onIndex]);

  return (
    <div className="fixed inset-0 z-[70]">
      <div className="absolute inset-0 bg-black/90" onClick={onClose} />
      <button
        onClick={onClose}
        aria-label="Закрыть"
        className="absolute right-4 top-4 w-10 h-10 z-[75] grid place-items-center rounded-full bg-white/90 hover:bg-white press"
      >
        ✕
      </button>

      <div className="absolute inset-0 flex items-center justify-center p-6 z-[72]">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={images[index]}
          alt=""
          className="max-w-full max-h-full object-contain select-none transition-opacity duration-200"
        />
        {images.length > 1 && (
          <>
            <button
              onClick={() => onIndex(Math.max(0, index - 1))}
              disabled={index === 0}
              className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/90 hover:bg-white grid place-items-center press disabled:opacity-50 z-[75]"
              aria-label="Назад"
            >
              ‹
            </button>
            <button
              onClick={() => onIndex(Math.min(images.length - 1, index + 1))}
              disabled={index >= images.length - 1}
              className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/90 hover:bg-white grid place-items-center press disabled:opacity-50 z-[75]"
              aria-label="Вперёд"
            >
              ›
            </button>
          </>
        )}
      </div>
    </div>
  );
}