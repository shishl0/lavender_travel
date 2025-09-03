"use client";

import { useEffect, useState } from "react";
import ImagesUploader from "@/components/reviews/ImagesUploader";

export default function ReviewModal() {
  const [open, setOpen] = useState(false);
  const [show, setShow] = useState(false);

  // form
  const [name, setName] = useState("");
  const [text, setText] = useState("");
  const [images, setImages] = useState<string[]>([]);
  const [rating, setRating] = useState<number>(5);

  const [busy, setBusy] = useState(false);
  const [ok, setOk] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [hp, setHp] = useState("");

  // open/close via events
  useEffect(() => {
    const openH = () => { setOpen(true); requestAnimationFrame(() => setShow(true)); };
    const closeH = () => close();

    window.addEventListener("open-review-modal", openH as any);
    window.addEventListener("close-review-modal", closeH as any);
    return () => {
      window.removeEventListener("open-review-modal", openH as any);
      window.removeEventListener("close-review-modal", closeH as any);
    };
  }, []);

  // esc + lock body scroll
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") close(); };
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.removeEventListener("keydown", onKey); document.body.style.overflow = prev; };
  }, [open]);

  function close() {
    setShow(false);
    setTimeout(() => setOpen(false), 160);
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setOk(null); setErr(null);
    if (hp) return;

    const nameClean = name.trim();
    const textClean = text.trim();
    const imgs = (images || []).slice(0, 5);

    if (!nameClean || !textClean) { setErr("Имя и текст обязательны"); return; }

    setBusy(true);
    try {
      const res = await fetch("/api/reviews/public-create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: nameClean,
          text: textClean,
          images: imgs,
          rating,
          createdAt: Date.now(),          // ← добавили дату в тело
        }),
      });
      const j = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(j?.error || "Не удалось отправить");

      setOk("Спасибо! Мы опубликуем отзыв после модерации.");
      setTimeout(() => close(), 800);            // мягко закрыть
      setTimeout(() => {                         // сбросить форму
        setName(""); setText(""); setImages([]); setRating(5);
      }, 900);
    } catch (e) {
      setErr((e as Error).message || "Ошибка отправки");
    } finally {
      setBusy(false);
    }
  }

  if (!open) return null;

  return (
    <div
      className="modal-backdrop modal-backdrop--soft"
      role="dialog"
      aria-modal="true"
      data-open={show ? 1 : 0}
      onClick={close}
    >
      <div
        className="modal-sheet modal-sheet--pretty"
        data-open={show ? 1 : 0}
        onClick={(e) => e.stopPropagation()}
      >
        {/* единый заголовок */}
        <div className="modal-head">
          <div className="modal-title">Оставить отзыв</div>
          <button className="modal-close" onClick={close} aria-label="Закрыть">✕</button>
        </div>

        <div className="modal-body">
          <form onSubmit={submit} className="review-form review-form--plain grid gap-4" aria-label="Форма отзыва">
            {/* honeypot */}
            <input className="hidden" tabIndex={-1} autoComplete="off" value={hp} onChange={(e) => setHp(e.target.value)} aria-hidden="true" />

            <p className="review-form-subtitle">
              Поделитесь впечатлениями — это поможет другим путешественникам.
            </p>

            {(ok || err) && (
              <div className={`alert ${ok ? "alert--ok" : "alert--err"}`} role="status" aria-live="polite">
                {ok || err}
              </div>
            )}

            <div className="grid gap-3 md:grid-cols-2">
              <div>
                <label className="lbl">Имя *</label>
                <input
                  className="inp"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  maxLength={120}
                  placeholder="Как к вам обращаться"
                  required
                />
              </div>

              {/* Ровная линия «лейбл + звёзды» */}
              <div className="md:flex md:items-end md:justify-end">
                <span className="lbl mr-2 whitespace-nowrap leading-none">Ваша оценка</span>
                <StarPicker className="mt-0" value={rating} onChange={setRating} />
              </div>
            </div>

            <div>
              <label className="lbl">Текст отзыва *</label>
              <textarea
                className="inp h-32"
                value={text}
                onChange={(e) => setText(e.target.value)}
                maxLength={2000}
                placeholder="Что понравилось, как всё прошло…"
                required
              />
              <div className="mt-1 hint">{text.length}/2000</div>
            </div>

            <div className="uploader">
              <div className="lbl mb-2">Фото (до 5)</div>
              <ImagesUploader images={images} onChange={setImages} max={5} disabled={busy} />
              <div className="mt-2 hint">PNG, JPG, WebP, HEIC/HEIF — мы сами конвертируем, если нужно. Макс. 5 МБ/файл.</div>
            </div>

            <div className="mt-2">
              <button
                type="submit"
                className={`btn btn-primary btn-lg btn-pill w-full press ${busy ? "is-loading" : ""}`}
                disabled={busy}
              >
                Отправить отзыв
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

/* ——— Звёзды — с кастомным className для выравнивания ——— */
function StarPicker({
  value,
  onChange,
  className = "",
}: {
  value: number;
  onChange: (v: number) => void;
  className?: string;
}) {
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
            className="w-8 h-8 grid place-items-center rounded-md hover:bg-gray-50 press"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" aria-hidden="true">
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
      <span className="ml-1 text-xs text-gray-500">{value}/5</span>
    </div>
  );
}