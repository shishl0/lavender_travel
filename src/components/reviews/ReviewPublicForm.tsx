"use client";

import { useState } from "react";
import ImagesUploader from "./ImagesUploader";

export default function ReviewPublicForm() {
  const [name, setName] = useState("");
  const [text, setText] = useState("");
  const [images, setImages] = useState<string[]>([]);
  const [rating, setRating] = useState<number>(5);

  const [busy, setBusy] = useState(false);
  const [ok, setOk] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  const [hp, setHp] = useState("");

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setOk(null); setErr(null);
    if (hp) return;

    const nameClean = name.trim();
    const textClean = text.trim();
    const imgs = (images || []).slice(0, 5);

    if (!nameClean || !textClean) {
      setErr("Имя и текст обязательны");
      return;
    }

    setBusy(true);
    try {
      const res = await fetch("/api/reviews/public-create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: nameClean, text: textClean, images: imgs, rating }),
      });
      const j = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(j?.error || "failed");
      setOk("Спасибо! Отзыв опубликован 👍");
      setName(""); setText(""); setImages([]); setRating(5);
    } catch (e) {
      setErr((e as Error).message || "Ошибка отправки");
    } finally {
      setBusy(false);
    }
  }

  return (
    <section id="reviews" className="section scroll-mt-24" aria-label="Форма отзыва">
      <div className="container">
        <div className="card p-5">
          <div className="kicker">Отзывы</div>
          <h3 className="mt-2 text-2xl font-semibold" style={{ color: "var(--navy)" }}>
            Оставить отзыв
          </h3>
          <p className="text-sm text-gray-600 mt-1">
            Поделитесь впечатлениями.
          </p>

          {/* алерты */}
          {(ok || err) && (
            <div
              className={`mt-3 rounded-xl border px-3 py-2 text-sm ${
                ok ? "bg-emerald-50 border-emerald-200 text-emerald-800" : "bg-rose-50 border-rose-200 text-rose-800"
              }`}
              role="status"
              aria-live="polite"
            >
              {ok || err}
            </div>
          )}

          <form onSubmit={submit} className="mt-4 grid gap-4">
            {/* honeypot */}
            <input className="hidden" tabIndex={-1} autoComplete="off" value={hp} onChange={(e) => setHp(e.target.value)} aria-hidden="true" />

            <div className="grid gap-3 md:grid-cols-2">
              <div>
                <label className="text-sm text-gray-700">Имя *</label>
                <input
                  className="mt-1 w-full border rounded-xl px-3 py-2 focus:ring-2 focus:ring-[var(--navy)]/20 outline-none"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  maxLength={120}
                  placeholder="Как к вам обращаться"
                  required
                />
              </div>

              <div>
                <label className="text-sm text-gray-700">Ваша оценка</label>
                <FancyStarPicker value={rating} onChange={setRating} />
              </div>
            </div>

            <div>
              <label className="text-sm text-gray-700">Текст отзыва *</label>
              <textarea
                className="mt-1 w-full border rounded-xl px-3 py-2 h-32 focus:ring-2 focus:ring-[var(--navy)]/20 outline-none"
                value={text}
                onChange={(e) => setText(e.target.value)}
                maxLength={2000}
                placeholder="Что понравилось, как всё прошло…"
                required
              />
              <div className="mt-1 text-xs text-gray-400">{text.length}/2000</div>
            </div>

            <div className="bg-gray-50 border rounded-xl p-3">
              <div className="text-sm text-gray-700 mb-2">Фото (до 5)</div>
              <ImagesUploader images={images} onChange={setImages} max={5} disabled={busy} />
              <div className="mt-2 text-xs text-gray-500">
                Поддерживаются PNG, JPG, WebP, HEIC/HEIF — мы сами конвертируем, если нужно.
              </div>
            </div>

            <div className="mt-1 flex items-center gap-3">
              <button type="submit" className="btn-primary press" disabled={busy}>
                {busy ? "Отправляем…" : "Отправить отзыв"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </section>
  );
}

/* ——— Красивый StarPicker с hover ——— */
function FancyStarPicker({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  const [hover, setHover] = useState<number | null>(null);
  const show = hover ?? value;
  return (
    <div className="mt-1 inline-flex items-center gap-1">
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